#!/usr/bin/env python3
"""Cross-platform Chrome native messaging host for the Tor Connection extension."""
from __future__ import annotations

import bisect
import json
import ipaddress
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import threading
import tempfile
import time
import weakref
from pathlib import Path

HOST_NAME = "org.torconnect.torchrome"
FIREFOX_ADDON_ID = "{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"
HELPER_VERSION = "1.16.2"
PROXY_PORT = 9050
MAX_MESSAGE = 1_048_576
MANUAL_BRIDGE_CONNECT_TIMEOUT = 5 * 60
INITIAL_BRIDGE_NO_PROGRESS_TIMEOUT = 90
BRIDGE_RECOVERY_NO_PROGRESS_TIMEOUT = 60
MANUAL_BRIDGE_TIMEOUT_MESSAGE = "Could not connect through this bridge within 5 minutes."
if os.name == "nt":
    BASE = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData/Local")) / "TorChrome"
else:
    BASE = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")) / "TorChrome"
RUNTIME = BASE / "runtime"
BUNDLE = Path(os.environ.get("TORCHROME_BUNDLE", RUNTIME / "bundle")).expanduser()
DATA = BASE / "data"


KNOWN_TRANSPORTS = {"obfs4", "webtunnel", "snowflake", "meek_lite"}

def bridge_endpoint(line: str) -> str | None:
    fields = line.split()
    offset = 1 if fields and fields[0] == "Bridge" else 0
    if not fields or len(fields) <= offset: return None
    first = fields[offset]
    # Vanilla bridge: first token is address, not a transport name
    if first.lower() not in KNOWN_TRANSPORTS:
        return first
    return fields[offset + 1] if len(fields) > offset + 1 else None


def endpoint_host_port(endpoint: str) -> tuple[str, int] | None:
    if endpoint.startswith("[") and "]" in endpoint:
        host, _, port_text = endpoint[1:].partition("]")
        port_text = port_text.removeprefix(":")
    else:
        host, sep, port_text = endpoint.rpartition(":")
        if not sep:
            return None
    try:
        port = int(port_text)
    except ValueError:
        return None
    return (host, port) if host and 0 < port <= 65535 else None


def tor_config_path(path: Path) -> str:
    """Quote a filesystem path so Tor parses it consistently on Windows and Unix."""
    normalized = str(path).replace("\\", "/").replace('"', '\\"')
    return f'"{normalized}"'


def parse_bridges(raw: str) -> list[str] | None:
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    if not lines or len(lines) > 20:
        return None
    allowed = re.compile(r"^[a-zA-Z0-9 .:/?=&,+%_\-\[\]]+$")
    address_re = re.compile(r"^(\[[\da-fA-F:]+\]|[\d.]+):(\d{1,5})$")
    parsed_lines = []
    for line in lines:
        has_bridge_prefix = line.startswith("Bridge ")
        normalized = line[7:].strip() if has_bridge_prefix else line
        if not allowed.fullmatch(normalized) or "#" in normalized or '"' in normalized:
            return None
        fields = normalized.split()
        first = fields[0]
        if first.lower() in KNOWN_TRANSPORTS:
            if len(fields) < 2:
                return None
            normalized = normalized.replace(first, first.lower(), 1)
        else:
            m = address_re.match(first)
            if not m or int(m.group(2)) < 1 or int(m.group(2)) > 65535:
                return None
        parsed_lines.append(("Bridge " if has_bridge_prefix else "") + normalized)
    return parsed_lines


class Helper:
    def __init__(self) -> None:
        self.lock = threading.RLock()
        self.process: subprocess.Popen[str] | None = None
        self.state = "disconnected"
        self.message = ""
        self.last_error: str | None = None
        self.diagnostics: list[str] = []
        self.targets: list[dict] = []
        self.current_index: int | None = None
        self.bridge_activity: str | None = None
        self.built_circuits: dict[str, int] = {}
        self.exit_relay_candidates: set[str] = set()
        self.exit_relay_lookups_in_progress: set[str] = set()
        self.control_monitor_state = "stopped"
        self.control_monitor_error: str | None = None
        self.control_snapshot_count = 0
        self.exit_nodes_applied = False
        self.reconnect_since: float | None = None
        self.auto_recovery_bridges: list[str] = []
        self.auto_recovery_indices: list[int] = []
        self.auto_recovery_tried: set[int] = set()
        self.auto_recovery_in_progress = False
        self.recovery_attempt_since: float | None = None
        self.recovery_stable_since: float | None = None
        self.connected_at: int | None = None
        self.bootstrap_progress = -1
        self.transport_launch_dir: Path | None = None
        self.stopping = False
        self.exit_country: str = ""
        self.exit_relay_ip: str = ""
        self.exit_relay_country: str = ""
        self.exit_relay_circuit_id: str = ""
        self.selected_exit_circuit_id: str = ""
        self.control_reply_buffers: weakref.WeakKeyDictionary[socket.socket, bytearray] = weakref.WeakKeyDictionary()
        self.geo4: list[tuple[int, int, str]] | None = None
        self.geo6: list[tuple[int, int, str]] | None = None

    def handle(self, request: dict) -> dict:
        request_id = request.get("id")
        command = request.get("command")
        if not isinstance(request_id, int) or not isinstance(command, str):
            return {"ok": False, "error": "Invalid request."}
        if command == "status": result = self.status()
        elif command == "ping": result = self.ping(request.get("bridges", ""))
        elif command == "countries": result = self.countries(request.get("bridges", ""))
        elif command == "start":
            result = self.start(
                request.get("mode", ""), request.get("bridges", ""), request.get("selectedBridgeIndex"),
                exit_country=request.get("exitCountry", ""), bridge_indices=request.get("bridgeIndices"),
                recovery_bridges=request.get("recoveryBridges"), recovery_indices=request.get("recoveryIndices")
            )
        elif command == "stop": self.stop(); result = self.status()
        else: result = {"ok": False, "error": "Unsupported command."}
        result["id"] = request_id
        return result

    def executable(self, name: str) -> Path | None:
        configured = os.environ.get("TORCHROME_TOR_PATH" if name == "tor" else "TORCHROME_TRANSPORT_PATH")
        if configured:
            candidate = Path(configured).expanduser().resolve()
            if candidate.is_file() and (os.name == "nt" or os.access(candidate, os.X_OK)):
                return candidate
        path_file = RUNTIME / ("tor-path" if name == "tor" else "transport-path")
        try:
            relative = path_file.read_text(encoding="utf-8").strip()
            candidate = (BUNDLE / relative).resolve()
            candidate.relative_to(BUNDLE.resolve())
            if candidate.is_file() and (os.name == "nt" or os.access(candidate, os.X_OK)):
                return candidate
        except (OSError, ValueError):
            pass
        extensions = {".exe", ".bat", ".cmd"} if os.name == "nt" else {""}
        for candidate in BUNDLE.rglob("*") if BUNDLE.exists() else ():
            if candidate.is_file() and candidate.name.lower() in {name + suffix for suffix in extensions}:
                if os.name == "nt" or os.access(candidate, os.X_OK):
                    return candidate
        return None

    def status(self) -> dict:
        with self.lock:
            process = self.process
            if process and process.poll() is None:
                return self.status_payload(True)
            if process and self.state == "starting":
                return self.status_payload(True)
            if self.state == "failed":
                return self.status_payload(False)
            self.state = "disconnected"
        if not self.executable("tor"):
            return {"ok": True, "state": "missing_runtime", "message": "Install the Tor runtime first.", "helperVersion": HELPER_VERSION}
        return {"ok": True, "state": "disconnected", "message": "Ready to connect.", "helperVersion": HELPER_VERSION}

    def status_payload(self, ok: bool) -> dict:
        payload = {"ok": ok, "state": self.state, "message": self.message,
                   "diagnostics": list(self.diagnostics), "bridgeCount": len(self.targets),
                   "helperVersion": HELPER_VERSION,
                   "controlMonitorState": self.control_monitor_state,
                   "controlSnapshotCount": self.control_snapshot_count}
        if self.control_monitor_error:
            payload["controlMonitorError"] = self.control_monitor_error
        if self.last_error: payload["error"] = self.last_error
        if self.state == "connected" and self.connected_at is not None:
            payload["connectedAt"] = self.connected_at
        if self.current_index is not None:
            payload["currentBridgeIndex"] = self.current_index
            target = next((item for item in self.targets if item["index"] == self.current_index), None)
            if target:
                payload.update(bridgeTransport=target["transport"], bridgeAddress=target["address"])
                if target.get("fingerprint"): payload["bridgeFingerprint"] = target["fingerprint"]
                if self.state == "connected":
                    code = self.country_code(target["address"])
                    if code: payload["bridgeCountryCode"] = code
        if self.bridge_activity: payload["bridgeActivity"] = self.bridge_activity
        payload["builtCircuitCount"] = len(self.built_circuits)
        payload["exitRelayDebug"] = {
            "ip": self.exit_relay_ip,
            "country": self.exit_relay_country,
            "circuits": list(self.built_circuits.keys())[:3]
        }
        if (self.state == "connected" and self.exit_relay_ip
                and self.selected_exit_circuit_id
                and self.exit_relay_circuit_id == self.selected_exit_circuit_id):
            payload["exitRelayIp"] = self.exit_relay_ip
            if self.exit_relay_country: payload["exitRelayCountryCode"] = self.exit_relay_country
        if self.process and self.process.poll() is None:
            payload.update(self.live_statistics())
        return payload

    @staticmethod
    def windows_process_memory_bytes(pid: int) -> int | None:
        import ctypes
        from ctypes import wintypes

        class ProcessMemoryCountersEx(ctypes.Structure):
            _fields_ = [
                ("cb", wintypes.DWORD),
                ("PageFaultCount", wintypes.DWORD),
                ("PeakWorkingSetSize", ctypes.c_size_t),
                ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                ("PagefileUsage", ctypes.c_size_t),
                ("PeakPagefileUsage", ctypes.c_size_t),
                ("PrivateUsage", ctypes.c_size_t),
            ]

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        open_process = kernel32.OpenProcess
        open_process.argtypes = (wintypes.DWORD, wintypes.BOOL, wintypes.DWORD)
        open_process.restype = wintypes.HANDLE
        close_handle = kernel32.CloseHandle
        close_handle.argtypes = (wintypes.HANDLE,)
        close_handle.restype = wintypes.BOOL
        get_process_memory_info = psapi.GetProcessMemoryInfo
        get_process_memory_info.argtypes = (
            wintypes.HANDLE, ctypes.POINTER(ProcessMemoryCountersEx), wintypes.DWORD
        )
        get_process_memory_info.restype = wintypes.BOOL

        # PROCESS_QUERY_LIMITED_INFORMATION is sufficient for GetProcessMemoryInfo.
        handle = open_process(0x1000, False, pid)
        if not handle:
            return None
        try:
            counters = ProcessMemoryCountersEx()
            counters.cb = ctypes.sizeof(counters)
            if get_process_memory_info(handle, ctypes.byref(counters), counters.cb):
                return int(counters.WorkingSetSize)
            return None
        finally:
            close_handle(handle)

    def live_statistics(self) -> dict:
        """Read Tor's cumulative network counters and the daemon's current RSS."""
        stats: dict[str, int] = {}
        port_file, cookie_file = DATA / "control-port", DATA / "control_auth_cookie"
        try:
            port = int(port_file.read_text().strip().rsplit(":", 1)[-1])
            cookie = cookie_file.read_bytes()
            if len(cookie) == 32:
                with socket.create_connection(("127.0.0.1", port), timeout=.35) as conn:
                    conn.settimeout(.35)
                    conn.sendall(f"AUTHENTICATE {cookie.hex()}\r\n".encode())
                    if "250 OK" in self.read_control_reply(conn):
                        conn.sendall(b"GETINFO traffic/read traffic/written\r\n")
                        reply = self.read_control_reply(conn)
                        for key, field in (("traffic/read", "downloadBytes"), ("traffic/written", "uploadBytes")):
                            match = re.search(rf"250-{re.escape(key)}=(\d+)", reply)
                            if match:
                                stats[field] = int(match.group(1))
        except (OSError, ValueError):
            pass
        if os.name == "nt":
            try:
                memory_bytes = self.windows_process_memory_bytes(self.process.pid)
                if memory_bytes is not None:
                    stats["memoryBytes"] = memory_bytes
            except (OSError, AttributeError):
                pass
        else:
            try:
                raw = subprocess.check_output(["ps", "-o", "rss=", "-p", str(self.process.pid)], text=True, timeout=.4).strip()
                if raw.isdigit():
                    stats["memoryBytes"] = int(raw) * 1024
            except (OSError, subprocess.SubprocessError):
                pass
        return stats

    def start(self, mode: str, raw_bridges: str, selected_index,
              recovery_bridges: list[str] | None = None,
              recovery_tried: set[int] | None = None,
              exit_country: str = "",
              bridge_indices: list[int] | None = None,
              recovery_indices: list[int] | None = None) -> dict:
        with self.lock:
            if self.process and self.process.poll() is None:
                return self.status_payload(True)
        if mode not in {"snowflake", "manual"}:
            return {"ok": False, "error": "Choose Snowflake or manual bridge lines."}
        if recovery_bridges is not None and mode != "manual":
            return {"ok": False, "error": "Recovery bridges require manual bridge mode."}
        tor = self.executable("tor")
        transport = self.executable("lyrebird")
        if not tor or not transport:
            return {"ok": True, "state": "missing_runtime", "message": "Tor and lyrebird executables are required in the runtime folder."}
        offset = 0
        if mode == "snowflake":
            auto_bridges = []
            bridge_lines = ["Bridge snowflake 192.0.2.3:80 2B280B23E1107BB62ABFC40DDCC8824814F80A72 fingerprint=2B280B23E1107BB62ABFC40DDCC8824814F80A72 url=https://1098762253.rsc.cdn77.org front=www.phpmyadmin.net,cdn.zk.mk ice=stun:stun.antisip.com:3478,stun:stun.epygi.com:3478,stun:stun.uls.co.za:3478,stun:stun.voipgate.com:3478,stun:stun.mixvoip.com:3478 utls-imitate=hellorandomizedalpn"]
        else:
            parsed = parse_bridges(raw_bridges)
            if not parsed: return {"ok": False, "error": "Enter one or more valid obfs4, WebTunnel, or Snowflake bridge lines."}
            auto_bridges = [line[7:].strip() if line.startswith("Bridge ") else line for line in parsed]
            if selected_index is not None:
                if not isinstance(selected_index, int) or selected_index <= 0 or len(parsed) != 1:
                    return {"ok": False, "error": "Choose one valid bridge from Settings."}
                offset = selected_index - 1
            if bridge_indices is not None and not (
                isinstance(bridge_indices, list)
                and len(bridge_indices) == len(parsed)
                and all(type(index) is int and 1 <= index <= 20 for index in bridge_indices)
                and len(set(bridge_indices)) == len(bridge_indices)
            ):
                bridge_indices = None
            if recovery_bridges is not None:
                if (not isinstance(recovery_bridges, list) or not 1 <= len(recovery_bridges) <= 20
                        or not all(isinstance(line, str) for line in recovery_bridges)):
                    return {"ok": False, "error": "Choose one or more valid recovery bridges."}
                parsed_recovery_bridges = parse_bridges("\n".join(recovery_bridges))
                if not parsed_recovery_bridges or len(parsed_recovery_bridges) != len(recovery_bridges):
                    return {"ok": False, "error": "Choose one or more valid recovery bridges."}
                recovery_bridges = parsed_recovery_bridges
            if recovery_bridges is not None and recovery_indices is not None and not (
                isinstance(recovery_indices, list)
                and len(recovery_indices) == len(recovery_bridges)
                and all(type(index) is int and 1 <= index <= 20 for index in recovery_indices)
                and len(set(recovery_indices)) == len(recovery_indices)
            ):
                recovery_indices = None
            bridge_lines = ["Bridge " + (line[7:].strip() if line.startswith("Bridge ") else line) for line in parsed]

        targets = self.parse_targets(bridge_lines, offset, bridge_indices) if mode == "manual" else []
        try:
            BASE.mkdir(parents=True, exist_ok=True)
            DATA.mkdir(parents=True, exist_ok=True)
            if os.name != "nt":
                os.chmod(BASE, 0o700); os.chmod(DATA, 0o700)
            for old in (DATA / "control-port", DATA / "control_auth_cookie"):
                try: old.unlink()
                except OSError: pass
            control_lines = ["ControlPort auto", "ControlListenAddress 127.0.0.1",
                             f"ControlPortWriteToFile {tor_config_path(DATA / 'control-port')}", "CookieAuthentication 1"]
            launch_root = Path(os.environ.get("WINDIR", "C:/Windows")) / "Temp" if os.name == "nt" else Path("/tmp")
            launch_root.mkdir(parents=True, exist_ok=True)
            launch_dir = Path(tempfile.mkdtemp(prefix="torchrome-", dir=str(launch_root)))
            launch_transport = launch_dir / ("lyrebird.exe" if os.name == "nt" else "lyrebird")
            if os.name == "nt":
                shutil.copy2(transport, launch_transport)
            else:
                launch_transport.symlink_to(transport)
            self.transport_launch_dir = launch_dir
            config = [f"DataDirectory {tor_config_path(DATA)}", f"SocksPort 127.0.0.1:{PROXY_PORT} IsolateSOCKSAuth", *control_lines,
                      "Log notice stdout", "UseBridges 1",
                      f"ClientTransportPlugin meek_lite,obfs4,snowflake,webtunnel exec {launch_transport.as_posix()}", *bridge_lines]
            config_path = BASE / "torrc"
            config_path.write_text("\n".join(config) + "\n", encoding="utf-8")
            if os.name != "nt": os.chmod(config_path, 0o600)
            env = os.environ.copy()
            env["PATH"] = os.pathsep.join((str(transport.parent), str(tor.parent), env.get("PATH", "")))
            if os.name != "nt":
                env["LD_LIBRARY_PATH"] = str(tor.parent) + os.pathsep + str(transport.parent) + os.pathsep + env.get("LD_LIBRARY_PATH", "")
            process = subprocess.Popen([str(tor), "-f", str(config_path)], cwd=str(tor.parent), env=env,
                                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       text=True, encoding="utf-8", errors="replace", bufsize=1)
            with self.lock:
                self.process = process; self.targets = targets
                self.current_index = targets[0]["index"] if len(targets) == 1 else None
                self.bridge_activity = None; self.connected_at = None; self.state = "starting"; self.message = "Starting Tor…"
                self.bootstrap_progress = -1
                self.built_circuits = {}; self.exit_relay_candidates = set(); self.exit_relay_lookups_in_progress = set(); self.reconnect_since = None
                self.exit_relay_ip = ""; self.exit_relay_country = ""; self.exit_relay_circuit_id = ""
                self.selected_exit_circuit_id = ""
                self.control_monitor_state = "starting"; self.control_monitor_error = None; self.control_snapshot_count = 0; self.exit_nodes_applied = False
                self.exit_country = exit_country
                self.auto_recovery_bridges = list(recovery_bridges) if recovery_bridges is not None else (auto_bridges if mode == "manual" and selected_index is None else [])
                if recovery_bridges is not None:
                    self.auto_recovery_indices = list(recovery_indices) if recovery_indices is not None else list(range(1, len(recovery_bridges) + 1))
                elif self.auto_recovery_bridges:
                    self.auto_recovery_indices = list(bridge_indices) if bridge_indices is not None else list(range(offset + 1, offset + len(auto_bridges) + 1))
                else:
                    self.auto_recovery_indices = []
                self.auto_recovery_tried = set(recovery_tried or ())
                self.auto_recovery_in_progress = (recovery_bridges is not None or
                    (mode == "manual" and selected_index is None and bool(auto_bridges)))
                self.recovery_attempt_since = time.monotonic() if self.auto_recovery_in_progress else None
                if recovery_bridges is None: self.recovery_stable_since = None
                self.diagnostics = []; self.last_error = None; self.stopping = False
            threading.Thread(target=self.read_output, args=(process,), daemon=True).start()
            threading.Thread(target=self.monitor_control, args=(targets, process), daemon=True).start()
            if mode == "manual" and selected_index is not None:
                threading.Thread(target=self.manual_bridge_timeout_watchdog, args=(process,), daemon=True).start()
            if self.auto_recovery_bridges:
                threading.Thread(target=self.auto_recovery_watchdog, args=(process,), daemon=True).start()
            return {"ok": True, "state": "starting", "message": "Tor started. Waiting for a connection…", "bridgeCount": len(targets)}
        except Exception as error:
            if self.transport_launch_dir:
                shutil.rmtree(self.transport_launch_dir, ignore_errors=True)
                self.transport_launch_dir = None
            return {"ok": False, "error": f"Could not start Tor: {error}"}

    def manual_bridge_timeout_watchdog(self, process: subprocess.Popen[str]) -> None:
        deadline = time.monotonic() + MANUAL_BRIDGE_CONNECT_TIMEOUT
        while time.monotonic() < deadline:
            time.sleep(min(1, max(0, deadline - time.monotonic())))
            with self.lock:
                if self.process is not process or self.state != "starting":
                    return
        with self.lock:
            if self.process is not process or self.state != "starting":
                return
            self.state = "failed"
            self.last_error = MANUAL_BRIDGE_TIMEOUT_MESSAGE
            self.message = self.last_error
        if process.poll() is None:
            process.terminate()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill(); process.wait()
        with self.lock:
            if self.process is process:
                self.process = None

    def read_output(self, process: subprocess.Popen[str]) -> None:
        try:
            assert process.stdout
            for line in process.stdout:
                for diagnostic in self.safe_diagnostics(line):
                    with self.lock:
                        if diagnostic not in self.diagnostics: self.diagnostics.append(diagnostic)
                        self.diagnostics = self.diagnostics[-5:]
                match = re.search(r"Bootstrapped\s+(\d{1,3})%\s+\([^)]*\):", line)
                if match:
                    progress = min(100, int(match.group(1)))
                    with self.lock:
                        if progress > self.bootstrap_progress and self.auto_recovery_in_progress:
                            self.recovery_attempt_since = time.monotonic()
                        self.bootstrap_progress = max(self.bootstrap_progress, progress)
                        if progress >= 100:
                            if self.connected_at is None: self.connected_at = int(time.time() * 1000)
                        else:
                            self.connected_at = None
                        self.state = "connected" if progress >= 100 else "starting"
                        self.message = "Tor connected." if progress >= 100 else f"Connecting to Tor… {progress}%"
        finally:
            code = process.wait()
            with self.lock:
                if process is not self.process: return
                if self.state == "failed" and self.last_error == MANUAL_BRIDGE_TIMEOUT_MESSAGE:
                    pass
                elif self.stopping or self.state == "disconnected":
                    self.state, self.message = "disconnected", "Tor stopped."
                elif code:
                    termination = f"exit code {code}"
                    diagnostic = " Tor reported: " + " ".join(self.diagnostics) if self.diagnostics else " Check the runtime and bridge configuration."
                    self.last_error = f"Tor stopped before connecting ({termination}).{diagnostic}"
                    self.state, self.message = "failed", self.last_error
                else:
                    self.state, self.message = "disconnected", "Tor stopped."
                self.process = None
                launch_dir = self.transport_launch_dir
                self.transport_launch_dir = None
            if launch_dir:
                shutil.rmtree(launch_dir, ignore_errors=True)

    @staticmethod
    def safe_diagnostics(text: str) -> list[str]:
        issue_words = ("[warn]", "[err]", "error", "failed", "unable", "cannot", "could not", "invalid", "fatal", "denied", "already in use", "not loaded", "not found", "not permitted", "unsupported", "killed", "couldn't", "can't")
        patterns = [(r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b", "[address]"),
                    (r"\[[0-9A-Fa-f:]+\](?::\d+)?", "[address]"),
                    (r"\b(?:[0-9A-Fa-f]{1,4}:){2,}[0-9A-Fa-f:]{1,}\b", "[address]"),
                    (r"\b[A-Fa-f0-9]{40}\b", "[fingerprint]"),
                    (r"(?i)\b(cert|fingerprint|url|front|ice|utls-imitate)=\S+", r"\1=[redacted]")]
        result = []
        for raw in text.splitlines():
            line = raw.strip()
            if not line or not any(word in line.lower() for word in issue_words): continue
            for pattern, replacement in patterns: line = re.sub(pattern, replacement, line)
            result.append(line[:240])
        return result

    def ping(self, raw: str) -> dict:
        lines = parse_bridges(raw)
        if not lines: return {"ok": False, "error": "Add valid bridge lines before pinging them."}
        original_lines = [line.strip() for line in raw.splitlines() if line.strip()]
        results = []
        for original_line, line in zip(original_lines, lines):
            endpoint = bridge_endpoint(line)
            result = {"line": original_line, "latencyMs": None}
            parsed = endpoint_host_port(endpoint) if endpoint else None
            if parsed:
                started = time.monotonic()
                try:
                    with socket.create_connection(parsed, timeout=1.8):
                        result["latencyMs"] = round((time.monotonic() - started) * 1000, 1)
                except OSError: pass
                code = self.country_code(endpoint)
                if code: result["countryCode"] = code
            results.append(result)
        return {"ok": True, "results": results}

    def countries(self, raw: str) -> dict:
        original = [line.strip() for line in raw.splitlines() if line.strip()]
        normalized = [line[7:].strip() if line.startswith("Bridge ") else line for line in original]
        parsed = parse_bridges("\n".join(normalized))
        if not parsed: return {"ok": False, "error": "Add valid bridge lines before looking up countries."}
        results = []
        for line, parsed_line in zip(original, parsed):
            result = {"line": line}
            endpoint = bridge_endpoint(parsed_line)
            code = self.country_code(endpoint) if endpoint else None
            if code: result["countryCode"] = code
            results.append(result)
        return {"ok": True, "results": results}

    def load_geo(self, version: int) -> list[tuple[int, int, str]]:
        attr = "geo4" if version == 4 else "geo6"
        cached = getattr(self, attr)
        if cached is not None: return cached
        ranges = []
        filename = "geoip" if version == 4 else "geoip6"
        try:
            for line in (BUNDLE / "data" / filename).read_text(encoding="utf-8").splitlines():
                fields = line.split(",")
                if len(fields) != 3 or len(fields[2]) != 2 or fields[2] == "??": continue
                try:
                    first = int(fields[0]) if version == 4 else int(ipaddress.IPv6Address(fields[0]))
                    last = int(fields[1]) if version == 4 else int(ipaddress.IPv6Address(fields[1]))
                except ValueError: continue
                ranges.append((first, last, fields[2].lower()))
        except OSError: pass
        ranges.sort(key=lambda item: item[0])
        setattr(self, attr, ranges)
        return ranges

    def country_code(self, endpoint: str | None) -> str | None:
        parsed = endpoint_host_port(endpoint) if endpoint else None
        host = parsed[0] if parsed else (endpoint or "")
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            return None
        version = address.version
        numeric = int(address)
        ranges = self.load_geo(version)
        starts = [item[0] for item in ranges]
        index = bisect.bisect_right(starts, numeric) - 1
        return ranges[index][2] if index >= 0 and numeric <= ranges[index][1] else None

    @staticmethod
    def parse_targets(lines: list[str], offset: int, bridge_indices: list[int] | None = None) -> list[dict]:
        targets = []
        for number, line in enumerate(lines, start=1):
            fields = line.split()
            start = 1 if fields and fields[0] == "Bridge" else 0
            if len(fields) <= start: continue
            first = fields[start].lower()
            # Vanilla bridge: first token is address, not transport name
            vanilla = first not in KNOWN_TRANSPORTS
            # Named-transport bridges require an address token after the transport name
            if not vanilla and len(fields) < start + 2: continue
            transport = "none" if vanilla else first
            address = first if vanilla else fields[start + 1].lower()
            fp_field = (fields[start + 1] if len(fields) > start + 1 else "") if vanilla else (fields[start + 2] if len(fields) > start + 2 else "")
            fingerprint = fp_field.lower()
            index = bridge_indices[number - 1] if bridge_indices and len(bridge_indices) == len(lines) else number + offset
            targets.append({"index": index, "transport": transport,
                            "address": address,
                            "fingerprint": fingerprint if re.fullmatch(r"[0-9a-f]{40}", fingerprint) else None})
        return targets

    def monitor_control(self, targets: list[dict], process: subprocess.Popen[str]) -> None:
        port_file, cookie_file = DATA / "control-port", DATA / "control_auth_cookie"
        retry_delay = 1.0
        while self._is_current_process(process):
            self._set_control_monitor(process, "connecting")
            error = self._run_control_session(port_file, cookie_file, targets, process)
            if not self._is_current_process(process):
                break
            self._set_control_monitor(process, "retrying", error)
            time.sleep(retry_delay)
            retry_delay = min(10.0, retry_delay * 2)
        self._set_control_monitor(process, "stopped")

    def _is_current_process(self, process: subprocess.Popen[str]) -> bool:
        with self.lock:
            return self.process is process

    def _set_control_monitor(self, process: subprocess.Popen[str], state: str,
                             error: str | None = None) -> None:
        with self.lock:
            if self.process is not process:
                return
            self.control_monitor_state = state
            self.control_monitor_error = error

    def _run_control_session(self, port_file: Path, cookie_file: Path,
                             targets: list[dict], process: subprocess.Popen[str]) -> str:
        deadline = time.monotonic() + 20
        port = cookie = None
        while time.monotonic() < deadline:
            if not self._is_current_process(process):
                return "process_replaced"
            try:
                port = int(port_file.read_text().strip().rsplit(":", 1)[-1])
            except (OSError, ValueError):
                port = None
            try:
                candidate = cookie_file.read_bytes()
                cookie = candidate if len(candidate) == 32 else None
            except OSError:
                cookie = None
            if port and cookie:
                break
            time.sleep(.1)
        if not port or not cookie:
            return "control_files_unavailable"

        try:
            with socket.create_connection(("127.0.0.1", port), timeout=5) as conn:
                conn.settimeout(1)
                conn.sendall(f"AUTHENTICATE {cookie.hex()}\r\n".encode())
                if "250 OK" not in self.read_control_reply(conn):
                    return "control_authentication_failed"
                conn.sendall(b"SETEVENTS EXTENDED STATUS_CLIENT ORCONN CIRC STREAM\r\n")
                events = self.read_control_reply(conn)
                if "250 OK" not in events:
                    return "control_event_subscription_failed"
                self.process_control_events(events, targets, process)
                if targets:
                    conn.sendall(b"GETINFO orconn-status\r\n")
                    orconn_snapshot = self.read_control_reply(conn)
                    if self.control_snapshot_rows(orconn_snapshot, "orconn-status") is not None:
                        before, after = self.control_snapshot_event_parts(orconn_snapshot, "orconn-status")
                        self.process_control_events(before, targets, process)
                        self.process_orconn_snapshot(orconn_snapshot, targets, process)
                        self.process_control_events(after, targets, process)
                conn.sendall(b"GETINFO stream-status\r\n")
                stream_snapshot = self.read_control_reply(conn)
                if self.control_snapshot_rows(stream_snapshot, "stream-status") is not None:
                    before, after = self.control_snapshot_event_parts(stream_snapshot, "stream-status")
                    self.process_control_events(before, targets, process)
                    self.process_stream_snapshot(stream_snapshot, process)
                    self.process_control_events(after, targets, process)
                if not self._refresh_circuit_snapshot(conn, port, cookie, targets, process):
                    return "circuit_snapshot_failed"

                self._set_control_monitor(process, "watching")
                next_snapshot = time.monotonic() + 5
                while self._is_current_process(process):
                    raw = self.read_control_line(conn)
                    if raw == b"":
                        return "control_socket_closed"
                    if raw is not None:
                        event = raw.decode("utf-8", "replace")
                        if self.process_control_events(event + "\r\n", targets, process):
                            next_snapshot = time.monotonic()
                        self._handle_control_circuit_event(event, port, cookie, targets, process)
                    if self.maybe_auto_recover():
                        return "process_replaced"

                    self._apply_exit_country_if_needed(conn, process, targets)
                    if time.monotonic() >= next_snapshot:
                        if not self._refresh_circuit_snapshot(conn, port, cookie, targets, process):
                            return "circuit_snapshot_failed"
                        next_snapshot = time.monotonic() + 5
                return "process_replaced"
        except OSError:
            return "control_socket_failed"

    def _apply_exit_country_if_needed(self, conn: socket.socket,
                                      process: subprocess.Popen[str], targets: list[dict]) -> None:
        with self.lock:
            if self.process is not process or self.state != "connected" or self.exit_nodes_applied:
                return
            current_exit = self.exit_country.strip()
        if not re.fullmatch(r"[A-Za-z]{2}", current_exit):
            with self.lock:
                if self.process is process:
                    self.exit_nodes_applied = True
            return
        code = current_exit.lower()
        try:
            conn.sendall(f"SETCONF ExitNodes={{{code}}}\r\n".encode())
            reply = self.read_control_reply(conn)
            if "250 OK" not in reply:
                return
            self.process_control_events(reply, targets, process)
            conn.sendall(b"SIGNAL NEWNYM\r\n")
            reply = self.read_control_reply(conn)
            if "250 OK" not in reply:
                return
            self.process_control_events(reply, targets, process)
            with self.lock:
                if self.process is process:
                    self.exit_nodes_applied = True
        except OSError:
            pass

    def _refresh_circuit_snapshot(self, conn: socket.socket, port: int, cookie: bytes,
                                  targets: list[dict], process: subprocess.Popen[str]) -> bool:
        try:
            conn.sendall(b"GETINFO circuit-status\r\n")
            snapshot = self.read_control_reply(conn)
        except OSError:
            return False
        if self.control_snapshot_rows(snapshot, "circuit-status") is None or "250 OK" not in snapshot:
            return False
        before, after = self.control_snapshot_event_parts(snapshot, "circuit-status")
        self.process_control_events(before, targets, process)
        exit_lookups = self.process_circuit_snapshot(snapshot, targets, process)
        self.process_control_events(after, targets, process)
        for circuit_id, fingerprint in exit_lookups:
            self._schedule_exit_relay_lookup(port, cookie, fingerprint, circuit_id, process)
        with self.lock:
            if self.process is process:
                self.control_snapshot_count += 1
                self.control_monitor_error = None
        return True

    def _handle_control_circuit_event(self, event: str, port: int, cookie: bytes,
                                      targets: list[dict], process: subprocess.Popen[str]) -> None:
        if " CIRC " not in event or "ONEHOP_TUNNEL" in event or "IS_INTERNAL" in event:
            return
        fields = event.split()
        if len(fields) < 5:
            return
        if fields[3] in {"CLOSED", "FAILED", "DESTROYED"}:
            return
        if fields[3] not in {"LAUNCHED", "EXTENDED", "BUILT"}:
            return
        hops = fields[4].split(",")
        if len(hops) < 3:
            return
        if fields[3] in {"LAUNCHED", "EXTENDED"}:
            with self.lock:
                if self.process is process:
                    self.exit_relay_candidates.add(fields[2])
        fingerprint = re.split(r"[~=]", hops[-1], maxsplit=1)[0]
        with self.lock:
            is_selected = self.selected_exit_circuit_id == fields[2]
        if fields[3] == "BUILT" and is_selected:
            self._schedule_exit_relay_lookup(port, cookie, fingerprint, fields[2], process)

    def _schedule_exit_relay_lookup(self, port: int, cookie: bytes, fingerprint: str,
                                    circuit_id: str, process: subprocess.Popen[str]) -> None:
        lookup_key = f"{id(process)}:{circuit_id}"
        with self.lock:
            if self.process is not process or lookup_key in self.exit_relay_lookups_in_progress:
                return
            if circuit_id != self.selected_exit_circuit_id or circuit_id not in self.built_circuits:
                return
            if self.exit_relay_ip and self.exit_relay_circuit_id == circuit_id:
                return
            self.exit_relay_lookups_in_progress.add(lookup_key)
        threading.Thread(
            target=self._run_exit_relay_lookup,
            args=(port, cookie, fingerprint, circuit_id, lookup_key, process),
            daemon=True
        ).start()

    def _run_exit_relay_lookup(self, port: int, cookie: bytes, fingerprint: str,
                               circuit_id: str, lookup_key: str,
                               process: subprocess.Popen[str]) -> None:
        try:
            self.lookup_exit_relay_fresh(port, cookie, fingerprint, circuit_id, process)
        finally:
            with self.lock:
                self.exit_relay_lookups_in_progress.discard(lookup_key)

    @staticmethod
    def control_snapshot_rows(text: str, key: str) -> list[str] | None:
        rows: list[str] = []
        found = False
        in_snapshot = False
        for line in text.split("\r\n"):
            if line.startswith(f"250+{key}="):
                found = True
                in_snapshot = True
                continue
            if line.startswith(f"250-{key}="):
                found = True
                inline = line.split("=", 1)[1]
                if inline:
                    rows.extend(inline.split("\\n"))
                continue
            if in_snapshot and line == ".":
                in_snapshot = False
                continue
            if in_snapshot and not line.startswith("650 "):
                rows.append(line)
        return rows if found else None

    @staticmethod
    def control_snapshot_event_parts(text: str, key: str) -> tuple[str, str]:
        lines = text.split("\r\n")
        start = next((index for index, line in enumerate(lines)
                      if line.startswith(f"250+{key}=") or line.startswith(f"250-{key}=")), len(lines))
        end = start + 1
        if start < len(lines) and lines[start].startswith(f"250+{key}="):
            end = next((index + 1 for index in range(start + 1, len(lines)) if lines[index] == "."), end)
        before = "\r\n".join(lines[:start])
        after_lines = [line for line in lines[start + 1:end] if line.startswith("650 ")]
        after_lines.extend(lines[end:])
        return before, "\r\n".join(after_lines)

    def read_control_reply(self, conn: socket.socket) -> str:
        buffer = self.control_reply_buffers.setdefault(conn, bytearray())
        deadline = time.monotonic() + 5
        response_code: bytes | None = None
        in_data_block = False
        while time.monotonic() < deadline and len(buffer) < 1_048_576:
            start = 0
            while True:
                end = buffer.find(b"\r\n", start)
                if end < 0:
                    break
                line = bytes(buffer[start:end])
                if (response_code is None and len(line) >= 4 and line[:3].isdigit()
                        and line[3:4] in (b" ", b"+", b"-") and line[:3] != b"650"):
                    response_code = line[:3]
                    if line[3:4] == b"+":
                        in_data_block = True
                    elif line[3:4] == b" ":
                        reply = bytes(buffer[:end + 2])
                        del buffer[:end + 2]
                        return reply.decode("utf-8", "replace")
                elif response_code is not None:
                    if in_data_block:
                        if line == b".":
                            in_data_block = False
                    elif line.startswith(response_code + b"+"):
                        in_data_block = True
                    elif line.startswith(response_code + b" "):
                        reply = bytes(buffer[:end + 2])
                        del buffer[:end + 2]
                        return reply.decode("utf-8", "replace")
                start = end + 2
            try:
                chunk = conn.recv(8192)
            except socket.timeout:
                continue
            if not chunk:
                return ""
            buffer.extend(chunk)
        return ""

    def read_control_line(self, conn: socket.socket) -> bytes | None:
        buffer = self.control_reply_buffers.setdefault(conn, bytearray())
        while True:
            end = buffer.find(b"\r\n")
            if end >= 0:
                line = bytes(buffer[:end])
                del buffer[:end + 2]
                return line
            try:
                chunk = conn.recv(8192)
            except socket.timeout:
                return None
            if not chunk:
                return b""
            buffer.extend(chunk)
            if len(buffer) > 1_048_576:
                buffer.clear()


    def process_control_events(self, text: str, targets: list[dict], process: subprocess.Popen[str]) -> bool:
        selected_stream_changed = False
        for line in text.split("\r\n"):
            if not line.startswith("650 "):
                continue
            fields = line.split()
            if len(fields) >= 6 and fields[1] == "STREAM":
                status, circuit_id, target = fields[3:6]
                selected_stream_changed |= self.select_exit_circuit_from_stream(
                    status, circuit_id, target, process)
            self.update_bridge_activity(line, targets, process)
        return selected_stream_changed

    def process_stream_snapshot(self, text: str, process: subprocess.Popen[str]) -> bool:
        latest_stream: tuple[int, str, str] | None = None
        for line in self.control_snapshot_rows(text, "stream-status") or []:
            fields = line.split()
            if (len(fields) < 4 or not fields[0].isdigit() or int(fields[0]) <= 0
                    or fields[1] != "SUCCEEDED" or not fields[2].isdigit() or int(fields[2]) <= 0
                    or ".onion" in fields[3].lower() or "(tor_internal)" in fields[3].lower()):
                continue
            stream_number = int(fields[0])
            if latest_stream is None or stream_number > latest_stream[0]:
                latest_stream = (stream_number, fields[2], fields[3])
        if latest_stream is None:
            return False
        _, circuit_id, target = latest_stream
        return self.select_exit_circuit_from_stream("SUCCEEDED", circuit_id, target, process)

    def select_exit_circuit_from_stream(self, status: str, circuit_id: str,
                                        target: str, process: subprocess.Popen[str]) -> bool:
        if (status != "SUCCEEDED" or not circuit_id.isdigit() or int(circuit_id) <= 0
                or ".onion" in target.lower() or "(tor_internal)" in target.lower()):
            return False
        with self.lock:
            if self.process is not process or self.selected_exit_circuit_id == circuit_id:
                return False
            self.selected_exit_circuit_id = circuit_id
            self.exit_relay_ip = ""
            self.exit_relay_country = ""
            self.exit_relay_circuit_id = ""
            return True

    def process_orconn_snapshot(self, text: str, targets: list[dict], process: subprocess.Popen[str]) -> None:
        for line in self.control_snapshot_rows(text, "orconn-status") or []:
            fields = line.split()
            if len(fields) >= 2:
                self.update_bridge_activity(f"650 ORCONN {fields[0]} {fields[1]}", targets, process)

    def process_circuit_snapshot(self, text: str, targets: list[dict],
                                 process: subprocess.Popen[str]) -> list[tuple[str, str]]:
        built: dict[str, int] = {}
        built_paths: dict[str, str] = {}
        candidates: set[str] = set()
        exit_lookups: list[tuple[str, str]] = []
        for line in self.control_snapshot_rows(text, "circuit-status") or []:
            fields = line.split()
            if len(fields) < 3 or "ONEHOP_TUNNEL" in line or "IS_INTERNAL" in line:
                continue
            circuit_id, status, path = fields[:3]
            if status == "BUILT":
                index = self.bridge_index_for_target(path.split(",", 1)[0], targets)
                built[circuit_id] = index or 0
                built_paths[circuit_id] = path
            elif status in {"LAUNCHED", "EXTENDED"}:
                candidates.add(circuit_id)

        with self.lock:
            if self.process is not process:
                return []
            had_built_circuits = bool(self.built_circuits)
            self.built_circuits = built
            self.exit_relay_candidates = candidates
            if (self.selected_exit_circuit_id not in built
                    and self.selected_exit_circuit_id not in candidates):
                self.selected_exit_circuit_id = ""
                self.exit_relay_ip = ""
                self.exit_relay_country = ""
                self.exit_relay_circuit_id = ""
            selected_path = built_paths.get(self.selected_exit_circuit_id, "")
            if self.selected_exit_circuit_id and selected_path:
                hops = selected_path.split(",")
                if len(hops) >= 3:
                    exit_lookups.append((self.selected_exit_circuit_id,
                                         re.split(r"[~=]", hops[-1], maxsplit=1)[0]))
            mapped_indices = [index for index in built.values() if index > 0]
            selected_bridge_index = built.get(self.selected_exit_circuit_id, 0)
            if selected_bridge_index > 0:
                self.current_index = selected_bridge_index
                self.bridge_activity = "connected"
                self.reconnect_since = None
                if self.state == "connected":
                    self.recovery_attempt_since = None
                if self.auto_recovery_tried and not self.recovery_stable_since:
                    self.recovery_stable_since = time.monotonic()
            elif self.selected_exit_circuit_id:
                self.current_index = None
                self.bridge_activity = "connected"
                self.reconnect_since = None
            elif mapped_indices:
                if self.current_index not in mapped_indices:
                    self.current_index = mapped_indices[0]
                self.bridge_activity = "connected"
                self.reconnect_since = None
                if self.state == "connected":
                    self.recovery_attempt_since = None
                if self.auto_recovery_tried and not self.recovery_stable_since:
                    self.recovery_stable_since = time.monotonic()
            elif built:
                self.current_index = None
                self.bridge_activity = "connected"
                self.reconnect_since = None
            elif had_built_circuits or self.state == "connected":
                self.current_index = None
                self.bridge_activity = "trying"
                if self.reconnect_since is None:
                    self.reconnect_since = time.monotonic()
            if self.exit_relay_circuit_id not in built or self.exit_relay_circuit_id != self.selected_exit_circuit_id:
                self.exit_relay_ip = ""
                self.exit_relay_country = ""
                self.exit_relay_circuit_id = ""
        return exit_lookups

    def bridge_index_for_target(self, reported: str, targets: list[dict]) -> int | None:
        target = reported.lower()
        # Tor LongName values may separate the fingerprint and nickname with
        # either "~" or "=". Match the fingerprint portion in both forms.
        fingerprint = re.split(r"[~=]", target, maxsplit=1)[0].strip("$")
        for bridge in targets:
            if (bridge.get("fingerprint") and fingerprint == bridge["fingerprint"]) or target.strip("[]") == bridge["address"]:
                return bridge["index"]
        return None

    def lookup_exit_relay_fresh(self, port: int, cookie: bytes, fingerprint: str, circuit_id: str, process: subprocess.Popen[str]) -> None:
        """Retry fresh control-port lookups while a newly built circuit settles."""
        fp = fingerprint.strip("$").upper()
        if not re.fullmatch(r"[0-9A-F]{40}", fp):
            return
        ip = None
        tor_country = None
        for attempt in range(4):
            with self.lock:
                if self.process is not process or circuit_id != self.selected_exit_circuit_id or circuit_id not in self.built_circuits:
                    return
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=5) as conn:
                    conn.settimeout(5)
                    conn.sendall(f"AUTHENTICATE {cookie.hex()}\r\n".encode())
                    if "250 OK" in self.read_control_reply(conn):
                        conn.sendall(f"GETINFO ns/id/{fp}\r\n".encode())
                        reply = self.read_control_reply(conn)
                    else:
                        reply = ""
                    for line in reply.split("\r\n"):
                        if not line.startswith("r "):
                            continue
                        parts = line.split()
                        # r <name> <b64id> <b64digest> <date> <time> <ip> <orport>
                        if len(parts) >= 7:
                            try:
                                ipaddress.ip_address(parts[6])
                                ip = parts[6]
                            except ValueError:
                                pass
                        break
                    if ip:
                        conn.sendall(f"GETINFO ip-to-country/{ip}\r\n".encode())
                        country_reply = self.read_control_reply(conn)
                        key = f"250-ip-to-country/{ip}="
                        for line in country_reply.split("\r\n"):
                            if line.startswith(key):
                                candidate = line.split("=", 1)[1].strip().strip('"').upper()
                                if re.fullmatch(r"[A-Z]{2}", candidate) and candidate != "??":
                                    tor_country = candidate
                                break
            except OSError:
                reply = ""
            if ip:
                break
            if attempt < 3:
                time.sleep(0.5 * (2 ** attempt))
        if not ip:
            return
        with self.lock:
            if self.process is not process or circuit_id != self.selected_exit_circuit_id or circuit_id not in self.built_circuits:
                return
            self.exit_relay_ip = ip
            self.exit_relay_country = tor_country or self.country_code(ip) or ""
            self.exit_relay_circuit_id = circuit_id

    def update_circuit_activity(self, circuit_id: str, status: str, path: str, targets: list[dict],
                                process: subprocess.Popen[str]) -> None:
        if status == "BUILT":
            bridge_index = self.bridge_index_for_target(path.split(",", 1)[0], targets)
            with self.lock:
                if self.process is not process:
                    return
                # Some bridge lines omit their fingerprint. The CIRC event still
                # proves a usable route exists, even if its saved-line index is unknown.
                self.built_circuits[circuit_id] = bridge_index or 0
                self.exit_relay_candidates.discard(circuit_id)
                if bridge_index is not None: self.current_index = bridge_index
                self.bridge_activity = "connected"
                self.reconnect_since = None
                # Guard: a CIRC BUILT event can arrive (via the control port) while
                # state is still "starting" (bootstrap < 100 %, from stdout).  Clearing
                # recovery_attempt_since here would blind the watchdog — if bootstrap
                # then stalls with no further log output, maybe_auto_recover would never
                # fire because recovery_attempt_since is None and state != "connected".
                if self.state == "connected":
                    self.recovery_attempt_since = None
                if self.auto_recovery_tried and not self.recovery_stable_since:
                    self.recovery_stable_since = time.monotonic()
        elif status in {"CLOSED", "FAILED", "DESTROYED"}:
            with self.lock:
                if self.process is not process:
                    return
                self.built_circuits.pop(circuit_id, None)
                self.exit_relay_candidates.discard(circuit_id)
                if (circuit_id == self.selected_exit_circuit_id
                        or circuit_id == self.exit_relay_circuit_id):
                    self.exit_relay_ip = ""
                    self.exit_relay_country = ""
                    self.exit_relay_circuit_id = ""
                if circuit_id == self.selected_exit_circuit_id:
                    self.selected_exit_circuit_id = ""

    def update_bridge_activity(self, event: str, targets: list[dict], process: subprocess.Popen[str]) -> None:
        reported, activity = None, None
        fields = event.split()
        if " CIRC " in event and len(fields) >= 5:
            if "ONEHOP_TUNNEL" in event or "IS_INTERNAL" in event:
                return
            self.update_circuit_activity(fields[2], fields[3], fields[4], targets, process)
            return
        if " STATUS_CLIENT " in event and " BOOTSTRAP " in event:
            match = re.search(r'(?:HOSTADDR|HOST)="([^"]+)"', event)
            if match: reported, activity = match.group(1), "trying"
        elif " ORCONN " in event:
            if len(fields) >= 4:
                reported = fields[2]
                activity = {"LAUNCHED": "trying", "CONNECTED": "connected", "FAILED": "failed", "CLOSED": "closed"}.get(fields[3])
        if not reported or not activity: return
        bridge_index = self.bridge_index_for_target(reported, targets)
        if bridge_index is None: return
        with self.lock:
            if self.process is not process:
                return
            # Parallel OR connections must not replace a built circuit's healthy status.
            if self.built_circuits and activity in {"trying", "failed", "closed"}: return
            if activity in {"failed", "closed"} and self.current_index not in (None, bridge_index): return
            self.current_index, self.bridge_activity = bridge_index, activity
            if activity in {"trying", "failed", "closed"}:
                if self.reconnect_since is None: self.reconnect_since = time.monotonic()
            elif activity == "connected":
                self.reconnect_since = None

    def maybe_auto_recover(self) -> bool:
        with self.lock:
            if self.built_circuits and self.state != "starting":
                if self.recovery_stable_since and time.monotonic() - self.recovery_stable_since >= 60:
                    self.auto_recovery_tried.clear()
                    self.recovery_stable_since = None
                    self.auto_recovery_in_progress = False
                return False
            attempt_timeout = (INITIAL_BRIDGE_NO_PROGRESS_TIMEOUT if not self.auto_recovery_tried
                               else BRIDGE_RECOVERY_NO_PROGRESS_TIMEOUT)
            recovery_attempt_due = (self.auto_recovery_in_progress
                and self.state in {"starting", "connected", "failed"}
                and (self.state == "failed" or (self.recovery_attempt_since is not None
                     and time.monotonic() - self.recovery_attempt_since >= attempt_timeout)))
            outage_due = (self.state == "connected"
                and self.bridge_activity in {"trying", "failed", "closed"}
                and self.reconnect_since is not None
                and time.monotonic() - self.reconnect_since >= 15)
            if not self.auto_recovery_bridges or not (recovery_attempt_due or outage_due):
                return False
            count = len(self.auto_recovery_bridges)
            current = next((position for position, bridge_index in enumerate(self.auto_recovery_indices)
                            if bridge_index == self.current_index), -1)
            tried = set(self.auto_recovery_tried)
            if current >= 0:
                tried.add(current)
            else:
                configured_indices = {target["index"] for target in self.targets}
                tried.update(position for position, bridge_index in enumerate(self.auto_recovery_indices)
                             if bridge_index in configured_indices)
            ordered_positions = [(current + step) % count for step in range(1, count + 1)]
            remaining_positions = [position for position in ordered_positions if position not in tried]
            if not remaining_positions:
                self.bridge_activity = "failed"
                self.reconnect_since = None
                self.auto_recovery_in_progress = False
                self.message = "Saved bridges could not restore the connection."
                exhausted = True
            else:
                exhausted = False
            if exhausted:
                bridges = []
                recovery_bridges = list(self.auto_recovery_bridges)
                recovery_indices = list(self.auto_recovery_indices)
                target_indices = []
            else:
                recovery_bridges = list(self.auto_recovery_bridges)
                recovery_indices = list(self.auto_recovery_indices)
                bridges = [recovery_bridges[position] for position in remaining_positions]
                target_indices = [recovery_indices[position] for position in remaining_positions]
                self.message = "Starting Tor…"
                self.reconnect_since = None
        if exhausted:
            self.stop(preserve_auto_recovery=True)
            with self.lock:
                self.state = "failed"
                self.message = "Saved bridges could not restore the connection. Try connecting again."
                self.last_error = self.message
            return True
        self.stop(preserve_auto_recovery=True)
        result = self.start("manual", "\n".join(bridges), None,
                            recovery_bridges=recovery_bridges, recovery_tried=tried,
                            exit_country=self.exit_country,
                            bridge_indices=target_indices,
                            recovery_indices=recovery_indices)
        if not result.get("ok"):
            with self.lock:
                self.state = "failed"
                self.message = result.get("error", "Automatic bridge recovery failed.")
                self.last_error = self.message
        return True

    def auto_recovery_watchdog(self, process: subprocess.Popen[str]) -> None:
        while True:
            time.sleep(1)
            with self.lock:
                if self.process is not process: return
            if self.maybe_auto_recover(): return

    def stop(self, preserve_auto_recovery: bool = False) -> None:
        with self.lock:
            process = self.process; self.stopping = True
            auto_bridges = list(self.auto_recovery_bridges) if preserve_auto_recovery else []
            recovery_indices = list(self.auto_recovery_indices) if preserve_auto_recovery else []
            auto_tried = set(self.auto_recovery_tried) if preserve_auto_recovery else set()
            recovery_in_progress = self.auto_recovery_in_progress if preserve_auto_recovery else False
            recovery_attempt_since = self.recovery_attempt_since if preserve_auto_recovery else None
            stable_since = self.recovery_stable_since if preserve_auto_recovery else None
        if process and process.poll() is None:
            process.terminate()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill(); process.wait()
        with self.lock:
            self.process = None; self.state = "disconnected"; self.message = "Tor stopped."
            self.last_error = None; self.targets = []; self.current_index = None
            self.bridge_activity = None; self.built_circuits = {}; self.exit_relay_candidates = set(); self.reconnect_since = None
            self.exit_relay_ip = ""; self.exit_relay_country = ""; self.exit_relay_circuit_id = ""
            self.selected_exit_circuit_id = ""
            self.exit_relay_lookups_in_progress = set()
            self.control_monitor_state = "stopped"; self.control_monitor_error = None
            self.control_snapshot_count = 0; self.exit_nodes_applied = False
            self.auto_recovery_bridges = auto_bridges; self.auto_recovery_tried = auto_tried
            self.auto_recovery_indices = recovery_indices
            self.auto_recovery_in_progress = recovery_in_progress; self.recovery_attempt_since = recovery_attempt_since
            self.recovery_stable_since = stable_since
            self.connected_at = None; self.stopping = False


def read_exact(stream, count: int) -> bytes | None:
    chunks = bytearray()
    while len(chunks) < count:
        chunk = stream.read(count - len(chunks))
        if not chunk: return None
        chunks.extend(chunk)
    return bytes(chunks)


def write_message(obj: dict) -> None:
    encoded = json.dumps(obj, separators=(",", ":")).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(encoded)) + encoded)
    sys.stdout.buffer.flush()


def main() -> int:
    extension_id_path = BASE / "extension-id"
    arguments = sys.argv[1:]
    if FIREFOX_ADDON_ID not in arguments:
        try: expected = extension_id_path.read_text(encoding="utf-8").strip()
        except OSError: return 2
        origins = [arg for arg in arguments if arg.startswith("chrome-extension://")]
        if not origins or origins[0].rstrip("/") != f"chrome-extension://{expected}": return 2
    helper = Helper()
    while True:
        prefix = read_exact(sys.stdin.buffer, 4)
        if prefix is None: break
        length, = struct.unpack("<I", prefix)
        if not 0 < length <= MAX_MESSAGE: break
        data = read_exact(sys.stdin.buffer, length)
        if data is None: break
        try: request = json.loads(data.decode("utf-8"))
        except (UnicodeError, json.JSONDecodeError): break
        if not isinstance(request, dict): break
        write_message(helper.handle(request))
    helper.stop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

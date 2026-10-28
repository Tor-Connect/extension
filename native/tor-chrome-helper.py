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
from pathlib import Path

HOST_NAME = "org.torconnect.torchrome"
FIREFOX_ADDON_ID = "{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"
PROXY_PORT = 9050
MAX_MESSAGE = 1_048_576
MANUAL_BRIDGE_CONNECT_TIMEOUT = 5 * 60
MANUAL_BRIDGE_TIMEOUT_MESSAGE = "Could not connect through this bridge within 5 minutes."
if os.name == "nt":
    BASE = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData/Local")) / "TorChrome"
else:
    BASE = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")) / "TorChrome"
RUNTIME = BASE / "runtime"
BUNDLE = Path(os.environ.get("TORCHROME_BUNDLE", RUNTIME / "bundle")).expanduser()
DATA = BASE / "data"


KNOWN_TRANSPORTS = {"obfs4", "webtunnel", "snowflake", "meek_lite", "meek"}

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
    allowed = re.compile(r"^[a-zA-Z0-9 .:/?=&,+_\-\[\]]+$")
    address_re = re.compile(r"^(\[[\da-fA-F:]+\]|[\d.]+):(\d{1,5})$")
    for line in lines:
        normalized = line[7:].strip() if line.startswith("Bridge ") else line
        if not allowed.fullmatch(normalized) or "#" in normalized or '"' in normalized:
            return None
        first = normalized.split()[0]
        if first not in {"obfs4", "webtunnel", "snowflake"}:
            m = address_re.match(first)
            if not m or int(m.group(2)) < 1 or int(m.group(2)) > 65535:
                return None
    return lines


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
        self.reconnect_since: float | None = None
        self.auto_recovery_bridges: list[str] = []
        self.auto_recovery_tried: set[int] = set()
        self.auto_recovery_in_progress = False
        self.recovery_attempt_since: float | None = None
        self.recovery_stable_since: float | None = None
        self.connected_at: int | None = None
        self.transport_launch_dir: Path | None = None
        self.stopping = False
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
            result = self.start(request.get("mode", ""), request.get("bridges", ""), request.get("selectedBridgeIndex"))
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
            return {"ok": True, "state": "missing_runtime", "message": "Install the Tor runtime first."}
        return {"ok": True, "state": "disconnected", "message": "Ready to connect."}

    def status_payload(self, ok: bool) -> dict:
        payload = {"ok": ok, "state": self.state, "message": self.message,
                   "diagnostics": list(self.diagnostics), "bridgeCount": len(self.targets)}
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
              recovery_tried: set[int] | None = None) -> dict:
        with self.lock:
            if self.process and self.process.poll() is None:
                return self.status_payload(True)
        if mode not in {"snowflake", "manual"}:
            return {"ok": False, "error": "Choose Snowflake or manual bridge lines."}
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
            bridge_lines = ["Bridge " + (line[7:].strip() if line.startswith("Bridge ") else line) for line in parsed]

        targets = self.parse_targets(bridge_lines, offset) if mode == "manual" else []
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
                self.process = process; self.targets = targets; self.current_index = None
                self.bridge_activity = None; self.connected_at = None; self.state = "starting"; self.message = "Starting Tor…"
                self.built_circuits = {}; self.reconnect_since = None
                self.auto_recovery_bridges = list(recovery_bridges) if recovery_bridges is not None else (auto_bridges if mode == "manual" and selected_index is None else [])
                self.auto_recovery_tried = set(recovery_tried or ())
                self.auto_recovery_in_progress = recovery_bridges is not None
                self.recovery_attempt_since = time.monotonic() if recovery_bridges is not None else None
                if recovery_bridges is None: self.recovery_stable_since = None
                self.diagnostics = []; self.last_error = None; self.stopping = False
            threading.Thread(target=self.read_output, args=(process,), daemon=True).start()
            if targets:
                threading.Thread(target=self.monitor_control, args=(targets,), daemon=True).start()
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
        results = []
        for line in lines:
            endpoint = bridge_endpoint(line)
            result = {"line": line, "latencyMs": None}
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
    def parse_targets(lines: list[str], offset: int) -> list[dict]:
        targets = []
        for number, line in enumerate(lines, start=1):
            fields = line.split()
            start = 1 if fields and fields[0] == "Bridge" else 0
            if len(fields) < start + 2: continue
            first = fields[start].lower()
            # Vanilla bridge: first token is address, not transport name
            vanilla = first not in KNOWN_TRANSPORTS
            transport = "none" if vanilla else first
            address = first if vanilla else fields[start + 1].lower()
            fp_field = fields[start + 1] if vanilla else (fields[start + 2] if len(fields) > start + 2 else "")
            fingerprint = fp_field.lower()
            targets.append({"index": number + offset, "transport": transport,
                            "address": address,
                            "fingerprint": fingerprint if re.fullmatch(r"[0-9a-f]{40}", fingerprint) else None})
        return targets

    def monitor_control(self, targets: list[dict]) -> None:
        port_file, cookie_file = DATA / "control-port", DATA / "control_auth_cookie"
        deadline = time.monotonic() + 20
        port = cookie = None
        while time.monotonic() < deadline:
            try:
                port = int(port_file.read_text().strip().rsplit(":", 1)[-1])
            except (OSError, ValueError): port = None
            try:
                candidate = cookie_file.read_bytes()
                cookie = candidate if len(candidate) == 32 else None
            except OSError: cookie = None
            if port and cookie: break
            time.sleep(.1)
        if not port or not cookie: return
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=5) as conn:
                conn.settimeout(1)
                conn.sendall(f"AUTHENTICATE {cookie.hex()}\r\n".encode())
                if "250 OK" not in self.read_control_reply(conn): return
                conn.sendall(b"SETEVENTS EXTENDED STATUS_CLIENT ORCONN CIRC\r\n")
                events = self.read_control_reply(conn)
                if "250 OK" not in events: return
                self.process_control_events(events, targets)
                # The bridge may already be connected before the control listener
                # attaches, so seed our active bridge from Tor's current OR conns.
                conn.sendall(b"GETINFO orconn-status\r\n")
                self.process_orconn_snapshot(self.read_control_reply(conn), targets)
                conn.sendall(b"GETINFO circuit-status\r\n")
                self.process_circuit_snapshot(self.read_control_reply(conn), targets)
                buffer = b""
                while True:
                    try: data = conn.recv(8192)
                    except socket.timeout:
                        if self.maybe_auto_recover(): return
                        continue
                    if not data: return
                    buffer += data
                    while b"\r\n" in buffer:
                        raw, buffer = buffer.split(b"\r\n", 1)
                        self.update_bridge_activity(raw.decode("utf-8", "replace"), targets)
                        if self.maybe_auto_recover(): return
                    if len(buffer) > 65536: buffer = b""
        except OSError: return

    @staticmethod
    def read_control_reply(conn: socket.socket) -> str:
        data = bytearray(); deadline = time.monotonic() + 5
        while time.monotonic() < deadline and len(data) < 8192:
            try: chunk = conn.recv(1024)
            except socket.timeout: continue
            if not chunk: break
            data.extend(chunk)
            text = data.decode("utf-8", "replace")
            if "250 OK\r\n" in text: return text
        return data.decode("utf-8", "replace")

    def process_control_events(self, text: str, targets: list[dict]) -> None:
        for line in text.split("\r\n"):
            if line.startswith("650 "): self.update_bridge_activity(line, targets)

    def process_orconn_snapshot(self, text: str, targets: list[dict]) -> None:
        in_snapshot = False
        for line in text.split("\r\n"):
            if line.startswith("250+orconn-status="):
                in_snapshot = True
                continue
            if in_snapshot and line == ".":
                in_snapshot = False
                continue
            if in_snapshot:
                fields = line.split()
                if len(fields) >= 2:
                    self.update_bridge_activity(f"650 ORCONN {fields[0]} {fields[1]}", targets)

    def process_circuit_snapshot(self, text: str, targets: list[dict]) -> None:
        in_snapshot = False
        for line in text.split("\r\n"):
            if line.startswith("250+circuit-status="):
                in_snapshot = True
                continue
            if in_snapshot and line == ".":
                in_snapshot = False
                continue
            if not in_snapshot:
                continue
            fields = line.split()
            if len(fields) >= 3:
                self.update_circuit_activity(fields[0], fields[1], fields[2], targets)

    def bridge_index_for_target(self, reported: str, targets: list[dict]) -> int | None:
        target = reported.lower()
        fingerprint = target.split("~", 1)[0].strip("$")
        for bridge in targets:
            if (bridge.get("fingerprint") and fingerprint == bridge["fingerprint"]) or target.strip("[]") == bridge["address"]:
                return bridge["index"]
        return None

    def update_circuit_activity(self, circuit_id: str, status: str, path: str, targets: list[dict]) -> None:
        if status == "BUILT":
            bridge_index = self.bridge_index_for_target(path.split(",", 1)[0], targets)
            with self.lock:
                # Some bridge lines omit their fingerprint. The CIRC event still
                # proves a usable route exists, even if its saved-line index is unknown.
                self.built_circuits[circuit_id] = bridge_index or 0
                if bridge_index is not None: self.current_index = bridge_index
                self.bridge_activity = "connected"
                self.reconnect_since = None
                self.recovery_attempt_since = None
                if self.auto_recovery_tried and not self.recovery_stable_since:
                    self.recovery_stable_since = time.monotonic()
        elif status in {"CLOSED", "FAILED", "DESTROYED"}:
            with self.lock:
                self.built_circuits.pop(circuit_id, None)

    def update_bridge_activity(self, event: str, targets: list[dict]) -> None:
        reported, activity = None, None
        fields = event.split()
        if " CIRC " in event and len(fields) >= 5:
            self.update_circuit_activity(fields[2], fields[3], fields[4], targets)
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
            if self.built_circuits:
                if self.recovery_stable_since and time.monotonic() - self.recovery_stable_since >= 60:
                    self.auto_recovery_tried.clear()
                    self.recovery_stable_since = None
                    self.auto_recovery_in_progress = False
                return False
            recovery_attempt_due = (self.auto_recovery_in_progress
                and self.state in {"starting", "connected", "failed"}
                and (self.state == "failed" or (self.recovery_attempt_since is not None
                     and time.monotonic() - self.recovery_attempt_since >= 30)))
            outage_due = (self.state == "connected"
                and self.bridge_activity in {"trying", "failed", "closed"}
                and self.reconnect_since is not None
                and time.monotonic() - self.reconnect_since >= 15)
            if not self.auto_recovery_bridges or not (recovery_attempt_due or outage_due):
                return False
            count = len(self.auto_recovery_bridges)
            current = (self.current_index - 1) if self.current_index else -1
            candidate = next(((current + step) % count for step in range(1, count + 1)
                              if (current + step) % count not in self.auto_recovery_tried), None)
            if candidate is None:
                self.bridge_activity = "failed"
                self.reconnect_since = None
                self.auto_recovery_in_progress = False
                self.message = "Saved bridges could not restore the connection."
                exhausted = True
            else:
                exhausted = False
            if exhausted:
                bridges = []
                tried = set(self.auto_recovery_tried)
            else:
                bridges = list(self.auto_recovery_bridges)
                tried = set(self.auto_recovery_tried)
                tried.add(candidate)
                self.message = f"Trying saved bridge {candidate + 1}…"
                self.reconnect_since = None
        if exhausted:
            self.stop(preserve_auto_recovery=True)
            with self.lock:
                self.state = "failed"
                self.message = "Saved bridges could not restore the connection. Try connecting again."
                self.last_error = self.message
            return True
        self.stop(preserve_auto_recovery=True)
        result = self.start("manual", bridges[candidate], candidate + 1,
                            recovery_bridges=bridges, recovery_tried=tried)
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
            self.bridge_activity = None; self.built_circuits = {}; self.reconnect_since = None
            self.auto_recovery_bridges = auto_bridges; self.auto_recovery_tried = auto_tried
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

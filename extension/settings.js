const modeButtons = [...document.querySelectorAll(".method-card[data-mode]")];
const saveButton = document.querySelector("#saveSettings");
const saveStatusNode = document.querySelector("#saveStatus");
const connectionBadgeNode = document.querySelector("#connectionStatus");
const connectionBadgeTextNode = connectionBadgeNode.querySelector("span:last-child");
const connectionStatusMessageNode = document.querySelector("#connectionStatusMessage");
const diagnosticTextNode = document.querySelector("#diagnosticText");
const pasteButton = document.querySelector("#pasteBridges");
const importFileButton = document.querySelector("#importBridgeFile");
const importMenuToggle = document.querySelector("#importMenuToggle");
const importMenu = document.querySelector("#importMenu");
const bridgeFileInput = document.querySelector("#bridgeFileInput");
const pingButton = document.querySelector("#pingBridges");
const clearButton = document.querySelector("#clearBridges");
const copyAllButton = document.querySelector("#copyAllBridges");
const bridgeListNode = document.querySelector("#bridgeList");
const bridgeCountNode = document.querySelector("#bridgeCount");
const bridgeSummaryNode = document.querySelector("#bridgeSummary");
const bridgeSummaryCountNode = document.querySelector("#bridgeSummaryCount");
const bridgeManagementNode = document.querySelector("#bridgeManagement");
const useBridgeLinesButton = document.querySelector("#useBridgeLines");
const clipboardStatusNode = document.querySelector("#clipboardStatus");
const changeBanner = document.querySelector("#changeBanner");
const changeBannerMessage = document.querySelector("#changeBannerMessage");
const reconnectNowButton = document.querySelector("#reconnectNow");
const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
let preferences = { mode: "snowflake", bridges: "", autoBridgeSelection: true, selectedBridge: "", disabledBridges: [] };
let selectedMode = "snowflake";
let bridgeLines = [];
let disabledBridgeLines = new Set();
let pingResults = new Map();
let countryResults = new Map();
let connectedBridgeIndex = null;
let connectedBridgeAddress = "";
let connectedBridgeFingerprint = "";
let isDirty = false;
let isConnected = false;
let pollTimer;
let bridgeSaveRevision = 0;
let copiedTimers = new Map();

function send(type, extra = {}) {
  return new Promise((resolve) => chrome.runtime.sendMessage({ type, ...extra }, resolve));
}

function allEnabledLines(lines = bridgeLines) {
  return lines.filter((line) => !disabledBridgeLines.has(line));
}

function markSaveState(message, kind = "") {
  saveStatusNode.textContent = message;
  saveStatusNode.dataset.kind = kind;
  saveButton.disabled = !isDirty;
}

function readPreferences() {
  return new Promise((resolve) => {
    chrome.storage.local.get("torConnectionPreferences", (stored) => {
      const saved = stored?.torConnectionPreferences || {};
      bridgeLines = typeof saved.bridges === "string"
        ? saved.bridges.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
      disabledBridgeLines = new Set(Array.isArray(saved.disabledBridges)
        ? saved.disabledBridges.filter((line) => bridgeLines.includes(line)) : []);
      const enabled = allEnabledLines();
      preferences = {
        ...saved,
        mode: saved.mode === "manual" ? "manual" : "snowflake",
        bridges: bridgeLines.join("\n"),
        disabledBridges: [...disabledBridgeLines],
        autoBridgeSelection: saved.autoBridgeSelection !== false,
        selectedBridge: enabled.includes(saved.selectedBridge) ? saved.selectedBridge : enabled[0] || ""
      };
      selectedMode = preferences.mode;
      setMode(selectedMode);
      renderBridgeList();
      isDirty = false;
      markSaveState("All changes saved");
      resolve();
    });
  });
}

function setMode(mode) {
  selectedMode = mode === "manual" ? "manual" : "snowflake";
  const snowflakeSelected = selectedMode === "snowflake";
  bridgeSummaryNode.hidden = !snowflakeSelected;
  bridgeManagementNode.hidden = snowflakeSelected;
  modeButtons.forEach((button) => {
    const selected = button.dataset.mode === selectedMode;
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function markDirty() {
  isDirty = true;
  markSaveState("Unsaved changes", "pending");
}

function showChangeBanner(message = "Settings saved. Reconnect now to apply them.") {
  if (!isConnected) return;
  changeBannerMessage.textContent = message;
  changeBanner.hidden = false;
}

function hideChangeBanner() {
  changeBanner.hidden = true;
}

function showClipboardStatus(message, kind = "") {
  clipboardStatusNode.textContent = message;
  clipboardStatusNode.dataset.kind = kind;
}

function setImportMenuOpen(open) {
  importMenu.hidden = !open;
  importMenuToggle.setAttribute("aria-expanded", String(open));
}

function setActiveSection(sectionId) {
  sectionLinks.forEach((link) => {
    const active = link.dataset.sectionLink === sectionId;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function requestClipboardPermission(permission) {
  return new Promise((resolve) => chrome.permissions.request({ permissions: [permission] }, resolve));
}

function countryFlag(countryCode) {
  const code = String(countryCode || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((character) => 127397 + character.charCodeAt(0)));
}

function parseBridgeLine(line) {
  const parts = line.trim().split(/\s+/);
  const offset = parts[0] === "Bridge" ? 1 : 0;
  const fingerprint = parts[offset + 2] || "";
  const iat = line.match(/\biat-mode=(\S+)/i)?.[1];
  return {
    transport: parts[offset] || "Bridge",
    address: parts[offset + 1] || "",
    fingerprint,
    iat
  };
}

function bridgeNumberForLine(line, index) {
  const originalIndex = bridgeLines.indexOf(line);
  return (originalIndex >= 0 ? originalIndex : index) + 1;
}

function pingDescription(line) {
  const result = pingResults.get(line);
  if (result === undefined) return { label: "Not tested", level: 0, timeout: false };
  if (result === null) return { label: "Timed out", level: 0, timeout: true };
  const level = result < 100 ? 3 : result < 250 ? 2 : 1;
  return { label: `${result} ms`, level, timeout: false };
}

function makeIconButton(className, label, svg) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bridge-row-action ${className}`;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = svg;
  return button;
}

function renderBridgeList() {
  bridgeListNode.replaceChildren();
  bridgeCountNode.textContent = String(bridgeLines.length);
  bridgeSummaryCountNode.textContent = `${bridgeLines.length} saved`;
  pingButton.disabled = bridgeLines.length === 0;
  copyAllButton.disabled = bridgeLines.length === 0;
  clearButton.disabled = bridgeLines.length === 0;
  if (!bridgeLines.length) {
    const empty = document.createElement("p");
    empty.className = "bridge-list-empty";
    empty.textContent = "No bridges yet. Import them from a file or your clipboard.";
    bridgeListNode.append(empty);
    return;
  }

  bridgeLines.forEach((line, index) => {
    const numberLabel = bridgeNumberForLine(line, index);
    const parts = parseBridgeLine(line);
    const connected = connectedBridgeFingerprint
      ? parts.fingerprint.toLowerCase() === connectedBridgeFingerprint
      : connectedBridgeAddress ? parts.address.toLowerCase() === connectedBridgeAddress : connectedBridgeIndex === numberLabel;
    const enabled = !disabledBridgeLines.has(line);
    const item = document.createElement("article");
    item.className = "settings-bridge-item";
    item.dataset.enabled = String(enabled);
    if (connected) item.dataset.connected = "true";

    const number = document.createElement("span");
    number.className = "bridge-number";
    number.textContent = String(numberLabel);
    number.setAttribute("aria-label", `Bridge ${numberLabel}${connected ? ", currently in use" : ""}`);
    if (connected) number.title = "Currently connected bridge";

    const main = document.createElement("div");
    main.className = "bridge-main";
    const primary = document.createElement("div");
    primary.className = "bridge-primary";
    const transport = document.createElement("span");
    transport.className = "bridge-transport";
    transport.textContent = parts.transport;
    const address = document.createElement("span");
    address.className = "bridge-address";
    address.textContent = parts.address;
    primary.append(transport, address);

    const countryCode = countryResults.get(line);
    if (countryCode) {
      const flag = document.createElement("span");
      flag.className = "bridge-country-flag";
      flag.textContent = countryFlag(countryCode);
      const countryBadge = document.createElement("span");
      countryBadge.className = "bridge-country-code";
      countryBadge.textContent = countryCode.toUpperCase();
      const countryName = new Intl.DisplayNames([navigator.language || "en"], { type: "region" }).of(countryCode.toUpperCase()) || countryCode.toUpperCase();
      flag.title = countryBadge.title = `Approximate bridge country: ${countryName}`;
      flag.setAttribute("aria-label", `Approximate bridge country: ${countryName}`);
      primary.append(flag, countryBadge);
    }
    if (connected) {
      const inUse = document.createElement("span");
      inUse.className = "bridge-in-use";
      inUse.textContent = "In use";
      primary.append(inUse);
    }
    const fingerprint = document.createElement("span");
    fingerprint.className = "bridge-fingerprint";
    const shortFingerprint = parts.fingerprint.length > 18
      ? `${parts.fingerprint.slice(0, 8)}…${parts.fingerprint.slice(-6)}` : parts.fingerprint;
    fingerprint.textContent = parts.iat ? `${shortFingerprint} · iat-mode ${parts.iat}` : shortFingerprint || "Bridge details unavailable";
    fingerprint.title = line;
    main.append(primary, fingerprint);

    const ping = pingDescription(line);
    const pingNode = document.createElement("span");
    pingNode.className = "bridge-ping";
    pingNode.dataset.level = String(ping.level);
    pingNode.dataset.timeout = String(ping.timeout);
    pingNode.setAttribute("aria-label", `Ping: ${ping.label}`);
    const bars = document.createElement("span");
    bars.className = "ping-bars";
    bars.setAttribute("aria-hidden", "true");
    bars.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));
    const pingText = document.createElement("span");
    pingText.textContent = ping.label;
    pingNode.append(bars, pingText);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "bridge-toggle";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(enabled));
    toggle.setAttribute("aria-label", `Use Bridge ${numberLabel}`);
    toggle.title = enabled ? "Bridge is included in connections" : "Bridge is excluded from connections";
    toggle.addEventListener("click", () => {
      if (enabled && selectedMode === "manual" && allEnabledLines().length <= 1) {
        showClipboardStatus("Keep at least one bridge enabled when using bridge lines.", "error");
        return;
      }
      if (enabled) disabledBridgeLines.add(line);
      else disabledBridgeLines.delete(line);
      preferences.disabledBridges = [...disabledBridgeLines];
      if (disabledBridgeLines.has(preferences.selectedBridge)) {
        preferences.selectedBridge = allEnabledLines()[0] || "";
      }
      renderBridgeList();
      showClipboardStatus(enabled ? `Bridge ${numberLabel} excluded. Save changes to apply it.` : `Bridge ${numberLabel} included. Save changes to apply it.`, "success");
      markDirty();
    });

    const actions = document.createElement("div");
    actions.className = "bridge-row-actions";
    const copyButton = makeIconButton("copy-bridge", `Copy Bridge ${numberLabel}`, '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3"/></svg>');
    copyButton.addEventListener("click", async () => {
      copyButton.disabled = true;
      try {
        const allowed = await requestClipboardPermission("clipboardWrite");
        if (!allowed) {
          showClipboardStatus("Allow clipboard access to copy this bridge.", "error");
          return;
        }
        await navigator.clipboard.writeText(line);
        copyButton.classList.add("is-copied");
        copyButton.setAttribute("aria-label", `Bridge ${numberLabel} copied`);
        copyButton.title = "Copied";
        showClipboardStatus(`Bridge ${numberLabel} copied.`, "success");
        clearTimeout(copiedTimers.get(line));
        copiedTimers.set(line, window.setTimeout(() => {
          copyButton.classList.remove("is-copied");
          copyButton.setAttribute("aria-label", `Copy Bridge ${numberLabel}`);
          copyButton.title = `Copy Bridge ${numberLabel}`;
          copiedTimers.delete(line);
        }, 1400));
      } catch {
        showClipboardStatus("Could not copy the bridge. Check Chrome’s clipboard permission and try again.", "error");
      } finally {
        copyButton.disabled = false;
      }
    });
    const removeButton = makeIconButton("remove-bridge", `Remove Bridge ${numberLabel}`, '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>');
    removeButton.addEventListener("click", () => {
      if (!window.confirm(`Remove Bridge ${numberLabel}? This will save the change.`)) return;
      bridgeLines.splice(index, 1);
      disabledBridgeLines.delete(line);
      pingResults.delete(line);
      countryResults.delete(line);
      renderBridgeList();
      markDirty();
      saveBridgeList("Bridge removed and saved. Changes apply the next time you connect.");
    });
    actions.append(copyButton, removeButton);
    item.append(number, main, pingNode, toggle, actions);
    bridgeListNode.append(item);
  });
}

function storedPreferences() {
  const enabledLines = allEnabledLines();
  const selectedBridge = enabledLines.includes(preferences.selectedBridge) ? preferences.selectedBridge : enabledLines[0] || "";
  return {
    ...preferences,
    mode: selectedMode,
    bridges: bridgeLines.join("\n"),
    disabledBridges: [...disabledBridgeLines].filter((line) => bridgeLines.includes(line)),
    selectedBridge
  };
}

function saveSettings() {
  if (selectedMode === "manual" && !allEnabledLines().length) {
    markSaveState("Enable at least one bridge to use bridge lines.", "error");
    return;
  }
  markSaveState("Saving changes…");
  saveButton.disabled = true;
  const nextPreferences = storedPreferences();
  chrome.storage.local.set({ torConnectionPreferences: nextPreferences }, () => {
    if (chrome.runtime.lastError) {
      isDirty = true;
      markSaveState("Could not save settings. Try again.", "error");
      return;
    }
    preferences = nextPreferences;
    isDirty = false;
    markSaveState("All changes saved");
    if (isConnected) showChangeBanner("Settings saved. Reconnect now to apply them.");
    renderBridgeList();
  });
}

function saveBridgeList(successMessage) {
  const revision = ++bridgeSaveRevision;
  const nextPreferences = storedPreferences();
  chrome.storage.local.set({ torConnectionPreferences: nextPreferences }, () => {
    if (revision !== bridgeSaveRevision) return;
    if (chrome.runtime.lastError) {
      isDirty = true;
      markSaveState("Could not save settings. Try again.", "error");
      showClipboardStatus("Could not save bridge changes.", "error");
      return;
    }
    preferences = nextPreferences;
    isDirty = false;
    markSaveState("All changes saved");
    showClipboardStatus(successMessage, "success");
    if (isConnected) showChangeBanner("Bridge lines changed. Reconnect now to apply them.");
    renderBridgeList();
  });
}

function importBridgeText(text, sourceName = "Clipboard") {
  const incoming = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!incoming.length) {
    showClipboardStatus(`${sourceName} has no bridge lines.`, "error");
    return;
  }
  const knownLines = new Set(bridgeLines.map((line) => line.toLowerCase()));
  const imported = incoming.filter((line) => {
    const key = line.toLowerCase();
    if (knownLines.has(key)) return false;
    knownLines.add(key);
    return true;
  });
  const duplicateCount = incoming.length - imported.length;
  if (!imported.length) {
    showClipboardStatus(`No new bridges. ${duplicateCount} duplicate ${duplicateCount === 1 ? "line was" : "lines were"} skipped.`, "");
    return;
  }
  bridgeLines.push(...imported);
  renderBridgeList();
  markDirty();
  const countText = `${imported.length} ${imported.length === 1 ? "bridge" : "bridges"} added and saved.`;
  const savedText = duplicateCount
    ? `${countText} ${duplicateCount} duplicate ${duplicateCount === 1 ? "line was" : "lines were"} skipped.`
    : countText;
  saveBridgeList(savedText);
}

pasteButton.addEventListener("click", async () => {
  setImportMenuOpen(false);
  pasteButton.disabled = true;
  showClipboardStatus("");
  try {
    const allowed = await requestClipboardPermission("clipboardRead");
    if (!allowed) {
      showClipboardStatus("Allow clipboard access to import bridge lines.", "error");
      return;
    }
    importBridgeText(await navigator.clipboard.readText());
  } catch {
    showClipboardStatus("Could not read the clipboard. Check Chrome’s clipboard permission and try again.", "error");
  } finally {
    pasteButton.disabled = false;
  }
});

importMenuToggle.addEventListener("click", () => setImportMenuOpen(importMenu.hidden));
importFileButton.addEventListener("click", () => {
  setImportMenuOpen(false);
  bridgeFileInput.click();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".import-menu-wrap")) setImportMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || importMenu.hidden) return;
  setImportMenuOpen(false);
  importMenuToggle.focus();
});
bridgeFileInput.addEventListener("change", async () => {
  const file = bridgeFileInput.files?.[0];
  bridgeFileInput.value = "";
  if (!file) return;
  try {
    importBridgeText(await file.text(), file.name);
  } catch {
    showClipboardStatus(`Could not read ${file.name}. Choose a plain text bridge file.`, "error");
  }
});

copyAllButton.addEventListener("click", async () => {
  if (!bridgeLines.length) return;
  copyAllButton.disabled = true;
  try {
    const allowed = await requestClipboardPermission("clipboardWrite");
    if (!allowed) {
      showClipboardStatus("Allow clipboard access to copy bridges.", "error");
      return;
    }
    await navigator.clipboard.writeText(bridgeLines.join("\n"));
    showClipboardStatus("All bridges copied.", "success");
  } catch {
    showClipboardStatus("Could not copy bridges. Check Chrome’s clipboard permission and try again.", "error");
  } finally {
    copyAllButton.disabled = bridgeLines.length === 0;
  }
});

clearButton.addEventListener("click", () => {
  if (!bridgeLines.length) return;
  if (!window.confirm("Remove all bridge lines? This will save the change.")) return;
  bridgeLines = [];
  disabledBridgeLines.clear();
  pingResults.clear();
  countryResults.clear();
  preferences.selectedBridge = "";
  renderBridgeList();
  markDirty();
  saveBridgeList("All bridges removed and saved. Changes apply the next time you connect.");
});

pingButton.addEventListener("click", () => {
  if (!bridgeLines.length) return;
  pingButton.disabled = true;
  pingButton.setAttribute("aria-busy", "true");
  chrome.runtime.sendMessage({ type: "pingBridges", bridges: bridgeLines.join("\n") }, (result) => {
    pingButton.removeAttribute("aria-busy");
    if (chrome.runtime.lastError || !result?.ok || !Array.isArray(result.results)) {
      pingButton.disabled = bridgeLines.length === 0;
      showClipboardStatus(result?.error || "Could not ping bridges.", "error");
      return;
    }
    pingResults = new Map(result.results.map(({ line, latencyMs }) => [line, Number.isFinite(latencyMs) ? latencyMs : null]));
    countryResults = new Map(result.results.map(({ line, countryCode }) => [line, countryCode || ""]));
    bridgeLines = [...bridgeLines].sort((a, b) => {
      const pa = pingResults.get(a), pb = pingResults.get(b);
      if (pa === null) return pb === null ? 0 : 1;
      if (pb === null) return -1;
      return (pa ?? Infinity) - (pb ?? Infinity);
    });
    renderBridgeList();
    markDirty();
    saveBridgeList("Sorted fastest first and saved.");
  });
});

function setConnectionBadge(label, state, message) {
  connectionBadgeTextNode.textContent = label;
  connectionBadgeNode.dataset.state = state;
  connectionStatusMessageNode.textContent = message;
}

function sendStatus() {
  if (document.visibilityState !== "visible") return;
  chrome.runtime.sendMessage({ type: "status" }, (result) => {
    if (chrome.runtime.lastError) {
      isConnected = false;
      setConnectionBadge("Connection unavailable", "error", "Could not check the Tor connection. Restart Chrome and check the helper installation.");
      diagnosticTextNode.textContent = chrome.runtime.lastError.message;
      hideChangeBanner();
      scheduleStatusRefresh();
      return;
    }
    const diagnosticLines = Array.isArray(result?.diagnostics) ? result.diagnostics : [];
    const active = result?.ok && (result.state === "connected" || result.state === "starting" && result.bridgeActivity === "connected");
    connectedBridgeAddress = active && typeof result.bridgeAddress === "string" ? result.bridgeAddress.toLowerCase() : "";
    connectedBridgeFingerprint = active && typeof result.bridgeFingerprint === "string" ? result.bridgeFingerprint.toLowerCase() : "";
    if (active) {
      const reportedIndex = Number(result.currentBridgeIndex) || 0;
      if (selectedMode === "manual" && preferences.autoBridgeSelection && reportedIndex > 0) {
        const activeLine = allEnabledLines()[reportedIndex - 1];
        connectedBridgeIndex = activeLine ? bridgeLines.indexOf(activeLine) + 1 : null;
      } else {
        connectedBridgeIndex = reportedIndex || null;
      }
    } else {
      connectedBridgeIndex = null;
    }
    isConnected = result?.state === "connected";
    renderBridgeList();
    diagnosticTextNode.textContent = diagnosticLines.length ? diagnosticLines.join("\n")
      : result?.error || result?.message || "No additional Tor diagnostics are available.";

    if (!result?.ok || result.state === "failed" || result.state === "missing_runtime") {
      setConnectionBadge("Connection needs attention", "error", result?.error || result?.message || "Tor could not connect.");
    } else if (result.state === "connected") {
      const bridgeLabel = selectedMode === "manual" && connectedBridgeIndex ? ` · Bridge ${connectedBridgeIndex}`
        : selectedMode === "snowflake" ? " · Snowflake" : "";
      const activity = result.bridgeActivity === "trying" ? "Reconnecting" : "Connected";
      setConnectionBadge(`${activity}${bridgeLabel}`, result.bridgeActivity === "trying" ? "starting" : "connected",
        result.bridgeActivity === "trying" ? "Tor is reconnecting through a bridge." : `Tor is connected${bridgeLabel ? ` through${bridgeLabel}` : ""}.`);
    } else if (result.state === "starting") {
      setConnectionBadge(result.bridgeActivity === "trying" ? "Reconnecting…" : "Connecting…", "starting", result.message || "Tor is connecting.");
    } else {
      setConnectionBadge("Not connected", "disconnected", "Tor is disconnected.");
    }
    if (!isConnected) hideChangeBanner();
    scheduleStatusRefresh();
  });
}

function scheduleStatusRefresh() {
  if (pollTimer) clearTimeout(pollTimer);
  if (document.visibilityState === "visible") pollTimer = setTimeout(sendStatus, 1800);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") sendStatus();
  else if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
});

modeButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (button.dataset.mode === selectedMode) return;
    setMode(button.dataset.mode);
    markDirty();
  });
  button.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? modeButtons.length - 1
      : (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + modeButtons.length) % modeButtons.length;
    modeButtons[nextIndex].focus();
    modeButtons[nextIndex].click();
  });
});

useBridgeLinesButton.addEventListener("click", () => {
  if (selectedMode === "manual") return;
  setMode("manual");
  markDirty();
});

saveButton.addEventListener("click", saveSettings);

async function reconnectUsingSavedSettings() {
  const allLines = bridgeLines;
  const enabled = allEnabledLines();
  if (selectedMode === "manual" && !enabled.length) {
    showClipboardStatus("Enable at least one bridge before reconnecting.", "error");
    return;
  }
  const selectedBridgeIndex = selectedMode === "manual" && !preferences.autoBridgeSelection
    ? allLines.indexOf(preferences.selectedBridge) + 1 : null;
  const bridges = selectedBridgeIndex ? preferences.selectedBridge : enabled.join("\n");
  reconnectNowButton.disabled = true;
  hideChangeBanner();
  setConnectionBadge("Reconnecting…", "starting", "Restarting Tor with the saved settings.");
  const stopped = await send("disconnect");
  if (!stopped?.ok) {
    setConnectionBadge("Could not reconnect", "error", stopped?.error || "Could not stop the current connection.");
    reconnectNowButton.disabled = false;
    return;
  }
  const result = await send("connect", { mode: selectedMode, bridges, selectedBridgeIndex });
  if (!result?.ok) setConnectionBadge("Connection needs attention", "error", result?.error || "Could not reconnect.");
  else setConnectionBadge("Connecting…", "starting", result.message || "Tor is reconnecting.");
  reconnectNowButton.disabled = false;
  sendStatus();
}

reconnectNowButton.addEventListener("click", reconnectUsingSavedSettings);

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveSection(link.dataset.sectionLink));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.torConnectionPreferences || isDirty) return;
  const saved = changes.torConnectionPreferences.newValue || {};
  bridgeLines = typeof saved.bridges === "string" ? saved.bridges.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
  disabledBridgeLines = new Set(Array.isArray(saved.disabledBridges)
    ? saved.disabledBridges.filter((line) => bridgeLines.includes(line)) : []);
  preferences = {
    ...saved,
    mode: saved.mode === "manual" ? "manual" : "snowflake",
    bridges: bridgeLines.join("\n"),
    disabledBridges: [...disabledBridgeLines],
    autoBridgeSelection: saved.autoBridgeSelection !== false,
    selectedBridge: typeof saved.selectedBridge === "string" ? saved.selectedBridge : allEnabledLines()[0] || ""
  };
  selectedMode = preferences.mode;
  setMode(selectedMode);
  renderBridgeList();
});

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    setActiveSection(visible.target.id);
  }, { rootMargin: "-15% 0px -65% 0px", threshold: [0, 0.1, 0.35] });
  ["method", "bridges", "appearance", "privacy"].forEach((id) => sectionObserver.observe(document.getElementById(id)));
}

readPreferences().then(sendStatus);

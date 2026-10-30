const modeButtons = [...document.querySelectorAll(".method-card[data-mode]")];
const saveButton = document.querySelector("#saveSettings");
const saveStatusCleanNode = document.querySelector("#saveStatusClean");
const saveStatusDirtyNode = document.querySelector("#saveStatusDirty");
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
const pingButtonLabel = pingButton.querySelector("span");
const clearButton = document.querySelector("#clearBridges");
const copyAllButton = document.querySelector("#copyAllBridges");
const copyAllButtonLabel = copyAllButton.querySelector("span");
const bridgeListNode = document.querySelector("#bridgeList");
const bridgeCountNode = document.querySelector("#bridgeCount");
const bridgeSummaryNode = document.querySelector("#bridgeSummary");
const bridgeSummaryCountNode = document.querySelector("#bridgeSummaryCount");
const bridgeManagementNode = document.querySelector("#bridgeManagement");
const useBridgeLinesButton = document.querySelector("#useBridgeLines");
const clipboardStatusNode = document.querySelector("#clipboardStatus");
const donationListNode = document.querySelector("#donationList");
const donationStatusNode = document.querySelector("#donationStatus");
const killSwitchToggle = document.querySelector("#killSwitchToggle");
const killSwitchCard = document.querySelector("#killSwitchCard");
const killSwitchActivePanel = document.querySelector("#killSwitchActivePanel");
const protectionNavBadge = document.querySelector("#protectionNavBadge");
const appVersionBadge = document.querySelector("#appVersionBadge");
appVersionBadge.textContent = "v" + chrome.runtime.getManifest().version;
const connectionDetailsToggle = document.querySelector("#connectionDetailsToggle");
const connectionDetailsBody = document.querySelector("#connectionDetailsBody");
const changeBanner = document.querySelector("#changeBanner");
const changeBannerMessage = document.querySelector("#changeBannerMessage");
const reconnectNowButton = document.querySelector("#reconnectNow");
const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const exitCountrySelectNode = document.querySelector("#exitCountrySelect");
const exitCountryCurrentNode = document.querySelector("#exitCountryCurrent");
const exitCountryCurrentFlagNode = document.querySelector("#exitCountryCurrentFlag");
const exitCountryOptionsNode = document.querySelector("#exitCountryOptions");
const exitCountryOptionButtons = [...document.querySelectorAll("[data-exit-country]")];
const exitCountryCardNode = document.querySelector("#exitCountryCard");
const exitCountryNoticeNode = document.querySelector("#exitCountryNotice");
const exitCountryNavBadge = document.querySelector("#exitCountryNavBadge");
let preferences = { mode: "snowflake", bridges: "", autoBridgeSelection: true, selectedBridge: "", disabledBridges: [], killSwitch: false, exitCountry: "" };
let selectedMode = "snowflake";
let bridgeLines = [];
let disabledBridgeLines = new Set();
let pingResults = new Map();
let countryResults = new Map();
let isPingingBridges = false;
let isCopyingAllBridges = false;
let copyAllSuccessTimer = null;
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
  return lines.filter((line) => !disabledBridgeLines.has(line) && isBridgeLineValid(line));
}

function markSaveState(message, kind = "") {
  const dirty = isDirty;
  saveStatusCleanNode.hidden = dirty;
  saveStatusDirtyNode.hidden = !dirty;
  saveButton.hidden = !dirty;
  if (dirty) {
    saveStatusDirtyNode.dataset.kind = kind;
  }
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
        selectedBridge: enabled.includes(saved.selectedBridge) ? saved.selectedBridge : enabled[0] || "",
        killSwitch: saved.killSwitch === true,
        exitCountry: typeof saved.exitCountry === "string" ? saved.exitCountry : ""
      };
      selectedMode = preferences.mode;
      setMode(selectedMode);
      renderBridgeList();
      renderKillSwitch();
      renderExitCountry();
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

const COIN_NAMES = { BTC: "Bitcoin", ETH: "Ethereum", ZEC: "Zcash", XMR: "Monero" };
const COIN_SYMBOLS = { BTC: "₿", ETH: "Ξ", ZEC: "ⓩ", XMR: "ɱ" };

async function loadDonationAddresses() {
  try {
    const response = await fetch(chrome.runtime.getURL("donation-addresses.txt"));
    if (!response.ok) throw new Error("Donation address list is unavailable.");
    const lines = (await response.text()).split(/\r?\n/);
    const entries = lines.map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("|"))
      .filter((parts) => parts.length === 3 && parts.every((part) => part.trim()))
      .map(([coin, network, address]) => ({ coin: coin.trim().toUpperCase(), network: network.trim(), address: address.trim() }));

    for (const { coin, network, address } of entries) {
      const card = document.createElement("article");
      card.className = "donation-card";

      // Header: symbol circle + name/network + copy button
      const header = document.createElement("div");
      header.className = "donation-card-header";

      const symCircle = document.createElement("span");
      symCircle.className = "donation-coin-symbol";
      symCircle.textContent = COIN_SYMBOLS[coin] || coin[0];
      symCircle.setAttribute("aria-hidden", "true");

      const meta = document.createElement("div");
      meta.className = "donation-metadata";
      const name = document.createElement("strong");
      name.textContent = COIN_NAMES[coin] || coin;
      const networkLabel = document.createElement("span");
      networkLabel.textContent = `${coin} · ${network}`;
      meta.append(name, networkLabel);

      const copyButton = document.createElement("button");
      copyButton.className = "quiet-button donation-copy-button";
      copyButton.type = "button";
      copyButton.setAttribute("aria-label", `Copy ${coin} donation address`);

      // Copy button inner: idle icon + copied icon + label
      const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      copyIcon.setAttribute("class", "donation-copy-icon");
      copyIcon.setAttribute("viewBox", "0 0 24 24");
      copyIcon.setAttribute("aria-hidden", "true");
      const copyPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      copyPath.setAttribute("d", "M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z");
      copyIcon.append(copyPath);

      const copiedIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      copiedIcon.setAttribute("class", "donation-copy-success-icon");
      copiedIcon.setAttribute("viewBox", "0 0 24 24");
      copiedIcon.setAttribute("aria-hidden", "true");
      const copiedPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      copiedPath.setAttribute("d", "m5 12.5 4.5 4.5L19 7.5");
      copiedIcon.append(copiedPath);

      const copyLabel = document.createElement("span");
      copyLabel.className = "donation-copy-label";
      copyLabel.textContent = "Copy";
      copyButton.append(copyIcon, copiedIcon, copyLabel);

      header.append(symCircle, meta, copyButton);

      // Address box with first/last 6 chars highlighted
      const HIGHLIGHT = 6;
      const addressBox = document.createElement("div");
      addressBox.className = "donation-address-box";
      addressBox.dir = "ltr";
      const a1 = document.createElement("span");
      a1.className = "donation-address-highlight";
      a1.textContent = address.slice(0, HIGHLIGHT);
      const a2 = document.createTextNode(address.slice(HIGHLIGHT, address.length - HIGHLIGHT));
      const a3 = document.createElement("span");
      a3.className = "donation-address-highlight";
      a3.textContent = address.slice(address.length - HIGHLIGHT);
      addressBox.append(a1, a2, a3);

      let copiedStateTimer;
      copyButton.addEventListener("click", async () => {
        copyButton.disabled = true;
        donationStatusNode.textContent = "";
        try {
          const allowed = await requestClipboardPermission("clipboardWrite");
          if (!allowed) {
            donationStatusNode.textContent = "Allow clipboard access to copy the address.";
            return;
          }
          await navigator.clipboard.writeText(address);
          clearTimeout(copiedStateTimer);
          copyButton.classList.add("is-copied");
          copyLabel.textContent = "Copied";
          copyButton.setAttribute("aria-label", `${coin} address copied`);
          copiedStateTimer = setTimeout(() => {
            copyButton.classList.remove("is-copied");
            copyLabel.textContent = "Copy";
            copyButton.setAttribute("aria-label", `Copy ${coin} donation address`);
          }, 1500);
        } catch {
          donationStatusNode.textContent = `Could not copy the ${coin} address. Check Chrome's clipboard permission and try again.`;
        } finally {
          copyButton.disabled = false;
        }
      });

      card.append(header, addressBox);
      donationListNode.append(card);
    }
  } catch {
    donationStatusNode.textContent = "Could not load donation addresses.";
  }
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
  const first = parts[offset] || "";
  // Vanilla bridge: first token is a numeric IP:port, not a transport name
  const vanilla = !KNOWN_TRANSPORTS.has(first.toLowerCase()) && VANILLA_ADDRESS_RE.test(first);
  const iat = line.match(/\biat-mode=(\S+)/i)?.[1];
  return {
    transport: vanilla ? "none" : (first || "Bridge"),
    address: vanilla ? first : (parts[offset + 1] || ""),
    fingerprint: vanilla ? (parts[offset + 1] || "") : (parts[offset + 2] || ""),
    iat
  };
}

const KNOWN_TRANSPORTS = new Set(["obfs4", "webtunnel", "snowflake", "meek_lite", "meek"]);
// Vanilla bridges must use a numeric IP (matching the native Swift/Python parsers).
const VANILLA_ADDRESS_RE = /^(\[[\da-f:]+\]|[\d.]+):\d{1,5}$/i;

function validPort(address) {
  const port = Number(address.split(":").at(-1));
  return port >= 1 && port <= 65535;
}

function isBridgeLineValid(line) {
  const parts = line.trim().split(/\s+/);
  const offset = parts[0] === "Bridge" ? 1 : 0;
  const first = parts[offset] || "";
  if (KNOWN_TRANSPORTS.has(first.toLowerCase())) return true;
  // Vanilla: first token must be a numeric IP:port within valid port range
  return VANILLA_ADDRESS_RE.test(first) && validPort(first);
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
  return { label: result < 0.05 ? "<0.1 ms" : `${result.toFixed(1)} ms`, level, timeout: false };
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
  pingButton.disabled = bridgeLines.length === 0 || isPingingBridges;
  copyAllButton.disabled = bridgeLines.length === 0 || isCopyingAllBridges;
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

    const valid = isBridgeLineValid(line);
    if (!valid) item.dataset.invalid = "true";

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
    if (!valid) {
      const invalidBadge = document.createElement("span");
      invalidBadge.className = "bridge-invalid";
      invalidBadge.textContent = "Invalid";
      primary.append(invalidBadge);
    }

    const countryCode = countryResults.get(line);
    if (countryCode) {
      const flag = document.createElement("span");
      flag.className = "bridge-country-flag";
      flag.textContent = countryFlag(countryCode);
      const countryBadge = document.createElement("span");
      countryBadge.className = "bridge-country-code";
      countryBadge.textContent = countryCode.toUpperCase();
      const countryName = new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(countryCode.toUpperCase()) || countryCode.toUpperCase();
      flag.title = countryBadge.title = `Approximate bridge country: ${countryName}`;
      flag.setAttribute("aria-label", `Approximate bridge country: ${countryName}`);
      primary.append(flag, countryBadge);
    }
    const fingerprintRow = document.createElement("div");
    fingerprintRow.className = "bridge-fingerprint-row";
    const fingerprint = document.createElement("span");
    fingerprint.className = "bridge-fingerprint";
    const shortFingerprint = parts.fingerprint.length > 18
      ? `${parts.fingerprint.slice(0, 8)}…${parts.fingerprint.slice(-6)}` : parts.fingerprint;
    fingerprint.textContent = parts.iat ? `${shortFingerprint} · iat-mode ${parts.iat}` : shortFingerprint || "Bridge details unavailable";
    fingerprint.title = line;
    fingerprintRow.append(fingerprint);
    if (connected) {
      const inUse = document.createElement("span");
      inUse.className = "bridge-in-use";
      inUse.textContent = "In use";
      fingerprintRow.append(inUse);
    }
    main.append(primary, fingerprintRow);

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
    toggle.setAttribute("aria-checked", String(enabled && valid));
    toggle.setAttribute("aria-label", `Use Bridge ${numberLabel}`);
    toggle.title = !valid ? "Bridge line is invalid" : enabled ? "Bridge is included in connections" : "Bridge is excluded from connections";
    toggle.disabled = !valid;
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
    selectedBridge,
    killSwitch: preferences.killSwitch === true,
    exitCountry: preferences.exitCountry || ""
  };
}

function renderExitCountry() {
  const code = preferences.exitCountry || "";
  exitCountryOptionButtons.forEach((btn) => {
    const selected = btn.dataset.exitCountry === code;
    btn.setAttribute("aria-selected", String(selected));
  });
  if (code) {
    exitCountryCurrentFlagNode.textContent = code.toUpperCase();
    const label = new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(code.toUpperCase()) || code.toUpperCase();
    exitCountryCurrentNode.textContent = label;
    exitCountryCardNode.dataset.on = "true";
    exitCountryNoticeNode.hidden = false;
    if (exitCountryNavBadge) exitCountryNavBadge.textContent = code.toUpperCase();
  } else {
    exitCountryCurrentFlagNode.textContent = "ANY";
    exitCountryCurrentNode.textContent = "Automatic";
    exitCountryCardNode.dataset.on = "false";
    exitCountryNoticeNode.hidden = true;
    if (exitCountryNavBadge) exitCountryNavBadge.textContent = "Auto";
  }
}

function setExitCountryPickerOpen(open) {
  exitCountryOptionsNode.hidden = !open;
  exitCountrySelectNode.setAttribute("aria-expanded", String(open));
}

exitCountrySelectNode.addEventListener("click", () => setExitCountryPickerOpen(exitCountryOptionsNode.hidden));

exitCountryOptionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setExitCountryPickerOpen(false);
    exitCountrySelectNode.focus();
    const code = btn.dataset.exitCountry;
    if (code === (preferences.exitCountry || "")) return;
    const prevCode = preferences.exitCountry;
    preferences.exitCountry = code;
    renderExitCountry();
    // Base the write on the last persisted record (preferences), not storedPreferences(),
    // so pending unsaved bridge/mode edits are not silently committed with this picker change.
    const nextPreferences = { ...preferences, exitCountry: code };
    chrome.storage.local.set({ torConnectionPreferences: nextPreferences }, () => {
      if (chrome.runtime.lastError) {
        preferences.exitCountry = prevCode;
        renderExitCountry();
        return;
      }
      preferences = nextPreferences;
      if (isConnected) showChangeBanner("Exit country changed. Reconnect now to apply it.");
    });
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".exit-country-picker-wrap")) setExitCountryPickerOpen(false);
});

function renderKillSwitch() {
  const on = preferences.killSwitch === true;
  killSwitchToggle.setAttribute("aria-checked", String(on));
  killSwitchCard.dataset.on = String(on);
  killSwitchActivePanel.hidden = !on;
  protectionNavBadge.textContent = on ? "On" : "Off";
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
      saveButton.disabled = false;
      isDirty = true;
      markSaveState("Could not save settings. Try again.", "error");
      return;
    }
    saveButton.disabled = false;
    preferences = nextPreferences;
    isDirty = false;
    markSaveState("All changes saved");
    if (isConnected) showChangeBanner("Settings saved. Reconnect now to apply them.");
    renderBridgeList();
  });
}

function saveBridgeList(successMessage, kind = "success") {
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
    showClipboardStatus(successMessage, kind);
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
  let invalidCount = 0;
  const imported = incoming.filter((line) => {
    if (!isBridgeLineValid(line)) { invalidCount++; return false; }
    const key = line.toLowerCase();
    if (knownLines.has(key)) return false;
    knownLines.add(key);
    return true;
  });
  const duplicateCount = incoming.length - invalidCount - imported.length;
  if (!imported.length) {
    const parts = [];
    if (duplicateCount) parts.push(`${duplicateCount} duplicate ${duplicateCount === 1 ? "line" : "lines"} skipped`);
    if (invalidCount) parts.push(`${invalidCount} invalid ${invalidCount === 1 ? "line" : "lines"} skipped`);
    showClipboardStatus(`No new bridges. ${parts.join(", ")}.`, invalidCount ? "warning" : "");
    return;
  }
  bridgeLines.push(...imported);
  renderBridgeList();
  markDirty();
  const countText = `${imported.length} ${imported.length === 1 ? "bridge" : "bridges"} added and saved.`;
  const skippedParts = [];
  if (duplicateCount) skippedParts.push(`${duplicateCount} duplicate ${duplicateCount === 1 ? "line" : "lines"}`);
  if (invalidCount) skippedParts.push(`${invalidCount} invalid ${invalidCount === 1 ? "line" : "lines"}`);
  const savedText = skippedParts.length ? `${countText} ${skippedParts.join(" and ")} skipped.` : countText;
  saveBridgeList(savedText, invalidCount ? "warning" : "success");
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
  if (!bridgeLines.length || isCopyingAllBridges) return;
  const copyStartedAt = Date.now();
  clearTimeout(copyAllSuccessTimer);
  copyAllButton.classList.remove("is-copied");
  copyAllButtonLabel.textContent = "Copy all";
  isCopyingAllBridges = true;
  copyAllButton.disabled = true;
  showClipboardStatus("");
  try {
    const allowed = await requestClipboardPermission("clipboardWrite");
    if (!allowed) {
      showClipboardStatus("Allow clipboard access to copy bridges.", "error");
      return;
    }
    await navigator.clipboard.writeText(bridgeLines.join("\n"));
    copyAllButton.classList.add("is-copied");
    copyAllButtonLabel.textContent = "Copied";
    copyAllSuccessTimer = setTimeout(() => {
      copyAllButton.classList.remove("is-copied");
      copyAllButtonLabel.textContent = "Copy all";
    }, 1200);
    showClipboardStatus("All bridges copied.", "success");
  } catch {
    showClipboardStatus("Could not copy bridges. Check Chrome’s clipboard permission and try again.", "error");
  } finally {
    const remainingBusyTime = 500 - (Date.now() - copyStartedAt);
    if (remainingBusyTime > 0) await new Promise((resolve) => setTimeout(resolve, remainingBusyTime));
    isCopyingAllBridges = false;
    renderBridgeList();
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
  if (!bridgeLines.length || isPingingBridges) return;
  const pingStartedAt = Date.now();
  isPingingBridges = true;
  pingButtonLabel.textContent = "Pinging";
  pingButton.disabled = true;
  pingButton.setAttribute("aria-busy", "true");
  const finishPinging = () => {
    const remainingBusyTime = 500 - (Date.now() - pingStartedAt);
    setTimeout(() => {
      isPingingBridges = false;
      pingButton.removeAttribute("aria-busy");
      pingButtonLabel.textContent = "Ping all";
      renderBridgeList();
    }, Math.max(0, remainingBusyTime));
  };
  const validLines = allEnabledLines();
  if (!validLines.length) { finishPinging(); return; }
  chrome.runtime.sendMessage({ type: "pingBridges", bridges: validLines.join("\n") }, async (result) => {
    if (chrome.runtime.lastError || !result?.ok || !Array.isArray(result.results)) {
      showClipboardStatus(result?.error || "Could not ping bridges.", "error");
      finishPinging();
      return;
    }
    const latencies = new Map(result.results.map(({ line, latencyMs }) => [line, Number.isFinite(latencyMs) ? latencyMs : null]));
    countryResults = new Map(result.results.map(({ line, countryCode }) => [line, countryCode || ""]));
    // For WebTunnel bridges the native helper pings the placeholder IP (always null).
    // Measure latency in JS by fetching the url= host directly.
    await Promise.all(result.results.map(async ({ line }) => {
      if (latencies.get(line) !== null) return;
      const urlMatch = line.match(/\burl=https:\/\/([^/\s]+)/i);
      if (!urlMatch) return;
      const host = urlMatch[1];
      const start = Date.now();
      try {
        await fetch(`https://${host}`, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(4500) });
        latencies.set(line, Date.now() - start);
      } catch { /* still null = timed out */ }
    }));
    pingResults = latencies;
    bridgeLines = [...bridgeLines].sort((a, b) => {
      const aValid = isBridgeLineValid(a), bValid = isBridgeLineValid(b);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      const pa = pingResults.get(a), pb = pingResults.get(b);
      if (pa === null) return pb === null ? 0 : 1;
      if (pb === null) return -1;
      return (pa ?? Infinity) - (pb ?? Infinity);
    });
    renderBridgeList();
    finishPinging();
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
      setConnectionBadge("Connection unavailable", "error", "Could not check the Tor connection. Restart your browser and check the helper installation.");
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
  const result = await send("connect", { mode: selectedMode, bridges, selectedBridgeIndex, exitCountry: preferences.exitCountry || "" });
  if (!result?.ok) setConnectionBadge("Connection needs attention", "error", result?.error || "Could not reconnect.");
  else setConnectionBadge("Connecting…", "starting", result.message || "Tor is reconnecting.");
  reconnectNowButton.disabled = false;
  sendStatus();
}

reconnectNowButton.addEventListener("click", reconnectUsingSavedSettings);

sectionLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveSection(link.dataset.sectionLink));
});

connectionDetailsToggle.addEventListener("click", () => {
  const open = connectionDetailsBody.hidden;
  connectionDetailsBody.hidden = !open;
  connectionDetailsToggle.setAttribute("aria-expanded", String(open));
});

killSwitchToggle.addEventListener("click", () => {
  preferences.killSwitch = !preferences.killSwitch;
  renderKillSwitch();
  const nextPreferences = { ...preferences };
  chrome.storage.local.set({ torConnectionPreferences: nextPreferences }, () => {
    if (chrome.runtime.lastError) {
      preferences.killSwitch = !preferences.killSwitch;
      renderKillSwitch();
      return;
    }
    preferences = nextPreferences;
  });
});

document.addEventListener("tor-language-changed", () => { renderBridgeList(); renderExitCountry(); });

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
    selectedBridge: typeof saved.selectedBridge === "string" ? saved.selectedBridge : allEnabledLines()[0] || "",
    killSwitch: saved.killSwitch === true,
    exitCountry: typeof saved.exitCountry === "string" ? saved.exitCountry : ""
};
selectedMode = preferences.mode;
setMode(selectedMode);
renderBridgeList();
renderKillSwitch();
renderExitCountry();
});

{
  let suppressUntil = 0;
  document.addEventListener("click", () => { suppressUntil = Date.now() + 400; }, { capture: true });
  const sectionIds = ["method", "bridges", "exit-country", "protection", "appearance", "privacy", "support"];
  const THRESHOLD = 160; // px from top of viewport — just below the sticky header
  const updateActiveSection = () => {
    if (Date.now() < suppressUntil) return;
    // Find the last section whose top edge has scrolled above THRESHOLD.
    // That's the section the user is currently reading.
    let active = sectionIds[0];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= THRESHOLD) active = id;
    }
    setActiveSection(active);
  };
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  // Set correct active section on initial load (e.g. page loaded mid-scroll or hash in URL).
  updateActiveSection();
}

loadDonationAddresses();
readPreferences().then(sendStatus);

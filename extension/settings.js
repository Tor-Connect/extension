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
const bridgeSectionHeadingNode = document.querySelector(".bridge-section-heading");
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
const connectionHealthCard = document.querySelector("#connectionHealthCard");
const autoBridgeFailoverToggle = document.querySelector("#autoBridgeFailoverToggle");
const connectionHealthDescription = document.querySelector("#connectionHealthDescription");
const autoBridgeFailoverTitle = document.querySelector("#autoBridgeFailoverTitle");
const autoBridgeFailoverDescription = document.querySelector("#autoBridgeFailoverDescription");
const siteCheckIntervalValue = document.querySelector("#siteCheckIntervalValue");
const decreaseSiteCheckIntervalButton = document.querySelector("#decreaseSiteCheckInterval");
const increaseSiteCheckIntervalButton = document.querySelector("#increaseSiteCheckInterval");
const siteCheckIntervalUnit = document.querySelector("#siteCheckIntervalUnit");
const siteCheckStatusNode = document.querySelector("#siteCheckStatus");
const siteCheckStatusTextNode = document.querySelector("#siteCheckStatusText");
const checkSitesNowButton = document.querySelector("#checkSitesNow");
const autoBridgeFailoverNavBadge = document.querySelector("#autoBridgeFailoverNavBadge");
const protectionNavBadge = document.querySelector("#protectionNavBadge");
const changeBanner = document.querySelector("#changeBanner");
const changeBannerMessage = document.querySelector("#changeBannerMessage");
const reconnectNowButton = document.querySelector("#reconnectNow");
const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const settingsViewToggle = document.querySelector("#settingsViewToggle");
const settingsViewHint = document.querySelector("#settingsViewHint");
const exitCountrySelectNode = document.querySelector("#exitCountrySelect");
const exitCountryCurrentNode = document.querySelector("#exitCountryCurrent");
const exitCountryCurrentFlagNode = document.querySelector("#exitCountryCurrentFlag");
const exitCountryOptionsNode = document.querySelector("#exitCountryOptions");
const exitCountryOptionButtons = [...document.querySelectorAll("[data-exit-country]")];
const exitCountryCardNode = document.querySelector("#exitCountryCard");
const exitCountryNoticeNode = document.querySelector("#exitCountryNotice");
const exitCountryNavBadge = document.querySelector("#exitCountryNavBadge");
let preferences = { mode: "snowflake", bridges: "", selectedBridge: "", disabledBridges: [], killSwitch: false, exitCountry: "", autoBridgeFailover: false, siteCheckIntervalMinutes: 5 };
let confirmedKillSwitch = false;
let confirmedSiteCheckInterval = 5;
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
let siteCheckState = "";
let siteCheckCompletedAt = 0;
let manualSiteCheckPending = false;
let pollTimer;
let bridgeSaveRevision = 0;
let copiedTimers = new Map();
let preferenceWriteQueue = Promise.resolve();
const t = (key, params) => (globalThis.torI18n?.t || ((s) => s))(key, params);
const MAX_ENABLED_BRIDGES = 20;
const ACTIVE_SETTINGS_SECTION_KEY = "torConnectSettingsActiveSection";
const SHOW_ALL_SETTINGS_SECTIONS_KEY = "torConnectSettingsShowAllSections";
let showAllSettingsSections = sessionStorage.getItem(SHOW_ALL_SETTINGS_SECTIONS_KEY) !== "false";

function normalizeSiteCheckInterval(value) {
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 60 ? minutes : 5;
}

function send(type, extra = {}) {
  return new Promise((resolve) => chrome.runtime.sendMessage({ type, ...extra }, resolve));
}

function allEnabledLines(lines = bridgeLines) {
  return lines.filter((line) => !disabledBridgeLines.has(line) && isBridgeLineValid(line));
}

function savePreferences(update, onComplete) {
  preferenceWriteQueue = preferenceWriteQueue.then(() => new Promise((resolve) => {
    const finish = (saved, nextPreferences) => {
      try {
        if (saved && typeof nextPreferences?.killSwitch === "boolean") {
          confirmedKillSwitch = nextPreferences.killSwitch;
        }
        if (saved) confirmedSiteCheckInterval = normalizeSiteCheckInterval(nextPreferences?.siteCheckIntervalMinutes);
        onComplete?.(saved, nextPreferences);
      } finally {
        resolve();
      }
    };
    chrome.storage.local.get("torConnectionPreferences", (stored) => {
      if (chrome.runtime.lastError) {
        finish(false);
        return;
      }
      const savedPreferences = { ...(stored?.torConnectionPreferences || {}) };
      const nextPreferences = { ...savedPreferences, ...update };
      chrome.storage.local.set({
        torConnectionPreferences: nextPreferences
      }, () => finish(!chrome.runtime.lastError, nextPreferences));
    });
  }));
}

function savePreferenceField(field, value, onComplete) {
  savePreferences({ [field]: value }, onComplete);
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
      const saved = { ...(stored?.torConnectionPreferences || {}) };
      delete saved.autoBridgeSelection;
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
        selectedBridge: enabled.includes(saved.selectedBridge) ? saved.selectedBridge : enabled[0] || "",
        killSwitch: saved.killSwitch === true,
        exitCountry: typeof saved.exitCountry === "string" ? saved.exitCountry : "",
        autoBridgeFailover: saved.autoBridgeFailover === true,
        siteCheckIntervalMinutes: normalizeSiteCheckInterval(saved.siteCheckIntervalMinutes)
      };
      confirmedKillSwitch = preferences.killSwitch;
      confirmedSiteCheckInterval = preferences.siteCheckIntervalMinutes;
      selectedMode = preferences.mode;
      setMode(selectedMode);
      renderBridgeList();
      if (allEnabledLines().length > MAX_ENABLED_BRIDGES) {
        showClipboardStatus(t("Up to {n} bridges may be enabled at a time. Disable one to enable another.", { n: MAX_ENABLED_BRIDGES }), "warning");
      }
      renderKillSwitch();
      renderConnectionHealth();
      renderExitCountry();
      isDirty = false;
      markSaveState(t("All changes saved"));
      setActiveSection(getSelectedSettingsSection());
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
  renderConnectionHealth();
}

function markDirty() {
  isDirty = true;
  markSaveState(t("Unsaved changes"), "pending");
}

function showChangeBanner(message = t("Settings saved. Reconnect now to apply them.")) {
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

let cachedDonationEntries = null;
async function loadDonationAddresses() {
  try {
    if (!cachedDonationEntries) {
      const response = await fetch(chrome.runtime.getURL("donation-addresses.txt"));
      if (!response.ok) throw new Error("Donation address list is unavailable.");
      const lines = (await response.text()).split(/\r?\n/);
      cachedDonationEntries = lines.map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("|"))
        .filter((parts) => parts.length === 3 && parts.every((part) => part.trim()))
        .map(([coin, network, address]) => ({ coin: coin.trim().toUpperCase(), network: network.trim(), address: address.trim() }));
    }
    donationListNode.replaceChildren();
    for (const { coin, network, address } of cachedDonationEntries) {
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
      copyButton.setAttribute("aria-label", t("Copy {coin} donation address", { coin }));

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
      copyLabel.textContent = t("Copy");
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
            donationStatusNode.textContent = t("Allow clipboard access to copy the address.");
            return;
          }
          await navigator.clipboard.writeText(address);
          clearTimeout(copiedStateTimer);
          copyButton.classList.add("is-copied");
          copyLabel.textContent = t("Copied");
          copyButton.setAttribute("aria-label", t("{coin} address copied", { coin }));
          copiedStateTimer = setTimeout(() => {
            copyButton.classList.remove("is-copied");
            copyLabel.textContent = t("Copy");
            copyButton.setAttribute("aria-label", t("Copy {coin} donation address", { coin }));
          }, 1500);
        } catch {
          donationStatusNode.textContent = t("Could not copy the {coin} address. Check Chrome’s clipboard permission and try again.", { coin });
        } finally {
          copyButton.disabled = false;
        }
      });

      card.append(header, addressBox);
      donationListNode.append(card);
    }
  } catch {
    donationStatusNode.textContent = t("Could not load donation addresses.");
  }
}

function setImportMenuOpen(open) {
  importMenu.hidden = !open;
  importMenuToggle.setAttribute("aria-expanded", String(open));
}

function setActiveSection(sectionId) {
  const sections = [...document.querySelectorAll(".settings-section")];
  if (!sections.some((section) => section.id === sectionId)) return;
  sectionLinks.forEach((link) => {
    const active = link.dataset.sectionLink === sectionId;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  sections.forEach((section) => { section.hidden = !showAllSettingsSections && section.id !== sectionId; });
  settingsViewToggle.setAttribute("aria-checked", String(showAllSettingsSections));
  const hintKey = showAllSettingsSections ? "Everything on one page" : "One section at a time";
  settingsViewHint.dataset.i18n = hintKey;
  settingsViewHint.textContent = t(hintKey);
}

function getSelectedSettingsSection() {
  const candidates = [location.hash.slice(1), sessionStorage.getItem(ACTIVE_SETTINGS_SECTION_KEY), "method"];
  return candidates.find((sectionId) => document.getElementById(sectionId)?.matches(".settings-section")) || "method";
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
  const urlParam = line.match(/\burl=(\S+)/i)?.[1];
  const webtunnelHost = urlParam ? (() => { try { return new URL(urlParam).hostname; } catch { return null; } })() : null;
  return {
    transport: vanilla ? "none" : (first || "Bridge"),
    address: vanilla ? first : (parts[offset + 1] || ""),
    fingerprint: vanilla ? (parts[offset + 1] || "") : (parts[offset + 2] || ""),
    iat,
    webtunnelHost
  };
}

const KNOWN_TRANSPORTS = new Set(["obfs4", "webtunnel", "snowflake", "meek_lite"]);
// Vanilla bridges must use a numeric IP (matching the native Swift/Python parsers).
const VANILLA_ADDRESS_RE = /^(\[[\da-f:]+\]|[\d.]+):\d{1,5}$/i;

function validPort(address) {
  const port = Number(address.split(":").at(-1));
  return port >= 1 && port <= 65535;
}

function isBridgeLineValid(line) {
  const normalizedLine = line.trim();
  if (!/^[A-Za-z0-9 .:/?=&,+_%\-\[\]]+$/.test(normalizedLine)) return false;
  const parts = normalizedLine.split(/\s+/);
  const offset = parts[0] === "Bridge" ? 1 : 0;
  const first = parts[offset] || "";
  if (KNOWN_TRANSPORTS.has(first.toLowerCase())) return parts.length > offset + 1;
  // Vanilla: first token must be a numeric IP:port within valid port range
  return VANILLA_ADDRESS_RE.test(first) && validPort(first);
}

function bridgeNumberForLine(line, index) {
  const originalIndex = bridgeLines.indexOf(line);
  return (originalIndex >= 0 ? originalIndex : index) + 1;
}

function pingDescription(line) {
  const result = pingResults.get(line);
  if (result === undefined) return { label: t("Not tested"), level: 0, timeout: false };
  if (result === null) return { label: t("Timed out"), level: 0, timeout: true };
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
  bridgeSummaryCountNode.textContent = t("{n} saved", { n: bridgeLines.length });
  bridgeSectionHeadingNode.hidden = bridgeLines.length === 0;
  pingButton.disabled = isPingingBridges;
  copyAllButton.disabled = isCopyingAllBridges;
  clearButton.disabled = false;
  if (!bridgeLines.length) {
    const empty = document.createElement("p");
    empty.className = "bridge-list-empty";
    empty.textContent = t("No bridges yet. Import them from a file or your clipboard.");
    bridgeListNode.append(empty);
    return;
  }

  let connectedBridgeLine = "";
  if (connectedBridgeFingerprint) {
    const matches = bridgeLines.filter((line) => parseBridgeLine(line).fingerprint.toLowerCase() === connectedBridgeFingerprint);
    if (matches.length === 1) connectedBridgeLine = matches[0];
  }
  if (!connectedBridgeLine && connectedBridgeAddress) {
    const matches = bridgeLines.filter((line) => parseBridgeLine(line).address.toLowerCase() === connectedBridgeAddress);
    if (matches.length === 1) connectedBridgeLine = matches[0];
  }

  bridgeLines.forEach((line, index) => {
    const numberLabel = bridgeNumberForLine(line, index);
    const parts = parseBridgeLine(line);
    const connected = connectedBridgeLine
      ? line === connectedBridgeLine
      : !connectedBridgeFingerprint && !connectedBridgeAddress && connectedBridgeIndex === numberLabel;
    const enabled = !disabledBridgeLines.has(line);
    const item = document.createElement("article");
    item.className = "settings-bridge-item";
    item.dataset.enabled = String(enabled);
    if (connected) item.dataset.connected = "true";

    const number = document.createElement("span");
    number.className = "bridge-number";
    number.textContent = String(numberLabel);
    number.setAttribute("aria-label", t("Bridge {n}", { n: numberLabel }) + (connected ? ", " + t("currently in use") : ""));
    if (connected) number.title = t("Currently connected bridge");

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
      invalidBadge.textContent = t("Invalid");
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
      flag.title = countryBadge.title = t("Approximate bridge country: {country}", { country: countryName });
      flag.setAttribute("aria-label", t("Approximate bridge country: {country}", { country: countryName }));
      primary.append(flag, countryBadge);
    }
    const fingerprintRow = document.createElement("div");
    fingerprintRow.className = "bridge-fingerprint-row";
    const fingerprint = document.createElement("span");
    fingerprint.className = "bridge-fingerprint";
    const shortFingerprint = parts.fingerprint.length > 18
      ? `${parts.fingerprint.slice(0, 8)}…${parts.fingerprint.slice(-6)}` : parts.fingerprint;
    fingerprint.textContent = parts.webtunnelHost
      ? parts.webtunnelHost
      : parts.iat ? `${shortFingerprint} · iat-mode ${parts.iat}` : shortFingerprint || t("Bridge details unavailable");
    fingerprint.title = line;
    fingerprintRow.append(fingerprint);
    if (connected) {
      const inUse = document.createElement("span");
      inUse.className = "bridge-in-use";
      inUse.textContent = t("In use");
      fingerprintRow.append(inUse);
    }
    main.append(primary, fingerprintRow);

    const ping = pingDescription(line);
    const pingNode = document.createElement("span");
    pingNode.className = "bridge-ping";
    pingNode.dataset.level = String(ping.level);
    pingNode.dataset.timeout = String(ping.timeout);
    pingNode.setAttribute("aria-label", t("Ping: {label}", { label: ping.label }));
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
    toggle.setAttribute("aria-label", t("Use Bridge {n}", { n: numberLabel }));
    toggle.title = !valid ? t("Bridge line is invalid") : enabled ? t("Bridge is included in connections") : t("Bridge is excluded from connections");
    toggle.disabled = !valid;
    toggle.addEventListener("click", () => {
      if (!enabled && allEnabledLines().length >= MAX_ENABLED_BRIDGES) {
        showClipboardStatus(t("Up to {n} bridges may be enabled at a time. Disable one to enable another.", { n: MAX_ENABLED_BRIDGES }), "error");
        return;
      }
      if (enabled && selectedMode === "manual" && allEnabledLines().length <= 1) {
        showClipboardStatus(t("Keep at least one bridge enabled when using bridge lines."), "error");
        return;
      }
      if (enabled) disabledBridgeLines.add(line);
      else disabledBridgeLines.delete(line);
      preferences.disabledBridges = [...disabledBridgeLines];
      if (disabledBridgeLines.has(preferences.selectedBridge)) {
        preferences.selectedBridge = allEnabledLines()[0] || "";
      }
      renderBridgeList();
      showClipboardStatus(enabled ? t("Bridge {n} excluded. Save changes to apply it.", { n: numberLabel }) : t("Bridge {n} included. Save changes to apply it.", { n: numberLabel }), "success");
      markDirty();
    });

    const actions = document.createElement("div");
    actions.className = "bridge-row-actions";
    const copyButton = makeIconButton("copy-bridge", t("Copy Bridge {n}", { n: numberLabel }), '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3"/></svg>');
    copyButton.addEventListener("click", async () => {
      copyButton.disabled = true;
      try {
        const allowed = await requestClipboardPermission("clipboardWrite");
        if (!allowed) {
          showClipboardStatus(t("Allow clipboard access to copy this bridge."), "error");
          return;
        }
        await navigator.clipboard.writeText(line);
        copyButton.classList.add("is-copied");
        copyButton.setAttribute("aria-label", t("Bridge {n} copied", { n: numberLabel }));
        copyButton.title = t(t("Copied"));
        showClipboardStatus(t("Bridge {n} copied.", { n: numberLabel }), "success");
        clearTimeout(copiedTimers.get(line));
        copiedTimers.set(line, window.setTimeout(() => {
          copyButton.classList.remove("is-copied");
          copyButton.setAttribute("aria-label", t("Copy Bridge {n}", { n: numberLabel }));
          copyButton.title = t("Copy Bridge {n}", { n: numberLabel });
          copiedTimers.delete(line);
        }, 1400));
      } catch {
        showClipboardStatus(t("Could not copy the bridge. Check Chrome’s clipboard permission and try again."), "error");
      } finally {
        copyButton.disabled = false;
      }
    });
    const removeButton = makeIconButton("remove-bridge", `Remove Bridge ${numberLabel}`, '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>');
    removeButton.addEventListener("click", () => {
      if (!window.confirm(t("Remove Bridge {n}? This will save the change.", { n: numberLabel }))) return;
      bridgeLines.splice(index, 1);
      disabledBridgeLines.delete(line);
      pingResults.delete(line);
      countryResults.delete(line);
      renderBridgeList();
      markDirty();
      saveBridgeList(t("Bridge removed and saved. Changes apply the next time you connect."));
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

function fullRecordPreferences() {
  const nextPreferences = storedPreferences();
  // These settings are saved immediately by their own controls. Keep a full
  // bridge/mode save from persisting a stale optimistic value for them.
  delete nextPreferences.killSwitch;
  delete nextPreferences.autoBridgeFailover;
  delete nextPreferences.siteCheckIntervalMinutes;
  return nextPreferences;
}

function adoptSavedPreferences(savedPreferences) {
  preferences = {
    ...savedPreferences,
    // A field save may be queued behind this full-record save. Preserve its
    // current optimistic value until that field save confirms or rolls back.
    killSwitch: preferences.killSwitch,
    autoBridgeFailover: preferences.autoBridgeFailover,
    siteCheckIntervalMinutes: preferences.siteCheckIntervalMinutes
  };
  renderKillSwitch();
  renderConnectionHealth();
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
    exitCountryCurrentNode.textContent = t("Automatic");
    exitCountryCardNode.dataset.on = "false";
    exitCountryNoticeNode.hidden = true;
    if (exitCountryNavBadge) exitCountryNavBadge.textContent = t("Auto");
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
    savePreferenceField("exitCountry", code, (saved) => {
      if (!saved) {
        if (preferences.exitCountry === code) preferences = { ...preferences, exitCountry: prevCode };
        renderExitCountry();
        return;
      }
      if (isConnected) showChangeBanner(t("Exit country changed. Reconnect now to apply it."));
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
  protectionNavBadge.textContent = on ? t("On") : t("Off");
}

function renderConnectionHealth() {
  const failoverEnabled = preferences.autoBridgeFailover !== false;
  const bridgeMode = selectedMode === "manual";
  const title = bridgeMode ? "Automatically try another bridge" : "Automatically retry Snowflake";
  const description = bridgeMode
    ? "Try another enabled bridge when connection verification fails."
    : "Reconnect Snowflake when connection verification fails.";
  autoBridgeFailoverToggle.setAttribute("aria-checked", String(failoverEnabled));
  autoBridgeFailoverTitle.textContent = t(title);
  autoBridgeFailoverDescription.textContent = t(description);
  autoBridgeFailoverToggle.setAttribute("aria-label", t(title));
  connectionHealthDescription.textContent = t("Choose how often your connection is verified and what to do if verification fails.");
  connectionHealthCard.dataset.on = String(failoverEnabled);
  autoBridgeFailoverNavBadge.textContent = t(failoverEnabled ? "On" : "Off");
  const interval = normalizeSiteCheckInterval(preferences.siteCheckIntervalMinutes);
  siteCheckIntervalValue.textContent = String(interval);
  siteCheckIntervalValue.setAttribute("aria-valuenow", String(interval));
  siteCheckIntervalUnit.textContent = t(interval === 1 ? "minute" : "minutes");
  decreaseSiteCheckIntervalButton.disabled = interval <= 1;
  increaseSiteCheckIntervalButton.disabled = interval >= 60;
  renderConnectionHealthStatus();
}

function relativeCheckTime(timestamp) {
  if (!timestamp) return "";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const unit = elapsedSeconds < 60 ? "second" : elapsedSeconds < 3600 ? "minute" : elapsedSeconds < 86400 ? "hour" : "day";
  const value = unit === "second" ? elapsedSeconds
    : unit === "minute" ? Math.floor(elapsedSeconds / 60)
      : unit === "hour" ? Math.floor(elapsedSeconds / 3600) : Math.floor(elapsedSeconds / 86400);
  const locale = globalThis.torI18n?.language || navigator.language || "en";
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-value, unit);
}

function renderConnectionHealthStatus() {
  checkSitesNowButton.disabled = manualSiteCheckPending;
  checkSitesNowButton.textContent = t(manualSiteCheckPending ? "Checking…" : "Check now");
  let label;
  let state;
  if (manualSiteCheckPending || siteCheckState === "pending" || isConnected && !siteCheckState) {
    label = t("Checking sites…");
    state = "checking";
  } else if (siteCheckState === "unavailable") {
    label = t("Connection unavailable");
    state = "failed";
  } else if (!isConnected) {
    label = t("Not connected");
    state = "idle";
  } else if (["passed", "limited", "failed"].includes(siteCheckState)) {
    const statusKey = siteCheckState === "passed" ? "Connection verified"
      : siteCheckState === "limited" ? "Connected · some sites may be limited"
        : "Connected, but sites aren't loading";
    const status = t(statusKey);
    const time = relativeCheckTime(siteCheckCompletedAt);
    label = time ? `${t("Last check {time}", { time })} · ${status}` : status;
    state = siteCheckState;
  } else {
    label = t("Checking sites…");
    state = "checking";
  }
  siteCheckStatusNode.dataset.state = state;
  siteCheckStatusTextNode.textContent = label;
}

function updateConnectionHealthStatus(result) {
  isConnected = result?.state === "connected";
  if (!result) {
    siteCheckState = "unavailable";
    siteCheckCompletedAt = 0;
  } else if (result.state === "connected") {
    siteCheckState = result.connectivityCheck || "pending";
    if (siteCheckState === "failed" && Array.isArray(result.siteChecks)) {
      const failedCount = result.siteChecks.filter((site) => site.state === "failed").length;
      if (failedCount > 0 && failedCount < result.siteChecks.length) siteCheckState = "limited";
    }
    siteCheckCompletedAt = Number(result.connectivityCheckCompletedAt) || 0;
  } else if (result.state === "starting" || result.bridgeActivity === "trying") {
    siteCheckState = "pending";
    siteCheckCompletedAt = 0;
  } else {
    siteCheckState = "";
    siteCheckCompletedAt = 0;
  }
  renderConnectionHealthStatus();
}

function changeSiteCheckInterval(delta) {
  const previous = normalizeSiteCheckInterval(preferences.siteCheckIntervalMinutes);
  const minutes = Math.max(1, Math.min(60, previous + delta));
  if (minutes === previous) return;
  preferences = { ...preferences, siteCheckIntervalMinutes: minutes };
  renderConnectionHealth();
  savePreferenceField("siteCheckIntervalMinutes", minutes, (saved) => {
    if (!saved && preferences.siteCheckIntervalMinutes === minutes) {
      preferences = { ...preferences, siteCheckIntervalMinutes: confirmedSiteCheckInterval };
      renderConnectionHealth();
    }
  });
}

async function checkSitesNow() {
  if (manualSiteCheckPending) return;
  manualSiteCheckPending = true;
  renderConnectionHealthStatus();
  const result = await send("retestSites");
  manualSiteCheckPending = false;
  updateConnectionHealthStatus(result);
}

function saveSettings() {
  if (allEnabledLines().length > MAX_ENABLED_BRIDGES) {
    const message = t("Up to {n} bridges may be enabled at a time. Disable one to enable another.", { n: MAX_ENABLED_BRIDGES });
    markSaveState(message, "error");
    showClipboardStatus(message, "error");
    return;
  }
  if (selectedMode === "manual" && !allEnabledLines().length) {
    markSaveState(t("Enable at least one bridge to use bridge lines."), "error");
    return;
  }
  markSaveState(t("Saving changes…"));
  saveButton.disabled = true;
  const nextPreferences = fullRecordPreferences();
  savePreferences(nextPreferences, (saved, savedPreferences) => {
    if (!saved) {
      saveButton.disabled = false;
      isDirty = true;
      markSaveState(t("Could not save settings. Try again."), "error");
      return;
    }
    saveButton.disabled = false;
    adoptSavedPreferences(savedPreferences);
    isDirty = false;
    markSaveState(t("All changes saved"));
    if (isConnected) showChangeBanner(t("Settings saved. Reconnect now to apply them."));
    renderBridgeList();
  });
}

function saveBridgeList(successMessage, kind = "success") {
  if (allEnabledLines().length > MAX_ENABLED_BRIDGES) {
    const message = t("Up to {n} bridges may be enabled at a time. Disable one to enable another.", { n: MAX_ENABLED_BRIDGES });
    isDirty = true;
    markSaveState(message, "error");
    showClipboardStatus(message, "error");
    return;
  }
  const revision = ++bridgeSaveRevision;
  const nextPreferences = fullRecordPreferences();
  savePreferences(nextPreferences, (saved, savedPreferences) => {
    if (revision !== bridgeSaveRevision) return;
    if (!saved) {
      isDirty = true;
      markSaveState(t("Could not save settings. Try again."), "error");
      showClipboardStatus(t("Could not save bridge changes."), "error");
      return;
    }
    adoptSavedPreferences(savedPreferences);
    isDirty = false;
    markSaveState(t("All changes saved"));
    showClipboardStatus(successMessage, kind);
    if (isConnected) showChangeBanner(t("Bridge lines changed. Reconnect now to apply them."));
    renderBridgeList();
  });
}

function importBridgeText(text, sourceName = t("Clipboard")) {
  const incoming = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!incoming.length) {
    showClipboardStatus(t("{source} has no bridge lines.", { source: sourceName }), "error");
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
    if (duplicateCount) parts.push(t("{n} duplicate {lines} skipped", { n: duplicateCount, lines: duplicateCount === 1 ? t("line") : t("lines") }));
    if (invalidCount) parts.push(t("{n} invalid {lines} skipped", { n: invalidCount, lines: invalidCount === 1 ? t("line") : t("lines") }));
    showClipboardStatus(t("No new bridges. {details}.", { details: parts.join(", ") }), invalidCount ? "warning" : "");
    return;
  }
  let enabledCount = allEnabledLines().length;
  let disabledByLimit = 0;
  imported.forEach((line) => {
    bridgeLines.push(line);
    if (enabledCount >= MAX_ENABLED_BRIDGES) {
      disabledBridgeLines.add(line);
      disabledByLimit++;
    } else {
      enabledCount++;
    }
  });
  renderBridgeList();
  markDirty();
  const countText = t("{n} {bridges} added and saved.", { n: imported.length, bridges: imported.length === 1 ? t("bridge") : t("bridges") });
  const skippedParts = [];
  if (duplicateCount) skippedParts.push(t("{n} duplicate {lines}", { n: duplicateCount, lines: duplicateCount === 1 ? t("line") : t("lines") }));
  if (invalidCount) skippedParts.push(t("{n} invalid {lines}", { n: invalidCount, lines: invalidCount === 1 ? t("line") : t("lines") }));
  const savedText = disabledByLimit
    ? t("{n} imported bridge lines were left disabled; up to {limit} bridges can be enabled.", { n: disabledByLimit, limit: MAX_ENABLED_BRIDGES })
    : skippedParts.length ? t("{count} {skipped} skipped.", { count: countText, skipped: skippedParts.join(t(" and ")) }) : countText;
  saveBridgeList(savedText, invalidCount ? "warning" : "success");
}

pasteButton.addEventListener("click", async () => {
  setImportMenuOpen(false);
  pasteButton.disabled = true;
  showClipboardStatus("");
  try {
    const allowed = await requestClipboardPermission("clipboardRead");
    if (!allowed) {
      showClipboardStatus(t("Allow clipboard access to import bridge lines."), "error");
      return;
    }
    importBridgeText(await navigator.clipboard.readText());
  } catch {
    showClipboardStatus(t("Could not read the clipboard. Check Chrome’s clipboard permission and try again."), "error");
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
    showClipboardStatus(t("Could not read {name}. Choose a plain text bridge file.", { name: file.name }), "error");
  }
});

copyAllButton.addEventListener("click", async () => {
  if (!bridgeLines.length || isCopyingAllBridges) return;
  const copyStartedAt = Date.now();
  clearTimeout(copyAllSuccessTimer);
  copyAllButton.classList.remove("is-copied");
  copyAllButtonLabel.textContent = t("Copy all");
  isCopyingAllBridges = true;
  copyAllButton.disabled = true;
  showClipboardStatus("");
  try {
    const allowed = await requestClipboardPermission("clipboardWrite");
    if (!allowed) {
      showClipboardStatus(t("Allow clipboard access to copy bridges."), "error");
      return;
    }
    await navigator.clipboard.writeText(bridgeLines.join("\n"));
    copyAllButton.classList.add("is-copied");
    copyAllButtonLabel.textContent = t(t("Copied"));
    copyAllSuccessTimer = setTimeout(() => {
      copyAllButton.classList.remove("is-copied");
      copyAllButtonLabel.textContent = t("Copy all");
    }, 1200);
    showClipboardStatus(t("All bridges copied."), "success");
  } catch {
    showClipboardStatus(t("Could not copy bridges. Check Chrome’s clipboard permission and try again."), "error");
  } finally {
    const remainingBusyTime = 500 - (Date.now() - copyStartedAt);
    if (remainingBusyTime > 0) await new Promise((resolve) => setTimeout(resolve, remainingBusyTime));
    isCopyingAllBridges = false;
    renderBridgeList();
  }
});

clearButton.addEventListener("click", () => {
  if (!bridgeLines.length) return;
  if (!window.confirm(t("Remove all bridge lines? This will save the change."))) return;
  bridgeLines = [];
  disabledBridgeLines.clear();
  pingResults.clear();
  countryResults.clear();
  preferences.selectedBridge = "";
  renderBridgeList();
  markDirty();
  saveBridgeList(t("All bridges removed and saved. Changes apply the next time you connect."));
});

pingButton.addEventListener("click", () => {
  if (!bridgeLines.length || isPingingBridges) return;
  const pingStartedAt = Date.now();
  isPingingBridges = true;
  pingButtonLabel.textContent = t("Pinging");
  pingButton.disabled = true;
  pingButton.setAttribute("aria-busy", "true");
  const finishPinging = () => {
    const remainingBusyTime = 500 - (Date.now() - pingStartedAt);
    setTimeout(() => {
      isPingingBridges = false;
      pingButton.removeAttribute("aria-busy");
      pingButtonLabel.textContent = t("Ping all");
      renderBridgeList();
    }, Math.max(0, remainingBusyTime));
  };
  const validLines = allEnabledLines();
  if (!validLines.length) { finishPinging(); return; }
  chrome.runtime.sendMessage({ type: "pingBridges", bridges: validLines.join("\n") }, async (result) => {
    if (chrome.runtime.lastError || !result?.ok || !Array.isArray(result.results)) {
      showClipboardStatus(result?.error || t("Could not ping bridges."), "error");
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
    saveBridgeList(t("Sorted fastest first and saved."));
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
      updateConnectionHealthStatus(null);
      setConnectionBadge(t("Connection unavailable"), "error", t("Could not check the Tor connection. Restart your browser and check the helper installation."));
      diagnosticTextNode.textContent = chrome.runtime.lastError.message;
      hideChangeBanner();
      scheduleStatusRefresh();
      return;
    }
    const diagnosticLines = Array.isArray(result?.diagnostics) ? result.diagnostics : [];
    const hasReportedBridge = Number(result?.currentBridgeIndex) > 0
      || Boolean(result?.bridgeAddress || result?.bridgeFingerprint);
    const active = result?.ok && (result.state === "connected"
      || result.state === "starting" && (result.bridgeActivity === "connected" || hasReportedBridge));
    connectedBridgeAddress = active && typeof result.bridgeAddress === "string" ? result.bridgeAddress.toLowerCase() : "";
    connectedBridgeFingerprint = active && typeof result.bridgeFingerprint === "string" ? result.bridgeFingerprint.toLowerCase() : "";
    if (active) {
      const reportedIndex = Number(result.currentBridgeIndex) || 0;
      if (selectedMode === "manual" && reportedIndex > 0) {
        const activeLine = allEnabledLines()[reportedIndex - 1];
        connectedBridgeIndex = activeLine ? bridgeLines.indexOf(activeLine) + 1 : null;
      } else {
        connectedBridgeIndex = reportedIndex || null;
      }
    } else {
      connectedBridgeIndex = null;
    }
    isConnected = result?.state === "connected";
    updateConnectionHealthStatus(result);
    renderBridgeList();
    diagnosticTextNode.textContent = diagnosticLines.length ? diagnosticLines.join("\n")
      : result?.error || result?.message || t("No additional Tor diagnostics are available.");

    if (!result?.ok || result.state === "failed" || result.state === "missing_runtime") {
      setConnectionBadge(t("Connection needs attention"), "error", result?.error || result?.message || t("Tor could not connect."));
    } else if (result.state === "connected") {
      const bridgeLabel = selectedMode === "manual" && connectedBridgeIndex ? ` · ` + t("Bridge {n}", { n: connectedBridgeIndex })
        : selectedMode === "snowflake" ? " · Snowflake" : "";
      const activity = result.bridgeActivity === "trying" ? t("Reconnecting") : t("Connected");
      const connectedTooltip = result.bridgeActivity === "trying"
        ? t("Tor is reconnecting through a bridge.")
        : bridgeLabel
          ? t("Tor is connected through {route}.", { route: bridgeLabel.slice(3) })
          : t("Tor is connected.");
      setConnectionBadge(`${activity}${bridgeLabel}`, result.bridgeActivity === "trying" ? "starting" : "connected", connectedTooltip);
    } else if (result.state === "starting") {
      setConnectionBadge(result.bridgeActivity === "trying" ? t("Reconnecting…") : t("Connecting…"), "starting", result.message || t("Tor is connecting."));
    } else {
      setConnectionBadge(t("Not connected"), "disconnected", t("Tor is disconnected."));
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
  const enabled = allEnabledLines();
  if (enabled.length > MAX_ENABLED_BRIDGES) {
    showClipboardStatus(t("Up to {n} bridges may be enabled at a time. Disable one to enable another.", { n: MAX_ENABLED_BRIDGES }), "error");
    return;
  }
  if (selectedMode === "manual" && !enabled.length) {
    showClipboardStatus(t("Enable at least one bridge before reconnecting."), "error");
    return;
  }
  const bridges = enabled.join("\n");
  reconnectNowButton.disabled = true;
  hideChangeBanner();
  setConnectionBadge(t("Reconnecting…"), "starting", t("Restarting Tor with the saved settings."));
  const stopped = await send("disconnect");
  if (!stopped?.ok) {
    setConnectionBadge(t("Could not reconnect"), "error", stopped?.error || t("Could not stop the current connection."));
    reconnectNowButton.disabled = false;
    return;
  }
  const result = await send("connect", { mode: selectedMode, bridges, selectedBridgeIndex: null, exitCountry: preferences.exitCountry || "" });
  if (!result?.ok) setConnectionBadge(t("Connection needs attention"), "error", result?.error || "Could not reconnect.");
  else setConnectionBadge(t("Connecting…"), "starting", result.message || "Tor is reconnecting.");
  reconnectNowButton.disabled = false;
  sendStatus();
}

reconnectNowButton.addEventListener("click", reconnectUsingSavedSettings);

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const sectionId = link.dataset.sectionLink;
    setActiveSection(sectionId);
    sessionStorage.setItem(ACTIVE_SETTINGS_SECTION_KEY, sectionId);
    history.replaceState(null, "", `#${sectionId}`);
    if (showAllSettingsSections) document.getElementById(sectionId).scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

settingsViewToggle.addEventListener("click", () => {
  showAllSettingsSections = !showAllSettingsSections;
  sessionStorage.setItem(SHOW_ALL_SETTINGS_SECTIONS_KEY, String(showAllSettingsSections));
  setActiveSection(getSelectedSettingsSection());
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  if (!showAllSettingsSections) return;
  const visibleSections = [...document.querySelectorAll(".settings-section:not([hidden])")];
  const current = visibleSections.find((section) => section.getBoundingClientRect().top >= 0)
    || visibleSections.at(-1);
  if (!current || current.id === getSelectedSettingsSection()) return;
  sectionLinks.forEach((link) => {
    const active = link.dataset.sectionLink === current.id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  sessionStorage.setItem(ACTIVE_SETTINGS_SECTION_KEY, current.id);
  history.replaceState(null, "", `#${current.id}`);
}, { passive: true });

killSwitchToggle.addEventListener("click", () => {
  const next = !(preferences.killSwitch === true);
  preferences = { ...preferences, killSwitch: next };
  renderKillSwitch();
  savePreferenceField("killSwitch", next, (saved) => {
    if (!saved && preferences.killSwitch === next) {
      preferences = { ...preferences, killSwitch: confirmedKillSwitch };
      renderKillSwitch();
    }
  });
});

autoBridgeFailoverToggle.addEventListener("click", () => {
  const previous = preferences.autoBridgeFailover !== false;
  const next = !previous;
  preferences = { ...preferences, autoBridgeFailover: next };
  renderConnectionHealth();
  savePreferenceField("autoBridgeFailover", next, (saved) => {
    if (!saved && preferences.autoBridgeFailover === next) {
      preferences = { ...preferences, autoBridgeFailover: previous };
      renderConnectionHealth();
    }
  });
});

decreaseSiteCheckIntervalButton.addEventListener("click", () => changeSiteCheckInterval(-1));
increaseSiteCheckIntervalButton.addEventListener("click", () => changeSiteCheckInterval(1));
checkSitesNowButton.addEventListener("click", checkSitesNow);

document.addEventListener("tor-language-changed", () => { setActiveSection(getSelectedSettingsSection()); renderBridgeList(); renderExitCountry(); renderKillSwitch(); renderConnectionHealth(); loadDonationAddresses(); });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.torConnectionPreferences) return;
  const saved = { ...(changes.torConnectionPreferences.newValue || {}) };
  confirmedKillSwitch = saved.killSwitch === true;
  confirmedSiteCheckInterval = normalizeSiteCheckInterval(saved.siteCheckIntervalMinutes);
  if (isDirty) return;
  delete saved.autoBridgeSelection;
  bridgeLines = typeof saved.bridges === "string" ? saved.bridges.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
  disabledBridgeLines = new Set(Array.isArray(saved.disabledBridges)
    ? saved.disabledBridges.filter((line) => bridgeLines.includes(line)) : []);
  preferences = {
    ...saved,
    mode: saved.mode === "manual" ? "manual" : "snowflake",
    bridges: bridgeLines.join("\n"),
    disabledBridges: [...disabledBridgeLines],
    selectedBridge: typeof saved.selectedBridge === "string" ? saved.selectedBridge : allEnabledLines()[0] || "",
    killSwitch: saved.killSwitch === true,
    exitCountry: typeof saved.exitCountry === "string" ? saved.exitCountry : "",
    autoBridgeFailover: saved.autoBridgeFailover === true,
    siteCheckIntervalMinutes: normalizeSiteCheckInterval(saved.siteCheckIntervalMinutes)
};
selectedMode = preferences.mode;
setMode(selectedMode);
renderBridgeList();
renderKillSwitch();
renderConnectionHealth();
renderExitCountry();
});

setActiveSection(getSelectedSettingsSection());

loadDonationAddresses();
readPreferences().then(sendStatus);

// Community and support section
{
  const isFirefox = typeof browser !== "undefined" && typeof browser.runtime?.getBrowserInfo === "function";
  const rateLink = document.querySelector("#rateLink");
  const storeNameChip = document.querySelector("#storeNameChip");
  const communityVersion = document.querySelector("#communityVersion");
  const storeUrl = isFirefox
    ? "https://addons.mozilla.org/firefox/addon/tor-connect/"
    : "https://chromewebstore.google.com/detail/bpakflmhpekikajckcncjgknbjebhkjm";
  if (rateLink) rateLink.href = storeUrl;
  if (communityVersion) communityVersion.textContent = t("Version {version}", { version: chrome.runtime.getManifest().version });

  function renderCommunitySection() {
    if (!rateLink || !storeNameChip) return;
    const storeName = isFirefox ? t("Firefox Add-ons") : t("Chrome Web Store");
    rateLink.setAttribute("aria-label", t("Rate Tor Connect on {store}, opens in a new tab", { store: storeName }));
    storeNameChip.textContent = storeName;
  }
  renderCommunitySection();
  document.addEventListener("tor-language-changed", renderCommunitySection);
}

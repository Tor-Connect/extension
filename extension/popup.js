const statusNode = document.querySelector("#status");
const routeCardNode = document.querySelector("#routeCard");
const snowflakeInfoNode = document.querySelector("#snowflakeInfo");
const snowflakeInfoTextNode = document.querySelector("#snowflakeInfoText");
const errorDetailsNode = document.querySelector("#errorDetails");
const errorTextNode = document.querySelector("#errorText");
const routeLabelNode = document.querySelector("#routeLabel");
const routeIdentityNode = document.querySelector(".route-identity");
const routeNameNode = document.querySelector("#routeName");
const routeDetailNode = document.querySelector("#routeDetail");
const bridgeCountryFlagNode = document.querySelector("#bridgeCountryFlag");
const bridgeAttemptTimerNode = document.querySelector("#bridgeAttemptTimer");
const connectedDurationNode = document.querySelector("#connectedDuration");
const statusDetailNode = document.querySelector("#statusDetail");
const metaSeparatorNode = document.querySelector(".meta-separator");
const orbitNodesNode = document.querySelector("#orbitNodes");
const orbitFlowNode = document.querySelector("#orbitFlow");
const methodSwitchNode = document.querySelector("#connectionMethodSwitch");
const methodButtons = [...document.querySelectorAll(".connection-method-option")];
const emptyBridgeInfoNode = document.querySelector("#emptyBridgeInfo");
const addBridgesButton = document.querySelector("#addBridges");
const autoBridgeHintNode = document.querySelector("#autoBridgeHint");
const copyBridgeButton = document.querySelector("#copyBridge");
const connectionToggle = document.querySelector("#connectionToggle");
const connectionProgress = document.querySelector("#connectionProgress");
const popupMainNode = document.querySelector(".popup-main");
const setupPanelNode = document.querySelector("#setupPanel");
const setupDescriptionNode = document.querySelector("#setupDescription");
const openFullScreenButton = document.querySelector("#openFullScreen");
const openSettingsButton = document.querySelector("#openSettings");
const firefoxPermissionPanelNode = document.querySelector("#firefoxPermissionPanel");
const firefoxPermissionTitleNode = document.querySelector("#firefoxPermissionTitle");
const firefoxPermissionSubtitleNode = document.querySelector("#firefoxPermissionSubtitle");
const copyAboutAddonsButton = document.querySelector("#copyAboutAddons");
const keepPermissionStepsOpenButton = document.querySelector("#keepPermissionStepsOpen");
const showPermissionErrorDetailsButton = document.querySelector("#showPermissionErrorDetails");
const permissionErrorBackdropNode = document.querySelector("#permissionErrorBackdrop");
const permissionErrorSheetNode = document.querySelector("#permissionErrorSheet");
const closePermissionErrorDetailsButton = document.querySelector("#closePermissionErrorDetails");
const permissionErrorTextNode = document.querySelector("#permissionErrorText");
const copyPermissionErrorDetailsButton = document.querySelector("#copyPermissionErrorDetails");
const isFirefoxExtension = typeof browser !== "undefined" && typeof browser.runtime?.getBrowserInfo === "function";
const bridgeSelectorNode = document.querySelector("#bridgeSelector");
const statsToggleNode = document.querySelector("#statsToggle");
const liveStatsNode = document.querySelector("#liveStats");
const statsBackdropNode = document.querySelector("#statsBackdrop");
const closeStatsNode = document.querySelector("#closeStats");
const siteCheckSheetNode = document.querySelector("#siteCheckSheet");
const siteCheckBackdropNode = document.querySelector("#siteCheckBackdrop");
const closeSiteCheckNode = document.querySelector("#closeSiteCheck");
const siteCheckBadgeNode = document.querySelector("#siteCheckBadge");
const siteCheckSummaryNode = document.querySelector("#siteCheckSummary");
const siteCheckRowsNode = document.querySelector("#siteCheckRows");
const siteCheckCountNode = document.querySelector("#siteCheckCount");
const nextRouteNode = document.querySelector("#nextRoute");
let statsPollTimer;
let lastStatsSample;
const autoBridgeSelectionNode = document.querySelector("#autoBridgeSelection");
let pollTimer;
let initialStatusPending = true;
let initialStatusRetries = 0;
let preferences = { mode: "snowflake", bridges: "", autoBridgeSelection: true, selectedBridge: "", disabledBridges: [], exitCountry: "" };
let currentState = "disconnected";
let currentResult = {};
let bridgeCountries = new Map();
let bridgeCountryRequestRevision = 0;
let orbitRoutePosition = -1;
let orbitRouteRotation = 0;
let bridgeAttemptStartedAt = 0;
let bridgeAttemptStoragePending = false;
let bridgeAttemptTimerInterval;
let connectedDurationStartedAt = 0;
let connectedDurationInterval;
let routeBridgeLine = "";
let lastShownPosition = -1;
let copyFeedbackTimer;
let statsCopyFeedbackTimer;
let firefoxPermissionPollTimer;
let firefoxPermissionSuccessTimer;

function closePermissionErrorDetails(restoreFocus = true) {
  const wasOpen = !permissionErrorSheetNode.hidden;
  permissionErrorSheetNode.hidden = true;
  permissionErrorBackdropNode.hidden = true;
  showPermissionErrorDetailsButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && wasOpen) showPermissionErrorDetailsButton.focus();
}

function openPermissionErrorDetails() {
  permissionErrorTextNode.textContent = "Private browsing access is off for this add-on. Firefox blocks proxy control until it is allowed.";
  permissionErrorBackdropNode.hidden = false;
  permissionErrorSheetNode.hidden = false;
  showPermissionErrorDetailsButton.setAttribute("aria-expanded", "true");
  closePermissionErrorDetailsButton.focus();
}

async function copyPermissionText(text, button) {
  button.disabled = true;
  try {
    const allowed = await new Promise((resolve) => chrome.permissions.request({ permissions: ["clipboardWrite"] }, resolve));
    if (!allowed) throw new Error("Clipboard permission was not granted");
    await navigator.clipboard.writeText(text);
    button.classList.add("is-copied");
    button.setAttribute("aria-label", "Copied");
    window.setTimeout(() => {
      button.classList.remove("is-copied");
      button.removeAttribute("aria-label");
    }, 1500);
  } catch {
    button.title = "Could not copy text";
    window.setTimeout(() => { button.removeAttribute("title"); }, 1800);
  } finally {
    button.disabled = false;
  }
}

function hasFirefoxPrivateWindowAccess() {
  const checkAccess = browser.extension?.isAllowedIncognitoAccess;
  return typeof checkAccess === "function"
    ? checkAccess.call(browser.extension).catch(() => false)
    : Promise.resolve(false);
}

function stopFirefoxPermissionWatch() {
  if (firefoxPermissionPollTimer) clearTimeout(firefoxPermissionPollTimer);
  if (firefoxPermissionSuccessTimer) clearTimeout(firefoxPermissionSuccessTimer);
  firefoxPermissionPollTimer = undefined;
  firefoxPermissionSuccessTimer = undefined;
}

async function watchFirefoxPermission() {
  if (firefoxPermissionPanelNode.hidden) return;
  if (await hasFirefoxPrivateWindowAccess()) {
    stopFirefoxPermissionWatch();
    firefoxPermissionPanelNode.classList.add("permission-granted");
    firefoxPermissionTitleNode.textContent = "Allowed";
    firefoxPermissionSubtitleNode.textContent = "You’re all set.";
    firefoxPermissionSuccessTimer = window.setTimeout(() => {
      firefoxPermissionPanelNode.hidden = true;
      firefoxPermissionPanelNode.classList.remove("permission-granted");
      firefoxPermissionTitleNode.textContent = "One switch to flip";
      firefoxPermissionSubtitleNode.textContent = "Firefox needs “Run in Private Windows” on to route your traffic, even in normal windows.";
      renderResult({ ok: true, state: "disconnected" });
    }, 1600);
    return;
  }
  firefoxPermissionPollTimer = window.setTimeout(watchFirefoxPermission, 1400);
}

function showFirefoxPermission() {
  stopFirefoxPermissionWatch();
  closePermissionErrorDetails(false);
  permissionErrorTextNode.textContent = "Private browsing access is off for this add-on. Firefox blocks proxy control until it is allowed.";
  popupMainNode.dataset.view = "firefox-permission";
  firefoxPermissionPanelNode.hidden = false;
  firefoxPermissionPanelNode.classList.remove("permission-granted");
  firefoxPermissionTitleNode.textContent = "One switch to flip";
  firefoxPermissionSubtitleNode.textContent = "Firefox needs “Run in Private Windows” on to route your traffic, even in normal windows.";
  setupPanelNode.hidden = true;
  routeCardNode.hidden = true;
  openSettingsButton.hidden = true;
  setToggleState("disconnected");
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
  watchFirefoxPermission();
}

function hideFirefoxPermission() {
  stopFirefoxPermissionWatch();
  closePermissionErrorDetails(false);
  firefoxPermissionPanelNode.hidden = true;
  firefoxPermissionPanelNode.classList.remove("permission-granted");
}

copyAboutAddonsButton.addEventListener("click", () => copyPermissionText("about:addons", copyAboutAddonsButton));
keepPermissionStepsOpenButton.addEventListener("click", () => openFullScreenButton.click());
showPermissionErrorDetailsButton.addEventListener("click", openPermissionErrorDetails);
closePermissionErrorDetailsButton.addEventListener("click", () => closePermissionErrorDetails());
permissionErrorBackdropNode.addEventListener("click", () => closePermissionErrorDetails());
copyPermissionErrorDetailsButton.addEventListener("click", () => copyPermissionText(permissionErrorTextNode.textContent, copyPermissionErrorDetailsButton));
permissionErrorSheetNode.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closePermissionErrorDetails();
  } else if (event.key === "Tab") {
    const focusable = [...permissionErrorSheetNode.querySelectorAll("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Crossfade helper: swaps text immediately while fading out, then fades back in.
// Old text fades out and new text fades in simultaneously — no blank gap.
function fadeText(node, updater) {
  node.style.transition = "none";
  node.style.opacity = "0";
  requestAnimationFrame(() => {
    updater();
    node.style.transition = "";
    requestAnimationFrame(() => { node.style.opacity = ""; });
  });
}

function closeLiveStats() {
  const wasOpen = liveStatsNode.classList.contains("is-open");
  statsToggleNode.setAttribute("aria-expanded", "false");
  statsToggleNode.setAttribute("aria-label", "Open live statistics");
  liveStatsNode.classList.remove("is-open");
  statsBackdropNode.classList.remove("is-open");
  if (statsPollTimer) clearInterval(statsPollTimer);
  statsPollTimer = undefined;
  window.setTimeout(() => {
    if (!liveStatsNode.classList.contains("is-open")) liveStatsNode.hidden = true;
    if (!statsBackdropNode.classList.contains("is-open")) statsBackdropNode.hidden = true;
  }, 300);
  if (wasOpen) (statsToggleNode.hidden ? connectionToggle : statsToggleNode).focus();
}

statsToggleNode.addEventListener("click", () => {
  if (!siteCheckSheetNode.hidden) closeSiteCheck();
  statsToggleNode.setAttribute("aria-expanded", "true");
  statsToggleNode.setAttribute("aria-label", "Close live statistics");
  liveStatsNode.hidden = false;
  statsBackdropNode.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    liveStatsNode.classList.add("is-open");
    statsBackdropNode.classList.add("is-open");
  }));
  closeStatsNode.focus();
  lastStatsSample = undefined;
  refreshLiveStats();
  statsPollTimer = setInterval(refreshLiveStats, 1000);
});
closeStatsNode.addEventListener("click", closeLiveStats);
statsBackdropNode.addEventListener("click", closeLiveStats);

function closeSiteCheck() {
  const wasOpen = siteCheckSheetNode.classList.contains("is-open");
  siteCheckSheetNode.classList.remove("is-open");
  siteCheckBackdropNode.classList.remove("is-open");
  siteCheckBadgeNode.setAttribute("aria-expanded", "false");
  siteCheckSummaryNode.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    if (!siteCheckSheetNode.classList.contains("is-open")) siteCheckSheetNode.hidden = true;
    if (!siteCheckBackdropNode.classList.contains("is-open")) siteCheckBackdropNode.hidden = true;
  }, 300);
  if (wasOpen) (siteCheckSummaryNode.hidden ? connectionToggle : siteCheckSummaryNode).focus();
}

function openSiteCheck() {
  if (liveStatsNode.classList.contains("is-open")) closeLiveStats();
  siteCheckSheetNode.hidden = false;
  siteCheckBackdropNode.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    siteCheckSheetNode.classList.add("is-open");
    siteCheckBackdropNode.classList.add("is-open");
  }));
  siteCheckBadgeNode.setAttribute("aria-expanded", "true");
  siteCheckSummaryNode.setAttribute("aria-expanded", "true");
  closeSiteCheckNode.focus();
}

siteCheckBadgeNode.addEventListener("click", openSiteCheck);
siteCheckSummaryNode.addEventListener("click", openSiteCheck);
closeSiteCheckNode.addEventListener("click", closeSiteCheck);
siteCheckBackdropNode.addEventListener("click", closeSiteCheck);
document.querySelector("#retestSites").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (button.disabled) return;
  button.disabled = true;
  currentResult = {
    ...currentResult,
    connectivityCheck: "pending",
    siteChecks: SITE_CHECK_NAMES.map((site) => ({ site, state: "pending", latencyMs: null }))
  };
  renderResult(currentResult);
  try { renderResult(await send("retestSites")); }
  finally { button.disabled = false; }
});
nextRouteNode.addEventListener("click", async () => {
  nextRouteNode.disabled = true;
  closeSiteCheck();
  if (preferences.mode === "manual") {
    const entries = allBridgeEntries();
    if (entries.length > 1) {
      const enabledEntries = bridgeEntries();
      const active = activeBridgePosition(currentResult, enabledEntries);
      const nextLine = enabledEntries[(active + 1 + enabledEntries.length) % enabledEntries.length] || entries[(selectedBridgePosition(entries) + 1) % entries.length];
      const next = entries.indexOf(nextLine);
      await send("disconnect");
      renderResult(await send("connect", { mode: "manual", bridges: entries[next], selectedBridgeIndex: next + 1 }));
    } else if (entries.length === 1) {
      await send("disconnect");
      renderResult(await connectWithSavedPreferences());
    }
  } else {
    await send("disconnect");
    renderResult(await send("connect", { mode: "snowflake", bridges: "" }));
  }
  nextRouteNode.disabled = false;
});

siteCheckSheetNode.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeSiteCheck();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...siteCheckSheetNode.querySelectorAll("button:not([disabled]):not([hidden])")];
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

liveStatsNode.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeLiveStats();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = [...liveStatsNode.querySelectorAll("button:not([disabled]):not([hidden]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    .filter((node) => node.getClientRects().length);
  if (!focusable.length) {
    event.preventDefault();
    closeStatsNode.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener("focusin", (event) => {
  if (!liveStatsNode.hidden && !liveStatsNode.contains(event.target)) closeStatsNode.focus();
  if (!siteCheckSheetNode.hidden && !siteCheckSheetNode.contains(event.target)) closeSiteCheckNode.focus();
});

function formatBytes(value) {
  if (!Number.isFinite(value)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value, unit = 0;
  while (amount >= 1000 && unit < units.length - 1) { amount /= 1000; unit++; }
  return `${amount.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

async function refreshLiveStats() {
  if (liveStatsNode.hidden) return;
  const result = await send("status");
  updateLiveStats(result || {});
}

// Gas-station digit roll: only the characters that changed slide in from below.
// Unchanged characters stay perfectly still. No outgoing animation needed —
// the container's overflow:hidden clips cleanly as the new char arrives.
function rollText(node, newText) {
  const oldText = node.dataset.statText || node.textContent;
  if (oldText === newText) return;
  node.dataset.statText = newText;
  const oldChars = [...oldText];
  const newChars = [...newText];
  const spans = newChars.map((ch, i) => {
    const span = document.createElement("span");
    span.className = "stat-char";
    span.textContent = ch;
    if (ch !== (oldChars[i] ?? "")) span.classList.add("rolling-in");
    return span;
  });
  node.replaceChildren(...spans);
}

function updateLiveStats(result = {}) {
  const now = Date.now();
  const down = Number(result.downloadBytes), up = Number(result.uploadBytes);
  const rate = (value, oldValue) => Number.isFinite(value) && Number.isFinite(oldValue) && lastStatsSample && now > lastStatsSample.time
    ? formatBytes(Math.max(0, value - oldValue) * 1000 / (now - lastStatsSample.time)) + "/s" : "0 B/s";
  const downRate = Number.isFinite(down) ? rate(down, lastStatsSample?.down) : "—";
  const upRate = Number.isFinite(up) ? rate(up, lastStatsSample?.up) : "—";
  const dlTotal = document.querySelector("#downloadTotal");
  const ulTotal = document.querySelector("#uploadTotal");
  const dlRate = document.querySelector("#downloadRate");
  const ulRate = document.querySelector("#uploadRate");
  rollText(dlTotal, formatBytes(down));
  rollText(ulTotal, formatBytes(up));
  dlRate.textContent = downRate;
  ulRate.textContent = upRate;
  document.querySelector("#statsMemory").textContent = formatBytes(Number(result.memoryBytes));
  const snowflake = preferences.mode === "snowflake";
  const routeIcon = document.querySelector("#statsRouteIcon");
  routeIcon.innerHTML = snowflake
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.8 12 7l2.5-2.2M9.5 19.2 12 17l2.5 2.2"/></svg>'
    : (result.bridgeCountryCode || "—");
  document.querySelector("#statsRouteName").textContent = snowflake ? "Snowflake" : (result.bridgeTransport || "Bridge");
  document.querySelector("#statsRouteAddress").textContent = result.bridgeAddress || "—";
  const summary = document.querySelector("#connectedStatsSummary");
  summary.hidden = result.state !== "connected";
  statsToggleNode.hidden = result.state !== "connected";
  if (result.state !== "connected" && !liveStatsNode.hidden) closeLiveStats();
  document.querySelector("#summaryRouteName").textContent = snowflake ? "Snowflake" : (result.currentBridgeIndex ? `Bridge ${result.currentBridgeIndex}` : "Bridge");
  document.querySelector("#summaryRouteAddress").textContent = result.bridgeAddress || "";
  document.querySelector("#summaryDownloadRate").textContent = Number.isFinite(down) ? downRate : "—";
  document.querySelector("#summaryUploadRate").textContent = Number.isFinite(up) ? upRate : "—";
  const summaryIcon = document.querySelector("#summaryRouteIcon");
  summaryIcon.textContent = snowflake ? "" : (result.bridgeCountryCode || "—").toUpperCase();
  summaryIcon.classList.toggle("is-snowflake", snowflake);
  const copy = document.querySelector("#statsCopyAddress");
  copy.hidden = !result.bridgeAddress;
  copy.onclick = () => {
    navigator.clipboard.writeText(result.bridgeAddress).then(() => {
      if (statsCopyFeedbackTimer) clearTimeout(statsCopyFeedbackTimer);
      copy.classList.add("is-copied");
      copy.setAttribute("aria-label", "Copied");
      statsCopyFeedbackTimer = window.setTimeout(() => {
        copy.classList.remove("is-copied");
        copy.setAttribute("aria-label", "Copy bridge address");
        statsCopyFeedbackTimer = undefined;
      }, 1500);
    }).catch(() => {});
  };
  if (Number.isFinite(down) || Number.isFinite(up)) lastStatsSample = { down, up, time: now };
  renderSiteCheck(result);
}

const SITE_CHECK_NAMES = ["youtube.com", "x.com", "instagram.com", "wikipedia.org"];
function renderSiteCheck(result = {}) {
  const sites = Array.isArray(result.siteChecks) ? result.siteChecks : [];
  const connected = result.state === "connected"
    && !["trying", "failed", "closed"].includes(result.bridgeActivity)
    && ["pending", "passed", "failed"].includes(result.connectivityCheck);
  const failures = sites.filter((site) => site.state === "failed").length;
  const pending = result.connectivityCheck === "pending" || sites.some((site) => site.state === "pending");
  siteCheckBadgeNode.hidden = !connected;
  siteCheckSummaryNode.hidden = !connected;
  const checkLabel = pending ? "Checking 4 sites" : failures ? `${failures} of ${sites.length || 4} sites blocked` : "All 4 sites reachable";
  siteCheckBadgeNode.setAttribute("aria-label", `Review site check: ${checkLabel}`);
  siteCheckSummaryNode.setAttribute("aria-label", `Review site check: ${checkLabel}`);
  siteCheckBadgeNode.innerHTML = pending
    ? '<span class="site-check-spinner" aria-hidden="true"></span>'
    : failures
      ? `<span>${failures}</span>`
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  siteCheckBadgeNode.classList.toggle("is-failed", failures > 0 && !pending);
  siteCheckBadgeNode.classList.toggle("is-pending", pending);
  siteCheckBadgeNode.classList.toggle("is-passed", !pending && !failures && result.connectivityCheck === "passed");
  siteCheckSummaryNode.classList.toggle("is-failed", failures > 0 && !pending);
  siteCheckSummaryNode.classList.toggle("is-pending", pending);
  siteCheckSummaryNode.classList.toggle("is-passed", !pending && !failures && result.connectivityCheck === "passed");
  const t = globalThis.torI18n?.t || ((s) => s);
  if (pending) {
    siteCheckSummaryNode.innerHTML = `<span class="site-check-spinner" aria-hidden="true"></span>${t("Checking sites…")}`;
  } else if (failures) {
    siteCheckSummaryNode.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4m0 3.2v.1"/></svg>${failures} of ${sites.length || 4} ${t("sites blocked")}<svg class="site-check-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;
  } else if (result.connectivityCheck === "passed") {
    siteCheckSummaryNode.textContent = t("all sites reachable");
  } else {
    siteCheckSummaryNode.textContent = t("Checking sites…");
  }
  const blockedSummary = failures ? `${failures} of ${sites.length || 4} ${t("sites blocked")}` : t("All sites reachable");
  siteCheckCountNode.textContent = pending ? t("Checking 4 sites…") : failures ? blockedSummary : t("All 4 sites reachable");
  siteCheckCountNode.classList.toggle("has-failures", failures > 0 && !pending);
  siteCheckSheetNode.classList.toggle("is-pending", pending);
  siteCheckSheetNode.classList.toggle("is-failed", failures > 0 && !pending);
  siteCheckSheetNode.classList.toggle("is-passed", !pending && !failures && result.connectivityCheck === "passed");
  nextRouteNode.textContent = t(preferences.mode === "manual" ? "Next bridge" : "New proxy");
  nextRouteNode.hidden = pending || failures === 0;
  document.querySelector("#retestSites").disabled = pending;
  siteCheckRowsNode.replaceChildren(...SITE_CHECK_NAMES.map((name) => {
    const resultForSite = sites.find((site) => site.site === name) || { state: "pending" };
    const row = document.createElement("div");
    row.className = `site-check-row is-${resultForSite.state}`;
    const icon = document.createElement("span");
    icon.className = "site-check-result";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = resultForSite.state === "passed"
      ? '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
      : resultForSite.state === "failed"
        ? '<svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg>'
        : '<span class="site-check-spinner"></span>';
    const siteName = document.createElement("span");
    siteName.className = "site-check-name";
    siteName.textContent = name;
    const meta = document.createElement("span");
    meta.className = "site-check-meta";
    meta.textContent = resultForSite.state === "passed" ? `${Math.max(0, Number(resultForSite.latencyMs) || 0)} ms` : resultForSite.state === "failed" ? t("Blocked") : t("Checking");
    row.append(icon, siteName, meta);
    return row;
  }));
  if (result.state !== "connected" && !siteCheckSheetNode.hidden) closeSiteCheck();
}

const query = new URLSearchParams(location.search);
const isTabView = query.get("view") === "tab";
if (isTabView) document.documentElement.dataset.layout = "tab";

openSettingsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
addBridgesButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
openFullScreenButton.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?view=tab") });
});

function setStatus(text, kind = "", detail = "") {
  if (statusNode.textContent !== text || statusNode.dataset.kind !== kind) {
    // Crossfade: snap to opacity:0, swap content, then let CSS transition fade in.
    statusNode.style.transition = "none";
    statusDetailNode.style.transition = "none";
    statusNode.style.opacity = "0";
    statusDetailNode.style.opacity = "0";
    requestAnimationFrame(() => {
      statusNode.textContent = text;
      statusNode.dataset.kind = kind;
      statusDetailNode.textContent = detail;
      statusDetailNode.hidden = !detail;
      metaSeparatorNode.hidden = siteCheckSummaryNode.hidden
        ? !detail || (bridgeAttemptTimerNode.hidden && connectedDurationNode.hidden)
        : connectedDurationNode.hidden;
      statusNode.style.transition = "";
      statusDetailNode.style.transition = "";
      requestAnimationFrame(() => {
        statusNode.style.opacity = "";
        statusDetailNode.style.opacity = "";
      });
    });
  } else {
    statusNode.textContent = text;
    statusNode.dataset.kind = kind;
    statusDetailNode.textContent = detail;
    statusDetailNode.hidden = !detail;
    metaSeparatorNode.hidden = siteCheckSummaryNode.hidden
      ? !detail || (bridgeAttemptTimerNode.hidden && connectedDurationNode.hidden)
      : connectedDurationNode.hidden;
  }
}

function send(type, extra = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (response) => {
      if (settled) return;
      settled = true;
      void chrome.runtime.lastError; // prevent "unchecked lastError" console error
      resolve(response);
    };
    try {
      chrome.runtime.sendMessage({ type, ...extra }, done);
    } catch (_) {
      done(undefined);
      return;
    }
    // Guard against the service worker waking up and dropping the message entirely.
    setTimeout(() => done(undefined), 5000);
  });
}

function readPreferences() {
  return new Promise((resolve) => {
    chrome.storage.local.get("torConnectionPreferences", (stored) => {
      const saved = stored?.torConnectionPreferences;
      preferences = {
        mode: saved?.mode === "manual" ? "manual" : "snowflake",
        bridges: typeof saved?.bridges === "string" ? saved.bridges : "",
        autoBridgeSelection: saved?.autoBridgeSelection !== false,
        selectedBridge: typeof saved?.selectedBridge === "string" ? saved.selectedBridge : "",
        disabledBridges: Array.isArray(saved?.disabledBridges) ? saved.disabledBridges : [],
        exitCountry: typeof saved?.exitCountry === "string" ? saved.exitCountry : ""
      };
      const entries = bridgeEntries();
      if (!entries.includes(preferences.selectedBridge)) preferences.selectedBridge = entries[0] || "";
      renderBridgeSelector();
      resolve(preferences);
    });
  });
}

function bridgeEntries() {
  const disabled = new Set(preferences.disabledBridges);
  return allBridgeEntries().filter((line) => !disabled.has(line));
}

function allBridgeEntries() {
  return preferences.bridges.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function bridgeNumberForLine(line) {
  const index = allBridgeEntries().indexOf(line);
  return index < 0 ? 1 : index + 1;
}

function selectedBridgePosition(entries = bridgeEntries()) {
  const index = entries.indexOf(preferences.selectedBridge);
  return index < 0 ? 0 : index;
}

function bridgeAddress(line) {
  const parts = line?.trim().split(/\s+/) || [];
  return (parts[0] === "Bridge" ? parts[2] : parts[1])?.toLowerCase() || "";
}

function activeBridgePosition(result, entries = bridgeEntries()) {
  if (result?.bridgeAddress) {
    const address = String(result.bridgeAddress).toLowerCase();
    const match = entries.findIndex((line) => bridgeAddress(line) === address);
    if (match >= 0) return match;
  }
  const originalIndex = Number(result?.currentBridgeIndex) - 1;
  if (originalIndex < 0) return -1;
  if (preferences.autoBridgeSelection) return originalIndex < entries.length ? originalIndex : -1;
  const originalLine = allBridgeEntries()[originalIndex];
  return originalLine ? entries.indexOf(originalLine) : -1;
}

function countryFlag(countryCode) {
  const code = String(countryCode || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((character) => 127397 + character.charCodeAt(0)));
}

function renderBridgeCountry(result, position = -1) {
  const entries = bridgeEntries();
  const line = position >= 0 ? entries[position] : "";
  const active = result?.state === "connected" && position >= 0 && activeBridgePosition(result, entries) === position;
  const code = String(
    active && result?.bridgeCountryCode
      ? result.bridgeCountryCode
      : bridgeCountries.get(line) || ""
  ).toUpperCase();
  const flag = countryFlag(code);
  bridgeCountryFlagNode.hidden = !flag;
  bridgeCountryFlagNode.textContent = flag;
  if (flag) {
    const countryName = new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(code) || code;
    const bridgeLabel = position >= 0 ? "Bridge " + (position + 1) : "Bridge";
    bridgeCountryFlagNode.title = "Approximate country of " + bridgeLabel + ": " + countryName;
    bridgeCountryFlagNode.setAttribute("aria-label", "Approximate country of " + bridgeLabel + ": " + countryName);
  } else {
    bridgeCountryFlagNode.removeAttribute("title");
    bridgeCountryFlagNode.removeAttribute("aria-label");
  }
}

async function refreshBridgeCountries() {
  const revision = ++bridgeCountryRequestRevision;
  const lines = bridgeEntries();
  if (preferences.mode !== "manual" || !lines.length) {
    bridgeCountries = new Map();
    renderRoute(currentResult);
    return;
  }
  const result = await send("bridgeCountries", { bridges: lines.join("\n") });
  if (revision !== bridgeCountryRequestRevision) return;
  bridgeCountries = result?.ok && Array.isArray(result.results)
    ? new Map(result.results.map(({ line, countryCode }) => [line, countryCode || ""]))
    : new Map();
  renderRoute(currentResult);
}

function renderBridgeSelector() {
  const entries = bridgeEntries();
  bridgeSelectorNode.hidden = preferences.mode !== "manual" || entries.length === 0;
  if (entries.length && !entries.includes(preferences.selectedBridge)) preferences.selectedBridge = entries[0];
  autoBridgeSelectionNode.checked = preferences.autoBridgeSelection;
  autoBridgeHintNode.textContent = preferences.autoBridgeSelection
    ? entries.length
      ? "Tries " + entries.length + " saved " + (entries.length === 1 ? "bridge" : "bridges") + " in order"
      : "No saved bridges"
    : "Off: you choose";
}

function renderOrbitNodes(focusPosition, activePosition) {
  const entries = preferences.mode === "manual" ? bridgeEntries() : [];
  orbitNodesNode.replaceChildren();
  if (!entries.length) {
    orbitFlowNode.hidden = true;
    if (preferences.mode === "manual") {
      for (const slot of ["top", "right", "left"]) {
        const node = document.createElement("span");
        node.className = "orbit-empty-node orbit-empty-node-" + slot;
        node.setAttribute("aria-hidden", "true");
        node.textContent = "+";
        orbitNodesNode.append(node);
      }
    }
    return;
  }
  const slots = [
    { angle: -90, slot: "top" },
    { angle: 30, slot: "right" },
    { angle: 150, slot: "left" }
  ];
  const routePosition = activePosition >= 0 ? activePosition : focusPosition;
  const activeSlot = slots[((routePosition % slots.length) + slots.length) % slots.length];
  // Keep the route line's geometry fixed and rotate it around the orbit center.
  // This lets CSS carry the dashed route to the next bridge instead of snapping.
  if (activeSlot) {
    if (orbitRoutePosition < 0) orbitRouteRotation = activeSlot.angle - 30;
    else if (routePosition !== orbitRoutePosition) orbitRouteRotation += (routePosition - orbitRoutePosition) * 120;
    orbitRoutePosition = routePosition;
  }
  orbitFlowNode.style.transform = `rotate(${orbitRouteRotation}deg)`;
  orbitFlowNode.hidden = !activeSlot;
  for (const position of [focusPosition - 1, focusPosition, focusPosition + 1]) {
    if (position < 0 || position >= entries.length) continue;
    const { slot } = slots[position % slots.length];
    const line = entries[position];
    const countryCode = (bridgeCountries.get(line) || "").toUpperCase();
    const selected = !preferences.autoBridgeSelection && position === selectedBridgePosition(entries);
    const active = position === activePosition;
    const candidate = position === focusPosition && activePosition < 0 && currentResult?.state === "starting";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "orbit-node orbit-node-" + slot
      + (selected ? " is-selected" : "")
      + (active || candidate ? " is-active" : "");
    button.setAttribute("aria-pressed", String(selected || active || candidate));
    const country = document.createElement("span");
    country.className = "orbit-country";
    country.textContent = /^[A-Z]{2}$/.test(countryCode) ? countryCode : "··";
    const label = document.createElement("span");
    label.className = "orbit-node-label";
    const bridgeNumber = bridgeNumberForLine(line);
    label.textContent = "Bridge " + bridgeNumber;
    button.append(country, label);
    const name = /^[A-Z]{2}$/.test(countryCode)
      ? new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(countryCode)
      : "country unknown";
    button.setAttribute("aria-label", "Bridge " + bridgeNumber + ", " + name
      + (active ? ", currently connected" : selected ? ", selected" : ""));
    button.title = "Bridge " + bridgeNumber + " · " + name;
    button.addEventListener("click", () => {
      saveBridgeSelection(false, line);
      renderRoute(currentResult);
    });
    orbitNodesNode.append(button);
  }
  orbitNodesNode.dataset.auto = String(preferences.autoBridgeSelection);
}

function saveBridgeSelection(autoBridgeSelection, selectedBridge) {
  preferences.autoBridgeSelection = autoBridgeSelection;
  preferences.selectedBridge = selectedBridge;
  renderBridgeSelector();
  chrome.storage.local.set({ torConnectionPreferences: preferences });
}

function renderConnectionMethodSwitch() {
  methodSwitchNode.dataset.mode = preferences.mode;
  methodButtons.forEach((button) => {
    const selected = button.dataset.mode === preferences.mode;
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

async function selectConnectionMethod(mode) {
  if (!["snowflake", "manual"].includes(mode) || mode === preferences.mode) return;
  if (currentState === "connected" || currentState === "starting") {
    methodButtons.forEach((button) => { button.disabled = true; });
    const stopped = await send("disconnect");
    if (!stopped?.ok) {
      methodButtons.forEach((button) => { button.disabled = false; });
      renderResult(stopped || { ok: false, state: "failed", error: "Could not stop the current Tor connection." });
      return;
    }
    currentResult = stopped;
    currentState = stopped.state || "disconnected";
    syncConnectedDuration(stopped);
    syncBridgeAttemptTimer(stopped.state);
  }
  preferences.mode = mode;
  if (!bridgeEntries().includes(preferences.selectedBridge)) preferences.selectedBridge = bridgeEntries()[0] || "";
  renderConnectionMethodSwitch();
  renderResult(currentResult);
  refreshBridgeCountries();
  chrome.storage.local.set({ torConnectionPreferences: preferences }, () => {
    methodButtons.forEach((button) => { button.disabled = false; });
  });
}

methodButtons.forEach((button, index) => {
  button.addEventListener("click", () => selectConnectionMethod(button.dataset.mode));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? methodButtons.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + methodButtons.length) % methodButtons.length;
    methodButtons[nextIndex].focus();
    methodButtons[nextIndex].click();
  });
});

function paintBridgeAttemptTimer() {
  if (!bridgeAttemptStartedAt) return;
  const elapsedSeconds = Math.floor((Date.now() - bridgeAttemptStartedAt) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  bridgeAttemptTimerNode.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function paintConnectedDuration() {
  if (!connectedDurationStartedAt) return;
  const totalSeconds = Math.floor((Date.now() - connectedDurationStartedAt) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const elapsed = hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  connectedDurationNode.textContent = elapsed;
}

function syncConnectedDuration(result) {
  if (result?.state !== "connected") {
    connectedDurationStartedAt = 0;
    connectedDurationNode.hidden = true;
    if (connectedDurationInterval) clearInterval(connectedDurationInterval);
    connectedDurationInterval = undefined;
    return;
  }
  const timestamp = Number(result.connectedAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    connectedDurationNode.hidden = true;
    return;
  }
  connectedDurationStartedAt = timestamp;
  connectedDurationNode.hidden = false;
  paintConnectedDuration();
  if (!connectedDurationInterval) connectedDurationInterval = setInterval(paintConnectedDuration, 1000);
}

function beginBridgeAttemptTimer() {
  bridgeAttemptStartedAt = Date.now();
  bridgeAttemptStoragePending = false;
  chrome.storage.local.set({ bridgeAttemptStartedAt });
  paintBridgeAttemptTimer();
  if (!bridgeAttemptTimerInterval) bridgeAttemptTimerInterval = setInterval(paintBridgeAttemptTimer, 1000);
}

function syncBridgeAttemptTimer(state) {
  if (state !== "starting") {
    bridgeAttemptStartedAt = 0;
    bridgeAttemptStoragePending = false;
    if (bridgeAttemptTimerInterval) clearInterval(bridgeAttemptTimerInterval);
    bridgeAttemptTimerInterval = undefined;
    bridgeAttemptTimerNode.hidden = true;
    chrome.storage.local.remove("bridgeAttemptStartedAt");
    return;
  }
  if (bridgeAttemptStartedAt || bridgeAttemptStoragePending) return;
  bridgeAttemptStoragePending = true;
  chrome.storage.local.get("bridgeAttemptStartedAt", (stored) => {
    bridgeAttemptStoragePending = false;
    if (currentResult?.state !== "starting") return;
    const storedStart = Number(stored?.bridgeAttemptStartedAt);
    bridgeAttemptStartedAt = Number.isFinite(storedStart) && storedStart > 0 ? storedStart : Date.now();
    if (!storedStart) chrome.storage.local.set({ bridgeAttemptStartedAt });
    paintBridgeAttemptTimer();
    if (!bridgeAttemptTimerInterval) bridgeAttemptTimerInterval = setInterval(paintBridgeAttemptTimer, 1000);
  });
}

function explain(result) {
  if (!result) return "Tor status unavailable";
  if (!result.ok) return summarizeConnectionError(result.error || result.message);
  if (result.state === "connected") {
    if (result.bridgeActivity === "trying") return "Reconnecting…";
    if (result.bridgeActivity === "failed" || result.bridgeActivity === "closed") return "Connection interrupted";
    return "Connected";
  }
  if (result.state === "starting") {
    return "Connecting…";
  }
  if (result.state === "disconnected") return "Not connected";
  if (result.state === "missing_runtime") {
    return "Tor setup is incomplete";
  }
  if (result.state === "failed") return summarizeConnectionError(result.error || result.message);
  return "Tor status needs attention";
}

function summarizeConnectionError(error) {
  const message = typeof error === "string" ? error : "";
  if (/proxy\.settings requires private browsing permission|private browsing permission/i.test(message)) {
    return "Firefox permission needed";
  }
  if (/address already in use|could not bind to|failed to bind|bind.*already in use/i.test(message)) {
    return "A local Tor port is already in use";
  }
  if (/permission denied|operation not permitted|access is denied/i.test(message)) {
    return "Tor can’t access a required file";
  }
  if (/failed to parse\/validate config|invalid config|invalid bridge|enter one or more valid|choose one valid bridge|choose snowflake or manual/i.test(message)) {
    return "Check your bridge settings";
  }
  if (/signal\s+\d+|killed|terminated unexpectedly/i.test(message)) {
    return "Tor stopped before connecting";
  }
  if (/timed out|timeout|no route to host|connection refused/i.test(message)) {
    return "Couldn’t connect through this bridge";
  }
  if (/no such file|does not exist|doesn’t exist|not found/i.test(message)) {
    return "Tor files are missing";
  }
  if (/native helper (?:unavailable|disconnected)|native messaging host not found|native host.*not registered/i.test(message)) {
    return "Tor helper isn’t available";
  }
  return "Tor couldn’t connect. Try again.";
}

function connectionErrorHint(error) {
  const message = typeof error === "string" ? error : "";
  if (/proxy\.settings requires private browsing permission|private browsing permission/i.test(message)) {
    return "Firefox requires this permission even in normal windows. Open menu ☰ → Extensions and Themes. On Tor Connect, click ⋯ → Manage. Under “Run in Private Windows,” select “Allow,” then return here and try again.";
  }
  if (/address already in use|could not bind to|failed to bind|bind.*already in use/i.test(message)) {
    return "Another app or Chrome profile may already have a Tor connection open.";
  }
  if (/permission denied|operation not permitted|access is denied/i.test(message)) {
    return "Check that Tor Connect can access its installed files.";
  }
  if (/failed to parse\/validate config|invalid config|invalid bridge|enter one or more valid|choose one valid bridge|choose snowflake or manual/i.test(message)) {
    return "Review the bridge lines in Settings.";
  }
  if (/signal\s+\d+|killed|terminated unexpectedly/i.test(message)) {
    return "Tor closed before it could connect. You can try again.";
  }
  if (/timed out|timeout|no route to host|connection refused/i.test(message)) {
    return "Try another saved bridge or connection method.";
  }
  if (/no such file|does not exist|doesn’t exist|not found/i.test(message)) {
    return "Run setup again to install the Tor files.";
  }
  if (/native helper (?:unavailable|disconnected)|native messaging host not found|native host.*not registered/i.test(message)) {
    return "Set up Tor Connect on this device, then restart your browser.";
  }
  return "Try again. Open the details if it keeps happening.";
}

function renderErrorDetails(result) {
  const error = typeof result?.error === "string" ? result.error : "";
  const message = typeof result?.message === "string" ? result.message : "";
  const knownStates = ["connected", "starting", "disconnected", "missing_runtime", "failed"];
  const isUnknownState = Boolean(result?.state) && !knownStates.includes(result.state);
  const diagnostic = error || (result?.state === "failed" || result?.ok === false || isUnknownState ? message : "");
  const hasError = Boolean(diagnostic);
  errorDetailsNode.hidden = !hasError;
  if (!hasError) errorDetailsNode.open = false;
  errorTextNode.textContent = diagnostic;
}

function renderRoute(result = {}) {
  if (initialStatusPending && routeCardNode.dataset.initialChecking === "true") {
    snowflakeInfoNode.hidden = preferences.mode !== "snowflake";
    snowflakeInfoTextNode.textContent = "Connect through volunteer proxies. No bridge lines to add.";
    return;
  }
  delete routeCardNode.dataset.initialChecking;
  bridgeAttemptTimerNode.hidden = result.state !== "starting";
  connectedDurationNode.hidden = result.state !== "connected";
  copyBridgeButton.hidden = true;
  routeBridgeLine = "";
  routeIdentityNode.hidden = false;
  const prevDetail = routeDetailNode.textContent;
  routeCardNode.dataset.state = result.state || "disconnected";
  routeCardNode.dataset.activity = result.bridgeActivity || "";
  routeCardNode.dataset.check = result.connectivityCheck || "";
  connectionToggle.dataset.check = result.connectivityCheck || "";
  routeCardNode.dataset.mode = preferences.mode;
  delete routeCardNode.dataset.route;

  const entries = preferences.mode === "manual" ? bridgeEntries() : [];
  const hasNoBridgeLines = preferences.mode === "manual" && entries.length === 0;
  routeCardNode.dataset.empty = String(hasNoBridgeLines);
  emptyBridgeInfoNode.hidden = !hasNoBridgeLines;
  renderConnectionMethodSwitch();
  const activePosition = (result.state === "connected" || result.state === "starting")
    ? activeBridgePosition(result, entries) : -1;
  const selectedPosition = entries.length ? selectedBridgePosition(entries) : -1;
  const focusPosition = !preferences.autoBridgeSelection && selectedPosition >= 0
    ? selectedPosition : activePosition >= 0 ? activePosition : Math.max(0, selectedPosition);
  renderOrbitNodes(focusPosition, activePosition);
  if (preferences.mode === "snowflake") {
    orbitFlowNode.hidden = result.state !== "connected";
    orbitFlowNode.style.transform = "rotate(0deg)";
  }

  let shownPosition = -1;
  if (entries.length) {
    if (activePosition >= 0) shownPosition = activePosition;
    else if (!preferences.autoBridgeSelection) shownPosition = selectedPosition;
    else if (result.state === "starting" && lastShownPosition >= 0) shownPosition = lastShownPosition;
  }
  if (shownPosition >= 0) lastShownPosition = shownPosition;
  if (result.state !== "starting" && result.state !== "connected") lastShownPosition = -1;
  renderBridgeCountry(result, shownPosition);
  snowflakeInfoNode.hidden = preferences.mode !== "snowflake" || result.state === "connected";
  if (preferences.mode === "snowflake") {
    const nextSnowflakeText = result.state === "failed"
      ? "Couldn't connect. Check the error details or try again."
      : result.state === "starting"
      ? "Asking volunteer proxies to relay your traffic."
      : result.state === "connected" && result.bridgeActivity === "trying"
        ? "Trying another volunteer proxy."
        : result.state === "connected" && ["failed", "closed"].includes(result.bridgeActivity)
          ? "The route was interrupted. Tor may retry automatically."
          : result.state === "connected"
            ? "Your traffic is relayed through Snowflake proxies. The route may change."
            : "Connect through volunteer proxies. No bridge lines to add.";
    if (snowflakeInfoTextNode.textContent !== nextSnowflakeText) {
      fadeText(snowflakeInfoTextNode, () => { snowflakeInfoTextNode.textContent = nextSnowflakeText; });
    }
  }
  const nextRouteLabel = result.state === "connected" && shownPosition >= 0 ? "CONNECTED THROUGH"
    : result.state === "starting" && shownPosition >= 0 ? "TRYING BRIDGE"
      : result.state === "starting" ? "CONNECTING THROUGH" : "WILL CONNECT THROUGH";
  if (routeLabelNode.textContent !== nextRouteLabel) {
    fadeText(routeLabelNode, () => { routeLabelNode.textContent = nextRouteLabel; });
  }
  if (result.state === "starting") routeCardNode.dataset.route = "trying-bridge";

  if (hasNoBridgeLines) {
    routeIdentityNode.hidden = true;
  } else if (shownPosition >= 0) {
    const line = entries[shownPosition];
    const parts = line.split(/\s+/);
    const endpoint = parts[0] === "Bridge" ? (parts[2] || "") : (parts[1] || "");
    const nextName = "Bridge " + bridgeNumberForLine(line);
    if (routeNameNode.textContent !== nextName) {
      fadeText(routeNameNode, () => { routeNameNode.textContent = nextName; });
    }
    if (endpoint) {
      const nextDetail = endpoint;
      if (prevDetail !== nextDetail) {
        fadeText(routeDetailNode, () => { routeDetailNode.textContent = nextDetail; });
      }
      routeDetailNode.hidden = false;
      routeBridgeLine = line;
      copyBridgeButton.hidden = false;
    }
  } else if (preferences.mode === "manual") {
    const bridgeCount = entries.length;
    if (preferences.autoBridgeSelection) {
      routeIdentityNode.hidden = true;
    } else {
      const nextName = "Automatic";
      if (routeNameNode.textContent !== nextName) {
        fadeText(routeNameNode, () => { routeNameNode.textContent = nextName; });
      }
      if (bridgeCount) {
        const nextDetail = bridgeCount + " saved " + (bridgeCount === 1 ? "bridge" : "bridges") + " · tries in order";
        if (prevDetail !== nextDetail) {
          fadeText(routeDetailNode, () => { routeDetailNode.textContent = nextDetail; });
        }
        routeDetailNode.hidden = false;
      }
    }
  } else {
    routeIdentityNode.hidden = true;
  }

  copyBridgeButton.hidden = !routeBridgeLine;
}

function renderResult(result) {
  connectionToggle.classList.remove("is-pressing");
  currentResult = result || {};
  const currentError = currentResult.error || currentResult.message || "";
  if (isFirefoxExtension && /proxy\.settings requires private browsing permission|private browsing permission/i.test(currentError)) {
    initialStatusPending = false;
    renderErrorDetails(currentResult);
    syncBridgeAttemptTimer(currentResult.state);
    syncConnectedDuration(currentResult);
    updateLiveStats(currentResult);
    showFirefoxPermission();
    return;
  }
  hideFirefoxPermission();
  const helperNotInstalled = /native helper (?:unavailable|disconnected)|native messaging host not found|native host.*not registered|failed to start native messaging host|access to the specified native messaging host is forbidden/i.test(currentResult?.error || "");
  const transientStartupFailure = initialStatusPending && (!currentResult.ok || currentResult.state === "failed") && currentResult.state !== "missing_runtime" && !helperNotInstalled && initialStatusRetries < 6;
  if (transientStartupFailure) {
    initialStatusRetries++;
    popupMainNode.dataset.view = "connection";
    setupPanelNode.hidden = true;
    routeCardNode.hidden = false;
    routeCardNode.dataset.state = "disconnected";
    routeCardNode.dataset.mode = preferences.mode;
    routeCardNode.dataset.activity = "";
    routeCardNode.dataset.check = "";
    routeCardNode.dataset.empty = String(preferences.mode === "manual" && bridgeEntries().length === 0);
    routeCardNode.dataset.initialChecking = "true";
    routeIdentityNode.hidden = true;
    openSettingsButton.hidden = false;
    setStatus("Checking connection…", "starting", "Waiting for the Tor helper");
    setToggleState("disconnected");
    connectionToggle.dataset.initialChecking = "true";
    renderConnectionMethodSwitch();
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => renderResult(await send("status")), 1000);
    return;
  }
  initialStatusPending = false;
  renderErrorDetails(currentResult);
  syncBridgeAttemptTimer(currentResult.state);
  syncConnectedDuration(currentResult);
  updateLiveStats(result);
  if (helperNotInstalled || result?.state === "missing_runtime") {
    popupMainNode.dataset.view = "cold-start";
    setupPanelNode.hidden = false;
    routeCardNode.hidden = true;
    openSettingsButton.hidden = true;
    errorDetailsNode.hidden = true;
    setupDescriptionNode.textContent = result?.state === "missing_runtime"
      ? "Install Tor and its helper once to connect through Chrome."
      : "Install the Tor helper once to connect through Chrome.";
    setToggleState("disconnected");
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
    return;
  }
  popupMainNode.dataset.view = "connection";
  setupPanelNode.hidden = true;
  routeCardNode.hidden = false;
  openSettingsButton.hidden = false;
  renderRoute(result || {});
  renderProgress(result);
  const statusKind = result?.state === "connected" && result?.bridgeActivity === "trying" ? "starting"
    : result?.state === "connected" && ["failed", "closed"].includes(result?.bridgeActivity) ? "error"
      : result?.state === "connected" && result?.connectivityCheck === "failed" ? "connected-check-failed"
      : result?.state === "connected" ? "connected"
    : result?.state === "starting" ? "starting"
      : result?.state === "failed" || !result?.ok ? "error" : "";
  const failureMessage = result?.error || result?.message;
  const detail = result?.state === "failed" || !result?.ok
    ? connectionErrorHint(failureMessage)
    : result?.state === "connected" && ["failed", "closed"].includes(result?.bridgeActivity)
    ? preferences.mode === "snowflake" ? "Tor may retry the Snowflake route" : "Tor may retry the bridge"
    : result?.state === "connected" && result?.bridgeActivity === "trying"
      ? preferences.mode === "snowflake" ? "Trying another volunteer proxy" : "Trying another bridge"
      : result?.state === "connected" && ["pending", "passed", "failed"].includes(result?.connectivityCheck) ? ""
      : result?.state === "connected" ? "Tap the center to disconnect"
    : result?.state === "starting"
      ? Number(result.currentBridgeIndex) > 0 ? `Crossing through Bridge ${Number(result.currentBridgeIndex)}`
        : preferences.mode === "manual" ? "Trying saved bridges" : "Finding a volunteer proxy · tap to cancel"
      : result?.state === "disconnected"
        ? preferences.mode === "manual" && !bridgeEntries().length
          ? "Add bridge lines in Settings to connect this way"
          : preferences.mode === "manual" && !preferences.autoBridgeSelection
          ? "Pick a bridge, then tap the center"
          : preferences.mode === "manual" ? "Tap the center to try saved bridges" : "Tap the center to connect"
        : "";
  setStatus(preferences.mode === "manual" && !bridgeEntries().length && result?.state === "disconnected"
    ? "No bridges yet" : explain(result), statusKind, detail);
  setToggleState(result?.state || "disconnected", result?.bridgeActivity);
  if (result?.state === "starting" || result?.state === "connected") pollForProgress();
  else if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
}

function setToggleState(state, bridgeActivity) {
  currentState = state;
  delete connectionToggle.dataset.initialChecking;
  renderBridgeSelector();
  connectionToggle.disabled = false;
  const visualState = state === "connected" && bridgeActivity === "trying" ? "reconnecting"
    : state === "connected" && ["failed", "closed"].includes(bridgeActivity) ? "bridge-interrupted"
      : state;
  connectionToggle.dataset.state = visualState;
  connectionToggle.dataset.mode = preferences.mode;
  connectionToggle.dataset.empty = String(preferences.mode === "manual" && !bridgeEntries().length);
  connectionProgress.hidden = state !== "starting";
  const label = state === "connected" ? "Disconnect" : state === "starting" ? "Cancel connection" : "Connect";
  const accessibleLabel = state === "connected" && bridgeActivity === "trying"
    ? "Disconnect from Tor; the bridge is reconnecting"
    : state === "connected" && ["failed", "closed"].includes(bridgeActivity)
      ? "Disconnect from Tor; the bridge connection is interrupted"
      : label === "Connect" && preferences.mode === "manual" && !bridgeEntries().length ? "Add bridge lines in Settings"
        : label === "Connect" ? "Connect to Tor" : label === "Disconnect" ? "Disconnect from Tor" : "Cancel Tor connection";
  connectionToggle.setAttribute("aria-label", accessibleLabel);
  connectionToggle.title = accessibleLabel;
}

function renderProgress(result) {
  if (result?.state !== "starting") {
    connectionProgress.hidden = true;
    connectionProgress.removeAttribute("aria-valuenow");
    delete connectionToggle.dataset.progressMode;
    connectionToggle.style.removeProperty("--progress");
    return;
  }
  connectionProgress.hidden = false;
  const percent = result.message?.match(/\b(\d{1,3})%/);
  if (!percent) {
    connectionToggle.dataset.progressMode = "indeterminate";
    connectionToggle.style.removeProperty("--progress");
    connectionProgress.removeAttribute("aria-valuenow");
    return;
  }
  const value = Math.min(100, Number(percent[1]));
  connectionToggle.dataset.progressMode = "determinate";
  connectionToggle.style.setProperty("--progress", `${value}%`);
  connectionProgress.setAttribute("aria-valuenow", String(value));
}

function pollForProgress() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    renderResult(await send("status"));
  }, currentResult.state === "connected" ? 2000 : 1200);
}

async function connectWithSavedPreferences() {
  const saved = await readPreferences();
  const entries = bridgeEntries();
  if (saved.mode === "manual" && !entries.length) {
    return { ok: false, state: "failed", error: "Enable at least one bridge in Settings before connecting." };
  }
  const selectedBridgeIndex = saved.mode === "manual" && !saved.autoBridgeSelection
    ? allBridgeEntries().indexOf(saved.selectedBridge) + 1
    : null;
  const bridges = selectedBridgeIndex ? saved.selectedBridge : entries.join("\n");
  return send("connect", { mode: saved.mode, bridges, selectedBridgeIndex, exitCountry: saved.exitCountry || "" });
}

connectionToggle.addEventListener("click", async () => {
  if (preferences.mode === "manual" && !bridgeEntries().length && currentState !== "connected" && currentState !== "starting") {
    chrome.runtime.openOptionsPage();
    return;
  }
  connectionToggle.disabled = true;
  connectionToggle.classList.add("is-pressing");
  if (currentState === "connected" || currentState === "starting") {
    setStatus("Disconnecting…", "starting");
    renderResult(await send("disconnect"));
    return;
  }
  setStatus("Connecting…", "starting");
  beginBridgeAttemptTimer();
  renderResult(await connectWithSavedPreferences());
});

copyBridgeButton.addEventListener("click", async () => {
  if (!routeBridgeLine) return;
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  copyBridgeButton.classList.remove("is-copied");
  copyBridgeButton.setAttribute("aria-label", "Copy full bridge line");
  copyBridgeButton.title = "Copy full bridge line";
  copyBridgeButton.disabled = true;
  try {
    const allowed = await new Promise((resolve) => chrome.permissions.request({ permissions: ["clipboardWrite"] }, resolve));
    if (!allowed) {
      copyBridgeButton.title = "Allow clipboard access to copy the bridge line";
      return;
    }
    await navigator.clipboard.writeText(routeBridgeLine);
    copyBridgeButton.classList.add("is-copied");
    copyBridgeButton.setAttribute("aria-label", "Bridge line copied");
    copyBridgeButton.title = "Bridge line copied";
    copyFeedbackTimer = window.setTimeout(() => {
      copyBridgeButton.classList.remove("is-copied");
      copyBridgeButton.setAttribute("aria-label", "Copy full bridge line");
      copyBridgeButton.title = "Copy full bridge line";
      copyFeedbackTimer = undefined;
    }, 1400);
  } catch {
    copyBridgeButton.title = "Could not copy bridge line";
    window.setTimeout(() => { copyBridgeButton.title = "Copy full bridge line"; }, 1800);
  } finally {
    copyBridgeButton.disabled = false;
  }
});

autoBridgeSelectionNode.addEventListener("change", () => {
  saveBridgeSelection(autoBridgeSelectionNode.checked, preferences.selectedBridge || bridgeEntries()[0] || "");
  renderRoute(currentResult);
});

document.addEventListener("tor-language-changed", () => renderResult(currentResult));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.torConnectionPreferences) return;
  const saved = changes.torConnectionPreferences.newValue || {};
  preferences = {
    mode: saved.mode === "manual" ? "manual" : "snowflake",
    bridges: typeof saved.bridges === "string" ? saved.bridges : "",
    autoBridgeSelection: saved.autoBridgeSelection !== false,
    selectedBridge: typeof saved.selectedBridge === "string" ? saved.selectedBridge : "",
    disabledBridges: Array.isArray(saved.disabledBridges) ? saved.disabledBridges : [],
    exitCountry: typeof saved.exitCountry === "string" ? saved.exitCountry : ""
  };
  if (!bridgeEntries().includes(preferences.selectedBridge)) preferences.selectedBridge = bridgeEntries()[0] || "";
  renderBridgeSelector();
  renderConnectionMethodSwitch();
  renderRoute(currentResult);
  refreshBridgeCountries();
});

readPreferences().then(async () => {
  renderConnectionMethodSwitch();
  let result;
  [result] = await Promise.all([send("status"), refreshBridgeCountries()]);
  // If the service worker was cold-starting it may return undefined before it is
  // ready. Retry silently a few times so the first renderResult call always has
  // a real response (avoids showing "Checking…" on the very first paint).
  if (!result) {
    for (let i = 0; i < 5 && !result; i++) {
      await new Promise((r) => setTimeout(r, 800));
      result = await send("status");
    }
  }
  renderResult(result);
});

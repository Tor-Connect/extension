const HOST_NAME = "org.torconnect.torchrome";
const PROXY_PORT = 9050;
let nativePort;
let pending = new Map();
let nextId = 1;
let lastLoggedStatus;
let lastActionConnected;
let connectivityGeneration = 0;
let connectivityCheckConnectionId;
let connectivityCheckState = "";
let connectivityCheckPromise;
let connectivitySiteResults = [];
let connectivityCheckAttempt = 0;
let connectivityCheckRetryAt = 0;
const CONNECTIVITY_CHECK_RETRY_DELAY_MS = 30_000;

function resetConnectivityCheck() {
  connectivityGeneration += 1;
  connectivityCheckConnectionId = undefined;
  connectivityCheckState = "";
  connectivityCheckPromise = undefined;
  connectivitySiteResults = [];
  connectivityCheckAttempt += 1;
  connectivityCheckRetryAt = 0;
}

function trackConnectivityConnection(result) {
  if (!result?.ok || result.state !== "connected") {
    resetConnectivityCheck();
    return connectivityGeneration;
  }

  const connectionId = result.connectedAt || "connected";
  const currentStartedAt = Number(connectivityCheckConnectionId);
  const incomingStartedAt = Number(connectionId);
  if (Number.isFinite(currentStartedAt) && Number.isFinite(incomingStartedAt) && incomingStartedAt < currentStartedAt) {
    return connectivityGeneration;
  }
  if (connectivityCheckConnectionId !== connectionId) {
    connectivityGeneration += 1;
    connectivityCheckConnectionId = connectionId;
    connectivityCheckState = "";
    connectivityCheckPromise = undefined;
    connectivitySiteResults = [];
    connectivityCheckAttempt += 1;
    connectivityCheckRetryAt = 0;
  }
  return connectivityGeneration;
}

const CONNECTIVITY_SITES = [
  { site: "youtube.com", url: "https://www.youtube.com/" },
  { site: "x.com", url: "https://x.com/" },
  { site: "instagram.com", url: "https://www.instagram.com/" },
  { site: "wikipedia.org", url: "https://www.wikipedia.org/" }
];

async function checkSiteReachability({ site, url }) {
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    try { await response.body?.cancel(); } catch { /* The response headers already establish reachability. */ }
    return { site, state: response.ok ? "passed" : "failed", latencyMs: Date.now() - startedAt };
  } catch {
    return { site, state: "failed", latencyMs: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkSitesReachability() {
  return Promise.all(CONNECTIVITY_SITES.map(checkSiteReachability));
}

function checkConnectivityAfterConnect(result, generation, { force = false } = {}) {
  if (generation !== connectivityGeneration || !result?.ok || result.state !== "connected") return;
  if (result.bridgeActivity === "trying") return;

  const connectionId = result.connectedAt || "connected";
  if (connectivityCheckConnectionId !== connectionId) return;
  if (connectivityCheckConnectionId === connectionId) {
    if ((!force && connectivityCheckState === "passed") || connectivityCheckPromise) return;
    if (connectivityCheckState === "failed" && Date.now() < connectivityCheckRetryAt) return;
  }
  connectivityCheckConnectionId = connectionId;
  const attempt = ++connectivityCheckAttempt;
  if (connectivityCheckState !== "failed") connectivityCheckState = "pending";
  connectivityCheckPromise = checkSitesReachability().then((siteResults) => {
    if (connectivityCheckConnectionId === connectionId && connectivityCheckAttempt === attempt) {
      connectivitySiteResults = siteResults;
      connectivityCheckState = siteResults.every((site) => site.state === "passed") ? "passed" : "failed";
      connectivityCheckRetryAt = connectivityCheckState === "passed" ? 0 : Date.now() + CONNECTIVITY_CHECK_RETRY_DELAY_MS;
      connectivityCheckPromise = undefined;
    }
  });
  return connectivityCheckPromise;
}

function addConnectivityCheck(result) {
  if (result?.ok && result.state === "connected") {
    const connectionId = result.connectedAt || "connected";
    result.connectivityCheck = connectivityCheckConnectionId === connectionId
      ? connectivityCheckState || "pending"
      : "pending";
    result.siteChecks = connectivityCheckConnectionId === connectionId && connectivitySiteResults.length
      ? connectivitySiteResults
      : CONNECTIVITY_SITES.map(({ site }) => ({ site, state: "pending", latencyMs: null }));
  }
  return result;
}

function logHelperResult(command, result) {
  const entry = {
    command,
    state: result?.state,
    message: result?.message,
    error: result?.error,
    bridgeCount: result?.bridgeCount,
    currentBridgeIndex: result?.currentBridgeIndex,
    bridgeTransport: result?.bridgeTransport,
    bridgeActivity: result?.bridgeActivity,
    diagnostics: Array.isArray(result?.diagnostics) ? result.diagnostics : []
  };
  const signature = JSON.stringify({
    ...entry,
    diagnostics: entry.diagnostics.map((line) => line.replace(/\bPID\s+\d+\b/g, "PID [pid]"))
  });
  if (signature === lastLoggedStatus) return;
  lastLoggedStatus = signature;
  console.info("[Tor extension] helper status", entry);
}

function connectHost() {
  if (nativePort) return nativePort;
  nativePort = chrome.runtime.connectNative(HOST_NAME);
  nativePort.onMessage.addListener((message) => {
    if (!message || typeof message.id !== "number") return;
    if (message.id === 0) {
      logHelperResult("heartbeat", message);
      const connected = message.ok && message.state === "connected";
      const generation = trackConnectivityConnection(message);
      if (connected) {
        setTorProxy().then(() => {
          if (generation === connectivityGeneration) checkConnectivityAfterConnect(message, generation);
        }).catch(() => {});
      } else {
        checkConnectivityAfterConnect(message, generation);
      }
      setActionConnected(connected, connected && message.bridgeActivity === "trying").catch(() => {});
      return;
    }
    const resolve = pending.get(message.id);
    if (resolve) {
      pending.delete(message.id);
      resolve(message);
    }
  });
  nativePort.onDisconnect.addListener(() => {
    const hostError = chrome.runtime.lastError?.message;
    const errorMessage = hostError
      ? `Native helper unavailable: ${hostError}. Check its installation and restart Chrome.`
      : "Native helper disconnected. Restart Chrome and check the helper installation.";
    console.warn("[Tor extension] native helper disconnected", errorMessage);
    nativePort = undefined;
    resetConnectivityCheck();
    setActionConnected(false).catch(() => {});
    chrome.alarms.clear("nativeHeartbeat");
    for (const resolve of pending.values()) resolve({ ok: false, error: errorMessage });
    pending.clear();
    // Keep an already configured proxy on helper failure so Chrome fails closed
    // instead of silently sending requests directly.
  });
  chrome.alarms.create("nativeHeartbeat", { periodInMinutes: 0.5 });
  return nativePort;
}

function request(command, fields = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let port;
    try { port = connectHost(); } catch (error) { reject(error); return; }
    const id = nextId++;
    pending.set(id, resolve);
    port.postMessage({ id, command, ...fields });
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      resolve({ ok: false, error: "The helper did not respond in time." });
    }, timeoutMs);
  });
}

async function clearProxy() {
  await chrome.proxy.settings.clear({ scope: "regular" });
}

async function setActionConnected(connected, reconnecting = false) {
  if (lastActionConnected !== connected) {
    const variant = connected ? "connected" : "disconnected";
    await chrome.action.setIcon({
      path: {
        16: `icons/${variant}-16.png`,
        32: `icons/${variant}-32.png`,
        48: `icons/${variant}-48.png`
      }
    });
    lastActionConnected = connected;
  }
  if (reconnecting) {
    await chrome.action.setIcon({
      path: {
        16: "icons/reconnecting-16.png",
        32: "icons/reconnecting-32.png",
        48: "icons/reconnecting-48.png"
      }
    });
  } else if (connected && lastActionConnected === connected) {
    await chrome.action.setIcon({
      path: {
        16: "icons/connected-16.png",
        32: "icons/connected-32.png",
        48: "icons/connected-48.png"
      }
    });
  }
  await chrome.action.setTitle({ title: reconnecting ? "Reconnecting to Tor" : connected ? "Connected to Tor" : "Tor connection" });
}

async function setTorProxy() {
  await chrome.proxy.settings.set({
    value: {
      mode: "fixed_servers",
      rules: { singleProxy: { scheme: "socks5", host: "127.0.0.1", port: PROXY_PORT } }
    },
    scope: "regular"
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (!message || typeof message.type !== "string") throw new Error("Invalid request.");
    if (message.type === "status") {
      const result = await request("status");
      logHelperResult("status", result);
      const connected = result.ok && result.state === "connected";
      const generation = trackConnectivityConnection(result);
      if (connected) {
        await setTorProxy();
        if (generation === connectivityGeneration) checkConnectivityAfterConnect(result, generation);
      } else {
        checkConnectivityAfterConnect(result, generation);
      }
      await setActionConnected(connected, connected && result.bridgeActivity === "trying");
      sendResponse(addConnectivityCheck(result));
      return;
    }
    if (message.type === "retestSites") {
      const result = await request("status");
      const generation = trackConnectivityConnection(result);
      if (result.ok && result.state === "connected") {
        await setTorProxy();
        if (generation === connectivityGeneration) {
          connectivityCheckState = "";
          connectivitySiteResults = [];
          connectivityCheckRetryAt = 0;
          await checkConnectivityAfterConnect(result, generation, { force: true });
        }
      }
      sendResponse(addConnectivityCheck(result));
      return;
    }
    if (message.type === "pingBridges") {
      const result = await request("ping", { bridges: message.bridges }, 45000);
      sendResponse(result);
      return;
    }
    if (message.type === "bridgeCountries") {
      const result = await request("countries", { bridges: message.bridges });
      sendResponse(result);
      return;
    }
    if (message.type === "connect") {
      const result = await request("start", {
        mode: message.mode,
        bridges: message.bridges,
        selectedBridgeIndex: message.selectedBridgeIndex
      });
      logHelperResult("start", result);
      const connected = result.ok && result.state === "connected";
      const generation = trackConnectivityConnection(result);
      if (connected) {
        await setTorProxy();
        if (generation === connectivityGeneration) checkConnectivityAfterConnect(result, generation);
      } else {
        checkConnectivityAfterConnect(result, generation);
      }
      await setActionConnected(connected);
      sendResponse(addConnectivityCheck(result));
      return;
    }
    if (message.type === "disconnect") {
      await clearProxy();
      await setActionConnected(false);
      const result = await request("stop");
      logHelperResult("stop", result);
      sendResponse(result);
      return;
    }
    throw new Error("Unsupported request.");
  })().catch((error) => sendResponse({ ok: false, error: error.message || "Request failed." }));
  return true;
});

// Clear any leftover extension setting on first install. On browser restart,
// retain an existing Tor proxy so requests fail instead of going direct until reconnect.
chrome.runtime.onInstalled.addListener(() => {
  clearProxy().catch(() => {});
  setActionConnected(false).catch(() => {});
});
chrome.runtime.onStartup.addListener(() => setActionConnected(false).catch(() => {}));
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "nativeHeartbeat" && nativePort) {
    nativePort.postMessage({ id: 0, command: "status" });
  }
});

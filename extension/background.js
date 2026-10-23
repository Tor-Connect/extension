const HOST_NAME = "org.torconnect.torchrome";
const PROXY_PORT = 9050;
let nativePort;
let pending = new Map();
let nextId = 1;
let lastLoggedStatus;
let lastActionConnected;
let connectivityCheckConnectionId;
let connectivityCheckState = "";
let connectivityCheckPromise;

async function checkTorReachability() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://check.torproject.org/api/ip", {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.IsTor === true || result?.isTor === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function checkConnectivityAfterConnect(result) {
  if (result?.state !== "connected") {
    connectivityCheckConnectionId = undefined;
    connectivityCheckState = "";
    connectivityCheckPromise = undefined;
    return;
  }
  if (result.bridgeActivity === "trying") return;

  const connectionId = result.connectedAt || "connected";
  if (connectivityCheckConnectionId === connectionId && (connectivityCheckState || connectivityCheckPromise)) return;
  connectivityCheckConnectionId = connectionId;
  connectivityCheckState = "pending";
  connectivityCheckPromise = checkTorReachability().then((reachable) => {
    if (connectivityCheckConnectionId === connectionId) {
      connectivityCheckState = reachable ? "passed" : "failed";
      connectivityCheckPromise = undefined;
    }
  });
}

function addConnectivityCheck(result) {
  if (result?.state === "connected") {
    result.connectivityCheck = connectivityCheckConnectionId ? connectivityCheckState || "pending" : "pending";
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
      if (connected) {
        setTorProxy().then(() => checkConnectivityAfterConnect(message)).catch(() => {});
      } else {
        checkConnectivityAfterConnect(message);
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
      if (connected) {
        await setTorProxy();
        checkConnectivityAfterConnect(result);
      } else {
        checkConnectivityAfterConnect(result);
      }
      await setActionConnected(connected, connected && result.bridgeActivity === "trying");
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
      if (connected) {
        await setTorProxy();
        checkConnectivityAfterConnect(result);
      } else {
        checkConnectivityAfterConnect(result);
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

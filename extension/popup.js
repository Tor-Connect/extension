const statusNode = document.querySelector("#status");
const routeCardNode = document.querySelector("#routeCard");
const errorDetailsNode = document.querySelector("#errorDetails");
const errorTextNode = document.querySelector("#errorText");
// Legacy route-identity nodes kept for JS compat (hidden in new design)
const routeIdentityNode = document.querySelector(".route-identity");
const routeNameNode = document.querySelector("#routeName");
const routeDetailNode = document.querySelector("#routeDetail");
const bridgeCountryFlagNode = document.querySelector("#bridgeCountryFlag");
const bridgeAttemptTimerNode = document.querySelector("#bridgeAttemptTimer");
const connectedDurationNode = document.querySelector("#connectedDuration");
const statusDetailNode = document.querySelector("#statusDetail");
const metaSeparatorNode = document.querySelector(".meta-separator");
// Globe-stage nodes
const globeStageNode = document.querySelector("#globeStage");
const globeDotsBridgeNode = document.querySelector("#globeDotsBridge");
const globeDotsSnowNode = document.querySelector("#globeDotsSnow");
const globeSnowfallNode = document.querySelector("#globeSnowfall");
const globeSkinDE = document.querySelector("#globeSkinDE");
const globeSkinJP = document.querySelector("#globeSkinJP");
const globeSkinBR = document.querySelector("#globeSkinBR");
const globeRouteDrawNode = document.querySelector("#globeRouteDraw");
const globeRouteFlowNode = document.querySelector("#globeRouteFlow");
const globeExitNodeEl = document.querySelector("#globeExitNode");
const globeExitLabelNode = document.querySelector("#globeExitLabel");
const globeEntryLabelNode = document.querySelector("#globeEntryLabel");
const globeEntryCCNode = document.querySelector("#globeEntryCC");
const globeEntryNameNode = document.querySelector("#globeEntryName");
const globeEntryIdleNode = document.querySelector("#globeEntryIdle");
const globeEntryTryNode = document.querySelector("#globeEntryTry");
const globeEntryFailNode = document.querySelector("#globeEntryFail");
const globeEntryOkNode = document.querySelector("#globeEntryOk");
const globeEntryTryCCNode = document.querySelector("#globeEntryTryCC");
// Keep legacy aliases used elsewhere
const globeDotsNode = globeDotsBridgeNode;
const globeCountrySkinNode = null; // replaced by per-country skins
// Method switch (pager)
const methodSwitchNode = document.querySelector("#connectionMethodSwitch");
const methodButtons = [...document.querySelectorAll(".connection-method-option")];
const methodIndicatorNode = document.querySelector(".connection-method-indicator");
// Bottom card
const idleCardNode = document.querySelector("#idleCard");
const idleCardIconNode = document.querySelector("#idleCardIcon");
const idleCardTitleNode = document.querySelector("#idleCardTitle");
const idleCardSubNode = document.querySelector("#idleCardSub");
const bridgesSheetToggleNode = document.querySelector("#bridgesSheetToggle");
// Empty bridge info (manual mode, no bridges)
const emptyBridgeInfoNode = document.querySelector("#emptyBridgeInfo");
const addBridgesButton = document.querySelector("#addBridges");
const copyBridgeButton = document.querySelector("#copyBridge");
const connectionToggle = document.querySelector("#connectionToggle");
const connectionProgress = document.querySelector("#connectionProgress");
const popupMainNode = document.querySelector(".popup-main");
const setupPanelNode = document.querySelector("#setupPanel");
const setupDescriptionNode = document.querySelector("#setupDescription");
const outdatedPanelNode = document.querySelector("#outdatedPanel");
const mainHeadingNode = document.querySelector(".popup-main > .heading");
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
// Bridges sheet
const bridgesSheetNode = document.querySelector("#bridgesSheet");
const bridgesBackdropNode = document.querySelector("#bridgesBackdrop");
const closeBridgesNode = document.querySelector("#closeBridges");
const bridgeRowsNode = document.querySelector("#bridgeRows");
const addBridgesFromSheetButton = document.querySelector("#addBridgesFromSheet");
let bridgesSheetOpen = false;
let statsPollTimer;
let lastStatsSample;
let pollTimer;
let outdatedPollGeneration = 0;
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
let firefoxPermissionPollTimer;
let firefoxPermissionSuccessTimer;
let globeEntryRetryPending = false;
let globeEntryWasFailing = false;
let lastGlobeEntryAttemptIndex = 0;
let globeRouteDrawWasVisible = false;
let globeRouteDrawComplete = false;
let connectionRevealPending = false;
let connectionRevealTimer;
let connectionRevealFallbackTimer;
let connectionRevealReleased = false;
let globeOrientationExitCode = "";
let globeRotationPlayed = false;
let siteCheckBadgeHideTimer;
let siteCheckBadgeState = "";
const t = (key, params) => (globalThis.torI18n?.t || ((s) => s))(key, params);

// Exit-country centers commonly returned by Tor relays. Coordinates are
// latitude/longitude in degrees; the three design skins anchor the globe.
const EXIT_COUNTRY_CENTERS = {
  AD:[42.55,1.60], AE:[23.42,53.85], AL:[41.15,20.17], AR:[-38.42,-63.62], AT:[47.52,14.55], AU:[-25.27,133.78],
  AZ:[40.14,47.58], BA:[43.92,17.68], BD:[23.68,90.36], BE:[50.50,4.47], BG:[42.73,25.49], BR:[-14.24,-51.93],
  BY:[53.71,27.95], CA:[56.13,-106.35], CH:[46.82,8.23], CL:[-35.68,-71.54], CN:[35.86,104.20], CO:[4.57,-74.30],
  CR:[9.75,-83.75], CZ:[49.82,15.47], DE:[51.17,10.45], DK:[56.26,9.50], DO:[18.74,-70.16], DZ:[28.03,1.66],
  EC:[-1.83,-78.18], EE:[58.60,25.01], EG:[26.82,30.80], ES:[40.46,-3.75], FI:[61.92,25.75], FR:[46.23,2.21],
  GB:[55.38,-3.44], GE:[42.32,43.36], GH:[7.95,-1.02], GR:[39.07,21.82], HR:[45.10,15.20], HU:[47.16,19.50],
  ID:[-0.79,113.92], IE:[53.41,-8.24], IL:[31.05,34.85], IN:[20.59,78.96], IR:[32.43,53.69], IS:[64.96,-19.02],
  IT:[41.87,12.57], JP:[36.20,138.25], KE:[-0.02,37.91], KR:[35.91,127.77], LT:[55.17,23.88], LU:[49.82,6.13],
  LV:[56.88,24.60], MD:[47.41,28.37], MX:[23.63,-102.55], MY:[4.21,101.98], NG:[9.08,8.68], NL:[52.13,5.29],
  NO:[60.47,8.47], NZ:[-40.90,174.89], PA:[8.54,-80.78], PE:[-9.19,-75.02], PH:[12.88,121.77], PK:[30.38,69.35],
  PL:[51.92,19.15], PT:[39.40,-8.22], RO:[45.94,24.97], RS:[44.02,21.01], RU:[61.52,105.32], SA:[23.89,45.08],
  SE:[60.13,18.64], SG:[1.35,103.82], TH:[15.87,100.99], TR:[38.96,35.24], TW:[23.70,120.96], UA:[48.38,31.17],
  US:[37.09,-95.71], UY:[-32.52,-55.77], UZ:[41.38,64.59], VN:[14.06,108.28], ZA:[-30.56,22.94]
};

const GLOBE_SKINS = [
  globeSkinDE,
  globeSkinJP,
  globeSkinBR
];

function radians(degrees) { return degrees * Math.PI / 180; }
const GLOBE_RADIUS = 116;
const GLOBE_PITCH = radians(11);
const GLOBE_GRID_STEP = 3.5;
const CONNECTION_REVEAL_FALLBACK_MS = 4000;
let globeLandMask;
let globeLandMaskPromise;

function loadGlobeLandMask() {
  if (globeLandMask) return Promise.resolve(globeLandMask);
  if (!globeLandMaskPromise) {
    globeLandMaskPromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0);
        globeLandMask = {
          width: canvas.width,
          height: canvas.height,
          pixels: context.getImageData(0, 0, canvas.width, canvas.height).data
        };
        resolve(globeLandMask);
      };
      image.onerror = () => resolve(null);
      image.src = chrome.runtime.getURL("assets/globe-land-mask.png");
    });
  }
  return globeLandMaskPromise;
}

function renderGeographicDotMap(node, centerLongitude) {
  if (!node || !globeLandMask) return;
  const centerKey = String(Math.round(centerLongitude * 1000) / 1000);
  if (node.dataset.globeCenterLongitude === centerKey) return;

  const dotField = node.firstElementChild;
  if (!dotField) return;
  const { width, height, pixels } = globeLandMask;
  const circles = [];
  const sinPitch = Math.sin(GLOBE_PITCH);
  const cosPitch = Math.cos(GLOBE_PITCH);
  const longitudeStep = GLOBE_GRID_STEP;
  for (let row = 0, latitudeDegrees = -62; latitudeDegrees <= 82; row += 1, latitudeDegrees += GLOBE_GRID_STEP) {
    const latitude = radians(latitudeDegrees);
    const cosLatitude = Math.cos(latitude);
    const sinLatitude = Math.sin(latitude);
    const stagger = row % 2 ? longitudeStep / 2 : 0;
    for (let longitudeDegrees = -180 + stagger; longitudeDegrees < 180; longitudeDegrees += longitudeStep) {
      const longitude = radians(longitudeDegrees);
      const relativeLongitude = longitude - centerLongitude;
      const sphereX = cosLatitude * Math.sin(relativeLongitude);
      const sphereY = sinLatitude;
      const sphereDepth = cosLatitude * Math.cos(relativeLongitude);

      // Pitch the globe toward the viewer while keeping its north pole upright.
      const projectedY = sphereY * cosPitch - sphereDepth * sinPitch;
      const depth = sphereY * sinPitch + sphereDepth * cosPitch;
      if (depth <= 0) continue;

      const mapLongitudeDegrees = ((longitudeDegrees + 180) % 360 + 360) % 360;
      const mapX = Math.min(width - 1, Math.floor(mapLongitudeDegrees / 360 * width));
      const mapY = Math.max(0, Math.min(height - 1, Math.floor((90 - latitudeDegrees) / 180 * height)));
      if (!pixels[(mapY * width + mapX) * 4 + 3]) continue;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", (160 + sphereX * GLOBE_RADIUS).toFixed(1));
      circle.setAttribute("cy", (160 - projectedY * GLOBE_RADIUS).toFixed(1));
      circle.setAttribute("r", (0.95 + depth * 0.65).toFixed(2));
      circles.push(circle);
    }
  }
  dotField.replaceChildren(...circles);
  node.dataset.globeCenterLongitude = centerKey;
}

function projectGlobePoint(latitudeDegrees, longitudeDegrees, centerLongitude) {
  const latitude = radians(latitudeDegrees);
  const relativeLongitude = radians(longitudeDegrees) - centerLongitude;
  const cosLatitude = Math.cos(latitude);
  const sphereX = cosLatitude * Math.sin(relativeLongitude);
  const sphereY = Math.sin(latitude);
  const sphereDepth = cosLatitude * Math.cos(relativeLongitude);
  const projectedY = sphereY * Math.cos(GLOBE_PITCH) - sphereDepth * Math.sin(GLOBE_PITCH);
  const depth = sphereY * Math.sin(GLOBE_PITCH) + sphereDepth * Math.cos(GLOBE_PITCH);
  return {
    x: 160 + sphereX * GLOBE_RADIUS,
    y: 160 - projectedY * GLOBE_RADIUS,
    depth
  };
}

function setGlobeGroupVisible(node, visible) {
  if (!node) return;
  if (visible) {
    node.removeAttribute("hidden");
    node.style.removeProperty("display");
  } else {
    node.setAttribute("hidden", "");
  }
}

function setGlobeRotationBrightness(enabled) {
  const fill = document.documentElement.dataset.theme === "light" ? "#238b58" : "#55b985";
  [globeDotsBridgeNode, globeDotsSnowNode, ...GLOBE_SKINS].forEach((node) => {
    node?.querySelectorAll("circle").forEach((circle) => {
      if (enabled) {
        circle.style.setProperty("fill", fill, "important");
        circle.style.setProperty("animation", "none", "important");
        circle.style.setProperty("opacity", "1", "important");
      } else {
        circle.style.removeProperty("fill");
        circle.style.removeProperty("animation");
        circle.style.removeProperty("opacity");
      }
    });
  });
}

function releaseConnectionReveal() {
  connectionRevealPending = false;
  connectionRevealReleased = true;
  clearTimeout(connectionRevealFallbackTimer);
  connectionRevealFallbackTimer = undefined;
  renderResult(currentResult);
}

// Populate the globe dot field with a projected lat/lon grid.
// The SVG viewBox is 320×320; globe centre cx=160, cy=160, r=116.
// Drive all state-conditional globe SVG groups from the connection result.
// Maps directly to the design's sc-if conditions.
function renderGlobe(result = {}) {
  const state = result.state || "disconnected";
  const snow = preferences.mode === "snowflake";
  routeCardNode.dataset.mode = preferences.mode;
  const isOff = state === "disconnected" || state === "failed";
  const isConn = state === "starting";
  const isOn = state === "connected";
  const phase = result.bridgeActivity || "";
  const isRetrying = isOn && ["trying", "failed", "closed"].includes(phase);
  const isEntryConnecting = isConn || isRetrying;
  const attemptIndex = Number(result.currentBridgeIndex) || 0;
  if (isEntryConnecting && attemptIndex > 0 && lastGlobeEntryAttemptIndex > 0
    && attemptIndex !== lastGlobeEntryAttemptIndex) {
    globeEntryRetryPending = true;
  }
  if (attemptIndex > 0) lastGlobeEntryAttemptIndex = attemptIndex;
  else if (isOff && !globeEntryRetryPending) lastGlobeEntryAttemptIndex = 0;
  const found = isConn && phase === "connected"; // OR connection confirms the entry responded
  const isFail = !found && (["failed", "closed"].includes(phase) || state === "failed")
    && (isEntryConnecting || state === "failed");
  const isEntryFound = isConn ? found : isOn && !isRetrying;

  // Snowfall: snowflake mode, not connected
  if (globeSnowfallNode) globeSnowfallNode.hidden = !(snow && !isOn);

  const exitCC = (result.exitRelayCountryCode || "").toUpperCase();
  const exitCenter = EXIT_COUNTRY_CENTERS[exitCC];
  if (!isOn) {
    globeOrientationExitCode = "";
    globeRotationPlayed = false;
  } else if (exitCenter && exitCC !== globeOrientationExitCode) {
    globeOrientationExitCode = exitCC;
  }
  const globeMapNode = snow ? globeDotsSnowNode : globeDotsBridgeNode;
  setGlobeGroupVisible(globeDotsBridgeNode, !snow);
  setGlobeGroupVisible(globeDotsSnowNode, snow);
  GLOBE_SKINS.forEach((skin) => setGlobeGroupVisible(skin, false));
  const orientationCenter = EXIT_COUNTRY_CENTERS[globeOrientationExitCode];
  const centerLongitude = isOn && orientationCenter
    ? radians(orientationCenter[1])
    : radians(20);
  renderGeographicDotMap(globeMapNode, centerLongitude);
  if (!globeLandMask) {
    loadGlobeLandMask().then((mask) => {
      if (mask) renderGlobe(currentResult || {});
    });
  }

  if (isOn && exitCenter) {
    const projectedExit = projectGlobePoint(exitCenter[0], exitCenter[1], centerLongitude);
    const exitX = projectedExit.x;
    const exitY = projectedExit.y;
    globeExitNodeEl?.querySelectorAll("circle").forEach((circle) => {
      circle.setAttribute("cx", String(exitX));
      circle.setAttribute("cy", String(exitY));
    });
    const routeSide = exitX < 160 ? -1 : 1;
    const routePath = `M160 294 C ${160 + routeSide * 158} 292 ${160 + routeSide * 144} ${exitY + 13} ${exitX} ${exitY}`;
    globeRouteDrawNode?.querySelectorAll("path").forEach((path) => path.setAttribute("d", routePath));
    globeRouteFlowNode?.querySelectorAll("path").forEach((path) => path.setAttribute("d", routePath));
    globeRouteFlowNode?.querySelector("animateMotion")?.setAttribute("path", routePath);
    if (globeExitLabelNode) {
      globeExitLabelNode.style.left = `${exitX}px`;
      globeExitLabelNode.style.top = `${Math.max(4, exitY - 8)}px`;
    }
  } else {
    globeExitNodeEl?.querySelectorAll("circle").forEach((circle) => {
      circle.setAttribute("cx", "160");
      circle.setAttribute("cy", "87.4");
    });
    globeExitLabelNode?.style.removeProperty("left");
    globeExitLabelNode?.style.removeProperty("top");
  }

  // Draw the route only after connection succeeds and the exit location is known.
  // Until then the line would point to the SVG's placeholder endpoint.
  if (!isOn || isRetrying) globeRouteDrawComplete = false;
  const routeReady = isOn && !isRetrying && !!exitCenter;
  const reduceRouteMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (routeReady && !globeRotationPlayed) {
    globeRotationPlayed = true;
    routeCardNode.dataset.globeRotating = "true";
    setGlobeRotationBrightness(true);
    if (!reduceRouteMotion && typeof globeMapNode?.animate === "function") {
      globeMapNode.style.transformBox = "view-box";
      globeMapNode.style.transformOrigin = "160px 160px";
      globeMapNode.animate([
        { transform: "rotate(-50deg) scale(.94)" },
        { transform: "none" }
      ], { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }
  if (isOn && connectionRevealPending && globeRotationPlayed) {
    routeCardNode.dataset.globeRotating = "true";
    setGlobeRotationBrightness(true);
  }
  if (routeReady && reduceRouteMotion) globeRouteDrawComplete = true;
  const showRouteDraw = routeReady && !globeRouteDrawComplete;
  setGlobeGroupVisible(globeRouteDrawNode, showRouteDraw);
  if (showRouteDraw && !globeRouteDrawWasVisible) {
    const drawPath = globeRouteDrawNode?.querySelector(".draw");
    if (drawPath) {
      drawPath.style.animation = "none";
      drawPath.style.strokeDasharray = "100";
      drawPath.style.strokeDashoffset = "100";
      void drawPath.getBBox();
      drawPath.style.animation = "globe-route-draw 1s ease-in-out both";
      drawPath.addEventListener("animationend", () => {
        globeRouteDrawComplete = true;
        renderGlobe(currentResult);
        if (connectionRevealPending && globeExitLabelNode && !globeExitLabelNode.hidden) {
          clearTimeout(connectionRevealTimer);
          connectionRevealTimer = setTimeout(() => {
            connectionRevealTimer = undefined;
            const stillConnected = currentResult?.state === "connected"
              && !["trying", "failed", "closed"].includes(currentResult.bridgeActivity);
            if (!stillConnected || globeExitLabelNode.hidden) return;
            releaseConnectionReveal();
          }, 450);
        }
      }, { once: true });
    }
  }
  globeRouteDrawWasVisible = showRouteDraw;
  setGlobeGroupVisible(globeRouteFlowNode, routeReady && globeRouteDrawComplete);

  // Let the route reach its known endpoint before revealing the exit marker and label.
  const showExitMarker = routeReady && !!exitCC && globeRouteDrawComplete;
  setGlobeGroupVisible(globeExitNodeEl, showExitMarker);
  if (globeExitLabelNode) {
    const country = exitCC
      ? (new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(exitCC) || exitCC)
      : "";
    globeExitLabelNode.textContent = country;
    globeExitLabelNode.hidden = !(showExitMarker && !!country);
  }
  if (reduceRouteMotion && connectionRevealPending && globeExitLabelNode && !globeExitLabelNode.hidden && !connectionRevealTimer) {
    connectionRevealTimer = setTimeout(() => {
      connectionRevealTimer = undefined;
      const stillConnected = currentResult?.state === "connected"
        && !["trying", "failed", "closed"].includes(currentResult.bridgeActivity);
      if (!stillConnected || globeExitLabelNode.hidden) return;
      releaseConnectionReveal();
    }, 0);
  }

  // Entry node: exactly one visible at a time
  setGlobeGroupVisible(globeEntryIdleNode, isOff);
  setGlobeGroupVisible(globeEntryTryNode, isEntryConnecting && !found && !isFail);
  setGlobeGroupVisible(globeEntryFailNode, isFail);
  setGlobeGroupVisible(globeEntryOkNode, isEntryFound);
  const entryVisualState = isFail ? "fail"
    : isEntryConnecting && !found ? "trying"
      : isEntryFound ? "found"
        : isOff ? "idle" : "inactive";
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (isFail && !globeEntryWasFailing && !reduceMotion && typeof globeEntryFailNode?.animate === "function") {
    globeEntryFailNode.style.transformBox = "fill-box";
    globeEntryFailNode.style.transformOrigin = "center";
    globeEntryFailNode.animate([
      { transform: "translate(0, 0)" },
      { transform: "translate(-32px, -7px)", offset: .38 },
      { transform: "translate(0, 0)" }
    ], { duration: 460, easing: "cubic-bezier(.2,.8,.3,1)" });
  }
  globeEntryWasFailing = isFail;
  if (isFail) globeEntryRetryPending = true;
  if (globeEntryRetryPending && entryVisualState === "trying" && globeEntryTryNode) {
    if (!reduceMotion) {
      globeEntryTryNode.style.transformBox = "fill-box";
      globeEntryTryNode.style.transformOrigin = "center";
      if (typeof globeEntryTryNode.animate === "function") {
        globeEntryTryNode.animate([
          { transform: "translate(-34px, -8px) scale(.88)" },
          { transform: "translate(5px, 1px) scale(1.05)", offset: .72 },
          { transform: "translate(0, 0) scale(1)" }
        ], { duration: 680, easing: "cubic-bezier(.2,.8,.3,1)" });
      } else {
        globeEntryTryNode.classList.remove("is-retrying");
        void globeEntryTryNode.getBoundingClientRect();
        globeEntryTryNode.classList.add("is-retrying");
      }
    }
    globeEntryRetryPending = false;
  }
  if (entryVisualState === "found") globeEntryRetryPending = false;
  let entryCC = (result.bridgeCountryCode || "").toUpperCase();
  if (!entryCC && !snow) {
    const entries = bridgeEntries();
    const activePosition = activeBridgePosition(result, entries);
    const position = activePosition >= 0 ? activePosition
      : lastShownPosition >= 0 ? lastShownPosition : selectedBridgePosition(entries);
    entryCC = (bridgeCountries.get(entries[position]) || "").toUpperCase();
  }
  if (globeEntryTryCCNode) globeEntryTryCCNode.textContent = entryCC;

  // Entry label: country code + bridge name shown below globe when connected
  if (globeEntryLabelNode) {
    const bridgeNum = snow ? t("Snowflake")
      : result.currentBridgeIndex ? t("Bridge {n}", { n: result.currentBridgeIndex }) : t("Bridge");
    if (globeEntryCCNode) globeEntryCCNode.textContent = entryCC;
    if (globeEntryNameNode) globeEntryNameNode.textContent = bridgeNum;
    globeEntryLabelNode.hidden = !isEntryFound;
  }
}

function closePermissionErrorDetails(restoreFocus = true) {
  const wasOpen = !permissionErrorSheetNode.hidden;
  permissionErrorSheetNode.hidden = true;
  permissionErrorBackdropNode.hidden = true;
  showPermissionErrorDetailsButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && wasOpen) showPermissionErrorDetailsButton.focus();
}

function openPermissionErrorDetails() {
  permissionErrorTextNode.textContent = t("Private browsing access is off for this add-on. Firefox blocks proxy control until it is allowed.");
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
    button.setAttribute("aria-label", t("Copied"));
    window.setTimeout(() => {
      button.classList.remove("is-copied");
      button.removeAttribute("aria-label");
    }, 1500);
  } catch {
    button.title = t("Could not copy text");
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
    firefoxPermissionTitleNode.textContent = t("Allowed");
    firefoxPermissionSubtitleNode.textContent = t("You’re all set.");
    firefoxPermissionSuccessTimer = window.setTimeout(() => {
      firefoxPermissionPanelNode.hidden = true;
      firefoxPermissionPanelNode.classList.remove("permission-granted");
      firefoxPermissionTitleNode.textContent = t("One switch to flip");
      firefoxPermissionSubtitleNode.textContent = t("Firefox needs “Run in Private Windows” on to route your traffic, even in normal windows.");
      renderResult({ ok: true, state: "disconnected" });
    }, 1600);
    return;
  }
  firefoxPermissionPollTimer = window.setTimeout(watchFirefoxPermission, 1400);
}

function showFirefoxPermission() {
  stopFirefoxPermissionWatch();
  closePermissionErrorDetails(false);
  permissionErrorTextNode.textContent = t("Private browsing access is off for this add-on. Firefox blocks proxy control until it is allowed.");
  popupMainNode.dataset.view = "firefox-permission";
  firefoxPermissionPanelNode.hidden = false;
  firefoxPermissionPanelNode.classList.remove("permission-granted");
  firefoxPermissionTitleNode.textContent = t("One switch to flip");
  firefoxPermissionSubtitleNode.textContent = t("Firefox needs “Run in Private Windows” on to route your traffic, even in normal windows.");
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
  statsToggleNode.setAttribute("aria-label", t("Open live statistics"));
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
  statsToggleNode.setAttribute("aria-label", t("Close live statistics"));
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
  try {
    // retestSites runs site checks each with an 8-second timeout, so
    // allow up to 40 seconds before falling back to a plain status poll.
    let result = await send("retestSites", {}, 40000);
    if (!result) result = await send("status");
    renderResult(result);
  } finally { button.disabled = false; }
});
nextRouteNode.addEventListener("click", async () => {
  nextRouteNode.disabled = true;
  // Focus the toggle before closing the sheet so the popup does not lose focus
  // (Chrome closes the popup the moment focus leaves the window).
  connectionToggle.focus();
  closeSiteCheck();
  setStatus(t("Connecting…"), "starting");
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
  if (bridgesSheetOpen && !bridgesSheetNode.contains(event.target)) closeBridgesNode.focus();
});

function closeBridgesSheet() {
  const wasOpen = bridgesSheetOpen;
  bridgesSheetOpen = false;
  bridgesSheetNode.classList.remove("is-open");
  bridgesBackdropNode.classList.remove("is-open");
  if (bridgesSheetToggleNode) bridgesSheetToggleNode.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    if (!bridgesSheetOpen) {
      bridgesSheetNode.hidden = true;
      bridgesBackdropNode.hidden = true;
    }
  }, 300);
  if (wasOpen) (bridgesSheetToggleNode?.hidden === false ? bridgesSheetToggleNode : connectionToggle).focus();
}

function openBridgesSheet() {
  bridgesSheetOpen = true;
  bridgesSheetNode.hidden = false;
  bridgesBackdropNode.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bridgesSheetNode.classList.add("is-open");
    bridgesBackdropNode.classList.add("is-open");
  }));
  if (bridgesSheetToggleNode) bridgesSheetToggleNode.setAttribute("aria-expanded", "true");
  closeBridgesNode.focus();
}

closeBridgesNode.addEventListener("click", closeBridgesSheet);
bridgesBackdropNode.addEventListener("click", closeBridgesSheet);
if (addBridgesFromSheetButton) addBridgesFromSheetButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
if (bridgesSheetToggleNode) bridgesSheetToggleNode.addEventListener("click", openBridgesSheet);

bridgesSheetNode.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { event.preventDefault(); closeBridgesSheet(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...bridgesSheetNode.querySelectorAll("button:not([disabled]):not([hidden])")];
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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

// Gas-station digit roll: only the characters that changed slide in from above.
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
    : (result.bridgeCountryCode ? result.bridgeCountryCode.toUpperCase() : "—");
  document.querySelector("#statsRouteName").textContent = snowflake ? t("Snowflake") : (result.bridgeTransport || t("Bridge"));
  const statsAddr = document.querySelector("#statsRouteAddress");
  statsAddr.textContent = snowflake
    ? (result.builtCircuitCount > 0 ? t("{n} circuits", { n: result.builtCircuitCount }) : "—")
    : (result.bridgeAddress || "—");
  statsAddr.classList.toggle("is-label", snowflake);
  const summary = document.querySelector("#connectedStatsSummary");
  summary.hidden = result.state !== "connected";
  statsToggleNode.hidden = result.state !== "connected";
  if (result.state !== "connected" && !liveStatsNode.hidden) closeLiveStats();
  // Connected bottom card: show exit IP if available (matches design), otherwise bridge
  const hasExitIp = !!result.exitRelayIp;
  const summaryName = document.querySelector("#summaryRouteName");
  const summaryAddr = document.querySelector("#summaryRouteAddress");
  if (hasExitIp) {
    summaryName.textContent = result.exitRelayIp;
    summaryAddr.textContent = t("The address websites see");
    summaryAddr.classList.remove("is-label");
  } else {
    summaryName.textContent = snowflake ? t("Snowflake") : (result.currentBridgeIndex ? t("Bridge {n}", { n: result.currentBridgeIndex }) : t("Bridge"));
    summaryAddr.textContent = snowflake ? t("Volunteer proxy") : (result.bridgeAddress || "");
    summaryAddr.classList.toggle("is-label", snowflake);
  }
  document.querySelector("#summaryDownloadRate").textContent = Number.isFinite(down) ? downRate : "—";
  document.querySelector("#summaryUploadRate").textContent = Number.isFinite(up) ? upRate : "—";
  const summaryIcon = document.querySelector("#summaryRouteIcon");
  if (hasExitIp) {
    summaryIcon.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>';
    summaryIcon.classList.remove("is-snowflake");
    summaryIcon.classList.add("is-globe");
  } else {
    summaryIcon.innerHTML = "";
    summaryIcon.textContent = snowflake ? "" : (result.bridgeCountryCode || "—").toUpperCase();
    summaryIcon.classList.toggle("is-snowflake", snowflake);
    summaryIcon.classList.remove("is-globe");
  }
  const showExit = !!result.exitRelayIp;
  document.querySelector("#statsExitCapCell").hidden = !showExit;
  document.querySelector("#statsExitLabel").hidden = !showExit;
  document.querySelector("#copyExitIp").hidden = !showExit;
  if (!showExit) {
    document.querySelector("#statsExitBadge").textContent = "";
  } else {
    const countryCode = (result.exitRelayCountryCode || "").toUpperCase();
    const countryName = countryCode
      ? (new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(countryCode) || countryCode)
      : "";
    document.querySelector("#statsExitBadge").textContent = countryCode || "—";
    document.querySelector("#statsExitLabel").textContent = countryName || t("Exit");
    const ip = result.exitRelayIp;
    const ipNode = document.querySelector("#statsExitIp");
    ipNode.textContent = ip;
    ipNode.title = ip;
    const copyBtn = document.querySelector("#copyExitIp");
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(ip).then(() => {
        copyBtn.classList.add("is-copied");
        copyBtn.setAttribute("aria-label", t("Copied"));
        window.setTimeout(() => {
          copyBtn.classList.remove("is-copied");
          copyBtn.setAttribute("aria-label", t("Copy exit IP address"));
        }, 1500);
      }).catch(() => {
        copyBtn.classList.add("is-error");
        copyBtn.setAttribute("aria-label", t("Could not copy text"));
        window.setTimeout(() => {
          copyBtn.classList.remove("is-error");
          copyBtn.setAttribute("aria-label", t("Copy exit IP address"));
        }, 1500);
      });
    };
  }
  if (Number.isFinite(down) || Number.isFinite(up)) lastStatsSample = { down, up, time: now };
  renderSiteCheck(result);
}

const SITE_CHECK_NAMES = ["torproject.org", "tor-connect.github.io"];
function renderSiteCheck(result = {}) {
  const sites = Array.isArray(result.siteChecks) ? result.siteChecks : [];
  const total = SITE_CHECK_NAMES.length;
  const connected = result.state === "connected"
    && !["trying", "failed", "closed"].includes(result.bridgeActivity)
    && ["pending", "passed", "failed"].includes(result.connectivityCheck);
  const failures = sites.filter((site) => site.state === "failed").length;
  const pending = result.connectivityCheck === "pending" || sites.some((site) => site.state === "pending");
  const badgeState = !connected ? "disconnected" : pending ? "pending" : failures ? `failed:${failures}` : "passed";
  if (badgeState !== siteCheckBadgeState) {
    if (siteCheckBadgeHideTimer) clearTimeout(siteCheckBadgeHideTimer);
    siteCheckBadgeHideTimer = undefined;
    siteCheckBadgeState = badgeState;
    siteCheckBadgeNode.classList.remove("is-expiring");
    // Keep site status in the text row above the globe; never overlay a badge on the map.
    siteCheckBadgeNode.hidden = true;
    if (badgeState === "passed") {
      siteCheckBadgeHideTimer = window.setTimeout(() => {
        siteCheckBadgeNode.classList.add("is-expiring");
        siteCheckBadgeHideTimer = window.setTimeout(() => {
          siteCheckBadgeNode.hidden = true;
          siteCheckBadgeNode.classList.remove("is-expiring");
          siteCheckBadgeHideTimer = undefined;
        }, 260);
      }, 3200);
    }
  }
  siteCheckSummaryNode.hidden = !connected;
  const checkLabel = pending ? t("Checking sites…") : failures ? t("{n} of {total} sites blocked", { n: failures, total: sites.length || total }) : t("All sites reachable");
  siteCheckBadgeNode.setAttribute("aria-label", t("Review site check: {summary}", { summary: checkLabel }));
  siteCheckSummaryNode.setAttribute("aria-label", t("Review site check: {summary}", { summary: checkLabel }));
  siteCheckBadgeNode.innerHTML = pending
    ? '<span class="site-check-spinner" aria-hidden="true"></span>'
    : failures
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4M12 17.2v.1"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  siteCheckBadgeNode.classList.toggle("is-failed", failures > 0 && !pending);
  siteCheckBadgeNode.classList.toggle("is-pending", pending);
  siteCheckBadgeNode.classList.toggle("is-passed", !pending && !failures && result.connectivityCheck === "passed");
  siteCheckSummaryNode.classList.toggle("is-failed", failures > 0 && !pending);
  siteCheckSummaryNode.classList.toggle("is-pending", pending);
  siteCheckSummaryNode.classList.toggle("is-passed", !pending && !failures && result.connectivityCheck === "passed");
  if (pending) {
    siteCheckSummaryNode.innerHTML = `${t("Checking sites…").replace(/…$/, "")}<span class="checking-dots" aria-hidden="true"></span>`;
  } else if (failures) {
    siteCheckSummaryNode.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4m0 3.2v.1"/></svg>${t("{n} of {total} sites blocked", { n: failures, total })}<svg class="site-check-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;
  } else if (result.connectivityCheck === "passed") {
    siteCheckSummaryNode.textContent = t("all sites reachable");
  } else {
    siteCheckSummaryNode.textContent = t("Checking sites…");
  }
  const blockedSummary = failures ? t("{n} of {total} sites blocked", { n: failures, total }) : t("All sites reachable");
  siteCheckCountNode.textContent = pending ? t("Checking sites…") : failures ? blockedSummary : t("All sites reachable");
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

let lastStatusText = "";
let lastStatusDetail = "";
function setStatus(text, kind = "", detail = "") {
  if (lastStatusText !== text || statusNode.dataset.kind !== kind) {
    lastStatusText = text;
    lastStatusDetail = detail;
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
  } else if (lastStatusDetail !== detail) {
    lastStatusDetail = detail;
    statusDetailNode.textContent = detail;
    statusDetailNode.hidden = !detail;
    metaSeparatorNode.hidden = siteCheckSummaryNode.hidden
      ? !detail || (bridgeAttemptTimerNode.hidden && connectedDurationNode.hidden)
      : connectedDurationNode.hidden;
  }
}

function send(type, extra = {}, timeout = 5000) {
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
    setTimeout(() => done(undefined), timeout);
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
    const bridgeLabel = position >= 0 ? t("Bridge {n}", { n: position + 1 }) : t("Bridge");
    bridgeCountryFlagNode.title = t("Approximate country of {bridge}: {country}", { bridge: bridgeLabel, country: countryName });
    bridgeCountryFlagNode.setAttribute("aria-label", t("Approximate country of {bridge}: {country}", { bridge: bridgeLabel, country: countryName }));
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

// renderBridgeSelector: rebuilds the bridges-sheet toggle rows and the bottom card action.
function renderBridgeSelector() {
  const allEntries = allBridgeEntries();
  const disabled = new Set(preferences.disabledBridges);
  if (!bridgeRowsNode) return;
  const focusedBridgeLine = bridgeRowsNode.contains(document.activeElement)
    ? document.activeElement.closest(".bridge-row")?.dataset.bridgeLine
    : undefined;

  bridgeRowsNode.replaceChildren(...allEntries.map((line, i) => {
    const on = !disabled.has(line);
    const parts = line.trim().split(/\s+/);
    const addr = (parts[0] === "Bridge" ? parts[2] : parts[1]) || "";
    const bridgeNum = i + 1;
    const countryCode = (bridgeCountries.get(line) || "").toUpperCase();
    const isActive = currentResult?.state === "connected"
      && activeBridgePosition(currentResult, bridgeEntries()) === bridgeEntries().indexOf(line)
      && bridgeEntries().includes(line);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "switch";
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-checked", String(on));
    btn.className = "bridge-row";
    btn.dataset.bridgeLine = line;
    const countryName = /^[A-Z]{2}$/.test(countryCode)
      ? new Intl.DisplayNames([globalThis.torI18n?.language || navigator.language || "en"], { type: "region" }).of(countryCode) || countryCode
      : "";
    btn.setAttribute("aria-label", t("Bridge {n}", { n: bridgeNum }) + (countryName ? ", " + countryName : "") + " — " + (on ? t("on") : t("off")));

    const badge = document.createElement("span");
    badge.className = "bridge-row-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = /^[A-Z]{2}$/.test(countryCode) ? countryCode : String(bridgeNum);

    const info = document.createElement("span");
    info.className = "bridge-row-info";

    const nameRow = document.createElement("span");
    nameRow.className = "bridge-row-name";
    nameRow.textContent = t("Bridge {n}", { n: bridgeNum });
    if (isActive) {
      const inUse = document.createElement("span");
      inUse.className = "bridge-in-use-badge";
      inUse.setAttribute("aria-label", t("in use"));
      inUse.textContent = t("IN USE");
      nameRow.append(inUse);
    }

    const addrRow = document.createElement("span");
    addrRow.className = "bridge-row-addr";
    addrRow.textContent = addr;

    info.append(nameRow, addrRow);

    const sw = document.createElement("span");
    sw.className = "bridge-row-switch";
    sw.setAttribute("aria-hidden", "true");
    const knob = document.createElement("span");
    knob.className = "bridge-row-knob";
    sw.append(knob);

    btn.append(badge, info, sw);

    btn.addEventListener("click", () => {
      const d = new Set(preferences.disabledBridges);
      if (d.has(line)) d.delete(line); else d.add(line);
      preferences.disabledBridges = [...d];
      chrome.storage.local.set({ torConnectionPreferences: preferences });
      renderBridgeSelector();
      renderRoute(currentResult);
    });
    return btn;
  }));
  if (focusedBridgeLine !== undefined) {
    const replacement = [...bridgeRowsNode.querySelectorAll(".bridge-row")]
      .find((button) => button.dataset.bridgeLine === focusedBridgeLine);
    replacement?.focus();
  }

  // Show/hide the chevron action button on the bottom card
  if (bridgesSheetToggleNode) {
    bridgesSheetToggleNode.hidden = preferences.mode !== "manual" || allEntries.length === 0;
  }
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
  // Update pager underline position via CSS [data-mode] on the switch — already handled by CSS.
  // The indicator `left` is driven by CSS [data-mode] on .connection-method-switch.
}

async function selectConnectionMethod(mode) {
  if (!["snowflake", "manual"].includes(mode) || mode === preferences.mode) return;
  if (currentState === "connected" || currentState === "starting") {
    methodButtons.forEach((button) => { button.disabled = true; });
    const stopped = await send("disconnect");
    if (!stopped?.ok) {
      methodButtons.forEach((button) => { button.disabled = false; });
      renderResult(stopped || { ok: false, state: "failed", error: t("Could not stop the current Tor connection.") });
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
  if (!result) return t("Tor status unavailable");
  if (!result.ok) return summarizeConnectionError(result.error || result.message);
  if (result.state === "connected") {
    if (result.bridgeActivity === "trying") return t("Reconnecting…");
    if (result.bridgeActivity === "failed" || result.bridgeActivity === "closed") return t("Connection interrupted");
    return t("Connected");
  }
  if (result.state === "starting") {
    return t("Connecting…");
  }
  if (result.state === "disconnected") return t("Not connected");
  if (result.state === "missing_runtime") {
    return t("Tor setup is incomplete");
  }
  if (result.state === "failed") return summarizeConnectionError(result.error || result.message);
  return t("Tor status needs attention");
}

function summarizeConnectionError(error) {
  const message = typeof error === "string" ? error : "";
  if (/proxy\.settings requires private browsing permission|private browsing permission/i.test(message)) {
    return t("Firefox permission needed");
  }
  if (/address already in use|could not bind to|failed to bind|bind.*already in use/i.test(message)) {
    return t("A local Tor port is already in use");
  }
  if (/permission denied|operation not permitted|access is denied/i.test(message)) {
    return t("Tor can’t access a required file");
  }
  if (/failed to parse\/validate config|invalid config|invalid bridge|enter one or more valid|choose one valid bridge|choose snowflake or manual/i.test(message)) {
    return t("Check your bridge settings");
  }
  if (/signal\s+\d+|killed|terminated unexpectedly/i.test(message)) {
    return t("Tor stopped before connecting");
  }
  if (/timed out|timeout|no route to host|connection refused/i.test(message)) {
    return t("Couldn’t connect through this bridge");
  }
  if (/no such file|does not exist|doesn’t exist|not found/i.test(message)) {
    return t("Tor files are missing");
  }
  if (/native helper (?:unavailable|disconnected)|native messaging host not found|native host.*not registered/i.test(message)) {
    return t("Tor helper isn’t available");
  }
  return t("Tor couldn’t connect. Try again.");
}

function connectionErrorHint(error) {
  const message = typeof error === "string" ? error : "";
  if (/proxy\.settings requires private browsing permission|private browsing permission/i.test(message)) {
    return t("Firefox requires this permission even in normal windows. Open menu ☰ → Extensions and Themes. On Tor Connect, click ⋯ → Manage. Under “Run in Private Windows,” select “Allow,” then return here and try again.");
  }
  if (/address already in use|could not bind to|failed to bind|bind.*already in use/i.test(message)) {
    return t("Another app or Chrome profile may already have a Tor connection open.");
  }
  if (/permission denied|operation not permitted|access is denied/i.test(message)) {
    return t("Check that Tor Connect can access its installed files.");
  }
  if (/failed to parse\/validate config|invalid config|invalid bridge|enter one or more valid|choose one valid bridge|choose snowflake or manual/i.test(message)) {
    return t("Review the bridge lines in Settings.");
  }
  if (/signal\s+\d+|killed|terminated unexpectedly/i.test(message)) {
    return t("Tor closed before it could connect. You can try again.");
  }
  if (/timed out|timeout|no route to host|connection refused/i.test(message)) {
    return t("Try another saved bridge or connection method.");
  }
  if (/no such file|does not exist|doesn’t exist|not found/i.test(message)) {
    return t("Run setup again to install the Tor files.");
  }
  if (/native helper (?:unavailable|disconnected)|native messaging host not found|native host.*not registered/i.test(message)) {
    return t("Set up Tor Connect on this device, then restart your browser.");
  }
  return t("Try again. Open the details if it keeps happening.");
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

// SVG source strings for idle-card icon
const ICON_LOOP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/></svg>';
const ICON_SNOWFLAKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.8 12 7l2.5-2.2M9.5 19.2 12 17l2.5 2.2"/></svg>';
const ICON_SPINNER = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="28 60"/></svg>';

function renderRoute(result = {}, visualState = connectionRevealPending && result?.state === "connected" ? "starting" : result.state) {
  renderGlobe(result);
  if (initialStatusPending && routeCardNode.dataset.initialChecking === "true") {
    return;
  }
  delete routeCardNode.dataset.initialChecking;
  bridgeAttemptTimerNode.hidden = true;
  connectedDurationNode.hidden = visualState !== "connected";
  copyBridgeButton.hidden = true;
  routeBridgeLine = "";
  const prevDetail = routeDetailNode.textContent;
  routeCardNode.dataset.state = visualState || "disconnected";
  if (visualState === "connected" || result.state !== "connected") {
    delete routeCardNode.dataset.globeRotating;
    setGlobeRotationBrightness(false);
  } else if (globeRotationPlayed) {
    routeCardNode.dataset.globeRotating = "true";
    setGlobeRotationBrightness(true);
  }
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
  const activePosition = (visualState === "connected" || visualState === "starting")
    ? activeBridgePosition(result, entries) : -1;
  const selectedPosition = entries.length ? selectedBridgePosition(entries) : -1;

  let shownPosition = -1;
  if (entries.length) {
    if (activePosition >= 0) shownPosition = activePosition;
    else if (!preferences.autoBridgeSelection) shownPosition = selectedPosition;
    else if (visualState === "starting" && lastShownPosition >= 0) shownPosition = lastShownPosition;
  }
  if (shownPosition >= 0) lastShownPosition = shownPosition;
  if (visualState !== "starting" && visualState !== "connected") lastShownPosition = -1;
  renderBridgeCountry(result, shownPosition);
  if (visualState === "starting") routeCardNode.dataset.route = "trying-bridge";

  // --- Idle card (bottom card) ---
  const isStarting = visualState === "starting";
  const isConnected = visualState === "connected";
  const snowflake = preferences.mode === "snowflake";
  const enabledCount = entries.length;
  idleCardNode.hidden = hasNoBridgeLines;

  // Choose icon SVG and determine title/sub
  let iconSvg, idleTitle, idleSub;
  const entryResponded = isStarting && result.bridgeActivity === "connected";
  if (isStarting) {
    iconSvg = ICON_SPINNER;
    idleTitle = snowflake ? t("Finding a proxy…") : t("Finding a bridge…");
    if (entryResponded && shownPosition >= 0) {
      idleSub = t("Responded");
    } else {
      const attempt = Math.min(Math.max(shownPosition >= 0
        ? shownPosition + 1
        : Number(result.currentBridgeIndex) || 1, 1), Math.max(enabledCount, 1));
      idleSub = snowflake ? t("Volunteer proxies") : (enabledCount > 0
        ? t("Trying {k} of {m}", { k: attempt, m: enabledCount })
        : t("Looking for a bridge\u2026"));
    }
  } else if (isConnected) {
    iconSvg = ICON_SPINNER;
    if (shownPosition >= 0) {
      const line = entries[shownPosition];
      idleTitle = snowflake ? t("Snowflake") : t("Bridge {n}", { n: bridgeNumberForLine(line) });
      idleSub = t("Responded");
    } else {
      idleTitle = snowflake ? t("Finding a proxy\u2026") : t("Finding a bridge\u2026");
      idleSub = snowflake ? t("Volunteer proxies") : t("Looking for a bridge\u2026");
    }
  } else if (snowflake) {
    iconSvg = ICON_SNOWFLAKE;
    idleTitle = t("No bridge needed");
    idleSub = t("Volunteer proxies");
  } else if (hasNoBridgeLines) {
    iconSvg = ICON_LOOP;
    idleTitle = t("Choose a bridge");
    idleSub = t("Turn one on, or add");
  } else if (enabledCount === 1) {
    iconSvg = ICON_LOOP;
    idleTitle = t("One bridge on");
    idleSub = t("Turn on more to rotate");
  } else {
    iconSvg = ICON_LOOP;
    idleTitle = t("Switches automatically");
    idleSub = t("Tries your {n} bridges", { n: enabledCount });
  }

  const iconKey = iconSvg === ICON_SPINNER ? "spinner" : iconSvg === ICON_SNOWFLAKE ? "snowflake" : "loop";
  if (idleCardIconNode.dataset.iconKey !== iconKey) {
    idleCardIconNode.innerHTML = iconSvg;
    idleCardIconNode.dataset.iconKey = iconKey;
  }
  if (idleCardTitleNode.textContent !== idleTitle) {
    fadeText(idleCardTitleNode, () => { idleCardTitleNode.textContent = idleTitle; });
  }
  if (idleCardSubNode.textContent !== idleSub) {
    fadeText(idleCardSubNode, () => { idleCardSubNode.textContent = idleSub; });
  }

  // Legacy route-identity: still used for copyBridge button logic
  const shownLine = shownPosition >= 0 ? entries[shownPosition] : null;
  if (shownLine) {
    const parts = shownLine.split(/\s+/);
    const endpoint = parts[0] === "Bridge" ? (parts[2] || "") : (parts[1] || "");
    const nextName = t("Bridge {n}", { n: bridgeNumberForLine(shownLine) });
    if (routeNameNode.textContent !== nextName) {
      fadeText(routeNameNode, () => { routeNameNode.textContent = nextName; });
    }
    if (endpoint) {
      const nextDetail = endpoint;
      if (prevDetail !== nextDetail) {
        fadeText(routeDetailNode, () => { routeDetailNode.textContent = nextDetail; });
      }
      routeDetailNode.hidden = false;
      routeBridgeLine = shownLine;
      copyBridgeButton.hidden = false;
    }
  }

  copyBridgeButton.hidden = !routeBridgeLine;
}

// Polls for status while the outdated panel is visible in the tab view.
// If send() times out (resolves undefined), reschedules without calling
// renderResult so the outdated panel stays visible and polling continues.
// A generation counter ensures stale callbacks from a superseded cycle
// (e.g. triggered by a language change while a request was in-flight) do
// not clobber the timer started by the newer cycle.
function pollOutdatedStatus() {
  const generation = ++outdatedPollGeneration;
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    const result = await send("status");
    if (generation !== outdatedPollGeneration || popupMainNode.dataset.view !== "helper-outdated") return;
    if (result) renderResult(result);
    else pollOutdatedStatus();
  }, 3000);
}

function renderResult(result) {
  connectionToggle.classList.remove("is-pressing");
  currentResult = result || {};
  const stableConnected = currentResult.state === "connected"
    && !["trying", "failed", "closed"].includes(currentResult.bridgeActivity);
  if (!stableConnected) {
    connectionRevealPending = false;
    connectionRevealReleased = false;
    clearTimeout(connectionRevealTimer);
    connectionRevealTimer = undefined;
    clearTimeout(connectionRevealFallbackTimer);
    connectionRevealFallbackTimer = undefined;
  } else {
    const exitCode = (currentResult.exitRelayCountryCode || "").toUpperCase();
    const hasExitPoint = Boolean(EXIT_COUNTRY_CENTERS[exitCode]);
    const reduceRouteMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (hasExitPoint) {
      clearTimeout(connectionRevealFallbackTimer);
      connectionRevealFallbackTimer = undefined;
      if (!connectionRevealReleased) {
        connectionRevealPending = false;
        connectionRevealReleased = true;
      }
    } else if (!connectionRevealReleased) {
      connectionRevealPending = true;
    }
    if (!hasExitPoint && connectionRevealPending && !connectionRevealReleased && !connectionRevealFallbackTimer) {
      connectionRevealFallbackTimer = setTimeout(() => {
        connectionRevealFallbackTimer = undefined;
        const stillConnected = currentResult?.state === "connected"
          && !["trying", "failed", "closed"].includes(currentResult.bridgeActivity);
        const latestExitCode = (currentResult?.exitRelayCountryCode || "").toUpperCase();
        if (!stillConnected || EXIT_COUNTRY_CENTERS[latestExitCode]) return;
        releaseConnectionReveal();
      }, CONNECTION_REVEAL_FALLBACK_MS);
    }
  }
  const visualResult = connectionRevealPending
    ? { ...currentResult, state: "starting" }
    : currentResult;
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
    setStatus(t("Checking connection…"), "starting", t("Waiting for the Tor helper"));
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
  syncConnectedDuration(visualResult);
  updateLiveStats(visualResult);
  if (result?.helperOutdated) {
    popupMainNode.dataset.view = "helper-outdated";
    outdatedPanelNode.hidden = false;
    setupPanelNode.hidden = true;
    routeCardNode.hidden = true;
    openSettingsButton.hidden = true;
    openFullScreenButton.hidden = true;
    errorDetailsNode.hidden = true;
    if (mainHeadingNode) mainHeadingNode.hidden = true;
    setToggleState("disconnected");
    // In the tab view the page stays open while the user runs setup in another
    // tab, so keep polling so it exits the outdated panel automatically once the
    // helper is updated. In the popup view the panel closes on its own when the
    // popup is reopened.
    if (isTabView) {
      pollOutdatedStatus();
    } else {
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
    }
    return;
  }
  outdatedPanelNode.hidden = true;
  if (mainHeadingNode) mainHeadingNode.hidden = false;
  openFullScreenButton.hidden = false;
  if (helperNotInstalled || result?.state === "missing_runtime") {
    popupMainNode.dataset.view = "cold-start";
    setupPanelNode.hidden = false;
    routeCardNode.hidden = true;
    openSettingsButton.hidden = true;
    errorDetailsNode.hidden = true;
    setupDescriptionNode.textContent = result?.state === "missing_runtime"
      ? t("Install Tor and its helper once to connect through Chrome.")
      : t("Install the Tor helper once to connect through Chrome.");
    setToggleState("disconnected");
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
    return;
  }
  popupMainNode.dataset.view = "connection";
  setupPanelNode.hidden = true;
  routeCardNode.hidden = false;
  openSettingsButton.hidden = false;
  renderGlobe(currentResult);
  renderRoute(currentResult, visualResult.state);
  renderProgress(currentResult, visualResult.state);
  const statusKind = visualResult.state === "connected" && currentResult.bridgeActivity === "trying" ? "starting"
    : visualResult.state === "connected" && ["failed", "closed"].includes(currentResult.bridgeActivity) ? "error"
      : visualResult.state === "connected" && currentResult.connectivityCheck === "failed" ? "connected-check-failed"
      : visualResult.state === "connected" ? "connected"
    : visualResult.state === "starting" ? "starting"
      : visualResult.state === "failed" || !visualResult.ok ? "error" : "";
  const failureMessage = visualResult.error || visualResult.message;
  const detail = visualResult.state === "failed" || !visualResult.ok
    ? connectionErrorHint(failureMessage)
    : visualResult.state === "connected" && ["failed", "closed"].includes(currentResult.bridgeActivity)
    ? preferences.mode === "snowflake" ? t("Tor may retry the Snowflake route") : t("Tor may retry the bridge")
    : visualResult.state === "connected" && currentResult.bridgeActivity === "trying"
      ? preferences.mode === "snowflake" ? t("Trying another volunteer proxy") : t("Trying another bridge")
      : visualResult.state === "connected" && ["pending", "passed", "failed"].includes(currentResult.connectivityCheck) ? ""
      : visualResult.state === "connected" ? t("Tap the center to disconnect")
    : visualResult.state === "starting"
      ? Number(currentResult.currentBridgeIndex) > 0 ? t("Crossing through Bridge {n}", { n: Number(currentResult.currentBridgeIndex) })
        : preferences.mode === "manual" ? t("Trying saved bridges") : t("Finding a volunteer proxy · tap to cancel")
      : visualResult.state === "disconnected"
        ? preferences.mode === "manual" && !bridgeEntries().length
          ? t("Add bridge lines in Settings to connect this way")
          : preferences.mode === "manual" && !preferences.autoBridgeSelection
          ? t("Pick a bridge, then tap the center")
          : preferences.mode === "manual" ? t("Tap the center to try saved bridges") : t("Tap the center to connect")
        : "";
  setStatus(preferences.mode === "manual" && !bridgeEntries().length && visualResult.state === "disconnected"
    ? t("No bridges yet") : explain(visualResult), statusKind, detail);
  setToggleState(currentResult.state || "disconnected", currentResult.bridgeActivity, visualResult.state);
  if (currentResult.state === "starting" || currentResult.state === "connected") pollForProgress();
  else if (pollTimer) { clearTimeout(pollTimer); pollTimer = undefined; }
}

function setToggleState(state, bridgeActivity, requestedVisualState = state) {
  currentState = state;
  delete connectionToggle.dataset.initialChecking;
  renderBridgeSelector();
  connectionToggle.disabled = false;
  const connectionState = state === "connected" && bridgeActivity === "trying" ? "reconnecting"
    : state === "connected" && ["failed", "closed"].includes(bridgeActivity) ? "bridge-interrupted"
      : state;
  const visualState = connectionState === "connected" && requestedVisualState === "starting"
    ? "starting" : connectionState;
  connectionToggle.dataset.state = visualState;
  connectionToggle.dataset.mode = preferences.mode;
  connectionToggle.dataset.empty = String(preferences.mode === "manual" && !bridgeEntries().length);
  connectionProgress.hidden = visualState !== "starting";
  const label = state === "connected" ? t("Disconnect") : state === "starting" ? t("Cancel connection") : t("Connect");
  const accessibleLabel = state === "connected" && bridgeActivity === "trying"
    ? t("Disconnect from Tor; the bridge is reconnecting")
    : state === "connected" && ["failed", "closed"].includes(bridgeActivity)
      ? t("Disconnect from Tor; the bridge connection is interrupted")
      : label === t("Connect") && preferences.mode === "manual" && !bridgeEntries().length ? t("Add bridge lines in Settings")
        : label === t("Connect") ? t("Connect to Tor") : label === t("Disconnect") ? t("Disconnect from Tor") : t("Cancel Tor connection");
  connectionToggle.setAttribute("aria-label", accessibleLabel);
  connectionToggle.title = accessibleLabel;
}

function renderProgress(result, visualState = result?.state) {
  if (visualState !== "starting") {
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
  }, currentResult.state === "connected"
    ? (currentResult.exitRelayCountryCode ? 2000 : 500)
    : 1200);
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
    setStatus(t("Disconnecting…"), "starting");
    renderResult(await send("disconnect"));
    return;
  }
  setStatus(t("Connecting…"), "starting");
  beginBridgeAttemptTimer();
  renderResult(await connectWithSavedPreferences());
});

copyBridgeButton.addEventListener("click", async () => {
  if (!routeBridgeLine) return;
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  copyBridgeButton.classList.remove("is-copied");
  copyBridgeButton.setAttribute("aria-label", t("Copy full bridge line"));
  copyBridgeButton.title = t("Copy full bridge line");
  copyBridgeButton.disabled = true;
  try {
    const allowed = await new Promise((resolve) => chrome.permissions.request({ permissions: ["clipboardWrite"] }, resolve));
    if (!allowed) {
      copyBridgeButton.title = t("Allow clipboard access to copy the bridge line");
      return;
    }
    await navigator.clipboard.writeText(routeBridgeLine);
    copyBridgeButton.classList.add("is-copied");
    copyBridgeButton.setAttribute("aria-label", t("Bridge line copied"));
    copyBridgeButton.title = t("Bridge line copied");
    copyFeedbackTimer = window.setTimeout(() => {
      copyBridgeButton.classList.remove("is-copied");
      copyBridgeButton.setAttribute("aria-label", t("Copy full bridge line"));
      copyBridgeButton.title = t("Copy full bridge line");
      copyFeedbackTimer = undefined;
    }, 1400);
  } catch {
    copyBridgeButton.title = t("Could not copy bridge line");
    window.setTimeout(() => { copyBridgeButton.title = t("Copy full bridge line"); }, 1800);
  } finally {
    copyBridgeButton.disabled = false;
  }
});

document.addEventListener("tor-language-changed", () => {
  // Skip re-render on the initial language load — the MutationObserver in i18n.js
  // already translates every text node in place. Only re-render when the user
  // actively switches language after the first status result has been received.
  if (currentResult && Object.keys(currentResult).length > 0) renderResult(currentResult);
});

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

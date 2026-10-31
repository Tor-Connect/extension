const releaseDownloadBase = "https://github.com/Tor-Connect/extension/releases/latest/download";
const SETUP_MIN_HELPER_VERSION = "0.17.0";
function setupVersionOk(v) {
  if (!v) return false; // pre-versioning helper → needs updating
  const parse = (s) => s.split(".").map(Number);
  const [ma, mi, pa] = parse(v);
  const [mb, mib, pb] = parse(SETUP_MIN_HELPER_VERSION);
  if (ma !== mb) return ma > mb;
  if (mi !== mib) return mi > mib;
  return pa >= pb;
}
const macInstallerDownloadUrl = `${releaseDownloadBase}/Tor-Connect-Setup-macOS.zip`;
const windowsInstallerDownloadUrl = `${releaseDownloadBase}/Tor-Connect-Setup-Windows-x64.exe`;
const linuxInstallerDownloadUrl = `${releaseDownloadBase}/Tor-Connect-Setup-Linux-x64.deb`;
const platform = String(navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();
const platformName = platform.includes("win") ? "windows"
  : platform.includes("linux") ? "linux"
    : platform.includes("mac") ? "mac" : "unknown";
const isFirefox = typeof browser !== "undefined" && typeof browser.runtime?.getBrowserInfo === "function";
document.querySelectorAll("[data-platform]").forEach((section) => {
  section.hidden = section.dataset.platform !== platformName;
});
document.querySelector("#setupEyebrow").textContent = platformName === "mac"
  ? "ONE-TIME MAC SETUP"
  : `ONE-TIME ${platformName.toUpperCase()} SETUP`;
document.querySelector("h1").textContent = "Connect your browser through Tor";
document.querySelector("#setupIntro").textContent = "A small companion app installs Tor on this computer and connects it to your browser. You only need to set it up once.";
document.querySelector("#osDetected").textContent = platformName === "unknown"
  ? "Choose your device"
  : `${platformName === "mac" ? "macOS" : platformName[0].toUpperCase() + platformName.slice(1)} detected`;
document.querySelector("#blockedHelpChip").textContent = platformName === "mac" ? "macOS blocked the setup app"
  : platformName === "windows" ? "Windows blocked the setup app"
    : platformName === "linux" ? "The Linux installer won’t open" : "The setup app won’t open";
document.querySelector("#blockedInlineHelp span").textContent = platformName === "mac" ? "macOS blocked the setup app"
  : platformName === "windows" ? "Windows blocked the setup app"
    : platformName === "linux" ? "The Linux installer won’t open" : "The setup app won’t open";
document.querySelector("#permissionHelpChip").textContent = platformName === "windows" ? "PowerShell says scripts are disabled"
  : platformName === "mac" ? "macOS says “Permission denied”"
    : platformName === "linux" ? "Terminal says “Permission denied”" : "Permission denied";
document.querySelector("#whyHelpChip").textContent = "Why a separate setup app?";
const setupInstructions = document.querySelector("#setupInstructions");
if (platformName === "linux") {
  setupInstructions.textContent = "It includes Tor and sets up the helper for your browser.";
} else if (platformName === "windows") {
  setupInstructions.textContent = "It includes Tor and sets up the helper for your browser.";
} else if (platformName === "mac") {
  setupInstructions.textContent = "It includes Tor and sets up the helper for your browser.";
}

const installerByPlatform = {
  mac: ["#macInstallerDownload", macInstallerDownloadUrl, "Tor-Connect-Setup-macOS.zip"],
  windows: ["#windowsInstallerDownload", windowsInstallerDownloadUrl, "Tor-Connect-Setup-Windows-x64.exe"],
  linux: ["#linuxInstallerDownload", linuxInstallerDownloadUrl, "Tor-Connect-Setup-Linux-x64.deb"]
};
const installer = installerByPlatform[platformName];
if (installer) {
  const [selector, url, filename] = installer;
  const link = document.querySelector(selector);
  if (url) {
    link.href = url;
    link.download = filename;
    link.hidden = false;
    document.querySelector("#installerUnavailable").hidden = true;
  }
}
if (platformName === "unknown") {
  document.querySelector("#setupEyebrow").textContent = "ONE-TIME SETUP";
  setupInstructions.textContent = "Open this page in your browser on the computer you want to set up.";
}

const extensionId = globalThis.chrome?.runtime?.id || "<Chrome extension ID>";
const installSelector = isFirefox ? "--firefox" : extensionId;
if (isFirefox) {
  document.querySelector("#macManualCommand").textContent =
    `installer_script="$TMPDIR/tor-connect-install-macos.sh"
curl -fsSL https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-macos.sh -o "$installer_script" || exit 1
runtime="$HOME/Library/Application Support/TorChrome/runtime"
tor_relative="$(cat "$runtime/tor-path" 2>/dev/null || true)"
transport_relative="$(cat "$runtime/transport-path" 2>/dev/null || true)"
if [[ -n "$tor_relative" && -n "$transport_relative" && -x "$runtime/bundle/$tor_relative" && -x "$runtime/bundle/$transport_relative" ]]; then
  bash "$installer_script" --firefox
else
  bundle_file="$(osascript -e 'POSIX path of (choose file with prompt "Choose the Tor Expert Bundle .tar.gz file")' 2>/dev/null)" || { echo 'No file selected. Download the Tor Expert Bundle, then run setup again.' >&2; exit 1; }
  bash "$installer_script" --firefox "$bundle_file"
fi`;
  document.querySelector("#linuxManualCommand").textContent =
    `installer_script=/tmp/tor-connect-install-linux.sh
curl -fsSL https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-linux.sh -o "$installer_script" || exit 1
runtime="\${XDG_DATA_HOME:-$HOME/.local/share}/TorChrome/runtime"
tor_relative="$(cat "$runtime/tor-path" 2>/dev/null || true)"
transport_relative="$(cat "$runtime/transport-path" 2>/dev/null || true)"
if [[ -n "$tor_relative" && -n "$transport_relative" && -x "$runtime/bundle/$tor_relative" && -x "$runtime/bundle/$transport_relative" ]]; then
  bash "$installer_script" --firefox
else
  if command -v zenity >/dev/null 2>&1; then
    bundle_dir="$(zenity --file-selection --directory --title='Select the extracted Tor Expert Bundle folder')" || exit 1
  elif command -v kdialog >/dev/null 2>&1; then
    bundle_dir="$(kdialog --getexistingdirectory "$HOME" 'Select the extracted Tor Expert Bundle folder')" || exit 1
  else
    echo 'Install Zenity or KDialog to use the folder picker, then run this command again.' >&2
    exit 1
  fi
  [[ -n "$bundle_dir" ]] || { echo 'No folder selected.' >&2; exit 1; }
  bash "$installer_script" --firefox "$bundle_dir"
fi`;
  document.querySelector("#windowsManualCommand").textContent =
    `$ErrorActionPreference = 'Stop'
$script = Join-Path $env:TEMP 'tor-connect-install-windows.ps1'
Invoke-WebRequest \`
  -Uri 'https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-windows.ps1' \`
  -OutFile $script
$runtime = Join-Path $env:LOCALAPPDATA 'TorChrome\\runtime'
$torPathFile = Join-Path $runtime 'tor-path'
$transportPathFile = Join-Path $runtime 'transport-path'
$torRelative = if (Test-Path -LiteralPath $torPathFile) {
  (Get-Content -LiteralPath $torPathFile -Raw).Trim()
} else { '' }
$transportRelative = if (Test-Path -LiteralPath $transportPathFile) {
  (Get-Content -LiteralPath $transportPathFile -Raw).Trim()
} else { '' }
$bundleRoot = Join-Path $runtime 'bundle'
$torOk = $torRelative -and (Test-Path -LiteralPath (Join-Path $bundleRoot $torRelative))
$transportOk = $transportRelative -and (Test-Path -LiteralPath (Join-Path $bundleRoot $transportRelative))
if ($torOk -and $transportOk) {
  & powershell.exe -ExecutionPolicy Bypass -File $script -Firefox
} else {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Choose the extracted Tor Expert Bundle folder.'
  $dialog.ShowNewFolderButton = $false
  $downloads = Join-Path $HOME 'Downloads'
  if (Test-Path -LiteralPath $downloads) { $dialog.SelectedPath = $downloads }
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    $dialog.Dispose()
    throw 'Setup canceled.'
  }
  $bundleDirectory = $dialog.SelectedPath
  $dialog.Dispose()
  & powershell.exe -ExecutionPolicy Bypass -File $script -Firefox -BundleDirectory "$bundleDirectory"
}`;
} else {
document.querySelector("#macManualCommand").textContent =
  `bundle_file="$(osascript -e 'POSIX path of (choose file with prompt "Choose the Tor Expert Bundle .tar.gz file")' 2>/dev/null)" || { echo 'No file selected.' >&2; exit 1; }
curl -fsSL https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-macos.sh -o "$TMPDIR/tor-connect-install-macos.sh" && bash "$TMPDIR/tor-connect-install-macos.sh" ${installSelector} "$bundle_file"`;
document.querySelector("#linuxManualCommand").textContent =
  `if command -v zenity >/dev/null 2>&1; then
  bundle_dir="$(zenity --file-selection --directory --title='Select the extracted Tor Expert Bundle folder')" || exit 1
elif command -v kdialog >/dev/null 2>&1; then
  bundle_dir="$(kdialog --getexistingdirectory "$HOME" 'Select the extracted Tor Expert Bundle folder')" || exit 1
else
  echo 'Install Zenity or KDialog to use the folder picker, then run this command again.' >&2
  exit 1
fi
if [ -z "$bundle_dir" ]; then echo 'No folder selected.' >&2; exit 1; fi
curl -fsSL https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-linux.sh -o /tmp/tor-connect-install-linux.sh && bash /tmp/tor-connect-install-linux.sh ${installSelector} "$bundle_dir"`;
document.querySelector("#windowsManualCommand").textContent =
  `$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Choose the folder where you extracted the Tor Expert Bundle.'
$dialog.ShowNewFolderButton = $false
$downloads = Join-Path $HOME 'Downloads'
if (Test-Path -LiteralPath $downloads) { $dialog.SelectedPath = $downloads }
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  $dialog.Dispose()
  throw 'Setup canceled. Run the command again when ready.'
}
$bundleDirectory = $dialog.SelectedPath
$dialog.Dispose()
$tor = Get-ChildItem -LiteralPath $bundleDirectory -Filter 'tor.exe' -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
$transport = Get-ChildItem -LiteralPath $bundleDirectory -Filter 'lyrebird.exe' -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $tor -or -not $transport) { throw 'Could not find Tor in that folder. Choose the extracted Tor Expert Bundle folder.' }
$script = Join-Path $env:TEMP 'tor-connect-install-windows.ps1'
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-windows.ps1' -OutFile $script
& powershell.exe -ExecutionPolicy Bypass -File $script -ExtensionId '${extensionId}' -BundleDirectory "$bundleDirectory"
`;
}

const commandCopyOptions = [
  ["#copyMacManualCommand", "#macManualCommand", "#macCommandStatus", "Copied. Paste it into Terminal."],
  ["#copyWindowsManualCommand", "#windowsManualCommand", "#windowsCommandStatus", "Copied. Paste it into PowerShell."],
  ["#copyLinuxManualCommand", "#linuxManualCommand", "#linuxCommandStatus", "Copied. Paste it into Terminal."]
];
commandCopyOptions.forEach(([buttonSelector, commandSelector, statusSelector, successMessage]) => {
  const button = document.querySelector(buttonSelector);
  const buttonLabel = button.querySelector("span");
  const status = document.querySelector(statusSelector);
  let copiedTimer;
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "";
    status.removeAttribute("data-kind");
    try {
      const allowed = await new Promise((resolve) => chrome.permissions.request({ permissions: ["clipboardWrite"] }, resolve));
      if (!allowed) {
        status.textContent = "Allow clipboard access to copy the command.";
        status.dataset.kind = "error";
        return;
      }
      await navigator.clipboard.writeText(document.querySelector(commandSelector).textContent);
      status.textContent = successMessage;
      status.dataset.kind = "success";
      // Change button label to "Copied" for 1400ms, matching the design
      buttonLabel.textContent = "Copied";
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => { buttonLabel.textContent = "Copy"; }, 1400);
      // Start auto-polling and trigger "Listening…" state on the connection card
      startTerminalPoll();
    } catch {
      status.textContent = "Could not copy the command. Select the command text to copy it manually.";
      status.dataset.kind = "error";
    } finally {
      button.disabled = false;
    }
  });
});

document.querySelector("#manualUnknownPlatform").hidden = platformName !== "unknown";

const osOptions = [
  ["mac", document.querySelector("#macOsTab"), document.querySelector("#macOsPanel")],
  ["windows", document.querySelector("#windowsOsTab"), document.querySelector("#windowsOsPanel")],
  ["linux", document.querySelector("#linuxOsTab"), document.querySelector("#linuxOsPanel")]
];
function selectOs(os, moveFocus = false) {
  osOptions.forEach(([name, tab, panel]) => {
    const selected = name === os;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panel.hidden = !selected;
    if (selected && moveFocus) tab.focus();
  });
}
const defaultOs = osOptions.some(([name]) => name === platformName) ? platformName : "mac";
selectOs(defaultOs);
osOptions.forEach(([name, tab], index) => {
  tab.addEventListener("click", () => selectOs(name));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectOs(osOptions[(index + 1) % osOptions.length][0], true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectOs(osOptions[(index - 1 + osOptions.length) % osOptions.length][0], true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectOs(osOptions[0][0], true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectOs(osOptions[osOptions.length - 1][0], true);
    }
  });
});

const setupTabs = [
  [document.querySelector("#guidedTab"), document.querySelector("#guidedPanel")],
  [document.querySelector("#manualTab"), document.querySelector("#manualPanel")]
];
const guidedSetupPanel = document.querySelector("#guidedPanel");
const terminalSetupPanel = document.querySelector("#manualPanel");
function setStepProgress(panel, currentStep, completeThrough = currentStep - 1) {
  panel.querySelectorAll(".step-card[data-step]").forEach((card) => {
    const step = Number(card.dataset.step);
    const done = step <= completeThrough;
    card.classList.toggle("is-done", done);
    card.classList.toggle("is-current", !done && step === currentStep);
    card.classList.toggle("is-pending", !done && step > currentStep);
    card.querySelector(".step-number").textContent = done ? "✓" : String(step);
  });
}
setStepProgress(guidedSetupPanel, 1, 0);
setStepProgress(terminalSetupPanel, 1, 0);
document.querySelectorAll("#macInstallerDownload, #windowsInstallerDownload, #linuxInstallerDownload").forEach((link) => {
  link.addEventListener("click", () => setStepProgress(guidedSetupPanel, 2, 1));
});
document.querySelector("#bundleDownloadLink").addEventListener("click", () => setStepProgress(terminalSetupPanel, 2, 1));
const setupTabsContainer = document.querySelector(".setup-tabs");
setupTabs.forEach(([tab, panel], index) => {
  tab.addEventListener("click", () => {
    setupTabs.forEach(([otherTab, otherPanel]) => {
      const selected = otherTab === tab;
      otherTab.classList.toggle("active", selected);
      otherTab.setAttribute("aria-selected", String(selected));
      otherPanel.hidden = !selected;
    });
    setupTabsContainer.dataset.active = String(index);
  });
});

const setupApi = globalThis.browser || globalThis.chrome;
const appDetectButton = document.querySelector("#detectSetupApp");
const appHelperStatus = document.querySelector("#appHelperStatus");
const terminalHelperStatus = document.querySelector("#terminalHelperStatus");
const connectionCard = document.querySelector(".connection-card");
const helperNode = document.querySelector("#helperNode");
const torNode = document.querySelector("#torNode");
const helperNodeStatus = document.querySelector("#helperNodeStatus");
const connectionStatus = document.querySelector("#connectionStatusText");
let helperCheckGeneration = 0;

const connectionLinePending = document.querySelector(".connection-line-pending");
function setHelperVisualState(state) {
  connectionCard.classList.toggle("is-detecting", state === "checking");
  helperNode.classList.toggle("is-active", state === "checking");
  helperNode.classList.toggle("is-done", state === "ready");
  torNode.classList.toggle("is-done", state === "ready");
  connectionLinePending.classList.toggle("connection-line-done", state === "ready");
  connectionLinePending.classList.toggle("connection-line-pending", state !== "ready");
  const statusBar = document.querySelector(".connection-status");
  statusBar.classList.toggle("is-success", state === "ready");
  statusBar.classList.toggle("is-error", false);
  helperNodeStatus.textContent = state === "checking" ? "Listening…"
    : state === "ready" ? "Found" : "Not installed yet";
  torNode.querySelector("small").textContent = state === "ready" ? "Ready" : "Not started";
  connectionStatus.textContent = state === "ready"
    ? "Helper found. Tor is ready. You can close this tab."
    : state === "checking" ? "Listening for the helper…"
      : "Waiting for you to install the helper";
}

async function requestHelperStatus() {
  if (!setupApi?.runtime?.sendMessage) throw new Error("Setup status is unavailable.");
  return setupApi.runtime.sendMessage({ type: "status" });
}

// Auto-polling: starts when triggered, runs until helper found or generation changes.
async function pollForHelper(statusNode, activeSetupPanel) {
  const generation = ++helperCheckGeneration;
  statusNode.textContent = "Listening…";
  statusNode.dataset.kind = "";
  setHelperVisualState("checking");
  while (generation === helperCheckGeneration) {
    try {
      const result = await requestHelperStatus();
      if (generation !== helperCheckGeneration) return;
      if (result?.ok && setupVersionOk(result?.helperVersion)) {
        statusNode.textContent = "Helper found";
        statusNode.dataset.kind = "success";
        setHelperVisualState("ready");
        setStepProgress(activeSetupPanel, 4, 3);
        return;
      }
    } catch { /* keep polling */ }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Guided path: "I opened it" button starts the poll.
appDetectButton.addEventListener("click", () => {
  setStepProgress(guidedSetupPanel, 2, 1);
  appDetectButton.disabled = true;
  appDetectButton.textContent = "Checking…";
  pollForHelper(appHelperStatus, guidedSetupPanel).then(() => {
    if (appHelperStatus.dataset.kind !== "success") {
      appDetectButton.disabled = false;
      appDetectButton.textContent = "I opened it";
    }
  });
});

// Terminal path: poll starts automatically when copy is triggered (see copy handler above).
// Exposed so the copy handler can call it.
function startTerminalPoll() {
  setStepProgress(terminalSetupPanel, 3, 2);
  pollForHelper(terminalHelperStatus, terminalSetupPanel);
}

const helpPanel = document.querySelector("#setupHelpPanel");
const helpChips = [...document.querySelectorAll("[data-help-chip]")];
const helpContent = [...document.querySelectorAll("[data-help-content]")];
helpChips.forEach((chip) => {
  chip.setAttribute("aria-expanded", "false");
  chip.addEventListener("click", () => {
    const helpKey = chip.dataset.helpChip;
    const isOpen = chip.getAttribute("aria-expanded") === "true";
    helpChips.forEach((item) => item.setAttribute("aria-expanded", "false"));
    document.querySelector("#blockedInlineHelp").setAttribute("aria-expanded", "false");
    if (isOpen) {
      helpPanel.hidden = true;
      return;
    }
    const content = helpContent.find((item) => item.dataset.helpContent === helpKey &&
      (!item.dataset.platform || item.dataset.platform === platformName));
    if (!content) return;
    helpContent.forEach((item) => { item.hidden = item !== content; });
    chip.setAttribute("aria-expanded", "true");
    if (helpKey === "blocked") document.querySelector("#blockedInlineHelp").setAttribute("aria-expanded", "true");
    helpPanel.hidden = false;
  });
});
document.querySelector("#blockedInlineHelp").addEventListener("click", () => {
  const blockedChip = document.querySelector("#blockedHelpChip");
  if (blockedChip.getAttribute("aria-expanded") === "true") {
    helpPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    blockedChip.click();
    helpPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

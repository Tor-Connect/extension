const releaseDownloadBase = "https://github.com/Tor-Connect/extension/releases/latest/download";
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
document.querySelector("h1").textContent = "Connect Chrome through Tor";
document.querySelector("#setupIntro").textContent = "A small companion app installs Tor on this computer and connects it to Chrome. You only need to set it up once.";
const setupInstructions = document.querySelector("#setupInstructions");
if (isFirefox) {
  setupInstructions.textContent = platformName === "linux"
    ? "Download and install the Debian package. It includes Tor and connects it to Chrome."
    : platformName === "windows"
      ? "Download and open the Windows installer. It includes Tor and connects it to Chrome."
      : platformName === "mac"
        ? "Download and open the Mac setup app. It includes Tor and connects it to Chrome."
        : "Open this page in Chrome on the computer you want to set up.";
} else if (platformName === "linux") {
  setupInstructions.textContent = "Download and install the Debian package. It includes Tor and connects it to Chrome.";
} else if (platformName === "windows") {
  setupInstructions.textContent = "Download and open the Windows installer. It includes Tor and connects it to Chrome.";
} else if (platformName === "mac") {
  setupInstructions.textContent = "Download and open the Mac setup app. It includes Tor and connects it to Chrome.";
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
  setupInstructions.textContent = `Open this page in ${isFirefox ? "Firefox" : "Chrome"} on the computer you want to set up.`;
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
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Tor-Connect/extension/main/scripts/install-windows.ps1' -OutFile $script
$runtime = Join-Path $env:LOCALAPPDATA 'TorChrome\runtime'
$torRelative = if (Test-Path -LiteralPath (Join-Path $runtime 'tor-path')) { (Get-Content -LiteralPath (Join-Path $runtime 'tor-path') -Raw).Trim() } else { '' }
$transportRelative = if (Test-Path -LiteralPath (Join-Path $runtime 'transport-path')) { (Get-Content -LiteralPath (Join-Path $runtime 'transport-path') -Raw).Trim() } else { '' }
$bundleRoot = Join-Path $runtime 'bundle'
if ($torRelative -and $transportRelative -and (Test-Path -LiteralPath (Join-Path $bundleRoot $torRelative)) -and (Test-Path -LiteralPath (Join-Path $bundleRoot $transportRelative))) {
  & powershell.exe -ExecutionPolicy Bypass -File $script -Firefox
} else {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Choose the extracted Tor Expert Bundle folder.'
  $dialog.ShowNewFolderButton = $false
  $downloads = Join-Path $HOME 'Downloads'
  if (Test-Path -LiteralPath $downloads) { $dialog.SelectedPath = $downloads }
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { $dialog.Dispose(); throw 'Setup canceled.' }
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
  const status = document.querySelector(statusSelector);
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
    } catch {
      status.textContent = "Could not copy the command. Open “View command” to copy it manually.";
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
setupTabs.forEach(([tab, panel]) => {
  tab.addEventListener("click", () => {
    setupTabs.forEach(([otherTab, otherPanel]) => {
      const selected = otherTab === tab;
      otherTab.classList.toggle("active", selected);
      otherTab.setAttribute("aria-selected", String(selected));
      otherPanel.hidden = !selected;
    });
  });
});

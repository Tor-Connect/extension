param(
    [string]$ExtensionId,
    [string]$BundleDirectory,
    [switch]$Firefox
)
$ErrorActionPreference = 'Stop'
$firefoxId = '{92FAAAD1-58C8-461B-8447-0A43AE6CF002}'
if ($Firefox) {
    $ExtensionId = $firefoxId
    $nativeHosts = Join-Path $env:LOCALAPPDATA 'Mozilla\NativeMessagingHosts'
    $registry = 'HKCU:\Software\Mozilla\NativeMessagingHosts\org.torconnect.torchrome'
} else {
    if ($ExtensionId -notmatch '^[a-p]{32}$') { throw 'Invalid Chrome extension ID.' }
    $nativeHosts = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\NativeMessagingHosts'
    $registry = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\org.torconnect.torchrome'
}
$base = Join-Path $env:LOCALAPPDATA 'TorChrome'
$runtime = Join-Path $base 'runtime'
$exePath = Join-Path $base 'tor-chrome-helper.exe'
New-Item -ItemType Directory -Force -Path (Join-Path $runtime 'bundle'), $nativeHosts | Out-Null
if ($BundleDirectory) {
    $bundle = (Resolve-Path -LiteralPath $BundleDirectory).Path
    $tor = Get-ChildItem -LiteralPath $bundle -Filter 'tor.exe' -File -Recurse | Select-Object -First 1
    $transport = Get-ChildItem -LiteralPath $bundle -Filter 'lyrebird.exe' -File -Recurse | Select-Object -First 1
    if (-not $tor -or -not $transport) { throw 'Could not find tor.exe and lyrebird.exe. Use the extracted Windows Tor Expert Bundle.' }
    Copy-Item -Path (Join-Path $bundle '*') -Destination (Join-Path $runtime 'bundle') -Recurse -Force
    $torRelative = $tor.FullName.Substring($bundle.Length).TrimStart('\', '/')
    $transportRelative = $transport.FullName.Substring($bundle.Length).TrimStart('\', '/')
    [System.IO.File]::WriteAllText((Join-Path $runtime 'tor-path'), $torRelative, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $runtime 'transport-path'), $transportRelative, [System.Text.UTF8Encoding]::new($false))
} elseif ($Firefox) {
    $torRelative = [System.IO.File]::ReadAllText((Join-Path $runtime 'tor-path')).Trim()
    $transportRelative = [System.IO.File]::ReadAllText((Join-Path $runtime 'transport-path')).Trim()
    if (-not $torRelative -or -not $transportRelative -or
        -not (Test-Path -LiteralPath (Join-Path (Join-Path $runtime 'bundle') $torRelative) -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path (Join-Path $runtime 'bundle') $transportRelative) -PathType Leaf)) {
        throw 'No usable Tor installation was found. Supply the extracted Tor Expert Bundle directory.'
    }
    Write-Output 'Reusing the existing Tor installation.'
} else {
    throw 'BundleDirectory is required when setting up Chrome.'
}
if (-not $Firefox) {
    [System.IO.File]::WriteAllText((Join-Path $base 'extension-id'), $ExtensionId, [System.Text.UTF8Encoding]::new($false))
}
try {
    Invoke-WebRequest -Uri 'https://github.com/Tor-Connect/extension/releases/latest/download/Tor-Connect-Helper-Windows-x64.exe' -OutFile $exePath
} catch {
    Remove-Item -LiteralPath $exePath -Force -ErrorAction SilentlyContinue
    throw 'Could not download the Windows helper from GitHub. Check that this computer can reach github.com, then run setup again.'
}
if (-not (Test-Path -LiteralPath $exePath) -or (Get-Item -LiteralPath $exePath).Length -lt 4096) {
    Remove-Item -LiteralPath $exePath -Force -ErrorAction SilentlyContinue
    throw 'The Windows helper download was incomplete. Check the GitHub connection and run setup again.'
}
$helperHeader = [System.IO.File]::ReadAllBytes($exePath)
if ($helperHeader[0] -ne 0x4D -or $helperHeader[1] -ne 0x5A) {
    Remove-Item -LiteralPath $exePath -Force -ErrorAction SilentlyContinue
    throw 'The Windows helper download was invalid. Check the GitHub connection and run setup again.'
}

$manifestPath = Join-Path $nativeHosts 'org.torconnect.torchrome.json'
$manifest = [ordered]@{
    name = 'org.torconnect.torchrome'
    description = 'Local Tor connection helper'
    path = $exePath
    type = 'stdio'
}
if ($Firefox) { $manifest.allowed_extensions = @($ExtensionId) }
else { $manifest.allowed_origins = @("chrome-extension://$ExtensionId/") }
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, [System.Text.UTF8Encoding]::new($false))
New-Item -Path $registry -Force | Out-Null
Set-Item -Path $registry -Value $manifestPath
$browserName = if ($Firefox) { 'Firefox' } else { 'Google Chrome' }
Write-Output "Installed the Windows Tor helper for $browserName. Restart $browserName before connecting."

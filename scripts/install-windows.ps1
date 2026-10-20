param(
    [Parameter(Mandatory = $true)][string]$ExtensionId,
    [Parameter(Mandatory = $true)][string]$BundleDirectory
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-p]{32}$') { throw 'Invalid Chrome extension ID.' }
$bundle = (Resolve-Path -LiteralPath $BundleDirectory).Path
$base = Join-Path $env:LOCALAPPDATA 'TorChrome'
$runtime = Join-Path $base 'runtime'
$nativeHosts = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\NativeMessagingHosts'
$exePath = Join-Path $base 'tor-chrome-helper.exe'
$tor = Get-ChildItem -LiteralPath $bundle -Filter 'tor.exe' -File -Recurse | Select-Object -First 1
$transport = Get-ChildItem -LiteralPath $bundle -Filter 'lyrebird.exe' -File -Recurse | Select-Object -First 1
if (-not $tor -or -not $transport) { throw 'Could not find tor.exe and lyrebird.exe. Use the extracted Windows Tor Expert Bundle.' }

New-Item -ItemType Directory -Force -Path (Join-Path $runtime 'bundle'), $nativeHosts | Out-Null
Copy-Item -Path (Join-Path $bundle '*') -Destination (Join-Path $runtime 'bundle') -Recurse -Force
$torRelative = $tor.FullName.Substring($bundle.Length).TrimStart('\', '/')
$transportRelative = $transport.FullName.Substring($bundle.Length).TrimStart('\', '/')
[System.IO.File]::WriteAllText((Join-Path $runtime 'tor-path'), $torRelative, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $runtime 'transport-path'), $transportRelative, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $base 'extension-id'), $ExtensionId, [System.Text.UTF8Encoding]::new($false))
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
    allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, [System.Text.UTF8Encoding]::new($false))
$registry = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\org.torconnect.torchrome'
New-Item -Path $registry -Force | Out-Null
Set-Item -Path $registry -Value $manifestPath
Write-Output 'Installed the Windows Tor helper for Google Chrome. Restart Chrome before connecting.'

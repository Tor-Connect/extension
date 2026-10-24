param(
    [Parameter(Mandatory = $true)][string]$ExtensionId,
    [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-p]{32}$') { throw 'Invalid Chrome extension ID.' }

$base = Join-Path $env:LOCALAPPDATA 'TorChrome'
$manifestPath = Join-Path $base 'org.torconnect.torchrome.json'
$extensionIdPath = Join-Path $base 'extension-id'
$chromeRegistryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\org.torconnect.torchrome'
$firefoxRegistryPath = 'HKCU:\Software\Mozilla\NativeMessagingHosts\org.torconnect.torchrome'
$firefoxManifestPath = Join-Path $env:LOCALAPPDATA 'Mozilla\NativeMessagingHosts\org.torconnect.torchrome.json'
if ($Uninstall) {
    Remove-Item -LiteralPath $chromeRegistryPath -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $firefoxRegistryPath -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $firefoxManifestPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $extensionIdPath -Force -ErrorAction SilentlyContinue
    exit 0
}

$hostPath = Join-Path $env:LOCALAPPDATA 'TorChrome\tor-chrome-helper.exe'
$manifest = [ordered]@{
    name = 'org.torconnect.torchrome'
    description = 'Local Tor connection helper'
    path = $hostPath
    type = 'stdio'
    allowed_origins = @("chrome-extension://$ExtensionId/")
}
$json = $manifest | ConvertTo-Json -Depth 4
[System.IO.Directory]::CreateDirectory((Split-Path -Parent $manifestPath)) | Out-Null
[System.IO.Directory]::CreateDirectory((Split-Path -Parent $firefoxManifestPath)) | Out-Null
[System.IO.File]::WriteAllText($extensionIdPath, $ExtensionId, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($manifestPath, $json, [System.Text.UTF8Encoding]::new($false))
$firefoxManifest = [ordered]@{
    name = 'org.torconnect.torchrome'
    description = 'Local Tor connection helper'
    path = $hostPath
    type = 'stdio'
    allowed_extensions = @('{92FAAAD1-58C8-461B-8447-0A43AE6CF002}')
} | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($firefoxManifestPath, $firefoxManifest, [System.Text.UTF8Encoding]::new($false))
New-Item -Path $chromeRegistryPath -Force | Out-Null
Set-Item -Path $chromeRegistryPath -Value $manifestPath
New-Item -Path $firefoxRegistryPath -Force | Out-Null
Set-Item -Path $firefoxRegistryPath -Value $firefoxManifestPath

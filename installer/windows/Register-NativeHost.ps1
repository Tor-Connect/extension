param(
    [Parameter(Mandatory = $true)][string]$ExtensionId,
    [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-p]{32}$') { throw 'Invalid Chrome extension ID.' }

$base = Join-Path $env:LOCALAPPDATA 'TorChrome'
$manifestPath = Join-Path $base 'org.torconnect.torchrome.json'
$extensionIdPath = Join-Path $base 'extension-id'
$registryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\org.torconnect.torchrome'
if ($Uninstall) {
    Remove-Item -LiteralPath $registryPath -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
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
[System.IO.File]::WriteAllText($extensionIdPath, $ExtensionId, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($manifestPath, $json, [System.Text.UTF8Encoding]::new($false))
New-Item -Path $registryPath -Force | Out-Null
Set-Item -Path $registryPath -Value $manifestPath

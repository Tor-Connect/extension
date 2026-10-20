param(
    [Parameter(Mandatory = $true)][string]$ExtensionId,
    [Parameter(Mandatory = $true)][string]$BundleArchive
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-p]{32}$') { throw 'Invalid Chrome extension ID.' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$archive = (Resolve-Path -LiteralPath $BundleArchive).Path
$dist = Join-Path $root 'dist'
$payload = Join-Path $dist 'windows-payload'
$unpacked = Join-Path $payload 'unpacked'
$runtime = Join-Path $payload 'runtime\bundle'
Remove-Item -LiteralPath $payload -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $unpacked, $runtime | Out-Null
tar.exe -xzf $archive -C $unpacked
if ($LASTEXITCODE -ne 0) { throw 'Could not extract the Tor Expert Bundle.' }
Copy-Item -Path (Join-Path $unpacked '*') -Destination $runtime -Recurse -Force
$tor = Get-ChildItem -LiteralPath $runtime -Filter 'tor.exe' -File -Recurse | Select-Object -First 1
$transport = Get-ChildItem -LiteralPath $runtime -Filter 'lyrebird.exe' -File -Recurse | Select-Object -First 1
if (-not $tor -or -not $transport) { throw 'The bundle does not contain tor.exe and lyrebird.exe.' }

Copy-Item (Join-Path $PSScriptRoot 'Register-NativeHost.ps1') (Join-Path $payload 'Register-NativeHost.ps1')
py -3 -m pip install --user pyinstaller
if ($LASTEXITCODE -ne 0) { throw 'Could not install PyInstaller.' }
py -3 -m PyInstaller --onefile --clean --noconfirm --name tor-chrome-helper `
    --distpath $payload --workpath (Join-Path $dist 'pyinstaller-work') `
    (Join-Path $root 'native\tor-chrome-helper.py')
if ($LASTEXITCODE -ne 0) { throw 'Could not build the Windows native helper.' }
Remove-Item -LiteralPath $unpacked -Recurse -Force

$version = (Get-Content (Join-Path $root 'installer\tor-expert-bundle-version.txt') -Raw).Trim()
$compiler = Get-Command ISCC.exe -ErrorAction SilentlyContinue
$compilerPath = if ($compiler) { $compiler.Source } else {
    $innoPath = Join-Path ([Environment]::GetEnvironmentVariable('ProgramFiles(x86)')) 'Inno Setup 6\ISCC.exe'
    if (Test-Path -LiteralPath $innoPath) { $innoPath } else { $null }
}
if (-not $compilerPath) { throw 'Inno Setup 6 is required to create the Windows installer.' }
& $compilerPath "/DExtensionId=$ExtensionId" "/DPayloadDir=$payload" "/DAppVersion=$version" `
    (Join-Path $PSScriptRoot 'TorConnectSetup.iss')
if ($LASTEXITCODE -ne 0) { throw 'Inno Setup could not build the Windows installer.' }

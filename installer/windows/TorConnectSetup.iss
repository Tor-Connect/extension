#ifndef ExtensionId
  #define ExtensionId "nhpflipfjhibgcopfbeoloeghdpoighk"
#endif
#ifndef PayloadDir
  #define PayloadDir "..\..\dist\windows-payload"
#endif
#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

[Setup]
AppId={{C494E9C0-6D71-4EA0-BB6B-4E20CBF4E744}
AppName=Tor Connect Setup
AppVersion={#AppVersion}
AppPublisher=Tor Connect
DefaultDirName={localappdata}\TorChrome
DefaultGroupName=Tor Connect
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\..\dist
OutputBaseFilename=Tor-Connect-Setup-Windows-x64
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=Tor Connect Setup

[Files]
Source: "{#PayloadDir}\tor-chrome-helper.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PayloadDir}\Register-NativeHost.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PayloadDir}\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\Register-NativeHost.ps1"" -ExtensionId ""{#ExtensionId}"""; Flags: runhidden waituntilterminated; StatusMsg: "Connecting Tor Connect to Chrome..."

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\Register-NativeHost.ps1"" -ExtensionId ""{#ExtensionId}"" -Uninstall"; Flags: runhidden waituntilterminated

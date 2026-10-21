# Tor Connect

This prototype adds an MV3 extension and a local native messaging host for macOS, Linux, and Windows. When Tor reports a completed bootstrap, the extension sets Chrome's proxy to the helper's loopback SOCKS5 listener. Disconnect clears the Chrome proxy and stops Tor. Chrome must be reconnected after every browser restart.

This routes Chrome through Tor; it does not provide Tor Browser's fingerprinting protections. Tor's SOCKS interface is TCP oriented, so some features may not work. Circumvention is not guaranteed to work on every network.

## Install for local development

1. Download and extract the Tor Expert Bundle for your operating system from [Tor Project downloads](https://www.torproject.org/download/tor/). The extracted bundle must include the platform's Tor and Lyrebird executables. The local development scripts use your extracted bundle; generated setup installers package a verified official bundle.
2. In Chrome, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**. Select this repository's `extension` directory. Copy the extension ID shown by Chrome.
3. Run the matching installer from the project folder, passing the extension ID and extracted bundle directory:

   macOS (Terminal):
   ```sh
   ./scripts/install-macos.sh <extension-id> /path/to/extracted/tor-expert-bundle
   ```

   Linux (Terminal; requires Python 3):
   ```sh
   ./scripts/install-linux.sh <extension-id> /path/to/extracted/tor-expert-bundle
   ```

   Windows (PowerShell; downloads the prebuilt native helper from the latest GitHub release):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/install-windows.ps1 -ExtensionId <extension-id> -BundleDirectory "C:\path\to\extracted\tor-expert-bundle"
   ```

4. Restart Chrome and open the extension. Choose **Settings** to select **Try Snowflake** or **Use bridge lines**. For manual bridges, open Tor’s official bridge request page, copy the lines, choose **Paste or import from clipboard**, and save. Use the ping control to sort endpoints by TCP response time before saving.

If the popup reports that the native helper is unavailable, rerun the matching installer with the current extension ID and restart Chrome. Re-run installation if you removed and reloaded the unpacked extension and Chrome assigned it a new ID.

### Build and release setup installers

Every push to `main` runs the installer builds. Semantic Release publishes a GitHub release when commit titles call for a version bump: `fix:` creates a patch release, `feat:` creates a minor release, and a breaking change (for example, `feat!:`) creates a major release. Commit subjects that reach `main` must follow this format; with squash merges, use the PR title as the Conventional Commit subject. Other commit types such as `docs:` and `chore:` build for verification but do not publish a release. A manual run from the Actions tab builds test artifacts only.

The release uses a `v`-prefixed version tag and includes the Mac ZIP, Windows x64 setup executable and helper, and Linux x64 Debian package. The build downloads the pinned Tor Expert Bundle version in `installer/tor-expert-bundle-version.txt` and verifies each archive's Tor Project signature before packaging it.

The workflow uses `TOR_EXTENSION_ID` from repository Actions variables. If it is unset, builds use the current local testing extension ID, `nhpflipfjhibgcopfbeoloeghdpoighk`. Set the variable to the Chrome Web Store ID before making release installers.

To build the Mac app locally, first download and verify both Mac bundles, then build with the current local extension ID:

```sh
mkdir -p dist
./scripts/download-verified-tor-bundle.sh macos-aarch64 dist/tor-expert-bundle-macos-arm64.tar.gz
./scripts/download-verified-tor-bundle.sh macos-x86_64 dist/tor-expert-bundle-macos-x86_64.tar.gz
EXTENSION_ID=nhpflipfjhibgcopfbeoloeghdpoighk ./scripts/build-macos-installer.sh
```

Open `dist/Tor Connect Setup.app` and click **Install for Chrome**. The setup app selects the included Tor bundle for Apple silicon or Intel automatically, then registers the native messaging host. Restart Chrome after installation.

The local Mac app is ad-hoc signed. A public Mac release needs Developer ID signing and notarization. Windows release installers also need Authenticode signing to avoid the unknown-publisher warning. Setup download links remain unset until signed, hosted release assets are ready.

The helper stores runtime files and generated configuration locally: `~/Library/Application Support/TorChrome` on macOS, `${XDG_DATA_HOME:-~/.local/share}/TorChrome` on Linux, and `%LOCALAPPDATA%\TorChrome` on Windows. Bridge input is written to the local Tor configuration only; this project has no backend and does not log the lines.

## Uninstall

Disconnect in the extension first. Remove the extension from `chrome://extensions`, then remove its native messaging manifest and the local `TorChrome` data directory for your operating system. On Windows, also remove `HKCU\Software\Google\Chrome\NativeMessagingHosts\org.torconnect.torchrome` from the registry.

## Prototype limitations

- Test installers are not signed for public distribution. The Mac app is ad-hoc signed; Windows needs Authenticode signing before release.
- Generated installers include a Tor Expert Bundle downloaded from the Tor Project and signature-verified by the build workflow. The bundle layout is preserved so relative libraries remain available.
- The local Linux helper needs Python 3. The generated Windows installer bundles its native host executable; manual Windows setup downloads the same helper from the latest GitHub release. Only the local development build script needs Python and PyInstaller.
- Snowflake uses the Tor Project's documented example Snowflake bridge parameters. Network reliability still depends on current Tor configuration and the user's network.
- Bootstrap state currently comes from Tor's notice output. Startup errors show a few filtered Tor warning lines; bridge addresses and credentials are redacted, and detailed Tor output is not persisted.
- The prototype does not implement a Tor control protocol UI, automatic Moat integration, automatic updates, or public-release signing/notarization.

# Firefox build

The files in `extension/` remain the shared source and the Chrome build input. Firefox-specific manifest settings live in `firefox/manifest.json`; `scripts/build-firefox-package.py` packages that manifest with the shared extension files into `dist/firefox/`.

Build the add-on ZIP with the manifest version:

```sh
python3 scripts/build-firefox-package.py
```

To build a specific release version:

```sh
python3 scripts/build-firefox-package.py 0.7.0
```

For local testing, load the generated ZIP from `about:debugging` → **This Firefox** → **Load Temporary Add-on**. The native helper must also be registered for Firefox. Firefox shares the Tor runtime installed for Chrome; the installer reuses it when its files are present, and only asks for the Tor Expert Bundle on a fresh or incomplete setup. The manual installer scripts support this with the `--firefox` option on macOS and Linux, or `-Firefox` on Windows:

```sh
scripts/install-macos.sh --firefox /path/to/Tor-Expert-Bundle.tar.gz
scripts/install-linux.sh --firefox /path/to/extracted/Tor-Expert-Bundle
```

```powershell
.\scripts\install-windows.ps1 -Firefox -BundleDirectory C:\path\to\Tor-Expert-Bundle
```

Firefox uses the stable add-on ID `{92FAAAD1-58C8-461B-8447-0A43AE6CF002}` for native-messaging authorization. The Firefox proxy adapter uses the local SOCKS5 listener on `127.0.0.1:9050`, with DNS sent through the proxy.

Firefox requires the add-on to be allowed in Private Windows before it can change browser-wide proxy settings. Enable **Run in Private Windows** for Tor Connect in Firefox’s add-on settings.

The semantic-release workflow includes the Firefox ZIP alongside the Chrome package. Mozilla Add-ons signing and submission remain separate publishing steps.

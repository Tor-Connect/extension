# Tor Connect Privacy Policy

**Last updated: October 21, 2026**

This policy applies to the Tor Connect Chrome extension, its local native helper, and the companion setup installers. Tor Connect routes Chrome through a Tor client running on your computer.

## In brief

- Tor Connect has no user accounts, advertising, analytics, or developer-operated service that receives your browsing history or bridge lines.
- Connection preferences and bridge lines are stored on your device.
- When you connect, Tor communicates with Tor infrastructure, including bridges or Snowflake proxies. If you choose to ping bridges, your computer contacts their endpoints directly.
- Tor Connect does not read or collect the pages or URLs you visit.

Tor Connect’s use of information received from Chrome APIs complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Information stored on your device

Tor Connect stores the following information locally so its features work:

- **Connection preferences:** selected method, automatic or manual bridge selection, selected bridge, and enabled or disabled bridge lines.
- **Appearance preference:** light, dark, or system theme.
- **Bridge lines:** lines you import from a file or clipboard, saved in your Chrome profile and passed to the local helper when you connect or manage bridges.
- **Tor runtime data:** the helper writes a Tor configuration and Tor’s runtime state to the local Tor Connect data directory. The configuration can contain your bridge lines.

The extension uses Chrome’s local storage; it does not use Chrome Sync to sync these settings across devices. The helper communicates with the extension through Chrome Native Messaging on your computer. Tor Connect does not upload this locally stored information to its maintainers.

You can remove bridge lines in Settings. To remove the helper and its remaining local Tor data, uninstall the helper and delete its data directory using the instructions for your operating system in the [README](README.md#uninstall). Removing only the extension does not automatically remove the separately installed helper or its data.

## Clipboard and imported files

Tor Connect accesses the clipboard only after you choose an import or copy action and grant Chrome’s optional clipboard permission. Import reads clipboard text so you can add bridge lines. Copy writes the selected bridge line or setup command to your clipboard. Imported files are read locally to extract bridge lines. These actions do not upload clipboard contents or file contents to Tor Connect.

## Network connections and third parties

Tor Connect itself does not send browsing history, visited URLs, or bridge lines to a Tor Connect server. The following connections can occur when you use the extension or its setup flow:

- **Tor connections:** the local Tor client connects to Tor relays, bridges, Snowflake proxies, and related Tor infrastructure. These independent network operators may receive connection information, such as your IP address and connection timing, as needed to operate the network. Tor Connect does not control their logging or privacy practices.
- **Chrome traffic:** after Tor is connected, Tor Connect configures Chrome to use the local Tor SOCKS5 proxy. The extension does not inspect page content or collect browsing history. Websites and other services you access receive requests through the Tor network and apply their own privacy practices. Tor Connect is not Tor Browser and does not provide Tor Browser’s fingerprinting protections.
- **Bridge ping:** if you choose **Ping**, the local helper makes a short direct TCP connection to each saved bridge endpoint to measure reachability and response time. The endpoint and your network provider can see the connection and your public IP address. The ping result is handled locally; it is not sent to Tor Connect maintainers.
- **Country labels:** bridge country labels are looked up locally using GeoIP data included with the Tor bundle. The country lookup does not contact a separate geolocation service.
- **Setup downloads and links:** the setup flow may download Tor Connect setup scripts or helper files from GitHub and Tor bundles from the Tor Project. Settings also links to the Tor Project bridge website and Telegram’s bridge bot. Those services may receive ordinary connection data, such as your IP address, and are governed by their own policies. Tor Connect does not receive information from those visits or downloads.

## Diagnostics

Connection status and filtered Tor diagnostics may appear in the extension interface or Chrome’s local service-worker console to help explain connection problems. Tor Connect does not automatically send diagnostics to its maintainers. Diagnostics may still be visible to people or software with access to your device. Review and redact them before sharing; bridge information can be sensitive.

## Sharing, sale, and retention

Tor Connect maintainers do not receive or sell the locally stored preferences, clipboard contents, imported files, bridge lines, browsing history, or diagnostic output. We do not use them for advertising, profiling, or unrelated purposes. Local data remains on your device until you remove it using the controls described above or delete the helper’s data directory.

## Security

Tor Connect uses Chrome Native Messaging to communicate with the local helper and restricts the helper to the configured extension ID. Local file permissions are used where supported by the operating system. No software can guarantee that a device or network is secure; protect your device and avoid sharing private bridge lines or unredacted diagnostics.

## Changes to this policy

If Tor Connect’s data practices change, this policy will be updated and the change will be disclosed in the product where required. The current version is published at [github.com/Tor-Connect/extension/PRIVACY.md](https://github.com/Tor-Connect/extension/blob/main/PRIVACY.md).

## Contact

For privacy questions, use [GitHub Issues](https://github.com/Tor-Connect/extension/issues). Issues are public, so do not include bridge lines, personal information, or private diagnostics in an issue.

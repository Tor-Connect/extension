import AppKit

private struct InstallerConfig: Decodable {
    let extensionId: String
}

private let firefoxExtensionId = "{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"

@main
private struct TorConnectionSetupApp {
    static func main() {
        let application = NSApplication.shared
        let delegate = InstallerWindowController()
        application.delegate = delegate
        application.setActivationPolicy(.regular)
        application.run()
        _ = delegate
    }
}

private final class InstallerWindowController: NSObject, NSApplicationDelegate, NSWindowDelegate {
    private var window: NSWindow!
    private var installButton: NSButton!
    private var cancelButton: NSButton!
    private var statusLabel: NSTextField!
    private var progress: NSProgressIndicator!
    private var isInstalling = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildWindow()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        isInstalling ? .terminateCancel : .terminateNow
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool { !isInstalling }

    private func buildWindow() {
        let frame = NSRect(x: 0, y: 0, width: 570, height: 540)
        window = NSWindow(contentRect: frame, styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
        window.title = "Tor Connect Setup"
        window.center()
        window.isReleasedWhenClosed = false
        window.delegate = self

        let root = NSView(frame: frame)
        root.wantsLayer = true
        root.layer?.backgroundColor = NSColor.windowBackgroundColor.cgColor
        window.contentView = root

        let brandIcon = NSImageView(frame: NSRect(x: 30, y: 463, width: 46, height: 46))
        brandIcon.imageScaling = .scaleProportionallyUpOrDown
        brandIcon.image = Bundle.main.url(forResource: "TorConnectIcon", withExtension: "png")
            .flatMap { NSImage(contentsOf: $0) }
        root.addSubview(brandIcon)

        let title = label("Tor Connect", size: 18, weight: .semibold)
        title.frame = NSRect(x: 88, y: 485, width: 230, height: 23)
        root.addSubview(title)
        let eyebrow = label("COMPANION SETUP", size: 10, weight: .bold, color: .secondaryLabelColor)
        eyebrow.frame = NSRect(x: 89, y: 468, width: 220, height: 14)
        eyebrow.attributedStringValue = NSAttributedString(string: "COMPANION SETUP", attributes: [.kern: 1.4, .font: NSFont.systemFont(ofSize: 10, weight: .bold), .foregroundColor: NSColor.secondaryLabelColor])
        root.addSubview(eyebrow)

        let divider = NSBox(frame: NSRect(x: 30, y: 443, width: 510, height: 1))
        divider.boxType = .separator
        root.addSubview(divider)

        let heading = label("Set up Tor Connect", size: 25, weight: .bold)
        heading.frame = NSRect(x: 30, y: 393, width: 500, height: 38)
        root.addSubview(heading)
        let intro = label("Install Tor and connect your browser in one step.", size: 14, weight: .regular, color: .secondaryLabelColor)
        intro.frame = NSRect(x: 30, y: 346, width: 500, height: 24)
        intro.lineBreakMode = .byWordWrapping
        intro.maximumNumberOfLines = 2
        root.addSubview(intro)

        let card = NSView(frame: NSRect(x: 30, y: 217, width: 510, height: 122))
        card.wantsLayer = true
        card.layer?.backgroundColor = NSColor.controlBackgroundColor.cgColor
        card.layer?.cornerRadius = 14
        card.layer?.borderWidth = 1
        card.layer?.borderColor = NSColor.separatorColor.cgColor
        root.addSubview(card)

        let bundleIcon = NSImageView(frame: NSRect(x: 17, y: 65, width: 38, height: 38))
        bundleIcon.image = NSImage(systemSymbolName: "shippingbox", accessibilityDescription: "Tor bundle")
        bundleIcon.contentTintColor = .systemGreen
        card.addSubview(bundleIcon)
        let bundleTitle = label("Tor Expert Bundle", size: 14, weight: .semibold)
        bundleTitle.frame = NSRect(x: 67, y: 80, width: 380, height: 19)
        card.addSubview(bundleTitle)
        let bundleHelp = label("Tor Project Expert Bundles for Apple silicon and Intel are included.", size: 12, weight: .regular, color: .secondaryLabelColor)
        bundleHelp.frame = NSRect(x: 67, y: 60, width: 400, height: 17)
        card.addSubview(bundleHelp)

        let bundleNotice = label("Tor's license notices are included with the bundle.", size: 12, weight: .regular, color: .secondaryLabelColor)
        bundleNotice.frame = NSRect(x: 17, y: 17, width: 450, height: 18)
        card.addSubview(bundleNotice)

        statusLabel = label("", size: 12, weight: .medium, color: .secondaryLabelColor)
        statusLabel.frame = NSRect(x: 54, y: 148, width: 485, height: 38)
        statusLabel.lineBreakMode = .byWordWrapping
        statusLabel.maximumNumberOfLines = 2
        root.addSubview(statusLabel)
        progress = NSProgressIndicator(frame: NSRect(x: 30, y: 159, width: 16, height: 16))
        progress.style = .spinning
        progress.isDisplayedWhenStopped = false
        root.addSubview(progress)

        cancelButton = NSButton(title: "Cancel", target: self, action: #selector(cancel))
        cancelButton.bezelStyle = .rounded
        cancelButton.keyEquivalent = "\u{1b}"
        cancelButton.frame = NSRect(x: 314, y: 42, width: 100, height: 36)
        root.addSubview(cancelButton)

        installButton = NSButton(title: "Install", target: self, action: #selector(install))
        installButton.bezelStyle = .rounded
        installButton.keyEquivalent = "\r"
        installButton.frame = NSRect(x: 426, y: 42, width: 114, height: 36)
        root.addSubview(installButton)
    }

    private func label(_ value: String, size: CGFloat, weight: NSFont.Weight, color: NSColor = .labelColor) -> NSTextField {
        let text = NSTextField(labelWithString: value)
        text.font = NSFont.systemFont(ofSize: size, weight: weight)
        text.textColor = color
        return text
    }

    private var configuredExtensionId: String {
        guard let url = Bundle.main.url(forResource: "InstallerConfig", withExtension: "plist"),
              let config = try? PropertyListDecoder().decode(InstallerConfig.self, from: Data(contentsOf: url)) else {
            return "Unavailable"
        }
        return config.extensionId
    }

    @objc private func install() {
        isInstalling = true
        installButton.isEnabled = false
        cancelButton.isEnabled = false
        statusLabel.stringValue = "Installing Tor and registering browser helpers…"
        progress.startAnimation(nil)
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try LocalInstaller.install()
                DispatchQueue.main.async {
                    self.isInstalling = false
                    self.progress.stopAnimation(nil)
                    self.statusLabel.textColor = .systemGreen
                    self.statusLabel.stringValue = "Setup complete. Restart your browser to connect."
                    self.installButton.title = "Done"
                    self.installButton.isEnabled = true
                    self.installButton.target = self
                    self.installButton.action = #selector(self.finish)
                    self.cancelButton.isHidden = true
                }
            } catch {
                DispatchQueue.main.async {
                    self.isInstalling = false
                    self.progress.stopAnimation(nil)
                    self.statusLabel.textColor = .systemRed
                    self.statusLabel.stringValue = error.localizedDescription
                    self.installButton.isEnabled = true
                    self.cancelButton.isEnabled = true
                }
            }
        }
    }

    @objc private func cancel() { NSApp.terminate(nil) }

    @objc private func finish() { NSApp.terminate(nil) }
}

private enum LocalInstaller {
    static func install() throws {
        let configURL = Bundle.main.url(forResource: "InstallerConfig", withExtension: "plist")
        guard let configURL,
              let config = try? PropertyListDecoder().decode(InstallerConfig.self, from: Data(contentsOf: configURL)),
              config.extensionId.range(of: "^[a-p]{32}$", options: .regularExpression) != nil else {
            throw SetupError("The installer is missing a valid Chrome extension ID.")
        }
        let architecture = try run("/usr/bin/uname", ["-m"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let archiveName: String
        switch architecture {
        case "arm64": archiveName = "tor-expert-bundle-macos-arm64"
        case "x86_64": archiveName = "tor-expert-bundle-macos-x86_64"
        default: throw SetupError("This Mac processor is not supported yet.")
        }
        guard let archive = Bundle.main.url(forResource: archiveName, withExtension: "tar.gz") else {
            throw SetupError("The Tor files for this Mac are missing. Download the setup app again.")
        }

        let temporary = FileManager.default.temporaryDirectory.appendingPathComponent("TorConnection-\(UUID().uuidString)", isDirectory: true)
        let extracted = temporary.appendingPathComponent("bundle", isDirectory: true)
        try FileManager.default.createDirectory(at: extracted, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: temporary) }

        let listed = try run("/usr/bin/tar", ["-tzf", archive.path])
        for raw in listed.split(separator: "\n") {
            let entry = String(raw)
            if entry.hasPrefix("/") || entry.split(separator: "/").contains("..") {
                throw SetupError("This archive contains an unsafe file path.")
            }
        }
        _ = try run("/usr/bin/tar", ["-xzf", archive.path, "-C", extracted.path])
        guard let tor = findExecutable(named: "tor", in: extracted) else {
            throw SetupError("The included Tor files are incomplete. Download the setup app again.")
        }
        guard let transport = findExecutable(named: "lyrebird", in: extracted) ?? findExecutable(named: "lyrebird-macos", in: extracted) else {
            throw SetupError("The included Tor files are incomplete. Download the setup app again.")
        }
        try prepareRuntime(tor: tor, transport: transport, bundle: extracted)
        guard let helperSource = Bundle.main.url(forResource: "tor-chrome-helper", withExtension: nil) else {
            throw SetupError("The installer package is incomplete. Download it again and retry.")
        }
        let support = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/TorChrome", isDirectory: true)
        let runtime = support.appendingPathComponent("runtime", isDirectory: true)
        let installedBundle = runtime.appendingPathComponent("bundle", isDirectory: true)
        let stagedBundle = runtime.appendingPathComponent("bundle-new-\(UUID().uuidString)", isDirectory: true)
        let backupBundle = runtime.appendingPathComponent("bundle-old-\(UUID().uuidString)", isDirectory: true)
        let chromeNativeHosts = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/Google/Chrome/NativeMessagingHosts", isDirectory: true)
        let firefoxNativeHosts = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/Mozilla/NativeMessagingHosts", isDirectory: true)

        try FileManager.default.createDirectory(at: runtime, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: chromeNativeHosts, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: firefoxNativeHosts, withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: extracted, to: stagedBundle)
        defer { try? FileManager.default.removeItem(at: stagedBundle) }
        let torRelative = try relativePath(of: tor, inside: extracted)
        let transportRelative = try relativePath(of: transport, inside: extracted)
        let stagedTor = torRelative.split(separator: "/").reduce(stagedBundle) {
            $0.appendingPathComponent(String($1))
        }
        do {
            _ = try run(stagedTor.path, ["--version"])
        } catch {
            throw SetupError("Tor could not start at \(stagedTor.path): \(error.localizedDescription)")
        }
        do {
            if FileManager.default.fileExists(atPath: installedBundle.path) {
                try FileManager.default.moveItem(at: installedBundle, to: backupBundle)
            }
            try FileManager.default.moveItem(at: stagedBundle, to: installedBundle)
        } catch {
            if FileManager.default.fileExists(atPath: backupBundle.path),
               !FileManager.default.fileExists(atPath: installedBundle.path) {
                try? FileManager.default.moveItem(at: backupBundle, to: installedBundle)
            }
            throw error
        }
        try? FileManager.default.removeItem(at: backupBundle)

        try write(torRelative, to: runtime.appendingPathComponent("tor-path"))
        try write(transportRelative, to: runtime.appendingPathComponent("transport-path"))
        try write(config.extensionId, to: support.appendingPathComponent("extension-id"))
        let helper = support.appendingPathComponent("tor-chrome-helper")
        try? FileManager.default.removeItem(at: helper)
        try FileManager.default.copyItem(at: helperSource, to: helper)
        try chmod(["700", support.path, runtime.path, helper.path])
        try chmod(["-R", "go-rwx", installedBundle.path])
        try chmod(["600", runtime.appendingPathComponent("tor-path").path,
                   runtime.appendingPathComponent("transport-path").path,
                   support.appendingPathComponent("extension-id").path])

        let chromeManifest: [String: Any] = [
            "name": "org.torconnect.torchrome",
            "description": "Local Tor connection helper",
            "path": helper.path,
            "type": "stdio",
            "allowed_origins": ["chrome-extension://\(config.extensionId)/"]
        ]
        let firefoxManifest: [String: Any] = [
            "name": "org.torconnect.torchrome",
            "description": "Local Tor connection helper",
            "path": helper.path,
            "type": "stdio",
            "allowed_extensions": [firefoxExtensionId]
        ]
        try writeManifest(chromeManifest, to: chromeNativeHosts.appendingPathComponent("org.torconnect.torchrome.json"))
        try writeManifest(firefoxManifest, to: firefoxNativeHosts.appendingPathComponent("org.torconnect.torchrome.json"))
    }

    private static func findExecutable(named name: String, in root: URL) -> URL? {
        guard let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.isRegularFileKey]) else { return nil }
        for case let file as URL in enumerator where file.lastPathComponent == name {
            guard (try? file.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
            if FileManager.default.isExecutableFile(atPath: file.path) {
                return file
            }
        }
        return nil
    }

    private static func relativePath(of file: URL, inside root: URL) throws -> String {
        let rootPath = root.resolvingSymlinksInPath().standardizedFileURL.path
        let filePath = file.resolvingSymlinksInPath().standardizedFileURL.path
        let rootPrefix = rootPath.hasSuffix("/") ? rootPath : rootPath + "/"
        guard filePath.hasPrefix(rootPrefix) else {
            throw SetupError("The Tor bundle has an invalid executable path.")
        }
        let relative = String(filePath.dropFirst(rootPrefix.count))
        guard !relative.isEmpty, !relative.hasPrefix("/"), !relative.split(separator: "/").contains("..") else {
            throw SetupError("The Tor bundle has an invalid executable path.")
        }
        return relative
    }

    private static func prepareRuntime(tor: URL, transport: URL, bundle: URL) throws {
        var codeFiles = [tor, transport]
        if let enumerator = FileManager.default.enumerator(at: bundle, includingPropertiesForKeys: [.isRegularFileKey]) {
            for case let file as URL in enumerator where file.pathExtension.lowercased() == "dylib" {
                codeFiles.append(file)
            }
        }

        var seen = Set<String>()
        codeFiles = codeFiles.filter { seen.insert($0.path).inserted }
        for file in codeFiles {
            // The archive is verified during the build. Remove inherited download
            // quarantine, then seal the exact local files so macOS can load them.
            _ = try? run("/usr/bin/xattr", ["-d", "com.apple.quarantine", file.path])
            try run("/usr/bin/codesign", ["--force", "--sign", "-", "--timestamp=none", file.path])
            try run("/usr/bin/codesign", ["--verify", file.path])
        }

    }

    private static func write(_ value: String, to url: URL) throws {
        try Data((value + "\n").utf8).write(to: url, options: .atomic)
    }

    private static func writeManifest(_ manifest: [String: Any], to url: URL) throws {
        let data = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: url, options: .atomic)
        try chmod(["600", url.path])
    }

    private static func chmod(_ arguments: [String]) throws { _ = try run("/bin/chmod", arguments) }

    private static func run(_ executable: String, _ arguments: [String]) throws -> String {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        let output = Pipe()
        let errors = Pipe()
        process.standardOutput = output
        process.standardError = errors
        try process.run()
        let outData = output.fileHandleForReading.readDataToEndOfFile()
        let errData = errors.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else {
            let message = String(data: errData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
            throw SetupError(message?.isEmpty == false ? message! : "A required install step failed.")
        }
        return String(data: outData, encoding: .utf8) ?? ""
    }
}

private struct SetupError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

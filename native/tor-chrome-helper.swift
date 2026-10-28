import Foundation
import Darwin

private let proxyPort = 9050
private let appSupport = FileManager.default.homeDirectoryForCurrentUser
    .appendingPathComponent("Library/Application Support/TorChrome", isDirectory: true)
private let runtime = appSupport.appendingPathComponent("runtime", isDirectory: true)
private let bundleDirectory = runtime.appendingPathComponent("bundle", isDirectory: true)
private let dataDirectory = appSupport.appendingPathComponent("data", isDirectory: true)
private let configURL = appSupport.appendingPathComponent("torrc")
private let extensionIDURL = appSupport.appendingPathComponent("extension-id")
private let manualBridgeConnectTimeout: TimeInterval = 5 * 60
private let manualBridgeTimeoutMessage = "Could not connect through this bridge within 5 minutes."

final class Helper {
    private var tor: Process?
    private var state = "disconnected"
    private var message = ""
    private var startupDiagnostic: String?
    private var startupDiagnostics: [String] = []
    private var transportLaunchDirectory: URL?
    private var bridgeTargets: [BridgeTarget] = []
    private var currentBridgeIndex: Int?
    private var bridgeActivity: String?
    private var builtCircuits: [String: Int] = [:]
    private var reconnectSince: Date?
    private var autoRecoveryBridges: [String] = []
    private var autoRecoveryTried: Set<Int> = []
    private var autoRecoveryInProgress = false
    private var recoveryAttemptSince: Date?
    private var recoveryStableSince: Date?
    private var recoveryGeneration = 0
    private var connectedAt: Int64?
    private var ipv4GeoIPLoaded = false
    private var ipv6GeoIPLoaded = false
    private var ipv4CountryRanges: [IPv4CountryRange] = []
    private var ipv6CountryRanges: [IPv6CountryRange] = []
    private var lastError: String?
    private var stopping = false
    private let lock = NSLock()

    private struct BridgeTarget {
        let index: Int
        let transport: String
        let address: String
        let fingerprint: String?
    }

    private struct IPv4CountryRange {
        let first: UInt32
        let last: UInt32
        let country: String
    }

    private struct IPv6CountryRange {
        let first: Data
        let last: Data
        let country: String
    }

    func handle(_ request: [String: Any]) -> [String: Any] {
        guard let id = request["id"] as? Int, let command = request["command"] as? String else {
            return ["ok": false, "error": "Invalid request."]
        }
        var response: [String: Any]
        switch command {
        case "status":
            response = status()
        case "ping":
            response = pingBridges(request["bridges"] as? String ?? "")
        case "countries":
            response = bridgeCountries(request["bridges"] as? String ?? "")
        case "start":
            response = start(
                mode: request["mode"] as? String ?? "",
                bridges: request["bridges"] as? String ?? "",
                selectedBridgeIndex: request["selectedBridgeIndex"] as? Int
            )
        case "stop":
            stop()
            response = status()
        default:
            response = ["ok": false, "error": "Unsupported command."]
        }
        response["id"] = id
        return response
    }

    private func status() -> [String: Any] {
        lock.lock(); defer { lock.unlock() }
        if tor?.isRunning == true { return statusPayload(ok: true) }
        if tor != nil && state == "starting" {
            return statusPayload(ok: true)
        }
        if state == "failed" {
            return statusPayload(ok: false)
        }
        if state != "disconnected" { state = "disconnected" }
        if executable(named: "tor") == nil {
            return ["ok": true, "state": "missing_runtime", "message": "Install the Tor runtime first."]
        }
        return ["ok": true, "state": "disconnected", "message": "Ready to connect."]
    }

    private func statusPayload(ok: Bool) -> [String: Any] {
        var payload: [String: Any] = [
            "ok": ok,
            "state": state,
            "message": message,
            "diagnostics": startupDiagnostics,
            "bridgeCount": bridgeTargets.count,
            "builtCircuitCount": builtCircuits.count
        ]
        if let lastError { payload["error"] = lastError }
        if state == "connected", let connectedAt { payload["connectedAt"] = connectedAt }
        if let currentBridgeIndex { payload["currentBridgeIndex"] = currentBridgeIndex }
        if let bridgeActivity { payload["bridgeActivity"] = bridgeActivity }
        if let currentBridgeIndex,
           let target = bridgeTargets.first(where: { $0.index == currentBridgeIndex }) {
            payload["bridgeTransport"] = target.transport
            payload["bridgeAddress"] = target.address
            if let fingerprint = target.fingerprint { payload["bridgeFingerprint"] = fingerprint }
            if state == "connected", let country = countryCode(for: target.address) {
                payload["bridgeCountryCode"] = country
            }
        }
        payload.merge(liveStatistics()) { _, new in new }
        return payload
    }

    private func liveStatistics() -> [String: Any] {
        var values: [String: Any] = [:]
        let portURL = dataDirectory.appendingPathComponent("control-port")
        let cookieURL = dataDirectory.appendingPathComponent("control_auth_cookie")
        if let portText = try? String(contentsOf: portURL, encoding: .utf8),
           let port = UInt16(portText.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ":").last ?? ""),
           let cookie = try? Data(contentsOf: cookieURL), cookie.count == 32 {
            let descriptor = socket(AF_INET, SOCK_STREAM, 0)
            if descriptor >= 0 {
                defer { close(descriptor) }
                var timeout = timeval(tv_sec: 0, tv_usec: 350_000)
                _ = setsockopt(descriptor, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
                var address = sockaddr_in()
                address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
                address.sin_family = sa_family_t(AF_INET)
                address.sin_port = port.bigEndian
                address.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))
                let connected = withUnsafePointer(to: &address) { pointer in
                    pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                        Darwin.connect(descriptor, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
                    }
                }
                if connected == 0 {
                    let hex = cookie.map { String(format: "%02x", $0) }.joined()
                    if sendControlCommand("AUTHENTICATE \(hex)", to: descriptor),
                       readControlReply(from: descriptor)?.contains("250 OK") == true,
                       sendControlCommand("GETINFO traffic/read traffic/written", to: descriptor),
                       let reply = readControlReply(from: descriptor) {
                        for (key, field) in [("traffic/read", "downloadBytes"), ("traffic/written", "uploadBytes")] {
                            if let range = reply.range(of: "250-\(key)=") {
                                let digits = reply[range.upperBound...].prefix(while: \.isNumber)
                                if let count = Int64(digits) { values[field] = count }
                            }
                        }
                    }
                }
            }
        }
        if let pid = tor?.processIdentifier {
            let process = Process()
            let output = Pipe()
            process.executableURL = URL(fileURLWithPath: "/bin/ps")
            process.arguments = ["-o", "rss=", "-p", String(pid)]
            process.standardOutput = output
            if (try? process.run()) != nil {
                let text = String(data: output.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
                process.waitUntilExit()
                if let kb = Int64(text.trimmingCharacters(in: .whitespacesAndNewlines)) { values["memoryBytes"] = kb * 1024 }
            }
        }
        return values
    }

    private func countryCode(for endpoint: String) -> String? {
        let host: String
        if endpoint.hasPrefix("["), let close = endpoint.firstIndex(of: "]") {
            host = String(endpoint[endpoint.index(after: endpoint.startIndex)..<close])
        } else if let colon = endpoint.lastIndex(of: ":"),
                  endpoint[endpoint.index(after: colon)...].allSatisfy(\.isNumber) {
            host = String(endpoint[..<colon])
        } else {
            host = endpoint
        }

        var ipv4 = in_addr()
        if host.withCString({ inet_pton(AF_INET, $0, &ipv4) }) == 1 {
            loadIPv4GeoIPDataIfNeeded()
            return countryCode(for: UInt32(bigEndian: ipv4.s_addr))
        }

        var ipv6 = in6_addr()
        guard host.withCString({ inet_pton(AF_INET6, $0, &ipv6) }) == 1 else { return nil }
        loadIPv6GeoIPDataIfNeeded()
        let address = withUnsafeBytes(of: &ipv6) { Data($0.prefix(16)) }
        return countryCode(for: address)
    }

    private func loadIPv4GeoIPDataIfNeeded() {
        guard !ipv4GeoIPLoaded else { return }
        ipv4GeoIPLoaded = true
        let dataDirectory = bundleDirectory.appendingPathComponent("data", isDirectory: true)
        if let contents = try? String(contentsOf: dataDirectory.appendingPathComponent("geoip"), encoding: .utf8) {
            ipv4CountryRanges = contents.split(whereSeparator: \.isNewline).compactMap { line in
                let fields = line.split(separator: ",", omittingEmptySubsequences: false)
                guard fields.count == 3,
                      let first = UInt32(fields[0]),
                      let last = UInt32(fields[1]) else { return nil }
                let country = String(fields[2]).lowercased()
                guard country.count == 2, country != "??" else { return nil }
                return IPv4CountryRange(first: first, last: last, country: country)
            }
        }
    }

    private func loadIPv6GeoIPDataIfNeeded() {
        guard !ipv6GeoIPLoaded else { return }
        ipv6GeoIPLoaded = true
        let dataDirectory = bundleDirectory.appendingPathComponent("data", isDirectory: true)
        if let contents = try? String(contentsOf: dataDirectory.appendingPathComponent("geoip6"), encoding: .utf8) {
            ipv6CountryRanges = contents.split(whereSeparator: \.isNewline).compactMap { line in
                let fields = line.split(separator: ",", omittingEmptySubsequences: false)
                guard fields.count == 3,
                      let first = ipv6Bytes(String(fields[0])),
                      let last = ipv6Bytes(String(fields[1])) else { return nil }
                let country = String(fields[2]).lowercased()
                guard country.count == 2, country != "??" else { return nil }
                return IPv6CountryRange(first: first, last: last, country: country)
            }
        }
    }

    private func ipv6Bytes(_ value: String) -> Data? {
        var address = in6_addr()
        guard value.withCString({ inet_pton(AF_INET6, $0, &address) }) == 1 else { return nil }
        return withUnsafeBytes(of: &address) { Data($0.prefix(16)) }
    }

    private func countryCode(for address: UInt32) -> String? {
        var lower = 0
        var upper = ipv4CountryRanges.count
        while lower < upper {
            let middle = lower + (upper - lower) / 2
            let range = ipv4CountryRanges[middle]
            if address < range.first { upper = middle }
            else if address > range.last { lower = middle + 1 }
            else { return range.country }
        }
        return nil
    }

    private func countryCode(for address: Data) -> String? {
        var lower = 0
        var upper = ipv6CountryRanges.count
        while lower < upper {
            let middle = lower + (upper - lower) / 2
            let range = ipv6CountryRanges[middle]
            if address.lexicographicallyPrecedes(range.first) { upper = middle }
            else if range.last.lexicographicallyPrecedes(address) { lower = middle + 1 }
            else { return range.country }
        }
        return nil
    }

    private func start(mode: String, bridges: String, selectedBridgeIndex: Int?,
                       recoveryBridges: [String]? = nil,
                       recoveryTried: Set<Int> = []) -> [String: Any] {
        lock.lock(); let alreadyRunning = tor?.isRunning == true; lock.unlock()
        if alreadyRunning { return status() }
        guard mode == "snowflake" || mode == "manual" else {
            return ["ok": false, "error": "Choose Snowflake or manual bridge lines."]
        }
        guard let torURL = executable(named: "tor"),
              let transportURL = executable(named: "lyrebird") ?? executable(named: "lyrebird-macos") else {
            return ["ok": true, "state": "missing_runtime", "message": "Tor and lyrebird executables are required in the runtime folder."]
        }

        let bridgeLines: [String]
        var autoBridges: [String] = []
        var bridgeIndexOffset = 0
        if mode == "snowflake" {
            // Tor's documented example Snowflake bridge configuration; 192.0.2.3 is a
            // placeholder endpoint consumed by the Snowflake transport, not a relay address.
            bridgeLines = ["Bridge snowflake 192.0.2.3:80 2B280B23E1107BB62ABFC40DDCC8824814F80A72 fingerprint=2B280B23E1107BB62ABFC40DDCC8824814F80A72 url=https://1098762253.rsc.cdn77.org front=www.phpmyadmin.net,cdn.zk.mk ice=stun:stun.antisip.com:3478,stun:stun.epygi.com:3478,stun:stun.uls.co.za:3478,stun:stun.voipgate.com:3478,stun:stun.mixvoip.com:3478,stun:stun.nextcloud.com:443 utls-imitate=hellorandomizedalpn"]
        } else {
            guard let parsed = parseBridgeLines(bridges), !parsed.isEmpty else {
                return ["ok": false, "error": "Enter one or more valid obfs4, WebTunnel, or Snowflake bridge lines."]
            }
            autoBridges = parsed
            if let selectedBridgeIndex {
                guard selectedBridgeIndex > 0, parsed.count == 1 else {
                    return ["ok": false, "error": "Choose one valid bridge from Settings."]
                }
                bridgeIndexOffset = selectedBridgeIndex - 1
            }
            bridgeLines = parsed.map { "Bridge \($0)" }
        }
        let configuredBridgeTargets = mode == "manual" ? parseBridgeTargets(from: bridgeLines, indexOffset: bridgeIndexOffset) : []

        do {
            try FileManager.default.createDirectory(at: appSupport, withIntermediateDirectories: true)
            try FileManager.default.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
            try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: appSupport.path)
            try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: dataDirectory.path)
            // Tor splits the ClientTransportPlugin exec command on whitespace.
            // A quoted path under "Application Support" is still split at the space,
            // so expose Lyrebird through a private, space-free symlink.
            let launchDirectory = URL(fileURLWithPath: "/private/tmp", isDirectory: true)
                .appendingPathComponent("torchrome-\(UUID().uuidString.lowercased())", isDirectory: true)
            try FileManager.default.createDirectory(
                at: launchDirectory,
                withIntermediateDirectories: false,
                attributes: [.posixPermissions: 0o700]
            )
            let launchTransportURL = launchDirectory.appendingPathComponent("lyrebird")
            try FileManager.default.createSymbolicLink(at: launchTransportURL, withDestinationURL: transportURL)
            let transportPath = launchTransportURL.path
            lock.lock(); transportLaunchDirectory = launchDirectory; lock.unlock()
            let controlLines = [
                "ControlPort auto",
                "ControlListenAddress 127.0.0.1",
                "ControlPortWriteToFile \"\(dataDirectory.appendingPathComponent("control-port").path)\"",
                "CookieAuthentication 1"
            ]
            let config = ([
                "DataDirectory \"\(dataDirectory.path)\"",
                "SocksPort 127.0.0.1:\(proxyPort) IsolateSOCKSAuth"
            ] + controlLines + [
                "Log notice stdout",
                "UseBridges 1",
                "ClientTransportPlugin meek_lite,obfs4,snowflake,webtunnel exec \(transportPath)"
            ] + bridgeLines).joined(separator: "\n") + "\n"
            try config.write(to: configURL, atomically: true, encoding: .utf8)
            try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: configURL.path)
            try? FileManager.default.removeItem(at: dataDirectory.appendingPathComponent("control-port"))
            try? FileManager.default.removeItem(at: dataDirectory.appendingPathComponent("control_auth_cookie"))

            let process = Process()
            process.executableURL = torURL
            process.currentDirectoryURL = torURL.deletingLastPathComponent()
            process.arguments = ["-f", configURL.path]
            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = pipe
            pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
                let data = handle.availableData
                guard !data.isEmpty, let output = String(data: data, encoding: .utf8) else { return }
                if let diagnostics = self?.safeDiagnostics(from: output), !diagnostics.isEmpty {
                    self?.lock.lock()
                    for diagnostic in diagnostics where self?.startupDiagnostics.contains(diagnostic) != true {
                        self?.startupDiagnostics.append(diagnostic)
                    }
                    self?.startupDiagnostics = Array((self?.startupDiagnostics ?? []).suffix(5))
                    self?.startupDiagnostic = self?.startupDiagnostics.joined(separator: " ")
                    self?.lock.unlock()
                }
                if let progress = self?.bootstrapProgress(from: output) {
                    self?.lock.lock()
                    if progress >= 100 {
                        if self?.connectedAt == nil {
                            self?.connectedAt = Int64(Date().timeIntervalSince1970 * 1000)
                        }
                        self?.state = "connected"
                        self?.message = "Tor connected."
                    } else {
                        self?.connectedAt = nil
                        self?.state = "starting"
                        self?.message = progress == 0
                            ? "Starting Tor connection… 0%"
                            : "Connecting to Tor… \(progress)%"
                    }
                    self?.lock.unlock()
                }
            }
            process.terminationHandler = { [weak self] finishedProcess in
                guard let self else { return }
                self.lock.lock()
                if self.state == "failed" && self.lastError == manualBridgeTimeoutMessage {
                    // Keep the timeout message after terminating Tor.
                } else if self.stopping || self.state == "disconnected" {
                    self.state = "disconnected"
                    self.message = "Tor stopped."
                } else if finishedProcess.terminationStatus != 0 {
                    let diagnostic = self.startupDiagnostic.map { " Tor reported: \($0)" } ?? " Check the runtime and bridge configuration."
                    let termination = finishedProcess.terminationReason == .uncaughtSignal
                        ? "signal \(finishedProcess.terminationStatus)"
                        : "exit code \(finishedProcess.terminationStatus)"
                    self.lastError = "Tor stopped before connecting (\(termination)).\(diagnostic)"
                    self.state = "failed"
                    self.message = self.lastError ?? "Tor stopped before connecting."
                } else {
                    self.state = "disconnected"
                    self.message = "Tor stopped."
                }
                self.tor = nil
                let launchDirectory = self.transportLaunchDirectory
                self.transportLaunchDirectory = nil
                self.lock.unlock()
                if let launchDirectory { try? FileManager.default.removeItem(at: launchDirectory) }
            }
            lock.lock()
            tor = process
            bridgeTargets = configuredBridgeTargets
            currentBridgeIndex = nil
            bridgeActivity = nil
            builtCircuits = [:]
            reconnectSince = nil
            autoRecoveryBridges = recoveryBridges ?? ((mode == "manual" && selectedBridgeIndex == nil) ? autoBridges : [])
            autoRecoveryTried = recoveryTried
            autoRecoveryInProgress = recoveryBridges != nil
            recoveryAttemptSince = recoveryBridges == nil ? nil : Date()
            if recoveryBridges == nil { recoveryStableSince = nil }
            let shouldStartRecoveryWatchdog = !autoRecoveryBridges.isEmpty
            recoveryGeneration += 1
            let watchdogGeneration = recoveryGeneration
            connectedAt = nil
            state = "starting"
            message = "Starting Tor…"
            startupDiagnostic = nil
            startupDiagnostics = []
            lastError = nil
            stopping = false
            lock.unlock()
            do {
                try process.run()
                if !configuredBridgeTargets.isEmpty {
                    let controlPortFile = dataDirectory.appendingPathComponent("control-port")
                    let cookieFile = dataDirectory.appendingPathComponent("control_auth_cookie")
                    DispatchQueue.global(qos: .utility).async { [weak self] in
                        self?.monitorControlPort(portFile: controlPortFile, cookieFile: cookieFile, targets: configuredBridgeTargets)
                    }
                }
                if shouldStartRecoveryWatchdog {
                    DispatchQueue.global(qos: .utility).async { [weak self] in
                        self?.autoRecoveryWatchdog(generation: watchdogGeneration)
                    }
                }
                if mode == "manual", selectedBridgeIndex != nil {
                    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + manualBridgeConnectTimeout) { [weak self] in
                        self?.manualBridgeTimeoutWatchdog(process: process, generation: watchdogGeneration)
                    }
                }
            } catch {
                lock.lock(); tor = nil; let launchDirectory = transportLaunchDirectory; transportLaunchDirectory = nil; state = "disconnected"; lock.unlock()
                if let launchDirectory { try? FileManager.default.removeItem(at: launchDirectory) }
                let detail = error as NSError
                return [
                    "ok": false,
                    "error": "macOS could not launch Tor at \(torURL.path): \(detail.localizedDescription) (\(detail.domain) code \(detail.code)). In Terminal, try: \"\(torURL.path)\" --version"
                ]
            }
            return ["ok": true, "state": "starting", "message": "Tor started. Waiting for a connection…", "bridgeCount": configuredBridgeTargets.count]
        } catch {
            lock.lock(); let launchDirectory = transportLaunchDirectory; transportLaunchDirectory = nil; lock.unlock()
            if let launchDirectory { try? FileManager.default.removeItem(at: launchDirectory) }
            return ["ok": false, "error": "Could not start Tor: \(error.localizedDescription)"]
        }
    }

    private func manualBridgeTimeoutWatchdog(process: Process, generation: Int) {
        lock.lock()
        guard recoveryGeneration == generation, tor === process, state == "starting" else {
            lock.unlock()
            return
        }
        state = "failed"
        lastError = manualBridgeTimeoutMessage
        message = manualBridgeTimeoutMessage
        lock.unlock()

        if process.isRunning {
            process.terminate()
            process.waitUntilExit()
        }
        lock.lock()
        if tor === process { tor = nil }
        lock.unlock()
    }

    private func parseBridgeLines(_ raw: String) -> [String]? {
        let lines = raw.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        guard lines.count <= 20 else { return nil }
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .:/?=&,+_-[]")
        let addressPattern = #"^(\[[\da-fA-F:]+\]|[\d.]+):(\d{1,5})$"#
        for line in lines {
            guard line.unicodeScalars.allSatisfy({ allowed.contains($0) }),
                  let first = line.split(separator: " ").first,
                  !line.contains("#"), !line.contains("\"") else { return nil }
            let firstStr = String(first)
            if ["obfs4", "webtunnel", "snowflake"].contains(firstStr) { continue }
            // Vanilla bridge: must be numeric IP:port with port in 1…65535
            guard firstStr.range(of: addressPattern, options: .regularExpression) != nil,
                  let colonRange = firstStr.lastIndex(of: ":"),
                  let port = UInt16(firstStr[firstStr.index(after: colonRange)...]),
                  port > 0 else { return nil }
        }
        return lines
    }

    private func pingBridges(_ raw: String) -> [String: Any] {
        guard let lines = parseBridgeLines(raw), !lines.isEmpty else {
            return ["ok": false, "error": "Add valid bridge lines before pinging them."]
        }
        let results: [[String: Any]] = lines.map { line in
            let normalized = line.hasPrefix("Bridge ") ? String(line.dropFirst(7)) : line
            let parts = normalized.split(whereSeparator: \.isWhitespace)
            guard parts.count >= 2 else {
                return ["line": line, "latencyMs": NSNull()]
            }
            let knownTransports = ["obfs4", "webtunnel", "snowflake"]
            // Vanilla bridges: "IP:port fingerprint" — first token is the address.
            // Named-transport bridges: "transport IP:port ..." — second token is the address.
            let endpoint = knownTransports.contains(String(parts[0]).lowercased())
                ? String(parts[1]) : String(parts[0])
            var result: [String: Any] = ["line": line]
            if let latency = tcpLatency(endpoint: endpoint) { result["latencyMs"] = latency }
            else { result["latencyMs"] = NSNull() }
            if let country = countryCode(for: endpoint) { result["countryCode"] = country }
            return result
        }
        return ["ok": true, "results": results]
    }

    private func bridgeCountries(_ raw: String) -> [String: Any] {
        let originalLines = raw.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let normalizedLines = originalLines.map { $0.hasPrefix("Bridge ") ? String($0.dropFirst(7)) : $0 }
        guard let parsed = parseBridgeLines(normalizedLines.joined(separator: "\n")), !parsed.isEmpty else {
            return ["ok": false, "error": "Add valid bridge lines before looking up countries."]
        }
        let results: [[String: Any]] = zip(originalLines, parsed).map { line, parsedLine in
            let parts = parsedLine.split(whereSeparator: \.isWhitespace)
            var result: [String: Any] = ["line": line]
            if parts.count >= 2, let country = countryCode(for: String(parts[1])) {
                result["countryCode"] = country
            }
            return result
        }
        return ["ok": true, "results": results]
    }

    // Measures TCP connect time to the bridge endpoint. This is a reachability
    // estimate, not a Tor handshake or a guarantee that the bridge will work.
    private func tcpLatency(endpoint: String) -> Double? {
        let host: String
        let port: String
        if endpoint.hasPrefix("["), let close = endpoint.firstIndex(of: "]") {
            host = String(endpoint[endpoint.index(after: endpoint.startIndex)..<close])
            let after = endpoint.index(after: close)
            guard after < endpoint.endIndex, endpoint[after] == ":" else { return nil }
            port = String(endpoint[endpoint.index(after: after)...])
        } else {
            guard let colon = endpoint.lastIndex(of: ":") else { return nil }
            host = String(endpoint[..<colon])
            port = String(endpoint[endpoint.index(after: colon)...])
        }
        guard !host.isEmpty, let portNumber = UInt16(port), portNumber > 0 else { return nil }

        var hints = addrinfo()
        hints.ai_family = AF_UNSPEC
        hints.ai_socktype = SOCK_STREAM
        hints.ai_protocol = IPPROTO_TCP
        var resolved: UnsafeMutablePointer<addrinfo>?
        guard getaddrinfo(host, port, &hints, &resolved) == 0, let first = resolved else { return nil }
        defer { freeaddrinfo(first) }

        var cursor: UnsafeMutablePointer<addrinfo>? = first
        while let info = cursor {
            let fd = socket(info.pointee.ai_family, info.pointee.ai_socktype, info.pointee.ai_protocol)
            if fd >= 0 {
                let originalFlags = fcntl(fd, F_GETFL, 0)
                _ = fcntl(fd, F_SETFL, originalFlags | O_NONBLOCK)
                let start = DispatchTime.now().uptimeNanoseconds
                let connectResult = Darwin.connect(fd, info.pointee.ai_addr, info.pointee.ai_addrlen)
                var connected = connectResult == 0
                if !connected && errno == EINPROGRESS {
                    var pollDescriptor = pollfd(fd: fd, events: Int16(POLLOUT), revents: 0)
                    let ready = poll(&pollDescriptor, 1, 1800)
                    if ready > 0 {
                        var socketError: Int32 = 0
                        var errorLength = socklen_t(MemoryLayout<Int32>.size)
                        connected = getsockopt(fd, SOL_SOCKET, SO_ERROR, &socketError, &errorLength) == 0 && socketError == 0
                    }
                }
                let elapsed = Double(DispatchTime.now().uptimeNanoseconds - start) / 1_000_000
                _ = close(fd)
                if connected { return elapsed }
            }
            cursor = info.pointee.ai_next
        }
        return nil
    }

    private func parseBridgeTargets(from lines: [String], indexOffset: Int = 0) -> [BridgeTarget] {
        let knownTransports = ["obfs4", "webtunnel", "snowflake"]
        return lines.enumerated().compactMap { offset, line in
            let parts = line.split(whereSeparator: \.isWhitespace)
            let start = parts.first == "Bridge" ? 1 : 0
            guard parts.count >= start + 2 else { return nil }
            let first = String(parts[start]).lowercased()
            let vanilla = !knownTransports.contains(first)
            let transport = vanilla ? "none" : first
            let address = vanilla ? first : String(parts[start + 1]).lowercased()
            let fpRaw = vanilla ? String(parts[start + 1]) : (parts.count > start + 2 ? String(parts[start + 2]) : "")
            let fingerprintCandidate = fpRaw.lowercased()
            let fingerprint = fingerprintCandidate.range(of: #"^[0-9a-f]{40}$"#, options: .regularExpression) != nil
                ? fingerprintCandidate
                : nil
            return BridgeTarget(
                index: offset + 1 + indexOffset,
                transport: transport,
                address: address,
                fingerprint: fingerprint
            )
        }
    }

    private func monitorControlPort(portFile: URL, cookieFile: URL, targets: [BridgeTarget]) {
        let deadline = Date().addingTimeInterval(20)
        var port: UInt16?
        var cookie: Data?
        while Date() < deadline {
            if let text = try? String(contentsOf: portFile, encoding: .utf8),
               let lastPart = text.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ":").last {
                port = UInt16(lastPart)
            }
            if let data = try? Data(contentsOf: cookieFile), data.count == 32 { cookie = data }
            if port != nil && cookie != nil { break }
            usleep(100_000)
        }
        guard let port, let cookie else { return }

        let descriptor = socket(AF_INET, SOCK_STREAM, 0)
        guard descriptor >= 0 else { return }
        defer { close(descriptor) }
        var timeout = timeval(tv_sec: 1, tv_usec: 0)
        _ = setsockopt(descriptor, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
        var socketAddress = sockaddr_in()
        socketAddress.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        socketAddress.sin_family = sa_family_t(AF_INET)
        socketAddress.sin_port = port.bigEndian
        socketAddress.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))
        let connected = withUnsafePointer(to: &socketAddress) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                Darwin.connect(descriptor, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard connected == 0 else { return }

        let cookieHex = cookie.map { String(format: "%02x", $0) }.joined()
        guard sendControlCommand("AUTHENTICATE \(cookieHex)", to: descriptor),
              readControlReply(from: descriptor)?.contains("250 OK") == true,
              sendControlCommand("SETEVENTS EXTENDED STATUS_CLIENT ORCONN CIRC", to: descriptor),
              let initialEvents = readControlReply(from: descriptor),
              initialEvents.contains("250 OK") else { return }

        processControlEvents(initialEvents, targets: targets)
        // The bridge may already be connected before the control listener
        // attaches, so seed our active bridge from Tor's current OR connections.
        if sendControlCommand("GETINFO orconn-status", to: descriptor),
           let snapshot = readControlReply(from: descriptor) {
            processORConnectionSnapshot(snapshot, targets: targets)
        }
        if sendControlCommand("GETINFO circuit-status", to: descriptor),
           let snapshot = readControlReply(from: descriptor) {
            processCircuitSnapshot(snapshot, targets: targets)
        }
        var buffered = Data()
        var chunk = [UInt8](repeating: 0, count: 8192)
        while true {
            let count = chunk.withUnsafeMutableBytes { Darwin.read(descriptor, $0.baseAddress, $0.count) }
            if count == 0 { return }
            if count < 0 {
                if errno == EAGAIN || errno == EWOULDBLOCK || errno == EINTR {
                    if maybeAutoRecover() { return }
                    continue
                }
                return
            }
            buffered.append(contentsOf: chunk.prefix(count))
            while let newline = buffered.firstRange(of: Data([13, 10])) {
                let lineData = buffered[..<newline.lowerBound]
                buffered.removeSubrange(..<newline.upperBound)
                if let line = String(data: lineData, encoding: .utf8) {
                    updateBridgeActivity(from: line, targets: targets)
                    if maybeAutoRecover() { return }
                }
            }
            if buffered.count > 65_536 { buffered.removeAll(keepingCapacity: true) }
        }
    }

    private func sendControlCommand(_ command: String, to descriptor: Int32) -> Bool {
        let data = Data((command + "\r\n").utf8)
        return data.withUnsafeBytes { bytes in
            guard let base = bytes.baseAddress else { return false }
            return Darwin.write(descriptor, base, bytes.count) == bytes.count
        }
    }

    private func readControlReply(from descriptor: Int32) -> String? {
        var reply = Data()
        var chunk = [UInt8](repeating: 0, count: 1024)
        let deadline = Date().addingTimeInterval(5)
        while Date() < deadline && reply.count < 8192 {
            let count = chunk.withUnsafeMutableBytes { Darwin.read(descriptor, $0.baseAddress, $0.count) }
            if count > 0 {
                reply.append(contentsOf: chunk.prefix(count))
                if let text = String(data: reply, encoding: .utf8), text.contains("250 OK\r\n") { return text }
            } else if count == 0 {
                return nil
            } else if errno != EAGAIN && errno != EWOULDBLOCK && errno != EINTR {
                return nil
            }
        }
        return nil
    }

    private func processControlEvents(_ text: String, targets: [BridgeTarget]) {
        for line in text.components(separatedBy: "\r\n") where line.hasPrefix("650 ") {
            updateBridgeActivity(from: line, targets: targets)
        }
    }

    private func processORConnectionSnapshot(_ text: String, targets: [BridgeTarget]) {
        var inSnapshot = false
        for line in text.components(separatedBy: "\r\n") {
            if line.hasPrefix("250+orconn-status=") {
                inSnapshot = true
                continue
            }
            if inSnapshot && line == "." {
                inSnapshot = false
                continue
            }
            guard inSnapshot else { continue }
            let fields = line.split(whereSeparator: \.isWhitespace)
            guard fields.count >= 2 else { continue }
            updateBridgeActivity(from: "650 ORCONN \(fields[0]) \(fields[1])", targets: targets)
        }
    }

    private func processCircuitSnapshot(_ text: String, targets: [BridgeTarget]) {
        var inSnapshot = false
        for line in text.components(separatedBy: "\r\n") {
            if line.hasPrefix("250+circuit-status=") {
                inSnapshot = true
                continue
            }
            if inSnapshot && line == "." {
                inSnapshot = false
                continue
            }
            guard inSnapshot else { continue }
            let fields = line.split(whereSeparator: \.isWhitespace)
            guard fields.count >= 3 else { continue }
            updateCircuitActivity(id: String(fields[0]), status: String(fields[1]), path: String(fields[2]), targets: targets)
        }
    }

    private func updateCircuitActivity(id: String, status: String, path: String, targets: [BridgeTarget]) {
        if status == "BUILT" {
            let firstHop = String(path.split(separator: ",", maxSplits: 1).first ?? "")
            let index = bridgeIndex(for: firstHop, targets: targets)
            lock.lock()
            // A built circuit proves the tunnel works even when a bridge line
            // omitted its fingerprint and cannot be mapped back to a list row.
            builtCircuits[id] = index ?? 0
            if let index { currentBridgeIndex = index }
            bridgeActivity = "connected"
            reconnectSince = nil
            recoveryAttemptSince = nil
            if !autoRecoveryTried.isEmpty && recoveryStableSince == nil { recoveryStableSince = Date() }
            lock.unlock()
        } else if ["CLOSED", "FAILED", "DESTROYED"].contains(status) {
            lock.lock(); builtCircuits.removeValue(forKey: id); lock.unlock()
        }
    }

    private func updateBridgeActivity(from event: String, targets: [BridgeTarget]) {
        var reportedTarget: String?
        var activity: String?
        let fields = event.split(whereSeparator: \.isWhitespace)
        if event.contains(" CIRC "), fields.count >= 5 {
            updateCircuitActivity(id: String(fields[2]), status: String(fields[3]), path: String(fields[4]), targets: targets)
            return
        }
        if event.contains(" STATUS_CLIENT "), event.contains(" BOOTSTRAP ") {
            reportedTarget = controlField("HOSTADDR", in: event) ?? controlField("HOST", in: event)
            if reportedTarget != nil { activity = "trying" }
        } else if event.contains(" ORCONN ") {
            guard fields.count >= 4 else { return }
            reportedTarget = String(fields[2])
            switch fields[3] {
            case "LAUNCHED": activity = "trying"
            case "CONNECTED": activity = "connected"
            case "FAILED": activity = "failed"
            case "CLOSED": activity = "closed"
            default: return
            }
        }
        guard let reportedTarget, let activity,
              let index = bridgeIndex(for: reportedTarget, targets: targets) else { return }
        lock.lock()
        // Preserve the working route while Tor opens or closes parallel OR connections.
        if !builtCircuits.isEmpty, ["trying", "failed", "closed"].contains(activity) {
            lock.unlock()
            return
        }
        if (activity == "failed" || activity == "closed"),
           let currentBridgeIndex, currentBridgeIndex != index {
            lock.unlock()
            return
        }
        currentBridgeIndex = index
        bridgeActivity = activity
        if ["trying", "failed", "closed"].contains(activity) {
            if reconnectSince == nil { reconnectSince = Date() }
        } else if activity == "connected" {
            reconnectSince = nil
        }
        lock.unlock()
    }

    private func maybeAutoRecover() -> Bool {
        lock.lock()
        if !builtCircuits.isEmpty {
            if let recoveryStableSince, Date().timeIntervalSince(recoveryStableSince) >= 60 {
                autoRecoveryTried.removeAll()
                self.recoveryStableSince = nil
                autoRecoveryInProgress = false
            }
            lock.unlock()
            return false
        }
        let recoveryAttemptDue = autoRecoveryInProgress
            && ["starting", "connected", "failed"].contains(state)
            && (state == "failed" || (recoveryAttemptSince.map { Date().timeIntervalSince($0) >= 30 } ?? false))
        let outageDue = state == "connected"
            && ["trying", "failed", "closed"].contains(bridgeActivity ?? "")
            && (reconnectSince.map { Date().timeIntervalSince($0) >= 15 } ?? false)
        guard !autoRecoveryBridges.isEmpty, recoveryAttemptDue || outageDue else {
            lock.unlock()
            return false
        }
        let count = autoRecoveryBridges.count
        let current = (currentBridgeIndex ?? 0) - 1
        guard let candidate = (1...count).map({ (current + $0) % count }).first(where: { !autoRecoveryTried.contains($0) }) else {
            bridgeActivity = "failed"
            self.reconnectSince = nil
            autoRecoveryInProgress = false
            message = "Saved bridges could not restore the connection."
            lock.unlock()
            stop(preserveAutoRecovery: true)
            lock.lock()
            state = "failed"
            message = "Saved bridges could not restore the connection. Try connecting again."
            lastError = message
            lock.unlock()
            return true
        }
        let bridges = autoRecoveryBridges
        var tried = autoRecoveryTried
        tried.insert(candidate)
        message = "Trying saved bridge \(candidate + 1)…"
        self.reconnectSince = nil
        recoveryAttemptSince = nil
        lock.unlock()

        stop(preserveAutoRecovery: true)
        let result = start(mode: "manual", bridges: bridges[candidate], selectedBridgeIndex: candidate + 1,
                           recoveryBridges: bridges, recoveryTried: tried)
        if (result["ok"] as? Bool) != true {
            lock.lock()
            state = "failed"
            message = result["error"] as? String ?? "Automatic bridge recovery failed."
            lastError = message
            lock.unlock()
        }
        return true
    }

    private func autoRecoveryWatchdog(generation: Int) {
        while true {
            Thread.sleep(forTimeInterval: 1)
            lock.lock()
            let isCurrent = recoveryGeneration == generation
            lock.unlock()
            if !isCurrent { return }
            if maybeAutoRecover() { return }
        }
    }

    private func controlField(_ key: String, in event: String) -> String? {
        guard let range = event.range(of: "\(key)=\"") else { return nil }
        let rest = event[range.upperBound...]
        guard let end = rest.firstIndex(of: "\"") else { return nil }
        return String(rest[..<end])
    }

    private func bridgeIndex(for reportedTarget: String, targets: [BridgeTarget]) -> Int? {
        let target = reportedTarget.lowercased()
        let targetFingerprint = target
            .split(separator: "~", maxSplits: 1).first.map(String.init)?
            .trimmingCharacters(in: CharacterSet(charactersIn: "$"))
        for bridge in targets {
            if let fingerprint = bridge.fingerprint, targetFingerprint == fingerprint { return bridge.index }
            if target == bridge.address || target.trimmingCharacters(in: CharacterSet(charactersIn: "[]")) == bridge.address {
                return bridge.index
            }
        }
        return nil
    }

    private func stop(preserveAutoRecovery: Bool = false) {
        lock.lock()
        let process = tor
        stopping = true
        if !preserveAutoRecovery { recoveryGeneration += 1 }
        lock.unlock()
        lock.lock()
        let savedRecoveryBridges = preserveAutoRecovery ? autoRecoveryBridges : []
        let savedRecoveryTried = preserveAutoRecovery ? autoRecoveryTried : []
        let savedRecoveryInProgress = preserveAutoRecovery ? autoRecoveryInProgress : false
        let savedRecoveryAttemptSince = preserveAutoRecovery ? recoveryAttemptSince : nil
        let savedRecoveryStableSince = preserveAutoRecovery ? recoveryStableSince : nil
        lock.unlock()
        if let process, process.isRunning { process.terminate(); process.waitUntilExit() }
        lock.lock(); tor = nil; state = "disconnected"; message = "Tor stopped."; lastError = nil; bridgeTargets = []; currentBridgeIndex = nil; bridgeActivity = nil; builtCircuits = [:]; reconnectSince = nil; autoRecoveryBridges = savedRecoveryBridges; autoRecoveryTried = savedRecoveryTried; autoRecoveryInProgress = savedRecoveryInProgress; recoveryAttemptSince = savedRecoveryAttemptSince; recoveryStableSince = savedRecoveryStableSince; connectedAt = nil; stopping = false; lock.unlock()
    }

    private func executable(named name: String) -> URL? {
        guard let enumerator = FileManager.default.enumerator(at: bundleDirectory, includingPropertiesForKeys: [.isExecutableKey]) else { return nil }
        for case let url as URL in enumerator where url.lastPathComponent == name {
            guard let values = try? url.resourceValues(forKeys: [.isRegularFileKey, .isExecutableKey]),
                  values.isRegularFile == true,
                  values.isExecutable == true else { continue }
            return url
        }
        return nil
    }

    private func safeDiagnostics(from output: String) -> [String] {
        let issueWords = ["[warn]", "[err]", "error", "failed", "unable", "cannot", "could not", "invalid", "fatal", "denied", "already in use", "not loaded", "not found", "not permitted", "unsupported", "killed", "couldn't", "can't"]
        let redactions: [(String, String)] = [
            (#"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b"#, "[address]"),
            (#"\[[0-9A-Fa-f:]+\](?::\d+)?"#, "[address]"),
            (#"\b(?:[0-9A-Fa-f]{1,4}:){2,}[0-9A-Fa-f:]{1,}\b"#, "[address]"),
            (#"\b[A-Fa-f0-9]{40}\b"#, "[fingerprint]"),
            (#"(?i)\b(cert|fingerprint|url|front|ice|utls-imitate)=\S+"#, "$1=[redacted]")
        ]
        return output.components(separatedBy: .newlines).compactMap { rawLine in
            let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
            let lower = line.lowercased()
            guard !line.isEmpty, issueWords.contains(where: { lower.contains($0) }) else { return nil }
            var redacted = line
            for (pattern, replacement) in redactions {
                guard let expression = try? NSRegularExpression(pattern: pattern) else { continue }
                let range = NSRange(redacted.startIndex..<redacted.endIndex, in: redacted)
                redacted = expression.stringByReplacingMatches(in: redacted, range: range, withTemplate: replacement)
            }
            return String(redacted.prefix(240))
        }
    }

    private func bootstrapProgress(from output: String) -> Int? {
        guard let expression = try? NSRegularExpression(pattern: #"Bootstrapped\s+(\d{1,3})%\s+\([^)]*\):"#) else { return nil }
        let range = NSRange(output.startIndex..<output.endIndex, in: output)
        guard let match = expression.firstMatch(in: output, range: range),
              let valueRange = Range(match.range(at: 1), in: output) else { return nil }
        return Int(output[valueRange])
    }
}

func readExact(_ count: Int) -> Data? {
    var data = Data()
    while data.count < count {
        let chunk = FileHandle.standardInput.readData(ofLength: count - data.count)
        if chunk.isEmpty { return nil }
        data.append(chunk)
    }
    return data
}

func writeMessage(_ object: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: object) else { return }
    var length = UInt32(data.count).littleEndian
    let prefix = Data(bytes: &length, count: 4)
    FileHandle.standardOutput.write(prefix + data)
}

let firefoxAddonID = "{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"
let callerArguments = Array(CommandLine.arguments.dropFirst())
let isFirefoxCaller = callerArguments.contains(firefoxAddonID)
let isChromeCaller = callerArguments.contains { argument in
    guard argument.hasPrefix("chrome-extension://"),
          let callerOrigin = URL(string: argument),
          let expectedExtensionID = try? String(contentsOf: extensionIDURL, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines) else { return false }
    return callerOrigin.scheme == "chrome-extension"
        && callerOrigin.host == expectedExtensionID
        && (callerOrigin.path.isEmpty || callerOrigin.path == "/")
}
guard isChromeCaller || isFirefoxCaller else { exit(2) }
let helper = Helper()
while let prefix = readExact(4) {
    let length = prefix.withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
    guard length > 0, length <= 1_048_576, let data = readExact(Int(length)),
          let request = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { break }
    writeMessage(helper.handle(request))
}
_ = helper.handle(["id": 0, "command": "stop"])

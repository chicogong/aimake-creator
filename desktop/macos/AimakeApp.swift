import AppKit
import Darwin
import Foundation
import WebKit

struct LaunchOptions {
    var url: String?
    var cliPath: String?
    var deckPath: String?
    var workspaceDir: String?
    var selfTestJsonPath: String?

    static func parse(_ args: [String]) -> LaunchOptions {
        var opts = LaunchOptions()
        var index = 1
        while index < args.count {
            let arg = args[index]
            switch arg {
            case "--url":
                if index + 1 < args.count {
                    opts.url = args[index + 1]
                    index += 1
                }
            case "--cli":
                if index + 1 < args.count {
                    opts.cliPath = args[index + 1]
                    index += 1
                }
            case "--deck":
                if index + 1 < args.count {
                    opts.deckPath = args[index + 1]
                    index += 1
                }
            case "--workspace":
                if index + 1 < args.count {
                    opts.workspaceDir = args[index + 1]
                    index += 1
                }
            case "--self-test-json":
                if index + 1 < args.count {
                    opts.selfTestJsonPath = args[index + 1]
                    index += 1
                }
            default:
                if arg.hasPrefix("aimake://") {
                    // Direct URL argument fallback
                }
            }
            index += 1
        }
        return opts
    }
}

private func findEphemeralLoopbackPort() -> Int {
    let sock = Darwin.socket(AF_INET, SOCK_STREAM, IPPROTO_TCP)
    guard sock >= 0 else { return 4319 }
    defer { Darwin.close(sock) }

    var reuse: Int32 = 1
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int32>.size))

    var addr = sockaddr_in()
    addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = in_port_t(0).bigEndian
    addr.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))

    let bindResult = withUnsafePointer(to: &addr) { ptr in
        ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
            Darwin.bind(sock, sockPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
    }
    guard bindResult == 0 else { return 4319 }

    var boundAddr = sockaddr_in()
    var len = socklen_t(MemoryLayout<sockaddr_in>.size)
    let nameResult = withUnsafeMutablePointer(to: &boundAddr) { ptr in
        ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
            Darwin.getsockname(sock, sockPtr, &len)
        }
    }
    guard nameResult == 0 else { return 4319 }
    return Int(UInt16(bigEndian: boundAddr.sin_port))
}

private func resolveNodeBinary() -> String {
    let env = ProcessInfo.processInfo.environment
    if let explicit = env["NODE_BINARY"], FileManager.default.isExecutableFile(atPath: explicit) {
        return explicit
    }
    let pathDirs = (env["PATH"] ?? "").split(separator: ":").map(String.init)
    let candidates = pathDirs.map { "\($0)/node" } + [
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
    ]
    for candidate in candidates where FileManager.default.isExecutableFile(atPath: candidate) {
        return candidate
    }
    return "/usr/bin/env"
}

private func slugifyClipTitle(_ raw: String) -> String {
    let lowered = raw.lowercased()
    var out = ""
    var lastHyphen = false
    for scalar in lowered.unicodeScalars {
        if CharacterSet.alphanumerics.contains(scalar) {
            out.unicodeScalars.append(scalar)
            lastHyphen = false
        } else if !lastHyphen && !out.isEmpty {
            out.append("-")
            lastHyphen = true
        }
    }
    let trimmed = out.trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    return trimmed.isEmpty ? "clip" : String(trimmed.prefix(48))
}

private func jsonLiteralString(_ value: String) -> String {
    if let data = try? JSONEncoder().encode(value),
       let encoded = String(data: data, encoding: .utf8) {
        return encoded
    }
    return "\"\""
}

private func jsonObjectLiteral(_ dict: [String: Any]) -> String {
    if JSONSerialization.isValidJSONObject(dict),
       let data = try? JSONSerialization.data(withJSONObject: dict, options: []),
       let encoded = String(data: data, encoding: .utf8) {
        return encoded
    }
    return "{\"ok\":false}"
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler, NSWindowDelegate {
    private let options: LaunchOptions
    private var window: NSWindow!
    private var webView: WKWebView!
    private var statusItem: NSStatusItem?

    private var childProcess: Process?
    private var studioOrigin: String?
    private var hasNavigatedToStudio = false
    private var hasFinishedInitialLoad = false
    private var selfTestStarted = false
    private var pendingDeepLinks: [String] = []
    private var selfTestWatchdog: DispatchWorkItem?
    private var appearanceMode: String = "system"

    private static let defaultWindowTitle = "Aimake Studio · 爱创工坊"
    private static let desktopShellId = "appkit-wkwebview"
    private static let desktopVersion = "2.0.0"

    init(options: LaunchOptions) {
        self.options = options
        super.init()
    }

    var isSelfTestMode: Bool {
        options.selfTestJsonPath != nil
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.appearance = nil
        setupMainMenu()
        setupStatusBarItem()
        setupMainWindowAndWebView()

        if isSelfTestMode {
            scheduleSelfTestWatchdog()
        }

        startTargetSession()
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            dispatchDeepLink(url.absoluteString)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return isSelfTestMode
    }

    func applicationWillTerminate(_ notification: Notification) {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "aimakeNative")
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "aimake")
        terminateStudioChildProcess()
    }

    // MARK: - Menus & Status Bar

    private func setupMainMenu() {
        let mainMenu = NSMenu()

        // 1. Aimake menu
        let appMenuItem = NSMenuItem(title: "Aimake", action: nil, keyEquivalent: "")
        let appMenu = NSMenu(title: "Aimake")
        appMenu.addItem(withTitle: "About Aimake", action: #selector(orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide Aimake", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = appMenu.addItem(
            withTitle: "Hide Others",
            action: #selector(NSApplication.hideOtherApplications(_:)),
            keyEquivalent: "h"
        )
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit Aimake", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // 2. File menu
        let fileMenuItem = NSMenuItem(title: "File", action: nil, keyEquivalent: "")
        let fileMenu = NSMenu(title: "File")
        let quickClipItem = NSMenuItem(title: "Quick Clip to Wiki", action: #selector(triggerQuickClipMenu(_:)), keyEquivalent: "k")
        quickClipItem.keyEquivalentModifierMask = [.command, .shift]
        quickClipItem.target = self
        fileMenu.addItem(quickClipItem)
        let reloadItem = NSMenuItem(title: "Reload Studio", action: #selector(reloadStudioWebView(_:)), keyEquivalent: "r")
        reloadItem.target = self
        fileMenu.addItem(reloadItem)
        fileMenu.addItem(.separator())
        fileMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileMenuItem.submenu = fileMenu
        mainMenu.addItem(fileMenuItem)

        // 3. View menu (2.0 Calm Studio 4-Step Loop: Intake ⌘1, Author ⌘2, Stage ⌘3, Deliver ⌘4)
        let viewMenuItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
        let viewMenu = NSMenu(title: "View")

        let intakeItem = NSMenuItem(title: "Intake (素材摄入)", action: #selector(switchStepIntake(_:)), keyEquivalent: "1")
        intakeItem.keyEquivalentModifierMask = [.command]
        intakeItem.target = self
        viewMenu.addItem(intakeItem)

        let authorItem = NSMenuItem(title: "Author (灵感创作)", action: #selector(switchStepAuthor(_:)), keyEquivalent: "2")
        authorItem.keyEquivalentModifierMask = [.command]
        authorItem.target = self
        viewMenu.addItem(authorItem)

        let stageItem = NSMenuItem(title: "Stage (编排舞台)", action: #selector(switchStepStage(_:)), keyEquivalent: "3")
        stageItem.keyEquivalentModifierMask = [.command]
        stageItem.target = self
        viewMenu.addItem(stageItem)

        let deliverItem = NSMenuItem(title: "Deliver (导出交付)", action: #selector(switchStepDeliver(_:)), keyEquivalent: "4")
        deliverItem.keyEquivalentModifierMask = [.command]
        deliverItem.target = self
        viewMenu.addItem(deliverItem)

        viewMenu.addItem(.separator())
        let fullScreenItem = NSMenuItem(
            title: "Toggle Full Screen",
            action: #selector(NSWindow.toggleFullScreen(_:)),
            keyEquivalent: "f"
        )
        fullScreenItem.keyEquivalentModifierMask = [.command, .control]
        viewMenu.addItem(fullScreenItem)

        viewMenuItem.submenu = viewMenu
        mainMenu.addItem(viewMenuItem)

        // 4. Export menu
        let exportMenuItem = NSMenuItem(title: "Export", action: nil, keyEquivalent: "")
        let exportMenu = NSMenu(title: "Export")
        let exportFormats: [(String, String, Selector)] = [
            ("Export Retina PNG", "P", #selector(exportPNG(_:))),
            ("Export Vector PDF", "D", #selector(exportPDF(_:))),
            ("Export Editable PPTX", "X", #selector(exportPPTX(_:))),
            ("Export 60fps MP4", "M", #selector(exportMP4(_:))),
            ("Export CapCut Draft", "J", #selector(exportCapCut(_:))),
            ("Copy WeChat Inline HTML", "C", #selector(exportWeChat(_:))),
        ]
        for (title, key, sel) in exportFormats {
            let item = NSMenuItem(title: title, action: sel, keyEquivalent: key.lowercased())
            item.keyEquivalentModifierMask = [.command, .shift]
            item.target = self
            exportMenu.addItem(item)
        }
        exportMenuItem.submenu = exportMenu
        mainMenu.addItem(exportMenuItem)

        NSApp.mainMenu = mainMenu
    }

    private func setupStatusBarItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = item.button {
            if let iconUrl = Bundle.main.url(forResource: "TrayIcon", withExtension: "png"),
               let img = NSImage(contentsOf: iconUrl) {
                img.size = NSSize(width: 18, height: 18)
                img.isTemplate = true
                button.image = img
                button.imagePosition = .imageOnly
                button.title = ""
            } else if let altIconUrl = Bundle.main.url(forResource: "TrayIcon@2x", withExtension: "png"),
                      let img = NSImage(contentsOf: altIconUrl) {
                img.size = NSSize(width: 18, height: 18)
                img.isTemplate = true
                button.image = img
                button.imagePosition = .imageOnly
                button.title = ""
            } else {
                button.title = "✦ Aimake"
                button.font = NSFont.systemFont(ofSize: 13, weight: .semibold)
            }
            button.toolTip = "Aimake Studio · 爱创工坊"
        }

        let trayMenu = NSMenu(title: "Aimake Studio")
        let headerItem = NSMenuItem(title: "Aimake Studio · 爱创工坊", action: nil, keyEquivalent: "")
        headerItem.isEnabled = false
        trayMenu.addItem(headerItem)
        trayMenu.addItem(.separator())

        let showWindow = NSMenuItem(title: "打开工作台 (Show Studio)", action: #selector(showMainWindow(_:)), keyEquivalent: "o")
        showWindow.target = self
        trayMenu.addItem(showWindow)

        let trendRadar = NSMenuItem(title: "灵感雷达 (Trend Radar)", action: #selector(triggerTrendRadarMenu(_:)), keyEquivalent: "r")
        trendRadar.target = self
        trayMenu.addItem(trendRadar)

        let quickClip = NSMenuItem(title: "快速剪辑 (Quick Clip)", action: #selector(triggerQuickClipMenu(_:)), keyEquivalent: "")
        quickClip.target = self
        trayMenu.addItem(quickClip)

        trayMenu.addItem(.separator())

        let quitItem = NSMenuItem(title: "退出 Aimake Studio", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        trayMenu.addItem(quitItem)

        item.menu = trayMenu
        self.statusItem = item
    }

    // MARK: - Window & WKWebView

    private func setupMainWindowAndWebView() {
        let contentController = WKUserContentController()
        let bootstrapJS = """
        (function() {
          window.__AIMAKE_DESKTOP__ = {
            platform: "macos",
            shell: "\(Self.desktopShellId)",
            version: "\(Self.desktopVersion)"
          };
          window.__aimakePendingReplies = window.__aimakePendingReplies || new Map();
          window.__aimakeLastReply = null;
          if (typeof window.__aimakeNativeReply !== "function") {
            window.__aimakeNativeReply = function(id, payload) {
              window.__aimakeLastReply = { id: id, payload: payload };
              if (window.__aimakePendingReplies && window.__aimakePendingReplies.has(id)) {
                var resolve = window.__aimakePendingReplies.get(id);
                window.__aimakePendingReplies.delete(id);
                resolve(payload);
              }
              window.dispatchEvent(new CustomEvent("aimake:native-reply", {
                detail: { id: id, payload: payload }
              }));
            };
          }
          window.__aimakeInvokeNative = function(action, payload) {
            var reqId = "native_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            return new Promise(function(resolve) {
              window.__aimakePendingReplies.set(reqId, resolve);
              window.webkit.messageHandlers.aimakeNative.postMessage({
                id: reqId,
                action: action,
                payload: payload || {}
              });
            });
          };
        })();
        """
        let userScript = WKUserScript(
            source: bootstrapJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(userScript)
        contentController.add(self, name: "aimakeNative")
        contentController.add(self, name: "aimake")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let initialRect = NSRect(x: 0, y: 0, width: 1440, height: 920)
        let webView = WKWebView(frame: initialRect, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        let styleMask: NSWindow.StyleMask = [.titled, .closable, .miniaturizable, .resizable]
        let win = NSWindow(
            contentRect: initialRect,
            styleMask: styleMask,
            backing: .buffered,
            defer: false
        )
        win.title = Self.defaultWindowTitle
        win.appearance = nil
        win.backgroundColor = NSColor.windowBackgroundColor
        win.titlebarAppearsTransparent = true
        win.contentMinSize = NSSize(width: 1080, height: 720)
        win.minSize = NSSize(width: 1080, height: 720)
        win.setContentSize(NSSize(width: 1440, height: 920))
        win.contentView = webView
        win.delegate = self
        win.center()

        self.webView = webView
        self.window = win

        if isSelfTestMode {
            win.orderFrontRegardless()
        } else {
            win.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    // MARK: - Studio Target Connection / Child Process Lifecycle

    private func startTargetSession() {
        if let rawUrl = options.url, let parsed = URL(string: rawUrl) {
            setStudioOrigin(from: parsed)
            hasNavigatedToStudio = true
            webView.load(URLRequest(url: parsed))
            return
        }

        if let resolvedCli = resolveCliAndDeck() {
            spawnStudioProcess(
                cliPath: resolvedCli.cliPath,
                deckPath: resolvedCli.deckPath,
                workspaceDir: resolvedCli.workspaceDir,
                includeWorkspaceFlag: resolvedCli.workspaceDir != nil,
                includeNoOpenFlag: true
            )
            return
        }

        // Offline welcome fallback if launched directly with neither --url nor discoverable dist/cli.js
        let fallbackHtml = """
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Aimake Studio · 爱创工坊</title>
          <style>
            :root {
              --bg: #0B0D12;
              --card: rgba(23, 27, 36, 0.88);
              --border: rgba(255, 255, 255, 0.08);
              --fg: #F4F8FF;
              --muted: #8E9BAE;
              --accent: #6951FF;
              --accent-glow: rgba(105, 81, 255, 0.25);
            }
            body {
              margin: 0;
              height: 100vh;
              display: grid;
              place-items: center;
              background: var(--bg);
              background-image:
                radial-gradient(circle at 50% 25%, rgba(105, 81, 255, 0.14) 0%, transparent 60%),
                linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
              background-size: 100% 100%, 32px 32px, 32px 32px;
              color: var(--fg);
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
              user-select: none;
              -webkit-user-select: none;
            }
            .atelier-card {
              max-width: 580px;
              padding: 40px;
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 20px;
              backdrop-filter: blur(24px);
              -webkit-backdrop-filter: blur(24px);
              box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06);
              text-align: center;
            }
            .logo-badge {
              width: 64px;
              height: 64px;
              margin: 0 auto 20px;
              background: rgba(105, 81, 255, 0.1);
              border: 1px solid rgba(105, 81, 255, 0.25);
              border-radius: 16px;
              display: grid;
              place-items: center;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .badge {
              display: inline-block;
              padding: 3px 10px;
              background: rgba(105, 81, 255, 0.15);
              border: 1px solid rgba(105, 81, 255, 0.3);
              border-radius: 999px;
              color: #B7AAFF;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            p {
              margin: 0 0 24px;
              color: var(--muted);
              line-height: 1.6;
              font-size: 14px;
            }
            .action-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 24px;
            }
            .btn {
              padding: 12px 16px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid var(--border);
              border-radius: 10px;
              color: var(--fg);
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            .btn:hover {
              background: rgba(255, 255, 255, 0.1);
              border-color: rgba(255, 255, 255, 0.2);
              transform: translateY(-1px);
            }
            .btn-primary {
              background: var(--accent);
              border-color: var(--accent);
              color: #FFFFFF;
              box-shadow: 0 4px 14px var(--accent-glow);
            }
            .btn-primary:hover {
              background: #7A65FF;
              border-color: #7A65FF;
            }
            .status-note {
              font-size: 12px;
              color: var(--muted);
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #10B981;
              box-shadow: 0 0 8px #10B981;
            }
          </style>
        </head>
        <body>
          <div class="atelier-card">
            <div class="logo-badge">
              <svg width="36" height="36" viewBox="0 0 512 512" fill="none">
                <path fill="#6951FF" d="M117 121 L258 79 Q293 69 286 103 L231 370 Q226 394 205 394 H117 Q93 394 93 370 V148 Q93 130 117 121 Z"/>
                <rect fill="#FFCB49" x="304" y="98" width="156" height="156" rx="28"/>
                <path fill="#B7AAFF" d="M292 273 H346 Q364 273 360 296 L345 379 Q342 395 321 395 H276 Q258 395 263 377 L281 295 Q285 273 292 273 Z"/>
                <path fill="#FF6B74" d="M460 282 V368 Q460 395 432 395 H361 Q358 395 359 384 C367 316 399 286 448 282 Z"/>
              </svg>
            </div>
            <div class="badge">Aimake Studio v2.0</div>
            <h1>Aimake Studio · 爱创工坊</h1>
            <p>本地优先 · 参数化多模态创作工坊 · 36 套设计系统与 Karpathy LLM Wiki</p>
            <div class="action-grid">
              <button class="btn btn-primary" onclick="window.__aimakeInvokeNative && window.__aimakeInvokeNative('pickFolder', {})">
                <span>📂 打开工作区目录</span>
              </button>
              <button class="btn" onclick="location.reload()">
                <span>⚡ 重新连接引擎</span>
              </button>
            </div>
            <div class="status-note">
              <span class="status-dot"></span>
              <span>本地创作内核就绪 · 零云端隐私上传</span>
            </div>
          </div>
        </body>
        </html>
        """
        hasNavigatedToStudio = true
        webView.loadHTMLString(fallbackHtml, baseURL: URL(string: "http://127.0.0.1/"))
    }

    private func resolveCliAndDeck() -> (cliPath: String, deckPath: String, workspaceDir: String?)? {
        let fm = FileManager.default
        let cwd = fm.currentDirectoryPath

        var candidateCli = options.cliPath
        if candidateCli == nil {
            let resourceCli = Bundle.main.resourceURL?.appendingPathComponent("dist/cli.js").path
            let bundleParent = Bundle.main.bundleURL
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .path
            let guesses = [
                resourceCli,
                "\(cwd)/dist/cli.js",
                "\(bundleParent)/dist/cli.js",
                "/usr/local/bin/aimake",
                "/opt/homebrew/bin/aimake",
            ].compactMap { $0 }
            candidateCli = guesses.first { fm.fileExists(atPath: $0) }
        }
        guard let cli = candidateCli else { return nil }
        let absCli = cli.hasPrefix("/") ? cli : URL(fileURLWithPath: cwd).appendingPathComponent(cli).standardized.path
        guard fm.fileExists(atPath: absCli) else { return nil }

        let workspace = options.workspaceDir.map { raw in
            raw.hasPrefix("/") ? raw : URL(fileURLWithPath: cwd).appendingPathComponent(raw).standardized.path
        }

        var candidateDeck = options.deckPath
        if candidateDeck == nil {
            let resourceDeck = Bundle.main.resourceURL?.appendingPathComponent("examples/zh-creator-flywheel.deck.md").path
            let repoGuess = URL(fileURLWithPath: absCli)
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .path
            let deckGuesses = [
                workspace.map { "\($0)/deck.deck.md" },
                resourceDeck,
                "\(cwd)/examples/zh-creator-flywheel.deck.md",
                "\(repoGuess)/examples/zh-creator-flywheel.deck.md",
            ].compactMap { $0 }
            candidateDeck = deckGuesses.first { fm.fileExists(atPath: $0) }
        }
        guard let deck = candidateDeck else { return nil }
        let absDeck = deck.hasPrefix("/") ? deck : URL(fileURLWithPath: cwd).appendingPathComponent(deck).standardized.path

        var effectiveWorkspace = workspace
        if effectiveWorkspace == nil {
            if absDeck.contains(".app/Contents/Resources") {
                let userDocs = URL(fileURLWithPath: NSHomeDirectory())
                    .appendingPathComponent("Documents")
                    .appendingPathComponent("Aimake")
                try? FileManager.default.createDirectory(at: userDocs, withIntermediateDirectories: true)
                effectiveWorkspace = userDocs.path
            }
        }
        return (absCli, absDeck, effectiveWorkspace)
    }

    private func spawnStudioProcess(
        cliPath: String,
        deckPath: String,
        workspaceDir: String?,
        includeWorkspaceFlag: Bool,
        includeNoOpenFlag: Bool
    ) {
        terminateStudioChildProcess()
        let port = findEphemeralLoopbackPort()
        let nodeBin = resolveNodeBinary()

        let proc = Process()
        var args: [String] = []
        if nodeBin == "/usr/bin/env" {
            proc.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            args.append("node")
        } else {
            proc.executableURL = URL(fileURLWithPath: nodeBin)
        }

        args.append(contentsOf: [cliPath, "studio", deckPath, "--port", String(port)])
        if includeWorkspaceFlag, let ws = workspaceDir {
            args.append(contentsOf: ["--workspace", ws])
        }
        if includeNoOpenFlag {
            args.append("--no-open")
        }
        proc.arguments = args

        var env = ProcessInfo.processInfo.environment
        if let ws = workspaceDir {
            env["AIMAKE_WORKSPACE"] = ws
            proc.currentDirectoryURL = URL(fileURLWithPath: ws)
        }
        proc.environment = env

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        proc.standardOutput = stdoutPipe
        proc.standardError = stderrPipe

        final class OutputAccumulator: @unchecked Sendable {
            let lock = NSLock()
            var stdout = ""
            var stderr = ""
            var matchedUrl: String?
        }
        let acc = OutputAccumulator()

        stdoutPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            guard !data.isEmpty, let chunk = String(data: data, encoding: .utf8) else { return }
            var discovered: String?
            acc.lock.lock()
            acc.stdout += chunk
            if acc.matchedUrl == nil, let found = Self.extractStudioUrl(from: acc.stdout) {
                acc.matchedUrl = found
                discovered = found
            }
            acc.lock.unlock()

            if let urlStr = discovered {
                DispatchQueue.main.async {
                    self?.connectToSpawnedStudio(urlStr)
                }
            }
        }

        stderrPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            guard !data.isEmpty, let chunk = String(data: data, encoding: .utf8) else { return }
            acc.lock.lock()
            acc.stderr += chunk
            acc.lock.unlock()
        }

        proc.terminationHandler = { [weak self] finished in
            stdoutPipe.fileHandleForReading.readabilityHandler = nil
            stderrPipe.fileHandleForReading.readabilityHandler = nil
            acc.lock.lock()
            let errText = acc.stderr
            let alreadyConnected = acc.matchedUrl != nil
            acc.lock.unlock()

            if !alreadyConnected && finished.terminationStatus != 0 && errText.contains("unknown option") {
                DispatchQueue.main.async {
                    guard let self else { return }
                    if includeWorkspaceFlag {
                        self.spawnStudioProcess(
                            cliPath: cliPath,
                            deckPath: deckPath,
                            workspaceDir: workspaceDir,
                            includeWorkspaceFlag: false,
                            includeNoOpenFlag: includeNoOpenFlag
                        )
                    } else if includeNoOpenFlag {
                        self.spawnStudioProcess(
                            cliPath: cliPath,
                            deckPath: deckPath,
                            workspaceDir: workspaceDir,
                            includeWorkspaceFlag: false,
                            includeNoOpenFlag: false
                        )
                    } else if self.isSelfTestMode {
                        self.failSelfTest(reason: "Studio CLI exited with status \(finished.terminationStatus): \(errText)")
                    }
                }
            } else if !alreadyConnected && finished.terminationStatus != 0 {
                DispatchQueue.main.async {
                    if let self, self.isSelfTestMode {
                        self.failSelfTest(reason: "Studio CLI exited before ready (\(finished.terminationStatus)): \(errText)")
                    }
                }
            }
        }

        do {
            try proc.run()
            self.childProcess = proc
        } catch {
            if isSelfTestMode {
                failSelfTest(reason: "Failed to spawn Studio CLI: \(error.localizedDescription)")
            }
        }
    }

    nonisolated private static func extractStudioUrl(from output: String) -> String? {
        let patterns = [
            #"Aimake Studio (?:running at|listening on)\s+(https?://127\.0\.0\.1:\d+[^\s]*)"#,
            #"(https?://127\.0\.0\.1:\d+[^\s]*)"#,
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: output, range: NSRange(output.startIndex..., in: output)),
               match.numberOfRanges > 1,
               let range = Range(match.range(at: 1), in: output) {
                return String(output[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        return nil
    }

    private func connectToSpawnedStudio(_ urlString: String) {
        guard !hasNavigatedToStudio, let parsed = URL(string: urlString) else { return }
        setStudioOrigin(from: parsed)
        hasNavigatedToStudio = true
        webView.load(URLRequest(url: parsed))
    }

    private func setStudioOrigin(from url: URL) {
        if let scheme = url.scheme, let host = url.host {
            if let port = url.port {
                studioOrigin = "\(scheme)://\(host):\(port)"
            } else {
                studioOrigin = "\(scheme)://\(host)"
            }
        }
    }

    private func terminateStudioChildProcess() {
        guard let proc = childProcess else { return }
        childProcess = nil
        if proc.isRunning {
            proc.terminate()
            let deadline = Date().addingTimeInterval(1.5)
            while proc.isRunning && Date() < deadline {
                RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
            }
            if proc.isRunning {
                Darwin.kill(proc.processIdentifier, SIGKILL)
            }
        }
    }

    // MARK: - Menu & Status Item Actions

    @objc private func orderFrontStandardAboutPanel(_ sender: Any?) {
        NSApp.orderFrontStandardAboutPanel(sender)
    }

    @objc private func showMainWindow(_ sender: Any?) {
        window.makeKeyAndOrderFront(sender)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc private func reloadStudioWebView(_ sender: Any?) {
        webView.reload()
    }

    @objc private func triggerQuickClipMenu(_ sender: Any?) {
        if !isSelfTestMode {
            showMainWindow(sender)
        }
        dispatchDeepLink("aimake://action/quick-clip")
    }

    @objc private func triggerTrendRadarMenu(_ sender: Any?) {
        if !isSelfTestMode {
            showMainWindow(sender)
        }
        dispatchDeepLink("aimake://pane/radar")
    }

    @objc private func switchStepIntake(_ sender: Any?) {
        dispatchDeepLink("aimake://step/intake")
    }

    @objc private func switchStepAuthor(_ sender: Any?) {
        dispatchDeepLink("aimake://step/author")
    }

    @objc private func switchStepStage(_ sender: Any?) {
        dispatchDeepLink("aimake://step/stage")
    }

    @objc private func switchStepDeliver(_ sender: Any?) {
        dispatchDeepLink("aimake://step/deliver")
    }

    @objc private func switchPaneWiki(_ sender: Any?) {
        dispatchDeepLink("aimake://pane/wiki")
    }

    @objc private func switchPaneCanvas(_ sender: Any?) {
        dispatchDeepLink("aimake://pane/canvas")
    }

    @objc private func switchPaneMedia(_ sender: Any?) {
        dispatchDeepLink("aimake://pane/media")
    }

    @objc private func switchPaneAI(_ sender: Any?) {
        dispatchDeepLink("aimake://pane/ai")
    }

    @objc private func exportPNG(_ sender: Any?) {
        dispatchDeepLink("aimake://export/png")
    }

    @objc private func exportPDF(_ sender: Any?) {
        dispatchDeepLink("aimake://export/pdf")
    }

    @objc private func exportPPTX(_ sender: Any?) {
        dispatchDeepLink("aimake://export/pptx")
    }

    @objc private func exportMP4(_ sender: Any?) {
        dispatchDeepLink("aimake://export/mp4")
    }

    @objc private func exportCapCut(_ sender: Any?) {
        dispatchDeepLink("aimake://export/capcut")
    }

    @objc private func exportWeChat(_ sender: Any?) {
        dispatchDeepLink("aimake://export/wechat")
    }

    // MARK: - Deep Link Forwarding

    private func dispatchDeepLink(_ urlString: String) {
        guard hasFinishedInitialLoad else {
            pendingDeepLinks.append(urlString)
            return
        }
        let encodedUrl = jsonLiteralString(urlString)
        let js = """
        (function(u) {
          window.__aimakeLastDeepLink = u;
          if (typeof window.__aimakeHandleDeepLink === "function") {
            try { window.__aimakeHandleDeepLink(u); } catch (e) {}
          }
          window.dispatchEvent(new CustomEvent("aimake:deeplink", { detail: { url: u } }));
        })(\(encodedUrl));
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    // MARK: - WKScriptMessageHandler ("aimakeNative" & "aimake")

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "aimakeNative" || message.name == "aimake" else { return }

        let parsedDict: [String: Any]
        if let dict = message.body as? [String: Any] {
            parsedDict = dict
        } else if let str = message.body as? String,
                  let data = str.data(using: .utf8),
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            parsedDict = obj
        } else {
            return
        }

        let requestId = String(describing: parsedDict["id"] ?? "")
        let action = (parsedDict["action"] as? String) ?? ""
        let payload = (parsedDict["payload"] as? [String: Any]) ?? [:]

        switch action {
        case "ping":
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "pong": true,
                "platform": "macos",
                "shell": Self.desktopShellId,
                "version": Self.desktopVersion,
            ])

        case "getNativeState":
            let menuCount = NSApp.mainMenu?.items.count ?? 0
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "platform": "macos",
                "shell": Self.desktopShellId,
                "version": Self.desktopVersion,
                "hasStatusItem": statusItem != nil,
                "menuCount": menuCount,
                "windowTitle": window.title,
                "appearance": appearanceMode,
            ])

        case "setWindowTitle":
            let nextTitle = (payload["title"] as? String)
                ?? (parsedDict["payload"] as? String)
                ?? ""
            if !nextTitle.isEmpty {
                window.title = nextTitle
            }
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "title": window.title,
            ])

        case "setAppearance":
            let mode = ((payload["mode"] as? String)
                ?? (parsedDict["payload"] as? String)
                ?? "system")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .lowercased()
            handleSetAppearance(requestId: requestId, mode: mode)

        case "pickFolder":
            let title = payload["title"] as? String
            let prompt = payload["prompt"] as? String
            let defaultPath = payload["defaultPath"] as? String
            handlePickFolder(requestId: requestId, title: title, prompt: prompt, defaultPath: defaultPath)

        case "pickFile":
            let title = payload["title"] as? String
            let prompt = payload["prompt"] as? String
            let defaultPath = payload["defaultPath"] as? String
            handlePickFile(requestId: requestId, title: title, prompt: prompt, defaultPath: defaultPath)

        case "launchAgent":
            let workspaceDir = (payload["workspaceDir"] as? String) ?? ""
            let host = (payload["host"] as? String) ?? ""
            let command = payload["command"] as? String
            let terminal = payload["terminal"] as? String
            let prompt = payload["prompt"] as? String
            handleLaunchAgent(
                requestId: requestId,
                workspaceDir: workspaceDir,
                host: host,
                command: command,
                terminal: terminal,
                prompt: prompt
            )

        case "openPath":
            let targetPath = (payload["path"] as? String)
                ?? (parsedDict["payload"] as? String)
                ?? ""
            var opened = false
            if !isSelfTestMode && !targetPath.isEmpty {
                let absPath = URL(fileURLWithPath: targetPath).standardized.path
                if FileManager.default.fileExists(atPath: absPath) {
                    opened = NSWorkspace.shared.open(URL(fileURLWithPath: absPath))
                }
            }
            replyToWeb(id: requestId, payload: [
                "ok": isSelfTestMode || opened,
                "path": targetPath,
                "skippedInSelfTest": isSelfTestMode,
            ])

        case "revealInFinder":
            let targetPath = (payload["path"] as? String)
                ?? (parsedDict["payload"] as? String)
                ?? ""
            if !isSelfTestMode && !targetPath.isEmpty {
                NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: targetPath)])
            }
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "path": targetPath,
                "skippedInSelfTest": isSelfTestMode,
            ])

        case "notify":
            let title = (payload["title"] as? String) ?? "Aimake"
            let body = (payload["body"] as? String) ?? (payload["message"] as? String) ?? ""
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "title": title,
                "body": body,
                "skippedInSelfTest": isSelfTestMode,
            ])

        case "exportComplete":
            let format = (payload["format"] as? String) ?? ""
            let outputPath = (payload["path"] as? String) ?? ""
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "format": format,
                "path": outputPath,
            ])

        case "quickClipText":
            let clipTitle = (payload["title"] as? String) ?? "Quick Clip"
            let clipContent = (payload["content"] as? String)
                ?? (payload["text"] as? String)
                ?? ""
            handleQuickClipText(requestId: requestId, title: clipTitle, content: clipContent)

        default:
            replyToWeb(id: requestId, payload: [
                "ok": false,
                "error": "Unknown aimakeNative action: \(action)",
            ])
        }
    }

    private func handleSetAppearance(requestId: String, mode: String) {
        switch mode {
        case "system":
            NSApp.appearance = nil
            window.appearance = nil
            appearanceMode = "system"
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "mode": "system",
            ])
        case "light":
            let light = NSAppearance(named: .aqua)
            NSApp.appearance = light
            window.appearance = light
            appearanceMode = "light"
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "mode": "light",
            ])
        case "dark":
            let dark = NSAppearance(named: .darkAqua)
            NSApp.appearance = dark
            window.appearance = dark
            appearanceMode = "dark"
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "mode": "dark",
            ])
        default:
            replyToWeb(id: requestId, payload: [
                "ok": false,
                "error": "Unsupported appearance mode: \(mode). Expected system, light, or dark.",
            ])
        }
    }

    private func handlePickFolder(requestId: String, title: String?, prompt: String?, defaultPath: String?) {
        if isSelfTestMode {
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "cancelled": true,
                "skippedInSelfTest": true,
            ])
            return
        }

        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.canCreateDirectories = true
        panel.allowsMultipleSelection = false
        panel.title = title ?? "选择工作区文件夹"
        panel.prompt = prompt ?? "选择"
        if let defaultPath, !defaultPath.isEmpty {
            var isDir: ObjCBool = false
            if FileManager.default.fileExists(atPath: defaultPath, isDirectory: &isDir), isDir.boolValue {
                panel.directoryURL = URL(fileURLWithPath: defaultPath, isDirectory: true)
            }
        }

        panel.beginSheetModal(for: window) { [weak self] response in
            guard let self else { return }
            if response == .OK, let url = panel.url {
                self.replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "cancelled": false,
                    "path": url.path,
                ])
                let pathLiteral = jsonLiteralString(url.path)
                let pickedFolderJs = """
                if (typeof window.__aimakePickedFolder === "function") {
                  window.__aimakePickedFolder(\(pathLiteral));
                }
                """
                self.webView.evaluateJavaScript(pickedFolderJs, completionHandler: nil)
            } else {
                self.replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "cancelled": true,
                ])
            }
        }
    }

    private func handlePickFile(requestId: String, title: String?, prompt: String?, defaultPath: String?) {
        if isSelfTestMode {
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "cancelled": true,
                "skippedInSelfTest": true,
            ])
            return
        }

        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.canCreateDirectories = false
        panel.allowsMultipleSelection = false
        panel.title = title ?? "选择文件"
        panel.prompt = prompt ?? "打开"
        if let defaultPath, !defaultPath.isEmpty {
            var isDir: ObjCBool = false
            if FileManager.default.fileExists(atPath: defaultPath, isDirectory: &isDir), isDir.boolValue {
                panel.directoryURL = URL(fileURLWithPath: defaultPath, isDirectory: true)
            }
        }

        panel.beginSheetModal(for: window) { [weak self] response in
            guard let self else { return }
            if response == .OK, let url = panel.url {
                self.replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "cancelled": false,
                    "path": url.path,
                ])
            } else {
                self.replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "cancelled": true,
                ])
            }
        }
    }

    private static func shellSingleQuote(_ value: String) -> String {
        "'" + value.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }

    private static func appleScriptEscape(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
    }

    private func runProcess(executable: String, arguments: [String], wait: Bool = true) -> Bool {
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: executable)
        proc.arguments = arguments
        do {
            try proc.run()
            if wait {
                proc.waitUntilExit()
                return proc.terminationStatus == 0
            }
            return true
        } catch {
            return false
        }
    }

    private func runOpenApplication(appName: String, targetDir: String) -> Bool {
        runProcess(executable: "/usr/bin/open", arguments: ["-a", appName, targetDir], wait: true)
    }

    private func copyTextToPasteboard(_ text: String) -> Bool {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        return pasteboard.setString(text, forType: .string)
    }

    private func runAppleScript(_ scriptSource: String) -> Bool {
        var errInfo: NSDictionary?
        guard let script = NSAppleScript(source: scriptSource) else {
            return false
        }
        _ = script.executeAndReturnError(&errInfo)
        return errInfo == nil
    }

    private func launchInTerminal(
        terminalId: String,
        workspaceDir: String,
        cliCommand: String?
    ) -> (launched: Bool, appName: String, terminalUsed: String) {
        let fm = FileManager.default
        let shellLine = cliCommand.map { "cd \(Self.shellSingleQuote(workspaceDir)) && \($0)" }
        let interactiveShell = shellLine.map { "\($0); exec /bin/zsh -l" }

        switch terminalId {
        case "ghostty":
            let appPath = "/Applications/Ghostty.app"
            if fm.fileExists(atPath: appPath) {
                if let interactive = interactiveShell {
                    let ok = runProcess(
                        executable: "/usr/bin/open",
                        arguments: [
                            "-na", appPath,
                            "--args",
                            "--working-directory=\(workspaceDir)",
                            "-e", "/bin/zsh", "-lc", interactive,
                        ],
                        wait: true
                    )
                    if ok {
                        return (true, "Ghostty", "ghostty")
                    }
                }
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "Ghostty", "ghostty")
                }
            }

        case "warp":
            let appPath = "/Applications/Warp.app"
            if fm.fileExists(atPath: appPath) {
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "Warp", "warp")
                }
            }

        case "iterm":
            let appPath = "/Applications/iTerm.app"
            if fm.fileExists(atPath: appPath) {
                if let line = shellLine {
                    let script = """
                    tell application "iTerm"
                        activate
                        create window with default profile command "\(Self.appleScriptEscape(line))"
                    end tell
                    """
                    if runAppleScript(script) {
                        return (true, "iTerm2", "iterm")
                    }
                }
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "iTerm2", "iterm")
                }
            }

        case "cmux":
            let appPath = "/Applications/cmux.app"
            if fm.fileExists(atPath: appPath) {
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "cmux", "cmux")
                }
            }

        case "wezterm":
            let appPath = "/Applications/WezTerm.app"
            if fm.fileExists(atPath: appPath) {
                let cliBin = "\(appPath)/Contents/MacOS/wezterm"
                if let interactive = interactiveShell, fm.isExecutableFile(atPath: cliBin) {
                    if runProcess(
                        executable: cliBin,
                        arguments: ["start", "--cwd", workspaceDir, "--", "/bin/zsh", "-lc", interactive],
                        wait: false
                    ) {
                        return (true, "WezTerm", "wezterm")
                    }
                }
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "WezTerm", "wezterm")
                }
            }

        case "kitty":
            let appPath = "/Applications/kitty.app"
            if fm.fileExists(atPath: appPath) {
                if let interactive = interactiveShell {
                    let ok = runProcess(
                        executable: "/usr/bin/open",
                        arguments: [
                            "-na", appPath,
                            "--args",
                            "--directory", workspaceDir,
                            "/bin/zsh", "-lc", interactive,
                        ],
                        wait: true
                    )
                    if ok {
                        return (true, "kitty", "kitty")
                    }
                }
                if runOpenApplication(appName: appPath, targetDir: workspaceDir) {
                    return (true, "kitty", "kitty")
                }
            }

        default:
            break
        }

        // Default or fallback: macOS Terminal.app
        if let line = shellLine {
            let scriptSource = """
            tell application "Terminal"
                activate
                do script "\(Self.appleScriptEscape(line))"
            end tell
            """
            if runAppleScript(scriptSource) {
                return (true, "Terminal", "terminal")
            }
        }
        let fallbackOpened = runOpenApplication(appName: "Terminal", targetDir: workspaceDir)
        return (fallbackOpened, "Terminal", "terminal")
    }

    private func handleLaunchAgent(
        requestId: String,
        workspaceDir: String,
        host: String,
        command: String?,
        terminal: String?,
        prompt: String?
    ) {
        let trimmedDir = workspaceDir.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedDir.isEmpty, !trimmedDir.contains("\0") else {
            replyToWeb(id: requestId, payload: [
                "ok": false,
                "error": "workspaceDir must be a non-empty local directory path",
            ])
            return
        }

        let absDir = URL(fileURLWithPath: trimmedDir).standardized.path
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: absDir, isDirectory: &isDir), isDir.boolValue else {
            replyToWeb(id: requestId, payload: [
                "ok": false,
                "error": "workspaceDir does not exist or is not a directory: \(absDir)",
            ])
            return
        }

        let normalizedHost = host.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let allowedCliCommands: Set<String> = ["opencode", "claude", "codex"]
        let allowedTerminals: Set<String> = ["ghostty", "warp", "iterm", "cmux", "wezterm", "kitty", "terminal"]

        var normalizedCommand: String?
        if let rawCmd = command?.trimmingCharacters(in: .whitespacesAndNewlines), !rawCmd.isEmpty {
            let loweredCmd = rawCmd.lowercased()
            guard allowedCliCommands.contains(loweredCmd) else {
                replyToWeb(id: requestId, payload: [
                    "ok": false,
                    "error": "Unsupported agent command: \(rawCmd)",
                ])
                return
            }
            normalizedCommand = loweredCmd
        }

        var normalizedTerminal = "terminal"
        if let rawTerminal = terminal?.trimmingCharacters(in: .whitespacesAndNewlines), !rawTerminal.isEmpty {
            let loweredTerminal = rawTerminal.lowercased()
            guard allowedTerminals.contains(loweredTerminal) else {
                replyToWeb(id: requestId, payload: [
                    "ok": false,
                    "error": "Unsupported terminal app: \(rawTerminal)",
                ])
                return
            }
            normalizedTerminal = loweredTerminal
        }

        let trimmedPrompt = prompt?.trimmingCharacters(in: .whitespacesAndNewlines)

        enum LaunchTarget {
            case guiApp(String)
            case terminal(cliCommand: String?)
        }

        let target: LaunchTarget
        switch normalizedHost {
        case "antigravity", "agy":
            target = .guiApp("Antigravity")
        case "workbuddy":
            target = .guiApp("WorkBuddy")
        case "cursor":
            target = .guiApp("Cursor")
        case "claude-desktop":
            target = .guiApp("Claude")
        case "opencode":
            target = .terminal(cliCommand: normalizedCommand ?? "opencode")
        case "claude", "claude-code":
            target = .terminal(cliCommand: normalizedCommand ?? "claude")
        case "codex":
            target = .terminal(cliCommand: normalizedCommand ?? "codex")
        case "terminal":
            target = .terminal(cliCommand: normalizedCommand)
        default:
            replyToWeb(id: requestId, payload: [
                "ok": false,
                "error": "Unsupported agent host: \(host)",
            ])
            return
        }

        if isSelfTestMode {
            replyToWeb(id: requestId, payload: [
                "ok": true,
                "host": normalizedHost,
                "terminal": normalizedTerminal,
                "workspaceDir": absDir,
                "copiedPrompt": false,
                "skippedInSelfTest": true,
            ])
            return
        }

        var copiedPrompt = false
        if let promptText = trimmedPrompt, !promptText.isEmpty {
            copiedPrompt = copyTextToPasteboard(promptText)
        }

        switch target {
        case .guiApp(let appName):
            let launched = runOpenApplication(appName: appName, targetDir: absDir)
            if launched {
                replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "host": normalizedHost,
                    "app": appName,
                    "workspaceDir": absDir,
                    "copiedPrompt": copiedPrompt,
                ])
            } else {
                replyToWeb(id: requestId, payload: [
                    "ok": false,
                    "host": normalizedHost,
                    "app": appName,
                    "copiedPrompt": copiedPrompt,
                    "error": "Failed to launch \(appName). Ensure the application is installed.",
                ])
            }

        case .terminal(let cliCommand):
            let result = launchInTerminal(
                terminalId: normalizedTerminal,
                workspaceDir: absDir,
                cliCommand: cliCommand
            )
            var response: [String: Any] = [
                "ok": result.launched,
                "host": normalizedHost,
                "app": result.appName,
                "terminal": result.terminalUsed,
                "workspaceDir": absDir,
                "copiedPrompt": copiedPrompt,
            ]
            if let cli = cliCommand {
                response["command"] = cli
            }
            replyToWeb(id: requestId, payload: response)
        }
    }

    private func replyToWeb(id: String, payload: [String: Any]) {
        guard !id.isEmpty else { return }
        let idLiteral = jsonLiteralString(id)
        let payloadLiteral = jsonObjectLiteral(payload)
        let js = """
        if (typeof window.__aimakeNativeReply === "function") {
          window.__aimakeNativeReply(\(idLiteral), \(payloadLiteral));
        }
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    private func handleQuickClipText(requestId: String, title: String, content: String) {
        let origin = studioOrigin
        let fallbackBase = resolveWorkspaceVaultRawDir()

        Task { @MainActor in
            if let origin, let endpoint = URL(string: "\(origin)/api/wiki/quick-clip") {
                var req = URLRequest(url: endpoint)
                req.httpMethod = "POST"
                req.timeoutInterval = 3.0
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpBody = try? JSONSerialization.data(withJSONObject: [
                    "title": title,
                    "content": content,
                ])

                if let (_, response) = try? await URLSession.shared.data(for: req),
                   let httpRes = response as? HTTPURLResponse,
                   (200...299).contains(httpRes.statusCode) {
                    self.replyToWeb(id: requestId, payload: [
                        "ok": true,
                        "method": "studio-api",
                        "status": httpRes.statusCode,
                    ])
                    return
                }
            }

            do {
                try FileManager.default.createDirectory(atPath: fallbackBase, withIntermediateDirectories: true)
                let timestamp = ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-")
                let fileName = "\(timestamp)-\(slugifyClipTitle(title)).md"
                let filePath = URL(fileURLWithPath: fallbackBase).appendingPathComponent(fileName).path
                let md = """
                ---
                title: \(jsonLiteralString(title))
                source: macos-quick-clip
                clippedAt: "\(ISO8601DateFormatter().string(from: Date()))"
                ---

                # \(title)

                \(content)
                """
                try md.write(toFile: filePath, atomically: true, encoding: .utf8)
                self.replyToWeb(id: requestId, payload: [
                    "ok": true,
                    "method": "vault-raw",
                    "path": filePath,
                ])
            } catch {
                self.replyToWeb(id: requestId, payload: [
                    "ok": false,
                    "error": error.localizedDescription,
                ])
            }
        }
    }

    private func resolveWorkspaceVaultRawDir() -> String {
        let cwd = FileManager.default.currentDirectoryPath
        if let ws = options.workspaceDir {
            let absWs = ws.hasPrefix("/") ? ws : URL(fileURLWithPath: cwd).appendingPathComponent(ws).standardized.path
            return URL(fileURLWithPath: absWs).appendingPathComponent("vault/raw").path
        }
        if let deck = options.deckPath {
            let absDeck = deck.hasPrefix("/") ? deck : URL(fileURLWithPath: cwd).appendingPathComponent(deck).standardized.path
            return URL(fileURLWithPath: absDeck).deletingLastPathComponent().appendingPathComponent("vault/raw").path
        }
        return URL(fileURLWithPath: cwd).appendingPathComponent("vault/raw").path
    }

    // MARK: - WKNavigationDelegate & Automated Self-Test

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        hasFinishedInitialLoad = true
        if !pendingDeepLinks.isEmpty {
            let queued = pendingDeepLinks
            pendingDeepLinks.removeAll()
            for link in queued {
                dispatchDeepLink(link)
            }
        }

        if isSelfTestMode && !selfTestStarted {
            selfTestStarted = true
            Task { @MainActor in
                await runAutomatedSelfTest()
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if isSelfTestMode && !selfTestStarted {
            failSelfTest(reason: "Navigation failed: \(error.localizedDescription)")
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if isSelfTestMode && !selfTestStarted {
            failSelfTest(reason: "Provisional navigation failed: \(error.localizedDescription)")
        }
    }

    private func scheduleSelfTestWatchdog() {
        let item = DispatchWorkItem { [weak self] in
            Task { @MainActor in
                self?.failSelfTest(reason: "Timed out waiting for WKWebView self-test completion")
            }
        }
        selfTestWatchdog = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 20.0, execute: item)
    }

    private func evalJS(_ script: String) async throws -> Any? {
        try await withCheckedThrowingContinuation { continuation in
            webView.evaluateJavaScript(script) { value, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: value)
                }
            }
        }
    }

    private func takeWebViewPNGSnapshot() async throws -> Data {
        let image: NSImage = try await withCheckedThrowingContinuation { continuation in
            webView.takeSnapshot(with: nil) { snapshotImage, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let snapshotImage {
                    continuation.resume(returning: snapshotImage)
                } else {
                    continuation.resume(throwing: NSError(
                        domain: "cc.aimake.desktop",
                        code: 2,
                        userInfo: [NSLocalizedDescriptionKey: "WKWebView returned nil snapshot image"]
                    ))
                }
            }
        }
        guard let tiffData = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiffData),
              let pngData = bitmap.representation(using: .png, properties: [:]) else {
            throw NSError(
                domain: "cc.aimake.desktop",
                code: 3,
                userInfo: [NSLocalizedDescriptionKey: "Failed to encode snapshot PNG bytes"]
            )
        }
        return pngData
    }

    private func runAutomatedSelfTest() async {
        guard let outPath = options.selfTestJsonPath else { return }

        do {
            // 1. Verify injected __AIMAKE_DESKTOP__ and initiate getNativeState roundtrip + deeplink listener
            let setupScript = """
            (function() {
              window.__selfTestDeepLinkUrl = null;
              window.addEventListener("aimake:deeplink", function(ev) {
                window.__selfTestDeepLinkUrl = ev && ev.detail ? ev.detail.url : null;
              }, { once: true });

              window.__selfTestNativeState = null;
              var existingReply = window.__aimakeNativeReply;
              window.__aimakeNativeReply = function(id, payload) {
                if (id === "selftest_state_1") {
                  window.__selfTestNativeState = payload;
                }
                if (typeof existingReply === "function") {
                  existingReply(id, payload);
                }
              };
              window.webkit.messageHandlers.aimakeNative.postMessage({
                id: "selftest_state_1",
                action: "getNativeState",
                payload: {}
              });
              return {
                shell: window.__AIMAKE_DESKTOP__ ? String(window.__AIMAKE_DESKTOP__.shell || "") : "",
                platform: window.__AIMAKE_DESKTOP__ ? String(window.__AIMAKE_DESKTOP__.platform || "") : "",
                title: String(document.title || "")
              };
            })()
            """
            let initialInfo = (try await evalJS(setupScript) as? [String: Any]) ?? [:]
            let detectedShell = (initialInfo["shell"] as? String) ?? ""

            // 2. Dispatch simulated aimake://pane/wiki deep link
            dispatchDeepLink("aimake://pane/wiki")

            // 3. Poll up to 2s for asynchronous native bridge reply & deep link event
            var nativeReplyOk = false
            var deepLinkTested = false
            var pageTitle = (initialInfo["title"] as? String) ?? ""

            for _ in 0..<40 {
                let probe = (try await evalJS("""
                ({
                  nativeOk: Boolean(window.__selfTestNativeState && window.__selfTestNativeState.ok === true && window.__selfTestNativeState.hasStatusItem === true),
                  deepLinkUrl: String(window.__selfTestDeepLinkUrl || ""),
                  title: String(document.title || "")
                })
                """) as? [String: Any]) ?? [:]

                nativeReplyOk = (probe["nativeOk"] as? Bool) ?? false
                deepLinkTested = ((probe["deepLinkUrl"] as? String) == "aimake://pane/wiki")
                if let latestTitle = probe["title"] as? String, !latestTitle.isEmpty {
                    pageTitle = latestTitle
                }
                if nativeReplyOk && deepLinkTested {
                    break
                }
                try await Task.sleep(nanoseconds: 50_000_000)
            }

            // Allow WebKit compositor to settle before PNG snapshot
            try await Task.sleep(nanoseconds: 150_000_000)
            let pngData = try await takeWebViewPNGSnapshot()
            let pngPath = "\(outPath).png"
            try pngData.write(to: URL(fileURLWithPath: pngPath), options: .atomic)

            let contentSize = window.contentView?.bounds.size ?? window.frame.size
            let windowWidth = Int( contentSize.width.rounded() )
            let windowHeight = Int( contentSize.height.rounded() )
            let menuCount = NSApp.mainMenu?.items.count ?? 0
            let hasStatus = (statusItem != nil)

            let allChecksPassed = (
                detectedShell == Self.desktopShellId &&
                nativeReplyOk &&
                deepLinkTested &&
                hasStatus &&
                menuCount >= 4 &&
                pngData.count > 1000
            )

            let report: [String: Any] = [
                "ok": allChecksPassed,
                "windowWidth": windowWidth,
                "windowHeight": windowHeight,
                "menuCount": menuCount,
                "hasStatusItem": hasStatus,
                "pageTitle": pageTitle,
                "desktopShell": detectedShell,
                "nativeBridgeVerified": nativeReplyOk,
                "deepLinkTested": deepLinkTested,
                "snapshotBytes": pngData.count,
                "snapshotPath": pngPath,
            ]

            selfTestWatchdog?.cancel()
            try writeSelfTestReport(report, to: outPath)

            if allChecksPassed {
                NSApp.terminate(nil)
            } else {
                terminateStudioChildProcess()
                Darwin.exit(1)
            }
        } catch {
            failSelfTest(reason: error.localizedDescription)
        }
    }

    private func failSelfTest(reason: String) {
        selfTestWatchdog?.cancel()
        if let outPath = options.selfTestJsonPath {
            let report: [String: Any] = [
                "ok": false,
                "error": reason,
                "hasStatusItem": statusItem != nil,
                "menuCount": NSApp.mainMenu?.items.count ?? 0,
            ]
            try? writeSelfTestReport(report, to: outPath)
        }
        terminateStudioChildProcess()
        Darwin.exit(1)
    }

    private func writeSelfTestReport(_ report: [String: Any], to outPath: String) throws {
        let outURL = URL(fileURLWithPath: outPath)
        try FileManager.default.createDirectory(
            at: outURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let data = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: outURL, options: .atomic)
    }
}

MainActor.assumeIsolated {
    let options = LaunchOptions.parse(CommandLine.arguments)
    let app = NSApplication.shared
    app.setActivationPolicy(.regular)
    let delegate = AppDelegate(options: options)
    app.delegate = delegate
    app.run()
}


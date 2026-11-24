# RFC: Native Agent Client Protocol (ACP) Integration for Aimake Studio

* **RFC ID**: `RFC-2026-001`
* **Title**: Support Agent Client Protocol (ACP) for Seamless IDE Integration (Zed, JetBrains, Cursor)
* **Author**: Aimake Core Team
* **Status**: `PROPOSED`
* **Created**: 2026-11-24
* **Target Subsystem**: `area: acp`, `area: agent-integration`, `area: cli`
* **Related Issues**: [#9 - Support Agent Client Protocol (ACP) for Seamless IDE Integration](https://github.com/chicogong/aimake-creator/issues/9)

---

## 1. Executive Summary

This RFC proposes adding first-class support for the **Agent Client Protocol (ACP)** into Aimake Studio via a dedicated command: `aimake acp`. 

While Aimake currently provides rich downward tool execution via **Model Context Protocol (MCP)** (`aimake mcp`), ACP unlocks upward host integration: allowing Aimake to run natively as an autonomous AI agent inside modern code editors and IDEs—including **Zed**, **JetBrains**, **Cursor**, and **VS Code**. 

By implementing ACP, developers can generate 60fps release explainer videos, parametric slide decks, and social media deliverables directly from their active IDE session without context switching.

---

## 2. Background: MCP vs. ACP in the 2026 Agent Stack

The AI developer tooling ecosystem has standardized around two complementary protocols:

```
┌─────────────────────────────────────────────────────────────┐
│  Host Client / IDE (Zed, JetBrains, Cursor, VS Code)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ▲                  │  【ACP Layer】
            │                  ▼  Agent Client Protocol (JSON-RPC 2.0 via stdio)
            │  • session/prompt (User prompt execution)
            │  • session/update (Real-time storyboard diffs & progress)
            │  • session/request_permission (Native OS/file write approval)
            │
┌───────────┴──────────────────┴──────────────────────────────┐
│  Aimake Studio / Engine (Multimodal Content Creation Agent) │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ▲                  │  【MCP Layer】
            │                  ▼  Model Context Protocol (JSON-RPC 2.0 via stdio)
            │  • tools/call (invoke ffmpeg, sharp, deck compilers)
            │  • resources/read (fetch design templates, brand kits)
            │
┌───────────┴──────────────────┴──────────────────────────────┐
│  External Tools & Systems (Obsidian Vault, CapCut, FFmpeg)  │
└─────────────────────────────────────────────────────────────┘
```

* **MCP (Model Context Protocol)**: Standardizes how an AI agent connects **downward** to external data sources and execution tools. Aimake already implements this via `src/mcp/mcp-server.ts`.
* **ACP (Agent Client Protocol)**: Standardizes how an IDE or UI connects **upward** to an AI agent ("The Language Server Protocol for AI Agents"). It manages conversation sessions, streaming progress chunks, multi-file diffs, and interactive user permissions.

---

## 3. Problem Statement

Currently, developers using Aimake must either:
1. Switch to a terminal and run `aimake create` or `aimake wizard`; or
2. Open the browser-based Calm Studio canvas on `localhost:3000`; or
3. Configure Aimake as an MCP server for Claude Code/Codex, which treats Aimake merely as a silent tool rather than an interactive content-engineering partner.

In editors like **Zed**, **JetBrains**, and **Cursor**, developers spend 90% of their workday. They want to highlight a new feature release or git tag in their editor, open the IDE's native Agent panel, and say:
> *"Turn this latest commit into a 60fps release video, export a LinkedIn PDF carousel, and write a CapCut draft for my marketing team."*

Without ACP support, Aimake cannot participate in the native IDE agent panel or the community **ACP Registry**.

---

## 4. Proposed Architecture: `aimake acp`

### 4.1 CLI Interface
We will introduce a clean new entry point:
```bash
# Launch Aimake as a standard ACP Agent over stdio (for Zed, JetBrains, Cursor)
aimake acp

# Optional flags:
aimake acp --workspace <path>     # Bind explicitly to workspace directory
aimake acp --debug                # Emit verbose JSON-RPC protocol trace to stderr
```

### 4.2 Protocol Methods to Implement

ACP communicates via single line-delimited JSON-RPC 2.0 over standard I/O (`stdio`). Aimake will implement the following core handlers in `src/acp/acp-agent.ts`:

| Method / Notification | Direction | Purpose in Aimake |
| :--- | :--- | :--- |
| `initialize` | Client $\rightarrow$ Agent | Negotiates protocol version, declares agent info (`name: "aimake-studio"`, `version: "2.0.0"`), and negotiates capabilities. |
| `session/new` | Client $\rightarrow$ Agent | Instantiates an isolated creation session; captures `cwd` and active git context. |
| `session/prompt` | Client $\rightarrow$ Agent | Receives the user request (e.g., "Create a deck about our new v2.1 auth engine"). Invokes Aimake's intake and storyboard generator. |
| `session/update` | Agent $\rightarrow$ Client | **(Notification)** Streams real-time storyboard compilation progress, thumbnail previews, and token-by-token script drafting. |
| `session/request_permission` | Agent $\rightarrow$ Client | Requests interactive user consent from the IDE before writing `.deck.md` files, rendering heavy 4K MP4s, or generating CapCut drafts. |
| `session/cancel` | Client $\rightarrow$ Agent | Immediately interrupts ongoing FFmpeg renders or LLM drafting turns. |

### 4.3 Native IDE Permission Integration

Security is paramount in local-first development. When Aimake needs to write deliverables or run commands, it calls `session/request_permission` back to the IDE:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "session/request_permission",
  "params": {
    "sessionId": "sess-8f3a9",
    "permission": "fs/write_text_file",
    "title": "Write Release Storyboard",
    "description": "Create 'releases/v2.1.deck.md' using the 'tech-minimal-dark' template."
  }
}
```
The host IDE (e.g., Zed or JetBrains) renders a native, clean modal. Once approved, Aimake executes the write.

---

## 5. Phased Implementation Roadmap

* **Phase 1 (P0): ACP Agent Core (`src/acp/acp-agent.ts`)**
  - Implement standard JSON-RPC 2.0 `stdio` message framing (reusing infrastructure from `src/mcp/mcp-server.ts`).
  - Implement `initialize`, `session/new`, `session/prompt`, `session/cancel`, and `session/update`.
  - Wire into `src/cli.ts` as `aimake acp`.
  - Add comprehensive unit tests in `tests/acp-agent.test.ts`.

* **Phase 2 (P1): IDE Verified Configurations & ACP Registry Submission**
  - Provide ready-to-paste configurations for:
    - **Zed**: `~/.config/zed/settings.json` (`agent_servers`)
    - **JetBrains**: AI Assistant ACP Extension
    - **Cursor**: `cursor-agent` ACP bridge
  - Submit `aimake-studio` to the official open ACP Registry.

* **Phase 3 (P2): Calm Studio Canvas as an ACP Client**
  - Upgrade Aimake Studio's built-in chat UI to speak ACP as a Client.
  - Allow users to hot-swap between Claude Code, Cursor Agent, and local Ollama agents without bespoke subprocess adapters.

---

## 6. Success Metrics & Acceptance Criteria

1. **Test Coverage**: 100% pass on standard ACP JSON-RPC handshake, session lifecycle, and cancellation tests.
2. **Zed Integration**: Verified end-to-end in Zed's native Agent panel: user types a prompt, Aimake streams progress, requests write permission, and outputs a valid `.deck.md` file.
3. **Zero Regressions**: Existing `aimake mcp`, CLI commands, and Web Studio continue functioning with zero behavioral changes.

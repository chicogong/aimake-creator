# Security & Privacy Policy

Aimake is built on a **Zero-Cloud, Local-First Architecture**. Your notes, research data, slides, and API keys remain strictly on your local machine.

---

## 🔒 Local-First Privacy Commitment

Aimake operates under strict privacy guarantees:
1. **Zero External Telemetry**: Aimake never collects, tracks, or phones home user analytics, slide contents, or terminal keystrokes.
2. **Local Execution**: Rendering (Playwright headless snapshots, Mermaid rendering, PPTX synthesis, MP4 video compilation) executes entirely in your local environment.
3. **No Unprompted Network Calls**: AI model queries are dispatched only when explicitly configured by the user via local environment variables (e.g., standard OpenAI/Claude compatible keys) or local inference backends (Ollama, LM Studio).
4. **Secret Isolation**: Development scripts, logs, and private environment variables are protected by automated secret-scanning audits (`pnpm audit:secrets`) during build and CI.

---

## 🛡️ Supported Versions

Only the latest major release branch is actively maintained with security patches:

| Version | Supported | Status |
| :--- | :--- | :--- |
| `1.x.x` | ✅ Yes | Active Stable Support |
| `< 1.0.0` | ❌ No | Deprecated |

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability within Aimake:

1. **Do not disclose publicly**: Please avoid opening public GitHub issues for sensitive security vulnerabilities.
2. **Private Advisory**: Use [GitHub Private Vulnerability Reporting](https://github.com/chicogong/aimake-creator/security/advisories/new) on the repository.
3. **Information to Include**:
   - Description of the vulnerability and its potential impact.
   - Minimal reproduction steps or proof-of-concept deck/template.
   - Affected Aimake version and OS environment.

Maintainers will acknowledge receipt within 48 hours and work on a coordinated fix and advisory release.

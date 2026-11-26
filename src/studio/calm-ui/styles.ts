export const CALM_STUDIO_CSS = `
  :root {
    color-scheme: light dark;

    /* ==========================================================================
       1. Brand & Core Accent Tokens (Aimake 2026 Unified Spec - Obsidian Black)
       ========================================================================== */
    --am-violet: #18181b;
    --am-violet-hover: #27272a;
    --am-violet-active: #09090b;
    --am-violet-glow: rgba(24, 24, 27, 0.14);
    --am-violet-soft: rgba(24, 24, 27, 0.06);
    --am-violet-hairline: rgba(24, 24, 27, 0.2);

    --am-emerald: #10b981;
    --am-emerald-soft: rgba(16, 185, 129, 0.12);
    --am-amber: #f59e0b;
    --am-amber-soft: rgba(245, 158, 11, 0.12);
    --am-coral: #ff6b74;

    /* ==========================================================================
       2. Typography & Micro-Features (Geist & Apple HIG Aligned)
       ========================================================================== */
    --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
                 'Inter', 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
    --font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

    --font-features-base: "cv02", "cv03", "cv04", "cv11", "ss01";
    --font-features-numbers: "tnum", "cv02", "cv03", "cv04", "cv11";

    --tracking-tighter: -0.035em;
    --tracking-tight: -0.02em;
    --tracking-normal: 0em;
    --tracking-wide: 0.04em;

    /* ==========================================================================
       3. Physics Spring & Micro-Interactions (Raycast 240ms Damping)
       ========================================================================== */
    --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring-snappy: cubic-bezier(0.2, 0.9, 0.2, 1);
    --duration-fast: 140ms;
    --duration-normal: 240ms;
    --duration-smooth: 320ms;
    --press-scale: scale(0.975);

    /* ==========================================================================
       4. Atelier Vellum (Light Mode — Warm Architectural Mat + Obsidian Press Ink)
       ========================================================================== */
    --stage-bg: #eceae4;
    --stage-bg-gradient: radial-gradient(circle at 50% 30%, #f5f4ee 0%, #eceae4 65%, #e3e1da 100%);
    --stage-dot: rgba(20, 20, 19, 0.048);
    --chrome-bg: rgba(246, 245, 240, 0.88);
    --sidebar-bg: #f5f4ef;
    --surface: #ffffff;
    --surface-elev: #fdfcf9;
    --surface-subtle: #eeede7;
    --surface-hover: rgba(20, 20, 19, 0.045);
    --surface-active: rgba(20, 20, 19, 0.08);
    --border: rgba(20, 20, 19, 0.075);
    --border-subtle: rgba(20, 20, 19, 0.04);
    --border-strong: rgba(20, 20, 19, 0.13);

    --hairline-dark: 1px solid rgba(20, 20, 19, 0.08);
    --hairline-dark-strong: 1px solid rgba(20, 20, 19, 0.15);
    --hairline-dark-hover: 1px solid rgba(20, 20, 19, 0.26);

    --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    --inset-highlight-button: inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(20, 20, 19, 0.04);

    --ink: #141413;
    --ink-secondary: #57554f;
    --ink-muted: #8c887f;
    --accent: #18181b;
    --accent-hover: #27272a;
    --accent-soft: rgba(24, 24, 27, 0.065);
    --accent-ink: #fafaf9;
    --live: #0f9d68;
    --live-soft: rgba(15, 157, 104, 0.12);
    --hot: #d94e28;
    --hot-soft: rgba(217, 78, 40, 0.09);

    --btn-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(20, 20, 19, 0.05);
    --btn-primary-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(20, 20, 19, 0.2);
    --shadow-sm: 0 1px 2px rgba(20, 20, 19, 0.04), 0 0 0 1px rgba(20, 20, 19, 0.02);
    --shadow-md: 0 12px 32px -4px rgba(20, 20, 19, 0.08), 0 2px 6px -1px rgba(20, 20, 19, 0.04);
    --shadow-lg: 0 20px 48px -8px rgba(20, 20, 19, 0.18), 0 4px 16px -2px rgba(20, 20, 19, 0.06);
    --shadow-obsidian-dock: 0 12px 32px -4px rgba(20, 20, 19, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 rgba(20, 20, 19, 0.04);
    --shadow-obsidian-drawer: -12px 0 40px -6px rgba(20, 20, 19, 0.15);

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-pill: 999px;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      /* ========================================================================
         Optical Darkroom (Dark Mode — Deep Warm Obsidian Gradient #0c0c0e -> #16161b)
         ======================================================================== */
      --stage-bg: #0c0c0e;
      --stage-bg-gradient: radial-gradient(ellipse 70% 50% at 50% 30%, #16161b 0%, #111115 50%, #0c0c0e 100%);
      --stage-dot: rgba(255, 255, 255, 0.038);
      --chrome-bg: rgba(16, 16, 20, 0.88);
      --sidebar-bg: #111114;
      --surface: #17171c;
      --surface-elev: #1e1e24;
      --surface-subtle: #131317;
      --surface-hover: rgba(255, 255, 255, 0.05);
      --surface-active: rgba(255, 255, 255, 0.09);
      --border: rgba(255, 255, 255, 0.075);
      --border-subtle: rgba(255, 255, 255, 0.04);
      --border-strong: rgba(255, 255, 255, 0.14);

      --hairline-dark: 1px solid rgba(255, 255, 255, 0.08);
      --hairline-dark-strong: 1px solid rgba(255, 255, 255, 0.14);
      --hairline-dark-hover: 1px solid rgba(255, 255, 255, 0.22);

      --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);
      --inset-highlight-button: inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.20);

      --ink: #f5f4f0;
      --ink-secondary: #9e9b93;
      --ink-muted: #66635c;
      --accent: #f5f4f0;
      --accent-hover: #ffffff;
      --accent-soft: rgba(245, 244, 240, 0.09);
      --accent-ink: #0c0c0e;
      --live: #34d399;
      --live-soft: rgba(52, 211, 153, 0.14);
      --hot: #f97316;
      --hot-soft: rgba(249, 115, 22, 0.13);

      --am-violet: #f4f4f5;
      --am-violet-hover: #ffffff;
      --am-violet-active: #e4e4e7;
      --am-violet-glow: rgba(255, 255, 255, 0.2);
      --am-violet-soft: rgba(255, 255, 255, 0.1);
      --am-violet-hairline: rgba(255, 255, 255, 0.2);

      --btn-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.35);
      --btn-primary-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.45);
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35);
      --shadow-md: 0 16px 36px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 20px 48px -8px rgba(0, 0, 0, 0.5), 0 6px 20px -2px rgba(0, 0, 0, 0.35);
      --shadow-obsidian-dock: 0 16px 40px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25);
      --shadow-obsidian-drawer: -16px 0 48px -8px rgba(0, 0, 0, 0.65);
    }
  }

  :root[data-theme="dark"] {
    /* Optical Darkroom Explicit Override */
    --stage-bg: #0c0c0e;
    --stage-bg-gradient: radial-gradient(ellipse 70% 50% at 50% 30%, #16161b 0%, #111115 50%, #0c0c0e 100%);
    --stage-dot: rgba(255, 255, 255, 0.038);
    --chrome-bg: rgba(16, 16, 20, 0.88);
    --sidebar-bg: #111114;
    --surface: #17171c;
    --surface-elev: #1e1e24;
    --surface-subtle: #131317;
    --surface-hover: rgba(255, 255, 255, 0.05);
    --surface-active: rgba(255, 255, 255, 0.09);
    --border: rgba(255, 255, 255, 0.075);
    --border-subtle: rgba(255, 255, 255, 0.04);
    --border-strong: rgba(255, 255, 255, 0.14);

    --hairline-dark: 1px solid rgba(255, 255, 255, 0.08);
    --hairline-dark-strong: 1px solid rgba(255, 255, 255, 0.14);
    --hairline-dark-hover: 1px solid rgba(255, 255, 255, 0.22);

    --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    --inset-highlight-button: inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.20);

    --ink: #f5f4f0;
    --ink-secondary: #9e9b93;
    --ink-muted: #66635c;
    --accent: #f5f4f0;
    --accent-hover: #ffffff;
    --accent-soft: rgba(245, 244, 240, 0.09);
    --accent-ink: #0c0c0e;
    --live: #34d399;
    --live-soft: rgba(52, 211, 153, 0.14);
    --hot: #f97316;
    --hot-soft: rgba(249, 115, 22, 0.13);

    --btn-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.35);
    --btn-primary-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.45);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35);
    --shadow-md: 0 16px 36px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 20px 48px -8px rgba(0, 0, 0, 0.5), 0 6px 20px -2px rgba(0, 0, 0, 0.35);
    --shadow-obsidian-dock: 0 16px 40px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25);
    --shadow-obsidian-drawer: -16px 0 48px -8px rgba(0, 0, 0, 0.65);
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    background: var(--stage-bg);
    color: var(--ink);
    font-family: var(--font-sans);
    font-feature-settings: var(--font-features-base);
    font-size: 13px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button, input, select, textarea {
    font-family: inherit;
    color: inherit;
  }

  svg.ic {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    display: inline-block;
    vertical-align: middle;
  }
  svg.ic-sm { width: 12.5px; height: 12.5px; }
  svg.ic-lg { width: 16px; height: 16px; }

  /* =========================================================================
     48PX SINGLE-ROW TRANSLUCENT TOP BAR (MACOS CALM STUDIO CHROME)
     ========================================================================= */
  .topbar {
    height: 46px;
    padding: 0 14px;
    display: grid;
    grid-template-columns: minmax(210px, 1fr) auto minmax(280px, 1fr);
    align-items: center;
    gap: 12px;
    background: var(--chrome-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--inset-highlight);
    position: relative;
    z-index: 60;
    user-select: none;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--ink-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform var(--duration-fast) var(--ease-spring),
                background var(--duration-fast) ease,
                color var(--duration-fast) ease;
    flex-shrink: 0;
  }
  .icon-btn:hover {
    background: var(--surface-hover);
    color: var(--ink);
  }
  .icon-btn:active {
    transform: var(--press-scale);
  }

  .workspace-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px 0 6px;
    border-radius: 9px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    max-width: 270px;
    transition: transform var(--duration-fast) var(--ease-spring),
                background var(--duration-fast) ease,
                border-color var(--duration-fast) ease;
  }
  .workspace-pill:hover {
    background: var(--surface-hover);
    border-color: var(--border);
  }
  .workspace-pill:active {
    transform: var(--press-scale);
  }
  .brand-mark-badge {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: radial-gradient(circle at 30% 20%, #243760, #101727 58%, #070b14);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.28), 0 1px 3px rgba(8,12,21,0.3);
  }
  .workspace-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Center: Ultra-light End-to-End Closed-Loop Stepper */
  .loop-stepper {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .loop-step {
    height: 25px;
    padding: 0 13px;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--ink-secondary);
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-spring);
    white-space: nowrap;
    user-select: none;
  }
  .loop-step:hover {
    color: var(--ink);
    background: var(--surface-hover);
  }
  .loop-step.active {
    background: var(--surface);
    color: var(--ink);
    font-weight: 600;
    border-color: var(--border-subtle);
    box-shadow: var(--btn-shadow);
  }
  .loop-step .step-num {
    font-size: 10.5px;
    opacity: 0.72;
    font-feature-settings: var(--font-features-numbers);
  }
  .loop-step .step-dot,
  .loop-step.done .step-dot {
    display: none !important;
  }
  .loop-sep {
    color: var(--ink-muted);
    opacity: 0.35;
    font-size: 10px;
    pointer-events: none;
    user-select: none;
  }

  /* Right: Tactile Apple-Grade Primary Actions */
  .topbar-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
  }

  .btn {
    height: 31px;
    padding: 0 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    font-size: 12.5px;
    font-weight: 550;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: var(--btn-shadow);
    transition: transform var(--duration-fast) var(--ease-spring),
                background var(--duration-fast) ease,
                border-color var(--duration-fast) ease,
                box-shadow var(--duration-fast) ease;
    white-space: nowrap;
  }
  .btn:hover {
    background: var(--surface-elev);
    border-color: var(--border-strong);
  }
  .btn:active {
    transform: var(--press-scale);
  }
  .btn-ghost {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    color: var(--ink-secondary);
  }
  .btn-ghost:hover {
    background: var(--surface-hover);
    color: var(--ink);
    border-color: transparent;
  }
  .btn-primary {
    background: #18181b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }
  .btn-primary:hover {
    background: #27272a;
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
  :root[data-theme="dark"] .btn-primary,
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .btn-primary {
      background: #f4f4f5;
      color: #0c0c0e;
      border: 1px solid rgba(0, 0, 0, 0.12);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
    :root:not([data-theme="light"]) .btn-primary:hover {
      background: #ffffff;
      color: #000000;
      border-color: rgba(0, 0, 0, 0.2);
      box-shadow: 0 4px 14px rgba(255, 255, 255, 0.2);
    }
  }
  .btn-ai-trigger {
    background: var(--surface);
    border-color: var(--border-strong);
  }
  .btn-sm {
    height: 27px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 7px;
  }
  .btn-xs {
    height: 24px;
    padding: 0 8px;
    font-size: 11.5px;
    border-radius: 6px;
  }

  .live-dot {
    width: 6.5px;
    height: 6.5px;
    border-radius: 50%;
    background: var(--live);
    flex-shrink: 0;
  }
  .live-dot.pulse {
    animation: aimakePulse 1.4s ease-out 2;
  }
  @keyframes aimakePulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
    100% { box-shadow: 0 0 0 9px rgba(16, 185, 129, 0); }
  }

  /* =========================================================================
     MAIN BODY: COLLAPSIBLE LEFT RAIL + 85%+ IMMERSIVE STAGE
     ========================================================================= */
  .shell-body {
    height: calc(100vh - 46px);
    display: flex;
    position: relative;
    overflow: hidden;
  }

  .sidebar {
    width: 248px;
    flex-shrink: 0;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width var(--duration-normal) var(--ease-spring), opacity var(--duration-fast) ease;
    overflow: hidden;
  }
  .shell-body.sidebar-collapsed .sidebar {
    width: 0;
    opacity: 0;
    border-right-color: transparent;
    pointer-events: none;
  }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px 16px;
  }

  .sidebar-promos {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 14px;
  }

  .trending-promo-btn {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 9px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-fast) var(--ease-spring),
                border-color var(--duration-fast) ease,
                background-color var(--duration-fast) ease,
                box-shadow var(--duration-fast) ease;
  }
  .trending-promo-btn:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
    transform: translateY(-0.5px);
    box-shadow: var(--shadow-md);
  }
  .trending-promo-btn:active {
    transform: var(--press-scale);
  }
  .sidebar-meta-tag {
    font-size: 10px;
    font-family: var(--font-mono);
    font-feature-settings: var(--font-features-numbers);
    font-weight: 500;
    letter-spacing: 0.02em;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--ink-muted);
    line-height: 1.25;
    flex-shrink: 0;
  }
  .hot-pill {
    font-size: 10px;
    font-family: var(--font-mono);
    font-feature-settings: var(--font-features-numbers);
    font-weight: 500;
    letter-spacing: 0.02em;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--ink-muted);
    line-height: 1.25;
    flex-shrink: 0;
  }
  .hot-pill.radar-pill {
    color: var(--ink-secondary);
    border-color: var(--border);
    background: var(--surface-subtle);
  }

  .radar-promo-card {
    border: 1px solid var(--border);
    background: var(--surface);
    position: relative;
    overflow: hidden;
  }
  .radar-promo-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(var(--stage-dot) 1px, transparent 1px);
    background-size: 8px 8px;
    opacity: 0.5;
    pointer-events: none;
  }
  .radar-promo-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-0.5px);
  }

  /* Claude-Style Unified Category Filter Pills */
  .category-pills {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 2px 10px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .category-pills::-webkit-scrollbar {
    display: none;
  }
  .cat-pill {
    padding: 4px 9px;
    border-radius: var(--radius-pill);
    background: transparent;
    border: 1px solid transparent;
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-muted);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--duration-fast) var(--ease-spring);
  }
  .cat-pill:hover {
    color: var(--ink);
    background: var(--surface-hover);
  }
  .cat-pill.active {
    color: var(--ink);
    background: var(--surface);
    border-color: var(--border-strong);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    font-weight: 600;
  }

  .live-pulse-dot {
    width: 5.5px;
    height: 5.5px;
    border-radius: 50%;
    background: var(--live);
    box-shadow: 0 0 6px var(--live);
    display: inline-block;
    flex-shrink: 0;
    animation: am-breathe 2.4s ease-in-out infinite;
  }

  .nav-group {
    margin-bottom: 16px;
    position: relative;
  }
  .nav-group:not(:first-child) {
    border-top: 1px solid var(--border-subtle);
    padding-top: 12px;
  }
  .nav-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .nav-add-btn {
    border: none;
    background: transparent;
    color: var(--ink-muted);
    font-size: 11.5px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 5px;
    transition: background var(--duration-fast) ease, color var(--duration-fast) ease;
  }
  .nav-add-btn:hover {
    background: var(--surface-hover);
    color: var(--ink);
  }

  .nav-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-item {
    width: 100%;
    position: relative;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 6px;
    padding: 6px 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    cursor: pointer;
    color: var(--ink-secondary);
    transition: all var(--duration-fast) var(--ease-spring);
  }
  .nav-item:hover {
    background: var(--surface-hover);
    color: var(--ink);
  }
  .nav-item.active {
    background: var(--surface-active);
    color: var(--ink);
    border-color: var(--border);
    font-weight: 550;
    box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 5px;
    bottom: 5px;
    width: 2.5px;
    border-radius: 999px;
    background: var(--ink);
  }
  .nav-item-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-item-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
  }
  .nav-item-badge {
    font-size: 10px;
    font-weight: 550;
    padding: 1px 5px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--ink-muted);
    line-height: 1.3;
    flex-shrink: 0;
  }
  .nav-item:hover .nav-item-badge {
    color: var(--ink-secondary);
    border-color: var(--border);
  }
  .nav-item.active .nav-item-badge {
    background: var(--surface);
    color: var(--ink);
    border-color: var(--border-strong);
  }
  .nav-item-title {
    font-size: 12.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-item-sub {
    font-size: 11px;
    color: var(--ink-muted);
    font-feature-settings: var(--font-features-numbers);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-empty {
    padding: 8px 10px;
    font-size: 11.5px;
    color: var(--ink-muted);
    line-height: 1.5;
  }

  .sidebar-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .skill-badge-btn {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-size: 11.5px;
    color: var(--ink-secondary);
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-fast) var(--ease-spring),
                border-color var(--duration-fast) ease,
                color var(--duration-fast) ease,
                box-shadow var(--duration-fast) ease;
  }
  .skill-badge-btn:hover {
    border-color: var(--border-strong);
    color: var(--ink);
    transform: translateY(-0.5px);
    box-shadow: var(--shadow-md);
  }
  .skill-badge-btn:active {
    transform: var(--press-scale);
  }
  .skill-badge-left {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  /* =========================================================================
     IMMERSIVE CALM VISUAL STAGE (85%+ OF VIEWPORT)
     ========================================================================= */
  .stage-wrap {
    flex: 1;
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--stage-bg);
    background-image: radial-gradient(var(--stage-dot) 1px, transparent 1px);
    background-size: 20px 20px;
    overflow: hidden;
  }

  .stage-viewport {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 20px 76px;
    position: relative;
    overflow: hidden;
  }

  #preview-frame {
    width: 100%;
    height: 100%;
    max-width: 1280px;
    margin: 0 auto;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    display: block;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  #preview-frame::-webkit-scrollbar {
    display: none;
  }

  #preview-container,
  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  /* Live AI Sync Banner */
  .live-sync-pill {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    padding: 7px 15px;
    border-radius: var(--radius-pill);
    background: var(--surface-elev);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-md);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-fast) var(--ease-spring),
                transform var(--duration-fast) var(--ease-spring);
    z-index: 30;
  }
  .live-sync-pill.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* Floating Glassmorphism Canvas Status Bar */
  .stage-status-bar {
    position: absolute;
    top: 14px;
    left: 20px;
    height: 28px;
    padding: 0 13px;
    border-radius: var(--radius-pill);
    background: rgba(18, 22, 31, 0.76);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), inset 0 0.5px 0 rgba(255, 255, 255, 0.12);
    display: inline-flex;
    align-items: center;
    gap: 7px;
    z-index: 20;
    pointer-events: auto;
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-secondary);
    font-feature-settings: var(--font-features-numbers);
    user-select: none;
    transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
  }
  [data-theme="light"] .stage-status-bar,
  :root:not([data-theme="dark"]) .stage-status-bar {
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(20, 20, 19, 0.08);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    color: var(--ink-secondary);
  }
  .stage-wrap.fullscreen-mode .stage-status-bar {
    opacity: 0;
    pointer-events: none;
  }
  .stage-status-bar .status-sep {
    opacity: 0.35;
    font-size: 10px;
    user-select: none;
  }
  .stage-status-bar .status-label {
    font-weight: 550;
    color: var(--ink);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stage-status-bar #status-aspect-val {
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 10.5px;
    color: var(--ink);
  }
  .stage-status-bar #status-slide-text {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 10.5px;
    color: var(--ink-secondary);
  }
  .stage-status-bar .status-privacy-text {
    font-size: 10.5px;
    color: var(--ink-muted);
    letter-spacing: 0.02em;
  }
  .status-indicator-dot {
    width: 5.5px;
    height: 5.5px;
    border-radius: 50%;
    background: var(--live);
    box-shadow: 0 0 6px var(--live);
    flex-shrink: 0;
    animation: am-breathe 2.4s ease-in-out infinite;
  }
  .context-moat-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: var(--radius-pill);
    background: rgba(16, 185, 129, 0.09);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #10b981;
    font-size: 10.5px;
    font-weight: 550;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-spring);
  }
  .context-moat-pill:hover {
    background: rgba(16, 185, 129, 0.18);
    border-color: rgba(16, 185, 129, 0.45);
    transform: translateY(-0.5px);
  }

  /* Right Context & Sourcing Drawer (资料与上下文壁垒) */
  .context-drawer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 360px;
    max-width: 90vw;
    background: var(--chrome-bg);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border-left: 1px solid var(--border-strong);
    box-shadow: none !important;
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(100%);
    visibility: hidden;
    pointer-events: none;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.24s ease,
                visibility 0s 0.28s;
  }
  .context-drawer.open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    box-shadow: -1px 0 0 rgba(0, 0, 0, 0.08), -10px 0 24px rgba(0, 0, 0, 0.05) !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.24s ease,
                visibility 0s;
  }
  .context-drawer-header {
    height: 46px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
  }
  .context-drawer-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .context-drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .context-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .context-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .context-section-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .context-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    color: var(--ink-muted);
    font-feature-settings: var(--font-features-numbers);
  }
  .context-action-btn {
    font-size: 10.5px;
    color: var(--ink-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }
  .context-action-btn:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .context-card-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .context-card {
    padding: 9px 11px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all var(--duration-fast) ease;
  }
  .context-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
  }
  .context-card-title {
    font-size: 12px;
    font-weight: 550;
    color: var(--ink);
    line-height: 1.35;
  }
  .context-card-desc {
    font-size: 11px;
    color: var(--ink-muted);
    line-height: 1.4;
  }
  .context-card-meta {
    font-size: 10px;
    color: var(--ink-muted);
    display: flex;
    align-items: center;
    gap: 6px;
    font-feature-settings: var(--font-features-numbers);
  }
  .context-artifacts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .artifact-tile {
    padding: 7px 9px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--ink-secondary);
  }
  .dock-actions-secondary {
    display: none !important;
  }

  /* =========================================================================
     FLOATING TACTILE DOCK (LINEAR ATELIER + APPLE KEYNOTE SPEC)
     ========================================================================= */
  .stage-dock {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 32px);
    height: 42px;
    padding: 0 8px;
    border-radius: var(--radius-pill);
    background: var(--chrome-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-obsidian-dock);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    z-index: 30;
    user-select: none;
    transition: transform var(--duration-fast) var(--ease-spring),
                opacity var(--duration-fast) ease,
                box-shadow var(--duration-fast) ease;
  }
  .stage-dock::-webkit-scrollbar { display: none; }

  .slide-nav-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .slide-pills-wrap {
    max-width: 280px;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-behavior: smooth;
    display: inline-flex;
    align-items: center;
  }
  .slide-pills-wrap::-webkit-scrollbar { display: none; }
  .slide-pills {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 2px;
  }
  .slide-pill {
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink-secondary);
    font-family: var(--font-mono);
    font-feature-settings: var(--font-features-numbers);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    position: relative;
    transition: all var(--duration-fast) var(--ease-spring);
  }
  .slide-pill:hover {
    background: var(--surface-hover);
    color: var(--ink);
    border-color: var(--border);
    transform: translateY(-0.5px);
  }
  .slide-pill:active {
    transform: var(--press-scale);
  }
  .slide-pill.active {
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 650;
    border-color: var(--accent);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: scale(1.04);
  }
  .slide-quick-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: var(--surface-subtle);
    padding: 2px;
    border-radius: var(--radius-pill);
    margin: 0 2px;
    border: 1px solid var(--border-subtle);
  }
  .dock-icon-btn-danger:hover {
    background: var(--hot-soft) !important;
    color: var(--hot) !important;
  }
  .dock-chip-wechat {
    background: rgba(16, 185, 129, 0.12) !important;
    color: #10b981 !important;
    font-weight: 600;
  }
  .dock-chip-wechat:hover {
    background: rgba(16, 185, 129, 0.22) !important;
  }
  .btn-success-anim {
    background: #10b981 !important;
    color: #ffffff !important;
    border-color: #10b981 !important;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.45) !important;
    transform: scale(1.02);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .btn-loading-anim {
    opacity: 0.85;
    pointer-events: none;
    cursor: wait;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .ic.spin, .lucide-icon.spin {
    animation: spin 0.8s linear infinite;
  }

  .dock-icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-spring);
    flex-shrink: 0;
  }
  .dock-icon-btn:hover {
    background: var(--surface-hover);
    color: var(--ink);
    transform: translateY(-0.5px);
  }
  .dock-icon-btn:active {
    transform: var(--press-scale);
  }

  .dock-divider {
    width: 1px;
    height: 18px;
    background: linear-gradient(180deg, transparent, var(--border-strong) 25%, var(--border-strong) 75%, transparent);
    flex-shrink: 0;
    margin: 0 3px;
  }

  .dock-chip {
    height: 28px;
    padding: 0 10px;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink);
    font-size: 11.5px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--duration-fast) var(--ease-spring);
  }
  .dock-chip:hover {
    background: var(--surface-hover);
    border-color: var(--border);
    transform: translateY(-0.5px);
  }
  .dock-chip:active {
    transform: var(--press-scale);
  }
  .dock-chip-muted {
    color: var(--ink-secondary);
    font-family: var(--font-mono);
    font-feature-settings: var(--font-features-numbers);
  }
  .dock-chip-ai {
    background: var(--surface-subtle);
    border-color: var(--border);
    color: var(--ink);
    font-weight: 550;
  }
  .dock-chip-ai:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }
  .dock-chip-ai.active {
    background: var(--surface-active);
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }

  /* =========================================================================
     POPOVERS (Workspace Switcher / Beginner AI Studio Launcher / Locale)
     ========================================================================= */
  .popover {
    position: fixed;
    top: 54px;
    min-width: 300px;
    max-width: 440px;
    background: var(--surface-elev);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    box-shadow: var(--shadow-lg);
    padding: 10px;
    z-index: 70;
    display: none;
  }
  .popover.open {
    display: block;
    animation: popIn 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes popIn {
    from { opacity: 0; transform: translateY(-5px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .popover-section-title {
    font-size: 11px;
    font-weight: 650;
    color: var(--ink-muted);
    padding: 6px 8px 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .popover-sep {
    height: 1px;
    background: var(--border);
    margin: 8px 2px;
  }

  /* Beginner AI Studio Launcher Inside Popover */
  .ai-popover {
    right: 14px;
    width: 428px;
    max-height: calc(100vh - 70px);
    overflow-y: auto;
    padding: 12px;
  }
  .recipe-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin: 4px 0 8px;
  }
  .recipe-chip {
    padding: 8px 9px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    text-align: left;
    cursor: pointer;
    transition: all 0.14s ease;
  }
  .recipe-chip:hover {
    border-color: var(--border-strong);
    background: var(--surface);
  }
  .recipe-chip.active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .recipe-chip strong {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
  }
  .recipe-chip span {
    display: block;
    font-size: 10.5px;
    color: var(--ink-muted);
    margin-top: 2px;
  }

  .terminal-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 4px 2px 8px;
  }
  .term-pill {
    height: 25px;
    padding: 0 9px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    color: var(--ink-secondary);
    font-size: 11px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .term-pill:hover {
    border-color: var(--border-strong);
    color: var(--ink);
  }
  .term-pill.active {
    background: var(--ink);
    color: var(--surface);
    border-color: transparent;
    font-weight: 600;
  }
  .term-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--live);
  }

  .agent-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 9px;
    border-radius: 9px;
    transition: background 0.12s ease;
  }
  .agent-row:hover {
    background: var(--surface-hover);
  }
  .agent-info {
    min-width: 0;
    flex: 1;
  }
  .agent-name {
    font-size: 12.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .agent-sub {
    font-size: 11px;
    color: var(--ink-muted);
    margin-top: 2px;
    line-height: 1.35;
  }
  .status-pill-tiny {
    font-size: 10px;
    padding: 1.5px 6px;
    border-radius: var(--radius-pill);
    background: var(--live-soft);
    color: var(--live);
    font-weight: 600;
  }
  .status-pill-tiny.muted {
    background: var(--surface-subtle);
    color: var(--ink-muted);
  }

  /* =========================================================================
     PROGRESSIVE-DISCLOSURE DRAWERS & VISUAL GALLERY (36 TEMPLATES + TRENDING)
     ========================================================================= */
  .drawer-backdrop {
    position: fixed;
    inset: 46px 0 0 0;
    background: rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(1.5px);
    -webkit-backdrop-filter: blur(1.5px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.22s ease, visibility 0s 0.22s;
    z-index: 50;
  }
  .drawer-backdrop.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity 0.22s ease, visibility 0s;
  }
  body.has-wide-drawer .drawer-backdrop.open {
    background: rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .drawer {
    position: fixed;
    top: 46px;
    right: 0;
    bottom: 0;
    width: 448px;
    max-width: 94vw;
    background: var(--surface);
    border-left: 1px solid var(--border);
    box-shadow: none !important;
    transform: translateX(100%);
    visibility: hidden;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    z-index: 65;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.24s ease,
                visibility 0s 0.28s;
  }
  .drawer.wide {
    position: fixed;
    top: calc(50% + 23px);
    left: 50%;
    right: auto;
    bottom: auto;
    width: 980px;
    max-width: 92vw;
    height: 84vh;
    max-height: 860px;
    border-left: none;
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    box-shadow: none !important;
    transform: translate(-50%, -46%) scale(0.97);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    display: flex;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.2s ease,
                visibility 0s 0.28s;
    z-index: 70;
  }
  .drawer.wide.open {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.06) !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.2s ease,
                visibility 0s;
  }
  .drawer.open:not(.wide) {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    box-shadow: -1px 0 0 rgba(0, 0, 0, 0.08), -12px 0 32px rgba(0, 0, 0, 0.06) !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.24s ease,
                visibility 0s;
  }

  .drawer-head {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }
  .drawer-title {
    font-size: 15px;
    font-weight: 650;
    margin: 0;
  }
  .drawer-sub {
    font-size: 11.5px;
    color: var(--ink-muted);
    margin: 2px 0 0;
  }
  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 28px;
  }

  .segmented-tabs {
    display: inline-flex;
    padding: 3px;
    border-radius: 10px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    margin-bottom: 14px;
    gap: 2px;
  }
  .seg-tab {
    height: 28px;
    padding: 0 13px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--ink-secondary);
    font-size: 12px;
    font-weight: 550;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.14s ease;
  }
  .seg-tab:hover {
    color: var(--ink);
  }
  .seg-tab.active {
    background: var(--surface);
    color: var(--ink);
    font-weight: 650;
    box-shadow: var(--btn-shadow);
  }

  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }
  .search-input {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: var(--surface-subtle);
    font-size: 13px;
    outline: none;
    transition: border-color 0.14s ease, background 0.14s ease;
  }
  .search-input:focus {
    border-color: var(--accent);
    background: var(--surface);
  }
  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filter-chip {
    height: 27px;
    padding: 0 11px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--ink-secondary);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .filter-chip:hover {
    border-color: var(--border-strong);
    color: var(--ink);
  }
  .filter-chip.active {
    background: var(--ink);
    color: var(--surface);
    border-color: transparent;
    font-weight: 600;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(218px, 1fr));
    gap: 14px;
  }
  .tpl-card {
    border-radius: 13px;
    border: 1px solid var(--border);
    background: var(--surface);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.2, 0.85, 0.25, 1), box-shadow 0.18s ease, border-color 0.15s ease;
  }
  .tpl-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-strong);
  }
  .tpl-card.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1.5px var(--accent);
  }
  .tpl-status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: var(--radius-pill);
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    display: inline-block;
  }
  .tpl-status-badge.active {
    background: var(--accent-soft);
    color: var(--accent);
    border: 1px solid var(--accent);
  }
  .tpl-btn-apply {
    width: 100%;
    font-weight: 600;
  }
  .tpl-thumb-wrap {
    aspect-ratio: 4 / 3;
    background: var(--surface-subtle);
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tpl-thumb-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
    transition: transform 0.28s ease;
  }
  .tpl-thumb-wrap.is-wide img {
    object-fit: contain;
    object-position: center;
    padding: 8px;
  }
  .tpl-card:hover .tpl-thumb-wrap img {
    transform: scale(1.03);
  }
  .tpl-aspect-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: rgba(15, 18, 26, 0.72);
    color: #fff;
    font-size: 10px;
    font-family: var(--font-mono);
    backdrop-filter: blur(6px);
  }
  .tpl-hot-tag {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: rgba(225, 29, 72, 0.9);
    color: #fff;
    font-size: 10px;
    font-weight: 650;
    backdrop-filter: blur(6px);
  }
  .tpl-card-body {
    padding: 11px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
  }
  .tpl-card-name {
    font-size: 13px;
    font-weight: 650;
    line-height: 1.35;
  }
  .tpl-card-desc {
    font-size: 11.5px;
    color: var(--ink-muted);
    line-height: 1.45;
    flex: 1;
  }
  .tpl-card-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .tpl-card-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .pack-strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .pack-card {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .pack-card-title {
    font-size: 13px;
    font-weight: 650;
    line-height: 1.35;
  }
  .pack-card-desc {
    font-size: 11.5px;
    color: var(--ink-muted);
    line-height: 1.5;
    flex: 1;
  }

  /* Radar Inspiration Grid & Cards */
  .radar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 14px;
  }
  .radar-card {
    border-radius: 13px;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.18s cubic-bezier(0.2, 0.85, 0.25, 1), box-shadow 0.18s ease, border-color 0.15s ease;
  }
  .radar-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
  }
  .radar-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .radar-badge-source {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 6px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .radar-badge-hot {
    font-size: 11px;
    color: #ea580c;
    font-weight: 650;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .radar-title {
    font-size: 13.5px;
    font-weight: 650;
    line-height: 1.45;
    color: var(--ink);
    margin: 0;
  }
  .radar-summary {
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .radar-card-foot {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .radar-template-tag {
    font-size: 11px;
    color: var(--ink-muted);
    font-family: var(--font-mono);
  }
  .btn-radar-make {
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 650;
    border-radius: 7px;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .btn-radar-make:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
  .btn-radar-trigger {
    background: var(--accent-soft) !important;
    color: var(--accent) !important;
    border-color: var(--accent) !important;
    font-weight: 650;
  }

  /* Form / Inspector Cards */
  .section-block {
    padding: 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    margin-bottom: 14px;
  }
  .section-block h4 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 650;
  }
  .section-block p {
    margin: 0 0 10px;
    font-size: 12px;
    color: var(--ink-secondary);
    line-height: 1.5;
  }
  .export-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .export-grid .btn-wide {
    grid-column: 1 / -1;
    justify-content: center;
  }
  .capcut-export-card {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }
  .capcut-card-badge-installed {
    background: rgba(16, 185, 129, 0.15) !important;
    color: var(--emerald) !important;
    border: 1px solid rgba(16, 185, 129, 0.35) !important;
  }
  .capcut-card-badge-uninstalled {
    background: rgba(148, 163, 184, 0.15) !important;
    color: var(--ink-secondary) !important;
    border: 1px solid rgba(148, 163, 184, 0.25) !important;
  }

  .field-label {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink-secondary);
    margin: 10px 0 5px;
  }
  .textarea-clean {
    width: 100%;
    min-height: 120px;
    padding: 10px 12px;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    font-size: 12.5px;
    line-height: 1.55;
    resize: vertical;
    outline: none;
  }
  .textarea-clean:focus {
    border-color: var(--accent);
  }
  .code-editor {
    width: 100%;
    height: calc(100vh - 190px);
    padding: 14px;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: var(--surface-subtle);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    resize: none;
    outline: none;
  }

  /* Modals & Command Palette (⌘K) */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.36);
    backdrop-filter: blur(5px);
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    z-index: 90;
  }
  .modal-backdrop.open {
    display: flex;
  }
  .cmdk-box {
    width: 560px;
    max-width: 92vw;
    background: var(--surface-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: popIn 0.14s ease-out;
  }
  .cmdk-input {
    width: 100%;
    height: 48px;
    padding: 0 18px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    font-size: 14px;
    outline: none;
  }
  .cmdk-list {
    max-height: 370px;
    overflow-y: auto;
    padding: 8px;
  }
  .cmdk-item {
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 8px;
    padding: 9px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    font-size: 13px;
    color: var(--ink);
  }
  .cmdk-item:hover, .cmdk-item.focused {
    background: var(--surface-active);
  }
  .cmdk-kbd {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-muted);
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
  }

  .dialog-box {
    width: 540px;
    max-width: 92vw;
    max-height: 82vh;
    background: var(--surface-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: popIn 0.15s ease-out;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 6px 0 12px;
  }
  .preset-option {
    padding: 10px 11px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease, transform 0.1s ease;
  }
  .preset-option:hover {
    border-color: var(--border-strong);
  }
  .preset-option.active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .preset-option strong {
    display: block;
    font-size: 12.5px;
    margin-bottom: 3px;
  }
  .preset-option span {
    font-size: 11px;
    color: var(--ink-muted);
    line-height: 1.35;
  }

  /* Drag-and-Drop File Intake Glass Overlay */
  .drop-overlay {
    position: fixed;
    inset: 0;
    background: var(--accent-soft);
    backdrop-filter: blur(8px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 110;
    pointer-events: none;
  }
  .drop-overlay.active {
    display: flex;
  }
  .drop-card {
    padding: 28px 42px;
    border-radius: 20px;
    background: var(--surface-elev);
    border: 2px dashed var(--accent);
    box-shadow: var(--shadow-lg);
    text-align: center;
  }
  .drop-card strong {
    display: block;
    font-size: 16px;
    margin-bottom: 6px;
  }
  .drop-card span {
    font-size: 12.5px;
    color: var(--ink-secondary);
  }

  .media-preview-box video,
  .media-preview-box img {
    width: 100%;
    max-height: 360px;
    border-radius: 9px;
    background: #000;
    object-fit: contain;
  }

  .export-preview-card {
    padding: 14px;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);
    margin-top: 8px;
    text-align: left;
    box-shadow: var(--shadow-sm);
  }
  .export-preview-meta-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    border: 1px solid var(--border-strong);
    color: var(--ink);
    margin-bottom: 10px;
  }
  .export-preview-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  /* Top-Center Floating HUD Toast (never overlaps bottom dock or chat input) */
  #toast {
    position: fixed;
    top: 58px;
    bottom: auto;
    left: 50%;
    right: auto;
    padding: 8px 15px;
    border-radius: var(--radius-pill);
    background: var(--surface-elev);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-md);
    font-size: 12px;
    font-weight: 550;
    color: var(--ink);
    z-index: 120;
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
    max-width: min(520px, 88vw);
    white-space: normal;
    line-height: 1.45;
    text-align: center;
  }
  #toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* =======================================================================
   * CONVERSATIONAL CREATION & CHAT CO-PILOT ("1+1" Real AI + Model Settings)
   * ======================================================================= */
  .chat-panel {
    width: 380px;
    height: 100%;
    background: var(--sidebar-bg);
    border-left: 1px solid var(--border);
    box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 20px 48px -8px rgba(0, 0, 0, 0.5), -1px 0 0 var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: width var(--duration-normal) var(--ease-spring), opacity var(--duration-normal) ease, box-shadow var(--duration-normal) ease;
    z-index: 10;
    position: relative;
  }
  .chat-panel.collapsed {
    width: 0 !important;
    min-width: 0 !important;
    border-left: none !important;
    border-left-width: 0 !important;
    border: none !important;
    overflow: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    box-shadow: none !important;
  }
  .chat-panel-head {
    height: 46px;
    padding: 0 12px 0 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: var(--chrome-bg);
    backdrop-filter: blur(16px);
    flex-shrink: 0;
  }
  .chat-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .chat-title-text {
    font-size: 13px;
    font-weight: 650;
    color: var(--ink);
    white-space: nowrap;
  }
  .chat-slide-badge {
    font-size: 10.5px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
  }
  .chat-settings-drawer {
    display: none;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    background: var(--surface);
    border-bottom: 1px solid var(--border-strong);
    flex-shrink: 0;
  }
  .chat-settings-drawer.open {
    display: flex;
  }
  .chat-preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chat-preset-pill {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    color: var(--ink-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.14s ease;
  }
  .chat-preset-pill:hover,
  .chat-preset-pill.active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .chat-cfg-input {
    width: 100%;
    height: 29px;
    padding: 0 9px;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    color: var(--ink);
    font-size: 11.5px;
    font-family: var(--font-mono);
    outline: none;
  }
  .chat-cfg-input:focus {
    border-color: var(--accent);
    background: var(--surface-elev);
  }
  .chat-cfg-row {
    display: grid;
    grid-template-columns: 1fr 110px;
    gap: 6px;
  }
  .chat-cfg-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: 2px;
  }
  .chat-pills-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-subtle);
    flex-shrink: 0;
  }
  .chat-action-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    font-size: 11px;
    padding: 4px 9px;
    border-radius: var(--radius-pill);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--ink-secondary);
    cursor: pointer;
    transition: all 0.14s ease;
  }
  .chat-action-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--surface-elev);
  }
  .chat-messages-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .chat-msg {
    max-width: 94%;
    padding: 10px 13px;
    border-radius: var(--radius-md);
    font-size: 12.5px;
    line-height: 1.55;
    word-break: break-word;
  }
  .chat-msg.user {
    align-self: flex-end;
    background: var(--accent);
    color: var(--accent-ink);
    border-bottom-right-radius: 4px;
  }
  .chat-msg.ai {
    align-self: flex-start;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--ink);
    border-bottom-left-radius: 4px;
    box-shadow: var(--shadow-sm);
  }
  .chat-engine-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 1.5px 6px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    color: var(--ink-muted);
    margin-bottom: 5px;
  }
  .chat-diff-card {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--surface-subtle);
    border: 1px solid var(--border-strong);
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 11.5px;
  }
  .chat-diff-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .chat-diff-title-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chat-diff-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .chat-diff-text {
    color: var(--ink);
    font-weight: 600;
    font-size: 11.5px;
  }
  .chat-diff-view-toggle {
    display: inline-flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 1.5px;
    gap: 2px;
  }
  .chat-diff-tab {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    border: none;
    background: transparent;
    color: var(--ink-muted);
    cursor: pointer;
    font-weight: 550;
    transition: all 0.12s ease;
  }
  .chat-diff-tab.active {
    background: var(--accent);
    color: #fff;
  }
  .chat-diff-body {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .chat-diff-lines {
    font-family: var(--font-mono);
    font-size: 10.5px;
    line-height: 1.45;
    color: var(--ink-secondary);
    padding: 6px 8px;
    max-height: 220px;
    overflow-y: auto;
  }
  .chat-diff-line-add {
    color: var(--live);
    background: rgba(34, 197, 94, 0.08);
    border-radius: 2px;
    padding: 1px 3px;
  }
  .chat-diff-line-del {
    color: var(--hot);
    background: rgba(239, 68, 68, 0.08);
    opacity: 0.85;
    border-radius: 2px;
    padding: 1px 3px;
  }
  .chat-diff-side-by-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.45;
    max-height: 240px;
    overflow-y: auto;
    border-top: 1px solid var(--border);
  }
  .chat-diff-side-col {
    padding: 6px 8px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .chat-diff-side-col.before {
    background: rgba(239, 68, 68, 0.03);
    border-right: 1px solid var(--border);
    color: var(--ink-secondary);
  }
  .chat-diff-side-col.after {
    background: rgba(34, 197, 94, 0.04);
    color: var(--ink);
  }
  .chat-diff-col-head {
    font-weight: 700;
    font-size: 9.5px;
    text-transform: uppercase;
    padding-bottom: 4px;
    margin-bottom: 4px;
    border-bottom: 1px dashed var(--border);
  }
  .chat-diff-col-head.before { color: var(--hot); }
  .chat-diff-col-head.after { color: var(--live); }
  .chat-diff-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }
  .chat-diff-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chat-apply-btn {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 6px;
    background: var(--accent);
    color: #fff;
    border: 1px solid var(--accent);
    cursor: pointer;
    font-weight: 600;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.15s ease;
  }
  .chat-apply-btn:hover { opacity: 0.9; }
  .chat-revert-btn, .chat-rollback-btn {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    color: var(--ink-secondary);
    cursor: pointer;
    font-weight: 600;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }
  .chat-revert-btn:hover, .chat-rollback-btn:hover {
    color: var(--hot);
    border-color: var(--hot);
    background: var(--hot-soft);
  }
  .chat-status-pill {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
    color: var(--ink-muted);
  }
  .chat-status-pill.applied {
    background: rgba(34, 197, 94, 0.12);
    color: var(--live);
  }
  .chat-status-pill.reverted {
    background: rgba(239, 68, 68, 0.1);
    color: var(--hot);
  }
  .chat-progressive-phases {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--ink-secondary);
  }
  .typing-cursor {
    display: inline-block;
    width: 2px;
    height: 12px;
    background: var(--accent);
    margin-left: 2px;
    vertical-align: middle;
    animation: typingBlink 0.8s infinite;
  }
  @keyframes typingBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .chat-input-area {
    padding: 10px 12px 12px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }
  .chat-input-textarea {
    width: 100%;
    min-height: 60px;
    max-height: 140px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-subtle);
    color: var(--ink);
    font-size: 12.5px;
    resize: none;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .chat-input-textarea:focus {
    border-color: var(--accent);
    background: var(--surface);
  }
  .chat-input-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    width: 100%;
  }
  .chat-input-controls .btn {
    flex-shrink: 0;
  }
  .chat-mode-select {
    flex: 1 1 0%;
    width: 0;
    max-width: calc(100% - 82px);
    min-width: 0;
    font-size: 11px;
    padding: 4px 6px;
    border-radius: 6px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    color: var(--ink-secondary);
    text-overflow: ellipsis;
    overflow: hidden;
  }

  /* Fullscreen Presentation Mode */
  .stage-wrap.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: #000000;
  }
  .stage-wrap.fullscreen-mode .stage-dock {
    opacity: 0.15;
    transition: opacity 0.2s ease;
  }
  .stage-wrap.fullscreen-mode .stage-dock:hover {
    opacity: 1;
  }

  /* Responsive breakpoints for sub-1024px screens */
  @media (max-width: 960px) {
    .topbar {
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      gap: 8px;
    }
    .loop-stepper {
      display: none;
    }
    .topbar-right .btn span {
      display: none;
    }
    .topbar-right .btn {
      padding: 0 8px;
    }
    .sidebar {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 40;
      box-shadow: var(--shadow-lg);
    }
    .chat-panel {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 40;
      width: min(380px, 100vw);
      box-shadow: var(--shadow-lg);
    }
  }
  @media (max-width: 640px) {
    .workspace-name {
      max-width: 130px;
    }
    .stage-dock {
      max-width: calc(100% - 12px);
      padding: 0 4px;
    }
    .stage-status-bar {
      display: none;
    }
  }
`;

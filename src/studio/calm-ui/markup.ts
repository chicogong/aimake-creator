import { lucideIcon } from './icons.js';

export const CALM_STUDIO_MARKUP = `
  <!-- 46px Single-Row Translucent Atelier Top Bar -->
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-btn" id="btn-toggle-sidebar" title="收起/展开工作区栏 (⌘\\)" aria-label="切换工作区栏">
        ${lucideIcon('panelLeft', 'ic ic-lg')}
      </button>

      <button class="workspace-pill" id="btn-workspace-switcher" title="切换或新建创作工作区">
        <span class="brand-mark-badge" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 512 512" fill="none">
            <path fill="#6951FF" d="M117 121 L258 79 Q293 69 286 103 L231 370 Q226 394 205 394 H117 Q93 394 93 370 V148 Q93 130 117 121 Z"></path>
            <rect fill="#FFCB49" x="304" y="98" width="156" height="156" rx="28"></rect>
            <path fill="#B7AAFF" d="M292 273 H346 Q364 273 360 296 L345 379 Q342 395 321 395 H276 Q258 395 263 377 L281 295 Q285 273 292 273 Z"></path>
            <path fill="#FF6B74" d="M460 282 V368 Q460 395 432 395 H361 Q358 395 359 384 C367 316 399 286 448 282 Z"></path>
          </svg>
        </span>
        <span class="workspace-name" id="workspace-name-label">Aimake 创作工作区</span>
        ${lucideIcon('chevronDown', 'ic ic-sm')}
      </button>
    </div>

    <!-- Center: Clean End-to-End Closed-Loop Progress Anchor -->
    <nav class="loop-stepper" aria-label="端到端创作闭环">
      <button class="loop-step" data-loop-step="intake" title="拖入或粘贴素材，自动沉淀到工作区知识库">
        素材<span class="step-dot"></span>
      </button>
      <span class="loop-sep">·</span>
      <button class="loop-step" data-loop-step="author" title="选择 AI 工具或对话副驾驶，在当前工作区创作">
        创作<span class="step-dot"></span>
      </button>
      <span class="loop-sep">·</span>
      <button class="loop-step active" data-loop-step="stage" title="实时视觉舞台与所见即所得微调">
        舞台<span class="step-dot"></span>
      </button>
      <span class="loop-sep">·</span>
      <button class="loop-step" data-loop-step="deliver" title="多模态成品交付与资产归档回流">
        交付<span class="step-dot"></span>
      </button>
    </nav>

    <!-- Right: 3 Tactile Primary Actions with Crisp Lucide Icons -->
    <div class="topbar-right">
      <button class="btn btn-ai-trigger" id="btn-open-ai" title="选择终端或图形 AI 工具，在当前工作区一键开启创作会话">
        <span class="live-dot" id="live-sync-dot"></span>
        ${lucideIcon('sparkles')}
        <span>在 AI 中创作</span>
        ${lucideIcon('chevronDown', 'ic ic-sm')}
      </button>

      <button class="btn btn-radar-trigger" id="btn-open-radar" title="浏览全网实时热点（X/Twitter、GitHub Trending、知乎、36Kr），一键生成作品">
        ${lucideIcon('flame')}
        <span>灵感雷达</span>
      </button>

      <button class="btn" id="btn-open-gallery" title="浏览 36 套高颜值视觉风格与 2026 时事范例，一键做同款">
        ${lucideIcon('layoutGrid')}
        <span>风格与同款</span>
      </button>

      <button class="btn btn-primary" id="btn-open-export" title="一键导出高清图、公众号、PDF、PPTX 或口播视频">
        ${lucideIcon('upload')}
        <span>导出</span>
      </button>
    </div>
  </header>

  <!-- Main Workspace Shell -->
  <div class="shell-body" id="shell-body">
    <!-- Left Collapsible Workspace Rail -->
    <aside class="sidebar" aria-label="工作区导航">
      <div class="sidebar-scroll">
        <!-- Quick Entry to Timely 2026 Current-News Showcase Works & Weekly Radar -->
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          <button class="trending-promo-btn radar-promo-card" id="btn-sidebar-radar" title="浏览全网实时热点（X/Twitter、知乎、36Kr），一键生成新作品">
            <span class="nav-item-main">
              <span class="nav-item-title" style="font-weight:650;color:var(--ink);display:flex;align-items:center;gap:6px;">
                <span class="live-pulse-dot"></span>
                <span>每周灵感雷达 · W47</span>
              </span>
              <span class="nav-item-sub">16 篇 X 前沿推文与时事 · 一键填装</span>
            </span>
            <span class="hot-pill" style="background:linear-gradient(135deg,rgba(105,81,255,0.2),rgba(139,92,246,0.25));color:var(--accent);">RADAR</span>
          </button>

          <button class="trending-promo-btn" id="btn-open-trending" title="浏览 2026 最新科技时事成品，一键导入或做同款">
            <span class="nav-item-main">
              <span class="nav-item-title" style="font-weight:650;color:var(--ink);">2026 时事灵感成品</span>
              <span class="nav-item-sub">6 套高保真热点成品 · 点一下做同款</span>
            </span>
            <span class="hot-pill">HOT</span>
          </button>
        </div>

        <div class="nav-group">
          <div class="nav-group-head">
            <span>作品集 <span id="decks-count"></span></span>
            <button class="nav-add-btn" id="btn-new-deck">
              <svg class="ic ic-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 3.2v9.6M3.2 8h9.6"></path></svg>
              <span>新建</span>
            </button>
          </div>
          <div class="nav-list" id="deck-list"></div>
        </div>

        <div class="nav-group">
          <div class="nav-group-head">
            <span>素材与知识 <span id="sources-count"></span></span>
            <button class="nav-add-btn" id="btn-add-source">
              <svg class="ic ic-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 3.2v9.6M3.2 8h9.6"></path></svg>
              <span>收入</span>
            </button>
          </div>
          <div class="nav-list" id="source-list"></div>
        </div>

        <div class="nav-group">
          <div class="nav-group-head">
            <span>已导出成品 <span id="exports-count"></span></span>
            <button class="nav-add-btn" id="btn-refresh-exports">刷新</button>
          </div>
          <div class="nav-list" id="export-list"></div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="skill-badge-btn" id="btn-open-skills" title="查看并管理当前工作区实体预设的 7 大闭环 Skill（零全局污染）">
          <span class="skill-badge-left">
            <span class="live-dot"></span>
            <span id="preset-skill-summary">7/7 预设 Skill 就绪</span>
          </span>
          <svg class="ic ic-sm" style="color:var(--ink-muted)" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4.5 10 8l-3.5 3.5"></path></svg>
        </button>
      </div>
    </aside>

    <!-- Center 85%+ Calm Visual Stage -->
    <main class="stage-wrap">
      <!-- Floating Glassmorphism Canvas Status Bar -->
      <div class="stage-status-bar" id="stage-status-bar" aria-label="画板状态">
        <div class="status-item status-deck-info" title="当前作品">
          <span class="status-indicator-dot pulse"></span>
          <span class="status-label" id="status-deck-name">当前作品</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item status-aspect-badge" id="status-aspect-badge" title="当前画幅比例">
          <svg class="ic ic-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="9" rx="2"/></svg>
          <span id="status-aspect-val">16:9</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item status-slide-counter" id="status-slide-counter" title="当前幻灯片页数">
          <span id="status-slide-text">第 01 / 01 页</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item status-privacy-badge" title="纯本地隐私保护：无云端回传，100% 数据留存本机">
          <span class="status-shield">${lucideIcon('shield', 'ic ic-sm')}</span>
          <span class="status-privacy-text">Zero-Cloud 隐私留存</span>
        </div>
      </div>
      <script>
        (function() {
          function syncStatusCapsule() {
            var aspectLabel = document.getElementById('active-aspect-label');
            var statusAspect = document.getElementById('status-aspect-val');
            if (aspectLabel && statusAspect && aspectLabel.textContent && statusAspect.textContent !== aspectLabel.textContent) {
              statusAspect.textContent = aspectLabel.textContent;
            }
            var chatBadge = document.getElementById('chat-active-slide-badge');
            var statusSlide = document.getElementById('status-slide-text');
            if (chatBadge && statusSlide && chatBadge.textContent) {
              var m = chatBadge.textContent.match(/(\d+)\s*\/\s*(\d+)/);
              if (m) {
                statusSlide.textContent = '第 ' + m[1] + ' / ' + m[2] + ' 页';
              }
            }
            var statusDeck = document.getElementById('status-deck-name');
            if (statusDeck && (statusDeck.textContent === '作品加载中' || statusDeck.textContent === '当前作品')) {
              var activeDeck = document.querySelector('.deck-item.active .deck-name, .deck-item.active');
              if (activeDeck && activeDeck.textContent) {
                statusDeck.textContent = activeDeck.textContent.trim();
              }
            }
          }
          if (typeof MutationObserver !== 'undefined') {
            var obs = new MutationObserver(syncStatusCapsule);
            if (document.body) {
              obs.observe(document.body, { childList: true, subtree: true, characterData: true });
            } else {
              window.addEventListener('DOMContentLoaded', function() {
                obs.observe(document.body, { childList: true, subtree: true, characterData: true });
                syncStatusCapsule();
              });
            }
          }
        })();
      </script>

      <div class="live-sync-pill" id="live-sync-banner">
        <span class="live-dot pulse"></span>
        <span id="live-sync-text">AI 已实时更新工作区作品</span>
      </div>

      <div class="stage-viewport">
        <iframe id="preview-frame" title="Aimake 实时视觉舞台"></iframe>
      </div>

      <!-- Floating Bottom Filmstrip & Tactile Dock (Linear / Figma Restrained 5-6 Controls) -->
      <div class="stage-dock" role="toolbar" aria-label="舞台快捷栏">
        <!-- 1. Filmstrip navigation pill -->
        <div class="slide-nav-group">
          <button class="dock-icon-btn" id="btn-prev-slide" title="上一页 (← / PageUp)">
            ${lucideIcon('chevronLeft', 'ic ic-sm')}
          </button>
          <div class="slide-pills-wrap">
            <div class="slide-pills" id="slide-pills"></div>
          </div>
          <button class="dock-icon-btn" id="btn-next-slide" title="下一页 (→ / Space / PageDown)">
            ${lucideIcon('chevronRight', 'ic ic-sm')}
          </button>
          <div class="slide-quick-actions" role="group" aria-label="页面增删复制">
            <button class="dock-icon-btn" id="btn-add-slide" title="在当前页后新增一页 (+)">
              ${lucideIcon('plus')}
            </button>
            <button class="dock-icon-btn" id="btn-dup-slide" title="复制当前页">
              ${lucideIcon('copy')}
            </button>
            <button class="dock-icon-btn dock-icon-btn-danger" id="btn-del-slide" title="删除当前页">
              ${lucideIcon('trash')}
            </button>
          </div>
        </div>
        <div class="dock-divider"></div>
        <!-- 2. Aspect ratio control -->
        <button class="dock-chip" id="btn-dock-aspect" title="切换画幅比例（16:9, 9:16, 3:4, 1:1, 4:5）">
          <span id="active-aspect-label">16:9</span>
          ${lucideIcon('chevronDown', 'ic ic-sm')}
        </button>
        <!-- 3. Style template control -->
        <button class="dock-chip" id="btn-dock-style" title="切换 36 套视觉风格或一键做同款">
          <span id="active-style-label">瑞士网格</span>
          ${lucideIcon('chevronDown', 'ic ic-sm')}
        </button>
        <div class="dock-divider"></div>
        <!-- 4. Zoom mode -->
        <button class="dock-chip dock-chip-muted" id="btn-dock-zoom" title="切换自适应缩放 / 100% 原比例">自适应</button>
        <!-- 5. Fullscreen presentation -->
        <button class="dock-icon-btn" id="btn-dock-fullscreen" title="全屏演示 (F)">
          ${lucideIcon('maximize')}
        </button>
        <!-- Secondary actions preserved in DOM for event listeners and shortcuts -->
        <div class="dock-actions-secondary" style="display:none;" aria-hidden="true">
          <button class="dock-chip dock-chip-wechat" id="btn-quick-copy-wechat" title="一键复制微信公众号富文本，直粘后台">
            ${lucideIcon('copy', 'ic ic-sm')}
            <span>复制公众号</span>
          </button>
          <button class="dock-chip dock-chip-muted" id="btn-dock-locale" title="切换作品排版语言">
            <span id="active-locale-label">中文</span>
            ${lucideIcon('chevronDown', 'ic ic-sm')}
          </button>
          <button class="dock-chip" id="btn-toggle-chat" title="展开/收起 AI 对话创作副驾驶 (⌘J)">
            <span class="live-dot" style="margin-right:3px;"></span>
            <span>AI 对话</span>
          </button>
          <button class="dock-chip dock-chip-muted" id="btn-open-polish" title="去 AI 味精修、素材入库与源码编辑">微调</button>
          <button class="dock-chip dock-chip-muted" id="btn-open-cmdk" title="打开命令面板 (⌘K)">⌘K</button>
        </div>
      </div>
    </main>

    <!-- Right Collapsible AI Chat Co-Pilot Drawer ("1+1" Real AI + CLI) -->
    <aside class="chat-panel collapsed" id="chat-panel" aria-label="AI 对话创作副驾驶">
      <div class="chat-panel-head">
        <div class="chat-title-group">
          ${lucideIcon('sparkles')}
          <span class="chat-title-text">AI 对话创作</span>
          <span class="chat-slide-badge" id="chat-active-slide-badge">当前页 01</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <button class="icon-btn" id="btn-chat-settings" title="模型 API 与本机 CLI 设置" aria-label="模型设置">
            ${lucideIcon('settings', 'ic ic-sm')}
          </button>
          <button class="icon-btn" id="btn-chat-clear" title="清空对话历史" aria-label="清空对话">
            ${lucideIcon('trash', 'ic ic-sm')}
          </button>
          <button class="icon-btn" id="btn-close-chat" title="收起对话面板 (⌘J)" aria-label="收起面板">
            ${lucideIcon('x', 'ic ic-sm')}
          </button>
        </div>
      </div>

      <!-- Collapsible "1+1" AI API Configuration Box (Stored only in workspace .aimake/ai-config.json) -->
      <div class="chat-settings-drawer" id="chat-settings-box">
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--ink-secondary);font-weight:600;">
          <span>OpenAI 兼容模型（仅存于当前工作区）</span>
          <span id="cfg-ai-status" style="font-size:10.5px;color:var(--ink-muted);">未配置</span>
        </div>
        <div class="chat-preset-row" id="chat-preset-row">
          <button type="button" class="chat-preset-pill" data-ai-preset="deepseek">DeepSeek</button>
          <button type="button" class="chat-preset-pill" data-ai-preset="hunyuan">腾讯混元</button>
          <button type="button" class="chat-preset-pill" data-ai-preset="openai">OpenAI</button>
          <button type="button" class="chat-preset-pill" data-ai-preset="ollama">Ollama 本地</button>
        </div>
        <div class="chat-cfg-row">
          <input class="chat-cfg-input" id="cfg-ai-baseurl" placeholder="Base URL（如 https://api.deepseek.com/v1）" />
          <input class="chat-cfg-input" id="cfg-ai-model" placeholder="模型名" />
        </div>
        <input class="chat-cfg-input" id="cfg-ai-apikey" type="password" placeholder="API Key（sk-...，本地 Ollama 可留空）" />
        <div class="chat-cfg-actions">
          <button type="button" class="btn btn-xs btn-ghost" id="btn-clear-ai-cfg">清除 Key</button>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-xs" id="btn-close-ai-cfg">收起</button>
            <button type="button" class="btn btn-xs btn-primary" id="btn-save-ai-cfg">保存并启用</button>
          </div>
        </div>
      </div>

      <!-- Quick Action Pills Strip (wrapped cleanly with Lucide icons, never clipped) -->
      <div class="chat-pills-strip" id="chat-quick-pills">
        <button class="chat-action-chip" data-chat-intent="extract_quote">${lucideIcon('quote', 'ic ic-sm')} 提炼金句卡片</button>
        <button class="chat-action-chip" data-chat-intent="bento_style">${lucideIcon('layoutGrid', 'ic ic-sm')} 转为 Bento 风格</button>
        <button class="chat-action-chip" data-chat-intent="presentation_outline">${lucideIcon('listOrdered', 'ic ic-sm')} 生成演讲大纲</button>
        <button class="chat-action-chip" data-chat-intent="bilingual_translate">${lucideIcon('globe', 'ic ic-sm')} 翻译为双语</button>
        <button class="chat-action-chip" data-chat-intent="humanize">${lucideIcon('wand', 'ic ic-sm')} 去 AI 味</button>
        <button class="chat-action-chip" data-chat-intent="speech_notes">${lucideIcon('mic', 'ic ic-sm')} 口播逐字稿</button>
        <button class="chat-action-chip" data-chat-intent="insert_block">${lucideIcon('barChart', 'ic ic-sm')} 对比/指标</button>
        <button class="chat-action-chip" data-chat-intent="expand_slide">${lucideIcon('plus', 'ic ic-sm')} 扩充本页</button>
        <button class="chat-action-chip" data-chat-intent="add_slide">${lucideIcon('filePlus', 'ic ic-sm')} 新增幻灯片</button>
      </div>

      <!-- Message History Thread -->
      <div class="chat-messages-wrap" id="chat-messages-list">
        <div class="chat-msg ai">
          <strong>Aimake 对话创作副驾驶</strong>
          <p style="margin:4px 0 0;color:var(--ink-secondary);">
            支持 <strong>OpenAI 兼容 API</strong>（右上角设置）或自动调用本机 <strong>CodeBuddy / Claude / OpenCode / Codex / AGY</strong>。所有改稿无损写回当前页，支持跨重启一键撤销。
          </p>
        </div>
      </div>

      <!-- Input Area with Engine Selector -->
      <div class="chat-input-area">
        <textarea class="chat-input-textarea" id="chat-input" placeholder="输入创作指令（例如：把这页改成三栏对比 / 翻译成英文 / 根据需求新增一页）…" rows="2"></textarea>
        <div class="chat-input-controls">
          <select class="chat-mode-select" id="chat-mode-selector" title="选择 AI 执行引擎">
            <option value="auto">自动选择（API / 本机 CLI）</option>
            <option value="offline">离线快捷工具（去AI味 / 骨架）</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-chat-send">
            <span>发送</span>
            ${lucideIcon('send', 'ic ic-sm')}
          </button>
        </div>
      </div>
    </aside>
  </div>

  <!-- Popover 1: Workspace Switcher -->
  <div class="popover" id="popover-workspace" style="left: 48px; width: 326px;">
    <div class="popover-section-title">当前工作区</div>
    <div style="padding: 2px 8px 8px;">
      <div style="font-size:13px;font-weight:650;" id="pop-ws-name">—</div>
      <div style="font-size:11px;color:var(--ink-muted);word-break:break-all;margin-top:2px;" id="pop-ws-path">—</div>
    </div>
    <div class="popover-sep"></div>
    <div class="popover-section-title">最近工作区</div>
    <div id="recent-workspace-list"></div>
    <div class="popover-sep"></div>
    <button class="nav-item" id="btn-create-workspace-modal">
      <span class="nav-item-title" style="color:var(--accent);font-weight:600;">+ 新建创作工作区（自动预设 7 大闭环 Skill）</span>
    </button>
    <button class="nav-item" id="btn-open-folder-workspace">
      <span class="nav-item-title">打开本地文件夹作为工作区…</span>
    </button>
  </div>

  <!-- Popover 2: Beginner-Friendly AI Studio & Terminal Session Launcher -->
  <div class="popover ai-popover" id="popover-ai">
    <button class="nav-item" id="btn-popover-open-chat" style="background:var(--accent-soft);border-radius:8px;margin-bottom:10px;padding:8px 10px;">
      <span class="nav-item-title" style="color:var(--accent);font-weight:600;display:inline-flex;align-items:center;gap:6px;">${lucideIcon('sparkles', 'ic ic-sm')} 立即在此窗口开启对话创作 (⌘J)</span>
    </button>
    <div class="popover-section-title">
      <span>① 想让 AI 帮你做什么？（点一下即选好）</span>
    </div>
    <div class="recipe-grid" id="ai-recipe-grid"></div>
    <input class="search-input" id="ai-custom-goal" style="height:32px;font-size:12px;margin-bottom:6px;" placeholder="或者用一句话补充你的想法（可选，例如：面向职场新人）…" />

    <div class="popover-sep"></div>
    <div class="popover-section-title">
      <span>② 桌面图形 AI 工具（免终端 · 小白推荐）</span>
    </div>
    <div id="agent-gui-list"></div>

    <div class="popover-sep"></div>
    <div class="popover-section-title">
      <span>③ 终端 AI 会话（自动用所选终端打开）</span>
    </div>
    <div class="terminal-strip" id="terminal-picker-strip" aria-label="选择偏好的终端"></div>
    <div id="agent-cli-list"></div>

    <div class="popover-sep"></div>
    <div style="display:flex; flex-direction:column; gap:6px; padding:2px 2px 0;">
      <div style="display:flex; gap:6px;">
        <button class="btn btn-sm btn-primary" style="flex:1;justify-content:center;" id="btn-copy-ready-cmd" title="复制包含富上下文 prompt 的完整 CLI 运行命令">1-Click 运行命令</button>
        <button class="btn btn-sm btn-ghost" style="flex:1;justify-content:center;" id="btn-copy-ai-prompt" title="仅复制结构化 Prompt">仅复制创作指令</button>
      </div>
      <button class="btn btn-xs btn-ghost" style="width:100%;justify-content:center;" id="btn-sync-workspace-agents">更新本工作区预设 Skill</button>
    </div>
  </div>

  <!-- Popover 3: Custom Locale Picker (No Ugly Native Select!) -->
  <div class="popover" id="popover-locale" style="top:auto; bottom:68px; left:50%; transform:translateX(-50%); min-width:168px; padding:6px;">
    <button class="nav-item" data-pick-locale="zh-CN"><span class="nav-item-title">简体中文</span><span class="nav-item-sub">zh-CN</span></button>
    <button class="nav-item" data-pick-locale="en"><span class="nav-item-title">English</span><span class="nav-item-sub">EN</span></button>
    <button class="nav-item" data-pick-locale="ja"><span class="nav-item-title">日本語</span><span class="nav-item-sub">JA</span></button>
    <button class="nav-item" data-pick-locale="ko"><span class="nav-item-title">한국어</span><span class="nav-item-sub">KO</span></button>
  </div>

  <!-- Popover 4: Aspect Ratio Switcher -->
  <div class="popover" id="popover-aspect" style="top:auto; bottom:68px; left:50%; transform:translateX(-50%); min-width:190px; padding:6px;">
    <div class="popover-section-title">选择画幅比例</div>
    <button class="nav-item" data-pick-aspect="16:9"><span class="nav-item-title">16:9 · 宽屏 PPT / 发布会</span></button>
    <button class="nav-item" data-pick-aspect="3:4"><span class="nav-item-title">3:4 · 小红书 / 知识卡</span></button>
    <button class="nav-item" data-pick-aspect="9:16"><span class="nav-item-title">9:16 · 竖屏短视频 / Reels</span></button>
    <button class="nav-item" data-pick-aspect="1:1"><span class="nav-item-title">1:1 · 正方形海报 / 摘要</span></button>
    <button class="nav-item" data-pick-aspect="4:5"><span class="nav-item-title">4:5 · 社交长图 / 资讯</span></button>
  </div>

  <!-- Drawer Backdrop -->
  <div class="drawer-backdrop" id="drawer-backdrop"></div>

  <!-- Drawer 1: 36-Template Visual Gallery + 2026 Trending Works + 7 Industry Packs -->
  <section class="drawer wide" id="drawer-gallery" aria-label="视觉风格画廊与设计系统">
    <div class="drawer-head">
      <div>
        <h3 class="drawer-title">视觉风格画廊 · 36 套设计模板</h3>
        <p class="drawer-sub">严格遵循 CJK 排版美学与双色主题契约，一键为当前文稿换装</p>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="icon-btn" data-close-drawer aria-label="关闭" title="关闭画廊 (ESC)">
          <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
        </button>
      </div>
    </div>
    <div class="drawer-body">
      <div class="segmented-tabs" id="gallery-mode-tabs">
        <button class="seg-tab active" data-gallery-tab="templates">🎨 全部模板（<span id="gallery-total-badge">36</span>）</button>
        <button class="seg-tab" data-gallery-tab="radar">🔥 实时灵感雷达（<span id="radar-total-badge">16</span>）</button>
        <button class="seg-tab" data-gallery-tab="trending">✨ 2026 时事范例（<span id="trending-total-badge">6</span>）</button>
        <button class="seg-tab" data-gallery-tab="packs">📦 行业套件（<span id="packs-total-badge">7</span>）</button>
      </div>

      <!-- Tab 1: All 36 Visual Templates -->
      <div id="gallery-panel-templates">
        <div class="filter-bar">
          <input class="search-input" id="gallery-search" placeholder="搜索风格关键词（如：苹果便当盒、黄黑大字报、备忘录、莫兰迪、液态玻璃、Risograph、PPT、短视频）…" />
          <div class="chip-row" id="gallery-category-chips">
            <button class="filter-chip active" data-cat="">全部</button>
            <button class="filter-chip" data-cat="xiaohongshu">小红书爆款</button>
            <button class="filter-chip" data-cat="presentation">发布会 / PPT</button>
            <button class="filter-chip" data-cat="wechat">公众号长文</button>
            <button class="filter-chip" data-cat="short-video">竖屏短视频</button>
            <button class="filter-chip" data-cat="linkedin">欧美 / 孔版海报</button>
            <button class="filter-chip" data-cat="education">教育备课</button>
            <button class="filter-chip" data-cat="zukai">日本图解</button>
            <button class="filter-chip" data-cat="cardnews">韩国卡片</button>
          </div>
        </div>
        <div class="gallery-grid" id="gallery-template-grid"></div>
      </div>

      <!-- Tab 2: 2026 Current-News Showcase Works -->
      <div id="gallery-panel-trending" style="display:none;">
        <p style="margin:0 0 14px;font-size:12.5px;color:var(--ink-secondary);line-height:1.55;">
          结合 2026 最新 AI Agent、开源大模型、具身智能与创作者工作流热点制作的真实高质量范例。点击<strong>「导入为我的作品」</strong>即可直接编辑，或点击<strong>「套用同款风格」</strong>瞬间迁移到你的当前文稿。
        </p>
        <div class="gallery-grid" id="gallery-trending-grid"></div>
      </div>

      <!-- Tab 3: 7 Industry Packs -->
      <div id="gallery-panel-packs" style="display:none;">
        <div class="pack-strip" id="gallery-pack-strip"></div>
      </div>

      <!-- Tab 4: Live Inspiration Radar (实时灵感雷达) -->
      <div id="gallery-panel-radar" style="display:none;">
        <p style="margin:0 0 14px;font-size:12.5px;color:var(--ink-secondary);line-height:1.55;">
          聚合全球 X/Twitter、GitHub Trending、知乎、36Kr 实时热点事实。点击卡片右下角<strong>「⚡ 一键制作」</strong>，系统自动匹配最佳模板并在 1 秒内生成完整文稿。
        </p>
        <div class="filter-bar" style="margin-bottom:14px;">
          <div class="chip-row" id="radar-category-chips">
            <button class="filter-chip active" data-radar-cat="all">🔥 全网热榜</button>
            <button class="filter-chip" data-radar-cat="real-discussion">🎯 真实讨论 (last30days)</button>
            <button class="filter-chip" data-radar-cat="prediction">📈 预测市场</button>
            <button class="filter-chip" data-radar-cat="x">𝕏 前沿爆款</button>
            <button class="filter-chip" data-radar-cat="ai-tech">AI & 科技</button>
            <button class="filter-chip" data-radar-cat="social">社交热榜</button>
            <button class="filter-chip" data-radar-cat="creative">创作者经济</button>
            <button class="filter-chip" data-radar-cat="dev">开发者开源</button>
          </div>
        </div>
        <div class="radar-grid" id="gallery-radar-grid"></div>
      </div>
    </div>
  </section>

  <!-- Drawer 2: Export, Narration & Media Delivery (④ 交付) -->
  <section class="drawer" id="drawer-export" aria-label="多模态成品交付">
    <div class="drawer-head">
      <div>
        <h3 class="drawer-title">多模态成品交付</h3>
        <p class="drawer-sub">一份作品，一键输出五种原生平台格式并自动归档</p>
      </div>
      <button class="icon-btn" data-close-drawer aria-label="关闭">
        <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
      </button>
    </div>
    <div class="drawer-body">
      <div class="section-block">
        <h4>图文与文档交付</h4>
        <div class="export-grid">
          <button class="btn btn-primary btn-wide" id="btn-export-wechat">复制公众号富文本 HTML</button>
          <button class="btn" id="btn-export-png">导出 3x 高清图组</button>
          <button class="btn" id="btn-export-pdf">导出矢量 PDF</button>
          <button class="btn btn-wide" id="btn-export-pptx">导出原生可编辑 PPTX</button>
        </div>
      </div>

      <div class="section-block">
        <h4>短视频与口播合成</h4>
        <p>本地确定性帧步进渲染，支持离线合成配音与时间轴字幕。</p>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <label style="flex:1;font-size:11.5px;color:var(--ink-secondary);">
            帧率 (FPS)
            <select id="export-fps" class="search-input" style="height:32px;margin-top:4px;">
              <option value="24">24 fps（电影感）</option>
              <option value="30">30 fps（标准）</option>
              <option value="60">60 fps（丝滑）</option>
            </select>
          </label>
          <label style="flex:1;font-size:11.5px;color:var(--ink-secondary);">
            每页时长（秒）
            <input id="export-sps" type="number" min="1" max="15" value="2" class="search-input" style="height:32px;margin-top:4px;" />
          </label>
        </div>
        <div class="export-grid">
          <button class="btn" id="btn-export-mp4">导出静音 MP4</button>
          <button class="btn btn-primary" id="btn-export-mp4-narrated">导出带配音字幕 MP4</button>
        </div>
      </div>

      <div class="capcut-export-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h4 style="margin:0;display:flex;align-items:center;gap:6px;font-size:13.5px;">
            <span>🎬</span>
            <span>剪映 / CapCut 视频草稿工程</span>
          </h4>
          <span class="status-pill-tiny" id="capcut-install-badge">检测中...</span>
        </div>
        <p style="margin:0 0 12px;font-size:12px;color:var(--ink-secondary);line-height:1.55;">
          一键生成包含完整 6 轨时间轴、微秒级镜头切片与对齐字幕的本地草稿。打开剪映/CapCut 即可在首屏草稿箱中二次微调。
        </p>
        <div class="export-grid">
          <button class="btn btn-primary btn-wide" id="btn-export-capcut-inject">
            ⚡ 一键注入剪映 / CapCut 草稿箱
          </button>
          <button class="btn btn-wide" id="btn-export-capcut-folder">
            📁 导出草稿工程目录至 exports/
          </button>
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h4 style="margin:0;">交付成品预览与闭环归档</h4>
          <button class="btn btn-sm" id="btn-compound-wiki">沉淀到知识库</button>
        </div>
        <div id="export-preview-stage" class="media-preview-box">
          <p style="margin:0;color:var(--ink-muted);">点击左侧「已导出成品」或上方导出按钮，即可在此直接播放视频与预览成图。</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Drawer 3: Contextual Polish, Intake & Power-User Source Editor -->
  <section class="drawer" id="drawer-polish" aria-label="微调、素材与源码">
    <div class="drawer-head">
      <div>
        <h3 class="drawer-title" id="polish-drawer-title">微调与精修</h3>
        <p class="drawer-sub" id="polish-drawer-sub">去 AI 味精修、素材入库与 Markdown 源码直改</p>
      </div>
      <button class="icon-btn" data-close-drawer aria-label="关闭">
        <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
      </button>
    </div>
    <div class="drawer-body">
      <div class="chip-row" style="margin-bottom:14px;">
        <button class="filter-chip active" data-polish-tab="humanize">去 AI 味精修</button>
        <button class="filter-chip" data-polish-tab="intake">收入新素材</button>
        <button class="filter-chip" data-polish-tab="source">源码编辑器 (⌘E)</button>
        <button class="filter-chip" data-polish-tab="wiki">知识库溯源</button>
      </div>

      <div id="polish-panel-humanize">
        <div class="section-block">
          <h4>四语种去 AI 味检查（Humanizer）</h4>
          <p>自动检测并精修空洞排比、过度连接词与模板化营销腔，让文字像真人一样克制有力。</p>
          <div style="display:flex;gap:8px;">
            <button class="btn" id="btn-humanize-audit">先体检评分</button>
            <button class="btn btn-primary" id="btn-humanize-apply">一键精修并应用</button>
          </div>
          <div id="humanize-result" style="margin-top:10px;font-size:12px;color:var(--ink-secondary);line-height:1.55;"></div>
        </div>
      </div>

      <div id="polish-panel-intake" style="display:none;">
        <div class="section-block">
          <h4>收入工作区素材（支持直接拖入文件）</h4>
          <p>粘贴文章、笔记、采访实录或把本地 <code>.md / .txt</code> 文件直接拖入窗口，自动保存到 <code>sources/</code> 并沉淀为工作区知识卡片。</p>
          <label class="field-label" for="intake-title">素材标题</label>
          <input class="search-input" id="intake-title" placeholder="例如：2026 Q3 用户访谈纪要" />
          <label class="field-label" for="intake-source-url">来源链接（可选）</label>
          <input class="search-input" id="intake-source-url" placeholder="https://…" />
          <label class="field-label" for="intake-content">素材正文</label>
          <textarea class="textarea-clean" id="intake-content" placeholder="粘贴原始正文、关键数据或想法碎片…"></textarea>
          <div style="margin-top:10px;display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" id="btn-submit-intake">收入工作区并建立索引</button>
          </div>
        </div>
      </div>

      <div id="polish-panel-source" style="display:none;">
        <textarea class="code-editor" id="markdown-editor" spellcheck="false"></textarea>
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11.5px;color:var(--ink-muted);">修改后直接写回工作区 .deck.md</span>
          <button class="btn btn-primary" id="btn-save-source">保存源码</button>
        </div>
      </div>

      <div id="polish-panel-wiki" style="display:none;">
        <div class="section-block">
          <h4>工作区知识库与引用溯源</h4>
          <div id="wiki-summary-box" style="font-size:12px;color:var(--ink-secondary);line-height:1.6;">正在读取工作区知识库…</div>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn btn-sm" id="btn-wiki-refresh">刷新校验</button>
            <button class="btn btn-sm" id="btn-wiki-visuals">导出知识导图 (Canvas/Mermaid)</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal 1: Command Palette (⌘K) -->
  <div class="modal-backdrop" id="modal-cmdk">
    <div class="cmdk-box">
      <input class="cmdk-input" id="cmdk-input" placeholder="输入命令、切换风格、调整外观或打开功能…" autocomplete="off" />
      <div class="cmdk-list" id="cmdk-list"></div>
    </div>
  </div>

  <!-- Modal 2: Custom New Deck Modal (Zero window.prompt!) -->
  <div class="modal-backdrop" id="modal-new-deck">
    <div class="dialog-box">
      <div class="drawer-head">
        <div>
          <h3 class="drawer-title">新建创作作品</h3>
          <p class="drawer-sub">选一个顺手的起步风格，马上在舞台上直接微调或交给 AI 续写</p>
        </div>
        <button class="icon-btn" data-close-modal aria-label="关闭">
          <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
        </button>
      </div>
      <div class="drawer-body">
        <label class="field-label" for="new-deck-title">作品标题</label>
        <input class="search-input" id="new-deck-title" placeholder="例如：2026 个人创作者 AI 工作流全拆解" />

        <label class="field-label">起步视觉风格</label>
        <div class="preset-grid" id="new-deck-style-grid">
          <button type="button" class="preset-option active" data-new-tpl="xhs-bold-headline">
            <strong>小红书 · 黄黑大字报 (3:4)</strong>
            <span>高点击爆款封面与干货卡片</span>
          </button>
          <button type="button" class="preset-option" data-new-tpl="apple-bento-launch">
            <strong>苹果发布会 · 便当盒 (16:9)</strong>
            <span>产品发布与可编辑 PPTX 演示</span>
          </button>
          <button type="button" class="preset-option" data-new-tpl="xhs-apple-notes">
            <strong>苹果备忘录 · 真诚手记 (3:4)</strong>
            <span>极高完读率的自然手记质感</span>
          </button>
          <button type="button" class="preset-option" data-new-tpl="wechat-deep-report">
            <strong>公众号 · 深度科技研报 (3:4)</strong>
            <span>深蓝金抬头专业深度长文</span>
          </button>
          <button type="button" class="preset-option" data-new-tpl="poster-risograph">
            <strong>Risograph 孔版印刷海报 (4:5)</strong>
            <span>复古双色印刷潮流视觉海报</span>
          </button>
          <button type="button" class="preset-option" data-new-tpl="video-podcast-wave">
            <strong>播客金句声波短片 (9:16)</strong>
            <span>自带声波视觉与竖屏安全字幕区</span>
          </button>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn" data-close-modal>取消</button>
          <button class="btn btn-primary" id="btn-confirm-new-deck">立即创建并打开舞台</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 3: Create Workspace Dialog -->
  <div class="modal-backdrop" id="modal-new-workspace">
    <div class="dialog-box">
      <div class="drawer-head">
        <div>
          <h3 class="drawer-title">新建端到端创作工作区</h3>
          <p class="drawer-sub">将在独立文件夹内实体预设 7 大闭环 Skill，零软链接、零全局污染</p>
        </div>
        <button class="icon-btn" data-close-modal aria-label="关闭">
          <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
        </button>
      </div>
      <div class="drawer-body">
        <label class="field-label" for="new-ws-name">工作区名称</label>
        <input class="search-input" id="new-ws-name" placeholder="例如：2026 新品发布会全案" />

        <label class="field-label" for="new-ws-dir">本地存储路径（可选，留空自动创建在默认工作区目录）</label>
        <div style="display:flex;gap:6px;">
          <input class="search-input" id="new-ws-dir" placeholder="自动在当前工作区同级创建文件夹" />
          <button class="btn" id="btn-pick-new-ws-dir">选择…</button>
        </div>

        <label class="field-label">选择工作区场景预设</label>
        <div class="preset-grid" id="scenario-preset-grid">
          <button type="button" class="preset-option active" data-scenario="creator-growth">
            <strong>自媒体增长专栏</strong>
            <span>小红书 + 公众号爆款闭环与去 AI 味规范</span>
          </button>
          <button type="button" class="preset-option" data-scenario="product-launch">
            <strong>产品发布全案</strong>
            <span>图文首发 + 苹果便当盒 PPT + 60 秒短片</span>
          </button>
          <button type="button" class="preset-option" data-scenario="executive-ppt">
            <strong>高管战略汇报</strong>
            <span>16:9 咨询矩阵与可编辑 PPTX 交付</span>
          </button>
          <button type="button" class="preset-option" data-scenario="educator-course">
            <strong>课程教研备课</strong>
            <span>双语知识闪卡与结构化课堂导学卡</span>
          </button>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn" data-close-modal>取消</button>
          <button class="btn btn-primary" id="btn-confirm-new-workspace">创建并初始化预设 Skill</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 4: Custom Open Local Workspace Dialog (Zero window.prompt!) -->
  <div class="modal-backdrop" id="modal-open-workspace">
    <div class="dialog-box">
      <div class="drawer-head">
        <div>
          <h3 class="drawer-title">打开本地文件夹作为工作区</h3>
          <p class="drawer-sub">仅在该文件夹内写入工作区预设，绝不触碰你电脑里的其他项目</p>
        </div>
        <button class="icon-btn" data-close-modal aria-label="关闭">
          <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
        </button>
      </div>
      <div class="drawer-body">
        <label class="field-label" for="open-ws-dir">工作区文件夹路径</label>
        <div style="display:flex;gap:6px;">
          <input class="search-input" id="open-ws-dir" placeholder="~/AimakeWorkspaces/my-creator-space" />
          <button class="btn" id="btn-pick-open-ws-dir">浏览…</button>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
          <button class="btn" data-close-modal>取消</button>
          <button class="btn btn-primary" id="btn-confirm-open-workspace">打开工作区</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 5: Workspace Preset Skills Inspector -->
  <div class="modal-backdrop" id="modal-skills">
    <div class="dialog-box" style="width:600px;">
      <div class="drawer-head">
        <div>
          <h3 class="drawer-title">工作区实体预设 Skill（零全局污染）</h3>
          <p class="drawer-sub">存放于当前工作区 .agents/skills/ 与 .claude/skills/，升级不覆盖你的手工定制</p>
        </div>
        <button class="icon-btn" data-close-modal aria-label="关闭">
          <svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
        </button>
      </div>
      <div class="drawer-body">
        <div id="skills-inspector-list"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
          <span style="font-size:11.5px;color:var(--ink-muted);" id="skills-zero-symlink-note">0 软链接 · 零全局污染</span>
          <button class="btn btn-primary btn-sm" id="btn-resync-skills">安全同步预设 Skill</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Drag & Drop File Intake Glass Overlay -->
  <div class="drop-overlay" id="drop-overlay">
    <div class="drop-card">
      <strong>松开即可收入当前工作区素材箱</strong>
      <span>支持 Markdown / TXT / 文本笔记，自动保存到 sources/ 并沉淀为知识卡片</span>
    </div>
  </div>

  <div id="toast" role="status" aria-live="polite"></div>
`;

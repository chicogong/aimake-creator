import { lucideIcon } from './icons.js';

export const CALM_STUDIO_SCRIPT = `
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (str) =>
    String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const locText = (val, preferred) => {
    if (typeof val === 'string') return val;
    if (!val || typeof val !== 'object') return '';
    return val[preferred || 'zh'] || val.zh || val['zh-CN'] || val.en || Object.values(val)[0] || '';
  };
  const LOCALE_LABELS = { 'zh-CN': '中文', en: 'EN', ja: '日本語', ko: '한국어' };

  const state = {
    deck: null,
    rawMarkdown: '',
    templates: [],
    activeManifest: null,
    workspaceDir: '',
    activeDeckRel: '',
    workspace: null,
    recentWorkspaces: [],
    skills: null,
    agents: [],
    terminals: [],
    recipes: [],
    trending: [],
    radar: [],
    radarCategory: 'all',
    market: { templates: [], packs: [], installedIds: [] },
    media: [],
    galleryTab: 'templates',
    galleryCategory: '',
    galleryQuery: '',
    selectedScenario: 'creator-growth',
    selectedNewDeckTpl: 'xhs-bold-headline',
    selectedRecipeId: '',
    selectedTerminal: localStorage.getItem('aimake-terminal') || '',
    appearance: localStorage.getItem('aimake-theme') || 'system',
    activeSlideIndex: 0,
    zoomMode: 'fit',
    chatConfig: null,
    chatHistory: [],
    sse: null,
    pickFolderTarget: 'new-ws-dir',
  };

  let toastTimer = null;
  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
  }

  let syncBannerTimer = null;
  function showLiveSyncBanner(msg) {
    const banner = $('live-sync-banner');
    const text = $('live-sync-text');
    const dot = $('live-sync-dot');
    if (text) text.textContent = msg || 'AI 已实时更新工作区作品';
    if (banner) banner.classList.add('show');
    if (dot) {
      dot.classList.remove('pulse');
      void dot.offsetWidth;
      dot.classList.add('pulse');
    }
    clearTimeout(syncBannerTimer);
    syncBannerTimer = setTimeout(() => {
      if (banner) banner.classList.remove('show');
    }, 3400);
  }

  async function apiJson(url, opts) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || '请求失败 (' + res.status + ')');
    }
    return data;
  }

  function applyAppearance(mode) {
    state.appearance = mode || 'system';
    localStorage.setItem('aimake-theme', state.appearance);
    const root = document.documentElement;
    if (state.appearance === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', state.appearance);
    }
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.aimake) {
        window.webkit.messageHandlers.aimake.postMessage({
          action: 'setAppearance',
          mode: state.appearance,
        });
      }
    } catch (_) {}
  }

  function closeAllPopovers() {
    document.querySelectorAll('.popover.open').forEach((el) => el.classList.remove('open'));
  }

  function closeAllDrawers() {
    document.querySelectorAll('.drawer.open').forEach((el) => el.classList.remove('open'));
    const bd = $('drawer-backdrop');
    if (bd) bd.classList.remove('open');
    setActiveLoopStep('stage');
  }

  function openDrawer(drawerId, loopStep) {
    closeAllPopovers();
    document.querySelectorAll('.drawer.open').forEach((el) => el.classList.remove('open'));
    const target = $(drawerId);
    const bd = $('drawer-backdrop');
    if (target) target.classList.add('open');
    if (bd) bd.classList.add('open');
    if (loopStep) setActiveLoopStep(loopStep);
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.open').forEach((el) => el.classList.remove('open'));
  }

  function openModal(modalId) {
    closeAllPopovers();
    closeAllModals();
    const el = $(modalId);
    if (el) el.classList.add('open');
  }

  function togglePopover(popId) {
    const target = $(popId);
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    closeAllPopovers();
    if (!wasOpen) target.classList.add('open');
  }

  function setActiveLoopStep(step) {
    document.querySelectorAll('.loop-step').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-loop-step') === step);
    });
  }

  function updateLoopProgress() {
    const p = state.workspace && state.workspace.pipeline;
    if (!p) return;
    const map = {
      intake: p.sourceCount > 0 || p.wikiCount > 0,
      author: p.deckCount > 0 || p.briefCount > 0,
      stage: p.deckCount > 0,
      deliver: p.exportCount > 0,
    };
    Object.keys(map).forEach((key) => {
      const btn = document.querySelector('[data-loop-step="' + key + '"]');
      if (btn) btn.classList.toggle('done', Boolean(map[key]));
    });
  }

  function reloadPreviewFrame() {
    const frame = $('preview-frame');
    if (!frame) return;
    frame.onload = () => {
      if (state.zoomMode !== 'fit' && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'aimake:zoom', mode: state.zoomMode }, '*');
      }
    };
    frame.src = '/api/preview?t=' + Date.now();
  }

  function focusSlideInFrame(slideIndex) {
    const slides = (state.deck && state.deck.slides) || [];
    if (slides.length > 0) {
      slideIndex = Math.max(0, Math.min(slides.length - 1, slideIndex));
    }
    state.activeSlideIndex = slideIndex;
    renderSlidePills();

    const activePill = document.querySelector('.slide-pill.active');
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    const badge = $('chat-active-slide-badge');
    if (badge) {
      badge.textContent = '当前页 ' + String(slideIndex + 1).padStart(2, '0') + '/' + String(Math.max(1, slides.length)).padStart(2, '0');
    }

    const aspectLabel = $('active-aspect-label');
    if (aspectLabel && state.deck && state.deck.frontmatter) {
      aspectLabel.textContent = state.deck.frontmatter.aspect || '16:9';
    }

    const statusDeck = $('status-deck-name');
    if (statusDeck) {
      statusDeck.textContent = (state.deck && state.deck.frontmatter && state.deck.frontmatter.title) || state.activeDeckRel || '当前作品';
    }
    const statusAspect = $('status-aspect-val');
    if (statusAspect && state.deck && state.deck.frontmatter) {
      statusAspect.textContent = state.deck.frontmatter.aspect || '16:9';
    }
    const statusSlide = $('status-slide-text');
    if (statusSlide) {
      statusSlide.textContent = '第 ' + String(slideIndex + 1).padStart(2, '0') + ' / ' + String(Math.max(1, slides.length)).padStart(2, '0') + ' 页';
    }

    const frame = $('preview-frame');
    if (!frame || !frame.contentWindow) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const slideNodes = doc.querySelectorAll('.aimake-slide');
      slideNodes.forEach((node, idx) => {
        if (idx === slideIndex) {
          node.classList.add('aimake-active-focus');
        } else {
          node.classList.remove('aimake-active-focus');
        }
      });
      const target = slideNodes[slideIndex];
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (_) {}
  }

  function renderSlidePills() {
    const host = $('slide-pills');
    if (!host) return;
    const slides = (state.deck && state.deck.slides) || [];
    if (state.activeSlideIndex >= slides.length) {
      state.activeSlideIndex = Math.max(0, slides.length - 1);
    }
    const html = slides
      .map((s, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const active = idx === state.activeSlideIndex ? ' active' : '';
        return '<button class="slide-pill' + active + '" data-jump-slide="' + idx + '" title="' + esc(s.title || ('第 ' + (idx + 1) + ' 页')) + '">' + num + '</button>';
      })
      .join('');
    host.innerHTML = html || '<span style="font-size:11px;color:var(--ink-muted);padding:0 6px;">01</span>';
  }

  function renderSidebar() {
    const ws = state.workspace;
    const decks = (ws && ws.decks) || [];
    const sources = (ws && ws.sources) || [];
    const exportsList = state.media || [];

    const nameLabel = $('workspace-name-label');
    if (nameLabel) nameLabel.textContent = (ws && ws.config && ws.config.name) || 'Aimake 创作工作区';
    const popName = $('pop-ws-name');
    if (popName) popName.textContent = (ws && ws.config && ws.config.name) || '默认创作工作区';
    const popPath = $('pop-ws-path');
    if (popPath) popPath.textContent = state.workspaceDir || '';

    const dc = $('decks-count');
    if (dc) dc.textContent = decks.length ? '(' + decks.length + ')' : '';
    const sc = $('sources-count');
    if (sc) sc.textContent = sources.length ? '(' + sources.length + ')' : '';
    const ec = $('exports-count');
    if (ec) ec.textContent = exportsList.length ? '(' + exportsList.length + ')' : '';

    const deckListEl = $('deck-list');
    if (deckListEl) {
      if (decks.length === 0) {
        deckListEl.innerHTML = '<div class="nav-empty">暂无作品，点击「+ 新建」或导入时事热点范例</div>';
      } else {
        deckListEl.innerHTML = decks
          .map((d) => {
            const isActive = d.rel === state.activeDeckRel;
            const tplObj = (state.templates || []).find((t) => t.id === d.template);
            const tplShort = tplObj ? locText(tplObj.name).split('·').slice(-1)[0].trim() : (d.template || '作品');
            return (
              '<button class="nav-item' + (isActive ? ' active' : '') + '" data-select-deck="' + esc(d.rel) + '">' +
              '<span class="nav-item-main">' +
              '<span class="nav-item-title">' + esc(d.title || d.name) + '</span>' +
              '<span class="nav-item-sub">' + esc(tplShort + (d.slideCount ? ' · ' + d.slideCount + ' 页' : '')) + '</span>' +
              '</span></button>'
            );
          })
          .join('');
      }
    }

    const sourceListEl = $('source-list');
    if (sourceListEl) {
      if (sources.length === 0) {
        sourceListEl.innerHTML = '<div class="nav-empty">拖入本地文件或点「+ 收入」，AI 创作时自动引用</div>';
      } else {
        sourceListEl.innerHTML = sources
          .slice(0, 12)
          .map((s) => (
            '<button class="nav-item" data-open-wiki="1">' +
            '<span class="nav-item-main">' +
            '<span class="nav-item-title">' + esc(s.name.replace(/\\.md$/i, '')) + '</span>' +
            '<span class="nav-item-sub">' + esc(s.rel) + '</span>' +
            '</span></button>'
          ))
          .join('');
      }
    }

    const exportListEl = $('export-list');
    if (exportListEl) {
      if (exportsList.length === 0) {
        exportListEl.innerHTML = '<div class="nav-empty">导出的高清图、PPTX 与口播视频将自动归档在此</div>';
      } else {
        exportListEl.innerHTML = exportsList
          .slice(0, 10)
          .map((m) => (
            '<button class="nav-item" data-preview-media="' + esc(m.rel) + '" data-media-format="' + esc(m.format) + '">' +
            '<span class="nav-item-main">' +
            '<span class="nav-item-title">' + esc(m.name) + '</span>' +
            '<span class="nav-item-sub">' + esc(m.format.toUpperCase() + ' · ' + Math.max(1, Math.round(m.size / 1024)) + ' KB') + '</span>' +
            '</span></button>'
          ))
          .join('');
      }
    }

    const recentEl = $('recent-workspace-list');
    if (recentEl) {
      const recents = state.recentWorkspaces || [];
      recentEl.innerHTML = recents.length
        ? recents
            .slice(0, 6)
            .map((w) => {
              const active = w.dir === state.workspaceDir;
              return (
                '<button class="nav-item' + (active ? ' active' : '') + '" data-switch-workspace="' + esc(w.dir) + '">' +
                '<span class="nav-item-main">' +
                '<span class="nav-item-title">' + esc(w.name) + '</span>' +
                '<span class="nav-item-sub">' + esc(w.dir) + '</span>' +
                '</span></button>'
              );
            })
            .join('')
        : '<div class="nav-empty">暂无其他最近工作区</div>';
    }

    if (state.skills) {
      const total = state.skills.skills ? state.skills.skills.length : 7;
      const ready = state.skills.skills
        ? state.skills.skills.filter((s) => s.status === 'synced' || s.status === 'customized').length
        : total;
      const summaryEl = $('preset-skill-summary');
      if (summaryEl) summaryEl.textContent = ready + '/' + total + ' 预设 Skill 就绪';
    }

    updateLoopProgress();
  }

  function renderDockMeta() {
    const activeTplId = state.deck && state.deck.frontmatter && state.deck.frontmatter.template;
    const tplObj = (state.templates || []).find((t) => t.id === activeTplId);
    const styleLabel = $('active-style-label');
    if (styleLabel) {
      const tplName = tplObj ? locText(tplObj.name) : '';
      const parts = tplName ? tplName.split('·').map((s) => s.trim()).filter(Boolean) : [];
      styleLabel.textContent = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || activeTplId || '选择风格');
    }
    const locale = (state.deck && state.deck.frontmatter && state.deck.frontmatter.locale) || 'zh-CN';
    const localeLabel = $('active-locale-label');
    if (localeLabel) localeLabel.textContent = LOCALE_LABELS[locale] || locale;

    const aspect = (state.deck && state.deck.frontmatter && state.deck.frontmatter.aspect) || '16:9';
    const aspectLabel = $('active-aspect-label');
    if (aspectLabel) aspectLabel.textContent = aspect;

    const mdEditor = $('markdown-editor');
    if (mdEditor && document.activeElement !== mdEditor) {
      mdEditor.value = state.rawMarkdown || '';
    }
    renderSlidePills();

    const slides = (state.deck && state.deck.slides) || [];
    const badge = $('chat-active-slide-badge');
    if (badge) {
      const idx = Math.min(state.activeSlideIndex, Math.max(0, slides.length - 1));
      badge.textContent =
        '当前页 ' +
        String(idx + 1).padStart(2, '0') +
        '/' +
        String(Math.max(1, slides.length)).padStart(2, '0');
    }
  }

  function renderAgentsPopover() {
    // 1. Beginner Task Recipes
    const recipeGrid = $('ai-recipe-grid');
    if (recipeGrid) {
      const recipes = state.recipes || [];
      recipeGrid.innerHTML = recipes
        .map((r) => {
          const active = state.selectedRecipeId === r.id ? ' active' : '';
          return (
            '<button type="button" class="recipe-chip' + active + '" data-pick-recipe="' + esc(r.id) + '">' +
            '<strong>' + esc(r.titleZh) + '</strong>' +
            '<span>' + esc(r.badgeZh) + '</span>' +
            '</button>'
          );
        })
        .join('');
    }

    // 2. Terminal Selector Strip (Auto-detected Ghostty / Warp / iTerm2 / cmux / WezTerm / Kitty / Terminal)
    const termStrip = $('terminal-picker-strip');
    if (termStrip) {
      const terms = state.terminals || [];
      if (!state.selectedTerminal || !terms.some((t) => t.id === state.selectedTerminal)) {
        const firstInstalled = terms.find((t) => t.installed) || terms[0];
        if (firstInstalled) state.selectedTerminal = firstInstalled.id;
      }
      termStrip.innerHTML = terms
        .map((t) => {
          const active = state.selectedTerminal === t.id ? ' active' : '';
          const dot = t.installed ? '<span class="term-dot"></span>' : '';
          return (
            '<button type="button" class="term-pill' + active + '" data-pick-terminal="' + esc(t.id) + '" title="' + esc(t.descriptionZh) + '">' +
            dot + esc(t.displayName) +
            '</button>'
          );
        })
        .join('');
    }

    // 3. GUI vs Terminal AI Agents
    const agents = state.agents || [];
    const guiAgents = agents.filter((a) => a.launchMode === 'gui-app');
    const cliAgents = agents.filter((a) => a.launchMode !== 'gui-app');

    const renderRow = (a, actionText) => {
      const badge = a.installed
        ? '<span class="status-pill-tiny">已安装</span>'
        : '<span class="status-pill-tiny muted">未检测</span>';
      const isCli = a.launchMode !== 'gui-app';
      const cmdBtn = isCli
        ? '<button type="button" class="btn btn-xs" data-copy-cmd-agent="' + esc(a.id) + '" title="复制包含富上下文 prompt 的完整 CLI 运行命令">1-Click 命令</button>'
        : '';
      return (
        '<div class="agent-row">' +
        '<div class="agent-info">' +
        '<div class="agent-name">' + esc(a.label) + ' ' + badge + '</div>' +
        '<div class="agent-sub">' + esc(a.beginnerHintZh || a.discoveryNote || '') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
        cmdBtn +
        '<button type="button" class="btn btn-xs' + (a.installed ? ' btn-primary' : '') + '" data-launch-agent="' + esc(a.id) + '">' +
        (a.installed ? actionText : '复制指令') +
        '</button></div></div>'
      );
    };

    const guiHost = $('agent-gui-list');
    if (guiHost) guiHost.innerHTML = guiAgents.map((a) => renderRow(a, '直接打开')).join('');

    const cliHost = $('agent-cli-list');
    if (cliHost) cliHost.innerHTML = cliAgents.map((a) => renderRow(a, '打开会话')).join('');
  }

  function switchGalleryTab(tabName) {
    state.galleryTab = tabName;
    document.querySelectorAll('#gallery-mode-tabs .seg-tab').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-gallery-tab') === tabName);
    });
    ['templates', 'trending', 'packs', 'radar'].forEach((t) => {
      const panel = $('gallery-panel-' + t);
      if (panel) panel.style.display = t === tabName ? 'block' : 'none';
    });
    if (tabName === 'radar') {
      fetchAndRenderRadar(state.radarCategory || 'all');
    }
  }

  async function fetchAndRenderRadar(category) {
    const cat = category || 'all';
    state.radarCategory = cat;
    const grid = $('gallery-radar-grid');
    if (!grid) return;
    if (!state.radar || state.radar.length === 0 || cat !== 'all') {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-secondary);"><span class="live-dot" style="display:inline-block;margin-right:8px;"></span>正在连接灵感雷达，聚合全网最新热点…</div>';
      try {
        const res = await apiJson('/api/radar?category=' + encodeURIComponent(cat) + '&limit=16');
        state.radar = res.items || [];
      } catch (err) {
        // Fallback gracefully
      }
    }
    const items = (state.radar || []).filter((it) => cat === 'all' || (it.category || 'ai-tech') === cat);
    const badge = $('radar-total-badge');
    if (badge) badge.textContent = String(items.length);

    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-muted);">暂无匹配热点素材</div>';
      return;
    }

    grid.innerHTML = items.map((it) => {
      return (
        '<div class="radar-card" data-radar-id="' + esc(it.id) + '">' +
        '<div class="radar-card-head">' +
        '<span class="radar-badge-source">' + esc(it.source) + '</span>' +
        '<span class="radar-badge-hot">🔥 ' + esc(it.hotness || 'HOT') + '</span>' +
        '</div>' +
        '<h4 class="radar-title">' + esc(it.title) + '</h4>' +
        '<p class="radar-summary">' + esc(it.summary || '') + '</p>' +
        '<div class="radar-card-foot">' +
        '<span class="radar-template-tag">建议: ' + esc(it.suggestedTemplate || 'apple-bento-launch') + ' (' + esc(it.suggestedAspectRatio || '3:4') + ')</span>' +
        '<button class="btn-radar-make" data-radar-make="' + esc(it.id) + '">⚡ 一键制作</button>' +
        '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderGallery() {
    const templatesAll = state.market.templates || state.templates || [];
    const packs = state.market.packs || [];
    const trending = state.trending || [];

    const tb = $('gallery-total-badge');
    if (tb) tb.textContent = String(templatesAll.length);
    const trb = $('trending-total-badge');
    if (trb) trb.textContent = String(trending.length);
    const pb = $('packs-total-badge');
    if (pb) pb.textContent = String(packs.length);

    // 1. All Visual Templates Grid
    const grid = $('gallery-template-grid');
    if (grid) {
      const q = state.galleryQuery.trim().toLowerCase();
      const cat = state.galleryCategory;
      const activeTplId = state.deck && state.deck.frontmatter && state.deck.frontmatter.template;

      const filtered = templatesAll.filter((t) => {
        if (cat && t.category !== cat) return false;
        if (!q) return true;
        const hay = [t.id, locText(t.name, 'zh'), locText(t.name, 'en'), locText(t.description, 'zh'), t.category, t.styleFamily, ...(t.tags || [])]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });

      grid.innerHTML = filtered
        .map((t) => {
          const isActive = t.id === activeTplId;
          const tName = locText(t.name, 'zh');
          const tDesc = locText(t.description, 'zh');
          return (
            '<article class="tpl-card' + (isActive ? ' active' : '') + '">' +
            '<div class="tpl-thumb-wrap' + (t.aspect === '16:9' ? ' is-wide' : '') + '">' +
            '<img src="/api/templates/thumb/' + encodeURIComponent(t.id) + '.png" alt="' + esc(tName) + '" loading="lazy" />' +
            '<span class="tpl-aspect-tag">' + esc(t.aspect) + '</span>' +
            '</div>' +
            '<div class="tpl-card-body">' +
            '<div class="tpl-card-name">' + esc(tName) + '</div>' +
            '<div class="tpl-card-desc">' + esc(tDesc) + '</div>' +
            '<div class="tpl-card-actions">' +
            '<button class="btn btn-xs btn-primary" data-remix-template="' + esc(t.id) + '">一键做同款</button>' +
            '<button class="btn btn-xs" data-template-id="' + esc(t.id) + '">切换</button>' +
            '</div></div></article>'
          );
        })
        .join('');
    }

    // 2. Timely 2026 Current-News Showcase Works Grid
    const trendingGrid = $('gallery-trending-grid');
    if (trendingGrid) {
      trendingGrid.innerHTML = trending.length
        ? trending
            .map((item) => (
              '<article class="tpl-card">' +
              '<div class="tpl-thumb-wrap' + (item.aspect === '16:9' ? ' is-wide' : '') + '">' +
              '<img src="' + esc(item.previewUrl) + '" alt="' + esc(item.title) + '" loading="lazy" />' +
              '<span class="tpl-hot-tag">' + esc(item.tag || '2026 热点') + '</span>' +
              '<span class="tpl-aspect-tag">' + esc(item.aspect || '3:4') + '</span>' +
              '</div>' +
              '<div class="tpl-card-body">' +
              '<div class="tpl-card-name">' + esc(item.title) + '</div>' +
              '<div class="tpl-card-desc">' + esc(item.summary || item.subtitle || '') + '</div>' +
              '<div class="tpl-card-actions">' +
              '<button class="btn btn-xs btn-primary" data-import-trending="' + esc(item.id) + '">导入为作品</button>' +
              '<button class="btn btn-xs" data-remix-trending="' + esc(item.id) + '">做同款风格</button>' +
              '</div></div></article>'
            ))
            .join('')
        : '<div class="nav-empty">暂无时事范例</div>';
    }

    // 3. Industry Packs Grid
    const packStrip = $('gallery-pack-strip');
    if (packStrip) {
      packStrip.innerHTML = packs
        .map((p) => (
          '<div class="pack-card">' +
          '<div class="pack-card-title">' + esc(locText(p.name, 'zh')) + '</div>' +
          '<div class="pack-card-desc">' + esc(locText(p.description, 'zh')) + '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">' +
          '<span style="font-size:11px;color:var(--ink-muted);">包含 ' + p.templateIds.length + ' 套精品风格</span>' +
          '<button class="btn btn-xs" data-install-pack="' + esc(p.id + '@' + p.version) + '">装配套件</button>' +
          '</div></div>'
        ))
        .join('');
    }
  }

  async function renderSkillsModal() {
    const host = $('skills-inspector-list');
    if (!host) return;
    let report = state.skills;
    if (!report || !report.skills) {
      host.innerHTML = '<div class="nav-empty">正在读取工作区预设 Skill…</div>';
      try {
        const wsRes = await apiJson('/api/workspace');
        if (wsRes && wsRes.skills) {
          state.skills = wsRes.skills;
          report = state.skills;
        }
      } catch (_) {}
    }
    if (!report || !report.skills) {
      host.innerHTML = '<div class="nav-empty">正在读取工作区预设 Skill…</div>';
      return;
    }
    const statusText = {
      synced: '<span class="status-pill-tiny">实体已同步</span>',
      customized: '<span class="status-pill-tiny" style="background:var(--accent-soft);color:var(--accent);">已手工定制</span>',
      outdated: '<span class="status-pill-tiny muted">可安全更新</span>',
      missing: '<span class="status-pill-tiny muted">待写入</span>',
    };
    host.innerHTML = report.skills
      .map((s) => (
        '<div class="agent-row">' +
        '<div class="agent-info">' +
        '<div class="agent-name">' + esc(s.name) + ' ' + (statusText[s.status] || '') + '</div>' +
        '<div class="agent-sub">' + esc(s.description) + '</div>' +
        '</div></div>'
      ))
      .join('');
    const note = $('skills-zero-symlink-note');
    if (note) {
      note.textContent = report.hasSymlinks
        ? '检测到软链接，建议点击右侧重新生成纯实体预设'
        : '已验证：0 软链接 · 仅存在于本工作区 · 不污染全局目录';
    }
  }

  async function refreshState(reloadFrame) {
    const data = await apiJson('/api/state');
    state.deck = data.deck;
    state.rawMarkdown = data.rawMarkdown;
    state.templates = data.templates || [];
    state.activeManifest = data.activeManifest;
    state.workspaceDir = data.workspaceDir || '';
    state.activeDeckRel = data.activeDeckRel || '';
    if (data.workspace) state.workspace = data.workspace;
    renderDockMeta();
    renderSidebar();
    if (reloadFrame !== false) reloadPreviewFrame();
  }

  async function refreshWorkspaceAndEcosystem() {
    const [wsRes, marketRes, mediaRes, trendingRes] = await Promise.all([
      apiJson('/api/workspace').catch(() => null),
      apiJson('/api/market').catch(() => null),
      apiJson('/api/media').catch(() => null),
      apiJson('/api/trending').catch(() => null),
    ]);
    if (wsRes) {
      state.workspace = wsRes.workspace || state.workspace;
      state.recentWorkspaces = wsRes.recentWorkspaces || [];
      state.skills = wsRes.skills || null;
      state.agents = wsRes.agents || [];
      state.terminals = wsRes.terminals || [];
      state.recipes = wsRes.recipes || [];
    }
    if (marketRes) {
      state.market = {
        templates: marketRes.templates || [],
        packs: marketRes.packs || [],
        installedIds: marketRes.installedIds || [],
      };
    }
    if (mediaRes) {
      state.media = mediaRes.items || [];
    }
    if (trendingRes) {
      state.trending = trendingRes.items || [];
    }
    renderSidebar();
    renderAgentsPopover();
    renderGallery();
    renderSkillsModal();
    await loadChatConfig();
  }

  async function refreshWikiOverview() {
    const box = $('wiki-summary-box');
    if (!box) return;
    try {
      const data = await apiJson('/api/wiki/overview');
      const citations = data.citations || { totalCitations: 0, verifiedCount: 0 };
      box.innerHTML =
        '<div>知识节点：<strong>' + (data.graph ? data.graph.nodeCount : 0) + '</strong> 条（来源 ' +
        (data.graph ? data.graph.sourceCount : 0) + ' · 知识卡 ' + (data.graph ? data.graph.knowledgeCount : 0) + '）</div>' +
        '<div>当前作品引用核验：<strong>' + citations.verifiedCount + ' / ' + citations.totalCitations + '</strong> 条已溯源</div>' +
        '<div style="color:var(--ink-muted);margin-top:4px;">路径：' + esc(data.vaultDir || '') + '</div>';
    } catch (err) {
      box.textContent = '读取知识库失败：' + err.message;
    }
  }

  function connectLiveEvents() {
    if (state.sse) {
      try { state.sse.close(); } catch (_) {}
    }
    const es = new EventSource('/api/events');
    state.sse = es;
    es.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'connected') return;
        if (msg.type === 'deck-changed' || msg.type === 'stage-focus') {
          await refreshState(true);
          await refreshWorkspaceAndEcosystem();
          if (typeof msg.slideIndex === 'number') {
            setTimeout(() => focusSlideInFrame(msg.slideIndex), 280);
          }
          showLiveSyncBanner(msg.message || '检测到工作区作品已更新，舞台已实时同步');
        } else if (msg.type === 'workspace-changed') {
          await refreshWorkspaceAndEcosystem();
        }
      } catch (_) {}
    };
  }

  // Preview iframe message bridge (WYSIWYG edits + keyboard navigation)
  window.addEventListener('message', async (ev) => {
    const msg = ev.data;
    if (!msg) return;

    if (msg.type === 'aimake:nav') {
      if (msg.action === 'prev') {
        focusSlideInFrame(state.activeSlideIndex - 1);
      } else if (msg.action === 'next') {
        focusSlideInFrame(state.activeSlideIndex + 1);
      } else if (msg.action === 'escape') {
        closeAllModals();
        closeAllDrawers();
        closeAllPopovers();
        const stageWrap = document.querySelector('.stage-wrap');
        if (stageWrap && stageWrap.classList.contains('fullscreen-mode')) {
          stageWrap.classList.remove('fullscreen-mode');
        }
      } else if (msg.action === 'fullscreen') {
        toggleFullscreenStage();
      }
      return;
    }

    if (msg.type !== 'aimake:edit') return;
    try {
      await apiJson('/api/edit', {
        method: 'POST',
        body: JSON.stringify({
          slideIndex: msg.slideIndex,
          field: msg.field,
          value: msg.value,
        }),
      });
      await refreshState(false);
      showToast('已保存第 ' + (Number(msg.slideIndex || 0) + 1) + ' 页的文字微调');
    } catch (err) {
      showToast('保存失败：' + err.message);
    }
  });

  // Command Palette (⌘K)
  function getCommands() {
    return [
      { label: '打开实时灵感雷达（全网热点 · 一键制作）', kbd: 'RADAR', run: () => { switchGalleryTab('radar'); openDrawer('drawer-gallery', 'stage'); } },
      { label: '浏览 36 套视觉风格画廊 · 一键做同款', kbd: 'G', run: () => { switchGalleryTab('templates'); openDrawer('drawer-gallery', 'stage'); } },
      { label: '打开 2026 时事热点示范成品（4 套）', kbd: 'HOT', run: () => { switchGalleryTab('trending'); openDrawer('drawer-gallery', 'stage'); } },
      { label: '在 AI 工具中创作（选择终端或桌面工具）', kbd: 'A', run: () => togglePopover('popover-ai') },
      { label: '新建创作作品', kbd: '⌘N', run: () => { openModal('modal-new-deck'); setTimeout(() => $('new-deck-title').focus(), 20); } },
      { label: '多模态导出（公众号 / 高清图 / PDF / PPTX / 口播 MP4）', kbd: 'E', run: () => openDrawer('drawer-export', 'deliver') },
      { label: '一键去 AI 味精修（四语种 Humanizer）', kbd: 'H', run: () => { openPolishTab('humanize'); openDrawer('drawer-polish', 'stage'); } },
      { label: '收入新素材到工作区知识库（① 素材入库）', kbd: 'I', run: () => { openPolishTab('intake'); openDrawer('drawer-polish', 'intake'); } },
      { label: '编辑 Markdown 源码 (.deck.md)', kbd: '⌘E', run: () => { openPolishTab('source'); openDrawer('drawer-polish', 'stage'); } },
      { label: '管理工作区实体预设 Skill（零全局污染）', kbd: 'S', run: () => { renderSkillsModal(); openModal('modal-skills'); } },
      { label: '新建端到端创作工作区', kbd: 'W', run: () => openModal('modal-new-workspace') },
      { label: '外观：跟随电脑系统自动切换（推荐）', kbd: '系统', run: () => { applyAppearance('system'); showToast('外观已设为跟随系统'); } },
      { label: '外观：切换为浅色纸感模式', kbd: '浅色', run: () => { applyAppearance('light'); showToast('已切换为浅色模式'); } },
      { label: '外观：切换为深灰暗房模式', kbd: '深色', run: () => { applyAppearance('dark'); showToast('已切换为深色模式'); } },
      { label: '收起 / 展开左侧工作区栏', kbd: '⌘\\\\', run: () => $('shell-body').classList.toggle('sidebar-collapsed') },
    ];
  }

  function renderCmdk(query) {
    const list = $('cmdk-list');
    if (!list) return;
    const q = (query || '').trim().toLowerCase();
    const cmds = getCommands().filter((c) => !q || c.label.toLowerCase().includes(q));
    list.innerHTML = cmds
      .map((c, idx) => (
        '<button class="cmdk-item' + (idx === 0 ? ' focused' : '') + '" data-cmd-idx="' + idx + '">' +
        '<span>' + esc(c.label) + '</span>' +
        '<span class="cmdk-kbd">' + esc(c.kbd) + '</span>' +
        '</button>'
      ))
      .join('');
    list._cmds = cmds;
  }

  function openCmdk() {
    openModal('modal-cmdk');
    const input = $('cmdk-input');
    if (input) {
      input.value = '';
      renderCmdk('');
      setTimeout(() => input.focus(), 20);
    }
  }

  function openPolishTab(tab) {
    document.querySelectorAll('[data-polish-tab]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-polish-tab') === tab);
    });
    ['humanize', 'intake', 'source', 'wiki'].forEach((name) => {
      const panel = $('polish-panel-' + name);
      if (panel) panel.style.display = name === tab ? 'block' : 'none';
    });
    if (tab === 'wiki') refreshWikiOverview();
  }

  function previewExportItem(rel, format) {
    const stage = $('export-preview-stage');
    if (!stage) return;
    const url = '/api/media/file?rel=' + encodeURIComponent(rel);
    if (format === 'mp4') {
      stage.innerHTML = '<video controls preload="metadata" src="' + url + '"></video><div style="font-size:11px;color:var(--ink-muted);margin-top:6px;">' + esc(rel) + '</div>';
    } else if (format === 'png') {
      stage.innerHTML = '<img src="' + url + '" alt="' + esc(rel) + '" /><div style="font-size:11px;color:var(--ink-muted);margin-top:6px;">' + esc(rel) + '</div>';
    } else {
      stage.innerHTML = '<div style="font-size:12px;">已生成成品：<strong>' + esc(rel) + '</strong> <a href="' + url + '" target="_blank" style="color:var(--accent);margin-left:8px;">打开文件</a></div>';
    }
  }

  function triggerButtonFeedback(btn, tempHtml, duration = 2200) {
    if (!btn) return;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = tempHtml;
    btn.classList.add('btn-success-anim');
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = oldHtml;
      btn.classList.remove('btn-success-anim');
      btn.disabled = false;
    }, duration);
  }

  async function copyWeChatRichText(triggerBtn) {
    const origHtml = triggerBtn ? triggerBtn.innerHTML : null;
    if (triggerBtn) {
      triggerBtn.innerHTML = '${lucideIcon('loader', 'ic ic-sm spin')} 正在排版…';
      triggerBtn.classList.add('btn-loading-anim');
    }
    try {
      const res = await apiJson('/api/wechat');
      if (res.html) {
        if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
          const blob = new Blob([res.html], { type: 'text/html' });
          const plainText = res.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const textBlob = new Blob([plainText], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
          ]).catch(async () => {
            await navigator.clipboard.writeText(res.html).catch(() => {});
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(res.html).catch(() => {});
        }
      }
      if (triggerBtn) {
        triggerBtn.classList.remove('btn-loading-anim');
        triggerButtonFeedback(triggerBtn, '${lucideIcon('check', 'ic ic-sm')} 已复制富文本 ✓');
      }
      showToast('已复制微信公众号富文本！已带入内联排版，可直接粘贴至公众号后台');
      return res;
    } catch (err) {
      if (triggerBtn) {
        triggerBtn.classList.remove('btn-loading-anim');
        if (origHtml) triggerBtn.innerHTML = origHtml;
      }
      showToast('公众号复制失败：' + err.message);
      throw err;
    }
  }

  async function runExport(format, narrate) {
    const btnMap = {
      png: $('btn-export-png'),
      pdf: $('btn-export-pdf'),
      pptx: $('btn-export-pptx'),
      mp4: $('btn-export-mp4'),
    };
    const activeBtn = btnMap[format];
    const origHtml = activeBtn ? activeBtn.innerHTML : null;
    if (activeBtn) {
      activeBtn.innerHTML = '${lucideIcon('loader', 'ic ic-sm spin')} 正在生成…';
      activeBtn.classList.add('btn-loading-anim');
    }
    showToast('正在生成 ' + format.toUpperCase() + ' 成品…');
    try {
      const fps = Number(($('export-fps') && $('export-fps').value) || 24);
      const secondsPerSlide = Number(($('export-sps') && $('export-sps').value) || 2);
      const res = await apiJson('/api/export', {
        method: 'POST',
        body: JSON.stringify({ format, fps, secondsPerSlide, narrate }),
      });
      await refreshWorkspaceAndEcosystem();
      if (state.media && state.media.length > 0) {
        previewExportItem(state.media[0].rel, state.media[0].format);
      }
      if (activeBtn) {
        activeBtn.classList.remove('btn-loading-anim');
        triggerButtonFeedback(activeBtn, '${lucideIcon('check', 'ic ic-sm')} 导出成功 ✓');
      }
      showToast('导出完成：已归档至工作区 exports/（' + ((res.artifacts && res.artifacts.length) || 1) + ' 个文件）');
    } catch (err) {
      if (activeBtn) {
        activeBtn.classList.remove('btn-loading-anim');
        if (origHtml) activeBtn.innerHTML = origHtml;
      }
      showToast('导出失败：' + err.message);
    }
  }

  // Topbar & Sidebar Triggers
  $('btn-toggle-sidebar').addEventListener('click', () => {
    $('shell-body').classList.toggle('sidebar-collapsed');
  });
  $('btn-workspace-switcher').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover('popover-workspace');
  });
  $('btn-open-ai').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover('popover-ai');
  });
  const btnPopChat = $('btn-popover-open-chat');
  if (btnPopChat) {
    btnPopChat.addEventListener('click', () => {
      closeAllPopovers();
      toggleChatPanel(true);
    });
  }
  const btnRadar = $('btn-open-radar');
  if (btnRadar) {
    btnRadar.addEventListener('click', () => {
      switchGalleryTab('radar');
      openDrawer('drawer-gallery', 'stage');
    });
  }
  $('btn-open-gallery').addEventListener('click', () => {
    switchGalleryTab('templates');
    openDrawer('drawer-gallery', 'stage');
  });
  $('btn-dock-style').addEventListener('click', () => {
    switchGalleryTab('templates');
    openDrawer('drawer-gallery', 'stage');
  });
  $('btn-open-trending').addEventListener('click', () => {
    switchGalleryTab('trending');
    openDrawer('drawer-gallery', 'stage');
  });
  $('btn-dock-locale').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover('popover-locale');
  });
  $('btn-open-export').addEventListener('click', () => openDrawer('drawer-export', 'deliver'));
  $('btn-open-polish').addEventListener('click', () => {
    openPolishTab('humanize');
    openDrawer('drawer-polish', 'stage');
  });
  $('btn-open-cmdk').addEventListener('click', openCmdk);
  $('btn-open-skills').addEventListener('click', () => {
    renderSkillsModal();
    openModal('modal-skills');
  });

  $('drawer-backdrop').addEventListener('click', closeAllDrawers);
  document.querySelectorAll('[data-close-drawer]').forEach((b) => b.addEventListener('click', closeAllDrawers));
  document.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', closeAllModals));
  document.querySelectorAll('.modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) closeAllModals();
    });
  });

  document.querySelectorAll('.popover').forEach((pop) => {
    pop.addEventListener('click', (e) => e.stopPropagation());
  });

  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('.popover') &&
      !e.target.closest('#btn-workspace-switcher') &&
      !e.target.closest('#btn-open-ai') &&
      !e.target.closest('#btn-dock-locale') &&
      !e.target.closest('#btn-dock-aspect')
    ) {
      closeAllPopovers();
    }
  });

  // Closed-Loop Stepper
  document.querySelectorAll('.loop-step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = btn.getAttribute('data-loop-step');
      if (step === 'intake') {
        openPolishTab('intake');
        openDrawer('drawer-polish', 'intake');
      } else if (step === 'author') {
        setActiveLoopStep('author');
        toggleChatPanel(true);
      } else if (step === 'stage') {
        closeAllDrawers();
        closeAllPopovers();
        setActiveLoopStep('stage');
      } else if (step === 'deliver') {
        openDrawer('drawer-export', 'deliver');
      }
    });
  });

  // Tactile Stage Slide Operations (+ 加页 / 复制 / 删除)
  $('slide-pills').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-jump-slide]');
    if (!btn) return;
    focusSlideInFrame(Number(btn.getAttribute('data-jump-slide')));
  });

  $('btn-add-slide').addEventListener('click', async () => {
    try {
      const res = await apiJson('/api/slides/add', {
        method: 'POST',
        body: JSON.stringify({ afterIndex: state.activeSlideIndex }),
      });
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      setTimeout(() => focusSlideInFrame(res.slideIndex), 250);
      showToast('已新增第 ' + (res.slideIndex + 1) + ' 页，点击文字即可直接改写');
    } catch (err) {
      showToast('新增页面失败：' + err.message);
    }
  });

  $('btn-dup-slide').addEventListener('click', async () => {
    try {
      const res = await apiJson('/api/slides/duplicate', {
        method: 'POST',
        body: JSON.stringify({ slideIndex: state.activeSlideIndex }),
      });
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      setTimeout(() => focusSlideInFrame(res.slideIndex), 250);
      showToast('已复制当前页为第 ' + (res.slideIndex + 1) + ' 页');
    } catch (err) {
      showToast('复制失败：' + err.message);
    }
  });

  $('btn-del-slide').addEventListener('click', async () => {
    try {
      const res = await apiJson('/api/slides/delete', {
        method: 'POST',
        body: JSON.stringify({ slideIndex: state.activeSlideIndex }),
      });
      state.activeSlideIndex = res.slideIndex;
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      showToast('已删除该页（剩余 ' + res.slideCount + ' 页）');
    } catch (err) {
      showToast(err.message);
    }
  });

  // Prev / Next slide navigation in dock
  const btnPrev = $('btn-prev-slide');
  if (btnPrev) btnPrev.addEventListener('click', () => focusSlideInFrame(state.activeSlideIndex - 1));
  const btnNext = $('btn-next-slide');
  if (btnNext) btnNext.addEventListener('click', () => focusSlideInFrame(state.activeSlideIndex + 1));

  // Aspect Ratio Popover
  const btnAspect = $('btn-dock-aspect');
  if (btnAspect) {
    btnAspect.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePopover('popover-aspect');
    });
  }

  const popoverAspect = $('popover-aspect');
  if (popoverAspect) {
    popoverAspect.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-pick-aspect]');
      if (!btn) return;
      const aspect = btn.getAttribute('data-pick-aspect');
      try {
        await apiJson('/api/stage/aspect', {
          method: 'POST',
          body: JSON.stringify({ aspect }),
        });
        const aspectLabel = $('active-aspect-label');
        if (aspectLabel) aspectLabel.textContent = aspect;
        closeAllPopovers();
        await refreshState(true);
        showToast('画布画幅已切换为 ' + aspect);
      } catch (err) {
        showToast('切换画幅比例失败: ' + err.message);
      }
    });
  }

  // Zoom mode toggle (fit <-> 100%)
  const btnDockZoom = $('btn-dock-zoom');
  if (btnDockZoom) {
    btnDockZoom.addEventListener('click', () => {
      state.zoomMode = state.zoomMode === 'fit' ? '1' : 'fit';
      btnDockZoom.textContent = state.zoomMode === 'fit' ? '自适应' : '100%';
      const frame = $('preview-frame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'aimake:zoom', mode: state.zoomMode }, '*');
      }
    });
  }

  // Fullscreen presentation
  const btnFullscreen = $('btn-dock-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreenStage);
  }
  function toggleFullscreenStage() {
    const stageWrap = document.querySelector('.stage-wrap');
    if (!stageWrap) return;
    stageWrap.classList.toggle('fullscreen-mode');
    const isFull = stageWrap.classList.contains('fullscreen-mode');
    showToast(isFull ? '进入全屏演示模式（按 F 或 ESC 退出）' : '已退出全屏');
  }

  // =======================================================================
  // IN-STUDIO AI CHAT CO-PILOT ("1+1" Real AI API / CLI + Disk Rollback)
  // =======================================================================
  function toggleChatPanel(forceOpen) {
    const panel = $('chat-panel');
    if (!panel) return;
    if (typeof forceOpen === 'boolean') {
      panel.classList.toggle('collapsed', !forceOpen);
    } else {
      panel.classList.toggle('collapsed');
    }
    const isCollapsed = panel.classList.contains('collapsed');
    const btnToggle = $('btn-toggle-chat');
    if (btnToggle) btnToggle.classList.toggle('active', !isCollapsed);
    if (!isCollapsed) {
      const chatInput = $('chat-input');
      if (chatInput) setTimeout(() => chatInput.focus(), 150);
    }
  }

  function openChatSettings(forceOpen) {
    const box = $('chat-settings-box');
    if (!box) return;
    if (typeof forceOpen === 'boolean') {
      box.classList.toggle('open', forceOpen);
    } else {
      box.classList.toggle('open');
    }
  }

  async function loadChatConfig() {
    try {
      const cfg = await apiJson('/api/chat/config');
      state.chatConfig = cfg;

      const select = $('chat-mode-selector');
      if (select) {
        const opts = [];
        opts.push(
          '<option value="auto">自动（' + esc(cfg.activeSummary || '未配置') + '）</option>'
        );
        if (cfg.api && cfg.api.model) {
          opts.push(
            '<option value="api">直连 API · ' + esc(cfg.api.model) + '</option>'
          );
        }
        (cfg.detectedClis || []).forEach((cli) => {
          opts.push(
            '<option value="cli:' + esc(cli.id) + '">本机 ' + esc(cli.label) + '</option>'
          );
        });
        opts.push('<option value="offline">离线快捷工具（去AI味 / 骨架）</option>');
        select.innerHTML = opts.join('');

        const desired = cfg.preferredBackend || 'auto';
        const hasOption = Array.from(select.options).some((o) => o.value === desired);
        select.value = hasOption ? desired : 'auto';
      }

      if (cfg.api) {
        if ($('cfg-ai-baseurl')) $('cfg-ai-baseurl').value = cfg.api.baseUrl || '';
        if ($('cfg-ai-model')) $('cfg-ai-model').value = cfg.api.model || '';
        const keyInput = $('cfg-ai-apikey');
        if (keyInput) {
          keyInput.value = '';
          keyInput.placeholder = cfg.api.hasApiKey
            ? '已保存 (' + cfg.api.apiKeyMasked + ')，留空保持不变'
            : 'API Key（sk-...，本地 Ollama 可留空）';
        }
      }
      const statusEl = $('cfg-ai-status');
      if (statusEl) {
        statusEl.textContent = cfg.activeSummary || '未配置';
        statusEl.style.color =
          (cfg.api && cfg.api.hasApiKey) || (cfg.detectedClis && cfg.detectedClis.length > 0)
            ? 'var(--live)'
            : 'var(--ink-muted)';
      }
    } catch (_) {}
  }

  const btnToggleChat = $('btn-toggle-chat');
  if (btnToggleChat) btnToggleChat.addEventListener('click', () => toggleChatPanel());
  const btnCloseChat = $('btn-close-chat');
  if (btnCloseChat) btnCloseChat.addEventListener('click', () => toggleChatPanel(false));
  const btnChatSettings = $('btn-chat-settings');
  if (btnChatSettings) btnChatSettings.addEventListener('click', () => openChatSettings());
  const btnCloseAiCfg = $('btn-close-ai-cfg');
  if (btnCloseAiCfg) btnChatSettings && btnCloseAiCfg.addEventListener('click', () => openChatSettings(false));

  const presetRow = $('chat-preset-row');
  if (presetRow) {
    presetRow.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-ai-preset]');
      if (!pill || !state.chatConfig || !state.chatConfig.presets) return;
      const pid = pill.getAttribute('data-ai-preset');
      const preset = state.chatConfig.presets.find((p) => p.id === pid);
      if (!preset) return;
      if ($('cfg-ai-baseurl')) $('cfg-ai-baseurl').value = preset.baseUrl;
      if ($('cfg-ai-model')) $('cfg-ai-model').value = preset.defaultModel;
      document.querySelectorAll('.chat-preset-pill').forEach((el) => {
        el.classList.toggle('active', el === pill);
      });
      if (preset.requiresKey && $('cfg-ai-apikey')) {
        $('cfg-ai-apikey').focus();
      }
    });
  }

  const btnSaveAiCfg = $('btn-save-ai-cfg');
  if (btnSaveAiCfg) {
    btnSaveAiCfg.addEventListener('click', async () => {
      const baseUrl = ($('cfg-ai-baseurl') && $('cfg-ai-baseurl').value.trim()) || '';
      const model = ($('cfg-ai-model') && $('cfg-ai-model').value.trim()) || '';
      const apiKey = ($('cfg-ai-apikey') && $('cfg-ai-apikey').value.trim()) || '';
      try {
        await apiJson('/api/chat/config', {
          method: 'POST',
          body: JSON.stringify({
            baseUrl,
            model,
            apiKey: apiKey || undefined,
            preferredBackend: baseUrl && model ? 'api' : 'auto',
          }),
        });
        await loadChatConfig();
        openChatSettings(false);
        showToast('模型配置已加密保存至当前工作区');
      } catch (err) {
        showToast('保存配置失败：' + err.message);
      }
    });
  }

  const btnClearAiCfg = $('btn-clear-ai-cfg');
  if (btnClearAiCfg) {
    btnClearAiCfg.addEventListener('click', async () => {
      try {
        await apiJson('/api/chat/config', {
          method: 'POST',
          body: JSON.stringify({ clearApiKey: true, preferredBackend: 'auto' }),
        });
        await loadChatConfig();
        showToast('已清除保存的 API Key');
      } catch (err) {
        showToast('清除失败：' + err.message);
      }
    });
  }

  const btnClearChat = $('btn-chat-clear');
  if (btnClearChat) {
    btnClearChat.addEventListener('click', () => {
      state.chatHistory = [];
      const list = $('chat-messages-list');
      if (list) {
        list.innerHTML =
          '<div class="chat-msg ai"><strong>已清空历史对话。</strong><p style="margin:4px 0 0;color:var(--ink-secondary);">输入新指令或点击快捷按钮继续创作。</p></div>';
      }
    });
  }

  // Quick Action Chips in Chat
  const quickPills = $('chat-quick-pills');
  if (quickPills) {
    quickPills.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-chat-intent]');
      if (!chip) return;
      const intent = chip.getAttribute('data-chat-intent');
      const label = chip.textContent.trim();
      sendChatMessage(label, intent);
    });
  }

  // Chat Send
  const btnSendChat = $('btn-chat-send');
  const chatInput = $('chat-input');
  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', () => {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      sendChatMessage(text);
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        sendChatMessage(text);
      }
    });
  }

  async function sendChatMessage(message, explicitIntent) {
    const list = $('chat-messages-list');
    if (!list) return;

    toggleChatPanel(true);

    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = message;
    list.appendChild(userDiv);

    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg ai';
    aiDiv.innerHTML =
      '<div class="chat-progressive-phases">' +
      '<span class="live-dot pulse"></span>' +
      '<span class="phase-text">🔍 正在解析当前页上下文与作品大纲…</span>' +
      '</div>';
    list.appendChild(aiDiv);
    list.scrollTop = list.scrollHeight;

    const phaseTimer = setTimeout(() => {
      const p = aiDiv.querySelector('.phase-text');
      if (p) p.textContent = '⚡ 正在调度 AI 引擎生成结构化内容…';
    }, 450);
    const phaseTimer2 = setTimeout(() => {
      const p = aiDiv.querySelector('.phase-text');
      if (p) p.textContent = '🎨 正在编译 .deck.md 节点语法并优化排版…';
    }, 1100);

    const modeSelector = $('chat-mode-selector');
    const backend = (modeSelector && modeSelector.value) || 'auto';

    try {
      const res = await apiJson('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          intent: explicitIntent,
          activeSlideIndex: state.activeSlideIndex,
          backend,
          history: state.chatHistory.slice(-6),
        }),
      });
      clearTimeout(phaseTimer);
      clearTimeout(phaseTimer2);

      state.chatHistory.push({ role: 'user', content: message });
      state.chatHistory.push({ role: 'assistant', content: res.changeSummary || res.message });
      if (state.chatHistory.length > 16) state.chatHistory = state.chatHistory.slice(-12);

      // Progressive typing reveal of response text for natural responsive feel
      let baseHtml = '';
      if (res.engineUsed) {
        baseHtml += '<div class="chat-engine-tag">' + esc(res.engineUsed) + '</div>';
      }
      aiDiv.innerHTML = baseHtml + '<div class="chat-text-stream"><span class="typing-cursor"></span></div>';
      list.scrollTop = list.scrollHeight;

      const fullText = res.message || '';
      const textContainer = aiDiv.querySelector('.chat-text-stream');

      if (window.__E2E__ || navigator.webdriver) {
        if (textContainer) {
          textContainer.innerHTML = esc(fullText).replace(/\\n/g, '<br/>');
        }
      } else {
        await new Promise((resolve) => {
          let charIdx = 0;
          const step = Math.max(1, Math.floor(fullText.length / 28));
          const interval = setInterval(() => {
            charIdx += step;
            if (charIdx >= fullText.length) {
              clearInterval(interval);
              if (textContainer) {
                textContainer.innerHTML = esc(fullText).replace(/\\n/g, '<br/>');
              }
              resolve();
            } else {
              if (textContainer) {
                textContainer.innerHTML = esc(fullText.slice(0, charIdx)).replace(/\\n/g, '<br/>') + '<span class="typing-cursor"></span>';
              }
              list.scrollTop = list.scrollHeight;
            }
          }, 18);
        });
      }

      let aiExtraHtml = '';

      if (res.needsAiSetup) {
        aiExtraHtml +=
          '<div style="margin-top:8px;"><button type="button" class="btn btn-xs btn-primary" data-open-chat-settings="1">配置模型 Key / 选择 CLI</button></div>';
      }

      if (res.changeSummary) {
        const diffRows = Array.isArray(res.diffLines) && res.diffLines.length > 0
          ? '<div class="chat-diff-lines">' +
            res.diffLines
              .map((line) => {
                const cls = line.startsWith('+')
                  ? 'chat-diff-line-add'
                  : line.startsWith('-')
                    ? 'chat-diff-line-del'
                    : '';
                return '<div class="' + cls + '">' + esc(line) + '</div>';
              })
              .join('') +
            '</div>'
          : '<div class="chat-diff-lines"><span style="color:var(--ink-muted);">~ 页面排版已调整</span></div>';

        const beforeText = res.beforeSlideMd || '(原焦点页无内容)';
        const afterText = res.afterSlideMd || '(AI 生成内容)';

        const sideBySideHtml =
          '<div class="chat-diff-side-by-side">' +
          '<div class="chat-diff-side-col before"><div class="chat-diff-col-head before">改动前 (Before)</div>' +
          esc(beforeText) +
          '</div>' +
          '<div class="chat-diff-side-col after"><div class="chat-diff-col-head after">改动后 (After)</div>' +
          esc(afterText) +
          '</div>' +
          '</div>';

        aiExtraHtml +=
          '<div class="chat-diff-card" data-diff-box="1">' +
          '<div class="chat-diff-head">' +
          '<div class="chat-diff-title-wrap">' +
          '<span class="chat-diff-badge">AI 改稿对比</span>' +
          '<span class="chat-diff-text">' + esc(res.changeSummary) + '</span>' +
          '</div>' +
          '<div class="chat-diff-view-toggle">' +
          '<button type="button" class="chat-diff-tab active" data-diff-tab="inline">内联</button>' +
          '<button type="button" class="chat-diff-tab" data-diff-tab="side">并排</button>' +
          '</div>' +
          '</div>' +
          '<div class="chat-diff-body">' +
          '<div class="chat-diff-view-inline">' + diffRows + '</div>' +
          '<div class="chat-diff-view-side" style="display:none;">' + sideBySideHtml + '</div>' +
          '</div>' +
          '<div class="chat-diff-foot">' +
          '<div class="chat-diff-actions">' +
          (res.revisionId
            ? '<button type="button" class="chat-apply-btn" data-apply-id="' + esc(res.revisionId) + '">一键应用</button>' +
              '<button type="button" class="chat-revert-btn chat-rollback-btn" data-rollback-id="' + esc(res.revisionId) + '">还原</button>'
            : '<span class="chat-status-pill applied">已直接生效</span>') +
          '</div>' +
          '<span class="chat-status-pill applied" data-diff-status="1">已更新当前页</span>' +
          '</div>' +
          '</div>';
      }

      if (res.suggestedActions && res.suggestedActions.length > 0) {
        aiExtraHtml +=
          '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">' +
          res.suggestedActions
            .map(
              (act) =>
                '<button class="chat-action-chip" style="font-size:10.5px;padding:2px 7px;" data-suggest-action="' +
                esc(act) +
                '">' +
                esc(act) +
                '</button>'
            )
            .join('') +
          '</div>';
      }

      const extraDiv = document.createElement('div');
      extraDiv.innerHTML = aiExtraHtml;
      aiDiv.appendChild(extraDiv);
      list.scrollTop = list.scrollHeight;

      if (typeof res.affectedSlideIndex === 'number') {
        await refreshState(true);
        setTimeout(() => focusSlideInFrame(res.affectedSlideIndex), 220);
        showToast(res.changeSummary || 'AI 创作完成');
      } else if (!res.needsAiSetup) {
        await refreshState(true);
        showToast(res.changeSummary || 'AI 创作完成');
      }
    } catch (err) {
      clearTimeout(phaseTimer);
      clearTimeout(phaseTimer2);
      aiDiv.innerHTML = '<span style="color:var(--hot);">❌ 执行失败：' + esc(err.message) + '</span>';
      list.scrollTop = list.scrollHeight;
    }
  }

  // Rollback, Apply, Diff Toggle, Setup Trigger & Suggested Actions Listeners
  document.addEventListener('click', async (e) => {
    const diffTab = e.target.closest('[data-diff-tab]');
    if (diffTab) {
      const card = diffTab.closest('[data-diff-box]');
      if (card) {
        const mode = diffTab.getAttribute('data-diff-tab');
        card.querySelectorAll('.chat-diff-tab').forEach((t) => t.classList.toggle('active', t === diffTab));
        const inlineView = card.querySelector('.chat-diff-view-inline');
        const sideView = card.querySelector('.chat-diff-view-side');
        if (inlineView) inlineView.style.display = mode === 'inline' ? 'block' : 'none';
        if (sideView) sideView.style.display = mode === 'side' ? 'block' : 'none';
      }
      return;
    }

    const applyBtn = e.target.closest('[data-apply-id]');
    if (applyBtn) {
      const card = applyBtn.closest('[data-diff-box]');
      const statusPill = card && card.querySelector('[data-diff-status]');
      const revId = applyBtn.getAttribute('data-apply-id');
      try {
        await apiJson('/api/chat/apply', {
          method: 'POST',
          body: JSON.stringify({ revisionId: revId }),
        });
        if (statusPill) {
          statusPill.textContent = '已确认应用';
          statusPill.className = 'chat-status-pill applied';
        }
        applyBtn.textContent = '已应用';
        applyBtn.style.opacity = '0.7';
        await refreshState(true);
        showToast('已确认应用修改并同步至舞台');
      } catch (err) {
        showToast('应用修改失败：' + err.message);
      }
      return;
    }

    const setupBtn = e.target.closest('[data-open-chat-settings]');
    if (setupBtn) {
      toggleChatPanel(true);
      openChatSettings(true);
      if ($('cfg-ai-apikey')) setTimeout(() => $('cfg-ai-apikey').focus(), 80);
      return;
    }

    const suggestBtn = e.target.closest('[data-suggest-action]');
    if (suggestBtn) {
      const actionText = suggestBtn.getAttribute('data-suggest-action');
      sendChatMessage(actionText);
      return;
    }

    const rollbackBtn = e.target.closest('[data-rollback-id]');
    if (!rollbackBtn) return;
    const card = rollbackBtn.closest('[data-diff-box]');
    const statusPill = card && card.querySelector('[data-diff-status]');
    const applyBtnSibling = card && card.querySelector('[data-apply-id]');
    const revId = rollbackBtn.getAttribute('data-rollback-id');
    try {
      const res = await apiJson('/api/chat/rollback', {
        method: 'POST',
        body: JSON.stringify({ revisionId: revId }),
      });
      rollbackBtn.disabled = true;
      rollbackBtn.textContent = '已还原';
      rollbackBtn.style.opacity = '0.5';
      if (applyBtnSibling) {
        applyBtnSibling.textContent = '重新应用';
        applyBtnSibling.style.opacity = '1';
      }
      if (statusPill) {
        statusPill.textContent = '已还原上一版';
        statusPill.className = 'chat-status-pill reverted';
      }
      await refreshState(true);
      showToast(res.message || '已成功还原修改');
    } catch (err) {
      showToast('撤销回滚失败：' + err.message);
    }
  });

  // Unified Global Keyboard Shortcuts (Single Listener - Zero Duplicates)
  window.addEventListener('keydown', (e) => {
    const target = e.target;
    const isInput =
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      toggleChatPanel();
      return;
    }
    if (mod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      openPolishTab('source');
      openDrawer('drawer-polish', 'stage');
      return;
    }
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCmdk();
      return;
    }
    if (mod && e.key === '\\\\') {
      e.preventDefault();
      $('shell-body').classList.toggle('sidebar-collapsed');
      return;
    }
    if (e.key === 'Escape') {
      closeAllModals();
      closeAllDrawers();
      closeAllPopovers();
      const stageWrap = document.querySelector('.stage-wrap');
      if (stageWrap && stageWrap.classList.contains('fullscreen-mode')) {
        stageWrap.classList.remove('fullscreen-mode');
      }
      return;
    }

    if (!isInput) {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusSlideInFrame(state.activeSlideIndex - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        focusSlideInFrame(state.activeSlideIndex + 1);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreenStage();
      }
    }
  });

  // Custom Locale Popover
  $('popover-locale').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-pick-locale]');
    if (!btn) return;
    const loc = btn.getAttribute('data-pick-locale');
    closeAllPopovers();
    try {
      await apiJson('/api/meta', {
        method: 'POST',
        body: JSON.stringify({ locale: loc }),
      });
      await refreshState(true);
      showToast('作品语言已切换为 ' + (LOCALE_LABELS[loc] || loc));
    } catch (err) {
      showToast('切换语言失败：' + err.message);
    }
  });

  // Custom New Deck Modal (Zero window.prompt!)
  $('btn-new-deck').addEventListener('click', () => {
    $('new-deck-title').value = '';
    openModal('modal-new-deck');
    setTimeout(() => $('new-deck-title').focus(), 20);
  });

  $('new-deck-style-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-new-tpl]');
    if (!btn) return;
    state.selectedNewDeckTpl = btn.getAttribute('data-new-tpl');
    document.querySelectorAll('#new-deck-style-grid .preset-option').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
  });

  $('btn-confirm-new-deck').addEventListener('click', async () => {
    const title = ($('new-deck-title').value || '').trim() || '新创作分镜';
    try {
      await apiJson('/api/workspace/deck/create', {
        method: 'POST',
        body: JSON.stringify({ title, template: state.selectedNewDeckTpl }),
      });
      closeAllModals();
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      showToast('已新建作品「' + title + '」');
    } catch (err) {
      showToast('新建作品失败：' + err.message);
    }
  });

  $('btn-add-source').addEventListener('click', () => {
    openPolishTab('intake');
    openDrawer('drawer-polish', 'intake');
  });

  $('btn-refresh-exports').addEventListener('click', async () => {
    await refreshWorkspaceAndEcosystem();
    showToast('已刷新成品列表');
  });

  $('deck-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-select-deck]');
    if (!btn) return;
    const rel = btn.getAttribute('data-select-deck');
    try {
      await apiJson('/api/workspace/deck/select', {
        method: 'POST',
        body: JSON.stringify({ rel }),
      });
      state.activeSlideIndex = 0;
      await refreshState(true);
      showToast('已切换作品');
    } catch (err) {
      showToast('切换作品失败：' + err.message);
    }
  });

  $('source-list').addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-wiki]')) return;
    openPolishTab('wiki');
    openDrawer('drawer-polish', 'intake');
  });

  $('export-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preview-media]');
    if (!btn) return;
    openDrawer('drawer-export', 'deliver');
    previewExportItem(btn.getAttribute('data-preview-media'), btn.getAttribute('data-media-format'));
  });

  // Workspace Switcher & Custom Modals (Zero window.prompt!)
  $('recent-workspace-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-switch-workspace]');
    if (!btn) return;
    const dir = btn.getAttribute('data-switch-workspace');
    closeAllPopovers();
    try {
      await apiJson('/api/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceDir: dir }),
      });
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      showToast('已切换工作区');
    } catch (err) {
      showToast('切换工作区失败：' + err.message);
    }
  });

  $('btn-create-workspace-modal').addEventListener('click', () => {
    openModal('modal-new-workspace');
    setTimeout(() => $('new-ws-name').focus(), 20);
  });

  $('btn-open-folder-workspace').addEventListener('click', () => {
    $('open-ws-dir').value = state.workspaceDir || '';
    openModal('modal-open-workspace');
    setTimeout(() => $('open-ws-dir').focus(), 20);
  });

  $('scenario-preset-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scenario]');
    if (!btn) return;
    state.selectedScenario = btn.getAttribute('data-scenario');
    document.querySelectorAll('#scenario-preset-grid .preset-option').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
  });

  function triggerNativeFolderPicker(targetInputId) {
    state.pickFolderTarget = targetInputId;
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.aimake) {
        window.webkit.messageHandlers.aimake.postMessage({ action: 'pickFolder', target: targetInputId });
        return;
      }
    } catch (_) {}
    showToast('请在输入框填写本地目录路径，或在原生 Aimake.app 中点击弹出系统目录选择框');
  }

  $('btn-pick-new-ws-dir').addEventListener('click', () => triggerNativeFolderPicker('new-ws-dir'));
  $('btn-pick-open-ws-dir').addEventListener('click', () => triggerNativeFolderPicker('open-ws-dir'));

  window.__aimakePickedFolder = (folderPath) => {
    const target = $(state.pickFolderTarget || 'new-ws-dir');
    if (target && folderPath) target.value = folderPath;
  };

  $('btn-confirm-new-workspace').addEventListener('click', async () => {
    const name = ($('new-ws-name').value || '').trim();
    const workspaceDir = ($('new-ws-dir').value || '').trim();
    if (!name) {
      showToast('请输入工作区名称');
      return;
    }
    try {
      await apiJson('/api/workspace/create', {
        method: 'POST',
        body: JSON.stringify({
          name,
          workspaceDir: workspaceDir || undefined,
          scenario: state.selectedScenario,
        }),
      });
      closeAllModals();
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      showToast('已创建工作区「' + name + '」并实体预设 7 大闭环 Skill');
    } catch (err) {
      showToast('创建工作区失败：' + err.message);
    }
  });

  $('btn-confirm-open-workspace').addEventListener('click', async () => {
    const dir = ($('open-ws-dir').value || '').trim();
    if (!dir) {
      showToast('请输入或选择本地文件夹路径');
      return;
    }
    try {
      await apiJson('/api/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceDir: dir, initIfMissing: true }),
      });
      closeAllModals();
      await refreshState(true);
      await refreshWorkspaceAndEcosystem();
      showToast('已打开工作区');
    } catch (err) {
      showToast('打开失败：' + err.message);
    }
  });

  // Beginner-Friendly AI Studio Launcher (Recipes + Terminal Picker + GUI/CLI Launch)
  $('ai-recipe-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick-recipe]');
    if (!btn) return;
    const id = btn.getAttribute('data-pick-recipe');
    state.selectedRecipeId = state.selectedRecipeId === id ? '' : id;
    renderAgentsPopover();
  });

  $('terminal-picker-strip').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick-terminal]');
    if (!btn) return;
    state.selectedTerminal = btn.getAttribute('data-pick-terminal');
    localStorage.setItem('aimake-terminal', state.selectedTerminal);
    renderAgentsPopover();
    showToast('已将默认终端设为 ' + btn.textContent.trim());
  });

  async function launchSelectedAgent(host) {
    const goal = ($('ai-custom-goal') && $('ai-custom-goal').value.trim()) || undefined;
    try {
      const res = await apiJson('/api/workspace/agents/launch', {
        method: 'POST',
        body: JSON.stringify({
          host,
          terminal: state.selectedTerminal || undefined,
          recipeId: state.selectedRecipeId || undefined,
          goal,
        }),
      });
      if (res.starterPrompt && navigator.clipboard) {
        navigator.clipboard.writeText(res.starterPrompt).catch(() => {});
      }
      showToast(res.message || ('已启动 ' + res.label));
      closeAllPopovers();
    } catch (err) {
      showToast('启动失败：' + err.message);
    }
  }

  $('agent-gui-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-launch-agent]');
    if (btn) launchSelectedAgent(btn.getAttribute('data-launch-agent'));
  });
  $('agent-cli-list').addEventListener('click', async (e) => {
    const copyCmdBtn = e.target.closest('[data-copy-cmd-agent]');
    if (copyCmdBtn) {
      const host = copyCmdBtn.getAttribute('data-copy-cmd-agent');
      const goal = ($('ai-custom-goal') && $('ai-custom-goal').value.trim()) || undefined;
      try {
        const res = await apiJson('/api/workspace/agents/launch', {
          method: 'POST',
          body: JSON.stringify({
            host,
            terminal: state.selectedTerminal || undefined,
            recipeId: state.selectedRecipeId || undefined,
            goal,
            dryRun: true,
          }),
        });
        const cmd = res.readyToRunCommand || res.command || '';
        if (navigator.clipboard && cmd) {
          await navigator.clipboard.writeText(cmd);
        }
        showToast('已复制 ' + (res.label || host) + ' 1-Click 运行命令，直接在终端粘贴即可运行！');
        closeAllPopovers();
      } catch (err) {
        showToast('复制失败：' + err.message);
      }
      return;
    }
    const btn = e.target.closest('[data-launch-agent]');
    if (btn) launchSelectedAgent(btn.getAttribute('data-launch-agent'));
  });

  const btnCopyReadyCmd = $('btn-copy-ready-cmd');
  if (btnCopyReadyCmd) {
    btnCopyReadyCmd.addEventListener('click', async () => {
      const goal = ($('ai-custom-goal') && $('ai-custom-goal').value.trim()) || undefined;
      const terms = state.terminals || [];
      const firstCli = (state.agents || []).find((a) => a.launchMode !== 'gui-app');
      const host = firstCli ? firstCli.id : 'claude';
      try {
        const res = await apiJson('/api/workspace/agents/launch', {
          method: 'POST',
          body: JSON.stringify({
            host,
            terminal: state.selectedTerminal || undefined,
            recipeId: state.selectedRecipeId || undefined,
            goal,
            dryRun: true,
          }),
        });
        const cmd = res.readyToRunCommand || res.command || '';
        if (navigator.clipboard && cmd) {
          await navigator.clipboard.writeText(cmd);
        }
        showToast('已复制 1-Click 运行命令（' + (res.label || host) + '），直接在终端回车即可启动');
        closeAllPopovers();
      } catch (err) {
        showToast('复制失败：' + err.message);
      }
    });
  }

  $('btn-sync-workspace-agents').addEventListener('click', async () => {
    try {
      await apiJson('/api/workspace/agents/configure', { method: 'POST', body: JSON.stringify({}) });
      await refreshWorkspaceAndEcosystem();
      showToast('已在本工作区写入实体预设 Skill 与 MCP 配置（零全局污染）');
    } catch (err) {
      showToast('写入失败：' + err.message);
    }
  });

  $('btn-resync-skills').addEventListener('click', async () => {
    try {
      const res = await apiJson('/api/workspace/agents/configure', { method: 'POST', body: JSON.stringify({}) });
      await refreshWorkspaceAndEcosystem();
      const preserved = (res.preservedCustomFiles || []).length;
      showToast(preserved ? '已安全同步预设 Skill（保留了 ' + preserved + ' 个手工定制文件）' : '7 大闭环预设 Skill 已全部同步');
    } catch (err) {
      showToast('同步失败：' + err.message);
    }
  });

  $('btn-copy-ai-prompt').addEventListener('click', async () => {
    const goal = ($('ai-custom-goal') && $('ai-custom-goal').value.trim()) || undefined;
    try {
      const res = await apiJson('/api/workspace/agents/launch', {
        method: 'POST',
        body: JSON.stringify({
          host: 'opencode',
          terminal: state.selectedTerminal || undefined,
          recipeId: state.selectedRecipeId || undefined,
          goal,
          dryRun: true,
        }),
      });
      if (navigator.clipboard && res.starterPrompt) {
        await navigator.clipboard.writeText(res.starterPrompt);
      }
      showToast('已复制带工作区上下文的创作指令，直接粘贴给任意 AI 即可');
      closeAllPopovers();
    } catch (err) {
      showToast('复制失败：' + err.message);
    }
  });

  // Visual Gallery 2.1 Events (3 Tabs: Templates / 2026 Trending / Packs)
  $('gallery-mode-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gallery-tab]');
    if (!btn) return;
    switchGalleryTab(btn.getAttribute('data-gallery-tab'));
  });

  $('gallery-search').addEventListener('input', (e) => {
    state.galleryQuery = e.target.value;
    renderGallery();
  });

  $('gallery-category-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.galleryCategory = btn.getAttribute('data-cat') || '';
    document.querySelectorAll('#gallery-category-chips .filter-chip').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
    renderGallery();
  });

  $('gallery-pack-strip').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-install-pack]');
    if (!btn) return;
    const itemId = btn.getAttribute('data-install-pack');
    try {
      const res = await apiJson('/api/market/install', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
      showToast('已将套件装配到本工作区（' + (res.installedRecords ? res.installedRecords.length : 1) + ' 套模板）');
      await refreshWorkspaceAndEcosystem();
    } catch (err) {
      showToast('装配失败：' + err.message);
    }
  });

  $('gallery-trending-grid').addEventListener('click', async (e) => {
    const importBtn = e.target.closest('[data-import-trending]');
    if (importBtn) {
      const id = importBtn.getAttribute('data-import-trending');
      try {
        const res = await apiJson('/api/trending/import', {
          method: 'POST',
          body: JSON.stringify({ id, mode: 'import' }),
        });
        state.activeSlideIndex = 0;
        await refreshState(true);
        await refreshWorkspaceAndEcosystem();
        closeAllDrawers();
        showToast('已导入时事热点作品「' + (res.title || id) + '」，点击画布文字即可自由改编');
      } catch (err) {
        showToast('导入失败：' + err.message);
      }
      return;
    }
    const remixBtn = e.target.closest('[data-remix-trending]');
    if (remixBtn) {
      const id = remixBtn.getAttribute('data-remix-trending');
      const humanize = Boolean($('chk-remix-humanize') && $('chk-remix-humanize').checked);
      try {
        await apiJson('/api/trending/import', {
          method: 'POST',
          body: JSON.stringify({ id, mode: 'remix', humanize }),
        });
        await refreshState(true);
        closeAllDrawers();
        showToast('已将当前作品一键套用该热点范例的视觉风格');
      } catch (err) {
        showToast('套用风格失败：' + err.message);
      }
    }
  });

  const radarGrid = $('gallery-radar-grid');
  if (radarGrid) {
    radarGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-radar-make]');
      if (!btn) return;
      const id = btn.getAttribute('data-radar-make');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '生成中…';
      try {
        const res = await apiJson('/api/radar/make', {
          method: 'POST',
          body: JSON.stringify({ id }),
        });
        state.activeSlideIndex = 0;
        await refreshState(true);
        await refreshWorkspaceAndEcosystem();
        closeAllDrawers();
        showToast('已基于「' + (res.title || '热点素材') + '」生成作品，即刻开始微调与导出');
      } catch (err) {
        showToast('一键生成失败：' + (err.message || '网络异常'));
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  }

  const radarChips = $('radar-category-chips');
  if (radarChips) {
    radarChips.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-radar-cat]');
      if (!btn) return;
      const cat = btn.getAttribute('data-radar-cat') || 'all';
      document.querySelectorAll('#radar-category-chips .filter-chip').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      fetchAndRenderRadar(cat);
    });
  }

  $('gallery-template-grid').addEventListener('click', async (e) => {
    const remixBtn = e.target.closest('[data-remix-template]');
    if (remixBtn) {
      const tplId = remixBtn.getAttribute('data-remix-template');
      const humanize = Boolean($('chk-remix-humanize') && $('chk-remix-humanize').checked);
      try {
        await apiJson('/api/remix', {
          method: 'POST',
          body: JSON.stringify({ sourceTemplateId: tplId, humanize }),
        });
        await refreshState(true);
        closeAllDrawers();
        showToast('一键做同款完成：已套用 ' + tplId + ' 视觉风格');
      } catch (err) {
        showToast('一键同款失败：' + err.message);
      }
      return;
    }

    const switchBtn = e.target.closest('[data-template-id]');
    if (switchBtn) {
      const tplId = switchBtn.getAttribute('data-template-id');
      try {
        await apiJson('/api/meta', {
          method: 'POST',
          body: JSON.stringify({ template: tplId }),
        });
        await refreshState(true);
        closeAllDrawers();
        showToast('已切换风格：' + tplId);
      } catch (err) {
        showToast('切换失败：' + err.message);
      }
    }
  });

  // WeChat Quick Copy & Export Drawer
  const btnQuickWechat = $('btn-quick-copy-wechat');
  if (btnQuickWechat) {
    btnQuickWechat.addEventListener('click', () => copyWeChatRichText(btnQuickWechat));
  }

  $('btn-export-wechat').addEventListener('click', async () => {
    try {
      await copyWeChatRichText($('btn-export-wechat'));
      await runExport('wechat');
    } catch (_) {}
  });
  $('btn-export-png').addEventListener('click', () => runExport('png'));
  $('btn-export-pdf').addEventListener('click', () => runExport('pdf'));
  $('btn-export-pptx').addEventListener('click', () => runExport('pptx'));
  $('btn-export-mp4').addEventListener('click', () => runExport('mp4'));
  $('btn-export-mp4-narrated').addEventListener('click', () => runExport('mp4', 'offline-fixture'));
  $('btn-compound-wiki').addEventListener('click', async () => {
    try {
      await apiJson('/api/media/compound', { method: 'POST', body: JSON.stringify({}) });
      await refreshWorkspaceAndEcosystem();
      showToast('已将成品摘要沉淀回工作区知识库，完成复利闭环');
    } catch (err) {
      showToast('归档失败：' + err.message);
    }
  });

  // Polish / Intake / Source / Wiki Drawer
  document.querySelectorAll('[data-polish-tab]').forEach((btn) => {
    btn.addEventListener('click', () => openPolishTab(btn.getAttribute('data-polish-tab')));
  });

  $('btn-humanize-audit').addEventListener('click', async () => {
    try {
      const res = await apiJson('/api/wiki/humanize', { method: 'POST', body: JSON.stringify({ apply: false }) });
      const b = res.beforeAudit || {};
      const a = res.afterAudit || {};
      $('humanize-result').innerHTML =
        '<div>当前 AI 腔命中：<strong>' + (b.hits ? b.hits.length : 0) + '</strong> 处 → 精修后：<strong>' + (a.hits ? a.hits.length : 0) + '</strong> 处</div>';
    } catch (err) {
      showToast('体检失败：' + err.message);
    }
  });

  $('btn-humanize-apply').addEventListener('click', async () => {
    try {
      await apiJson('/api/wiki/humanize', { method: 'POST', body: JSON.stringify({ apply: true }) });
      await refreshState(true);
      $('humanize-result').textContent = '已完成四语种去 AI 味精修并写回当前作品。';
      showToast('去 AI 味精修已应用');
    } catch (err) {
      showToast('精修失败：' + err.message);
    }
  });

  $('btn-submit-intake').addEventListener('click', async () => {
    const title = ($('intake-title').value || '').trim();
    const sourceUrl = ($('intake-source-url').value || '').trim();
    const content = ($('intake-content').value || '').trim();
    if (!content) {
      showToast('请先输入或粘贴素材内容');
      return;
    }
    try {
      await apiJson('/api/workspace/source/ingest', {
        method: 'POST',
        body: JSON.stringify({ title: title || '工作区素材', sourceUrl, content }),
      });
      $('intake-title').value = '';
      $('intake-source-url').value = '';
      $('intake-content').value = '';
      await refreshWorkspaceAndEcosystem();
      showToast('素材已收入 sources/ 并沉淀至工作区知识库');
    } catch (err) {
      showToast('收入素材失败：' + err.message);
    }
  });

  $('btn-save-source').addEventListener('click', async () => {
    try {
      await apiJson('/api/markdown', {
        method: 'POST',
        body: JSON.stringify({ rawMarkdown: $('markdown-editor').value }),
      });
      await refreshState(true);
      showToast('已保存 .deck.md 源码');
    } catch (err) {
      showToast('保存源码失败：' + err.message);
    }
  });

  $('btn-wiki-refresh').addEventListener('click', refreshWikiOverview);
  $('btn-wiki-visuals').addEventListener('click', async () => {
    try {
      await apiJson('/api/wiki/visuals', { method: 'POST', body: JSON.stringify({}) });
      showToast('已导出工作区知识导图（Canvas / Excalidraw / Mermaid）');
    } catch (err) {
      showToast('导出知识导图失败：' + err.message);
    }
  });

  // Drag & Drop Local File Intake
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      dragDepth += 1;
      $('drop-overlay').classList.add('active');
    }
  });
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) $('drop-overlay').classList.remove('active');
  });
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDepth = 0;
    $('drop-overlay').classList.remove('active');
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || files.length === 0) return;
    let ingested = 0;
    for (const file of Array.from(files)) {
      if (file.size > 400 * 1024) continue;
      try {
        const text = await file.text();
        if (!text.trim()) continue;
        await apiJson('/api/workspace/source/ingest', {
          method: 'POST',
          body: JSON.stringify({ title: file.name.replace(/\\.[^.]+$/, ''), content: text }),
        });
        ingested += 1;
      } catch (_) {}
    }
    if (ingested > 0) {
      await refreshWorkspaceAndEcosystem();
      showToast('已拖入并收入 ' + ingested + ' 份素材至工作区知识库');
    } else {
      showToast('请拖入文本或 Markdown 素材文件（单文件 <= 400KB）');
    }
  });

  // Command Palette Click Handler
  $('cmdk-input').addEventListener('input', (e) => renderCmdk(e.target.value));
  $('cmdk-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd-idx]');
    if (!btn) return;
    const cmds = $('cmdk-list')._cmds || [];
    const cmd = cmds[Number(btn.getAttribute('data-cmd-idx'))];
    closeAllModals();
    if (cmd) cmd.run();
  });

  // Deep link handler exposed for native macOS AimakeApp.swift
  window.__aimakeHandleDeepLink = (rawUrl) => {
    if (!rawUrl) return;
    if (rawUrl.indexOf('remix') >= 0 || rawUrl.indexOf('market') >= 0) {
      switchGalleryTab('templates');
      openDrawer('drawer-gallery', 'stage');
    } else if (rawUrl.indexOf('clip') >= 0 || rawUrl.indexOf('intake') >= 0) {
      openPolishTab('intake');
      openDrawer('drawer-polish', 'intake');
    } else if (rawUrl.indexOf('export') >= 0) {
      openDrawer('drawer-export', 'deliver');
    }
  };

  // Boot
  applyAppearance(state.appearance);
  Promise.all([
    refreshState(true),
    refreshWorkspaceAndEcosystem(),
  ])
    .then(() => connectLiveEvents())
    .catch((err) => showToast('初始化失败：' + err.message));
})();
`;

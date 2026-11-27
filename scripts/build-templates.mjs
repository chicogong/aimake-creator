import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, '../templates');

const TEMPLATES = [
  // =========================================================================
  // XIAOHONGSHU (zh-CN, 5 distinct styles, 3:4)
  // =========================================================================
  {
    manifest: {
      id: 'xhs-swiss-grid',
      name: {
        zh: '小红书 · 瑞士国际网格卡',
        en: 'Xiaohongshu · Swiss Editorial Grid',
        ja: 'RED · スイス・グリッドカード',
        ko: '샤오홍슈 · 스위스 그리드 카드',
      },
      description: {
        zh: '受瑞士国际主义排版启发，细线网格与朱砂红编号，适合硬核干货与方法论拆解。',
        en: 'Precision hairline grid with vermilion index markers for crisp technical & strategy breakdowns.',
        ja: 'スイス・タイポグラフィに着想を得た精密グリッドレイアウト。',
        ko: '스위스 타이포그래피 기반의 정교한 그리드 카드 레이아웃.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'swiss', 'grid', 'editorial', 'zh-CN'],
    },
    theme: {
      bg: '#F4F2EC',
      surface: '#FFFFFF',
      ink: '#141518',
      muted: '#555A64',
      accent: '#D93829',
      accentSoft: 'rgba(217, 56, 41, 0.10)',
      border: '#141518',
      borderWidth: '2px',
      radius: '0px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'swiss',
    },
  },
  {
    manifest: {
      id: 'xhs-paper-editorial',
      name: {
        zh: '小红书 · 纸质人文书卷卡',
        en: 'Xiaohongshu · Archival Paper Essay',
        ja: 'RED · 書斎ペーパーエッセイ',
        ko: '샤오홍슈 · 페이퍼 에디토리얼',
      },
      description: {
        zh: '温暖棉纸质感搭配人文衬线标题与松石绿点缀，适合读书笔记、深度思考与个人复盘。',
        en: 'Warm cotton-rag paper surface with literary serif display headlines for essays and book notes.',
        ja: '温かみのある紙質感と明朝体見出しによるエッセイ・読書カード。',
        ko: '따뜻한 종이 질감과 세리프 제목이 돋보이는 독서·에세이 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'serif', 'book-notes', 'essay', 'paper'],
    },
    theme: {
      bg: '#FAF6EE',
      surface: '#F3ECE0',
      ink: '#1F2421',
      muted: '#61675F',
      accent: '#1F5E4B',
      accentSoft: 'rgba(31, 94, 75, 0.10)',
      border: '#D6CCB9',
      borderWidth: '1px',
      radius: '10px',
      fontStack: "'Songti SC', 'Noto Serif SC', 'Hiragino Mincho ProN', Georgia, serif",
      styleVariant: 'paper-editorial',
    },
  },
  {
    manifest: {
      id: 'xhs-neon-tech',
      name: {
        zh: '小红书 · 暗黑极客代码与跑分卡',
        en: 'Xiaohongshu · Dark Silicon & Code Stage',
        ja: 'RED · ダークギーク＆コード解説',
        ko: '샤오홍슈 · 다크 테크 & 코드 카드',
      },
      description: {
        zh: '深邃石墨暗色底配光学钴蓝与终端代码窗，专为产品发布、AI 评测与架构拆解打造。',
        en: 'Obsidian darkroom palette with terminal chrome and tabular benchmark metrics for dev releases.',
        ja: 'プロダクトリリースやAIベンチマーク比較に最適なダークテーマ。',
        ko: '프로덕트 릴리스와 벤치마크 비교에 최적화된 다크 테크 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'tech', 'dark', 'code', 'benchmark'],
    },
    theme: {
      bg: '#090D14',
      surface: '#121926',
      ink: '#F1F5F9',
      muted: '#94A3B8',
      accent: '#38BDF8',
      accentSoft: 'rgba(56, 189, 248, 0.14)',
      border: '#253348',
      borderWidth: '1px',
      radius: '16px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'neon-tech',
    },
  },
  {
    manifest: {
      id: 'xhs-warm-magazine',
      name: {
        zh: '小红书 · 暖阳杂志画报封面',
        en: 'Xiaohongshu · Sunlit Editorial Magazine',
        ja: 'RED · ウォーム・マガジンカバー',
        ko: '샤오홍슈 · 웜 에디토리얼 매거진',
      },
      description: {
        zh: '陶土红与奶油棉纸搭配复古刊头、粗细双线与精致引言框，适合生活方式、品牌故事与审美向深度内容。',
        en: 'Terracotta & sunlit cream magazine cover with masthead stripe, editorial serif display, and framed pull-quotes.',
        ja: 'テラコッタとクリーム紙が調和する雑誌カバー風エディトリアル。',
        ko: '테라코타와 크림 톤의 매거진 커버 감성 에디토리얼 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'magazine', 'terracotta', 'editorial', 'warm', 'lifestyle'],
    },
    theme: {
      bg: '#FBF2E6',
      surface: '#F5E6D3',
      ink: '#2A1E17',
      muted: '#745B4B',
      accent: '#C44D34',
      accentSoft: 'rgba(196, 77, 52, 0.12)',
      border: '#D9BDA0',
      borderWidth: '1px',
      radius: '6px',
      fontStack: "'Songti SC', 'Noto Serif SC', Georgia, 'Times New Roman', serif",
      styleVariant: 'warm-magazine',
    },
  },
  {
    manifest: {
      id: 'xhs-pop-sticker',
      name: {
        zh: '小红书 · 潮流手账贴纸波普卡',
        en: 'Xiaohongshu · Neo-Brutalist Pop Notebook',
        ja: 'RED · ポップ・ステッカーノート',
        ko: '샤오홍슈 · 팝 스티커 노트북 카드',
      },
      description: {
        zh: '奶油点阵纸底配粗墨描边、硬投影色块与柠檬黄高光胶带，自带高收藏率手账质感。',
        en: 'Playful neo-brutalist studio notebook with dot-grid canvas, crisp ink borders, offset hard-shadows, and highlight tape.',
        ja: 'ドット方眼と硬質なシャドウが映えるポップなネオブルータリズムカード。',
        ko: '도트 그리드와 볼드한 잉크 테두리가 돋보이는 팝 스티커 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'pop', 'sticker', 'neobrutalist', 'notebook', 'dot-grid'],
    },
    theme: {
      bg: '#FFFBF0',
      surface: '#FFFFFF',
      ink: '#18181B',
      muted: '#52525B',
      accent: '#FF5A5F',
      accentSoft: '#FDE047',
      border: '#18181B',
      borderWidth: '3px',
      radius: '14px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'pop-sticker',
    },
  },

  // =========================================================================
  // WECHAT ECOSYSTEM (zh-CN, 3 distinct styles, 3:4)
  // =========================================================================
  {
    manifest: {
      id: 'wechat-greenbook',
      name: {
        zh: '微信小绿书 · 清朗高密度观点卡',
        en: 'WeChat Greenbook · Crisp Insight Deck',
        ja: 'WeChat · 高密度インサイトカード',
        ko: '위챗 그린북 · 인사이트 카드',
      },
      description: {
        zh: '针对微信图文消息（小绿书）阅读习惯优化，高对比度卡片分层与微信翠绿视觉锚点。',
        en: 'Tailored for WeChat swipeable image posts with high-legibility hierarchy and emerald accents.',
        ja: 'モバイルスワイプ閲覧に最適化された高視認性カード。',
        ko: '모바일 스와이프 가독성을 극대화한 인사이트 카드.',
      },
      category: 'wechat',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'wechat', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['wechat', 'greenbook', 'news', 'botanical'],
    },
    theme: {
      bg: '#ECF4EE',
      surface: '#FFFFFF',
      ink: '#102119',
      muted: '#4E6257',
      accent: '#07994E',
      accentSoft: '#E2F5EA',
      border: '#D3E4D8',
      borderWidth: '1px',
      radius: '20px',
      fontStack: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      styleVariant: 'wechat-greenbook',
    },
  },
  {
    manifest: {
      id: 'wechat-editorial-article',
      name: {
        zh: '微信公众号 · 深度专栏内联主题',
        en: 'WeChat Article · Deep Column Theme',
        ja: 'WeChat記事 · コラム組版テーマ',
        ko: '위챗 공식계정 · 칼럼 테마',
      },
      description: {
        zh: '专为微信公众号深度长文与技术复盘打造，支持一键复制 100% 兼容微信后台的内联富文本。',
        en: 'Crafted for long-form WeChat columns with one-click inline CSS rich-text export.',
        ja: '長文コラム・技術解説向けのクリーンな組版テーマ。',
        ko: '장문 기술 칼럼 및 뉴스레터용 깔끔한 타이포그래피 테마.',
      },
      category: 'wechat',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['wechat', 'png', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['wechat', 'wechat-mp', 'article', 'inline-css', 'column'],
    },
    theme: {
      bg: '#FFFFFF',
      surface: '#F6F8FC',
      ink: '#0F172A',
      muted: '#5A677D',
      accent: '#2B6BE6',
      accentSoft: 'rgba(43, 107, 230, 0.09)',
      border: '#DCE3EE',
      borderWidth: '1px',
      radius: '12px',
      fontStack: "-apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'wechat-editorial',
    },
  },
  {
    manifest: {
      id: 'wechat-minimal-brief',
      name: {
        zh: '微信生态 · 极简白皮书研报速览卡',
        en: 'WeChat · Minimal Executive Whitepaper Brief',
        ja: 'WeChat · ミニマル白書ブリーフ',
        ko: '위챗 · 미니멀 화이트페이퍼 브리프',
      },
      description: {
        zh: '象牙白极简底色配精密细线分隔、钴蓝数据胶囊与摘要横幅，适合行业研报、商业周报与产品白皮书。',
        en: 'Ultra-clean ivory executive digest card with fine hairline dividers, cobalt stat pills, and structured summary band.',
        ja: 'アイボリー基調に繊細な罫線とコバルト指標ピルを備えたエグゼクティブ要約カード。',
        ko: '아이보리 톤과 정교한 헤어라인, 코발트 지표 필로 구성한 리포트 요약 카드.',
      },
      category: 'wechat',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'wechat', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['wechat', 'minimal', 'whitepaper', 'brief', 'executive', 'digest'],
    },
    theme: {
      bg: '#FCFBF8',
      surface: '#F4F6FA',
      ink: '#111827',
      muted: '#64748B',
      accent: '#1D4ED8',
      accentSoft: '#DBEAFE',
      border: '#D5DCE6',
      borderWidth: '1px',
      radius: '8px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'wechat-minimal-brief',
    },
  },

  // =========================================================================
  // ENGLISH / GLOBAL (en, 3 distinct styles, 4:5)
  // =========================================================================
  {
    manifest: {
      id: 'linkedin-exec-carousel',
      name: {
        zh: 'LinkedIn · 欧美创始人滑动 PDF 卡',
        en: 'LinkedIn · Founder Authority Carousel (4:5)',
        ja: 'LinkedIn · エグゼクティブ・カルーセル PDF',
        ko: '링크드인 · 파운더 캐러셀 PDF (4:5)',
      },
      description: {
        zh: '欧美职场与独立开发者涨粉第一利器：4:5 黄金比例多页矢量 PDF，内置英文长词自适应防爆框。',
        en: 'High-converting 4:5 PDF document carousel engineered for founders, B2B creators, and indie hackers.',
        ja: '欧米LinkedInで最も伸びる4:5スワイプPDFカルーセル。',
        ko: '글로벌 링크드인 B2B 크리에이터를 위한 4:5 문서 캐러셀.',
      },
      category: 'linkedin',
      defaultLocale: 'en',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['pdf', 'png', 'pptx', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['linkedin', 'carousel', 'pdf', 'b2b', 'english', 'founder'],
    },
    theme: {
      bg: '#0B1221',
      surface: '#162033',
      ink: '#F8FAFC',
      muted: '#94A3B8',
      accent: '#3B82F6',
      accentSoft: 'rgba(59, 130, 246, 0.16)',
      border: '#2B3B55',
      borderWidth: '1px',
      radius: '14px',
      fontStack: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      styleVariant: 'linkedin-exec',
    },
  },
  {
    manifest: {
      id: 'en-founder-whiteboard',
      name: {
        zh: '欧美出海 · 极客白板工程蓝图卡 (4:5)',
        en: 'Global · Founder Whiteboard Blueprint (4:5)',
        ja: 'グローバル · エンジニア白板ブループリント',
        ko: '글로벌 · 파운더 화이트보드 블루프린트',
      },
      description: {
        zh: '面向欧美科技创始人与工程师的浅蓝白板方格蓝图风，配马克笔重点下划线与虚线结构框。',
        en: 'Engineering & startup whiteboard blueprint with architectural grid, marker accent underline, and crisp dashed callouts.',
        ja: 'エンジニアリング解説に最適な方眼ホワイトボード風ブループリント。',
        ko: '스타트업·엔지니어링 인사이트를 위한 블루프린트 화이트보드 카드.',
      },
      category: 'linkedin',
      defaultLocale: 'en',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['pdf', 'png', 'pptx', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['english', 'whiteboard', 'blueprint', 'engineering', 'startup', 'linkedin'],
    },
    theme: {
      bg: '#F7FAFE',
      surface: '#FFFFFF',
      ink: '#0F1C2E',
      muted: '#4B607A',
      accent: '#2563EB',
      accentSoft: '#FEF08A',
      border: '#93C5FD',
      borderWidth: '2px',
      radius: '10px',
      fontStack: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      styleVariant: 'founder-whiteboard',
    },
  },
  {
    manifest: {
      id: 'en-substack-digest',
      name: {
        zh: '欧美出海 · Substack 纽约客长文专栏卡 (4:5)',
        en: 'Global · Substack & New Yorker Essay Digest (4:5)',
        ja: 'グローバル · Substack ニュースレター・ダイジェスト',
        ko: '글로벌 · 서브스택 에세이 다이제스트 (4:5)',
      },
      description: {
        zh: '经典欧美纸媒与 Substack 专栏美学：米白新闻纸底、粗细双顶线、衬线标题与克制的边栏序号。',
        en: 'Classic New Yorker / Substack newsletter card on archival newsprint with double top rule and Georgia serif display.',
        ja: 'ニュースペーパー質感と二重罫線、セリフ見出しによる英語ニュースレターカード。',
        ko: '클래식 뉴스프린트 질감과 이중 상단선, 세리프 타이포의 에세이 카드.',
      },
      category: 'linkedin',
      defaultLocale: 'en',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['pdf', 'png', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['english', 'substack', 'newsletter', 'essay', 'serif', 'editorial'],
    },
    theme: {
      bg: '#F8F5EE',
      surface: '#F1ECE1',
      ink: '#1C1917',
      muted: '#57534E',
      accent: '#EA580C',
      accentSoft: 'rgba(234, 88, 12, 0.10)',
      border: '#D6D0C4',
      borderWidth: '1px',
      radius: '2px',
      fontStack: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
      styleVariant: 'substack-digest',
    },
  },

  // =========================================================================
  // JAPAN (ja, 2 distinct styles — strict line-break: strict kinsoku)
  // =========================================================================
  {
    manifest: {
      id: 'x-zukai-quad',
      name: {
        zh: '日本 X ·「図解 Zukai」高密度结构图',
        en: 'Japan X · Zukai Structured Blueprint',
        ja: 'X (Twitter) · 構造化「図解」ブループリント',
        ko: '일본 X · 도해(Zukai) 구조화 인포그래픽',
      },
      description: {
        zh: '对标日本 X 与 Note.com 万转「図解」信息图，高密度模块化框图，严格启用日文行首行尾禁则。',
        en: 'Information-dense Japanese Zukai blueprint layout with strict kinsoku line-breaking rules.',
        ja: 'XやNote.comで保存・拡散される高密度「図解」フォーマット。厳格な禁則処理に対応。',
        ko: '일본 X 및 Note.com에서 검증된 고밀도 도해(図解) 레이아웃.',
      },
      category: 'zukai',
      defaultLocale: 'ja',
      aspect: '16:9',
      width: 1600,
      height: 900,
      supportedFormats: ['png', 'pdf', 'pptx', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['japan', 'zukai', 'x-twitter', 'note-com', 'infographic', 'kinsoku'],
    },
    theme: {
      bg: '#F0F4FA',
      surface: '#FFFFFF',
      ink: '#172336',
      muted: '#4E6078',
      accent: '#1E40AF',
      accentSoft: '#DBEAFE',
      border: '#BAC8DC',
      borderWidth: '2px',
      radius: '8px',
      fontStack: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', sans-serif",
      styleVariant: 'x-zukai',
    },
  },
  {
    manifest: {
      id: 'ja-note-editorial',
      name: {
        zh: '日本 Note · 和纸留白「余白美学」专栏卡',
        en: 'Japan Note · Minimalist Washi Editorial (4:5)',
        ja: 'Note.com · 和紙ミニマル「余白美学」カード',
        ko: '일본 Note · 와시 미니멀 에디토리얼 (4:5)',
      },
      description: {
        zh: '融合日本 Note.com 极简留白（間）与手工和纸肌理，搭配绀青墨色、朱红印章徽记与严格日文禁则排版。',
        en: 'Japanese Note.com minimalist Washi aesthetic with indigo ink, vermilion hanko stamp accent, generous ma whitespace, and strict kinsoku.',
        ja: '温かみのある和紙の質感に藍墨と朱印アクセントを配したNote向けミニマル組版。厳格な禁則処理に対応。',
        ko: '와시 종이 질감과 쪽빛 타이포, 주홍 인장 포인트의 일본 Note 에디토리얼 카드.',
      },
      category: 'zukai',
      defaultLocale: 'ja',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['png', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['japan', 'note-com', 'washi', 'minimal', 'editorial', 'kinsoku'],
    },
    theme: {
      bg: '#F7F3EA',
      surface: '#FDFBF7',
      ink: '#1D2D44',
      muted: '#5C6773',
      accent: '#C73E3A',
      accentSoft: 'rgba(199, 62, 58, 0.10)',
      border: '#D9D1C3',
      borderWidth: '1px',
      radius: '4px',
      fontStack: "'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', 'Hiragino Kaku Gothic ProN', serif",
      styleVariant: 'ja-note',
    },
  },

  // =========================================================================
  // KOREA (ko, 2 distinct styles — Pretendard + word-break: keep-all)
  // =========================================================================
  {
    manifest: {
      id: 'ig-cardnews-kr',
      name: {
        zh: '韩国 IG ·「카드뉴스」现代几何卡片新闻',
        en: 'Korea IG · Modern Geometric Card News (4:5)',
        ja: '韓国 IG · モダン「カードニュース」',
        ko: '인스타그램 · 모던 지오메트릭 카드뉴스 (4:5)',
      },
      description: {
        zh: '正宗韩国 Instagram / Threads 卡片新闻视觉体系，强制启用语节断行（keep-all）与 Pretendard 字族。',
        en: 'Authentic Korean swipeable Card News aesthetic with Pretendard typography and word-break: keep-all.',
        ja: '韓国Instagram定番のカードニュース形式（語節改行維持に対応）。',
        ko: '한국 인스타그램·스레드에 최적화된 카드뉴스 템플릿 (단어 단위 줄바꿈 keep-all 완벽 지원).',
      },
      category: 'cardnews',
      defaultLocale: 'ko',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['png', 'pdf', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['korea', 'card-news', 'instagram', 'threads', 'pretendard', 'keep-all'],
    },
    theme: {
      bg: '#111216',
      surface: '#1C1E24',
      ink: '#FFFFFF',
      muted: '#A1A7B3',
      accent: '#FF5500',
      accentSoft: 'rgba(255, 85, 0, 0.16)',
      border: '#2E323C',
      borderWidth: '1px',
      radius: '20px',
      fontStack: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      styleVariant: 'ig-cardnews-kr',
    },
  },
  {
    manifest: {
      id: 'ko-brand-lookbook',
      name: {
        zh: '韩国品牌 · 首尔极简画册 Lookbook (4:5)',
        en: 'Korea · Seoul Studio Brand Lookbook (4:5)',
        ja: '韓国 · ソウルスタジオ・ブランドルックブック',
        ko: '서울 스튜디오 · 브랜드 룩북 에디토리얼 (4:5)',
      },
      description: {
        zh: '首尔设计师品牌画册美学：冷石膏灰底、单色细框画廊构图与鼠尾草青标签，严格支持韩语 keep-all 断行。',
        en: 'Seoul studio fashion/tech brand lookbook on cool alabaster stone with crisp monochrome frame, sage-teal pill, and word-break: keep-all.',
        ja: 'クールな石膏トーンとセージティールの洗練されたソウル・ルックブック風カード。',
        ko: '차가운 알라바스터 스톤과 모노크롬 프레임, 세이지 틸 포인트의 브랜드 룩북 템플릿.',
      },
      category: 'cardnews',
      defaultLocale: 'ko',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['png', 'pdf', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['korea', 'lookbook', 'brand', 'seoul', 'minimal', 'pretendard', 'keep-all'],
    },
    theme: {
      bg: '#F1F0EC',
      surface: '#FFFFFF',
      ink: '#151618',
      muted: '#5D6168',
      accent: '#2A6F68',
      accentSoft: '#E3F0EE',
      border: '#24262A',
      borderWidth: '1px',
      radius: '4px',
      fontStack: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      styleVariant: 'ko-lookbook',
    },
  },

  // =========================================================================
  // WORKPLACE & TECHNICAL PPT (16:9, Native Editable .pptx)
  // =========================================================================
  {
    manifest: {
      id: 'ppt-executive-16x9',
      name: {
        zh: '职场汇报 · 16:9 战略简报 PPT（真可编辑）',
        en: 'Executive Deck · 16:9 Strategy Slide (.PPTX)',
        ja: 'ビジネス報告 · 16:9 エグゼクティブスライド',
        ko: '비즈니스 리포트 · 16:9 임원 보고 슬라이드',
      },
      description: {
        zh: '专为飞书周报转述职汇报打造，既可网页全屏交互演示，也可一键导出文字原生可编辑的 .pptx。',
        en: 'Clean boardroom 16:9 presentation layout that exports cleanly to native editable PowerPoint (.pptx).',
        ja: '週報や企画書からそのまま編集可能なPowerPoint (.pptx) を出力できる16:9スライド。',
        ko: '주간 보고서와 기획안을 편집 가능한 네이티브 .pptx로 변환하는 16:9 슬라이드.',
      },
      category: 'presentation',
      defaultLocale: 'zh-CN',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['ppt', 'pptx', 'workplace', 'feishu', 'executive', '16x9'],
    },
    theme: {
      bg: '#F6F8FC',
      surface: '#FFFFFF',
      ink: '#0F172A',
      muted: '#5B677A',
      accent: '#1E40AF',
      accentSoft: '#E8EFFD',
      border: '#DCE3EE',
      borderWidth: '1px',
      radius: '12px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'ppt-executive',
    },
  },
  {
    manifest: {
      id: 'ppt-tech-architecture',
      name: {
        zh: '技术答辩 · 16:9 暗色系统架构幻灯片',
        en: 'Tech Review · 16:9 System Architecture Deck',
        ja: '技術発表 · 16:9 アーキテクチャ登壇スライド',
        ko: '기술 발표 · 16:9 시스템 아키텍처 데크',
      },
      description: {
        zh: '面向晋升答辩、技术大会与架构复盘的 16:9 暗色宽屏幻灯片，原生支持代码对比、指标卡与可编辑 .pptx。',
        en: 'Dark widescreen engineering deck built for architecture reviews, tech talks, and editable .pptx export.',
        ja: '技術カンファレンスや設計レビュー向けの16:9ダークスライド。',
        ko: '기술 컨퍼런스 및 아키텍처 리뷰를 위한 16:9 다크 와이드 슬라이드.',
      },
      category: 'presentation',
      defaultLocale: 'en',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['tech-talk', 'architecture', 'pptx', '16x9', 'dark', 'engineering'],
    },
    theme: {
      bg: '#0B1018',
      surface: '#131B26',
      ink: '#E6EDF3',
      muted: '#8B949E',
      accent: '#2F81F7',
      accentSoft: 'rgba(47, 129, 247, 0.15)',
      border: '#2A3647',
      borderWidth: '1px',
      radius: '12px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', sans-serif",
      styleVariant: 'ppt-tech-arch',
    },
  },
  {
    manifest: {
      id: 'ppt-consulting-matrix',
      name: {
        zh: '战略咨询 · 16:9 麦肯锡/BCG 行动结论看板',
        en: 'Consulting · 16:9 Strategy Matrix Briefing (.PPTX)',
        ja: '戦略コンサル · 16:9 マトリクス経営報告',
        ko: '전략 컨설팅 · 16:9 매트릭스 경영 브리핑',
      },
      description: {
        zh: '对标顶级管理咨询公司（McKinsey/BCG）汇报标准：深藏蓝顶栏、高对比度行动标题带、结构化 KPI 矩阵与底部信源栏。',
        en: 'McKinsey/BCG-inspired consulting deck with deep navy header bar, high-contrast action-title strip, KPI matrix grid, and source footer.',
        ja: '戦略コンサル流のアクションタイトル帯とKPIマトリクスを備えた16:9経営報告スライド。',
        ko: '딥 네이비 헤더와 액션 타이틀 바, 구조화된 KPI 그리드를 갖춘 컨설팅 브리핑 슬라이드.',
      },
      category: 'presentation',
      defaultLocale: 'zh-CN',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['consulting', 'mckinsey', 'strategy', 'kpi', 'pptx', '16x9'],
    },
    theme: {
      bg: '#FFFFFF',
      surface: '#F4F7FB',
      ink: '#0A2540',
      muted: '#4A5D73',
      accent: '#0066B3',
      accentSoft: '#EBF3FA',
      border: '#C7D6E6',
      borderWidth: '1px',
      radius: '4px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'ppt-consulting',
    },
  },

  // =========================================================================
  // EDUCATION & CLASSROOM (zh/en, 2 distinct styles, 3:4)
  // =========================================================================
  {
    manifest: {
      id: 'edu-flashcard-kids',
      name: {
        zh: '教育教学 · 双语概念与识字闪卡',
        en: 'Education · Bilingual Concept & Study Flashcards',
        ja: '教育・学習 · バイリンガル暗記＆授業カード',
        ko: '교육·수업 · 양방향 개념 학습 플래시카드',
      },
      description: {
        zh: '面向老师备课、课堂图解与家庭教育的高清可打印知识闪卡，重点词高亮醒目、护眼暖白底色。',
        en: 'Print-ready high-legibility study flashcards for teachers, classrooms, and bilingual learning.',
        ja: '先生の教材作成や印刷配布に最適な高視認性フラッシュカード。',
        ko: '교사 수업 자료 및 인쇄용으로 최적화된 고가독성 학습 플래시카드.',
      },
      category: 'education',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['education', 'teacher', 'flashcard', 'kids', 'printable', 'bilingual'],
    },
    theme: {
      bg: '#FFFBF0',
      surface: '#FFF3D1',
      ink: '#1E293B',
      muted: '#5E6B7D',
      accent: '#D97706',
      accentSoft: '#FEF3C7',
      border: '#F59E0B',
      borderWidth: '3px',
      radius: '28px',
      fontStack: "'PingFang SC', 'Hiragino Maru Gothic ProN', 'Plus Jakarta Sans', sans-serif",
      styleVariant: 'edu-flashcard',
    },
  },
  {
    manifest: {
      id: 'edu-lesson-guide',
      name: {
        zh: '教育教学 · 黑板绿课堂导学与复盘卡',
        en: 'Education · Structured Classroom Lesson Guide',
        ja: '教育・学習 · 黒板グリーン授業ガイドカード',
        ko: '교육·수업 · 칠판 그린 레슨 가이드 카드',
      },
      description: {
        zh: '经典黑板绿顶栏配暖白横线笔记本页框、编号考点胶囊与底部复盘小结带，适合备课讲义与学科总结。',
        en: 'Structured teacher & study guide card with chalkboard-green header, warm ruled notebook frame, numbered takeaway pills, and review strip.',
        ja: '黒板グリーン見出しと方眼ノート枠で要点を整理する授業・復習ガイドカード。',
        ko: '칠판 그린 헤더와 노트북 프레임, 번호형 핵심 포인트로 구성한 학습 가이드 카드.',
      },
      category: 'education',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'pptx', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['education', 'lesson', 'teacher', 'study', 'notebook', 'chalkboard'],
    },
    theme: {
      bg: '#FCFBF5',
      surface: '#F4F7F3',
      ink: '#1A2E26',
      muted: '#4E635A',
      accent: '#1B5E43',
      accentSoft: '#E3F2EB',
      border: '#B9D0C5',
      borderWidth: '2px',
      radius: '14px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'edu-lesson-guide',
    },
  },

  // =========================================================================
  // SHORT VIDEO REELS (9:16, 60fps MP4, 2 distinct styles)
  // =========================================================================
  {
    manifest: {
      id: 'video-kinetic-reel',
      name: {
        zh: '抖音 / 视频号 / Shorts · 9:16 帧步进动态短视频',
        en: 'Shorts / Reels · 9:16 Kinetic Motion Video',
        ja: 'ショート動画 · 9:16 キネティック・リール',
        ko: '쇼츠 / 릴스 · 9:16 키네틱 모션 비디오',
      },
      description: {
        zh: '原生实现 window.aimakeSeek(frame, fps) 确定性帧步进动画，预留底部安全区并自带动态口播字幕条。',
        en: 'Implements deterministic window.aimakeSeek(frame, fps) frame-stepping with safe-zone layout and live captions.',
        ja: 'フレーム単位の決定論的アニメーションと字幕バーを備えた9:16縦型動画テンプレート。',
        ko: '프레임 단위 정밀 애니메이션과 안전 영역 자막 바를 갖춘 9:16 숏폼 영상 템플릿.',
      },
      category: 'short-video',
      defaultLocale: 'zh-CN',
      aspect: '9:16',
      width: 1080,
      height: 1920,
      supportedFormats: ['mp4', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['douyin', 'shorts', 'reels', '9x16', 'video', 'motion', 'kinetic'],
    },
    theme: {
      bg: '#070910',
      surface: '#121826',
      ink: '#F8FAFC',
      muted: '#94A3B8',
      accent: '#F59E0B',
      accentSoft: 'rgba(245, 158, 11, 0.16)',
      border: '#26324B',
      borderWidth: '1px',
      radius: '20px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'video-kinetic',
    },
  },
  {
    manifest: {
      id: 'video-cinema-talk',
      name: {
        zh: '短视频口播 · 9:16 电影感黑金影院评述舞台',
        en: 'Shorts / Reels · 9:16 Cinema Obsidian & Gold Stage',
        ja: 'ショート動画 · 9:16 シネマ黒金コメンタリー',
        ko: '쇼츠 / 릴스 · 9:16 시네마 블랙&골드 스테이지',
      },
      description: {
        zh: '电影感宽银幕遮幅黑金视觉，内置摄影机取景框角标、香槟金主标题与底部安全区影院字幕条。',
        en: 'Cinematic obsidian & champagne-gold letterbox commentary stage with viewfinder corners, bold gold headline, and safe-zone caption bar.',
        ja: 'レターボックスとシャンパンゴールド見出しが際立つ映画風コメンタリー縦型動画。',
        ko: '레터박스 프레임과 샴페인 골드 타이틀, 안전 영역 자막을 갖춘 시네마틱 숏폼 템플릿.',
      },
      category: 'short-video',
      defaultLocale: 'zh-CN',
      aspect: '9:16',
      width: 1080,
      height: 1920,
      supportedFormats: ['mp4', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['douyin', 'shorts', 'reels', '9x16', 'video', 'cinema', 'gold', 'talk'],
    },
    theme: {
      bg: '#090807',
      surface: '#161310',
      ink: '#F7F1E3',
      muted: '#B5A892',
      accent: '#D4AF37',
      accentSoft: 'rgba(212, 175, 55, 0.16)',
      border: 'rgba(212, 175, 55, 0.38)',
      borderWidth: '1px',
      radius: '12px',
      fontStack: "'Songti SC', 'Noto Serif SC', Georgia, 'PingFang SC', serif",
      styleVariant: 'video-cinema-talk',
    },
  },

  // =========================================================================
  // NEW FLAGSHIP VISUAL STYLES (14 bespoke design systems -> 36 total)
  // =========================================================================
  {
    manifest: {
      id: 'apple-bento-launch',
      name: {
        zh: '苹果发布会 · Bento 便当盒产品发布 (16:9)',
        en: 'Apple Keynote · Bento Grid Launch Deck (16:9)',
        ja: 'Apple風 · Bentoグリッド製品発表スライド',
        ko: '애플 키노트 · 벤토 그리드 런칭 데크 (16:9)',
      },
      description: {
        zh: '致敬苹果发布会 Bento 便当盒美学：银灰棉纸底色、非对称圆角纯白与深石墨对比主瓷砖、微妙光感与极简超大数字。',
        en: 'Apple Keynote Bento Grid system with silver-paper backdrop, asymmetric rounded white & obsidian contrast hero tiles, and SF display hierarchy.',
        ja: '銀灰ベースに非対称ベントータイルと深黒コントラストカードを配した製品発表スライド。',
        ko: '실버 페이퍼 배경과 비대칭 벤토 타일, 딥 블랙 대비 히어로 카드로 구성된 런칭 프레젠테이션.',
      },
      category: 'presentation',
      defaultLocale: 'zh-CN',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['apple', 'bento', 'keynote', 'launch', 'ppt', 'pptx', '16x9', 'minimal'],
    },
    theme: {
      bg: '#F5F5F7',
      surface: '#FFFFFF',
      ink: '#1D1D1F',
      muted: '#6E6E73',
      accent: '#0071E3',
      accentSoft: 'rgba(0, 113, 227, 0.10)',
      border: 'rgba(29, 29, 31, 0.08)',
      borderWidth: '1px',
      radius: '24px',
      fontStack: "-apple-system, 'SF Pro Display', 'Inter', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'apple-bento',
    },
  },
  {
    manifest: {
      id: 'apple-dark-keynote',
      name: {
        zh: '苹果发布会 · 暗黑剧场光感主视觉 (16:9)',
        en: 'Apple Dark Keynote · Obsidian Spotlight Deck (16:9)',
        ja: 'Apple風 · ダークキーノート舞台スライド',
        ko: '애플 다크 키노트 · 옵시디언 스포트라이트 데크 (16:9)',
      },
      description: {
        zh: '深邃曜石黑舞台配顶部柔和影棚光晕、半透明高光玻璃指标卡与银蓝金属渐变大标题，尽显旗舰发布会张力。',
        en: 'Pitch obsidian keynote stage with soft studio spotlight, translucent glass stat tiles with 1px specular top edge, and metallic silver-blue hero display.',
        ja: '漆黒ステージにトップスポットライトと高光沢ガラス指標カードを備えたフラッグシップ発表テーマ。',
        ko: '옵시디언 블랙 무대에 상단 스포트라이트와 스페큘러 글래스 지표를 결합한 다크 키노트 테마.',
      },
      category: 'presentation',
      defaultLocale: 'zh-CN',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['apple', 'dark', 'keynote', 'spotlight', 'glass', 'ppt', 'pptx', '16x9'],
    },
    theme: {
      bg: '#050507',
      surface: 'rgba(255, 255, 255, 0.06)',
      ink: '#F5F5F7',
      muted: '#86868B',
      accent: '#2997FF',
      accentSoft: 'rgba(41, 151, 255, 0.16)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderWidth: '1px',
      radius: '22px',
      fontStack: "-apple-system, 'SF Pro Display', 'Inter', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'apple-dark',
    },
  },
  {
    manifest: {
      id: 'xhs-bold-headline',
      name: {
        zh: '小红书 · 爆款黄黑大字报吸睛海报',
        en: 'Xiaohongshu · Acid Yellow & Black Bold Poster',
        ja: 'RED · 爆伸びイエロー×ブラック大見出しポスター',
        ko: '샤오홍슈 · 고클릭 옐로우·블랙 볼드 헤드라인',
      },
      description: {
        zh: '超高点击率爆款大字报视觉：酸性荧光黄撞纯黑粗框印章、紧字距超粗主标与斜贴胶带角标，信息流一眼停驻。',
        en: 'Ultra-high CTR brutalist poster pairing acid highlighter yellow slabs, pitch-black stamp borders, tight massive headlines, and rotated tape tags.',
        ja: '蛍光イエローと極太ブラック枠、斜めステッカータグで視線を奪う高CTRポスターカード。',
        ko: '애시드 옐로우와 딥 블랙 스탬프 테두리, 회전 테이프 스티커로 시선을 사로잡는 고클릭 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'bold', 'headline', 'yellow', 'viral', 'poster', 'brutalist'],
    },
    theme: {
      bg: '#FFE135',
      surface: '#FFFFFF',
      ink: '#0E0E11',
      muted: '#3F3F46',
      accent: '#FF2A54',
      accentSoft: '#FFE135',
      border: '#0E0E11',
      borderWidth: '4px',
      radius: '6px',
      fontStack: "'PingFang SC', 'Hiragino Sans GB', 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
      styleVariant: 'bold-headline',
    },
  },
  {
    manifest: {
      id: 'xhs-apple-notes',
      name: {
        zh: '小红书 · 苹果备忘录真诚手记卡',
        en: 'Xiaohongshu · Apple Notes Authentic Journal',
        ja: 'RED · Appleメモ風・リアル手記カード',
        ko: '샤오홍슈 · 애플 메모 감성 진정성 노트',
      },
      description: {
        zh: '小红书自然流高赞密码：还原暖白备忘录纸面、微妙横线纹理、琥珀金顶部导航与时间戳，真诚克制极易引发共鸣。',
        en: 'Authentic warm-paper iOS Notes aesthetic with ruled grain, amber-gold header chrome, and effortless organic readability.',
        ja: '温かみのある紙面とアンバーゴールド見出し、自然な可読性で共感を生むAppleメモ風カード。',
        ko: '따뜻한 종이 질감과 앰버 골드 상단 라인으로 자연스러운 공감을 이끄는 애플 메모 스타일 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'apple-notes', 'notes', 'authentic', 'organic', 'journal', 'paper'],
    },
    theme: {
      bg: '#FAF9F4',
      surface: '#F4F1E8',
      ink: '#1C1917',
      muted: '#78716C',
      accent: '#D99B06',
      accentSoft: 'rgba(234, 179, 8, 0.14)',
      border: '#E7E2D5',
      borderWidth: '1px',
      radius: '14px',
      fontStack: "-apple-system, 'SF Pro Text', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'apple-notes',
    },
  },
  {
    manifest: {
      id: 'xhs-morandi-cream',
      name: {
        zh: '小红书 · 莫兰迪奶油温柔手账卡',
        en: 'Xiaohongshu · Morandi Oat Cream Botanical',
        ja: 'RED · モランディ・クリームボタニカル手帖',
        ko: '샤오홍슈 · 모란디 크림 보태니컬 다이어리',
      },
      description: {
        zh: '低饱和莫兰迪燕麦奶油底、鼠尾草绿与柔陶土点缀、精致衬线排版与植物角饰，适合生活方式、审美笔记与成长感悟。',
        en: 'Warm oat-cream palette with muted sage green, soft terracotta accents, delicate serif display, generous whitespace, and botanical ornaments.',
        ja: 'オートクリーム地にセージグリーンとテラコッタ、繊細な明朝体と植物装飾を添えた優しい手帖カード。',
        ko: '따뜻한 오트 크림과 세이지 그린, 테라코타 포인트, 보태니컬 장식이 어우러진 감성 에디토리얼.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'morandi', 'cream', 'sage', 'terracotta', 'botanical', 'aesthetic'],
    },
    theme: {
      bg: '#F5EFE6',
      surface: '#FBF8F3',
      ink: '#3A322C',
      muted: '#84786D',
      accent: '#C87D65',
      accentSoft: 'rgba(124, 143, 123, 0.16)',
      border: '#E2D7C8',
      borderWidth: '1px',
      radius: '22px',
      fontStack: "'Songti SC', 'Noto Serif SC', 'Hiragino Mincho ProN', Georgia, serif",
      styleVariant: 'morandi-cream',
    },
  },
  {
    manifest: {
      id: 'xhs-liquid-glass',
      name: {
        zh: '小红书 · 液态毛玻璃极光海报',
        en: 'Xiaohongshu · Liquid Glass Aurora Poster',
        ja: 'RED · リキッドグラス・オーロラポスター',
        ko: '샤오홍슈 · 리퀴드 글래스 오로라 포스터',
      },
      description: {
        zh: '柔光弥散极光网格背景配悬浮磨砂液态玻璃卡片与虹彩高光描边，兼具未来感与通透呼吸感，适合 AI 工具与新品分享。',
        en: 'Luminous pastel aurora mesh gradient with elevated frosted glass panels, backdrop blur, and soft iridescent specular borders.',
        ja: '淡いオーロラメッシュ背景にすりガラスパネルと虹色エッジが浮かぶ次世代ポスター。',
        ko: '부드러운 오로라 메쉬 그라데이션 위에 투명한 프로스트 글래스 패널이 떠오르는 모던 포스터.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'liquid-glass', 'glassmorphism', 'aurora', 'mesh', 'ai', 'modern'],
    },
    theme: {
      bg: '#E8EEFF',
      surface: 'rgba(255, 255, 255, 0.72)',
      ink: '#1E1B4B',
      muted: '#575E82',
      accent: '#6366F1',
      accentSoft: 'rgba(99, 102, 241, 0.14)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderWidth: '1.5px',
      radius: '24px',
      fontStack: "'Plus Jakarta Sans', 'SF Pro Display', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'liquid-glass',
    },
  },
  {
    manifest: {
      id: 'xhs-pro-vs-con',
      name: {
        zh: '小红书 · 爆款深度对比评测卡（红黑榜）',
        en: 'Xiaohongshu · Pro vs Con Verdict Scorecard',
        ja: 'RED · 徹底比較レビュー（メリット・デメリット）',
        ko: '샤오홍슈 · 장단점 딥 비교 리뷰 카드',
      },
      description: {
        zh: '清爽冷静的评测白板底色配双色裁决顶栏，祖母绿红榜与珊瑚红黑榜分栏清晰，自带评分胶囊，专为横评避坑打造。',
        en: 'Crisp slate-white review board with split emerald-vs-coral verdict header, clear comparison columns, and callout score pills.',
        ja: 'エメラルド×コーラルの対比ヘッダーと評価ピルで結論が一目で伝わる比較レビューカード。',
        ko: '에메랄드와 코랄 컬러의 명확한 대조로 장단점과 평점을 한눈에 보여주는 비교 리뷰 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'comparison', 'review', 'verdict', 'pro-con', 'benchmark'],
    },
    theme: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      ink: '#0F172A',
      muted: '#64748B',
      accent: '#059669',
      accentSoft: '#ECFDF5',
      border: '#E2E8F0',
      borderWidth: '1.5px',
      radius: '18px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'verdict-split',
    },
  },
  {
    manifest: {
      id: 'xhs-quote-card',
      name: {
        zh: '小红书 · 高级播客金句引语卡',
        en: 'Xiaohongshu · Forest & Champagne Quote Card',
        ja: 'RED · 深緑シャンパン・ポッドキャスト名言カード',
        ko: '샤오홍슈 · 포레스트 샴페인 팟캐스트 명언 카드',
      },
      description: {
        zh: '深邃哑光墨绿炭底配暖香槟金衬线大字、巨型半透明引号水印与极简署名底线，自带高级播客与访谈录质感。',
        en: 'Matte forest-charcoal finish with warm champagne serif display, giant decorative quotation watermark, and minimal editorial attribution.',
        ja: 'マットな深緑チャコールにシャンパンゴールド明朝体と特大引用符透かしを配した名言カード。',
        ko: '매트한 포레스트 차콜 배경에 샴페인 골드 세리프와 대형 따옴표 워터마크를 담은 명언 카드.',
      },
      category: 'xiaohongshu',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'pdf', 'wechat', 'pptx', 'mp4', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['xiaohongshu', 'quote', 'podcast', 'champagne', 'serif', 'dark-green', 'editorial'],
    },
    theme: {
      bg: '#13201B',
      surface: '#1B2D26',
      ink: '#E8D5B5',
      muted: '#9AB0A5',
      accent: '#D4B483',
      accentSoft: 'rgba(212, 180, 131, 0.14)',
      border: 'rgba(232, 213, 181, 0.24)',
      borderWidth: '1px',
      radius: '8px',
      fontStack: "'Songti SC', 'Noto Serif SC', 'Iowan Old Style', Georgia, serif",
      styleVariant: 'editorial-quote',
    },
  },
  {
    manifest: {
      id: 'wechat-deep-report',
      name: {
        zh: '微信生态 · 深度科技行业研报（金融时报风）',
        en: 'WeChat · Deep Tech Industry Report (Navy & Brass)',
        ja: 'WeChat · 金融・テクノロジー業界深掘りレポート',
        ko: '위챗 · 딥테크 산업 리서치 리포트 (네이비·브라스)',
      },
      description: {
        zh: '对标彭博与经济学人研报视觉：深海藏蓝通栏刊头、暖黄铜分割线、象牙白研报正文与结构化数据观察框。',
        en: 'Bloomberg/Economist-caliber intelligence brief pairing deep navy masthead, warm brass accent rule, crisp ivory body, and analyst callouts.',
        ja: '濃紺マストヘッドと真鍮ゴールド罫線、アイボリー本文で構成された本格業界レポート。',
        ko: '딥 네이비 마스트헤드와 브라스 골드 라인, 아이보리 본문이 돋보이는 산업 리서치 카드.',
      },
      category: 'wechat',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'wechat', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['wechat', 'report', 'research', 'navy', 'brass', 'bloomberg', 'industry'],
    },
    theme: {
      bg: '#FDFBF7',
      surface: '#F4EFE4',
      ink: '#0F1D30',
      muted: '#5A6778',
      accent: '#C49245',
      accentSoft: 'rgba(196, 146, 69, 0.14)',
      border: '#DDD3C0',
      borderWidth: '1px',
      radius: '4px',
      fontStack: "'Songti SC', 'Noto Serif SC', Georgia, 'PingFang SC', serif",
      styleVariant: 'deep-report',
    },
  },
  {
    manifest: {
      id: 'wechat-frontpage-news',
      name: {
        zh: '微信生态 · 复古头版快讯报纸',
        en: 'WeChat · Archival Frontpage Broadsheet',
        ja: 'WeChat · レトロ新聞一面速報フォーマット',
        ko: '위챗 · 빈티지 신문 1면 브로드시트 속보',
      },
      description: {
        zh: '复古新闻纸质底色配经典双线报头（THE DAILY BRIEF）、高反差宋体大标题与多栏细线分割，紧跟热点快讯极具传播力。',
        en: 'Archival newsprint broadsheet with double-rule THE DAILY BRIEF masthead, high-contrast serif headline, and hairline editorial columns.',
        ja: '新聞紙テクスチャと二重罫線マストヘッド、明朝特大見出しが映えるクラシック速報デザイン。',
        ko: '아카이벌 뉴스프린트 질감과 클래식 이중선 제호, 강렬한 세리프 헤드라인의 1면 속보 카드.',
      },
      category: 'wechat',
      defaultLocale: 'zh-CN',
      aspect: '3:4',
      width: 1080,
      height: 1440,
      supportedFormats: ['png', 'wechat', 'pdf', 'html'],
      supportsMotion: false,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['wechat', 'newspaper', 'broadsheet', 'frontpage', 'news', 'vintage', 'press'],
    },
    theme: {
      bg: '#F6F2E8',
      surface: '#EFE9DA',
      ink: '#141210',
      muted: '#575148',
      accent: '#9B1C1C',
      accentSoft: 'rgba(155, 28, 28, 0.10)',
      border: '#141210',
      borderWidth: '1px',
      radius: '0px',
      fontStack: "'Songti SC', 'Noto Serif SC', Georgia, 'Times New Roman', serif",
      styleVariant: 'frontpage-news',
    },
  },
  {
    manifest: {
      id: 'ppt-linear-dark',
      name: {
        zh: 'Linear 极简暗黑产品发布 PPT (16:9)',
        en: 'Linear Dark · Precision Product Launch Deck (16:9)',
        ja: 'Linear風 · 極細ダーク製品リリーススライド',
        ko: '리니어 다크 · 미니멀 프로덕트 런칭 PPT (16:9)',
      },
      description: {
        zh: '深受硅谷开发者追捧的 Linear 暗黑美学：深碳黑画布、1px 极细高光边框、靛紫顶部柔光晕与等宽技术元数据。',
        en: 'Deep carbon #08090C canvas with razor-sharp 1px specular borders, soft indigo-violet halo glow, Inter display, and JetBrains Mono metadata.',
        ja: 'ディープカーボン背景に1px極細ボーダーとインディゴ光暈、等幅メタデータを備えたモダン製品発表PPT。',
        ko: '딥 카본 배경과 1px 스페큘러 보더, 인디고-바이올렛 헤일로가 어우러진 미니멀 제품 발표 슬라이드.',
      },
      category: 'presentation',
      defaultLocale: 'en',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['linear', 'dark', 'saas', 'product', 'launch', 'ppt', 'pptx', '16x9'],
    },
    theme: {
      bg: '#08090C',
      surface: '#11131A',
      ink: '#F7F8F8',
      muted: '#8A8F98',
      accent: '#5E6AD2',
      accentSoft: 'rgba(94, 106, 210, 0.16)',
      border: 'rgba(255, 255, 255, 0.09)',
      borderWidth: '1px',
      radius: '14px',
      fontStack: "'Inter', 'Plus Jakarta Sans', -apple-system, 'PingFang SC', sans-serif",
      styleVariant: 'linear-dark',
    },
  },
  {
    manifest: {
      id: 'ppt-bauhaus-bold',
      name: {
        zh: '瑞士包豪斯 · 三原色几何海报 PPT (16:9)',
        en: 'Bauhaus Bold · Primary Geometric Presentation (16:9)',
        ja: 'バウハウス · 三原色ジオメトリック発表スライド',
        ko: '바우하우스 볼드 · 삼원색 기하학 프레젠테이션 (16:9)',
      },
      description: {
        zh: '纯美术馆白底配克制的包豪斯三原色几何色块（深红、群青、芥末黄）、极粗无衬线字体与严格模数网格对齐。',
        en: 'Pure gallery-white canvas anchored by Bauhaus crimson, ultramarine, and mustard geometric blocks with heavy grotesque typography.',
        ja: 'ギャラリーホワイト地に赤・青・黄の幾何学アンカーと極太サンセリフを配したバウハウス構成。',
        ko: '갤러리 화이트 위에 크림슨·울트라마린·머스타드 기하학 블록과 볼드 그로테스크 타이포를 결합한 16:9 슬라이드.',
      },
      category: 'presentation',
      defaultLocale: 'en',
      aspect: '16:9',
      width: 1920,
      height: 1080,
      supportedFormats: ['pptx', 'pdf', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['bauhaus', 'swiss', 'geometric', 'primary-colors', 'poster', 'ppt', 'pptx', '16x9'],
    },
    theme: {
      bg: '#FAFAFA',
      surface: '#FFFFFF',
      ink: '#111111',
      muted: '#525252',
      accent: '#E12D39',
      accentSoft: 'rgba(225, 45, 57, 0.10)',
      border: '#111111',
      borderWidth: '3px',
      radius: '0px',
      fontStack: "'Helvetica Neue', 'Plus Jakarta Sans', 'Inter', 'PingFang SC', sans-serif",
      styleVariant: 'bauhaus-bold',
    },
  },
  {
    manifest: {
      id: 'poster-risograph',
      name: {
        zh: 'Risograph · 复古孔版双色叠印艺术海报 (4:5)',
        en: 'Risograph · Fluorescent Coral & Cobalt Print Poster (4:5)',
        ja: 'リソグラフ · 蛍光コーラル×コバルト二色刷りポスター',
        ko: '리소그래프 · 형광 코랄·코발트 투톤 아트 포스터 (4:5)',
      },
      description: {
        zh: '暖米印刷纸基配荧光珊瑚红与钴蓝双色孔版叠印、微妙半调网点纹理与极具张力的独立艺术海报排版。',
        en: 'Warm cream print stock layered with fluorescent coral & cobalt duotone ink, subtle CSS halftone dot grain, and bold poster typography.',
        ja: 'クリーム印刷紙に蛍光コーラルとコバルトインクを重ねた網点リソグラフ風エディトリアルポスター。',
        ko: '크림 인쇄지 위에 형광 코랄과 코발트 잉크, 하프톤 도트 질감을 더한 리소그래프 포스터.',
      },
      category: 'linkedin',
      defaultLocale: 'en',
      aspect: '4:5',
      width: 1080,
      height: 1350,
      supportedFormats: ['pdf', 'png', 'pptx', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['risograph', 'poster', 'duotone', 'halftone', 'coral', 'cobalt', 'print', 'art'],
    },
    theme: {
      bg: '#F7F1E3',
      surface: '#FFFBF2',
      ink: '#191C3A',
      muted: '#4A5070',
      accent: '#FF4D3D',
      accentSoft: 'rgba(27, 71, 214, 0.12)',
      border: '#1B47D6',
      borderWidth: '3px',
      radius: '4px',
      fontStack: "'Plus Jakarta Sans', 'Inter', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'risograph',
    },
  },
  {
    manifest: {
      id: 'video-podcast-wave',
      name: {
        zh: '播客声波 · 9:16 午夜金句口播竖屏短视频',
        en: 'Podcast Wave · 9:16 Equalizer Quote Short Video',
        ja: 'ポッドキャスト波形 · 9:16 縦型オーディオ名言動画',
        ko: '팟캐스트 웨이브 · 9:16 이퀄라이저 숏폼 비디오',
      },
      description: {
        zh: '深邃午夜靛蓝渐变底配风格化声波均衡器视觉、发光 ON AIR 徽章、高对比居中金句与安全区底部字幕条。',
        en: 'Rich midnight obsidian-indigo stage with stylized acoustic equalizer waveform motif, ON AIR badge, crisp speaker cards, and safe caption zone.',
        ja: 'ミッドナイトインディゴ背景にイコライザー波形と高コントラスト字幕を備えた縦型ポッドキャスト動画。',
        ko: '미드나잇 인디고 그라데이션 위에 사운드 웨이브 이퀄라이저와 안전 영역 자막을 담은 9:16 팟캐스트 영상.',
      },
      category: 'short-video',
      defaultLocale: 'zh-CN',
      aspect: '9:16',
      width: 1080,
      height: 1920,
      supportedFormats: ['mp4', 'png', 'html'],
      supportsMotion: true,
      contributor: { name: 'Aimake Core', handle: '@chicogong', url: 'https://aimake.cc' },
      tags: ['podcast', 'audio', 'waveform', 'video', 'mp4', '9x16', 'shorts', 'reels'],
    },
    theme: {
      bg: '#080B1C',
      surface: 'rgba(23, 28, 62, 0.85)',
      ink: '#F8FAFC',
      muted: '#9AA8D6',
      accent: '#38BDF8',
      accentSoft: 'rgba(167, 139, 250, 0.18)',
      border: 'rgba(148, 163, 255, 0.24)',
      borderWidth: '1px',
      radius: '22px',
      fontStack: "'Plus Jakarta Sans', 'PingFang SC', 'Noto Sans SC', sans-serif",
      styleVariant: 'podcast-wave',
    },
  },
];

function getVariantCss(variant, manifest, theme) {
  switch (variant) {
    case 'swiss':
      return `
        .aimake-slide {
          background-color: var(--bg);
          background-image:
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
          background-size: 36px 36px;
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 6px;
          background: var(--accent);
        }
        .top-bar {
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }
        .eyebrow {
          background: var(--ink);
          color: var(--bg);
          padding: 6px 14px;
          border-radius: 4px;
          letter-spacing: 0.12em;
          font-size: 15px;
        }
        .page-index {
          background: var(--accent);
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: 4px;
          font-weight: 800;
        }
        h1.slide-title {
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
          letter-spacing: -0.035em;
        }
        .bullet-dot {
          background: var(--accent);
          color: #FFFFFF;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 17px;
          line-height: 1.2;
        }
        .metric-card {
          border: 1px solid var(--border);
          border-top: 3px solid var(--accent);
          box-shadow: var(--card-shadow);
          backdrop-filter: blur(16px);
        }
      `;

    case 'paper-editorial':
      return `
        .aimake-slide {
          background: radial-gradient(circle at 20% 10%, #FFFDF8 0%, #FAF6EE 55%, #F2EADB 100%);
          border: 1px solid #D6CCB9;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          inset: 26px;
          border: 1px solid rgba(31, 94, 75, 0.22);
          pointer-events: none;
        }
        .aimake-slide::after {
          content: '§';
          position: absolute;
          bottom: 118px;
          right: 68px;
          font-size: 64px;
          line-height: 1;
          color: rgba(31, 94, 75, 0.14);
          font-family: Georgia, serif;
          pointer-events: none;
        }
        .top-bar {
          border-bottom: 1px solid #D6CCB9;
          padding-bottom: 16px;
        }
        .eyebrow {
          color: var(--accent);
          border-left: 4px solid var(--accent);
          padding-left: 12px;
        }
        h1.slide-title {
          font-weight: 700;
          line-height: 1.3;
        }
        ul.bullet-list li {
          background: rgba(255, 253, 248, 0.85);
          border-left: 4px solid var(--accent);
        }
        .quote-box {
          background: #F0E8D8;
          font-style: italic;
        }
      `;

    case 'neon-tech':
      return `
        .aimake-slide {
          background-color: #090D14;
          background-image:
            radial-gradient(circle at 88% 8%, rgba(56, 189, 248, 0.20) 0%, transparent 42%),
            radial-gradient(circle at 12% 92%, rgba(99, 102, 241, 0.15) 0%, transparent 45%),
            radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 28px 28px;
          border: 1px solid #243247;
        }
        .top-bar {
          background: #101724;
          border: 1px solid #26354D;
          border-radius: 12px;
          padding: 14px 22px;
          margin-bottom: 24px;
        }
        .top-bar::before {
          content: '● ● ●';
          font-size: 14px;
          letter-spacing: 6px;
          color: #38BDF8;
          margin-right: 14px;
        }
        .metric-card {
          background: linear-gradient(145deg, #131C2D 0%, #0E1522 100%);
          border: 1px solid #283A54;
          border-left: 4px solid var(--accent);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        }
        .metric-delta {
          background: rgba(56, 189, 248, 0.16);
          color: #7DD3FC;
          padding: 4px 10px;
          border-radius: 999px;
          opacity: 1;
        }
        ul.bullet-list li {
          background: rgba(18, 25, 38, 0.9);
          border: 1px solid #26354D;
        }
        .code-box {
          border: 1px solid #38BDF8;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.12);
        }
      `;

    case 'warm-magazine':
      return `
        .aimake-slide {
          background: linear-gradient(180deg, #FDF6EC 0%, #FAF0E1 100%);
          border: 2px solid #D9BDA0;
        }
        .aimake-slide::before {
          content: 'AIMAKE EDITORIAL · SPECIAL EDITION';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 44px;
          background: var(--accent);
          color: #FFF8F0;
          font-family: var(--mono);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.24em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .top-bar {
          margin-top: 12px;
          border-top: 4px solid #2A1E17;
          border-bottom: 1px solid #2A1E17;
          padding: 14px 0;
        }
        .eyebrow {
          color: var(--accent);
          letter-spacing: 0.16em;
        }
        h1.slide-title {
          font-weight: 800;
          line-height: 1.24;
          color: #261810;
        }
        .metric-card {
          background: #FFF9F1;
          border: 1px solid #D9BDA0;
          border-bottom: 4px solid var(--accent);
        }
        ul.bullet-list li {
          background: #FFF9F1;
          border: 1px solid #DFC7AE;
        }
        .bullet-dot {
          color: var(--accent);
          font-family: Georgia, serif;
          font-style: italic;
        }
        .quote-box {
          background: #F3E0C9;
          border: 1px solid #D4A983;
          border-left: 8px solid var(--accent);
          border-radius: 4px;
        }
      `;

    case 'pop-sticker':
      return `
        .aimake-slide {
          background-color: #FFFBF0;
          background-image: radial-gradient(#CFC4AF 1.8px, transparent 1.8px);
          background-size: 26px 26px;
          border: 5px solid #18181B;
        }
        .aimake-slide::after {
          content: '★ SAVE THIS';
          position: absolute;
          top: 22px;
          right: -12px;
          background: #FDE047;
          color: #18181B;
          border: 3px solid #18181B;
          box-shadow: 4px 4px 0 #18181B;
          padding: 6px 22px;
          font-family: var(--mono);
          font-size: 16px;
          font-weight: 800;
          transform: rotate(3deg);
          pointer-events: none;
        }
        .top-bar {
          border-bottom: 3px solid #18181B;
          padding-bottom: 16px;
          padding-right: 140px;
        }
        .eyebrow {
          background: #FDE047;
          color: #18181B;
          border: 3px solid #18181B;
          box-shadow: 4px 4px 0 #18181B;
          padding: 6px 16px;
          border-radius: 8px;
        }
        .page-index {
          background: #FFFFFF;
          color: #18181B;
          border: 3px solid #18181B;
          padding: 4px 12px;
          border-radius: 999px;
          font-weight: 800;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: #FFFFFF;
          border: 3px solid #18181B;
          box-shadow: 6px 6px 0 #18181B;
        }
        .bullet-dot {
          background: var(--accent);
          color: #FFFFFF;
          border: 2px solid #18181B;
          border-radius: 999px;
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .quote-box {
          background: #FEF9C3;
          border-left: 8px solid var(--accent);
        }
      `;

    case 'wechat-greenbook':
      return `
        .aimake-slide {
          background: linear-gradient(160deg, #EFF7F2 0%, #E4F0E8 100%);
          border: 1px solid #CCE0D3;
        }
        .top-bar {
          border-bottom: none;
          padding-bottom: 6px;
          margin-bottom: 18px;
        }
        .eyebrow {
          background: #07994E;
          color: #FFFFFF;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 18px;
        }
        .page-index {
          background: #FFFFFF;
          color: #07994E;
          border: 1px solid #C6E2D1;
          padding: 6px 16px;
          border-radius: 999px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: #FFFFFF;
          border: 1px solid #D5E6DB;
          box-shadow: 0 8px 24px rgba(7, 153, 78, 0.07);
        }
        .bullet-dot {
          background: #E2F5EA;
          color: #07994E;
          padding: 4px 12px;
          border-radius: 10px;
          font-size: 19px;
        }
      `;

    case 'wechat-editorial':
      return `
        .aimake-slide {
          background: #FFFFFF;
          border: 1px solid #DCE3EE;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 56px;
          left: 0;
          width: 10px;
          height: 180px;
          background: var(--accent);
          border-radius: 0 6px 6px 0;
        }
        .top-bar {
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 16px;
        }
        .eyebrow {
          color: var(--accent);
          letter-spacing: 0.08em;
        }
        ul.bullet-list li {
          background: #F8FAFD;
          border: 1px solid #E2E8F0;
          border-left: 4px solid var(--accent);
        }
        .metric-card {
          background: #F8FAFD;
          border-top: 3px solid var(--accent);
        }
      `;

    case 'wechat-minimal-brief':
      return `
        .aimake-slide {
          background: #FCFBF8;
          border: 1px solid #D5DCE6;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 14px;
          background: linear-gradient(90deg, #1D4ED8 0%, #60A5FA 100%);
        }
        .top-bar {
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .eyebrow {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 17px;
        }
        h1.slide-title {
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .metric-card {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
        }
        ul.bullet-list li {
          background: transparent;
          border: none;
          border-bottom: 1px solid #DCE3EE;
          border-radius: 0;
          padding: 18px 8px;
        }
        .bullet-dot {
          background: #1D4ED8;
          color: #FFFFFF;
          border-radius: 999px;
          padding: 3px 11px;
          font-size: 17px;
        }
        .footer-bar {
          background: #F1F5F9;
          margin: 20px -72px -72px -72px;
          padding: 20px 72px;
          border-top: 1px solid #CBD5E1;
        }
      `;

    case 'linkedin-exec':
      return `
        .aimake-slide {
          background: linear-gradient(155deg, #0B1221 0%, #111C33 60%, #0A101E 100%);
          border: 1px solid #24344D;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 12px;
          background: linear-gradient(90deg, #2563EB 0%, #38BDF8 100%);
        }
        .top-bar {
          border-bottom: 1px solid rgba(148, 163, 184, 0.22);
        }
        .eyebrow {
          background: rgba(59, 130, 246, 0.16);
          border: 1px solid rgba(59, 130, 246, 0.45);
          color: #93C5FD;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 17px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(22, 32, 51, 0.92);
          border: 1px solid #2C3E5C;
          border-top: 2px solid rgba(96, 165, 250, 0.5);
        }
        .footer-bar::after {
          content: 'SWIPE →';
          background: #2563EB;
          color: #FFFFFF;
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 15px;
        }
      `;

    case 'founder-whiteboard':
      return `
        .aimake-slide {
          background-color: var(--bg);
          background-image:
            linear-gradient(to right, rgba(37, 99, 235, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
        }
        .aimake-slide::before {
          content: '┌  SCHEMATIC WHITEBOARD  ┐';
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--mono);
          font-size: 14px;
          letter-spacing: 0.2em;
          color: #3B82F6;
        }
        .top-bar {
          border-bottom: 2px dashed #93C5FD;
        }
        .eyebrow {
          background: #FEF08A;
          color: #1E3A8A;
          padding: 6px 14px;
          border: 2px solid #2563EB;
          border-radius: 6px;
        }
        h1.slide-title {
          position: relative;
          display: inline-block;
          border-bottom: 6px solid #93C5FD;
          padding-bottom: 10px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: var(--surface);
          border: 1px dashed rgba(59, 130, 246, 0.4);
          box-shadow: var(--card-shadow);
          backdrop-filter: blur(12px);
        }
        .quote-box {
          background: #EFF6FF;
          border: 2px dashed #2563EB;
          border-left: 6px solid #2563EB;
        }
      `;

    case 'substack-digest':
      return `
        .aimake-slide {
          background: #F8F5EE;
          border: 1px solid #D6D0C4;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 28px;
          left: 72px;
          right: 72px;
          height: 10px;
          border-top: 5px solid #1C1917;
          border-bottom: 1.5px solid #1C1917;
        }
        .top-bar {
          margin-top: 8px;
          border-bottom: 1px solid #C8C1B4;
          padding-bottom: 14px;
        }
        .eyebrow {
          color: #EA580C;
          font-family: var(--mono);
          letter-spacing: 0.14em;
        }
        h1.slide-title {
          font-weight: 700;
          line-height: 1.24;
          letter-spacing: -0.015em;
        }
        ul.bullet-list li {
          background: transparent;
          border: none;
          border-top: 1px solid #D6D0C4;
          border-radius: 0;
          padding: 20px 0;
        }
        .bullet-dot {
          color: #EA580C;
          font-family: Georgia, serif;
          font-size: 26px;
          min-width: 42px;
        }
        .metric-card {
          background: #F1ECE1;
          border: 1px solid #D6D0C4;
          border-top: 3px solid #1C1917;
        }
        .quote-box {
          background: #EFE9DC;
          border-left: 5px solid #EA580C;
          font-style: italic;
        }
      `;

    case 'x-zukai':
      return `
        .aimake-slide {
          background-color: var(--bg);
          background-image:
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
          background-size: 32px 32px;
          border: 1px solid var(--border);
          padding: 0 64px 44px 64px !important;
          line-break: strict;
          word-break: normal;
          overflow-wrap: anywhere;
          box-shadow: var(--card-shadow);
        }
        .top-bar {
          background: #1E3A8A;
          color: #FFFFFF;
          margin: 0 -64px 26px -64px;
          padding: 20px 64px;
          border-bottom: 2px solid #3B82F6;
        }
        .eyebrow {
          color: #93C5FD;
        }
        .page-index {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          padding: 4px 14px;
          border-radius: 6px;
        }
        .bullet-list.grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        ul.bullet-list li, .metric-card, .compare-col {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 3px solid #1E40AF;
          box-shadow: var(--card-shadow);
          backdrop-filter: blur(16px);
        }
        .bullet-dot {
          background: #1E40AF;
          color: #FFFFFF;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 17px;
        }
      `;

    case 'ja-note':
      return `
        .aimake-slide {
          background-color: #F7F3EA;
          background-image:
            repeating-linear-gradient(0deg, rgba(160, 145, 120, 0.04) 0px, rgba(160, 145, 120, 0.04) 2px, transparent 2px, transparent 8px);
          border: 1px solid #DCD4C5;
          line-break: strict;
          word-break: normal;
          overflow-wrap: anywhere;
        }
        .aimake-slide::after {
          content: '記';
          position: absolute;
          top: 56px;
          right: 64px;
          width: 58px;
          height: 58px;
          border: 3px solid #C73E3A;
          border-radius: 6px;
          color: #C73E3A;
          font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
          font-size: 30px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.88;
        }
        .top-bar {
          border-bottom: 1px solid #D5CCBC;
          padding-right: 84px;
        }
        .eyebrow {
          color: #1D2D44;
          letter-spacing: 0.16em;
        }
        h1.slide-title {
          font-weight: 700;
          line-height: 1.38;
          color: #1D2D44;
        }
        ul.bullet-list li {
          background: rgba(253, 251, 247, 0.9);
          border: 1px solid #DFD7C8;
          border-left: 3px solid #1D2D44;
        }
        .bullet-dot {
          color: #C73E3A;
        }
        .metric-card {
          background: #FDFBF7;
          border: 1px solid #DFD7C8;
        }
      `;

    case 'ig-cardnews-kr':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 92% 10%, rgba(255, 85, 0, 0.22) 0%, transparent 40%),
            #111216;
          border: 1px solid #2A2E38;
          word-break: keep-all;
          overflow-wrap: break-word;
        }
        .top-bar {
          border-bottom: 1px solid #2A2E38;
        }
        .eyebrow {
          background: #FF5500;
          color: #FFFFFF;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 18px;
        }
        h1.slide-title {
          letter-spacing: -0.03em;
          line-height: 1.24;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: #1B1E25;
          border: 1px solid #323744;
        }
        .bullet-dot {
          background: rgba(255, 85, 0, 0.18);
          color: #FF7833;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 18px;
        }
        .footer-bar::after {
          content: '● ○ ○ ○';
          color: #FF5500;
          letter-spacing: 5px;
          font-size: 15px;
        }
      `;

    case 'ko-lookbook':
      return `
        .aimake-slide {
          background: #F1F0EC;
          border: 1px solid #D8D6D0;
          word-break: keep-all;
          overflow-wrap: break-word;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          inset: 28px;
          border: 1.5px solid #222325;
          pointer-events: none;
        }
        .top-bar {
          border-bottom: 1px solid #222325;
          padding-bottom: 16px;
        }
        .eyebrow {
          background: #2A6F68;
          color: #FFFFFF;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 17px;
          letter-spacing: 0.12em;
        }
        h1.slide-title {
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.26;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: #FFFFFF;
          border: 1px solid #D5D3CD;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }
        .bullet-dot {
          color: #2A6F68;
          border-right: 1px solid #D5D3CD;
          padding-right: 14px;
        }
      `;

    case 'ppt-executive':
      return `
        .aimake-slide {
          background: linear-gradient(180deg, #FFFFFF 0%, #F4F7FC 100%);
          border: 1px solid #DCE3EE;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 16px;
          background: #0F294A;
        }
        .top-bar {
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .eyebrow {
          background: #E8EFFD;
          color: #1E40AF;
          padding: 6px 16px;
          border-radius: 6px;
        }
        .bullet-list.grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: #FFFFFF;
          border: 1px solid #DCE3EE;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
        }
      `;

    case 'ppt-tech-arch':
      return `
        .aimake-slide {
          background-color: #0B1018;
          background-image:
            linear-gradient(to right, rgba(47, 129, 247, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(47, 129, 247, 0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          border: 1px solid #2A3647;
        }
        .top-bar {
          border-bottom: 1px solid #2A3647;
        }
        .eyebrow {
          background: rgba(47, 129, 247, 0.16);
          border: 1px solid rgba(47, 129, 247, 0.5);
          color: #79C0FF;
          padding: 6px 16px;
          border-radius: 6px;
        }
        .bullet-list.grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(19, 27, 38, 0.94);
          border: 1px solid #2A3647;
          border-top: 3px solid #2F81F7;
        }
      `;

    case 'ppt-consulting':
      return `
        .aimake-slide {
          background: #FFFFFF;
          border: 1px solid #C7D6E6;
          padding: 0 88px 48px 88px !important;
        }
        .top-bar {
          background: #0A2540;
          color: #FFFFFF;
          margin: 0 -88px 26px -88px;
          padding: 18px 88px;
          border-bottom: 2px solid #0066B3;
        }
        .eyebrow {
          color: #93C5FD;
          letter-spacing: 0.12em;
        }
        .page-index {
          color: #E2E8F0;
        }
        h1.slide-title {
          background: rgba(10, 37, 64, 0.04);
          border-left: 4px solid #0A2540;
          padding: 16px 24px;
          color: #0A2540;
          font-weight: 800;
          border-radius: 0 8px 8px 0;
        }
        .bullet-list.grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .metric-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 3px solid #0A2540;
          box-shadow: var(--card-shadow);
        }
        ul.bullet-list li {
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
        }
        .compare-col {
          border-top: 3px solid #0A2540;
        }
        .compare-col.highlight {
          border-top-color: #0066B3;
          background: #F0F6FC;
        }
        .footer-bar {
          border-top: 2px solid #0A2540;
          font-size: 16px;
        }
      `;

    case 'edu-flashcard':
      return `
        .aimake-slide {
          background: radial-gradient(circle at 50% 0%, #FFFDF5 0%, #FFF7E0 100%);
          border: 1.5px solid #F59E0B;
          box-shadow: var(--card-shadow);
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          inset: 20px;
          border: 1.5px dashed rgba(245, 158, 11, 0.45);
          border-radius: 24px;
          pointer-events: none;
        }
        .top-bar {
          border-bottom: 2px dashed #FCD34D;
        }
        .eyebrow {
          background: #FEF3C7;
          border: 2px solid #F59E0B;
          color: #B45309;
          padding: 7px 18px;
          border-radius: 999px;
        }
        .page-index {
          background: #D97706;
          color: #FFFFFF;
          padding: 6px 16px;
          border-radius: 999px;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: var(--surface);
          border: 1px solid #FCD34D;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.12);
        }
        .bullet-dot {
          background: #F59E0B;
          color: #FFFFFF;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 18px;
        }
      `;

    case 'edu-lesson-guide':
      return `
        .aimake-slide {
          background-color: #FCFBF5;
          background-image:
            linear-gradient(to bottom, transparent 35px, rgba(148, 163, 184, 0.22) 36px);
          background-size: 100% 36px;
          border: 2px solid #1B5E43;
          padding: 0 72px 58px 72px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 94px;
          bottom: 0;
          left: 44px;
          width: 2px;
          background: rgba(220, 38, 38, 0.28);
          pointer-events: none;
        }
        .top-bar {
          background: #1B4D3E;
          color: #FFFFFF;
          margin: 0 -72px 26px -72px;
          padding: 28px 72px 24px 72px;
          border-bottom: 5px solid #E9C46A;
        }
        .eyebrow {
          color: #E9C46A;
        }
        .page-index {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          padding: 5px 14px;
          border-radius: 999px;
        }
        ul.bullet-list li, .metric-card, .compare-col {
          background: rgba(255, 255, 255, 0.94);
          border: 2px solid #B9D0C5;
          border-left: 6px solid #1B5E43;
        }
        .bullet-dot {
          background: #1B5E43;
          color: #E9C46A;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 17px;
        }
        .footer-bar {
          background: #E8F3ED;
          border-top: 2px solid #1B5E43;
          margin: 18px -72px -58px -72px;
          padding: 18px 72px;
          color: #1B4D3E;
          font-weight: 700;
        }
      `;

    case 'video-kinetic':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 85% 12%, rgba(245, 158, 11, 0.25) 0%, transparent 42%),
            radial-gradient(circle at 10% 78%, rgba(56, 189, 248, 0.18) 0%, transparent 40%),
            #070910;
          border: 1px solid #243048;
        }
        .top-bar {
          border-bottom: 1px solid rgba(245, 158, 11, 0.35);
        }
        .eyebrow {
          background: #F59E0B;
          color: #090B10;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 800;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(18, 24, 38, 0.88);
          border: 1px solid rgba(245, 158, 11, 0.35);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }
        .speech-caption {
          background: rgba(10, 14, 24, 0.94);
          border: 2px solid #F59E0B;
          box-shadow: 0 0 28px rgba(245, 158, 11, 0.24);
          font-weight: 700;
        }
      `;

    case 'video-cinema-talk':
      return `
        .aimake-slide {
          background: radial-gradient(circle at 50% 42%, #1C1712 0%, #0A0908 70%, #050505 100%);
          border: 1px solid rgba(212, 175, 55, 0.4);
          padding: 170px 76px 260px 76px !important;
        }
        .aimake-slide::before {
          content: 'REC ●  24FPS · CINEMA STAGE';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 112px;
          background: #040404;
          border-bottom: 1px solid rgba(212, 175, 55, 0.45);
          color: #D4AF37;
          font-family: var(--mono);
          font-size: 18px;
          letter-spacing: 0.24em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .aimake-slide::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 150px;
          background: #040404;
          border-top: 1px solid rgba(212, 175, 55, 0.45);
          pointer-events: none;
        }
        .top-bar {
          border-bottom: 1px solid rgba(212, 175, 55, 0.32);
        }
        .eyebrow {
          color: #D4AF37;
          letter-spacing: 0.2em;
        }
        h1.slide-title {
          color: #F7E7B8;
          font-weight: 700;
          line-height: 1.28;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(22, 19, 16, 0.92);
          border: 1px solid rgba(212, 175, 55, 0.35);
        }
        .speech-caption {
          position: relative;
          z-index: 2;
          background: rgba(12, 10, 8, 0.92);
          border: 1px solid #D4AF37;
          color: #F7E7B8;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }
        .footer-bar {
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(212, 175, 55, 0.28);
          color: #C7B99F;
        }
      `;

    case 'apple-bento':
      return `
        .aimake-slide.cover-with-photo {
          background: #14302a;
          color: #f7f0dd;
          --muted: #c4ccb9;
          --accent: #e6a571;
        }
        .cover-with-photo .top-bar,
        .cover-with-photo .footer-bar {
          border-color: rgba(247, 240, 221, 0.23);
        }
        .cover-with-photo .eyebrow,
        .cover-with-photo .page-index {
          background: rgba(247, 240, 221, 0.08);
          color: #f2d1a7;
        }
        .cover-with-photo .content-zone {
          display: grid;
          grid-template-columns: minmax(0, 1.07fr) minmax(0, 1fr);
          align-items: stretch;
          gap: 62px;
        }
        .cover-copy {
          align-self: center;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: calc(25px * var(--content-scale));
        }
        .cover-with-photo h1.slide-title {
          color: #f7f0dd;
          font-family: Georgia, 'Songti SC', serif;
          font-weight: 400;
          line-height: 0.98;
        }
        .cover-with-photo p.slide-subtitle {
          color: var(--muted);
        }
        .cover-photo {
          width: 100%;
          height: 100%;
          min-height: 0;
          object-fit: cover;
          border-radius: 16px;
        }
        .aimake-slide {
          background:
            radial-gradient(circle at 86% 12%, rgba(0, 113, 227, 0.08) 0%, transparent 44%),
            #F5F5F7;
          border: none;
          padding: 58px 82px 48px 82px !important;
        }
        .progress-track {
          height: 5px;
          background: var(--accent);
        }
        .top-bar {
          border-bottom: 1px solid rgba(29, 29, 31, 0.09);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .eyebrow {
          background: #FFFFFF;
          color: #1D1D1F;
          border: 1px solid rgba(29, 29, 31, 0.08);
          padding: 8px 20px;
          border-radius: 999px;
          font-family: var(--font);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.06em;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .page-index {
          background: rgba(29, 29, 31, 0.06);
          color: #424245;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 16px;
        }
        h1.slide-title {
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.14;
          color: #1D1D1F;
        }
        p.slide-subtitle {
          color: #6E6E73;
          font-weight: 500;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 22px;
          align-items: stretch;
        }
        .metrics-grid:has(.metric-card:nth-child(3)) {
          grid-template-columns: 1.3fr 1fr 1fr;
        }
        .metrics-grid:has(.metric-card:nth-child(4)) {
          grid-template-columns: 1fr 1fr;
        }
        /* When slide has only metric cards, flex harmoniously to fill the vertical canvas */
        .content-zone:not(:has(ul.bullet-list)):not(:has(.compare-grid)):not(:has(.code-box)):not(:has(.quote-box)) .metrics-grid {
          flex: 1;
          max-height: 520px;
        }
        .metric-card {
          background: var(--surface);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 26px;
          padding: calc(32px * var(--content-scale)) calc(36px * var(--content-scale));
          box-shadow: var(--card-shadow);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: calc(200px * var(--content-scale));
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .content-zone:not(:has(ul.bullet-list)):not(:has(.compare-grid)):not(:has(.code-box)):not(:has(.quote-box)) .metric-card {
          min-height: 280px;
          padding: calc(42px * var(--content-scale)) calc(46px * var(--content-scale));
        }
        /* Unified Apple-grade frosted neutrals */
        .metric-card:first-child {
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 244, 252, 0.88) 100%);
          border: 1px solid rgba(0, 113, 227, 0.20);
          color: var(--ink);
          box-shadow: 0 8px 24px rgba(0, 113, 227, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .metric-card:first-child .metric-label {
          color: var(--muted);
        }
        .metric-card:first-child .metric-val {
          color: var(--accent);
          background: none;
          -webkit-text-fill-color: initial;
        }
        .metric-card:first-child .metric-delta {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid rgba(0, 113, 227, 0.16);
          -webkit-text-fill-color: initial;
          padding: 4px 14px;
          border-radius: 999px;
          opacity: 1;
        }
        [data-theme="dark"] .metric-card,
        body[data-theme="dark"] .metric-card {
          background: rgba(26, 30, 41, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.10);
          color: #F5F5F7;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
        }
        [data-theme="dark"] .metric-card:first-child,
        body[data-theme="dark"] .metric-card:first-child {
          background:
            radial-gradient(circle at 88% 18%, rgba(41, 151, 255, 0.16) 0%, transparent 55%),
            linear-gradient(145deg, #1F2432 0%, #151822 100%);
          border: 1px solid rgba(90, 180, 255, 0.30);
          color: #F5F5F7;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
        }
        [data-theme="dark"] .metric-card:first-child .metric-label,
        body[data-theme="dark"] .metric-card:first-child .metric-label {
          color: #94A3B8;
        }
        [data-theme="dark"] .metric-card:first-child .metric-val,
        body[data-theme="dark"] .metric-card:first-child .metric-val {
          background: linear-gradient(95deg, #FFFFFF 10%, #7CC4FF 65%, #5AC8FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        [data-theme="dark"] .metric-card:first-child .metric-delta,
        body[data-theme="dark"] .metric-card:first-child .metric-delta {
          -webkit-text-fill-color: initial;
          color: #7CC4FF;
          background: rgba(41, 151, 255, 0.18);
          border: 1px solid rgba(41, 151, 255, 0.28);
        }
        .metric-val {
          font-family: var(--font);
          letter-spacing: -0.03em;
          color: #1D1D1F;
        }
        .metric-delta {
          background: rgba(0, 113, 227, 0.10);
          color: #0071E3;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: calc(16px * var(--content-scale));
          font-weight: 700;
          opacity: 1;
        }
        ul.bullet-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        ul.bullet-list li {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: calc(22px * var(--content-scale)) calc(26px * var(--content-scale));
          box-shadow: var(--card-shadow);
          align-items: center;
        }
        ul.bullet-list li:first-child {
          background: linear-gradient(135deg, #1D1D1F 0%, #2C2C30 100%);
          color: #F5F5F7;
          border-color: rgba(255, 255, 255, 0.10);
        }
        ul.bullet-list li:first-child .bullet-dot {
          background: #0071E3;
          color: #FFFFFF;
        }
        .bullet-dot {
          background: #F0F5FF;
          color: #0071E3;
          border-radius: 12px;
          padding: 6px 12px;
          font-size: 17px;
        }
        .compare-col {
          background: var(--surface);
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
        }
        .compare-col.highlight {
          background: linear-gradient(145deg, #1D1D1F 0%, #141418 100%);
          color: #F5F5F7;
          border-color: rgba(41, 151, 255, 0.35);
        }
        .compare-col.highlight h3 {
          color: #5AC8FA;
        }
        .quote-box {
          background: var(--surface);
          border-radius: 24px;
          border-left: 6px solid var(--accent);
          box-shadow: var(--card-shadow);
        }
        .footer-bar {
          border-top: 1px solid rgba(29, 29, 31, 0.09);
        }
      `;

    case 'apple-dark':
      return `
        .aimake-slide {
          background:
            radial-gradient(ellipse 76% 48% at 50% -6%, rgba(41, 151, 255, 0.28) 0%, rgba(94, 92, 230, 0.10) 42%, transparent 72%),
            radial-gradient(circle at 82% 86%, rgba(175, 82, 222, 0.12) 0%, transparent 45%),
            #050507;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 60px 88px 50px 88px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 16%;
          right: 16%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(160, 210, 255, 0.8), transparent);
          pointer-events: none;
        }
        .progress-track {
          height: 4px;
          background: linear-gradient(90deg, #2997FF 0%, #9F7AEA 100%);
        }
        .top-bar {
          border-bottom: 1px solid rgba(255, 255, 255, 0.09);
          padding-bottom: 16px;
        }
        .eyebrow {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #D2E9FF;
          padding: 7px 18px;
          border-radius: 999px;
          font-size: 16px;
          letter-spacing: 0.12em;
        }
        h1.slide-title {
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.15;
          background: linear-gradient(180deg, #FFFFFF 12%, #DCE3F0 60%, #7BB8FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.slide-subtitle {
          color: #A1A1A6;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.075) 0%, rgba(255, 255, 255, 0.035) 100%);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-top: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 22px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }
        .metric-val {
          font-family: var(--font);
          background: linear-gradient(95deg, #FFFFFF 0%, #64B5FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: calc(50px * var(--content-scale));
          letter-spacing: -0.03em;
        }
        .metric-delta {
          -webkit-text-fill-color: #7DD3FC;
          background: rgba(41, 151, 255, 0.16);
          border: 1px solid rgba(41, 151, 255, 0.35);
          padding: 4px 12px;
          border-radius: 999px;
          opacity: 1;
        }
        ul.bullet-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .bullet-dot {
          background: rgba(41, 151, 255, 0.18);
          color: #7CC4FF;
          border: 1px solid rgba(41, 151, 255, 0.35);
          border-radius: 10px;
          padding: 4px 11px;
          font-size: 16px;
        }
        .quote-box {
          border-left: 5px solid #2997FF;
        }
        .footer-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.09);
          color: #86868B;
        }
      `;

    case 'bold-headline':
      return `
        .aimake-slide {
          background-color: #FFE135;
          background-image:
            repeating-linear-gradient(-45deg, rgba(14, 14, 17, 0.035) 0px, rgba(14, 14, 17, 0.035) 2px, transparent 2px, transparent 14px);
          border: 8px solid #0E0E11;
          padding: 66px 64px 58px 64px !important;
        }
        .aimake-slide::after {
          content: '⚡ 2026 必看干货';
          position: absolute;
          top: 26px;
          right: -14px;
          background: #FF2A54;
          color: #FFFFFF;
          border: 4px solid #0E0E11;
          box-shadow: 6px 6px 0 #0E0E11;
          padding: 8px 28px;
          font-family: var(--font);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.04em;
          transform: rotate(4deg);
          z-index: 4;
          pointer-events: none;
        }
        .progress-track {
          height: 10px;
          background: #0E0E11;
        }
        .top-bar {
          border-bottom: 4px solid #0E0E11;
          padding-bottom: 16px;
          padding-right: 210px;
          margin-bottom: 22px;
        }
        .eyebrow {
          background: #0E0E11;
          color: #FFE135;
          padding: 8px 18px;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 0.1em;
          transform: rotate(-1.2deg);
        }
        .page-index {
          background: #FFFFFF;
          color: #0E0E11;
          border: 3px solid #0E0E11;
          box-shadow: 4px 4px 0 #0E0E11;
          padding: 5px 14px;
          font-weight: 900;
        }
        h1.slide-title {
          background: #0E0E11;
          color: #FFE135;
          padding: 24px 28px;
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1.18;
          box-shadow: 10px 10px 0 #FF2A54;
          border: 4px solid #0E0E11;
        }
        p.slide-subtitle {
          background: #FFFFFF;
          color: #0E0E11;
          font-weight: 700;
          padding: 14px 20px;
          border: 3px solid #0E0E11;
          box-shadow: 6px 6px 0 #0E0E11;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: #FFFFFF;
          border: 4px solid #0E0E11;
          border-radius: 6px;
          box-shadow: 7px 7px 0 #0E0E11;
        }
        .metric-val {
          color: #0E0E11;
          font-weight: 900;
        }
        .metric-delta {
          background: #FFE135;
          color: #0E0E11;
          border: 2px solid #0E0E11;
          padding: 2px 10px;
          font-weight: 900;
          opacity: 1;
        }
        .bullet-dot {
          background: #0E0E11;
          color: #FFE135;
          padding: 4px 11px;
          font-size: 19px;
          font-weight: 900;
        }
        .compare-col.highlight {
          background: #0E0E11;
          color: #FFFFFF;
          box-shadow: 7px 7px 0 #FF2A54;
        }
        .compare-col.highlight h3 {
          color: #FFE135;
        }
        .quote-box {
          background: #0E0E11;
          color: #FFE135;
          border-left: 12px solid #FF2A54;
          font-weight: 800;
        }
        .footer-bar {
          border-top: 4px solid #0E0E11;
          color: #0E0E11;
          font-weight: 800;
        }
      `;

    case 'apple-notes':
      return `
        .aimake-slide {
          background-color: #FAF9F4;
          background-image:
            linear-gradient(to bottom, transparent 47px, rgba(210, 200, 178, 0.34) 48px);
          background-size: 100% 48px;
          border: 1px solid #E5DFD0;
          padding: 58px 78px 60px 78px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
          background: linear-gradient(90deg, #EAB308 0%, #FACC15 100%);
        }
        .progress-track {
          height: 5px;
          background: #EAB308;
        }
        .top-bar {
          border-bottom: 1.5px solid rgba(234, 179, 8, 0.45);
          padding-bottom: 16px;
          margin-bottom: 26px;
        }
        .top-bar::before {
          content: '‹ 备忘录';
          font-family: var(--font);
          font-size: 23px;
          font-weight: 600;
          color: #D99B06;
          margin-right: 16px;
        }
        .eyebrow {
          font-family: var(--font);
          font-size: 18px;
          font-weight: 500;
          color: #9C9488;
          letter-spacing: 0.04em;
          text-transform: none;
          margin-right: auto;
        }
        .page-index {
          color: #D99B06;
          font-weight: 700;
        }
        h1.slide-title {
          font-weight: 800;
          color: #1C1917;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }
        p.slide-subtitle {
          color: #57534E;
          line-height: 1.62;
        }
        ul.bullet-list {
          gap: calc(12px * var(--content-scale));
        }
        ul.bullet-list li {
          background: rgba(255, 254, 249, 0.82);
          border: none;
          border-bottom: 1px solid rgba(214, 206, 189, 0.65);
          border-radius: 10px;
          padding: calc(16px * var(--content-scale)) calc(18px * var(--content-scale));
          line-height: 1.6;
        }
        .bullet-dot {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 2.5px solid #D99B06;
          color: #D99B06;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(234, 179, 8, 0.12);
          margin-top: 4px;
        }
        .metric-card {
          background: #FFFDF7;
          border: 1px solid #E8DFC8;
          border-top: 4px solid #EAB308;
          border-radius: 16px;
        }
        .metric-val {
          color: #B47B00;
        }
        .compare-col {
          background: #FFFDF7;
          border: 1px solid #E8DFC8;
          border-radius: 16px;
        }
        .compare-col.highlight {
          border-color: #EAB308;
          background: #FFFBEB;
        }
        .quote-box {
          background: rgba(254, 249, 195, 0.45);
          border-left: 5px solid #EAB308;
          border-radius: 0 12px 12px 0;
          color: #292524;
        }
        .footer-bar {
          border-top: 1px solid #E5DFD0;
          color: #9C9488;
        }
      `;

    case 'morandi-cream':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 88% 12%, rgba(200, 125, 101, 0.13) 0%, transparent 40%),
            radial-gradient(circle at 10% 86%, rgba(124, 143, 123, 0.16) 0%, transparent 44%),
            #F5EFE6;
          border: 1px solid #E2D7C8;
          padding: 84px 82px 76px 82px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          inset: 26px;
          border: 1.5px solid rgba(124, 143, 123, 0.38);
          border-radius: 26px;
          pointer-events: none;
        }
        .aimake-slide::after {
          content: '✦';
          position: absolute;
          bottom: 104px;
          right: 64px;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          background: rgba(124, 143, 123, 0.12);
          border: 1px solid rgba(124, 143, 123, 0.3);
          color: #7C8F7B;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .progress-track {
          height: 5px;
          background: linear-gradient(90deg, #7C8F7B 0%, #C87D65 100%);
        }
        .top-bar {
          border-bottom: 1px solid rgba(124, 143, 123, 0.28);
          padding-bottom: 16px;
        }
        .eyebrow {
          background: #7C8F7B;
          color: #FBF8F3;
          padding: 7px 20px;
          border-radius: 999px;
          font-family: var(--font);
          font-size: 17px;
          letter-spacing: 0.14em;
        }
        .page-index {
          color: #7C8F7B;
        }
        h1.slide-title {
          font-weight: 700;
          line-height: 1.34;
          letter-spacing: 0.01em;
          color: #3A322C;
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(251, 248, 243, 0.88);
          border: 1px solid #E5DACB;
          border-radius: 22px;
          box-shadow: 0 8px 24px rgba(58, 50, 44, 0.04);
        }
        .metric-card {
          border-top: 4px solid #C87D65;
        }
        .bullet-dot {
          background: rgba(200, 125, 101, 0.14);
          color: #C87D65;
          border-radius: 999px;
          padding: 4px 12px;
          font-family: Georgia, serif;
          font-size: 18px;
        }
        .quote-box {
          background: rgba(124, 143, 123, 0.10);
          border: 1px solid rgba(124, 143, 123, 0.25);
          border-left: 6px solid #7C8F7B;
          border-radius: 18px;
          font-style: italic;
        }
        .footer-bar {
          border-top: 1px solid rgba(124, 143, 123, 0.28);
          color: #84786D;
        }
      `;

    case 'liquid-glass':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 18% 14%, rgba(165, 180, 252, 0.72) 0%, transparent 46%),
            radial-gradient(circle at 86% 24%, rgba(233, 213, 255, 0.78) 0%, transparent 48%),
            radial-gradient(circle at 76% 86%, rgba(153, 246, 228, 0.68) 0%, transparent 48%),
            radial-gradient(circle at 14% 78%, rgba(251, 207, 232, 0.52) 0%, transparent 44%),
            linear-gradient(135deg, #E8EEFF 0%, #F5E9FF 50%, #E4F7F4 100%);
          border: 2px solid rgba(255, 255, 255, 0.85);
          padding: 68px 68px 60px 68px !important;
        }
        .progress-track {
          height: 6px;
          background: linear-gradient(90deg, #6366F1 0%, #EC4899 50%, #14B8A6 100%);
        }
        .top-bar {
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 12px 24px;
          margin-bottom: 26px;
          box-shadow: 0 10px 28px rgba(99, 102, 241, 0.10), inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }
        .eyebrow {
          background: linear-gradient(90deg, #4F46E5 0%, #9333EA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
        h1.slide-title {
          color: #1E1B4B;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.22;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255, 255, 255, 0.92);
          border-radius: 24px;
          box-shadow:
            0 16px 38px rgba(79, 70, 229, 0.10),
            inset 0 1px 2px rgba(255, 255, 255, 0.98);
        }
        .metric-val {
          background: linear-gradient(90deg, #4F46E5 0%, #7C3AED 55%, #0D9488 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .metric-delta {
          -webkit-text-fill-color: #4338CA;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 999px;
          opacity: 1;
        }
        .bullet-dot {
          background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
          color: #FFFFFF;
          border-radius: 12px;
          padding: 4px 12px;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
        }
        .quote-box {
          border-left: 6px solid #6366F1;
        }
        .footer-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.8);
          color: #4338CA;
        }
      `;

    case 'verdict-split':
      return `
        .aimake-slide {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          padding: 0 68px 56px 68px !important;
        }
        .aimake-slide::before {
          content: '红榜 PRO · 值得冲   VS   黑榜 CON · 避坑点';
          display: flex;
          align-items: center;
          justify-content: center;
          height: 54px;
          margin: 0 -68px 0 -68px;
          background: linear-gradient(90deg, #059669 0%, #059669 49.5%, #0F172A 49.5%, #0F172A 50.5%, #E11D48 50.5%, #E11D48 100%);
          color: #FFFFFF;
          font-family: var(--font);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.12em;
          flex-shrink: 0;
        }
        .progress-track {
          height: 6px;
          background: linear-gradient(90deg, #059669 0%, #E11D48 100%);
        }
        .top-bar {
          margin-top: 22px;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 14px;
        }
        .eyebrow {
          background: #0F172A;
          color: #FFFFFF;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 16px;
        }
        .page-index {
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          color: #0F172A;
          padding: 5px 14px;
          border-radius: 999px;
        }
        .compare-col {
          background: #FFF1F2;
          border: 2px solid #FECDD3;
          border-top: 8px solid #E11D48;
          border-radius: 18px;
        }
        .compare-col h3 {
          color: #BE123C;
        }
        .compare-col.highlight {
          background: #ECFDF5;
          border: 2px solid #A7F3D0;
          border-top: 8px solid #059669;
        }
        .compare-col.highlight h3 {
          color: #047857;
        }
        .metric-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-top: 6px solid #059669;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }
        .metric-card:nth-child(even) {
          border-top-color: #E11D48;
        }
        .metric-card:nth-child(even) .metric-val {
          color: #E11D48;
        }
        .metric-delta {
          background: #ECFDF5;
          color: #047857;
          padding: 4px 12px;
          border-radius: 999px;
          font-weight: 700;
          opacity: 1;
        }
        .metric-card:nth-child(even) .metric-delta {
          background: #FFF1F2;
          color: #BE123C;
        }
        ul.bullet-list li {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-left: 6px solid #059669;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        }
        ul.bullet-list li:nth-child(even) {
          border-left-color: #E11D48;
        }
        ul.bullet-list li:nth-child(even) .bullet-dot {
          background: #FFF1F2;
          color: #E11D48;
        }
        .bullet-dot {
          background: #ECFDF5;
          color: #059669;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 17px;
        }
      `;

    case 'editorial-quote':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 50% 35%, #1A2C25 0%, #13201B 60%, #0D1713 100%);
          border: 1px solid rgba(232, 213, 181, 0.22);
          padding: 90px 88px 80px 88px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          inset: 32px;
          border: 1px solid rgba(232, 213, 181, 0.24);
          pointer-events: none;
        }
        .aimake-slide::after {
          content: '“';
          position: absolute;
          top: 90px;
          left: 58px;
          font-family: Georgia, serif;
          font-size: 360px;
          line-height: 1;
          color: rgba(232, 213, 181, 0.085);
          pointer-events: none;
        }
        .progress-track {
          height: 4px;
          background: #D4B483;
        }
        .top-bar {
          border-bottom: 1px solid rgba(232, 213, 181, 0.22);
          padding-bottom: 18px;
        }
        .eyebrow {
          color: #D4B483;
          letter-spacing: 0.22em;
          font-size: 17px;
        }
        .page-index {
          color: #9AB0A5;
        }
        h1.slide-title {
          color: #F2E4CB;
          font-weight: 700;
          line-height: 1.38;
          letter-spacing: 0.015em;
          position: relative;
          z-index: 2;
        }
        p.slide-subtitle {
          color: #A6B8AE;
          line-height: 1.65;
          position: relative;
          z-index: 2;
        }
        .quote-box {
          background: rgba(232, 213, 181, 0.07);
          border: 1px solid rgba(232, 213, 181, 0.22);
          border-left: 5px solid #D4B483;
          color: #F5E8D0;
          font-size: calc(28px * var(--content-scale));
          line-height: 1.64;
          padding: calc(28px * var(--content-scale)) calc(32px * var(--content-scale));
        }
        .metric-card, ul.bullet-list li, .compare-col {
          background: rgba(27, 45, 38, 0.78);
          border: 1px solid rgba(232, 213, 181, 0.20);
        }
        .bullet-dot {
          color: #D4B483;
          font-family: Georgia, serif;
          font-style: italic;
        }
        .footer-bar {
          border-top: 1px solid rgba(232, 213, 181, 0.24);
          color: #B4C3BA;
          letter-spacing: 0.06em;
        }
      `;

    case 'deep-report':
      return `
        .aimake-slide {
          background: #FDFBF7;
          border: 1px solid #D8CEBC;
          padding: 0 72px 58px 72px !important;
        }
        .progress-track {
          height: 5px;
          background: #D4A359;
        }
        .top-bar {
          background: linear-gradient(135deg, #0C1B33 0%, #14284A 100%);
          color: #FDFBF7;
          margin: 0 -72px 30px -72px;
          padding: 36px 72px 26px 72px;
          border-bottom: 6px solid #D4A359;
        }
        .eyebrow {
          color: #E7BF7A;
          letter-spacing: 0.18em;
          font-size: 18px;
        }
        .page-index {
          color: #CBD5E1;
          border: 1px solid rgba(212, 163, 89, 0.55);
          padding: 4px 14px;
          border-radius: 3px;
        }
        h1.slide-title {
          color: #0C1B33;
          font-weight: 800;
          line-height: 1.28;
          border-bottom: 2px solid #0C1B33;
          padding-bottom: 18px;
        }
        .metric-card {
          background: #F4EFE4;
          border: 1px solid #DDD3C0;
          border-left: 6px solid #0C1B33;
          border-radius: 4px;
        }
        .metric-val {
          color: #0C1B33;
        }
        .metric-delta {
          background: #0C1B33;
          color: #E7BF7A;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: calc(16px * var(--content-scale));
          opacity: 1;
        }
        ul.bullet-list li {
          background: #FFFFFF;
          border: 1px solid #E2D9C8;
          border-left: 5px solid #D4A359;
          border-radius: 4px;
        }
        .bullet-dot {
          color: #0C1B33;
          background: #EFE7D6;
          padding: 3px 10px;
          font-size: 17px;
        }
        .compare-col {
          background: #FFFFFF;
          border: 1px solid #DDD3C0;
          border-top: 5px solid #0C1B33;
        }
        .compare-col.highlight {
          background: #F4EFE4;
          border-top-color: #D4A359;
        }
        .quote-box {
          background: #0C1B33;
          color: #FDFBF7;
          border-left: 7px solid #D4A359;
        }
        .footer-bar {
          border-top: 2px solid #0C1B33;
          color: #4A5568;
        }
      `;

    case 'frontpage-news':
      return `
        .aimake-slide {
          background-color: #F6F2E8;
          background-image:
            radial-gradient(rgba(20, 18, 16, 0.045) 1px, transparent 1px);
          background-size: 16px 16px;
          border: 2px solid #141210;
          padding: 46px 66px 52px 66px !important;
        }
        .aimake-slide::before {
          content: 'THE DAILY BRIEF · 深度头版快讯';
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 14px 0 12px 0;
          margin-bottom: 14px;
          border-top: 6px double #141210;
          border-bottom: 3px double #141210;
          font-family: 'Songti SC', Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 0.16em;
          color: #141210;
          flex-shrink: 0;
        }
        .progress-track {
          height: 5px;
          background: #9B1C1C;
        }
        .top-bar {
          border-bottom: 1px solid #141210;
          padding-bottom: 10px;
          margin-bottom: 22px;
        }
        .eyebrow {
          color: #9B1C1C;
          font-weight: 800;
          letter-spacing: 0.16em;
        }
        .page-index {
          color: #141210;
          font-weight: 700;
        }
        h1.slide-title {
          font-weight: 900;
          line-height: 1.22;
          color: #141210;
          border-bottom: 3px solid #141210;
          padding-bottom: 18px;
        }
        .metrics-grid {
          border-top: 1px solid #141210;
          border-bottom: 1px solid #141210;
          gap: 0;
        }
        .metric-card {
          background: transparent;
          border: none;
          border-right: 1px solid #141210;
          border-radius: 0;
          padding: 20px 22px;
        }
        .metric-card:last-child {
          border-right: none;
        }
        .metric-val {
          color: #9B1C1C;
        }
        ul.bullet-list {
          gap: 0;
          border-top: 1px solid #141210;
        }
        ul.bullet-list li {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(20, 18, 16, 0.35);
          border-radius: 0;
          padding: 18px 4px;
        }
        .bullet-dot {
          color: #9B1C1C;
          font-family: Georgia, serif;
          font-size: 24px;
        }
        .compare-grid {
          gap: 0;
          border-top: 2px solid #141210;
          border-bottom: 2px solid #141210;
        }
        .compare-col {
          background: transparent;
          border: none;
          border-right: 1px solid #141210;
          border-radius: 0;
        }
        .compare-col.highlight {
          border-right: none;
          background: rgba(155, 28, 28, 0.04);
        }
        .quote-box {
          background: #EFE9DA;
          border-top: 1px solid #141210;
          border-bottom: 1px solid #141210;
          border-left: 6px solid #9B1C1C;
          border-radius: 0;
          font-style: italic;
        }
        .footer-bar {
          border-top: 3px double #141210;
          color: #141210;
        }
      `;

    case 'linear-dark':
      return `
        .aimake-slide {
          background-color: #08090C;
          background-image:
            radial-gradient(ellipse 68% 44% at 50% -10%, rgba(94, 106, 210, 0.30) 0%, transparent 66%),
            linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
          background-size: 100% 100%, 64px 64px, 64px 64px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 58px 86px 48px 86px !important;
        }
        .progress-track {
          height: 3px;
          background: linear-gradient(90deg, #5E6AD2 0%, #8B97FF 100%);
        }
        .top-bar {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 16px;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(94, 106, 210, 0.14);
          border: 1px solid rgba(94, 106, 210, 0.42);
          color: #B4BCFF;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 15px;
          letter-spacing: 0.1em;
        }
        .eyebrow::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #7B88FF;
          box-shadow: 0 0 12px #7B88FF;
        }
        h1.slide-title {
          font-weight: 700;
          letter-spacing: -0.035em;
          line-height: 1.16;
          color: #F7F8F8;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: linear-gradient(180deg, rgba(22, 24, 34, 0.92) 0%, rgba(15, 17, 24, 0.94) 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
        }
        .metric-val {
          color: #FFFFFF;
          font-family: var(--mono);
        }
        .metric-delta {
          background: rgba(94, 106, 210, 0.22);
          color: #A5B0FF;
          border: 1px solid rgba(94, 106, 210, 0.4);
          padding: 3px 10px;
          border-radius: 6px;
          opacity: 1;
        }
        ul.bullet-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .bullet-dot {
          color: #8B97FF;
          background: rgba(94, 106, 210, 0.14);
          border: 1px solid rgba(94, 106, 210, 0.35);
          border-radius: 6px;
          padding: 3px 9px;
          font-size: 15px;
        }
        .code-box {
          background: #0B0C11;
          border: 1px solid rgba(94, 106, 210, 0.42);
        }
        .footer-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #6B7280;
        }
      `;

    case 'bauhaus-bold':
      return `
        .aimake-slide {
          background: #FAFAFA;
          border: 6px solid #111111;
          padding: 54px 128px 48px 82px !important;
        }
        .aimake-slide::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 46px;
          background: linear-gradient(180deg, #E12D39 0%, #E12D39 34%, #1B4FD8 34%, #1B4FD8 68%, #F4B400 68%, #F4B400 100%);
          border-left: 4px solid #111111;
          pointer-events: none;
        }
        .aimake-slide::after {
          content: '';
          position: absolute;
          bottom: 42px;
          right: 68px;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: #F4B400;
          border: 3px solid #111111;
          pointer-events: none;
        }
        .progress-track {
          height: 8px;
          background: #1B4FD8;
        }
        .top-bar {
          border-bottom: 4px solid #111111;
          padding-bottom: 14px;
        }
        .eyebrow {
          background: #111111;
          color: #FAFAFA;
          padding: 8px 18px;
          font-size: 17px;
          letter-spacing: 0.16em;
        }
        .page-index {
          background: #F4B400;
          color: #111111;
          border: 3px solid #111111;
          padding: 4px 14px;
          font-weight: 900;
        }
        h1.slide-title {
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.14;
          color: #111111;
        }
        .metric-card {
          background: #FFFFFF;
          border: 3px solid #111111;
          border-top: 10px solid #E12D39;
          border-radius: 0;
        }
        .metric-card:nth-child(2) {
          border-top-color: #1B4FD8;
        }
        .metric-card:nth-child(2) .metric-val {
          color: #1B4FD8;
        }
        .metric-card:nth-child(3) {
          border-top-color: #F4B400;
        }
        .metric-card:nth-child(3) .metric-val {
          color: #111111;
        }
        ul.bullet-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        ul.bullet-list li {
          background: #FFFFFF;
          border: 3px solid #111111;
          border-radius: 0;
        }
        .bullet-dot {
          background: #E12D39;
          color: #FFFFFF;
          padding: 4px 11px;
          font-size: 17px;
        }
        ul.bullet-list li:nth-child(2) .bullet-dot {
          background: #1B4FD8;
        }
        ul.bullet-list li:nth-child(3) .bullet-dot {
          background: #F4B400;
          color: #111111;
        }
        .compare-col {
          border: 3px solid #111111;
          border-top: 10px solid #111111;
          border-radius: 0;
        }
        .compare-col.highlight {
          border-top-color: #1B4FD8;
          background: #F0F4FF;
        }
        .quote-box {
          border: 3px solid #111111;
          border-left: 12px solid #E12D39;
          background: #FFFFFF;
          border-radius: 0;
        }
        .footer-bar {
          border-top: 4px solid #111111;
          color: #111111;
          font-weight: 700;
        }
      `;

    case 'risograph':
      return `
        .aimake-slide {
          background-color: #F7F1E3;
          background-image:
            radial-gradient(circle at 86% 14%, rgba(255, 77, 61, 0.26) 0%, rgba(255, 77, 61, 0.26) 110px, transparent 112px),
            radial-gradient(circle at 79% 19%, rgba(27, 71, 214, 0.20) 0%, rgba(27, 71, 214, 0.20) 94px, transparent 96px),
            radial-gradient(rgba(27, 71, 214, 0.14) 1.5px, transparent 1.5px);
          background-size: 100% 100%, 100% 100%, 11px 11px;
          border: 5px solid #1B47D6;
          padding: 66px 68px 58px 68px !important;
        }
        .aimake-slide::before {
          content: 'RISO // 2-INK OVERPRINT · CORAL + COBALT';
          position: absolute;
          top: 16px;
          left: 68px;
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #1B47D6;
          opacity: 0.85;
        }
        .progress-track {
          height: 8px;
          background: linear-gradient(90deg, #1B47D6 0%, #FF4D3D 100%);
        }
        .top-bar {
          border-top: 2px solid #1B47D6;
          border-bottom: 3px solid #1B47D6;
          padding: 12px 0;
          margin-bottom: 24px;
        }
        .eyebrow {
          background: #FF4D3D;
          color: #FFFBF2;
          padding: 7px 16px;
          box-shadow: 4px 4px 0 #1B47D6;
          font-size: 17px;
          letter-spacing: 0.12em;
        }
        .page-index {
          color: #1B47D6;
          border: 2px solid #1B47D6;
          padding: 4px 12px;
          font-weight: 800;
          background: rgba(255, 251, 242, 0.85);
        }
        h1.slide-title {
          font-weight: 900;
          color: #1B47D6;
          text-shadow: 4px 4px 0 rgba(255, 77, 61, 0.36);
          line-height: 1.16;
          letter-spacing: -0.03em;
        }
        p.slide-subtitle {
          color: #2B2F52;
          font-weight: 600;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: rgba(255, 251, 242, 0.92);
          border: 3px solid #1B47D6;
          border-radius: 4px;
          box-shadow: 6px 6px 0 #FF4D3D;
        }
        .metric-val {
          color: #FF4D3D;
          text-shadow: 2px 2px 0 rgba(27, 71, 214, 0.25);
        }
        .metric-delta {
          background: #1B47D6;
          color: #FFFBF2;
          padding: 3px 10px;
          opacity: 1;
        }
        .bullet-dot {
          background: #1B47D6;
          color: #FFFBF2;
          padding: 4px 11px;
          font-size: 18px;
          box-shadow: 3px 3px 0 #FF4D3D;
        }
        .compare-col.highlight {
          background: rgba(27, 71, 214, 0.08);
          border-color: #FF4D3D;
          box-shadow: 6px 6px 0 #1B47D6;
        }
        .quote-box {
          border-left: 10px solid #FF4D3D;
          color: #191C3A;
        }
        .footer-bar {
          border-top: 3px solid #1B47D6;
          color: #1B47D6;
          font-weight: 700;
        }
      `;

    case 'podcast-wave':
      return `
        .aimake-slide {
          background:
            radial-gradient(circle at 50% 24%, rgba(99, 102, 241, 0.28) 0%, transparent 48%),
            radial-gradient(circle at 20% 78%, rgba(56, 189, 248, 0.18) 0%, transparent 42%),
            linear-gradient(180deg, #07091A 0%, #11163A 52%, #070812 100%);
          border: 1px solid rgba(148, 163, 255, 0.24);
          padding: 136px 72px 260px 72px !important;
        }
        .aimake-slide::before {
          content: '●  ON AIR · PODCAST WAVEFORM';
          position: absolute;
          top: 52px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(56, 189, 248, 0.14);
          border: 1px solid rgba(56, 189, 248, 0.45);
          color: #7DD3FC;
          padding: 8px 22px;
          border-radius: 999px;
          font-family: var(--mono);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }
        .content-zone::before {
          content: '';
          display: block;
          width: 100%;
          height: 84px;
          margin-bottom: 8px;
          flex-shrink: 0;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 84'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%2338BDF8'/%3E%3Cstop offset='50%25' stop-color='%23818CF8'/%3E%3Cstop offset='100%25' stop-color='%23C084FC'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg fill='url(%23g)'%3E%3Crect x='20' y='34' width='8' height='16' rx='4'/%3E%3Crect x='38' y='24' width='8' height='36' rx='4'/%3E%3Crect x='56' y='30' width='8' height='24' rx='4'/%3E%3Crect x='74' y='18' width='8' height='48' rx='4'/%3E%3Crect x='92' y='28' width='8' height='28' rx='4'/%3E%3Crect x='110' y='12' width='8' height='60' rx='4'/%3E%3Crect x='128' y='22' width='8' height='40' rx='4'/%3E%3Crect x='146' y='6' width='8' height='72' rx='4'/%3E%3Crect x='164' y='16' width='8' height='52' rx='4'/%3E%3Crect x='182' y='26' width='8' height='32' rx='4'/%3E%3Crect x='200' y='10' width='8' height='64' rx='4'/%3E%3Crect x='218' y='4' width='8' height='76' rx='4'/%3E%3Crect x='236' y='18' width='8' height='48' rx='4'/%3E%3Crect x='254' y='8' width='8' height='68' rx='4'/%3E%3Crect x='272' y='22' width='8' height='40' rx='4'/%3E%3Crect x='290' y='2' width='8' height='80' rx='4'/%3E%3Crect x='308' y='14' width='8' height='56' rx='4'/%3E%3Crect x='326' y='6' width='8' height='72' rx='4'/%3E%3Crect x='344' y='20' width='8' height='44' rx='4'/%3E%3Crect x='362' y='4' width='8' height='76' rx='4'/%3E%3Crect x='380' y='16' width='8' height='52' rx='4'/%3E%3Crect x='398' y='10' width='8' height='64' rx='4'/%3E%3Crect x='416' y='24' width='8' height='36' rx='4'/%3E%3Crect x='434' y='12' width='8' height='60' rx='4'/%3E%3Crect x='452' y='20' width='8' height='44' rx='4'/%3E%3Crect x='470' y='8' width='8' height='68' rx='4'/%3E%3Crect x='488' y='22' width='8' height='40' rx='4'/%3E%3Crect x='506' y='14' width='8' height='56' rx='4'/%3E%3Crect x='524' y='28' width='8' height='28' rx='4'/%3E%3Crect x='542' y='18' width='8' height='48' rx='4'/%3E%3Crect x='560' y='30' width='8' height='24' rx='4'/%3E%3Crect x='578' y='22' width='8' height='40' rx='4'/%3E%3Crect x='596' y='34' width='8' height='16' rx='4'/%3E%3C/g%3E%3C/svg%3E");
        }
        .progress-track {
          height: 6px;
          background: linear-gradient(90deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
        }
        .top-bar {
          border-bottom: 1px solid rgba(148, 163, 255, 0.22);
        }
        .eyebrow {
          color: #A5B4FC;
          letter-spacing: 0.16em;
        }
        h1.slide-title {
          text-align: center;
          color: #FFFFFF;
          font-weight: 800;
          line-height: 1.24;
        }
        p.slide-subtitle {
          text-align: center;
          color: #A5B4E0;
        }
        .metric-card, ul.bullet-list li, .compare-col, .quote-box {
          background: rgba(23, 28, 62, 0.80);
          border: 1px solid rgba(148, 163, 255, 0.24);
          border-top: 1px solid rgba(125, 211, 252, 0.45);
          border-radius: 22px;
          box-shadow: 0 16px 40px rgba(4, 6, 20, 0.5);
        }
        .bullet-dot {
          background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
          color: #07091A;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 17px;
        }
        .speech-caption {
          background: rgba(11, 14, 34, 0.94);
          border: 2px solid #38BDF8;
          box-shadow: 0 0 32px rgba(56, 189, 248, 0.28);
          color: #FFFFFF;
          font-weight: 700;
          border-radius: 18px;
          padding: 22px 26px;
        }
        .footer-bar {
          border-top: 1px solid rgba(148, 163, 255, 0.22);
          color: #9AA8D6;
        }
      `;

    default:
      return '';
  }
}


function isLightColor(hex) {
  if (!hex || !hex.startsWith('#')) return true;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.45;
}

function generateDarkPalette(theme) {
  const isLight = isLightColor(theme.bg);
  if (!isLight) {
    return {
      bg: theme.bg,
      surface: theme.surface,
      ink: theme.ink,
      muted: theme.muted,
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      border: theme.border,
      cardShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
      codeBg: '#090C12',
      codeBorder: '#1F293D',
      codeInk: '#F1F5F9',
      gridLine: 'rgba(255, 255, 255, 0.08)',
    };
  }

  return {
    bg: '#0F1117',
    surface: '#1A1E29',
    ink: '#F1F5F9',
    muted: '#94A3B8',
    accent: theme.accent,
    accentSoft: theme.accentSoft ? theme.accentSoft.replace(/[\d\.]+\)$/, '0.22)') : 'rgba(59, 130, 246, 0.22)',
    border: '#2A3347',
    cardShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
    codeBg: '#090C12',
    codeBorder: '#1F293D',
    codeInk: '#F1F5F9',
    gridLine: 'rgba(255, 255, 255, 0.08)',
  };
}

function generateLightPalette(theme) {
  const isLight = isLightColor(theme.bg);
  if (isLight) {
    return {
      bg: theme.bg,
      surface: theme.surface,
      ink: theme.ink,
      muted: theme.muted,
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      border: theme.border,
      cardShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
      codeBg: '#F8FAFC',
      codeBorder: '#E2E8F0',
      codeInk: '#1E293B',
      gridLine: 'rgba(0, 0, 0, 0.06)',
    };
  }

  return {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    ink: '#0F172A',
    muted: '#64748B',
    accent: theme.accent,
    accentSoft: theme.accentSoft ? theme.accentSoft.replace(/[\d\.]+\)$/, '0.12)') : 'rgba(59, 130, 246, 0.12)',
    border: '#E2E8F0',
    cardShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
    codeBg: '#F8FAFC',
    codeBorder: '#E2E8F0',
    codeInk: '#1E293B',
    gridLine: 'rgba(0, 0, 0, 0.06)',
  };
}

function generateSampleDeck(manifest, theme) {
  const tplId = manifest.id;
  const zhName = manifest.name.zh || manifest.id;
  const enName = manifest.name.en || manifest.id;
  const desc = manifest.description.zh || manifest.description.en || '';
  const isJa = manifest.defaultLocale === 'ja';
  const isKo = manifest.defaultLocale === 'ko';
  const isEn = manifest.defaultLocale === 'en';

  if (tplId === 'apple-bento-launch') {
    return `---
title: Aimake Bento Grid 2026 · 苹果发布会便当盒设计系统
template: apple-bento-launch
locale: zh-CN
aspect: 16:9
author: Aimake Studio
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - Bento-Grid
  - Apple-Keynote
  - Product-Launch
---

<!-- scene: intro | layout: metrics | eyebrow: BENTO GRID 2026 | cite: Apple Keynote & Design Systems -->

# 2026 Bento Grid 美学：用便当盒网格重构多模态资产

## 纯白与深石墨高对比卡片 · 细微光感渐变 · 超大 Tabular 数字

\`\`\`metric
- 排版装配效率: +450% (确定性网格自动对齐)
- 跨端介质直出: 5 种 (PPTX · 图集 · 公众号 · PDF · 60fps MP4)
- 本地隐私留存: 100% (Zero-Cloud · 0 KB 上云)
\`\`\`

- **非对称圆角主瓷砖**：一眼锁定核心关注焦点，让产品参数兼具科技感与克制美学
- **智能溢出自适应压缩**：内容无论长短，自动计算最优行高与字号，绝不撑破舞台

::: speech
这是致敬苹果发布会美学的 Bento 便当盒系统，将复杂的数据和技术参数打包成严丝合缝的高级卡片。
:::

---

<!-- scene: compare | layout: comparison | eyebrow: 范式跃迁 -->

# 传统线性幻灯片 vs Bento Grid 便当盒架构

## 从流水账式翻页，进化为高信息密度的视觉资产拼图

\`\`\`compare
传统模板拼贴 :: 字体混乱元素杂乱 | 纯手动对齐耗费数小时 | 无法导出为原生公众号富文本
Bento 便当盒规范 :: 严谨非对称栅格导向 | 双字体族高对比度排版 | 单一 Markdown 一键直出全渠道
\`\`\`

- **暗黑/明亮双主题无缝切换**：原生支持 \`data-theme="dark"\` 与 \`data-theme="light"\`
- **Mermaid 向量图表离线直出**：高保真流程图与时序图，零网络依赖

---

<!-- scene: code | layout: code | eyebrow: 极简一行启动 -->

# 极简 CLI 与全生态 AI Agent 兼容

- 原生兼容 OpenCode、WorkBuddy、Codex、AGY 与 Claude Code
- 预设 7 大闭环 Skill，实体化沉淀在本地工作区

\`\`\`bash
aimake new my-launch --template apple-bento-launch
aimake render my-launch.deck.md -f pptx -o launch.pptx
\`\`\`

---

<!-- scene: quote | layout: quote | eyebrow: 创作者宣言 -->

# 让每一次思考都自带多模态传播力

> “最好的排版不是堆砌花哨特效，而是用清晰的物理秩序，让思想的重力自然下沉。” — Aimake 设计宣言
`;
  }

  if (tplId === 'xhs-swiss-grid') {
    return `---
title: 瑞士国际主义网格 · 2026 硬核干货拆解指南
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Aimake 设计实验室
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - Swiss-Grid
  - Typography
  - Methodology
---

<!-- scene: cover | layout: metrics | eyebrow: SWISS INTERNATIONAL STYLE | cite: Josef Müller-Brockmann -->

# 拒绝廉价感：顶级极客为什么偏爱「瑞士国际网格」？

## 0 冗余装饰 · Hairline 极细分界线 · 朱砂红索引标记

\`\`\`metric
- 核心信息抓取率: +320% (网格导向阅读视线)
- 跨设备渲染一致度: 100% (CSS 像素级网格)
- 知识复利留存: 2,400+ 篇 (本地 Markdown Wiki)
\`\`\`

- **形式永远追随功能**：剔除低质渐变，让文字内容本身成为视觉骨架
- **严格避头尾排版规则**：标点不落行首，字距行高精准吻合国际排版网格

::: speech
瑞士国际主义排版，是用数学般的严谨网格，让复杂的硬核方法论呈现出水晶般的纯粹与力量。
:::

---

<!-- scene: matrix | layout: comparison | eyebrow: 架构对比 -->

# 随意拼贴卡片 vs 瑞士严谨网格系统

\`\`\`compare
碎片化随意排版 :: 视线混乱重点漂移 | 难以支撑深度长篇推理 | 手机端频繁换行错乱
瑞士网格规范 :: 严谨非对称栅格导向 | 双字体族高对比度排版 | 朱砂红索引锚点一秒定位
\`\`\`

- **朱砂红索引锚点**：给每一次翻页提供无可替代的视觉停靠点
- **高对比石墨粗字体**：在手机小屏幕上依然保持清晰可读的字符轮廓

---

<!-- scene: outro | layout: quote | eyebrow: 设计信条 -->

# 秩序是所有优雅的唯一起点

> “秩序不是限制自由的锁链，而是让纯粹思想得以穿透喧嚣、直达人心的唯一桥梁。” — Aimake 设计宣言
`;
  }

  if (tplId === 'xhs-neon-tech') {
    return `---
title: 2026 大模型评测：DeepSeek-R1 与开源权重推理革命
template: xhs-neon-tech
locale: zh-CN
aspect: 3:4
theme: dark
author: Aimake 架构实测
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - DeepSeek-R1
  - Benchmark
  - Open-Weights
---

<!-- scene: hook | layout: metrics | eyebrow: BENCHMARK 2026 | cite: DeepSeek AI & OpenWeights 2026 -->

# 2026 推理成本暴降 99%：开源权重正面迎战顶尖闭源

## DeepSeek-R1 / V3 架构突破，彻底颠覆「高算力高溢价」神话

\`\`\`metric
- 百万输入 Token: $0.14 (-99% vs 旗舰 API)
- MATH-500 准确率: 97.3% (超越 o1-preview 96.4%)
- AIME 2024 竞赛分: 79.8% (与顶尖闭源推理对齐)
\`\`\`

- **开源推理平权**：顶级逻辑链推理不再是封闭巨头的专属特权
- **本地化部署自由**：从 7B 蒸馏小钢炮到 671B 满血权重，自主掌控隐私

::: speech
暗黑极客科技风，专为大模型跑分横评、代码审查与架构拆解打造。
:::

---

<!-- scene: code | layout: code | eyebrow: LOCAL INFERENCE -->

# 一行命令启动本地满血推理引擎

- 采用 vLLM + Speculative Decoding 架构，首字延迟 < 500ms
- 纯本地运行，配合 Aimake 实现 100% 隐私资产编译

\`\`\`bash
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-32B \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization 0.92 \\
  --max-model-len 16384 \\
  --quantization fp8
\`\`\`
`;
  }

  if (isJa) {
    return `---
title: ${zhName} · デザイン規範サンプル
template: ${tplId}
locale: ja
aspect: ${manifest.aspect}
author: Aimake Studio
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - ${manifest.category}
---

<!-- scene: cover | layout: metrics | eyebrow: ${manifest.category.toUpperCase()} | cite: aimake.cc -->

# ${zhName}：構造化ナレッジカード

## ${desc}

\`\`\`metric
- コンテキスト削減: 95% (軽量高速ビルド)
- クラウド同期: 0 KB (完全ローカル保護)
\`\`\`

- **厳格な禁則処理**：句読点の行頭配置を排除し、読みやすさを最大化
- **余白の美学**：必要最小限の線と空間で情報の階層を明確に伝達

---

<!-- scene: summary | layout: quote | eyebrow: 思想 -->

# 思考をそのまま多言語マルチモーダル資産へ

> “良いデザインは余計な主張をせず、内容の本質をそのまま読者に届ける。” — Aimake デザイン宣言
`;
  }

  if (isKo) {
    return `---
title: ${zhName} · 디자인 가이드 샘플
template: ${tplId}
locale: ko
aspect: ${manifest.aspect}
author: Aimake Studio
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - ${manifest.category}
---

<!-- scene: cover | layout: metrics | eyebrow: ${manifest.category.toUpperCase()} | cite: aimake.cc -->

# ${zhName}：구조화 카드뉴스

## ${desc}

\`\`\`metric
- 컨텍스트 절약: 95% (경량 고속 컴파일)
- 데이터 업로드: 0 KB (100% 로컬 프라이버시)
\`\`\`

- **keep-all 줄바꿈 최적화**：한국어 어절 단위 줄바꿈을 완벽히 보장
- **감각적인 타이포그래피**：단 하나의 마크다운으로 카드뉴스와 PDF 동시 완성

---

<!-- scene: summary | layout: quote | eyebrow: 디자인 선언 -->

# 가치 있는 지식을 가장 선명한 시각 자산으로

> “최고의 디자인은 화려한 기교가 아니라, 명확한 질서로 생각을 전달하는 것입니다.” — Aimake 선언
`;
  }

  if (isEn) {
    return `---
title: ${enName} · Design Specimen 2026
template: ${tplId}
locale: en
aspect: ${manifest.aspect}
author: Aimake Studio
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - ${manifest.category}
---

<!-- scene: cover | layout: metrics | eyebrow: ${manifest.category.toUpperCase()} | cite: aimake.cc -->

# ${enName}

## ${desc}

\`\`\`metric
- Context Overhead: -95% (Deterministic AST)
- Cloud Leakage: 0 KB (100% Local-First)
\`\`\`

- **Deterministic Multi-Format Output**: Compile markdown to PDF, PPTX, PNG, and video
- **Native Dual Theme Support**: Seamless light & dark mode adaptation

---

<!-- scene: summary | layout: quote | eyebrow: MANIFESTO -->

# Turning Raw Thought into High-Leverage Assets

> “Simplicity is about subtracting the obvious and adding the meaningful.” — Aimake Design Manifesto
`;
  }

  return `---
title: ${zhName} · 2026 旗舰排版样本
template: ${tplId}
locale: zh-CN
aspect: ${manifest.aspect}
author: Aimake Studio
handle: "@aimake.cc"
watermark: true
fps: 30
secondsPerSlide: 3
tags:
  - 2026-Trending
  - ${manifest.category}
---

<!-- scene: cover | layout: metrics | eyebrow: ${manifest.category.toUpperCase()} | cite: aimake.cc/templates/${tplId} -->

# ${zhName}：高质量内容呈现规范

## ${desc}

\`\`\`metric
- 上下文节省率: 95% (确定性 AST 编译)
- 云端数据上传: 0 KB (100% 本地隐私安全)
- 多端介质直出: 5 种 (图集 · PDF · PPTX · 视频)
\`\`\`

- **结构化排版原则**：字距、行高与留白严格遵循黄金比例视觉节奏
- **原生支持暗黑与明亮双主题**：根据阅读场景与载体自由切换

---

<!-- scene: breakdown | layout: comparison | eyebrow: 核心框架对比 -->

# 传统创作流 vs Aimake 多模态编译飞轮

\`\`\`compare
传统繁琐排版 :: 各平台手动粘贴格式错乱 | 素材分散各处难以归档 | 隐私存在泄露风险
Aimake 确定性体系 :: 单一 Markdown 原稿秒级编译 | 36 套旗舰视觉系统开箱即用 | 资产沉淀在本地工作区
\`\`\`

- **一稿多出生态兼容**：无缝打通 OpenCode、WorkBuddy、Codex 与 Claude Code
- **Mermaid 向量图表离线直出**：高保真流程图与时序图，零网络依赖

---

<!-- scene: quote | layout: quote | eyebrow: 创作者宣言 -->

# 让每一次思考都自带多模态传播力

> “最好的排版不是堆砌花哨特效，而是用清晰的物理秩序，让思想的重力自然下沉。” — Aimake 设计宣言
`;
}

function buildStandaloneTemplateHtml(manifest, theme) {
  const darkTheme = theme.dark || generateDarkPalette(theme);
  const lightTheme = theme.light || generateLightPalette(theme);
  const is9x16 = manifest.aspect === '9:16';
  const is16x9 = manifest.aspect === '16:9';
  const padX = is16x9 ? 88 : 72;
  const padTop = is9x16 ? 130 : is16x9 ? 64 : 74;
  const padBottom = is9x16 ? 250 : is16x9 ? 54 : 68;
  const variantCss = getVariantCss(theme.styleVariant, manifest, theme);
  const portraitPhotoCover = ['xhs-warm-magazine', 'linkedin-exec-carousel'].includes(manifest.id);
  const portraitCoverCss = portraitPhotoCover ? `
    .cover-with-photo .content-zone {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      align-items: stretch;
      gap: 32px;
    }
    .cover-with-photo .cover-copy {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cover-with-photo .cover-photo {
      width: 100%;
      height: 100%;
      min-height: 0;
      object-fit: cover;
      border-radius: 12px;
    }
    body[data-style-variant="warm-magazine"] .cover-with-photo::before {
      content: none;
    }
    body[data-style-variant="warm-magazine"] .cover-with-photo .content-zone {
      grid-template-rows: minmax(0, 1fr) auto;
    }
    body[data-style-variant="warm-magazine"] .cover-with-photo .cover-photo {
      grid-row: 1;
    }` : '';
  const coverLayout = manifest.id === 'apple-bento-launch' || portraitPhotoCover ? `
        const imageData = window.__AIMAKE_PAYLOAD__?.enhancements?.coverImages?.[idx];
        if (imageData) {
          const zone = el.querySelector('.content-zone');
          const copy = document.createElement('div');
          copy.className = 'cover-copy';
          copy.append(...zone.childNodes);
          const image = document.createElement('img');
          image.className = 'cover-photo';
          image.src = imageData;
          image.alt = slide.imagePrompt || '';
          el.classList.add('cover-with-photo');
          zone.replaceChildren(copy, image);
          if (isWide && slide.title.length < 22) {
            const title = copy.querySelector('.slide-title');
            title.dataset.basePx = '128';
            title.style.fontSize = '128px';
          }
        }` : '';

  return `<!DOCTYPE html>
<html lang="${manifest.defaultLocale}">
<head>
  <meta charset="UTF-8" />
  <title>${manifest.name.en}</title>
  <style>
    :root {
      --bg: ${theme.bg};
      --surface: ${theme.surface};
      --ink: ${theme.ink};
      --muted: ${theme.muted};
      --accent: ${theme.accent};
      --accent-soft: ${theme.accentSoft || 'rgba(127, 127, 127, 0.12)'};
      --border: ${theme.border};
      --bw: ${theme.borderWidth};
      --radius: ${theme.radius};
      --font: ${theme.fontStack};
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --card-shadow: ${theme.cardShadow || '0 8px 24px rgba(0, 0, 0, 0.06)'};
      --code-bg: ${theme.codeBg || '#0b0f19'};
      --code-border: ${theme.codeBorder || '#263147'};
      --code-ink: ${theme.codeInk || '#e2e8f0'};
      --grid-line: ${theme.gridLine || 'rgba(127, 127, 127, 0.08)'};
      --content-scale: 1;
    }

    /* Explicit Dark Theme Support */
    :root[data-theme="dark"],
    body[data-theme="dark"],
    .aimake-slide[data-theme="dark"],
    [data-theme="dark"] .aimake-slide {
      --bg: ${darkTheme.bg};
      --surface: ${darkTheme.surface};
      --ink: ${darkTheme.ink};
      --muted: ${darkTheme.muted};
      --accent: ${darkTheme.accent};
      --accent-soft: ${darkTheme.accentSoft};
      --border: ${darkTheme.border};
      --card-shadow: ${darkTheme.cardShadow || '0 12px 32px rgba(0, 0, 0, 0.45)'};
      --code-bg: ${darkTheme.codeBg || '#070a10'};
      --code-border: ${darkTheme.codeBorder || '#1f293d'};
      --code-ink: ${darkTheme.codeInk || '#f1f5f9'};
      --grid-line: ${darkTheme.gridLine || 'rgba(255, 255, 255, 0.08)'};
    }

    /* Explicit Light Theme Support */
    :root[data-theme="light"],
    body[data-theme="light"],
    .aimake-slide[data-theme="light"],
    [data-theme="light"] .aimake-slide {
      --bg: ${lightTheme.bg};
      --surface: ${lightTheme.surface};
      --ink: ${lightTheme.ink};
      --muted: ${lightTheme.muted};
      --accent: ${lightTheme.accent};
      --accent-soft: ${lightTheme.accentSoft};
      --border: ${lightTheme.border};
      --card-shadow: ${lightTheme.cardShadow || '0 6px 20px rgba(0, 0, 0, 0.05)'};
      --code-bg: ${lightTheme.codeBg || '#f8fafc'};
      --code-border: ${lightTheme.codeBorder || '#e2e8f0'};
      --code-ink: ${lightTheme.codeInk || '#1e293b'};
      --grid-line: ${lightTheme.gridLine || 'rgba(0, 0, 0, 0.06)'};
    }
    * { box-sizing: border-box; }
    html {
      background: var(--bg);
    }
    body {
      margin: 0;
      padding: 32px;
      background: transparent;
      font-family: var(--font);
      color: var(--ink);
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    #aimake-deck-root {
      display: flex;
      flex-direction: column;
      gap: 36px;
      align-items: center;
    }
    .aimake-slide {
      width: ${manifest.width}px;
      height: ${manifest.height}px;
      background: var(--bg);
      color: var(--ink);
      padding: ${padTop}px ${padX}px ${padBottom}px ${padX}px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      border: var(--bw) solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--card-shadow);
      transition: background-color 0.25s ease, color 0.25s ease;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: var(--bw) solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
      flex-shrink: 0;
    }
    .eyebrow {
      font-family: var(--mono);
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .page-index {
      font-family: var(--mono);
      font-size: 19px;
      font-weight: 600;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .content-zone {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: calc(24px * var(--content-scale));
      min-height: 0;
      overflow: hidden;
    }
    h1.slide-title {
      margin: 0;
      font-weight: 800;
      line-height: 1.16;
      letter-spacing: -0.035em;
    }
    p.slide-subtitle {
      margin: 0;
      font-size: calc(26px * var(--content-scale));
      line-height: 1.5;
      letter-spacing: -0.015em;
      color: var(--muted);
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }
    .metric-card {
      background: var(--surface);
      border: var(--bw) solid var(--border);
      border-radius: var(--radius);
      padding: calc(22px * var(--content-scale)) calc(26px * var(--content-scale));
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .metric-label {
      font-size: calc(19px * var(--content-scale));
      color: var(--muted);
      margin-bottom: 8px;
    }
    .metric-val {
      font-family: var(--mono);
      font-size: calc(44px * var(--content-scale));
      font-weight: 800;
      color: var(--accent);
      font-variant-numeric: tabular-nums;
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;
    }
    .metric-delta {
      font-family: var(--mono);
      font-size: calc(18px * var(--content-scale));
      color: var(--ink);
      opacity: 0.85;
    }
    ul.bullet-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: calc(15px * var(--content-scale));
    }
    ul.bullet-list li {
      background: var(--surface);
      border: var(--bw) solid var(--border);
      border-radius: var(--radius);
      padding: calc(18px * var(--content-scale)) calc(24px * var(--content-scale));
      font-size: calc(25px * var(--content-scale));
      line-height: 1.5;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .bullet-dot {
      color: var(--accent);
      font-family: var(--mono);
      font-weight: 800;
      flex-shrink: 0;
    }
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .compare-col {
      background: var(--surface);
      border: var(--bw) solid var(--border);
      border-radius: var(--radius);
      padding: calc(22px * var(--content-scale));
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .compare-col.highlight {
      border-color: var(--accent);
      box-shadow: 0 10px 30px var(--accent-soft);
    }
    .compare-col h3 {
      margin: 0 0 12px 0;
      font-size: calc(24px * var(--content-scale));
      color: var(--accent);
    }
    .compare-col p {
      margin: 0 0 9px 0;
      font-size: calc(22px * var(--content-scale));
      line-height: 1.45;
    }
    .code-box {
      background: #0b0f19;
      color: #e2e8f0;
      border: 1px solid #263147;
      border-radius: 12px;
      padding: calc(20px * var(--content-scale)) calc(24px * var(--content-scale));
      font-family: var(--mono);
      font-size: calc(20px * var(--content-scale));
      line-height: 1.52;
      white-space: pre-wrap;
      overflow: hidden;
    }
    .quote-box {
      background: var(--surface);
      border-left: 6px solid var(--accent);
      padding: calc(22px * var(--content-scale)) calc(26px * var(--content-scale));
      border-radius: 0 var(--radius) var(--radius) 0;
      font-size: calc(25px * var(--content-scale));
      line-height: 1.52;
    }
    .speech-caption {
      background: rgba(20, 22, 28, 0.88);
      color: #ffffff;
      border: 1px solid var(--accent);
      padding: 18px 24px;
      border-radius: 14px;
      font-size: calc(25px * var(--content-scale));
      line-height: 1.45;
      text-align: center;
    }
    .footer-bar {
      border-top: var(--bw) solid var(--border);
      padding-top: 16px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--mono);
      font-size: 16px;
      color: var(--muted);
      flex-shrink: 0;
    }
    .progress-track {
      position: absolute;
      top: 0;
      left: 0;
      height: 4px;
      background: var(--accent);
      width: 100%;
      transform-origin: left center;
      z-index: 3;
    }
    ${variantCss}${portraitCoverCss}
  </style>
</head>
<body data-template-id="${manifest.id}" data-style-variant="${theme.styleVariant}">
  <div id="aimake-deck-root"></div>
  <script>
    const EMBEDDED_MANIFEST = ${JSON.stringify(manifest)};

    function autoTitleFontSize(text, isCover, isWide) {
      const len = (text || '').length;
      if (isCover) {
        if (len > 70) return isWide ? 44 : 40;
        if (len > 42) return isWide ? 54 : 48;
        return isWide ? 62 : 58;
      }
      if (len > 70) return 36;
      if (len > 42) return 42;
      return isWide ? 48 : 46;
    }

    function escHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function formatInline(str) {
      return escHtml(str)
        .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong style="color:var(--accent);">$1</strong>')
        .replace(/\`([^\`]+)\`/g, '<code style="font-family:var(--mono);background:rgba(127,127,127,0.16);padding:2px 8px;border-radius:5px;">$1</code>');
    }

    function fitStage(manifestOverride) {
      const m = manifestOverride || (window.__AIMAKE_PAYLOAD__ && window.__AIMAKE_PAYLOAD__.manifest) || EMBEDDED_MANIFEST;
      const targetW = m.width + 64;
      const availW = document.documentElement.clientWidth || window.innerWidth;
      const root = document.getElementById('aimake-deck-root');
      if (!root) return;
      if (availW > 100 && availW < targetW && (window.self !== window.top || (window.__AIMAKE_PAYLOAD__ && window.__AIMAKE_PAYLOAD__.options && window.__AIMAKE_PAYLOAD__.options.editable))) {
        const scale = Math.max(0.28, (availW - 48) / m.width);
        root.style.zoom = String(scale.toFixed(3));
      } else {
        root.style.zoom = '1';
      }
    }
    window.fitStage = fitStage;

    function autoFitSlideOverflow(slideEl) {
      const zone = slideEl.querySelector('.content-zone');
      if (!zone) return;
      let scale = 1.0;
      const titleEl = slideEl.querySelector('h1.slide-title');
      const baseTitlePx = titleEl ? parseFloat(titleEl.dataset.basePx || '48') : 48;
      while (zone.scrollHeight > zone.clientHeight + 2 && scale > 0.64) {
        scale = Number((scale - 0.05).toFixed(2));
        slideEl.style.setProperty('--content-scale', String(scale));
        if (titleEl) {
          titleEl.style.fontSize = Math.round(baseTitlePx * scale) + 'px';
        }
      }
    }

    // Supports BOTH window.renderDeck(deck, opts) and window.renderDeck(deck, manifest, opts)
    window.renderDeck = function(deck, manifestOrOpts, maybeOpts) {
      let manifest = (window.__AIMAKE_PAYLOAD__ && window.__AIMAKE_PAYLOAD__.manifest) || EMBEDDED_MANIFEST;
      let opts = {};
      if (maybeOpts !== undefined) {
        manifest = manifestOrOpts || manifest;
        opts = maybeOpts || {};
      } else if (manifestOrOpts && typeof manifestOrOpts === 'object') {
        if ('id' in manifestOrOpts && 'width' in manifestOrOpts) {
          manifest = manifestOrOpts;
        } else {
          opts = manifestOrOpts;
        }
      }

      const root = document.getElementById('aimake-deck-root');
      root.innerHTML = '';
      if (deck.frontmatter && deck.frontmatter.accentColor) {
        document.documentElement.style.setProperty('--accent', deck.frontmatter.accentColor);
      }
      if (deck.frontmatter && deck.frontmatter.theme) {
        document.documentElement.setAttribute('data-theme', deck.frontmatter.theme);
        document.body.setAttribute('data-theme', deck.frontmatter.theme);
      } else if (opts && opts.theme) {
        document.documentElement.setAttribute('data-theme', opts.theme);
        document.body.setAttribute('data-theme', opts.theme);
      }

      const total = deck.slides.length;
      const isWide = manifest.aspect === '16:9';
      const showSpeechCaption = manifest.aspect === '9:16';

      deck.slides.forEach((slide, idx) => {
        if (opts && opts.singleSlideIndex !== null && opts.singleSlideIndex !== undefined && opts.singleSlideIndex !== idx) {
          return;
        }
        const el = document.createElement('section');
        el.className = 'aimake-slide layout-' + (slide.layout || 'bullets');
        el.dataset.slideIdx = String(idx);
        if (slide.theme || (deck.frontmatter && deck.frontmatter.theme)) {
          el.setAttribute('data-theme', slide.theme || deck.frontmatter.theme);
        }

        const isCover = idx === 0 || slide.layout === 'cover';
        const titlePx = autoTitleFontSize(slide.title, isCover, isWide);

        let bodyHtml = '';

        if (slide.bodyParagraphs && slide.bodyParagraphs.length > 0) {
          bodyHtml += slide.bodyParagraphs.map((p, pIdx) =>
            '<p class="slide-subtitle anim-item" data-editable="true" data-slide-index="' + idx + '" data-field="body.' + pIdx + '">' + formatInline(p) + '</p>'
          ).join('');
        }

        if (slide.metrics && slide.metrics.length > 0) {
          bodyHtml += '<div class="metrics-grid">' + slide.metrics.map((m, mIdx) =>
            '<div class="metric-card anim-item">' +
              '<div class="metric-label" data-editable="true" data-slide-index="' + idx + '" data-field="metric.' + mIdx + '.label">' + escHtml(m.label) + '</div>' +
              '<div class="metric-val"><span data-editable="true" data-slide-index="' + idx + '" data-field="metric.' + mIdx + '.value">' + escHtml(m.value) + '</span>' +
              (m.delta ? '<span class="metric-delta">' + escHtml(m.delta) + '</span>' : '') +
              '</div>' +
            '</div>'
          ).join('') + '</div>';
        }

        if (slide.comparison) {
          bodyHtml += '<div class="compare-grid">' +
            '<div class="compare-col anim-item"><h3>' + escHtml(slide.comparison.leftTitle) + '</h3>' +
              slide.comparison.leftItems.map((it) => '<p>• ' + formatInline(it) + '</p>').join('') +
            '</div>' +
            '<div class="compare-col highlight anim-item"><h3>' + escHtml(slide.comparison.rightTitle) + '</h3>' +
              slide.comparison.rightItems.map((it) => '<p>✓ ' + formatInline(it) + '</p>').join('') +
            '</div>' +
          '</div>';
        }

        if (slide.bullets && slide.bullets.length > 0) {
          const useGrid = (isWide && slide.bullets.length >= 4) || slide.layout === 'quad';
          bodyHtml += '<ul class="bullet-list' + (useGrid ? ' grid-2col' : '') + '">' + slide.bullets.map((b, bIdx) =>
            '<li class="anim-item"><span class="bullet-dot">' + String(bIdx + 1).padStart(2, '0') + '</span>' +
            '<span data-editable="true" data-slide-index="' + idx + '" data-field="bullet.' + bIdx + '">' + formatInline(b) + '</span></li>'
          ).join('') + '</ul>';
        }

        if (slide.code) {
          bodyHtml += '<div class="code-box anim-item">' + escHtml(slide.code.code) + '</div>';
        }

        if (slide.quote) {
          bodyHtml += '<div class="quote-box anim-item"><div data-editable="true" data-slide-index="' + idx + '" data-field="quote.text">“' + formatInline(slide.quote.text) + '”</div>' +
            (slide.quote.author ? '<div style="margin-top:10px;font-size:19px;color:var(--muted);">— ' + escHtml(slide.quote.author) + '</div>' : '') +
          '</div>';
        }

        if (showSpeechCaption && slide.speech) {
          bodyHtml += '<div class="speech-caption anim-item" data-editable="true" data-slide-index="' + idx + '" data-field="speech">' + escHtml(slide.speech) + '</div>';
        }

        const citeLabel = slide.cite ? '📎 ' + escHtml(slide.cite) : escHtml(deck.frontmatter.author || 'Aimake Creator');
        const wmLabel = deck.frontmatter.watermark !== false
          ? 'Made with Aimake.cc · #' + escHtml(manifest.id)
          : escHtml(deck.frontmatter.handle || '');

        el.innerHTML =
          '<div class="progress-track" style="transform:scaleX(' + ((idx + 1) / total).toFixed(3) + ');"></div>' +
          '<div class="top-bar">' +
            '<span class="eyebrow" data-editable="true" data-slide-index="' + idx + '" data-field="eyebrow">' + escHtml(slide.eyebrow || manifest.category.toUpperCase()) + '</span>' +
            '<span class="page-index">' + String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0') + '</span>' +
          '</div>' +
          '<div class="content-zone">' +
            '<h1 class="slide-title anim-item" data-base-px="' + titlePx + '" style="font-size:' + titlePx + 'px;" data-editable="true" data-slide-index="' + idx + '" data-field="title">' + formatInline(slide.title) + '</h1>' +
            (slide.subtitle ? '<p class="slide-subtitle anim-item" data-editable="true" data-slide-index="' + idx + '" data-field="subtitle">' + formatInline(slide.subtitle) + '</p>' : '') +
            bodyHtml +
          '</div>' +
          '<div class="footer-bar">' +
            '<span>' + citeLabel + '</span>' +
            '<span>' + wmLabel + '</span>' +
          '</div>';
${coverLayout}
        root.appendChild(el);
        autoFitSlideOverflow(el);
      });

      fitStage(manifest);
    };

    // Deterministic frame-stepper for zero-drop 60fps/30fps video synthesis!
    window.aimakeSeek = function(frame, fps) {
      const payload = window.__AIMAKE_PAYLOAD__;
      if (!payload || !payload.deck) return;
      const slides = document.querySelectorAll('.aimake-slide');
      if (slides.length === 0) return;
      const secPerSlide = (payload.deck.frontmatter && payload.deck.frontmatter.secondsPerSlide) || 2;
      const framesPerSlide = Math.max(1, Math.round(secPerSlide * fps));
      const activeIdx = Math.min(slides.length - 1, Math.floor(frame / framesPerSlide));
      const localFrame = frame % framesPerSlide;

      slides.forEach((slideEl, idx) => {
        if (idx !== activeIdx) {
          slideEl.style.display = 'none';
          return;
        }
        slideEl.style.display = 'flex';
        const items = slideEl.querySelectorAll('.anim-item');
        items.forEach((item, itemIdx) => {
          const delayFrames = itemIdx * Math.max(2, Math.round(fps * 0.12));
          const durFrames = Math.max(4, Math.round(fps * 0.35));
          const rawP = (localFrame - delayFrames) / durFrames;
          const p = Math.max(0, Math.min(1, rawP));
          const eased = 1 - Math.pow(1 - p, 3);
          item.style.opacity = String(eased.toFixed(3));
          item.style.transform = 'translateY(' + ((1 - eased) * 24).toFixed(1) + 'px)';
        });
      });
    };
  </script>
</body>
</html>`;
}

async function main() {
  await fs.mkdir(TEMPLATES_ROOT, { recursive: true });
  for (const entry of TEMPLATES) {
    const dir = path.join(TEMPLATES_ROOT, entry.manifest.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, 'manifest.json'),
      JSON.stringify(entry.manifest, null, 2) + '\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(dir, 'template.html'),
      buildStandaloneTemplateHtml(entry.manifest, entry.theme),
      'utf8'
    );
    await fs.writeFile(
      path.join(dir, 'sample.deck.md'),
      generateSampleDeck(entry.manifest, entry.theme),
      'utf8'
    );
  }
  console.log(`Generated ${TEMPLATES.length} standalone templates in ${TEMPLATES_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# RFC: 多平台无头浏览器 CDP 草稿自动填充架构 (`Multi-Platform CDP Draft Publisher`)

> **文档状态**：`Proposed`（对应 GitHub Issue [#4](https://github.com/chicogong/aimake-creator/issues/4) · Milestone `v2.3.0`）  
> **归属模块**：`src/publisher/browser-publisher.ts` · `src/publisher/publisher-engine.ts`  
> **安全红线**：严格坚持 **Human-in-the-Loop Draft Only（仅填草稿，人工点击最终发布）**

---

## 一、 架构边界与安全合规守则

1. **绝不触碰平台反爬、登录拦截与自动化绕过**：
   - 复用创作者本机已手动登录的 Chrome / Chromium Debug 会话（默认 `http://127.0.0.1:9222`），绝不模拟账号密码登录，绝不尝试识别或绕过滑动拼图、Turnstile、短信验证码等任何反自动化门禁。
2. **绝不静默全自动公开发布**：
   - 脚本的全部职责终点是「**把编译好的富文本、封面图、套图与标签稳妥填入平台草稿箱并保存草稿**」，最终的「确认发布 / 群发」必须由人类创作者亲眼复核并手动点击完成。
3. **强制隐私出境前安检（Pre-Flight Redaction）**：
   - 调用任何平台写入前自动执行 `sanitizeContentForPR()` 审查；如文本中命中内网域名、Token 特征或本机家目录路径（如 `/Users/example/`），直接阻断填充并提示人工清理。

---

## 二、 现有代码审计与多平台适配器设计

当前 [`src/publisher/browser-publisher.ts`](../../src/publisher/browser-publisher.ts)（142 行）仅提供基础雏形：`wechat` 打开主页提示剪贴板粘贴、`juejin` 与 `zhihu` 使用脆弱的单 CSS 选择器硬编码填充。

### 1. 目标多平台插件化适配器矩阵

将单文件 `browser-publisher.ts` 拆分为 `src/publisher/adapters/` 接口契约：

```typescript
export interface PlatformDraftAdapter {
  id: 'wechat' | 'xiaohongshu' | 'zhihu' | 'juejin' | 'x' | 'linkedin';
  editorUrl: string;
  verifyLoggedIn(page: Page): Promise<boolean>;
  fillDraft(page: Page, payload: NormalizedPublishPayload): Promise<PlatformPublishResult>;
}
```

| 目标平台 | 草稿填充策略与技术重点 | 降级回退方案 |
| :--- | :--- | :--- |
| **微信公众号 (`wechat`)** | 连接本地 Chrome 已登录公众号后台 → 新建图文 → 通过 **Dual-MIME Clipboard + `contenteditable` 精准聚焦注入** 写入 100% 内联 HTML 排版 → 自动填入标题与摘要 | 端口未开启时一键打开官方后台并写入系统剪贴板 |
| **小红书图文 (`xiaohongshu`)** | 进入创作者图文发布页 → 通过 `input[type="file"]` 批量上传 `exportDeckToPngs` 产出的 3x 高清套图 → 填入 `Humanizer` 精修后的标题与 `#标签` | 生成导出包文件夹并自动高亮打开目录供拖拽上传 |
| **知乎专栏 (`zhihu`)** | 定位标题输入框与富文本/Markdown 导入节点，提供主/备多组 DOM 选择器数组 + ARIA `role="textbox"` 语义回退 | 复制规范 Markdown 至剪贴板并定位光标 |
| **掘金 (`juejin`)** | 支持 CodeMirror 实例直写 Markdown + fallback `textarea` 事件派发（`input` / `change`）触发前端框架状态更新 | 输出 `.md` 草稿与静态封面图套件 |
| **X / LinkedIn (`x`, `linkedin`)** | X 长文/Thread 拆条预览填充与配图附着；LinkedIn 支持原生矢量 `.pdf` 文档幻灯片轮播上传与配文填充 | 输出按字数切分的 Thread 文本清单与 PDF 文件 |

---

## 三、 选择器防脆弱与可测试性设计

1. **三层选择器定位策略**：优先语义定位（`aria-label`、`placeholder`、`role="textbox"`） → 次选稳定语义类名数组 → 末选友好降级剪贴板提示，单平台页面改版时精准报错并保留人工剪贴板通道。
2. **零联网自动化测试**：在 Playwright E2E / Vitest 中搭建本地 Mock HTML 编辑页固件（模拟 CodeMirror 与 `contenteditable` 富文本盒）验证 `fillDraft()` 全链路，无需真实平台账号即可保证 CI 100% 绿色可回归。

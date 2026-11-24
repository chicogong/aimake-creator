# Aimake Studio · 测试工程体系、代码规范与架构生命周期标准
> 文档编号：AIMAKE-STD-20261124-QUALITY  
> 归属项目：`products/aimake` (爱创工坊)  
> 维护团队：质量工程与平台架构组 (@verifier, @coordinator)

---

## 一、测试工程全景与分层策略

Aimake 坚持**本地优先 (Local-First)**、**零遥测 (Zero-Telemetry)** 与 **高确定性交付** 原则，建立了由四层测试构成的金字塔防线：

```
                    ┌────────────────────────────┐
                    │   端到端测试 E2E (Playwright) │ -> 30s 真实浏览器/5+1介质物理产物校验
                    ├────────────────────────────┤
                    │   黑盒集成测试 (CLI & HTTP)  │ -> 进程调用/Sandboxed /tmp 发包校验
                    ├────────────────────────────┤
                    │   白盒单元测试 (Vitest 70项) │ -> 6.5s AST状态机/TTS缓存分片/防幻觉
                    ├────────────────────────────┤
                    │   冒烟测试 Preflight (0.7s)│ -> pnpm test:smoke 瞬时阻断显式故障
                    └────────────────────────────┘
```

### 1. 冒烟测试 (Smoke Testing)
- **命令**：`pnpm test:smoke`（脚本：`scripts/smoke-test.mjs`）
- **耗时**：**< 0.8s**
- **定位**：在代码提交或构建流水线前毫秒级拦截：
  1. CLI 命令行可执行文件完整性与 `--version` 输出；
  2. 36 套参数化模板清单合法性；
  3. 内存中 Markdown AST 解析与 HTML 实时编译；
  4. 源码机密与路径泄露扫描。

### 2. 白盒单元测试 (Whitebox Unit Testing)
- **命令**：`pnpm test`（脚本：`vitest run`）
- **覆盖核心**：
  - `tests/deck-and-wiki.test.ts`：Markdown AST 语法边界、代码块内换页符容错、行内编辑补丁替换算法 `applyEditablePatch`；
  - `tests/speech-and-revision.test.ts`：TTS 分片 SHA-256 缓存命中、Partial slide reuse（3 页修改 1 页仅发起 1 次远程调用）；
  - `tests/intake-scrapers.test.ts`：多平台抓取正则解析、热点多源聚合与离线降级。

### 3. 黑盒集成测试 (Blackbox Integration Testing)
- **定位**：从纯外部调用者角度验证输入/输出契约。
- **覆盖核心**：
  - 外部无依赖沙盒环境（`/tmp/aimake-sandbox-xxxx`）中执行全局安装的 CLI 命令行命令；
  - 真实 HTTP 端口调用 `/api/radar` 与 `/api/radar/make` 验证 JSON 响应格式；
  - 导出的 PPTX、PNG、MP4 二进制文件头部魔数与文件有效性检查。

### 4. 端到端测试 (E2E Testing)
- **命令**：`pnpm test:e2e`（Playwright 驱动）
- **耗时**：**~31s**
- **覆盖核心**：
  - 启动真实本地服务端与 Chromium 实例；
  - 验证 Studio 画布双向交互（行内编辑、36 模板无刷新切换、灵感抽屉开合）；
  - 验证 SSE 热重载机制；
  - 验证真实 5+1 交付物物理导出（PNG、微信 HTML、PDF、PPTX、60fps MP4）。

### 5. 真实测试 vs Mock 测试权衡
- **真实测试**：所有本地能够确定性执行的链路（编译、排版、导出、原生应用打包）一律跑真实端到端；
- **Mock 测试**：外部不可控因素（第三方付费 API、外部社交网络抓取、大模型推理）一律提供确定性离线固件（`offlineFixtureSpeechProvider`, `CURATED_TREND_FIXTURES`），确保 CI 100% 绿色、零网络抖动、零资金消耗。

---

## 二、代码规范与安全防护体系

1. **TypeScript 严格静态检查**：
   - 启用 `strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true`，消除隐式 any 与死变量。
2. **源码敏感信息与私有路径审计**：
   - `scripts/audit-secrets.mjs` 强制静态扫描 284 个源码文件，严禁泄露云厂商 Key 及本地主机个人绝对路径（`/Users/<name>/`）。
3. **零隐私追踪**：
   - 绝不上报任何用户创作数据，全流程离线优先。

---

## 三、部署、流水线与生命周期维护

1. **多端交付体系**：
   - 官方站点：4 语言静态页面自动化构建部署（Cloudflare Pages / GitHub Pages）；
   - CLI / SDK：`aimake-studio@2.0.0` NPM 官方镜像发布（体积仅 3.28MB）；
   - 桌面客户端：macOS 原生 `.app` 与 `.dmg` 自动化打包与签名校验。
2. **定期重构与代码整理准则**：
   - 单文件行数超过 500 行必须依单一职责拆解；
   - 严控依赖包膨胀，非必要不引入第三方库；
   - 遵循童子军法则（Boy Scout Rule），在迭代业务特性的同时持续清理废弃代码。
3. **Calm UI 前端设计准则**：
   - 零重型前端框架依赖，纯原生 ESM + 现代 CSS，首屏启动 < 50ms；
   - 统一使用 Creator Violet（`#6951ff`）品牌色与极光网格（Aurora Mesh）背景，兼顾专业质感与宁静视觉体验。

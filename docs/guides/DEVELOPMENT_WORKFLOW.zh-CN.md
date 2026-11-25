# Aimake Studio · 研发与代码交付标准工作流规范 (`DEVELOPMENT_WORKFLOW.zh-CN.md`)

> **适用范围**：人类核心贡献者与自主协作 Agent（Antigravity、Claude Code、Codex、Cursor、OpenCode 等）  
> **配套文档**：[`DEVELOPMENT_WORKFLOW.md`](./DEVELOPMENT_WORKFLOW.md)（英文原版）· [`AGENTS.md`](../../AGENTS.md) · [`CONTRIBUTING.md`](../../CONTRIBUTING.md) · [`BACKLOG_AND_AGENT_TASKS.md`](../BACKLOG_AND_AGENT_TASKS.md)

---

## 1. 研发协同与基础设施概览

Aimake Studio 采用标准的主干单线性（Single Linear History）与自动化看板流转机制，研发链路各环节与工具映射如下：

| 工具 / 渠道 | 核心职责 | 地址 / 规范指引 |
| :--- | :--- | :--- |
| **GitHub Issues** | 功能提案、Bug 报告、模板征集、任务认领 | [GitHub Issues](https://github.com/chicogong/aimake-creator/issues) |
| **Project 看板** | 自动化敏捷看板（Todo → In Progress → In Review → Done） | [Aimake 看板 (Project #3)](https://github.com/users/chicogong/projects/3) |
| **Pull Requests** | 代码审查、CI 门禁检验、交付成果合并 | [Pull Requests](https://github.com/chicogong/aimake-creator/pulls) |
| **Milestones** | 版本迭代追踪（`v2.0.1`、`v2.1.0`、`v2.2.0`、`v2.3.0`） | [Milestones](https://github.com/chicogong/aimake-creator/milestones) |
| **任务总看板** | 面向 Agent 的可认领任务与契约测试清单 | [`docs/BACKLOG_AND_AGENT_TASKS.md`](../BACKLOG_AND_AGENT_TASKS.md) |
| **自动化提交脚本** | 一键规范化创建与看板绑定的 Issue | `pnpm issue:create` |

---

## 2. Issue 生命周期与标准化分类

在报告缺陷或提报需求时，需采用 `.github/ISSUE_TEMPLATE/` 下的标准结构化模板：

| 类型 | 标题前缀 | 标签 (Labels) | 适用场景 |
| :--- | :--- | :--- | :--- |
| **缺陷报告** | `fix: ` | `bug` | 页面排版破损、导出崩溃、时间轴漂移、安全漏洞 |
| **功能特性** | `feat: ` | `enhancement` | 新引擎功能、新导出格式、新 CLI 命令、新 MCP 工具 |
| **模板提交** | `template: ` | `area: templates`, `community: template-submission` | 新增 3:4、16:9、4:5、9:16 参数化设计系统 |
| **重构维护** | `chore: ` | `enhancement` | 依赖升级、文档补全、CI/CD 优化、单测覆盖率增强 |

### 标签分类维度 (Taxonomy)

1. **子系统业务域 (`area: <name>`)**：
   - `area: intake`：素材摄取与爬虫（X/Twitter、微信文章、AutoClip、灵感雷达）
   - `area: distill`：知识蒸馏、Persona 克隆、Creator Wiki 生成
   - `area: create`：Calm Studio 核心画布、分镜编译器、模板渲染管线
   - `area: publish`：全渠道导出器（PNG、PPTX、PDF、HTML、公众号 CDP）
   - `area: video`：视频合成、FFmpeg 响度标准化、音画防漂移与剪映 CapCut 草稿
   - `area: templates`：36 套参数化设计系统、CSS 变量与网格系统
   - `area: mcp` / `area: acp`：Model Context Protocol 与 Agent Communication Protocol
   - `area: desktop`：macOS Swift 原生壳体包装与桌面构建
   - `area: site`：`aimake.cc` 4 语种官网与在线工坊 Web Playground
   - `area: security`：本地环回 CSRF 拦截、敏感数据审计与沙箱隔离
   - `area: ci-cd`：GitHub Actions 持续集成与发布工作流
2. **优先级 (`priority: <level>`)**：
   - `priority: p0-urgent`：致命阻塞、安全漏洞、回归故障（最优先修复）
   - `priority: p1-high`：当前里程碑关键交付
   - `priority: p2-normal`：常规优化与增强

---

## 3. GitHub Project #3 自动化看板状态机

Aimake Studio 研发看板通过 `.github/workflows/project-automation.yml` 实现全流程无感流转：

```mermaid
flowchart LR
    A["Issue 创建"] -->|自动添加| B["Todo (待办)"]
    B -->|分配认领人 / 开分支| C["In Progress (进行中)"]
    C -->|提交 PR (Closes #N)| D["In Review (审查与门禁)"]
    D -->|Squash-and-Merge 合并| E["Done (已完成)"]
```

- **Todo**：已排期或经评估进入里程碑的工作项；
- **In Progress**：已认领并建立独立分支或 Worktree 正在开发；
- **In Review**：PR 已发起，正在等待 Code Review 与 GitHub Actions CI Quality Gate 验证；
- **Done**：PR 以 Squash 方式合入 `main`，关联的 Issue 自动闭环并归档至 Done。

---

## 4. Git 规范、分支策略与 Git Worktree 隔离机制

为确保 Git 历史具备极佳的可回溯性（便于 `git bisect` 快速定位缺陷），仓库采用 **主干 Squash-and-Merge** 策略。

### Git Worktree 隔离机制（多任务 / 多 Agent 协同首选）

当多名开发者或多个并行 Agent 协作不同模块时，严禁在同一个工作区反复切分支，推荐使用 **Git Worktree** 创建独立的物理工作目录：

```bash
# 1. 获取最新主干，在独立目录检出工作树与新分支
git fetch origin main
git worktree add ../aimake-fix-branch -b fix/my-fix-topic origin/main

# 2. 进入新工作树目录安装依赖（pnpm 自动复用全局硬链接缓存，毫秒级就绪）
cd ../aimake-fix-branch
pnpm install

# 3. 编码、本地门禁验证、常规提交
pnpm typecheck
pnpm test
git commit -m "fix(subsystem): describe change affirmatively"

# 4. 推送分支并发起 Pull Request
git push -u origin fix/my-fix-topic
gh pr create --title "fix(subsystem): describe change" --body "Closes #IssueNum"

# 5. PR 合并后清理工作树
cd ../aimake
git worktree remove ../aimake-fix-branch
git branch -d fix/my-fix-topic
```

### 分支命名规范

分支统一从最新 `origin/main` 切出：

| 分支前缀 | 适用场景 | 示例 |
| :--- | :--- | :--- |
| `feat/` | 新增产品功能或系统能力 | `feat/acp-stream-protocol` |
| `fix/` | 缺陷修复与稳定性加固 | `fix/mp4-process-leak` |
| `template/` | 新增参数化设计系统 | `template/swiss-grid-magazine` |
| `refactor/` | 架构与代码重构（不改变外部行为） | `refactor/deck-ast-parser` |
| `chore/` | 构建脚本、工具链与 CI/CD 维护 | `chore/upgrade-vitest-v3` |
| `docs/` | 研发文档、设计规范与指引 | `docs/development-workflow` |

### 提交信息规范 (Conventional Commits)

格式：`<type>(<scope>): <subject>`

- **Type**：`feat`、`fix`、`docs`、`refactor`、`perf`、`test`、`chore`
- **Scope**：`(cli)`、`(studio)`、`(templates)`、`(publisher)`、`(intake)`、`(mcp)`、`(acp)`、`(desktop)`、`(site)`、`(security)`
- **范例**：`fix(security): resolve fail-open acp permission and path containment`

---

## 5. 本地质量门禁与预检流程 (Preflight Gates)

在提交 Commit 或发起 PR 前，必须在本地依次执行质量门禁命令：

```bash
# 1. 静态类型检查（0 错误）
pnpm typecheck

# 2. 单元与集成测试（100% 通过）
pnpm test

# 3. 模板与运行烟测
pnpm test:smoke

# 4. 敏感凭据与本地隐私路径扫描（必须 0 泄露）
pnpm audit:secrets

# 5. 官方网站与工坊静态编译
pnpm site:build

# 一键运行全量门禁检查
pnpm verify
```

### 本地优先与零遥测红线 (Local-First Contract)

所有提交必须遵守三项不可触碰的工程红线：
1. **零外部数据追踪**：禁止引入任何第三方埋点统计、遥测脚本或未经许可的外部通信；
2. **100% 离线可用**：核心创作、模板排版渲染及 PNG/PPTX/PDF/HTML 导出功能必须在无网环境下完全可用；
3. **本地数据主权**：所有工作区文件、幻灯片、调研素材与编译产物仅保留在用户本地目录，严禁私自外传。

---

## 6. Pull Request 提交与合并指引

```bash
# 1. 推送当前特性分支
git push -u origin fix/my-fix-topic

# 2. 通过 GitHub CLI 开启 PR（务必在正文中写明 Closes #IssueNum 关联自动关单）
gh pr create \
  --title "fix(security): resolve fail-open acp permission and path containment" \
  --body "### Summary
- Implemented Fail-Closed permission fallback on timeout
- Enforced workspace directory containment on targetDeckPath
- Added 100% regression test coverage

Closes #25"

# 3. 待 CI 绿灯与 Code Review 完成后，通过 Squash-and-Merge 合并
gh pr merge <pr-number> --squash --delete-branch
```

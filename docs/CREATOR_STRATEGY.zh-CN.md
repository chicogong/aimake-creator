# Aimake 产品战略 · 多来源与灵感，在 Studio 创作，向多平台分发

[English · International channels](./CREATOR_STRATEGY.md)

**多来源 + 灵感 → Aimake Studio → 多平台分发。** 创作者可以先收资料，再形成自己的观点；也可以先记下一个问题，过几天再补上支持或反驳它的材料。Studio 把两条路径汇在同一件作品上。作者在本地选择素材、核对事实、组织叙事并编辑图文，再针对每个平台的读者调整标题、结构和配图。

![战略图。公开来源和个人素材、创作者的灵感分别进入 Aimake Studio，形成可编辑作品，再面向公众号、小红书、知乎、掘金和视频渠道分发。](./assets/creator-strategy.svg)

## 两个入口，一件作品

| 入口 | 创作者带来什么 | 建议的桌面体验 |
| --- | --- | --- |
| 多来源素材 | 订阅与网页、研究报告、访谈摘录、表格、照片或截图 | 自动订阅与手工导入进入同一素材库。保留原文、日期、作者或图片许可，按作品选用一份或多份。 |
| 个人灵感 | 随手记的观察、读者提问、一个标题、想画的示意图 | 无链接也能先保存，之后可关联素材、补充反例，或把一个想法拆成多件作品。 |

**Studio 是创作发生的地方。** 作者把几份材料和一个问题放到同一件作品中，选择叙事角度，把引用连回原文，使用富文本、图片、图表或图卡排版。AI 可协助提炼、改写、配图，由作者预览并接受修改。平台版本沿用已核对的事实，各自保留作者改过的标题、配文与顺序。更正原稿数字时，应能指出哪些版本需要复核。[素材库 #64](https://github.com/chicogong/aimake-creator/issues/64) · [从选中素材创作 #44](https://github.com/chicogong/aimake-creator/issues/44) · [AI 修改确认 #41](https://github.com/chicogong/aimake-creator/issues/41)

## 同一件作品，按平台交付

| 平台 | 面向读者的成品 | 建议交给作者的结果 |
| --- | --- | --- |
| 微信公众号 | 富文本长文、头图、正文插图 | 先验证目标账号能回读同一篇草稿，返回编辑入口或带账号、标题的草稿箱入口。 |
| 小红书 | 3:4 图组、封面、配文 | 先交付有序套图与配文。目标账号能重新打开并核对顺序后，再启用草稿回执。 |
| 知乎、掘金 | 知乎的问题解答，或掘金含代码、图表的技术文章 | 每个平台分别验收保存、重开、账号和正文。一个渠道失败时可单独重试。 |
| 抖音、B 站等视频渠道 | 根据平台重写的口播稿、视频、字幕、封面 | 作为后续方向，先用创作者愿意采用的成片验收交付包，再验证对应平台的草稿能力。 |

平台卡片应显示真实进度，例如「已生成本地包」「编辑器已打开」「平台草稿已核验」。草稿回执同时显示账号、稿件和审核入口，最终发布由创作者在平台确认。[多平台实施方案与开源选型](https://github.com/chicogong/aimake-creator/discussions/58)

## 现有依据与试点案例

- **素材与灵感。** 主分支有网页、表格和字幕等摄取路径，也有订阅到期检查。预设间隔为 Hacker News 30 分钟、科技 RSS 60 分钟。持续运行和退出后的实抓效果仍需桌面验收。无链接记灵感、后补材料、多选混合创作列为试点任务。[摄取代码](https://github.com/chicogong/aimake-creator/blob/b24af2618c329c02b37e18ff1addc6271b701355/src/intake/index.ts) · [订阅代码](https://github.com/chicogong/aimake-creator/blob/b24af2618c329c02b37e18ff1addc6271b701355/src/radar/feed-scheduler.ts) · [桌面刷新 #68](https://github.com/chicogong/aimake-creator/issues/68)
- **科技新闻案例。** 黑五 AI 比价作品结合了产品发布、消费者调查、授权照片，以及作者提出的「标价 199 和 219，算上运费哪个便宜？」。桌面试用产出了四张竖图和本地公众号富文本，平台草稿重开仍待验证。[作品与桌面试用记录](https://github.com/chicogong/aimake-creator/discussions/47#discussioncomment-19941026)
- **灵感先行的试点。** 例如作者先记下读者的问题「为什么我的咖啡总是偏酸？」，再加入自己的冲煮记录、两张照片与烘焙商的参数说明。在 Studio 写成有条件的对照实验，小红书用三张对比图，公众号保留配方与观察过程。这个案例用来检验新体验。[首用路径 #74](https://github.com/chicogong/aimake-creator/issues/74)
- **草稿回执。** 目前公众号浏览器适配器在仅打开后台时也可能返回 `draft_saved`。知乎和掘金的相应分支也缺少独立重开核对。真实平台能力按账号和作品逐项验收。[适配器代码](https://github.com/chicogong/aimake-creator/blob/b24af2618c329c02b37e18ff1addc6271b701355/src/publisher/browser-publisher.ts) · [平台草稿 #4](https://github.com/chicogong/aimake-creator/issues/4)

## 建议投入顺序

1. **先接通两条输入路径。** 在公开安装包里分别从多份素材起稿、从无链接灵感起稿。验收时关闭并重开工作区，再为同一灵感补一张图和一条来源，检查作者原话与原文能分别找回。[素材库 #64](https://github.com/chicogong/aimake-creator/issues/64)
2. **让 Studio 做出有平台差异的作品。** 用一个作品分别生成公众号长文和小红书图组，允许单改其中一版。更正一个共用数字，复核两边的引用和成品，保留各版手改内容。[引用审阅 #44](https://github.com/chicogong/aimake-creator/issues/44) · [导出隔离 #39](https://github.com/chicogong/aimake-creator/issues/39)
3. **逐个平台验证分发。** 真草稿先验公众号，再验知乎、掘金；小红书先交付套图与配文。相同版本重试能找到同一份草稿；登录失效时，保留本地成果和待办。各平台以自身验收结果上线。[分发实施计划](https://github.com/chicogong/aimake-creator/discussions/58)
4. **让下一件作品用得上前一次积累。** 把经许可的素材、模板、编辑习惯保留在本地。社区可按使用场景贡献带素材出处、可替换图片和多平台成品的模板。用回访创作者实际复用的资产来决定优先维护哪些来源和模板。[社区模板 #2](https://github.com/chicogong/aimake-creator/issues/2) · [本地知识库 #11](https://github.com/chicogong/aimake-creator/issues/11)

建议首轮邀请 5 位日常在多个平台创作的作者，自带真实素材和未完成的灵感，覆盖两种起点。记录从开始到两份可用平台成品的用时、哪些步骤需要重新录入或手改、各平台草稿按作品版本重开的成功数与尝试数。七天后回访作者是否复用了上次的素材、想法或版式，并用第二件作品核对。试点结果可挂到[产品看板](https://github.com/users/chicogong/projects/3)对应任务，工程投入见[版本路线图](./ROADMAP-2.0.md)。

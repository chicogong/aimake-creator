# 199 和 219，谁更便宜？

11 月 23 日，OpenAI 把 GPT-6.2 带到普通聊天并逐步推出。赶上 11 月 27 日黑五，用两笔虚构报价把技术更新变成手机上能看懂、能收藏的一次算账练习。活动价格以读者自己的结算页为准。[更新原文](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) · [来源与算式](./sources/facts.md)

| 发布渠道 | 有什么 |
| --- | --- |
| 小红书 | [四张 3:4 社交卡](./carousel.deck.md)，含首图、算式、可复制指令和结算核对 |
| 即刻／微博 | [短帖与平台文案](./posts.md) |
| 公众号 | [可编辑富文本正文](./article.md)，保留数据表和来源链接 |

![黑五 AI 比价图文在 Aimake macOS 原生舞台中](../../docs/assets/desktop-ai-shopping.jpg)

配图使用 Nenad Stojković 的授权实拍，保留署名与许可。[照片来源](./sources/photo-credit.md)

## 用 Aimake 导出

把 `carousel.deck.md` 和 `assets/` 放到工作区的 `decks/` 下，把 `sources/` 的笔记放到工作区的同名目录。桌面端打开图文，从「导出」生成 PNG 排好顺序。然后把图组和对应该平台的文案一起上传，公众号正文可独立生成内联 HTML。

```bash
aimake render ./examples/news-ai-shopping/carousel.deck.md -f png -o ./exports/ai-shopping/cards
aimake publish ./examples/news-ai-shopping/article.md --target wechat,xiaohongshu --out ./exports/ai-shopping/drafts
```

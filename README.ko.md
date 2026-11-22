# Aimake — 로컬 퍼스트 멀티모달 제작 스튜디오 & CLI

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · **한국어**

**36개 디자인 템플릿, 오프라인 Mermaid SVG 다이어그램, Highlight.js 코드 하이라이팅, 7개 워크스페이스 프리셋 AI 스킬 내장. 하나의 Markdown으로 인스타그램 카드뉴스(`keep-all`), 링크드인 PDF 캐러셀, 편집 가능한 `.pptx`, 60fps 영상(`MP4`)을 100% 로컬에서 생성합니다.**

웹 플레이그라운드: **[https://aimake.cc/playground/](https://aimake.cc/playground/)**

```bash
# 대화형 온보딩 마법사 실행 (`aimake` / `aimake-studio` 명령 모두 지원)
npx aimake-studio

# 워크스페이스 초기화 · Studio 실행 · Marp/Slidev 가져오기 · 렌더링
aimake workspace init ./my-space
aimake studio --demo
aimake import ./slides.md -o ./converted.deck.md
aimake render examples/ko-cardnews-guide.deck.md -f png -o ./out/cardnews
```

[MIT License](./LICENSE) © 2026 Aimake Labs / Chico Gong.

# Chrome Web Store listing copy

CWS 제출용 카피. Read/Skip은 **규칙 검증이 아니라** 「三行/3-line 요약으로 충분한지」 Gemini AI 추천(애매하면 Read) 기준.

**Privacy policy URL:** GitHub Pages `legal.html` (예: `https://khosyk.github.io/ai_web_summarizer/legal.html`) — [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 참고.

**ZIP:** `yarn build` → `dist/` 내용물만 zip (루트에 `manifest.json`).

---

## Short description (≤132 chars)

### English (128 chars)

```
Too many tabs? AI suggests Read or Skip (3 lines enough?), plus 3-line & full summaries—side panel, your Gemini key, no server.
```

### 简体中文

```
标签太多？AI 建议「值得读/可跳过」（三行是否够用），附三行与全文摘要。侧边栏、自带 Gemini 密钥、无服务端。
```

---

## Detailed description

CWS 안내: **기능**과 **설치 이유** 중심. Primary locale에 맞는 본문 붙여넣기. 추가 locale(中文)은 Dashboard에서 별도 등록.

### English

```
WHY INSTALL WEB SUMMARY

If you keep dozens of tabs open and never know which article is worth your time, Web Summary is built for you. It runs in Chrome’s side panel so you can triage the active tab without opening another page or losing your place.

Unlike generic “summarize this page” tools, Web Summary starts with one practical question:

“Is a three-line summary enough—or should I read more?”

That helps you close tabs faster and spend reading time only where it matters.

FEATURES

• Read / Skip suggestion
  Gemini suggests whether to keep the tab open or move on, with one concrete reason (not vague praise).
  • Read — three lines are not enough to understand, decide, or act; read the article or the full summary below.
  • Skip — three lines are enough, or the page adds little new value; safe to close the tab.
  • If the model is unsure, it defaults to Read (conservative).
  You always see the three-line and full summaries below, so the final call is yours.

• Three-line summary
  Core facts in exactly three sentences—enough to scan a tab in seconds when you are clearing a backlog.

• Full summary
  Deeper context when the suggestion is Read, or when you want more detail before closing the tab.

• Chrome Side Panel
  Summarize beside the page you are on. Pin the extension, open the panel once, and work through tabs one by one.

• Summarize on click only
  Article text is extracted only when you tap “Summarize this tab”—not on every page load in the background.

• Your Gemini API key (BYOK)
  Use your own key from Google AI Studio (free or paid tier). You control cost and quota.

• English or 简体中文 output
  Switch output language in the panel header.

• Keyboard shortcut
  Alt+Shift+S opens the side panel (customize at chrome://extensions/shortcuts).

• Setup guide & Settings
  Welcome tab walks you through pinning the extension, getting a key, and your first summary.

PRIVACY

• No Web Summary backend — we do not collect, log, or store your page text, URLs, or summaries.
• Local storage only — your API key (if saved) and UI language stay in chrome.storage.local on this device.
• Direct to Google — when you summarize, text goes from your browser straight to the Gemini API with your key.

REQUIREMENTS

• Chrome 114+ (Side Panel API)
• A Gemini API key from Google AI Studio
• http(s) pages with enough readable article text

GET STARTED

1. Install → follow the setup guide (welcome tab)
2. Pin “A · Web Summary” and open the side panel
3. Save your Gemini API key in Settings
4. Open an article → Summarize this tab

Single purpose: Help you decide whether to read the current web page tab and summarize it using your Gemini API key.
```

### 简体中文

```
为什么安装 Web Summary

标签页开太多、不知道哪篇值得读？Web Summary 专为这种场景设计。它在 Chrome 侧边栏运行，无需新开页面，也不打断当前浏览，就能快速处理当前标签。

与普通「整页摘要」不同，Web Summary 先回答一个实际问题：

「三行摘要够不够？还是要继续读？」

这样你可以更快关掉无关标签，把时间留给真正值得读的内容。

功能说明

• 值得读 / 可跳过 建议
  由 Gemini 根据当前文章给出建议，并附一句具体理由（避免空泛评价）。
  • 值得读 — 三行摘要不足以理解、做决定或采取行动；应继续阅读原文或查看下方全文摘要。
  • 可跳过 — 三行摘要已足够，或页面新增价值不大；可以关闭标签。
  • 若模型不确定，默认建议「值得读」（偏保守）。
  下方始终提供三行摘要与全文摘要，最终判断由您做出。

• 三行摘要
  用恰好三句话概括核心事实，适合快速扫一遍积压的标签页。

• 全文摘要
  当建议为「值得读」时，或关闭标签前需要更多上下文时使用。

• Chrome 侧边栏
  在正在浏览的页面旁直接摘要。固定扩展后打开侧边栏，逐个标签处理即可。

• 仅在点击时摘要
  只有点击「摘要当前标签」时才提取正文，不会在后台持续读取每个页面。

• 自带 Gemini API 密钥（BYOK）
  使用您在 Google AI Studio 申请的密钥（免费或付费档位），费用与配额由您自行控制。

• 英文或简体中文输出
  在侧边栏顶部切换输出语言。

• 键盘快捷键
  Alt+Shift+S 打开侧边栏（可在 chrome://extensions/shortcuts 自定义）。

• 设置向导与选项页
  安装后欢迎页引导：固定扩展、获取密钥、完成首次摘要。

隐私

• 无 Web Summary 服务端 — 不收集、不记录、不保存您的页面正文、URL 或摘要结果。
• 仅本地存储 — 若您保存 API 密钥及界面语言偏好，仅存在于本机 chrome.storage.local。
• 直连 Google — 摘要时，正文由浏览器直接使用您的密钥发送至 Gemini API。

使用要求

• Chrome 114+（支持侧边栏 API）
• Google AI Studio 的 Gemini API 密钥
• 具有足够可读正文的 http(s) 页面

快速开始

1. 安装 → 按欢迎页向导操作
2. 固定「A · Web Summary」并打开侧边栏
3. 在设置中保存 Gemini API 密钥
4. 打开文章页 → 点击「摘要当前标签」

单一用途：帮助用户判断是否阅读当前网页标签，并使用其 Gemini API 密钥进行摘要。
```

---

## manifest description (extension card)

| Locale | Text |
|--------|------|
| English | AI suggests Read or Skip (are 3 lines enough?). Side-panel summaries with your Gemini key—no server. |
| 简体中文 | AI 建议值得读/可跳过（三行是否够用）。侧边栏摘要，自带 Gemini 密钥，无服务端。 |

---

## Single purpose (Privacy tab)

**English**

```
Help the user decide whether to read the current web page tab and summarize it using their Gemini API key.
```

**简体中文**

```
帮助用户判断是否阅读当前网页标签，并使用其 Gemini API 密钥进行摘要。
```

---

## Screenshot captions

1. **Read or Skip** — AI asks: are 3 lines enough? / AI 建议：三行够不够？
2. **One-line reason** — concrete, not vague praise / 一句具体理由
3. **Three-line summary** — scan the gist in seconds / 三行快速浏览
4. **Full summary** — when you choose to read deeper / 全文摘要深入了解
5. **Your key, no server** — Summarize only when you click / 自带密钥，点击才摘要

---

## Permissions (why we ask)

| Permission | Purpose |
|------------|---------|
| `sidePanel` | Show the summarizer UI |
| `storage` | Save your API key and UI language locally |
| `activeTab` + `scripting` | Run extraction when you click Summarize |
| `http://*/*`, `https://*/*` | Host access to read the active http(s) tab from the side panel |
| `tabs` | Open setup guide / Settings tabs |
| `generativelanguage.googleapis.com` | Call Gemini with your key |

---

## Brand note

Store name **A · Web Summary** sorts first in the Extensions (A–Z) menu to help new users find the extension after install. In-product title remains **Web Summary**.

---

## CWS dashboard checklist

| Field | Value |
|-------|-------|
| Primary language | English (or 中文 if targeting CN first) |
| Description | Detailed description above (matching locale) |
| Additional locale | Add 简体中文 in Dashboard → paste 中文 body |
| Category | Productivity |
| Privacy policy | GitHub Pages `legal.html` URL |

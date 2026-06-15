# Privacy Policy — Web Summary

> **Canonical source:** [`public/legal.html`](../public/legal.html) — `yarn build` 시 `dist/legal.html`로 함께 출력됩니다.

**Last updated:** 2026-06-15

Web Summary is a Chrome extension (BYOK: bring your own Gemini API key) that helps you decide whether to read the current browser tab and summarizes it. This policy describes what the extension does with your data.

## What we collect

**We do not operate backend servers** and do **not** collect, log, or store:

- Page text or URLs you summarize  
- Generated summaries or read/skip verdicts  
- Usage analytics tied to your browsing  

## What stays on your device

The extension may persist locally (`chrome.storage.local`):

- Your **Gemini API key**, if you save it in Settings  
- Your **side panel UI language** (English or 中文)

## What is sent to third parties

When you tap **Summarize this tab**, article text is sent **directly from your browser** to **Google’s Gemini API** using your API key. That processing is governed by [Google’s terms and privacy policy](https://policies.google.com/privacy).

We do not receive a copy of that content.

## Page access

The extension injects a content script **only when you request a summary** (on the active http/https tab) to extract readable text. It does not run on every page load in the background for summarization.

## Summary results

Read/skip verdicts and summaries appear in the side panel only and are **not saved** by the extension. Closing the panel or browser clears them from the UI.

## Contact

For privacy questions about this extension, open an issue in the project repository or contact the publisher listed on the Chrome Web Store listing.

## Open-source components

Bundled library licenses are **not** part of this privacy policy. See [`docs/THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and `public/third-party-notices.html` (also shipped in `dist/`).

---

中文摘要：本扩展不运营服务器，不保存浏览正文、URL 或摘要/读跳过判断。本地仅保存您自愿填写的 Gemini API 密钥与侧边栏界面语言。摘要时正文由浏览器直接发送至 Google Gemini API。

# Privacy Policy — Web Summary

> **Canonical source:** [`public/legal.html`](../public/legal.html) — `yarn build` 시 `dist/legal.html`로 함께 출력됩니다.

**Last updated:** 2026-07-08

Web Summary is a Chrome extension (BYOK: bring your own Gemini API key) that helps you decide whether to read the current browser tab and summarizes it. This policy describes what the extension does with your data.

## What we collect

**We do not operate backend servers** and do **not** collect, log, or store:

- Page text or URLs you summarize  
- Generated summaries or read/skip verdicts  
- Usage analytics tied to your browsing  

## What stays on your device

The extension may persist locally (`chrome.storage.local`):

- Your **Gemini API key**, if you save it in Settings  
- Your **side panel UI language** (English, Korean, or 中文)  
- Your **Auto summarize** toggle (default OFF)  
- Your **Auto summarize excluded domains** list (hostname blocklist)  
- Whether you have **completed your first summary** (onboarding hint only)

## What is sent to third parties

When you tap **Summarize this tab** (or when **Auto** is ON and you stay on a tab for about 3 seconds), article text is sent **directly from your browser** to **Google’s Gemini API** using your API key. That processing is governed by [Google’s privacy policy](https://policies.google.com/privacy) and [Gemini API terms](https://ai.google.dev/gemini-api/terms).

We do not receive a copy of that content.

### Gemini API (BYOK) — your responsibilities

- You accept Google’s terms when you create an API key in AI Studio.  
- **Unpaid (free) tier:** Google may use submitted prompts and responses to improve its products; human reviewers may process that content. See “Unpaid Services” in the Gemini API terms.  
- **EEA, UK, Switzerland:** Google’s terms require **Paid Services** (a Cloud project with billing enabled) when using API clients in those regions. Free quota may still apply; see [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing).  

## Page access

The extension injects a content script **only when a summary is requested** (manual button or Auto after dwell) on the active http/https tab to extract readable text. It does not run on every page load in the background for summarization.

## Summary results

Read/skip verdicts and three-line summaries appear in the side panel only and are **not saved** by the extension. Closing the panel or browser clears them from the UI. Results include the **source tab URL** and an **AI-generated** label. If your UI language differs from the article, output may include **translation**.

## Copyright & acceptable use

Use Web Summary for **personal reading triage** only—not to republish articles. You must comply with each website’s terms and applicable law. Do not summarize content you are not allowed to process.

Full terms: [`public/legal.html`](../public/legal.html) (sections 7–8).

## Contact

For privacy questions, email [thisistest20260619@gmail.com](mailto:thisistest20260619@gmail.com), open an issue in the project repository, or contact the publisher listed on the Chrome Web Store listing.

## Open-source components

Bundled library licenses are **not** part of this privacy policy. See [`docs/THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and `public/third-party-notices.html` (also shipped in `dist/`).

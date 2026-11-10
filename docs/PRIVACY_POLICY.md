# Privacy Policy — Web Summary

> **Canonical source:** [`public/legal.html`](../public/legal.html) — `yarn build` 시 `dist/legal.html`로 함께 출력됩니다.

**Effective:** 2026-11-10

Web Summary is a Chrome extension (BYOK: bring your own Gemini API key) that helps you decide whether to read the current browser tab and summarizes it. This policy describes what the extension does with your data.

## What we collect

**We do not operate backend servers**, and nothing below is ever sent to us. We do **not** collect or log:

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
- The time until which the **gift notice** stays hidden, if you choose to hide it
- Your **summary history** (see below)

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

Read/skip verdicts and three-line summaries appear in the side panel. Results include the **source tab URL** and an **AI-generated** label. If your UI language differs from the article, output may include **translation**.

## Summary history

- **What is saved:** on a new install, each result is saved by default with the page address (including any query string), language, and time. Article text is not saved. With **Auto** on, this includes pages summarized automatically after about 3 seconds, so the list can show pages you visited. If you updated from a version without history, nothing is saved automatically until you turn it on in the history panel.
- **Where:** only in `chrome.storage.local` on this browser. It is never sent to us or to Google. Reusing a saved summary makes no API call.
- **How long:** up to the latest 200 pages, until you delete them or remove the extension. Pages marked **Read later** are removed last.
- **Your control:** in the history panel you can turn off automatic saving (only pages you mark as Read later are then saved, and removing that mark also deletes the page from history), delete one entry, or delete everything.
- **Incognito:** pages summarized in incognito windows are not saved.

## Copyright & acceptable use

Use Web Summary for **personal reading triage** only—not to republish articles. You must comply with each website’s terms and applicable law. Do not summarize content you are not allowed to process.

Full terms: [`public/legal.html`](../public/legal.html) (sections 7–8).

## Gifts and contact

The extension does not collect gift records. The operator (mehosy) receives the information below only through payment service notifications or email.

| | Items | Purpose | Basis | Retention |
| --- | --- | --- | --- | --- |
| Gifts | Sender name or display name shown by the payment service, amount, date, message | Confirming receipt, recording the total received, returns, tax | Consent through sending voluntarily; legal obligation for tax records | 5 years from receipt |
| Contact | Email address, content, date | Replies, returns | Consent through sending the email | 1 year after the matter is closed |

**External services:** KakaoPay and PayPal are reached only when you press a button in the gift dialog or scan a QR code; each company's privacy policy then applies. The QR library is bundled with the extension, so no request goes to cdnjs or any other external server.

**Transfer abroad:** contact email is received through Gmail (Google LLC, United States). Your email address and content are sent over the network when you send an email, for receiving and storing it, for the contact retention period above. You can use a repository issue instead, but issues are public.

Gift terms: [`DONATION.md`](./DONATION.md).

## Contact

For privacy questions, email [thisistest20260619@gmail.com](mailto:thisistest20260619@gmail.com), open an issue in the project repository, or contact the publisher listed on the Chrome Web Store listing.

## Open-source components

Bundled library licenses are **not** part of this privacy policy. See [`docs/THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and `public/third-party-notices.html` (also shipped in `dist/`).

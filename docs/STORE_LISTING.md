# Chrome Web Store listing copy

Host **`dist/legal.html`** (from `yarn build`) on GitHub Pages (or similar) and paste that URL into the **Privacy policy** field in the Developer Dashboard.

Same build also outputs **`dist/welcome.html`** — deploy both to the same HTTPS origin if you want a public onboarding mirror.

## Short description (≤132 chars)

Read or skip each tab? Side-panel summaries with your Gemini key—no server, straight to Google.

## Detailed description

**Web Summary** adds a side panel that helps you **decide whether to keep reading the active tab**—then summarizes it with **your own Google Gemini API key** (free or paid tier at [Google AI Studio](https://aistudio.google.com/apikey)).

### What you get

- **Read / Skip verdict** — Worth reading, or safe to close the tab? One-line reason included.
- **Three-line summary** — Core facts at a glance.
- **Full summary** — Deeper context when you need it.
- **English or 中文** output — switch in the panel header.

Built for people with **many tabs open**: triage first, read only what matters.

### How it works

1. Install → open the setup guide (welcome tab)  
2. Pin **A · Web Summary** from the Extensions menu and open the side panel  
3. Save your API key in Settings  
4. Open an article page → **Summarize this tab** → see read/skip + summaries

### Privacy

- **No Web Summary backend** — we do not collect or store page text, URLs, or summaries  
- **Local only:** your API key (if saved) and UI language preference stay in `chrome.storage.local` on this browser  
- **Direct to Google:** when you summarize, text is sent from your browser to the Gemini API with your key  
- See [Legal &amp; Privacy](../public/legal.html) → published as `dist/legal.html` after build

### Requirements

- Chrome 114+ (Side Panel API)  
- A Gemini API key (BYOK)  
- http(s) pages with enough readable article text  

### Permissions (why we ask)

| Permission | Purpose |
|------------|---------|
| `sidePanel` | Show the summarizer UI |
| `storage` | Save your API key and UI language locally |
| `activeTab` + `scripting` | Run extraction when you click Summarize |
| `http://*/*`, `https://*/*` | Host access to read the active http(s) tab from the side panel |
| `tabs` | Open setup guide / Settings tabs |
| `generativelanguage.googleapis.com` | Call Gemini with your key |

### Keyboard shortcut

`Alt+Shift+S` (customize at `chrome://extensions/shortcuts`) — opens the side panel via the toolbar action.

## Single purpose

Help the user decide whether to read the current web page tab and summarize it using their Gemini API key.

## Brand note

Store name **A · Web Summary** sorts first in the Extensions (A–Z) menu to help new users find the extension after install. In-product title remains **Web Summary**.

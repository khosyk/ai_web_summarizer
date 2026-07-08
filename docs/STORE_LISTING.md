# Chrome Web Store listing copy

CWS 제출용 카피. Read/Skip은 **규칙 검증이 아니라** 「三行/3-line 요약으로 충분한지」 Gemini AI 추천(애매하면 Read) 기준.

**Privacy policy URL:** GitHub Pages `legal.html` (예: `https://khosyk.github.io/ai_web_summarizer/legal.html`) — [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 참고.

**ZIP:** `yarn build` → `dist/` 내용물만 zip (루트에 `manifest.json`).

---

## Copy quality gate

작성·수정 후 4관점 자체 채점 (각 10점, **종합 ≥ 8.0**). 항목 8 미만이면 해당 문장 수정 후 재채점.

| 관점 | 체크 | 점수 |
|------|------|------|
| 마케팅 | pain→solution 첫 2문장, 「3 lines enough?」 차별화, no server/BYOK | 8.5 |
| 기획 | README「현재 기능」1:1, Auto 기본 OFF·제외 도메인, 5단계 온보딩 | 8.5 |
| 개발 | Chrome 114+, 권한 표와 본문 일치, UI 라벨(`현재 탭 요약하기`, `읽을 가치 있음`/`지금은 건너뛰기`) | 8.0 |
| 카피 | Short ≤132, Detailed 5블록, EN/KO/中文 정보 대등 | 8.5 |
| **종합** | (8.5 + 8.5 + 8.0 + 8.5) / 4 | **8.4** |

**Char count 검증** (수정 후 실행):

```bash
python3 -c "
import re
text=open('docs/STORE_LISTING.md').read()
for title, body in re.findall(r'### ([^\n]+)\n\n\`\`\`\n(.*?)\n\`\`\`', text, re.S):
    if 'chars)' in title or (title in ('한국어','简体中文') and len(body)<200):
        print('Short', title.split('(')[0].strip(), len(body))
    elif title.startswith('English') and len(body)>200:
        print('Detailed', 'English', len(body))
    elif title in ('한국어','简体中文') and len(body)>200:
        print('Detailed', title, len(body))
"
```

---

## Short description (≤132 chars)

### English (129 chars)

```
Too many tabs? AI suggests Read or Skip (3 lines enough?) + 3-line summary—side panel, your Gemini key, optional Auto, no server.
```

### 한국어 (81 chars)

```
탭이 너무 많나요? AI가 읽을지/넘길지(세 줄로 충분?) + 세 줄 요약. 사이드패널, Gemini 키 직접 사용, Auto 선택, 서버 없음.
```

### 简体中文 (64 chars)

```
标签太多？AI 建议「值得读/可跳过」（三行是否够用）+ 三行摘要。侧边栏、自带 Gemini 密钥、可选 Auto、无服务端。
```

---

## Detailed description

CWS: **기능**과 **설치 이유** 중심. Primary = English. Dashboard → Additional locale에 **한국어**, **简体中文** 붙여넣기.

### English (~1,585 chars)

```
WHY INSTALL WEB SUMMARY

Too many tabs, no idea what to read first? Web Summary triages the active tab in Chrome's side panel—no extra page, no lost place.

It asks what generic summarizers skip: "Is a three-line summary enough—or should I read more?" Close tabs faster; read where it matters.

FEATURES

• Read / Skip + reason — keep or move on (Read if three lines aren't enough; Skip if they are or value is low). Unsure → Read. Three-line summary always shown.

• Three-line summary — three sentences of core facts; scan tabs in seconds.

• Side panel + Alt+Shift+S — summarize beside the page (shortcut customizable). Pin once, triage tab by tab.

• On demand — Summarize this tab, or Auto ON (default OFF): ~3s dwell auto-summarizes. Extraction only then, not every load. Auto ON hides manual button. Exclude domains per site (Settings or side panel).

• Stop in progress — cancel from loading card.

• BYOK — your Google AI Studio Gemini key; you control cost and quota. Accept Google Gemini API terms; EEA/UK/CH: billing-enabled project recommended.

• EN / Korean / 中文 output — panel header switch; Welcome + Settings for setup.

• AI-generated triage — source tab URL shown; verify before sharing.

PRIVACY

• No backend — no collection of page text, URLs, or summaries.
• Local only — key, language, Auto toggle, excluded domains list in chrome.storage.local.
• Direct to Google — browser → Gemini with your key (manual or Auto).

REQUIREMENTS

• Chrome 114+
• Gemini API key (Google AI Studio)
• http(s) with readable article text

GET STARTED

1. Install → welcome setup guide
2. Pin "A · Web Summary" → side panel
3. Save API key in Settings
4. Article tab → Summarize this tab

Single purpose: Help you decide whether to read the current web page tab and summarize it using your Gemini API key.
```

### 한국어

```
Web Summary를 설치하는 이유

탭은 많은데 무엇부터 읽을지 모르겠다면, Web Summary가 도와줍니다. Chrome 사이드패널에서 현재 탭을 triage—새 페이지 없이, 흐름 끊기지 않게.

일반 「페이지 요약」과 달리 핵심 질문 하나: 「세 줄 요약으로 충분한가, 더 읽어야 하나?」 불필요한 탭은 빨리 닫고, 중요한 글에만 시간을 쓰세요.

기능

• 읽을지/넘길지 + 한 줄 이유 — Gemini가 탭 유지 또는 넘김 제안 (세 줄로 이해·결정·행동이 부족하면 읽을 가치 있음; 충분하거나 가치가 낮으면 지금은 건너뛰기). 애매하면 읽을 가치 있음. 세 줄 요약은 항상 표시—최종 판단은 사용자.

• 세 줄 요약 — 핵심을 정확히 세 문장; 밀린 탭을 몇 초 만에 훑기.

• Chrome 사이드패널 — 보던 페이지 옆에서 요약; Alt+Shift+S (chrome://extensions/shortcuts 에서 변경). 고정 후 탭마다 처리.

• 필요할 때만 — 「현재 탭 요약하기」 탭, 또는 Auto ON (기본 OFF): 탭에 ~3초 머물면 자동 요약. 그때만 본문 추출—모든 페이지 로드시 아님. Auto ON 시 수동 버튼 숨김. 사이트별 Auto 제외(설정·사이드패널).

• 요약 중지 — 로딩 카드에서 취소, 패널 유지.

• Gemini API 키 (BYOK) — Google AI Studio 키; 비용·quota 직접 관리. Gemini API 약관 동의·EEA/영국/스위스 billing 권장.

• English / 한국어 / 中文 출력 — 패널 상단 전환; Welcome·Settings 로 설정.

• AI 생성 triage — 출처 탭 URL 표시; 공유 전 직접 확인.

개인정보

• Web Summary 서버 없음 — 페이지 본문, URL, 요약을 수집·저장하지 않음.
• 로컬만 — API 키(저장 시), UI 언어, Auto 토글, Auto 제외 도메인 목록은 chrome.storage.local.
• Google 직접 연결 — 수동 또는 Auto 시 브라우저에서 Gemini API로 전송.

요구 사항

• Chrome 114+ (사이드패널 API)
• Google AI Studio Gemini API 키
• 읽을 수 있는 본문이 있는 http(s) 페이지

시작하기

1. 설치 → 환영 탭 설정 가이드
2. 「A · Web Summary」 고정 → 사이드패널 열기
3. Settings 에 Gemini API 키 저장
4. 기사 탭 → 「현재 탭 요약하기」

단일 목적: 현재 웹 페이지 탭을 읽을지 판단하고, 사용자 Gemini API 키로 요약하는 것을 돕습니다.
```

### 简体中文

```
为什么安装 Web Summary

标签太多、不知先读哪篇？Web Summary 在 Chrome 侧边栏处理当前标签——无需新页面，不打断浏览。

不同于普通「整页摘要」，只问一个问题：「三行摘要够不够，还是要继续读？」更快关掉无关标签，把时间留给值得读的内容。

功能

• 值得读 / 可跳过 + 一句理由 — Gemini 建议保留或跳过（三行不足以理解或行动则值得读；足够或价值低则可跳过）。不确定时默认值得读。三行摘要始终显示——由您决定。

• 三行摘要 — 三句话概括核心；几秒内扫完积压标签。

• Chrome 侧边栏 — 在页面旁摘要；Alt+Shift+S（可在 chrome://extensions/shortcuts 自定义）。固定扩展后逐个标签处理。

• 按需触发 — 点击「摘要当前标签」，或开启 Auto（默认 OFF）：标签停留约 3 秒后自动摘要。仅此时提取正文——非每次页面加载。Auto 开启时隐藏手动按钮。可按站点排除 Auto（设置或侧边栏）。

• 进行中可停止 — 在加载卡片取消，无需关闭侧边栏。

• 自带 Gemini API 密钥（BYOK） — Google AI Studio 密钥；费用与配额自行控制。须接受 Gemini API 条款；EEA/英国/瑞士建议启用 billing。

• 英文、韩文或简体中文输出 — 侧边栏顶部切换；欢迎页与设置引导安装。

• AI 生成浏览辅助 — 显示来源标签 URL；分享前请自行核实。

隐私

• 无 Web Summary 服务端 — 不收集、不记录、不保存页面正文、URL 或摘要。
• 仅本地 — API 密钥（若保存）、界面语言、Auto 开关、Auto 排除域名列表存于 chrome.storage.local。
• 直连 Google — 手动或 Auto 时，正文由浏览器用您的密钥发送至 Gemini API。

使用要求

• Chrome 114+（侧边栏 API）
• Google AI Studio 的 Gemini API 密钥
• 具有足够可读正文的 http(s) 页面

快速开始

1. 安装 → 欢迎页设置向导
2. 固定「A · Web Summary」→ 打开侧边栏
3. 在设置中保存 Gemini API 密钥
4. 打开文章页 → 「摘要当前标签」

单一用途：帮助用户判断是否阅读当前网页标签，并使用其 Gemini API 密钥进行摘要。
```

---

## manifest description (extension card)

| Locale | Text |
|--------|------|
| English | AI suggests Read or Skip (are 3 lines enough?). Side-panel summaries with your Gemini key—no server. |
| 한국어 | AI가 읽을지/넘길지(세 줄로 충분?) 제안. 사이드패널 요약, Gemini 키 직접 사용, 서버 없음. |
| 简体中文 | AI 建议值得读/可跳过（三行是否够用）。侧边栏摘要，自带 Gemini 密钥，无服务端。 |

---

## Single purpose (Privacy tab)

**English**

```
Help the user decide whether to read the current web page tab and summarize it using their Gemini API key.
```

**한국어**

```
현재 웹 페이지 탭을 읽을지 판단하고, 사용자의 Gemini API 키로 요약하도록 돕습니다.
```

**简体中文**

```
帮助用户判断是否阅读当前网页标签，并使用其 Gemini API 密钥进行摘要。
```

---

## Screenshot captions

| # | English | 한국어 | 简体中文 |
|---|---------|--------|----------|
| 1 | Read or Skip — are 3 lines enough? | 읽을지/넘길지 — 세 줄로 충분한가? | 值得读/可跳过 — 三行够不够？ |
| 2 | One-line reason — concrete, not vague | 한 줄 이유 — 구체적, 막연한 칭찬 아님 | 一句具体理由 |
| 3 | Three-line summary — scan in seconds | 세 줄 요약 — 몇 초 만에 훑기 | 三行快速浏览 |
| 4 | Auto — optional ~3s dwell (default OFF) | Auto — 선택, ~3초 후 (기본 OFF) | 可选 Auto，约 3 秒（默认 OFF） |
| 5 | Your key, no server — on demand only | 키 직접 사용, 서버 없음 — 필요할 때만 | 自带密钥，按需或 Auto 才摘要 |

---

## Permissions (why we ask)

| Permission | Purpose |
|------------|---------|
| `sidePanel` | Show the summarizer UI |
| `storage` | Save your API key, UI language, Auto toggle, and excluded domains locally |
| `activeTab` + `scripting` | Run extraction when you summarize (manual or Auto after dwell) |
| `http://*/*`, `https://*/*` | Host access to read the active http(s) tab from the side panel |
| `tabs` | Auto summarize on tab switch; open setup guide / Settings |
| `generativelanguage.googleapis.com` | Call Gemini with your key |

---

## Brand note

Store name **A · Web Summary** sorts first in the Extensions (A–Z) menu to help new users find the extension after install. In-product title remains **Web Summary**.

---

## CWS dashboard checklist

| Field | Value |
|-------|-------|
| Primary language | English |
| Description | Detailed description above (English) |
| Additional locale | **한국어**, **简体中文** — Dashboard에서 각 Short + Detailed 붙여넣기 |
| Category | Productivity |
| Privacy policy | GitHub Pages `legal.html` URL |

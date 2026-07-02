# Web Summary

**탭이 많을 때, 읽을지·넘길지를 빠르게 판단하는 Chrome 확장 (MV3)**

현재 탭 본문을 추출해 **Gemini API**로 **read/skip 판정 + 세 줄 요약**을 제공합니다.  
운영 서버 없이 **BYOK**(Bring Your Own Key) — 사용자 키로 브라우저에서 Google API를 직접 호출합니다.

---

## 왜 이 프로젝트인가

| 문제 | 접근 |
|------|------|
| 탭·기사가 많아 **무엇부터 읽을지** 모호함 | **read/skip** + **3줄 요약**으로 triage |
| 클라우드 요약 SaaS는 키·비용·프라이버시 부담 | API 키 **로컬 저장**, 본문은 **브라우저 → Google** |
| 긴 full summary는 느리고 토큰 소모가 큼 | **fullSummary 제거**, 짧은 structured JSON만 |
| 뉴스 외 페이지·잡음(저작권, 구독 CTA) | **semantic root + token diet**로 입력 정제 |

목표는 “전체 번역 요약기”가 아니라 **읽기 triage 도구**입니다.

---

## 현재 기능

### 사용자

- **사이드패널** — 확장 아이콘 또는 `Alt+Shift+S`
- **현재 탭 요약하기** — 수동 요약
- **Auto ON/OFF** — 탭 진입·전환 후 **3초 dwell** → 자동 요약 (기본 OFF, `chrome.storage.local`)
- **요약 중지** — 로딩 카드에서 진행 중 API 취소 (`AbortController`)
- **UI 언어** — English / Korean / Chinese (요약 출력 언어 연동)
- **Welcome** — 설치 시 온보딩, API 키 스크린샷 가이드
- **Settings** — Gemini API 키 저장, 「키를 찾는 데 도움이 필요하신가요?」→ welcome

### 요약 결과

- **read / skip** + 한 줄 이유 (`readReason`)
- **새 제목** + **세 줄 요약** (`briefLines`, 마크다운 볼드 숫자 지원)
- ~~fullSummary~~ — 제거됨 (토큰·지연·JSON 파싱 실패 완화)

---

## 아키텍처

```text
[활성 탭] content.js
    semanticRootPick + Readability → articleText
         ↓ chrome.tabs.sendMessage (EXTRACT_PAGE_DATA)
[사이드패널] App.tsx
    articleTokenDiet → summarizeArticle()
         ↓ fetch (매 요청 1 user turn, 세션 누적 없음)
[Gemini] gemini-2.5-flash-lite (+ 조건부 flash fallback)
         ↓ application/json + responseSchema
    parseStructuredSummary → SummaryResultView
```

| 레이어 | 주요 파일 | 역할 |
|--------|-----------|------|
| 추출 | `content.ts`, `semanticRootPick.ts`, `readabilityMarkupToPlain.ts` | DOM → 본문 평문 |
| 입력 다이어트 | `articleTokenDiet.ts` | locale별 잡음 제거·블록 선택, 최대 8k chars |
| API | `geminiClient.ts`, `summaryPrompt.ts` | Gemini REST, structured output |
| 파싱 | `summaryStructured.ts` | JSON → UI 모델 |
| UI | `App.tsx`, `SummaryResultView.tsx` | 패널·로딩·Auto·중지 |
| 설정 | `options.tsx`, `ApiKeyForm.tsx`, `uiLanguageStorage.ts` | 키·언어·Auto |
| SW | `background.ts` | 사이드패널 열기, install → welcome |

**세션 누적 없음:** 매 `generateContent` 호출은 `contents: [{ role: "user", … }]` **1턴만** 보냅니다. 이전 요약이 다음 프롬프트에 붙지 않습니다. 토큰 사용량은 **(요청당 입력+출력) × 호출 횟수**입니다.

---

## Gemini 파이프라인 (개발자)

```typescript
// geminiClient.ts
MAX_INPUT_CHARS = 8000       // diet 적용 후 상한
MAX_OUTPUT_TOKENS = 384        // 짧은 JSON (read/skip + 3 lines)
GEMINI_MODEL = "gemini-2.5-flash-lite"
GEMINI_MODEL_FALLBACK = "gemini-2.5-flash"   // E12·일부 E13만
SUMMARY_PARSE_MAX_ATTEMPTS = 3               // E10(JSON) 시 재호출
```

- **모델 fallback:** E11(키 거부)·E10(JSON)에는 flash로 넘기지 않음. rate limit(E12)과 일시 장애(E13)만 flash 시도.
- **Auto 요약:** `AUTO_SUMMARIZE_DWELL_MS = 3000`. `tabs.onActivated` / `onUpdated`로 스케줄. 같은 `tabUrl` + `summaryLanguage` 결과가 있으면 스킵.
- **Auto ON UI:** 요약 버튼 숨김·Auto 버튼 full width·색으로 ON/OFF 표시.

---

## 설계가 이렇게 된 과정

### 1. MVP

- MV3, 사이드패널, BYOK, read/skip + **fullSummary**
- Readability 추출, Gemini structured JSON

### 2. 제품화

- **3개국어 UI**, Welcome·Q&A, CWS 카피·legal (GitHub Pages)
- 패널 **LanguagePicker**, 로딩 단계·대기 힌트
- 프롬프트 **영문 system + lean user** (입력 토큰 절감)

### 3. 온보딩·UX

- Settings: API 키 받기 + welcome 가이드 링크
- Welcome 스크린샷 가이드·라이트박스

### 4. Auto summarize (`feature/auto-summarize`)

- Auto 토글 + 3초 dwell 자동 요약
- 로딩 카드 **요약 중지**

### 5. 속도·토큰 대응 (현재 WIP)

| 이슈 | 대응 |
|------|------|
| E10 truncated, 재시도로 수십 초 | **fullSummary 제거**, `MAX_OUTPUT` 384 |
| 입력 8k 그대로 전송 | **`articleTokenDiet`** |
| Readability가 nav/잡음 포함 | **`semanticRootPick`** |
| 4모델 무조건 폴백 | **lite → flash 조건부**만 |

---

## 프로젝트 구조

```text
src/              React 사이드패널, background, content script
public/           manifest, icons, welcome/legal
docs/             TESTING, PRIVACY, STORE_LISTING 등
dist/             yarn build 출력 — Chrome / CWS 제출용
```

---

## 실행

```bash
yarn install
yarn build          # → dist/
yarn verify         # tsc + vitest (9 files · 50 tests)
yarn dev            # Vite dev server (UI만; MV3 검증은 dist 로드)
```

Chrome → `chrome://extensions` → **`dist`** 폴더 로드

---

## API 키 설정

1. [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key**
2. 확장 **Settings** (`options.html`)에 붙여넣기 → Save
3. 사이드패널에서 **현재 탭 요약하기** (또는 Auto ON)

온보딩: 설치 시 `welcome.html` · 키 없을 때 사이드패널 **설정 가이드**

무료 tier quota는 **GCP 프로젝트·모델별**로 다릅니다. [AI Studio](https://aistudio.google.com/)에서 사용량을 확인하세요.

---

## Chrome Web Store

- 확장 zip: **`dist/`** 전체
- Privacy URL: `dist/legal.html` (GitHub Pages — `.github/workflows/deploy-pages.yml`)

---

## 테스트

- 순수 함수 위주: 파싱·프롬프트·token diet·semantic pick·에러
- Chrome API·Gemini HTTP·React 렌더링은 **미포함**
- Husky **pre-push** → `yarn verify`
- 상세: [`docs/TESTING.md`](docs/TESTING.md)

---

## 알려진 트레이드오프

1. **E10 재시도 3회** — JSON 파싱 실패 시 동일 프롬프트로 API를 다시 호출해 느려질 수 있음.
2. **Auto ON** — 탭 전환마다 API 1회 가능 → quota 소모에 주의.
3. **fullSummary 없음** — triage 특화; 깊은 읽기는 원문 탭.
4. **통합 테스트 없음** — `App.tsx`·실제 fetch는 수동/E2E 의존.

---

## 관련 문서

- [`docs/TESTING.md`](docs/TESTING.md)
- [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md)
- [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md)
- [`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md)

---

## License

Source © author, all rights reserved. Third-party notices: `yarn notices` · [`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md)

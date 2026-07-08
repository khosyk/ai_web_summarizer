# Testing

Web Summary의 자동 테스트는 **요약 파이프라인 핵심 로직**(파싱·프롬프트·에러·본문 추출·UI 언어)을 대상으로 합니다. Chrome API·Gemini HTTP 호출·React UI 렌더링은 포함하지 않습니다.

## 실행 방법

| 명령 | 용도 |
|------|------|
| `yarn test` | Vitest watch 모드 (개발 중) |
| `yarn test:run` | 1회 실행 (CI·푸시 전) |
| `yarn verify` | `tsc --noEmit` + `vitest run` |
| `yarn lint` | TypeScript 타입 검사만 |

설정 파일: `vitest.config.ts` (`src/**/*.test.ts`)

## 푸시·CI 게이트

- **로컬:** Husky `pre-push` → `yarn verify` 실패 시 `git push` 차단
- **원격:** [`.github/workflows/test.yml`](../.github/workflows/test.yml) — 모든 브랜치 push 및 `main` PR에서 `yarn verify` 실행

클론 후 `yarn install` 시 `prepare` 스크립트로 Husky가 자동 설정됩니다.

---

## 테스트 범위 요약

총 **10 파일 · 60 테스트** (2026-07 기준)

| 파일 | 대상 모듈 | 테스트 수 | 제품 기능 |
|------|-----------|-----------|-----------|
| `summaryStructured.test.ts` | `summaryStructured.ts` | 8 | Gemini JSON → read/skip·3줄 요약 |
| `summaryParse.test.ts` | `summaryParse.ts` | 10 | 표시 제목·레거시 TITLE 파싱 |
| `summaryPrompt.test.ts` | `summaryPrompt.ts` | 9 | Gemini 프롬프트·시스템 지시 |
| `userFacingError.test.ts` | `userFacingError.ts` | 6 | HTTP/에러 → 사용자 메시지 |
| `readabilityMarkupToPlain.test.ts` | `readabilityMarkupToPlain.ts` | 4 | Readability HTML → 평문 |
| `articleTokenDiet.test.ts` | `articleTokenDiet.ts` | 5 | 본문 잡음 제거·블록 선택 |
| `semanticRootPick.test.ts` | `semanticRootPick.ts` | 4 | article/main 등 semantic root |
| `autoSummarizeBlocklist.test.ts` | `autoSummarizeBlocklist.ts` | 10 | Auto 제외 도메인 정규화·매칭 |
| `detectServiceLang.test.ts` | `detectServiceLang.ts` | 3 | 브라우저 언어 → English/Korean/Chinese |
| `geminiClient.test.ts` | `geminiClient.ts` | 1 | primary/fallback 모델 상수 |

---

## 1. 구조화 요약 파싱 (`summaryStructured.test.ts`)

**함수:** `parseStructuredSummary(raw, scrapedTitle, langIsZh)`

Gemini structured output(JSON)을 UI에 표시할 `StructuredSummary`로 변환하는 **메인 파싱 경로**입니다.

| 테스트 | 검증 내용 |
|--------|-----------|
| valid JSON | `readRecommendation`, `readReason`, `title`, `briefLines`(3) 정상 매핑 |
| markdown fence | ` ```json … ``` ` 로 감싼 응답에서 JSON 추출 |
| skip | `readRecommendation: "skip"` 정규화 |
| unknown verdict | `"maybe"` 등 알 수 없는 값 → 기본값 `"read"` |
| empty title fallback | 모델 `title`이 비면 `scrapedTitle` 사용 |
| invalid JSON | `WebSummaryError` **E10** |
| briefLines ≠ 3 | **E10** (2줄 이하 등) |
| empty readReason | **E10** |

---

## 2. 제목·본문 파싱 (`summaryParse.test.ts`)

**함수:** `pickSummaryDisplayTitle`, `extractGeneratedTitleAndBody`

### `pickSummaryDisplayTitle(scrapedTitle, langIsZh)`

탭에서 긁은 제목을 UI 언어에 맞는 표시 제목으로 바꿉니다.

| 테스트 | 입력 | 기대 |
|--------|------|------|
| English + 빈 제목 | `''`, `langIsZh=false` | `Untitled summary` |
| Chinese + empty-like | `'untitled'`, `langIsZh=true` | `无标题摘要` |
| English + 한글 제목 | `'한국어 제목'`, `false` | `Untitled summary` (UI와 스크립트 불일치 시 fallback) |
| English + Latin | `'Export policy update'`, `false` | 원문 유지 |
| Chinese + 한글 제목 | `'한국어 제목'`, `true` | `无标题摘要` |

### `extractGeneratedTitleAndBody` (레거시 `TITLE:` 형식)

| 테스트 | 검증 내용 |
|--------|-----------|
| TITLE line | `TITLE: …` 첫 줄 파싱, 이후 줄을 본문으로 |
| no TITLE | scraped title + 전체 텍스트를 본문으로 |
| blank response (zh) | `无标题摘要` + 중국어 empty-body fallback |

---

## 3. Gemini 프롬프트 (`summaryPrompt.test.ts`)

**함수:** `langTag`, `buildLeanPrompt`, `buildSystemInstructionForLang`

| 테스트 | 검증 내용 |
|--------|-----------|
| `langTag` | `Chinese` → `zh`, `Korean` → `ko`, `English` → `en` |
| English prompt | `OUTPUT_LANG=en`, 제목·본문 포함 |
| Chinese prompt | `OUTPUT_LANG=zh` |
| system instruction | triage editor 역할, JSON 필드·출력 언어 지시 |

---

## 4. 사용자-facing 에러 (`userFacingError.test.ts`)

**함수:** `webSummaryErrorFromGeminiResponse`, `resolveUserFacingError`, `userMessageForCode`

| 테스트 | 입력 | 기대 코드/메시지 |
|--------|------|------------------|
| 401 | HTTP 401 | **E11** (API 키 거부) |
| 429 | HTTP 429 / `RESOURCE_EXHAUSTED` | **E12** (rate limit) |
| 503 | 기타 HTTP | **E13** (일시 불가) |
| WebSummaryError | `E02`, English | "Gemini API key" 문구 + `[E02]` log detail |
| unknown Error | `Error('boom')`, Chinese | **E99** 중국어 fallback |
| Chinese copy | `E03`, Chinese | `http(s)` 포함 중국어 문구 |

---

## 5. 본문 추출 평문화 (`readabilityMarkupToPlain.test.ts`)

**함수:** `collectPhrasingContent`, `readabilityMarkupRootToPlain`, `prepareReadabilityArticleInput`

Readability가 반환한 HTML을 Gemini에 보낼 **구조 보존 평문**으로 변환합니다. JSDOM으로 DOM을 흉내 냅니다.

| 테스트 | 검증 내용 |
|--------|-----------|
| inline markup | `<strong>` → `【…】`, `<em>` → `「…」` |
| block structure | `[H2]`, `<ul>` → `- item` 리스트 |
| structured preferred | 제목·강조가 있는 HTML → `[H1]`, `【12%】` 포함 평문 |
| sparse HTML fallback | 거의 빈 HTML → `textContent` 평문 사용 |

---

## 6. UI 언어 감지 (`detectServiceLang.test.ts`)

**함수:** `detectServiceLang()`

최초 실행 시 `navigator.language` → `English` / `Korean` / `Chinese`.

| 테스트 | `navigator.language` | 기대 |
|--------|----------------------|------|
| ko | `ko-KR` | `Korean` |
| zh | `zh-CN` | `Chinese` |
| en | `en-US` | `English` |

---

## 7. 본문 token diet (`articleTokenDiet.test.ts`)

**함수:** `applyTokenDiet(text, { maxChars, locale, … })`

Gemini 전송 전 locale별 잡음(저작권·구독 CTA·이메일 등) 제거와 블록 선택.

| 테스트 | 검증 내용 |
|--------|-----------|
| Korean boilerplate | 이메일·무단전재·▶ 링크 제거, `【12%】`·`[H2]` 유지 |
| byline | 짧은 기자 byline 제거, 본문 수치 유지 |
| maxChars | 긴 본문에서 lead·점수 블록 선택, `droppedBlocks` > 0 |
| short plain | 짧은 영문 본문 pass-through |
| English noise | Subscribe·All rights reserved 제거 |

---

## 8. Semantic root 선택 (`semanticRootPick.test.ts`)

**함수:** `pickBestSemanticRoot`, `collectSemanticRootCandidates`, `stripInRootNoise`

Readability 전에 `article` / `main` 등 semantic root를 고르고 root 내부 nav·related 제거.

| 테스트 | 검증 내용 |
|--------|-----------|
| article vs tiny main | 본문이 있는 `<article>` 우선 |
| null fallback | semantic root가 body 대비 너무 작으면 `null` |
| candidates | selector별 후보 수집·길이 검증 |
| stripInRootNoise | `<nav>`, `.related-articles` 제거, 본문 문단 유지 |

---

## 9. Auto 제외 도메인 (`autoSummarizeBlocklist.test.ts`)

**함수:** `normalizeBlockedHost`, `hostFromTabUrl`, `parseBlockedHostInput`, `isTabUrlAutoBlocked`, `isHostBlocked`

Settings·사이드패널에서 쓰는 hostname 블록리스트의 **순수 정규화·매칭** 로직입니다.

| 테스트 | 검증 내용 |
|--------|-----------|
| normalize | 소문자·`www.` 제거, 빈 문자열 |
| hostFromTabUrl | https URL → hostname, `chrome://` 거부 |
| parseBlockedHostInput | bare domain·URL path, invalid 거부 |
| isTabUrlAutoBlocked | `www.` 정규화 후 목록 매칭, 다른 host 미매칭 |
| isHostBlocked | `null` host → false |

`chrome.storage` CRUD는 **미테스트** (「의도적으로 테스트하지 않는 영역」 참고).

---

## 10. Gemini 클라이언트 설정 (`geminiClient.test.ts`)

**상수:** `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACK`

| 테스트 | 검증 내용 |
|--------|-----------|
| model config | primary `gemini-2.5-flash-lite`, fallback `gemini-2.5-flash`, 서로 다름 |

HTTP·`fetch`·E10/E12 재시도 루프는 mock 없이 **미테스트** (위 「의도적으로 테스트하지 않는 영역」 참고).

---

## 의도적으로 테스트하지 않는 영역

| 영역 | 이유 |
|------|------|
| `App.tsx`, `SummaryResultView.tsx` | Chrome·React 통합; E2E/수동 검증 |
| `geminiClient.ts` | HTTP·`fetch` mock 없음; 모델 상수만 단위 테스트 |
| `content.ts`, `background.ts` | `chrome.*` API 의존 |
| `apiKeyStorage.ts`, `uiLanguageStorage.ts`, `autoSummarizeBlocklist.ts` (storage CRUD) | `chrome.storage` 의존 |
| `yarn build` / `dist/` | 별도 빌드·확장 로드로 검증 |

---

## 테스트 추가 가이드

1. **순수 함수 우선** — side effect·Chrome API 없는 모듈부터
2. **파일 위치** — `src/<module>.test.ts` (구현 파일 옆)
3. **푸시 전** — `yarn verify` 로 lint + 전체 테스트 통과 확인
4. **네이밍** — `describe(함수명)` + `it('동작 설명')` (영문, 제품 행위 중심)

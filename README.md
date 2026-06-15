# Web Summary Extension

현재 탭의 본문을 추출해 Gemini로 요약하고, **읽을지·넘길지(read/skip)** 를 판단해 주는 Chrome Extension(MV3) 프로젝트입니다.

## 현재 구조

- 서버 없이 동작하는 확장 프로그램 구조입니다.
- 사이드 패널에서 실행되며, **Summarize** 클릭 시 활성 탭(`http/https`)에 `content.js`를 주입해 본문을 추출합니다.
- 추출된 본문은 Gemini API로 전송해 아래 형식으로 응답합니다.
  - **Read / Skip** — 이 탭을 더 읽을 가치가 있는지(`read`) 넘겨도 되는지(`skip`) + 한 줄 근거
  - **세 줄 요약** — 핵심만 빠르게 파악
  - **전체 요약** — 더 깊은 맥락이 필요할 때
  - **제목** — AI가 작성한 짧은 헤드라인

탭이 많을 때 **「읽을지 말지」** 를 먼저 결정하고, 필요하면 3줄·전문 요약으로 이어가는 흐름을 목표로 합니다.

## 실행 방법

1. 의존성 설치
   - `yarn install`
2. 빌드
   - `yarn build`
3. Chrome에서 로드
   - `chrome://extensions` → 개발자 모드 ON
   - `dist` 폴더를 "압축해제된 확장 프로그램을 로드합니다"로 추가

## API 키 설정

- API 키는 **Chrome 확장 Settings(`options.html`)** 에서 저장합니다. 사이드패널·Welcome의 Settings 버튼 → `chrome.runtime.openOptionsPage()`.

## 데이터·프라이버시 (제품 문구 기준)

- 운영자 서버 없음: 브라우징 본문, URL, 생성된 **요약 결과를 수집·저장하지 않음**
- 로컬 저장: 사용자가 Settings에 저장한 **Gemini API 키** + 사이드패널 **UI 언어 선택** (`chrome.storage.local`)
- 요약 시 본문은 사용자 브라우저에서 **Google Gemini API**로 직접 전송 (Google 정책 적용)
- UI 문구: `src/privacyNotice.ts` (Welcome 상세 / 사이드 패널 Legal 링크)

## 탭 본문 추출

- **Summarize** 클릭 시에만 `content.js`를 현재 http(s) 탭에 주입합니다 (`scripting` + `host_permissions: http(s)://*/*`). 모든 페이지에 상주하지 않습니다.
- 추출 실패(`Receiving end does not exist`)는 최대 3회 재시도 후 새로고침 안내.

## Chrome Web Store

- **한 번 빌드, 두 용도:** `yarn build` → `dist/`에 확장 프로그램 + 공개 페이지가 함께 생성됩니다.
  - **확장 로드:** `dist/` 전체를 Chrome에 로드 (설치 시 `dist/welcome.html` 자동 오픈)
  - **CWS Privacy URL:** `dist/legal.html` (+ `dist/third-party-notices.html`, `dist/assets/`, `dist/welcome/` 등)을 GitHub Pages 등 HTTPS에 배포
  - Welcome·Legal은 같은 `dist/` 루트에 있으므로 **별도 빌드/복사 불필요** — `public/legal.html`만 수정 후 `yarn build`
- Listing copy: `docs/STORE_LISTING.md`
- Icons: `public/icons/icon-{16,48,128}.png`

## 개발 참고

- `yarn dev`는 Vite 개발 서버(예: `localhost:5173`) 실행용이며, 확장 API 테스트 목적이 아닙니다.
- 실제 동작 검증은 `dist`를 Chrome 확장으로 로드한 상태에서 진행합니다.
- 단축키: `chrome://extensions/shortcuts`에서 `Alt+Shift+S` (기본) 커스터마이즈

## 최초 설치·온보딩

- **처음 설치** 시 `welcome.html` 안내 탭만 자동으로 열립니다. (사이드패널은 Chrome 정책상 자동 오픈 불가 — welcome Step 1 또는 툴바 아이콘 클릭)
- **Welcome (`welcome.html`):** 온보딩 가이드 + **프라이버시·Legal** (키 입력 없음)
- **Settings (`options.html`):** Gemini API 키 저장 — Chrome `options_ui` / 사이드패널 Settings
- **사이드패널:** 키 없으면 amber 배너 → Setup guide(welcome) / Settings(options)
- welcome Step 2–3 스크린샷: `public/welcome/*.png` (4개, README 참고)
- 업데이트(`onInstalled` `update`) 시 welcome 자동 오픈 없음

## License (source code)

**No license** — this repository’s source code is © the author. All rights reserved.  
Forking, copying, or redistributing the source without permission is not allowed unless you obtain separate consent.

Third-party open-source libraries used in the built extension are listed separately (see below).

## Third-party open source

- **Runtime notices:** `docs/THIRD_PARTY_NOTICES.md` (regenerate with `yarn notices`)
- **Public page (ships in `dist/`):** `third-party-notices.html` — linked from `legal.html`
- **Privacy / data:** Gemini and user data are documented in `public/legal.html`, not in the notices file

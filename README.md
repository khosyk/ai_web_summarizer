# Web Summary Extension

현재 탭의 본문을 추출해 Gemini로 요약하고, **읽을지·넘길지(read/skip)** 를 판단해 주는 Chrome Extension(MV3)입니다.

**BYOK (Bring Your Own Key):** 사용자가 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급한 Gemini API 키를 Settings에 저장합니다. 본문은 **브라우저에서 Google Gemini API로 직접** 전송되며, 운영자 백엔드 서버는 없습니다.

## 구조

```text
src/              React 사이드패널, background, content script
public/           manifest, icons, welcome/legal 정적 파일
vite.config.ts    yarn build 범위 (rollupOptions.input)
dist/             yarn build 출력 — Chrome / CWS 제출용
docs/             테스트·스토어 카피 등 문서
benchmark/        char-limit 벤치마크 메모 (로컬)
```

## 실행

```bash
yarn install
yarn build          # → dist/
```

Chrome → `chrome://extensions` → **`dist`** 폴더 로드

## API 키 설정

1. [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key** (새 프로젝트 생성 가능)
2. 확장 **Settings** (`options.html`)에 키 붙여넣기 → Save
3. 사이드패널에서 **Summarize this tab**

온보딩: 설치 시 `welcome.html` · 키 없을 때 사이드패널 Setup guide

무료 tier quota는 **GCP 프로젝트·모델별**로 다릅니다. AI Studio에서 사용량을 확인하세요.

## Chrome Web Store

- 확장 zip: **`dist/`** 전체
- Privacy URL: `dist/legal.html` (GitHub Pages — `.github/workflows/deploy-pages.yml`)

## 개발

- `yarn dev` — Vite dev server (UI만; MV3 전체 검증은 `dist` 로드)
- `yarn verify` — lint + test ([`docs/TESTING.md`](docs/TESTING.md))

## License

Source: © author, all rights reserved. Third-party: [`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md) · `yarn notices`

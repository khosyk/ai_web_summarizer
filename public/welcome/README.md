# Welcome guide screenshots

Vite `public/` 정적 에셋 — 빌드 시 `dist/welcome/`으로 그대로 복사됩니다.

| 파일 | 용도 |
|------|------|
| `guide-step-1-api-page.png` | Google AI Studio → Create API key |
| `guide-step-2-create-key.png` | 키 생성 확인 |
| `guide-step-3-copy-key.png` | 키 복사 |
| `guide-step-4-paste-settings.png` | Settings 붙여넣기·Save |

참조: `src/welcome.tsx` (`welcomeAsset()` → `chrome.runtime.getURL('welcome/…')`)

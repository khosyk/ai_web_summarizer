# Release & deployment

CWS zip 업로드·GitHub Pages(legal) 배포·CI 흐름. **OAuth 자격 증명 값은 문서·커밋·이슈에 넣지 않습니다.**

## CI workflows

| Workflow | 트리거 | 역할 |
|----------|--------|------|
| [`test.yml`](../.github/workflows/test.yml) | push(전 branch), PR→`main` | `yarn verify` |
| [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | `main` push, 수동 | `public/legal.html` 등 → GitHub Pages (Privacy URL) |
| [`publish-cws.yml`](../.github/workflows/publish-cws.yml) | `v*` tag push, 수동 | verify → build → zip → **CWS upload** (`action: upload`) |

```text
main push     → test + legal Pages
v1.0.1 tag    → CWS zip upload (draft)
Dashboard     → Submit / Publish (수동, upload 모드)
```

---

## 버전 규칙

| 소스 | 역할 |
|------|------|
| **`public/manifest.json` → `version`** | CWS·확장에 표시되는 **공식 버전** (`dist/manifest.json`으로 빌드) |
| `package.json` → `version` | npm 미배포; **manifest와 동일하게 유지** (관례) |
| Git tag `v*` | `publish-cws` 트리거; **`v` + manifest 버전** (예: manifest `1.0.1` → tag `v1.0.1`) |

`publish-cws.yml` 검증:

- `manifest.json` ↔ `package.json` 불일치 시 실패
- tag push 시 tag(접두 `v` 제거) ↔ manifest 불일치 시 실패
- **Run workflow** 수동 실행 시 tag 검증은 생략 (manifest ↔ package만)

---

## 릴리스 절차

1. `public/manifest.json` · `package.json` **version bump** (CWS에 없는 새 번호)
2. (의존성/license HTML 변경 시) `yarn notices` 후 `public/third-party-notices.html` 커밋
3. `main` merge / push
4. 태그 생성·push:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

   또는 Actions → **Publish to Chrome Web Store** → **Run workflow** (테스트용; tag 검증 없음)

5. Actions 성공 확인
6. [Chrome Web Store Developer Dashboard](https://chrome.webstore.dev/) → draft 확인 → **Submit / Publish** (현재 `action: upload` — **최종 제출은 수동**)

로컬 smoke: `yarn verify && yarn build` → `chrome://extensions`에서 `dist` 로드.

---

## 최초 1회: CWS API + GitHub Secrets

공식: [Use the Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)

1. Google Cloud: **Chrome Web Store API** Enable (**OAuth client와 같은 프로젝트** — 미활성 시 CI upload 403), OAuth **Web application** (Chrome Extension 타입 아님)
2. OAuth **External** + **Testing**, **Test users**에 CWS 소유 Gmail
3. Redirect URI: `https://developers.google.com/oauthplayground`
4. [OAuth Playground](https://developers.google.com/oauthplayground): scope `https://www.googleapis.com/auth/chromewebstore` → **refresh_token** 발급 (CWS 소유 계정으로 Authorize)
5. GitHub repo → **Settings → Secrets and variables → Actions → Repository secrets**

| Secret 이름 | 내용 (값은 GitHub에만 저장) |
|-------------|----------------------------|
| `CHROME_CLIENT_ID` | OAuth Web client ID |
| `CHROME_CLIENT_SECRET` | OAuth client secret |
| `CHROME_REFRESH_TOKEN` | Playground에서 발급한 refresh token |
| `CHROME_EXTENSION_ID` | CWS Item ID (32자) |

**Environment secrets**는 workflow에 `environment:`가 없으면 사용되지 않습니다. 위 4개는 **Repository secrets**에 등록.

---

## 보안

- **커밋·PR·스크린샷·채팅에** client secret, refresh token, 전체 OAuth JSON **붙여넣지 않음**
- OAuth 앱은 **Testing** 유지 (CI용 refresh token; Production 전환·Google 앱 검증은 불필요)
- Playground Authorize · CWS Dashboard · refresh token 발급은 **동일 Google 계정** (확장 소유자)
- Client secret은 Cloud Console에서 **생성 직후 1회만** 전체 표시 → 분실 시 **새 secret 발급** 후 GitHub Secret 갱신; 필요 시 refresh token 재발급
- refresh token **장기 미사용 시 만료** 가능 → 주기적 `v*` 릴리스 또는 토큰 재발급
- CWS **Extension ID**는 공개에 가깝지만 repo secret으로 두어 workflow만 참조
- `action: upload`만 사용: CI는 zip 업로드까지; **`action: publish`**로 바꾸면 심사 제출까지 자동 (운영 정책에 맞게 선택)

스토어 카피·Privacy URL·수동 zip: [`STORE_LISTING.md`](STORE_LISTING.md), [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).

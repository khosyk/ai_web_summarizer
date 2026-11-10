# 후원 안내와 운영

> **공개 문구 원본:** [`public/legal.html`](../public/legal.html) 10절. 값은 [`src/donation.ts`](../src/donation.ts)의 `SITE`에 모여 있습니다.

## 설정

| 값 | 비우면 |
| --- | --- |
| `kakaoQR` | 카카오페이 탭이 사라짐 |
| `kakaoLink` | QR만 남고 보내기 버튼이 사라짐 |
| `kakaoAmount` | `0`이면 금액 문구가 사라짐 |
| `paypal` | PayPal 탭이 사라짐 |

탭이 없으면 후원 버튼, 요약 대기 화면의 문구, 설치 가이드 알림도 사라집니다. **후원을 중단하려면 `kakaoQR`과 `paypal`을 비우고 새 버전을 배포합니다.** 이미 설치된 버전은 업데이트될 때까지 그대로이고, QR과 링크 자체는 송금 서비스에서 따로 막아야 합니다.

`kakaoQR`을 바꿀 때는 QR 부분만 잘라 이름과 사진이 없는지 보고, 해독한 값이 `kakaoLink`와 같은지 확인합니다.

## PayPal QR 라이브러리

Manifest V3는 원격 스크립트를 금지하므로 qrcodejs 1.0.0을 [`public/vendor/qrcode.min.js`](../public/vendor/qrcode.min.js)에 포함했습니다. cdnjs 파일과 같은 파일이며(SRI 동일), PayPal 탭을 열 때만 불러옵니다.

## 운영 기록

- 받은 내역(일시, 서비스, 금액)을 기록하고 보관합니다. 개인정보처리방침의 보유 기간은 5년입니다.
- 총액이 1천만 원에 이르기 전에 후원을 중단하거나 기부금품법 등록 여부를 확인합니다.
- 반환 요청은 송금일부터 30일 안에 받은 건을 확인 후 처리합니다.

## 공개

`main`에 푸시하면 저장소와 GitHub Pages에 바로 공개됩니다. 공개 전에 `PUBLISH_DATE_TBD`를 실제 공개일로 바꿉니다. 이 값이 남아 있으면 `deploy-pages`와 `publish-cws`가 실패합니다.

```bash
sed -i '' "s/PUBLISH_DATE_TBD/$(date +%F)/" public/legal.html docs/PRIVACY_POLICY.md
```

# Char-limit benchmark — 기록과 제품 결정

2026-06-18에 **입력 글자 상한(5200 / 8000 / 12000)** 을 비교하는 실험을 돌렸습니다.  
당시 확장에만 있던 **TEST 벤치마크 패널**(`BENCHMARK_MODE`, `CharLimitBenchmarkPanel` 등)은 제품화 후 **코드에서 제거**했습니다. 이 문서는 **실험 결과와, 그 결과로 확정한 현재 설정**만 남깁니다.

---

## 실험 방법

| 항목 | 값 |
|------|-----|
| 날짜 | 2026-06-18 |
| 모델 | `gemini-2.5-flash-lite` (전건 성공, 폴백 없음) |
| UI 언어 | English |
| 한도 | 5200 / 8000 / 12000 chars (추출 본문 기준) |
| URL 수 | **10** (BBC 6 + Wired 1 + Experimental History 1 + 추가 BBC 2) |
| API 호출 | **30** (URL당 3한도) |
| 출력 스키마 | 당시: read/skip + 3줄 + **fullSummary** |

원시 JSON은 로컬 export (`web-summary-benchmark-2026-06-18 (4).json`, `(9).json`) — **저장소에는 포함하지 않음**.

---

## 데이터 요약

| 구간 (추출 chars) | 실행 수 | 평균 total tokens | 평균 latency |
|-------------------|--------:|------------------:|-------------:|
| short (&lt;2k) | 9 | ~896 | ~3.1s |
| news (2k–8k) | 15 | ~2,082 | ~4.9s |
| longform (8k+) | 6 | ~2,592 | ~3.6s |

**30회 합계:** prompt ~25,895 + output ~6,809 ≈ **32,704 tokens**, 순차 실행 ~**54s** (6 URL 세션 기준).

### URL별 추출 길이 (대표)

| 출처 | originalChars | 비고 |
|------|--------------:|------|
| BBC (미국 경제) | 5,927 | 일반 뉴스 |
| BBC (인플레) | 5,528 | 일반 뉴스 |
| BBC (짧은 기사) | 1,699 | |
| BBC (비디오) | 447 | 메타 위주 |
| Wired | 23,822 | 장문 |
| Experimental History | 20,692 | 장문 |

---

## 관찰

### 1. 일반 뉴스(~8k 미만)가 대부분

Readability 추출 BBC 기사 대부분이 **8,000자 미만**. 이 구간에서 **8000·12000 한도는 동일한 본문**을 모델에 전달 (8/8건 입력 동일).

### 2. 5200은 뉴스 tail 손실

원문 5k~7k 기사에서 5200은 **앞부분만 전송** (`wasTruncated: true`). 후반 수치·인용이 요약에서 빠질 수 있음.  
원문 자체가 5200 이하인 페이지는 세 한도 모두 동일.

### 3. 8000 vs 12000 — 뉴스에서는 차이 거의 없음

입력이 같으면 fullSummary 길이·내용 차이는 **모델 랜덤성 수준**. 12000이 항상 더 나은 것은 아님.

### 4. 12000은 장문(2만+ chars)에서만 체감

| 기사 | 8000 sent | 12000 sent | fullSummary 길이 (8000→12000) |
|------|----------:|-----------:|------------------------------:|
| Wired (23,822) | 8,000 | 12,000 | 1,338 → 2,229 (+67%) |
| Experimental History (20,692) | 8,000 | 12,000 | 1,466 → 1,738 (+19%) |

장문에서 12000이 더 많은 앞부분을 읽지만, **원문 전체의 절반 정도**만 전달. 후반은 여전히 잘림.

### 5. read/skip은 이번 샘플로 미검증

30건 모두 `readRecommendation: read`. skip이 나와야 할 페이지는 범위에 없음.

---

## 제품 결정 → 현재 코드

벤치마크·운영 이슈(E10 truncated, 토큰·지연)를 종합해 아래처럼 **triage 전용**으로 확정했습니다.

| 결정 | 근거 | 현재 설정 |
|------|------|-----------|
| **입력 상한 8000 유지** | 뉴스 대부분 전문 전송; 5200은 tail 손실; 12000은 뉴스에서 실익 없고 장문만 +40% 토큰 | `MAX_INPUT_CHARS = 8000` |
| **fullSummary 제거** | 출력 JSON·토큰·E10 재시도 비용 큼; triage 목적에는 3줄로 충분 | `summaryStructured` — briefLines만 |
| **출력 토큰 축소** | 짧은 structured JSON | `MAX_OUTPUT_TOKENS = 384` |
| **입력 정제** | 잡음·저작권·CTA 제거, 블록 선택 | `articleTokenDiet.ts` |
| **추출 개선** | nav/related 제거, semantic root | `semanticRootPick.ts` |
| **모델** | lite 단일 + 조건부 flash | `gemini-2.5-flash-lite` → E12·일부 E13만 flash |
| **벤치마크 UI** | CWS·일반 사용자 혼선 | 코드 삭제, **이 문서만 유지** |

---

## 이후 기능 (벤치마크 범위 밖)

아래는 char-limit 실험 이후 별도로 추가·확정된 동작입니다.

- **Auto summarize** — 탭 dwell 3초 후 자동 요약 (기본 OFF)
- **요약 중지** — `AbortController`
- **UI 3개국어** — English / Korean / 中文
- **한국어 온보딩** — welcome 가이드, Settings 키 도움 링크

---

## 관련 문서

- [`README.md`](../README.md) — 아키텍처·파이프라인 상수
- [`docs/TESTING.md`](./TESTING.md) — `articleTokenDiet`·`semanticRootPick` 단위 테스트

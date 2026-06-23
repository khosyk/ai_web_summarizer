import type { ServiceLang } from './privacyNotice';

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

const UNTITLED: Record<ServiceLang, string> = {
  English: 'Untitled summary',
  Korean: '제목 없음',
  Chinese: '无标题摘要',
};

/** 표시 제목 후보: 빈값·외국어 원문은 출력 언어에 맞는 기본 라벨 */
export function pickSummaryDisplayTitle(
  scrapedTitle: string,
  outputLanguage: ServiceLang,
): string {
  const f = normalizeWhitespace(scrapedTitle).slice(0, 200);
  const emptyLike =
    !f ||
    f === '제목 없음' ||
    /^untitled$/i.test(f) ||
    /^无标题|^没有标题|^无主题$/u.test(f);

  if (emptyLike) {
    return UNTITLED[outputLanguage];
  }

  const hasHangul = /[\uac00-\ud7af]/.test(f);
  const hasCjk = /[\u4e00-\u9fff]/.test(f);
  const hasKana = /[\u3040-\u30ff]/.test(f);

  if (outputLanguage === 'Chinese') {
    if (hasHangul || hasKana) return UNTITLED.Chinese;
    return f;
  }

  if (outputLanguage === 'Korean') {
    if (hasKana) return UNTITLED.Korean;
    return f;
  }

  if (hasHangul || hasCjk || hasKana) {
    return UNTITLED.English;
  }

  return f;
}

const EMPTY_BODY: Record<ServiceLang, string> = {
  English: '(No summary body was returned—please retry.)',
  Korean: '(요약 본문이 반환되지 않았습니다. 다시 시도해 주세요.)',
  Chinese: '（未返回概要正文，请重试。）',
};

/** 첫 줄 `TITLE: …` 파싱 후 본문만 반환 */
export function extractGeneratedTitleAndBody(
  raw: string,
  scrapedTitle: string,
  outputLanguage: ServiceLang,
): { displayTitle: string; summaryBody: string } {
  const t = raw.trim();
  const lineList = t.split(/\n/);

  let idx = 0;
  while (idx < lineList.length && lineList[idx].trim() === '') {
    idx++;
  }

  const firstLineMatch = lineList[idx]?.trim().match(/^TITLE:\s*(.*)$/i);
  const emptyBodyFallback = EMPTY_BODY[outputLanguage];

  if (!t) {
    return {
      displayTitle: pickSummaryDisplayTitle(scrapedTitle, outputLanguage),
      summaryBody: emptyBodyFallback,
    };
  }

  if (!firstLineMatch) {
    const fallbackBody = t || emptyBodyFallback;
    return {
      displayTitle: pickSummaryDisplayTitle(scrapedTitle, outputLanguage),
      summaryBody: fallbackBody,
    };
  }

  let headline = firstLineMatch[1].trim().slice(0, 240);
  if (!headline) {
    headline = pickSummaryDisplayTitle('', outputLanguage);
  }

  let restLines = lineList.slice(idx + 1);
  while (restLines.length > 0 && restLines[0].trim() === '') {
    restLines = restLines.slice(1);
  }

  let summaryBody = restLines.join('\n').trim();
  if (!summaryBody) {
    summaryBody = emptyBodyFallback;
  }

  return { displayTitle: headline, summaryBody };
}

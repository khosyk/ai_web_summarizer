function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** 표시 제목 후보: 빈값·외국어 원문은 LANG에 맞는 기본 라벨 */
export function pickSummaryDisplayTitle(
  scrapedTitle: string,
  langIsZh: boolean,
): string {
  const f = normalizeWhitespace(scrapedTitle).slice(0, 200);
  const emptyLike =
    !f ||
    f === '제목 없음' ||
    /^untitled$/i.test(f) ||
    /^无标题|^没有标题|^无主题$/u.test(f);

  if (emptyLike) {
    return langIsZh ? '无标题摘要' : 'Untitled summary';
  }

  const hasHangul = /[\uac00-\ud7af]/.test(f);
  const hasCjk = /[\u4e00-\u9fff]/.test(f);
  const hasKana = /[\u3040-\u30ff]/.test(f);

  if (langIsZh) {
    if (hasHangul || hasKana) return '无标题摘要';
    return f;
  }

  if (hasHangul || hasCjk || hasKana) {
    return 'Untitled summary';
  }

  return f;
}

/** 첫 줄 `TITLE: …` 파싱 후 본문만 반환 */
export function extractGeneratedTitleAndBody(
  raw: string,
  scrapedTitle: string,
  langIsZh: boolean,
): { displayTitle: string; summaryBody: string } {
  const t = raw.trim();
  const lineList = t.split(/\n/);

  let idx = 0;
  while (idx < lineList.length && lineList[idx].trim() === '') {
    idx++;
  }

  const firstLineMatch = lineList[idx]?.trim().match(/^TITLE:\s*(.*)$/i);
  const emptyBodyFallback = langIsZh
    ? '（未返回概要正文，请重试。）'
    : '(No summary body was returned—please retry.)';

  if (!t) {
    return {
      displayTitle: pickSummaryDisplayTitle(scrapedTitle, langIsZh),
      summaryBody: emptyBodyFallback,
    };
  }

  if (!firstLineMatch) {
    const fallbackBody = t || emptyBodyFallback;
    return {
      displayTitle: pickSummaryDisplayTitle(scrapedTitle, langIsZh),
      summaryBody: fallbackBody,
    };
  }

  let headline = firstLineMatch[1].trim().slice(0, 240);
  if (!headline) {
    headline = pickSummaryDisplayTitle('', langIsZh);
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

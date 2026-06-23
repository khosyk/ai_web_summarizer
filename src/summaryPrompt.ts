/** UI 언어 → 프롬프트 LANG 태그 */
export function langTag(language: string): string {
  if (language === 'Chinese') return 'zh';
  if (language === 'Korean') return 'ko';
  return 'en';
}

/** Gemini 시스템 지시 — 스키마·언어·read/skip 규칙 (user 프롬프트와 중복 없음) */
export function buildSystemInstructionForLang(L: string): string {
  const schema =
    'JSON only: readRecommendation (read|skip), readReason, title, briefLines[3], fullSummary. New title. Bold **numbers**.';

  if (L === 'zh') {
    return `${schema} 全部简体中文。read=三行不够需读原文; skip=三行足够可关标签。briefLines 恰好 3 句。`;
  }
  if (L === 'ko') {
    return `${schema} 전체 한국어. read=세 줄 부족·본문 필요; skip=세 줄로 충분·탭 닫기 가능. briefLines 정확히 3문장.`;
  }
  return `${schema} All English. Translate source if needed. read=need article; skip=3 lines enough. briefLines exactly 3.`;
}

/** 기사 본문만 전달 — 지시는 systemInstruction + responseSchema에 위임 */
export function buildLeanPrompt(params: {
  language: string;
  title: string;
  content: string;
}): string {
  const L = langTag(params.language);
  const title = params.title.trim().slice(0, 120);

  return `LANG=${L}\nT: ${title}\n---\n${params.content}\n---`;
}

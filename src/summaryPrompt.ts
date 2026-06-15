/** UI 언어 → 프롬프트 LANG 태그 */
export function langTag(language: string): string {
  if (language === 'Chinese') return 'zh';
  return 'en';
}

function outputLanguageClamp(L: string): string {
  switch (L) {
    case 'en':
      return 'OUTPUT_FIXED=en: Translate into English. title: short headline (do NOT copy Korean/CJK scraped title). briefLines: exactly 3 English sentences. fullSummary: English paragraphs only.';
    case 'zh':
      return 'OUTPUT_FIXED=zh-CN: 全部简体中文。title 为短标题。briefLines 恰好 3 句。fullSummary 为连贯段落。';
    default:
      return `OUTPUT_FIXED=${L}: Override source-script language entirely.`;
  }
}

function buildReadDecisionGuide(L: string): string {
  if (L === 'zh') {
    return `readRecommendation（"read" 或 "skip"）与 readReason（一句中文）：
- read：三行摘要不够，需读原文或全文摘要才能理解、决策或行动。
- skip：三行摘要已足够，或信息重复/价值低，可关闭标签。
- 不确定时选 read。readReason 只写一句依据，勿用空泛评价。`;
  }

  return `readRecommendation ("read" or "skip") and readReason (one sentence):
- read: Three lines are not enough; the user should read the article or full summary to decide or act.
- skip: Three lines are enough, or the page adds little new value—safe to close the tab.
- If unsure, choose read. readReason must be one concrete sentence, not vague praise.`;
}

/** JSON 필드별 출력 가이드 */
export function buildSummaryFormatGuide(L: string): string {
  const numberRule =
    L === 'zh'
      ? '关键数字用 **加粗**。'
      : 'Bold key **numbers** with Markdown.';

  if (L === 'zh') {
    return `返回 JSON（仅此对象，无 markdown 代码块）：
{
  "readRecommendation": "read",
  "readReason": "<一句中文>",
  "title": "<一行中文标题>",
  "briefLines": ["<第1句>", "<第2句>", "<第3句>"],
  "fullSummary": "<一段或数段连贯正文>"
}

${buildReadDecisionGuide(L)}

规则：briefLines 必须恰好 3 个字符串；${numberRule} fullSummary 覆盖主要事实；${numberRule}`;
  }

  return `Return JSON only (this object, no markdown fences):
{
  "readRecommendation": "read",
  "readReason": "<one sentence>",
  "title": "<short English headline>",
  "briefLines": ["<sentence 1>", "<sentence 2>", "<sentence 3>"],
  "fullSummary": "<one or more cohesive paragraphs>"
}

${buildReadDecisionGuide(L)}

Rules: briefLines must be exactly 3 strings, one complete sentence each; ${numberRule} fullSummary covers main facts; ${numberRule}`;
}

/** 기사 요약 사용자 프롬프트 */
export function buildLeanPrompt(params: {
  language: string;
  title: string;
  content: string;
}): string {
  const { language, title, content } = params;
  const L = langTag(language);

  return `LANG=${L}
Summarize the article below as JSON.

T: ${title}
---
${content}
---
${outputLanguageClamp(L)}

${buildSummaryFormatGuide(L)}

Rules: User has many tabs open—optimize readRecommendation for whether to keep reading this tab. No filler. No extra keys. Do not invent facts. briefLines length must be 3.`;
}

/** Gemini 시스템 지시 */
export function buildSystemInstructionForLang(L: string): string {
  const layout =
    'Respond with JSON only matching the schema: readRecommendation ("read"|"skip"), readReason (string), title (string), briefLines (array of exactly 3 strings), fullSummary (string). Do NOT echo the scraped title verbatim—write a new title.';
  if (L === 'zh') {
    return `${layout} All text in simplified Chinese (简体中文). Translate source if needed.`;
  }
  return `${layout} All text in English. Translate Korean or any source into English.`;
}

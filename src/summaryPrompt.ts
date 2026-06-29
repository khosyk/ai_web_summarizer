/** UI 언어 → 출력 언어 코드 */
export function langTag(language: string): string {
	if (language === "Chinese") return "zh";
	if (language === "Korean") return "ko";
	return "en";
}

const OUTPUT_LANG_LABEL: Record<string, string> = {
	en: "English",
	ko: "Korean",
	zh: "Simplified Chinese",
};

function outputLanguageClause(L: string): string {
	const label = OUTPUT_LANG_LABEL[L] ?? OUTPUT_LANG_LABEL.en;
	return `Write every JSON text field in ${label}. Translate the source article if needed.`;
}

/** Gemini 시스템 지시 — 영문 고정, 출력 언어만 L에 따라 지정 */
export function buildSystemInstructionForLang(L: string): string {
	const schema =
		"Return JSON only: readRecommendation (read|skip), readReason, title, briefLines (exactly 3 strings), fullSummary. Write a new title; do not echo the scraped title. Bold key **numbers** with Markdown in briefLines and fullSummary.";

	const readSkip =
		"read: three lines are not enough; the user should read the article or full summary. skip: three lines are enough to decide; safe to close the tab. If unsure, choose read. readReason must be one concrete sentence.";

	return `${schema} ${readSkip} ${outputLanguageClause(L)}`;
}

/** 기사 본문 user 프롬프트 — 라벨은 영문, OUTPUT_LANG으로 출력 언어 지정 */
export function buildLeanPrompt(params: {
	language: string;
	title: string;
	content: string;
}): string {
	const L = langTag(params.language);
	const title = params.title.trim().slice(0, 120);

	return `OUTPUT_LANG=${L}\nTITLE: ${title}\n---\n${params.content}\n---`;
}

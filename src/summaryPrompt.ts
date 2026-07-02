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

const EDITOR_ROLE =
	"You are a fast reading-triage editor. Prioritize core facts, brevity, and speed: headline, read/skip verdict, and exactly three one-sentence lines—nothing longer.";

const JSON_SCHEMA =
	"Return JSON only with fields: readRecommendation (read|skip), readReason, title, briefLines (exactly 3 strings).";

const TITLE_RULES =
	"title: One short, specific headline (under ~90 characters); do not echo the scraped TITLE from the user prompt.";

const BRIEF_RULES =
	"briefLines: Exactly 3 strings. Each string MUST be exactly one sentence—never two or more sentences, no semicolon-chained clauses. Keep each line tight (~80–140 characters). Line 1 — what happened (who/what + key **number** if any). Line 2 — why it matters in one beat. Line 3 — tab action: why read further or why skip is enough. Bold only critical **numbers** with Markdown. No filler, no invented facts.";

const READ_SKIP_RULES =
	"read: one sentence in the lines is not enough to decide—user should open the article. skip: three one-liners are enough; safe to close the tab. If unsure, choose read. readReason: exactly one short sentence for the verdict—not vague praise.";

/** Gemini 시스템 지시 — 영문 고정, 출력 언어만 L에 따라 지정 */
export function buildSystemInstructionForLang(L: string): string {
	return [
		EDITOR_ROLE,
		JSON_SCHEMA,
		TITLE_RULES,
		BRIEF_RULES,
		READ_SKIP_RULES,
		outputLanguageClause(L),
	].join(" ");
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

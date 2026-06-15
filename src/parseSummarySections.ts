export type SummarySectionId = "brief" | "full";

export type ParsedSummarySection = {
	id: SummarySectionId;
	heading: string;
	body: string;
	isList: boolean;
};

/** `1.` / `2.` 번호 섹션 (신규 기본 형식) */
function parseByNumberedSections(text: string): ParsedSummarySection[] | null {
	const lines = text.split("\n");
	let idx1 = -1;
	let idx2 = -1;

	for (let i = 0; i < lines.length; i++) {
		const t = lines[i].trim();
		if (/^1\.\s/.test(t) && idx1 === -1) idx1 = i;
		else if (/^2\.\s/.test(t) && idx2 === -1) idx2 = i;
	}

	if (idx1 === -1 || idx2 === -1 || idx2 <= idx1) return null;

	const stripLabel = (line: string) =>
		line
			.replace(/^1\.\s*/, "")
			.replace(/^2\.\s*/, "")
			.trim();

	const briefHeading = stripLabel(lines[idx1]) || "1";
	const fullHeading = stripLabel(lines[idx2]) || "2";
	const briefBody = lines.slice(idx1 + 1, idx2).join("\n").trim();
	const fullBody = lines.slice(idx2 + 1).join("\n").trim();

	if (!briefBody && !fullBody) return null;

	return [
		{
			id: "brief",
			heading: briefHeading,
			body: briefBody,
			isList: false,
		},
		{
			id: "full",
			heading: fullHeading,
			body: fullBody,
			isList: false,
		},
	];
}

/** 구형 `##` 네 섹션 → 앞둘 brief, 뒤둘 full 로 병합 */
function parseLegacyMarkdownHeadings(text: string): ParsedSummarySection[] | null {
	if (!/^##\s+/m.test(text)) return null;

	const chunks = text.split(/^##\s+/m).filter((c) => c.trim());
	if (chunks.length === 0) return null;

	const bodies = chunks.map((chunk) => {
		const nl = chunk.indexOf("\n");
		const body = (nl >= 0 ? chunk.slice(nl + 1) : "").trim();
		return body;
	});

	const brief = bodies.slice(0, 2).filter(Boolean).join("\n\n").trim();
	const full = bodies.slice(2).filter(Boolean).join("\n\n").trim();

	if (!brief && !full) return null;

	return [
		{ id: "brief", heading: "1", body: brief || full, isList: false },
		{ id: "full", heading: "2", body: full || brief, isList: false },
	];
}

/** 번호 없을 때 앞 3줄 = brief, 나머지 = full */
function fallbackBriefAndFull(text: string): ParsedSummarySection[] {
	const t = text.trim();
	if (!t) return [];

	const lines = t.split("\n");
	const nonEmpty = lines.filter((l) => l.trim().length > 0);

	if (nonEmpty.length >= 4) {
		return [
			{
				id: "brief",
				heading: "1",
				body: nonEmpty.slice(0, 3).join("\n"),
				isList: false,
			},
			{
				id: "full",
				heading: "2",
				body: nonEmpty.slice(3).join("\n"),
				isList: false,
			},
		];
	}

	return [
		{
			id: "full",
			heading: "2",
			body: t,
			isList: false,
		},
	];
}

/** 요약 본문 → 1. 세줄 요약 + 2. 전체 요약 */
export function parseSummarySections(summary: string): ParsedSummarySection[] {
	const t = summary.trim();
	if (!t) return [];

	const numbered = parseByNumberedSections(t);
	if (numbered && numbered.length > 0) return numbered;

	const legacy = parseLegacyMarkdownHeadings(t);
	if (legacy && legacy.length > 0) return legacy;

	return fallbackBriefAndFull(t);
}

/** 세 줄 요약 본문 → 줄 배열 (최대 3) */
export function briefSummaryLines(body: string): string[] {
	return body
		.split("\n")
		.map((l) => l.replace(/^[-*•]\s*/, "").trim())
		.filter((l) => l.length > 0)
		.slice(0, 3);
}

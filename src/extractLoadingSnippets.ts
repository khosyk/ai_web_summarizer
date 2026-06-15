/** 로딩 화면용: 추출 본문에서 짧은 제목·문장·강조만 골라냄 */

function normalizeSnippet(raw: string): string {
	return raw.replace(/\s+/g, " ").trim();
}

function pushUnique(seen: Set<string>, out: string[], raw: string): void {
	const s = normalizeSnippet(raw);
	if (s.length < 4 || s.length > 110) return;
	const key = s.slice(0, 72);
	if (seen.has(key)) return;
	seen.add(key);
	out.push(s);
}

/** Readability 평문·loose 본문에서 로딩 타이핑용 스니펫 목록 */
export function extractLoadingSnippets(
	articleText: string,
	title?: string,
): string[] {
	const seen = new Set<string>();
	const out: string[] = [];

	if (title?.trim()) {
		pushUnique(seen, out, title.trim());
	}

	for (const m of articleText.matchAll(/\[H[1-6]\]\s*(.+)/g)) {
		pushUnique(
			seen,
			out,
			m[1].replace(/[【】「」`]/g, "").trim(),
		);
	}

	for (const m of articleText.matchAll(/【([^】]{2,72})】/g)) {
		pushUnique(seen, out, m[1]);
	}

	for (const m of articleText.matchAll(/^-\s+(.+)$/gm)) {
		pushUnique(seen, out, m[1]);
	}

	const blocks = articleText.split(/\n+/);
	for (const block of blocks) {
		let line = block.trim();
		if (!line || line.startsWith("[PRE]") || line === "——") continue;
		line = line.replace(/^\[H[1-6]\]\s*/, "").trim();
		if (!line) continue;

		const parts = line.split(/(?<=[.!?。！？])\s+|\n/);
		for (const part of parts) {
			const sent = normalizeSnippet(part);
			if (sent.length < 12) continue;
			if (/\d/.test(sent) || /[%％]/.test(sent)) {
				pushUnique(seen, out, sent);
			} else if (sent.length >= 18 && sent.length <= 95) {
				pushUnique(seen, out, sent);
			}
		}
	}

	return out.slice(0, 16);
}

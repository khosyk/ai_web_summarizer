/** SEO 시맨틱 루트 후보 수집·점수 — content.ts Readability 입력 narrowing */

export const SEMANTIC_ROOT_SELECTOR_LIST = [
	"main",
	'article[role="main"]',
	"article",
	'[role="main"]',
	"#main-content",
	"#article-body",
	"#content",
	".article-body",
	".post-content",
	".entry-content",
] as const;

/** main/article 내부에서 제거할 보조 landmark·관련글·댓글 등 */
export const IN_ROOT_NOISE_SELECTORS = [
	"nav",
	"aside",
	"footer",
	'[role="navigation"]',
	'[role="complementary"]',
	'[role="banner"]',
	".breadcrumb",
	".breadcrumbs",
	".related",
	".related-articles",
	".related-posts",
	".comments",
	".comment-list",
	"#comments",
	".social-share",
	".share-buttons",
	".advertisement",
	".ad-container",
	'[class*="related-"]',
	'[class*="comment-"]',
	'[id*="comment"]',
].join(", ");

export function normalizedTextLength(el: Element | null | undefined): number {
	if (!el) return 0;
	return (el.textContent ?? "").replace(/\s+/g, " ").trim().length;
}

/** 작은 main만 잡히면 전체 document fallback */
export function passesNarrowGate(textLen: number, bodyLen: number): boolean {
	return textLen >= 200 && textLen >= Math.min(500, bodyLen * 0.22);
}

export function scoreSemanticRootCandidate(el: Element): number {
	let score = 0;
	const tag = el.tagName.toLowerCase();

	if (tag === "main") score += 30;
	if (tag === "article") score += 25;
	if (el.getAttribute("role") === "main") score += 20;

	const textLen = normalizedTextLength(el);
	const pCount = el.querySelectorAll("p").length;
	const linkCount = el.querySelectorAll("a").length;
	const linkDensity = linkCount / Math.max(pCount, 1);

	score += Math.min(textLen / 100, 40);
	score += Math.min(pCount * 3, 15);
	if (linkDensity > 3) score -= 12;

	const hint = `${el.id} ${el.className}`.toLowerCase();
	if (hint.includes("article") || hint.includes("content") || hint.includes("post")) {
		score += 8;
	}

	return score;
}

export function collectSemanticRootCandidates(doc: Document): Element[] {
	const seen = new Set<Element>();
	const candidates: Element[] = [];

	for (const selector of SEMANTIC_ROOT_SELECTOR_LIST) {
		for (const el of doc.querySelectorAll(selector)) {
			if (seen.has(el)) continue;
			seen.add(el);
			candidates.push(el);
		}
	}

	return candidates;
}

/** 점수·narrow gate 통과 후보 중 최적 SEO root */
export function pickBestSemanticRoot(doc: Document): Element | null {
	const bodyLen = normalizedTextLength(doc.body);
	const ranked = collectSemanticRootCandidates(doc)
		.map((el) => ({ el, score: scoreSemanticRootCandidate(el) }))
		.sort((a, b) => b.score - a.score || normalizedTextLength(b.el) - normalizedTextLength(a.el));

	for (const { el } of ranked) {
		if (passesNarrowGate(normalizedTextLength(el), bodyLen)) {
			return el;
		}
	}

	return null;
}

/** root clone 내부 nav/aside/related 등 제거 */
export function stripInRootNoise(root: Element): void {
	root.querySelectorAll(IN_ROOT_NOISE_SELECTORS).forEach((node) => node.remove());
}

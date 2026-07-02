import { langTag } from "./summaryPrompt";
import type { ServiceLang } from "./privacyNotice";

export type ArticleLocale = "ko" | "en" | "zh";

export type TokenDietOptions = {
	maxChars: number;
	locale: ArticleLocale;
	keepLeadBlocks?: number;
};

export type TokenDietStats = {
	originalChars: number;
	afterStrip: number;
	afterFilter: number;
	afterSelect: number;
	droppedLines: number;
	droppedBlocks: number;
};

const HEADING_LINE_RE = /^\[H[1-6]\]\s*/;

const COMMON_NOISE_PATTERNS: RegExp[] = [
	/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
	/▶.*/g,
	/\[ⓒ.*/g,
	/Copyrights?.*/gi,
	/All rights reserved.*/gi,
];

const LOCALE_NOISE_PATTERNS: Record<ArticleLocale, RegExp[]> = {
	ko: [
		/무단\s*전재.*/g,
		/재배포\s*금지.*/g,
		/구독\s*신청.*/g,
		/네이버\s*메인에서.*/g,
		/제보하기.*/g,
	],
	en: [
		/Sign\s*up\s*for.*/gi,
		/Subscribe\s*to.*/gi,
		/Read\s*more:.*/gi,
		/Getty\s*Images.*/gi,
	],
	zh: [/版权所有.*/g, /转载请注明.*/g, /订阅.*/g, /图\s*[/／].*/g],
};

const LOCALE_LINE_NOISE: Record<ArticleLocale, RegExp[]> = {
	ko: [/^(기자|특파원|편집|사진)\s*$/],
	en: [/^(By|Photo:|Image:)\s/i],
	zh: [/^(记者|编辑|图)\s*$/],
};

/** UI 언어 → diet locale */
export function articleLocaleFromServiceLang(language: ServiceLang): ArticleLocale {
	const L = langTag(language);
	if (L === "ko" || L === "zh") return L;
	return "en";
}

function stripBoilerplate(text: string, locale: ArticleLocale): string {
	let out = text;
	for (const pattern of [...COMMON_NOISE_PATTERNS, ...LOCALE_NOISE_PATTERNS[locale]]) {
		out = out.replace(pattern, "");
	}
	return out.replace(/\n{3,}/g, "\n\n").trim();
}

function splitIntoBlocks(text: string): string[] {
	const lines = text.split("\n");
	const blocks: string[] = [];
	let current: string[] = [];

	const flush = () => {
		const joined = current.join("\n").trim();
		if (joined) blocks.push(joined);
		current = [];
	};

	for (const line of lines) {
		const trimmed = line.trim();
		if (HEADING_LINE_RE.test(trimmed) && current.length > 0) {
			flush();
		}
		current.push(line);
	}
	flush();

	return blocks.length > 0 ? blocks : text.trim() ? [text.trim()] : [];
}

function hasEmphasisOrNumbers(line: string): boolean {
	return /【[^】]*[\d%％][^】]*】/.test(line) || /[\d%％]/.test(line);
}

function isNoiseLine(
	line: string,
	locale: ArticleLocale,
	isLeadBlock: boolean,
): boolean {
	const t = line.trim();
	if (!t) return true;

	if (t.startsWith("사진=") || t.startsWith("▲") || t.startsWith("▼")) {
		return true;
	}
	if (t.includes("제공=")) return true;

	for (const pattern of LOCALE_LINE_NOISE[locale]) {
		if (pattern.test(t)) return true;
	}

	if (t.length < 15) {
		if (isLeadBlock && (hasEmphasisOrNumbers(t) || t.startsWith("- "))) {
			return false;
		}
		if (hasEmphasisOrNumbers(t) || t.startsWith("- ")) return false;
		return true;
	}

	return false;
}

function filterBlockLines(
	block: string,
	locale: ArticleLocale,
	isLeadBlock: boolean,
): { text: string; droppedLines: number } {
	const lines = block.split("\n");
	const kept: string[] = [];
	let dropped = 0;

	for (const line of lines) {
		if (isNoiseLine(line, locale, isLeadBlock)) {
			if (line.trim()) dropped += 1;
			continue;
		}
		kept.push(line);
	}

	return { text: kept.join("\n").trim(), droppedLines: dropped };
}

function scoreBlock(block: string, index: number, keepLeadBlocks: number): number {
	let score = 0;
	if (index < keepLeadBlocks) score += 40;

	const firstLine = block.split("\n")[0]?.trim() ?? "";
	if (HEADING_LINE_RE.test(firstLine)) score += 25;
	if (/【[^】]+】/.test(block)) score += 15;
	if (/^-\s/m.test(block)) score += 10;

	const len = block.length;
	if (len >= 40 && len <= 400) score += 5;
	if (len < 20 && index >= keepLeadBlocks) score -= 20;

	return score;
}

function joinedLength(blocks: string[], indices: number[]): number {
	const ordered = [...indices].sort((a, b) => a - b);
	return ordered.reduce((sum, idx, pos) => {
		return sum + blocks[idx].length + (pos > 0 ? 2 : 0);
	}, 0);
}

function selectWithinBudget(
	blocks: string[],
	maxChars: number,
	keepLeadBlocks: number,
): { text: string; droppedBlocks: number } {
	if (blocks.length === 0) return { text: "", droppedBlocks: 0 };

	const pinnedIndices = new Set(
		Array.from(
			{ length: Math.min(keepLeadBlocks, blocks.length) },
			(_, i) => i,
		),
	);
	const included = new Set(pinnedIndices);

	const candidates = blocks
		.map((block, i) => ({
			i,
			score: scoreBlock(block, i, keepLeadBlocks),
		}))
		.filter(({ i }) => !pinnedIndices.has(i))
		.sort((a, b) => b.score - a.score || a.i - b.i);

	for (const { i } of candidates) {
		const next = [...included, i];
		if (joinedLength(blocks, next) <= maxChars) {
			included.add(i);
		}
	}

	const ordered = [...included].sort((a, b) => a - b);
	let text = ordered.map((i) => blocks[i]).join("\n\n");
	if (text.length > maxChars) {
		text = text.slice(0, maxChars);
	}

	return { text, droppedBlocks: blocks.length - ordered.length };
}

/** 추출 본문 → 모델 전송용 압축 평문 */
export function applyTokenDiet(
	text: string,
	opts: TokenDietOptions,
): { text: string; stats: TokenDietStats } {
	const keepLeadBlocks = opts.keepLeadBlocks ?? 2;
	const originalChars = text.length;

	const stripped = stripBoilerplate(text, opts.locale);
	const blocks = splitIntoBlocks(stripped);

	let droppedLines = 0;
	const filteredBlocks = blocks
		.map((block, index) => {
			const { text: filtered, droppedLines: dropped } = filterBlockLines(
				block,
				opts.locale,
				index < keepLeadBlocks,
			);
			droppedLines += dropped;
			return filtered;
		})
		.filter((block) => block.length > 0);

	const afterFilter = filteredBlocks.join("\n\n").length;
	const { text: selected, droppedBlocks } = selectWithinBudget(
		filteredBlocks,
		opts.maxChars,
		keepLeadBlocks,
	);

	return {
		text: selected,
		stats: {
			originalChars,
			afterStrip: stripped.length,
			afterFilter,
			afterSelect: selected.length,
			droppedLines,
			droppedBlocks,
		},
	};
}

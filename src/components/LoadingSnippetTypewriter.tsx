import { useEffect, useState } from "react";

const FALLBACK_EN = "Scanning headings and key lines from the page…";
const FALLBACK_ZH = "正在扫描页面标题与关键句…";

type Props = {
	snippets: string[];
	language: string;
	label: string;
};

/** 추출 스니펫을 한 글자씩 타이핑하며 순환 표시 */
export function LoadingSnippetTypewriter({
	snippets,
	language,
	label,
}: Props) {
	const phrases =
		snippets.length > 0
			? snippets
			: [language === "Chinese" ? FALLBACK_ZH : FALLBACK_EN];

	const [phraseIdx, setPhraseIdx] = useState(0);
	const [charIdx, setCharIdx] = useState(0);

	const safeIdx = phraseIdx % phrases.length;
	const current = phrases[safeIdx] ?? "";
	const shown = current.slice(0, charIdx);

	useEffect(() => {
		setPhraseIdx(0);
		setCharIdx(0);
	}, [snippets]);

	useEffect(() => {
		if (charIdx < current.length) {
			const delay = /[\s,.!?。，、]/.test(current.charAt(charIdx)) ? 18 : 32;
			const t = window.setTimeout(() => setCharIdx((c) => c + 1), delay);
			return () => window.clearTimeout(t);
		}
		const t = window.setTimeout(() => {
			setPhraseIdx((i) => (i + 1) % phrases.length);
			setCharIdx(0);
		}, 1400);
		return () => window.clearTimeout(t);
	}, [charIdx, current, phrases.length]);

	return (
		<div className="mt-1 rounded-xl border border-indigo-100/90 bg-slate-50/90 px-3.5 py-3 text-left shadow-inner">
			<p className="mb-2 text-[8px] font-black uppercase tracking-[0.14em] text-indigo-500/90">
				{label}
			</p>
			<p
				className="min-h-[3.25rem] text-[11px] font-medium leading-relaxed text-slate-700"
				aria-live="polite"
			>
				{shown}
				<span className="ml-0.5 inline-block h-[13px] w-[2px] animate-pulse bg-indigo-500 align-middle" />
			</p>
		</div>
	);
}

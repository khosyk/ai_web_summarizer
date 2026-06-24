import { useEffect, useState } from "react";

const FALLBACK_EN = "Scanning headings and key lines from the page…";
const FALLBACK_KO = "페이지 제목과 핵심 문장을 스캔하는 중…";
const FALLBACK_ZH = "正在扫描页面标题与关键句…";

function fallbackPhrase(language: string): string {
	if (language === "Chinese") return FALLBACK_ZH;
	if (language === "Korean") return FALLBACK_KO;
	return FALLBACK_EN;
}

type Props = {
	snippets: string[];
	language: string;
	label: string;
	/** 모델 대기 중 스니펫 순환·타이핑 속도 상향 */
	cycleFast?: boolean;
};

/** 추출 스니펫을 한 글자씩 타이핑하며 순환 표시 */
export function LoadingSnippetTypewriter({
	snippets,
	language,
	label,
	cycleFast = false,
}: Props) {
	const phrases =
		snippets.length > 0
			? snippets
			: [fallbackPhrase(language)];

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
			const punctDelay = cycleFast ? 10 : 18;
			const charDelay = cycleFast ? 18 : 32;
			const delay = /[\s,.!?。，、]/.test(current.charAt(charIdx))
				? punctDelay
				: charDelay;
			const t = window.setTimeout(() => setCharIdx((c) => c + 1), delay);
			return () => window.clearTimeout(t);
		}
		const pauseMs = cycleFast ? 550 : 1400;
		const t = window.setTimeout(() => {
			setPhraseIdx((i) => (i + 1) % phrases.length);
			setCharIdx(0);
		}, pauseMs);
		return () => window.clearTimeout(t);
	}, [charIdx, current, phrases.length, cycleFast]);

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

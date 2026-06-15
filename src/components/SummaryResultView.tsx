import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
	AlignLeft,
	BookOpen,
	Copy,
	FileText,
	XCircle,
} from "lucide-react";
import type { ReadRecommendation } from "../summaryStructured";

const MARKDOWN_INLINE = {
	strong: ({
		children,
		className,
		...rest
	}: HTMLAttributes<HTMLElement>) => (
		<strong
			{...rest}
			className={`font-bold text-indigo-900 ${className ?? ""}`}
		>
			{children}
		</strong>
	),
	p: ({ children }: { children?: ReactNode }) => (
		<p className="mb-0 leading-relaxed">{children}</p>
	),
} as const;

type SectionId = "brief" | "full";

type SectionUi = {
	icon: typeof AlignLeft;
	accent: string;
	chip: string;
	border: string;
	bg: string;
};

const SECTION_UI: Record<SectionId, SectionUi> = {
	brief: {
		icon: AlignLeft,
		accent: "text-indigo-700",
		chip: "bg-indigo-600 text-white",
		border: "border-indigo-200/80",
		bg: "bg-gradient-to-br from-indigo-50/90 via-white to-white",
	},
	full: {
		icon: FileText,
		accent: "text-violet-800",
		chip: "bg-violet-600 text-white",
		border: "border-violet-200/70",
		bg: "bg-gradient-to-br from-violet-50/40 via-white to-slate-50/30",
	},
};

const COPY: Record<
	string,
	{
		brief: string;
		full: string;
		verdictRead: string;
		verdictSkip: string;
		verdictLabel: string;
		headline: string;
	}
> = {
	English: {
		brief: "Three-line summary",
		full: "Full summary",
		verdictRead: "Worth reading",
		verdictSkip: "Skip for now",
		verdictLabel: "Read?",
		headline: "Headline",
	},
	Chinese: {
		brief: "三行摘要",
		full: "全文摘要",
		verdictRead: "值得读",
		verdictSkip: "可跳过",
		verdictLabel: "要读吗",
		headline: "摘要标题",
	},
};

function uiCopy(language: string) {
	return COPY[language] ?? COPY.English;
}

function buildCopyText(
	readRecommendation: ReadRecommendation,
	readReason: string,
	title: string,
	briefLines: string[],
	fullSummary: string,
	language: string,
): string {
	const labels = uiCopy(language);
	const verdictLine =
		readRecommendation === "read"
			? labels.verdictRead
			: labels.verdictSkip;
	const brief = briefLines.map((line, i) => `${i + 1}. ${line}`).join("\n");
	return [`${verdictLine}: ${readReason}`, title, "", brief, "", fullSummary].join(
		"\n",
	);
}

function VerdictCard({
	readRecommendation,
	readReason,
	language,
}: {
	readRecommendation: ReadRecommendation;
	readReason: string;
	language: string;
}) {
	const labels = uiCopy(language);
	const isRead = readRecommendation === "read";
	const Icon = isRead ? BookOpen : XCircle;

	return (
		<section
			className={`rounded-2xl border px-3.5 py-3 shadow-sm ${
				isRead
					? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-white"
					: "border-red-200/90 bg-gradient-to-br from-red-50/90 via-white to-white"
			}`}
		>
			<div className="flex items-start gap-2.5">
				<span
					className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
						isRead
							? "bg-emerald-600 text-white"
							: "bg-red-600 text-white"
					}`}
				>
					<Icon size={15} strokeWidth={2.25} />
				</span>
				<div className="min-w-0 flex-1">
					<p
						className={`text-[9px] font-black uppercase tracking-[0.14em] ${
							isRead ? "text-emerald-700/80" : "text-red-700/80"
						}`}
					>
						{labels.verdictLabel}
					</p>
					<p
						className={`mt-0.5 text-[13px] font-black leading-snug ${
							isRead ? "text-emerald-900" : "text-red-800"
						}`}
					>
						{isRead ? labels.verdictRead : labels.verdictSkip}
					</p>
					<p
						className={`mt-1.5 text-[11px] font-medium leading-relaxed ${
							isRead ? "text-slate-600" : "text-red-700/90"
						}`}
					>
						{readReason}
					</p>
				</div>
			</div>
		</section>
	);
}

function SectionCard({
	id,
	language,
	index,
	briefLines,
	fullSummary,
}: {
	id: SectionId;
	language: string;
	index: number;
	briefLines: string[];
	fullSummary: string;
}) {
	const labels = uiCopy(language);
	const ui = SECTION_UI[id];
	const Icon = ui.icon;
	const title = id === "brief" ? labels.brief : labels.full;

	return (
		<section
			className={`rounded-2xl border ${ui.border} ${ui.bg} p-4 shadow-sm`}
		>
			<div className="mb-3 flex items-center gap-2.5">
				<span
					className={`flex h-8 w-8 items-center justify-center rounded-xl ${ui.chip} shadow-sm`}
				>
					<Icon size={15} strokeWidth={2.25} />
				</span>
				<p
					className={`min-w-0 flex-1 text-[10px] font-black uppercase tracking-[0.14em] ${ui.accent}`}
				>
					{index + 1} · {title}
				</p>
			</div>

			{id === "brief" ? (
				<ul className="space-y-2.5">
					{briefLines.map((line, i) => (
						<li
							key={i}
							className="flex gap-3 rounded-xl border border-indigo-100/90 bg-white/80 px-3 py-2.5 text-[12px] font-medium leading-snug text-slate-700 shadow-sm"
						>
							<span
								className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-black text-indigo-700"
								aria-hidden
							>
								{i + 1}
							</span>
							<span className="min-w-0 flex-1">
								<ReactMarkdown components={MARKDOWN_INLINE}>
									{line}
								</ReactMarkdown>
							</span>
						</li>
					))}
				</ul>
			) : (
				<div className="rounded-xl border border-white/80 bg-white/70 px-3.5 py-3 text-[13px] text-slate-700">
					<ReactMarkdown components={MARKDOWN_INLINE}>
						{fullSummary}
					</ReactMarkdown>
				</div>
			)}
		</section>
	);
}

type Props = {
	readRecommendation: ReadRecommendation;
	readReason: string;
	title: string;
	briefLines: string[];
	fullSummary: string;
	language: string;
	copyLabel: string;
	copiedLabel: string;
};

/** 읽기 판단 + 세줄 요약 + 전체 요약 */
export function SummaryResultView({
	readRecommendation,
	readReason,
	title,
	briefLines,
	fullSummary,
	language,
	copyLabel,
	copiedLabel,
}: Props) {
	const [copied, setCopied] = useState(false);
	const labels = uiCopy(language);

	const handleCopy = async () => {
		const text = buildCopyText(
			readRecommendation,
			readReason,
			title,
			briefLines,
			fullSummary,
			language,
		);
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-3">
			<VerdictCard
				readRecommendation={readRecommendation}
				readReason={readReason}
				language={language}
			/>

			<header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 px-3.5 py-3 text-white shadow-md">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/90">
							{labels.headline}
						</p>
						<h2 className="mt-1 text-sm font-black leading-snug tracking-tight">
							{title}
						</h2>
					</div>
					<button
						type="button"
						onClick={() => void handleCopy()}
						className="flex shrink-0 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white hover:bg-white/20"
					>
						<Copy size={12} />
						{copied ? copiedLabel : copyLabel}
					</button>
				</div>
			</header>

			<div className="grid gap-3">
				<SectionCard
					id="brief"
					language={language}
					index={0}
					briefLines={briefLines}
					fullSummary={fullSummary}
				/>
				<SectionCard
					id="full"
					language={language}
					index={1}
					briefLines={briefLines}
					fullSummary={fullSummary}
				/>
			</div>
		</div>
	);
}

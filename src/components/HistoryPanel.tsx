import { useState } from "react";
import {
	ArrowLeft,
	Bookmark,
	BookmarkCheck,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import type { ServiceLang } from "../privacyNotice";
import {
	MAX_HISTORY_ENTRIES,
	filterHistory,
	formatSavedAgo,
	historyEntryKey,
	hostOfUrl,
	type HistoryEntry,
	type HistoryFilter,
} from "../summaryHistory";

export const HISTORY_COPY: Record<
	ServiceLang,
	{
		open: string;
		back: string;
		search: string;
		filters: Record<HistoryFilter, string>;
		verdictRead: string;
		verdictSkip: string;
		readLater: string;
		readLaterOn: string;
		remove: string;
		empty: string;
		noMatch: string;
		autoSave: string;
		autoSaveHelp: string;
		clearAll: string;
		clearConfirm: string;
		clearYes: string;
		clearNo: string;
		savedSummary: (ago: string) => string;
		refresh: string;
	}
> = {
	Korean: {
		open: "요약 기록",
		back: "뒤로",
		search: "제목이나 사이트 검색",
		filters: {
			all: "전체",
			read: "읽을 글",
			skip: "건너뛸 글",
			readLater: "나중에 읽기",
		},
		verdictRead: "읽기",
		verdictSkip: "건너뛰기",
		readLater: "나중에 읽기",
		readLaterOn: "나중에 읽기 해제",
		remove: "기록에서 삭제",
		empty: "아직 저장된 요약이 없어요.",
		noMatch: "조건에 맞는 요약이 없어요.",
		autoSave: "요약 자동 저장",
		autoSaveHelp: `요약과 페이지 주소는 이 브라우저에만 저장돼요(최근 ${MAX_HISTORY_ENTRIES}개). 끄면 나중에 읽기로 표시한 글만 새로 저장하고, 저장본을 다시 쓰지 않고 매번 새로 요약해요. 이미 저장된 기록은 남지만, 나중에 읽기를 해제한 글은 기록에서 지워져요.`,
		clearAll: "전체 삭제",
		clearConfirm: "나중에 읽기를 포함해 모든 기록을 지울까요? 되돌릴 수 없어요.",
		clearYes: "모두 삭제",
		clearNo: "취소",
		savedSummary: (ago) => `저장된 요약 · ${ago}`,
		refresh: "다시 요약",
	},
	English: {
		open: "Summary history",
		back: "Back",
		search: "Search titles or sites",
		filters: {
			all: "All",
			read: "Read",
			skip: "Skip",
			readLater: "Read later",
		},
		verdictRead: "Read",
		verdictSkip: "Skip",
		readLater: "Read later",
		readLaterOn: "Remove from read later",
		remove: "Delete from history",
		empty: "No saved summaries yet.",
		noMatch: "No summaries match.",
		autoSave: "Save summaries automatically",
		autoSaveHelp: `Summaries and page addresses are stored only in this browser (latest ${MAX_HISTORY_ENTRIES}). When off, only pages you mark as read later are newly saved, and pages are summarized again instead of reusing saved results. Existing history stays until you delete it, but removing Read later from a page also deletes it from history.`,
		clearAll: "Delete all",
		clearConfirm:
			"Delete all history, including read later? This can't be undone.",
		clearYes: "Delete all",
		clearNo: "Cancel",
		savedSummary: (ago) => `Saved summary · ${ago}`,
		refresh: "Summarize again",
	},
	Chinese: {
		open: "摘要记录",
		back: "返回",
		search: "搜索标题或网站",
		filters: {
			all: "全部",
			read: "值得读",
			skip: "可跳过",
			readLater: "稍后阅读",
		},
		verdictRead: "值得读",
		verdictSkip: "可跳过",
		readLater: "稍后阅读",
		readLaterOn: "取消稍后阅读",
		remove: "从记录中删除",
		empty: "还没有保存的摘要。",
		noMatch: "没有符合条件的摘要。",
		autoSave: "自动保存摘要",
		autoSaveHelp: `摘要和页面地址仅保存在本浏览器（最近 ${MAX_HISTORY_ENTRIES} 条）。关闭后只保存新标记为稍后阅读的内容，并且每次重新摘要，不再使用已保存的结果。已有记录会保留，直到您删除；取消稍后阅读的内容会同时从记录中删除。`,
		clearAll: "全部删除",
		clearConfirm: "要删除包括稍后阅读在内的所有记录吗？此操作无法撤销。",
		clearYes: "全部删除",
		clearNo: "取消",
		savedSummary: (ago) => `已保存的摘要 · ${ago}`,
		refresh: "重新摘要",
	},
};

const FILTERS: HistoryFilter[] = ["all", "read", "skip", "readLater"];

interface PanelProps {
	language: ServiceLang;
	entries: HistoryEntry[];
	isAutoSaveEnabled: boolean;
	onBack: () => void;
	onOpenEntry: (entry: HistoryEntry) => void;
	onToggleReadLater: (entry: HistoryEntry) => void;
	onRemoveEntry: (entry: HistoryEntry) => void;
	onClearAll: () => void;
	onAutoSaveChange: (enabled: boolean) => void;
}

/** 저장된 요약 목록 */
export function HistoryPanel({
	language,
	entries,
	isAutoSaveEnabled,
	onBack,
	onOpenEntry,
	onToggleReadLater,
	onRemoveEntry,
	onClearAll,
	onAutoSaveChange,
}: PanelProps) {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<HistoryFilter>("all");
	const [isConfirmingClear, setIsConfirmingClear] = useState(false);
	const copy = HISTORY_COPY[language];
	const visible = filterHistory(entries, query, filter);

	return (
		<div className="space-y-3 pb-4">
			<div className="flex items-center gap-1.5">
				<button
					type="button"
					onClick={onBack}
					aria-label={copy.back}
					title={copy.back}
					className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
				>
					<ArrowLeft size={16} aria-hidden="true" />
				</button>
				<h2 className="text-sm font-black text-slate-900">{copy.open}</h2>
			</div>

			<label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 focus-within:border-indigo-400">
				<Search size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
				<input
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={copy.search}
					aria-label={copy.search}
					className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
				/>
			</label>

			<div className="flex flex-wrap gap-1">
				{FILTERS.map((id) => (
					<button
						key={id}
						type="button"
						aria-pressed={filter === id}
						onClick={() => setFilter(id)}
						className={`rounded-lg px-2 py-1 text-[10px] font-black transition-colors ${
							filter === id
								? "bg-indigo-600 text-white"
								: "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800"
						}`}
					>
						{copy.filters[id]}
					</button>
				))}
			</div>

			{visible.length === 0 ? (
				<p className="px-2 py-10 text-center text-xs font-medium text-slate-500">
					{entries.length === 0 ? copy.empty : copy.noMatch}
				</p>
			) : (
				<ul className="space-y-1.5">
					{visible.map((entry) => (
						<li
							key={historyEntryKey(entry)}
							className="flex items-start gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
						>
							<button
								type="button"
								onClick={() => onOpenEntry(entry)}
								className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left hover:bg-slate-50"
							>
								<span className="line-clamp-2 text-xs font-bold leading-snug text-slate-800">
									{entry.title}
								</span>
								<span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] font-medium text-slate-500">
									<span
										className={`font-black ${
											entry.readRecommendation === "read"
												? "text-emerald-700"
												: "text-red-700"
										}`}
									>
										{entry.readRecommendation === "read"
											? copy.verdictRead
											: copy.verdictSkip}
									</span>
									<span className="min-w-0 truncate">
										{hostOfUrl(entry.url)}
									</span>
									<span>{formatSavedAgo(entry.savedAt, language)}</span>
								</span>
							</button>
							<ReadLaterIconButton
								language={language}
								isReadLater={entry.isReadLater}
								onToggle={() => onToggleReadLater(entry)}
							/>
							<button
								type="button"
								onClick={() => onRemoveEntry(entry)}
								aria-label={`${copy.remove}: ${entry.title}`}
								title={copy.remove}
								className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
							>
								<X size={14} aria-hidden="true" />
							</button>
						</li>
					))}
				</ul>
			)}

			<section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
				<label className="flex items-center justify-between gap-2 text-[11px] font-black text-slate-700">
					{copy.autoSave}
					<input
						type="checkbox"
						role="switch"
						checked={isAutoSaveEnabled}
						onChange={(event) => onAutoSaveChange(event.target.checked)}
						className="h-4 w-4 shrink-0 accent-indigo-600"
					/>
				</label>
				<p className="text-[10px] font-medium leading-relaxed text-slate-500">
					{copy.autoSaveHelp}
				</p>
				{isConfirmingClear ? (
					<div className="space-y-2 rounded-lg bg-red-50 p-2">
						<p className="text-[10px] font-bold leading-relaxed text-red-800">
							{copy.clearConfirm}
						</p>
						<div className="flex justify-end gap-1.5">
							<button
								type="button"
								onClick={() => setIsConfirmingClear(false)}
								className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200"
							>
								{copy.clearNo}
							</button>
							<button
								type="button"
								onClick={() => {
									onClearAll();
									setIsConfirmingClear(false);
								}}
								className="rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-black text-white hover:bg-red-700"
							>
								{copy.clearYes}
							</button>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setIsConfirmingClear(true)}
						disabled={entries.length === 0}
						className="flex items-center gap-1 text-[10px] font-black text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
					>
						<Trash2 size={12} aria-hidden="true" />
						{copy.clearAll}
					</button>
				)}
			</section>
		</div>
	);
}

function ReadLaterIconButton({
	language,
	isReadLater,
	onToggle,
}: {
	language: ServiceLang;
	isReadLater: boolean;
	onToggle: () => void;
}) {
	const copy = HISTORY_COPY[language];
	const Icon = isReadLater ? BookmarkCheck : Bookmark;
	const label = isReadLater ? copy.readLaterOn : copy.readLater;
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-pressed={isReadLater}
			aria-label={label}
			title={label}
			className={`shrink-0 rounded-lg p-1.5 hover:bg-slate-100 ${
				isReadLater ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
			}`}
		>
			<Icon size={14} aria-hidden="true" />
		</button>
	);
}

/** 요약 결과 위 막대: 저장 시각, 다시 요약, 나중에 읽기 */
export function SavedSummaryBar({
	language,
	savedAt,
	isReadLater,
	canRefresh,
	canMarkReadLater,
	onBack,
	onRefresh,
	onToggleReadLater,
}: {
	language: ServiceLang;
	savedAt?: number;
	isReadLater: boolean;
	canRefresh: boolean;
	canMarkReadLater: boolean;
	onBack?: () => void;
	onRefresh: () => void;
	onToggleReadLater: () => void;
}) {
	const copy = HISTORY_COPY[language];
	const ReadLaterIcon = isReadLater ? BookmarkCheck : Bookmark;
	return (
		<div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
			<div className="flex min-w-0 items-center gap-1 text-[10px] font-bold text-slate-500">
				{onBack ? (
					<button
						type="button"
						onClick={onBack}
						aria-label={copy.back}
						title={copy.back}
						className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
					>
						<ArrowLeft size={14} aria-hidden="true" />
					</button>
				) : null}
				{savedAt !== undefined ? (
					<span>{copy.savedSummary(formatSavedAgo(savedAt, language))}</span>
				) : null}
			</div>
			<div className="ml-auto flex items-center gap-1">
				{canRefresh ? (
					<button
						type="button"
						onClick={onRefresh}
						className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200 hover:text-indigo-700"
					>
						<RefreshCw size={11} aria-hidden="true" />
						{copy.refresh}
					</button>
				) : null}
				{canMarkReadLater ? (
					<button
						type="button"
						onClick={onToggleReadLater}
						aria-pressed={isReadLater}
						className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black ring-1 ${
							isReadLater
								? "bg-indigo-50 text-indigo-700 ring-indigo-200"
								: "bg-white text-slate-600 ring-slate-200 hover:text-indigo-700"
						}`}
					>
						<ReadLaterIcon size={11} aria-hidden="true" />
						{copy.readLater}
					</button>
				) : null}
			</div>
		</div>
	);
}

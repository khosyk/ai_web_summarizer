import type { ServiceLang } from "./privacyNotice";
import type { ReadRecommendation } from "./summaryStructured";
import { isServiceLang } from "./supportedLanguages";

export const SUMMARY_HISTORY_KEY = "summaryHistory";
export const SUMMARY_HISTORY_ENABLED_KEY = "summaryHistoryEnabled";
export const MAX_HISTORY_ENTRIES = 200;
/** 페이지가 바뀌었을 수 있어 이 시간까지만 API 호출 없이 재사용 */
export const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type HistoryEntry = {
	url: string;
	language: ServiceLang;
	readRecommendation: ReadRecommendation;
	readReason: string;
	title: string;
	briefLines: string[];
	savedAt: number;
	isReadLater: boolean;
};

export type HistoryFilter = "all" | "read" | "skip" | "readLater";

/**
 * 문단 앵커(#top)는 같은 글로 취급하지만, 해시로 화면을 바꾸는 사이트(#/post/1, #!post)는
 * 글마다 주소가 다르므로 유지. http(s)가 아니면 빈 문자열
 */
export function normalizeHistoryUrl(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
		if (!/^#(!|[^:]*\/)/.test(parsed.hash)) parsed.hash = "";
		return parsed.href;
	} catch {
		return "";
	}
}

export function historyEntryKey(
	entry: Pick<HistoryEntry, "url" | "language">,
): string {
	return `${entry.language}|${entry.url}`;
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
	if (typeof value !== "object" || value === null) return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.url === "string" &&
		normalizeHistoryUrl(entry.url) !== "" &&
		isServiceLang(entry.language) &&
		(entry.readRecommendation === "read" ||
			entry.readRecommendation === "skip") &&
		typeof entry.readReason === "string" &&
		typeof entry.title === "string" &&
		Array.isArray(entry.briefLines) &&
		entry.briefLines.every((line) => typeof line === "string") &&
		typeof entry.savedAt === "number" &&
		typeof entry.isReadLater === "boolean"
	);
}

/** 저장값은 링크로 쓰이므로 형식이 맞는 항목만 받음 */
export function parseHistory(raw: unknown): HistoryEntry[] {
	return Array.isArray(raw) ? raw.filter(isHistoryEntry) : [];
}

/** 한도를 넘으면 오래된 일반 기록부터 지우고, 나중에 읽기는 마지막까지 남김 */
function trimHistory(entries: HistoryEntry[], max: number): HistoryEntry[] {
	const trimmed = [...entries];
	while (trimmed.length > max) {
		const lastRegular = trimmed
			.map((entry) => !entry.isReadLater)
			.lastIndexOf(true);
		trimmed.splice(lastRegular === -1 ? trimmed.length - 1 : lastRegular, 1);
	}
	return trimmed;
}

/** 최신 항목을 맨 앞에 넣음. 같은 글의 나중에 읽기 표시는 유지 */
export function upsertHistoryEntry(
	entries: HistoryEntry[],
	entry: HistoryEntry,
	max: number = MAX_HISTORY_ENTRIES,
): HistoryEntry[] {
	const key = historyEntryKey(entry);
	const existing = entries.find((item) => historyEntryKey(item) === key);
	return trimHistory(
		[
			{
				...entry,
				isReadLater: entry.isReadLater || Boolean(existing?.isReadLater),
			},
			...entries.filter((item) => historyEntryKey(item) !== key),
		],
		max,
	);
}

export function findReusableEntry(
	entries: HistoryEntry[],
	url: string,
	language: ServiceLang,
	now: number = Date.now(),
): HistoryEntry | undefined {
	const normalized = normalizeHistoryUrl(url);
	return entries.find(
		(entry) =>
			entry.url === normalized &&
			entry.language === language &&
			now - entry.savedAt < REUSE_WINDOW_MS,
	);
}

/** 기록을 보는 동안에는 탭 로드만으로 화면을 바꾸지 않음. 사용자가 다른 페이지로 가면 다시 동작 */
export function isAutoPausedForHistory(state: {
	isHistoryOpen: boolean;
	isOpenedFromHistory: boolean;
	activeUrl: string;
	urlWhenOpened: string;
}): boolean {
	if (state.isHistoryOpen) return true;
	return state.isOpenedFromHistory && state.activeUrl === state.urlWhenOpened;
}

export function hostOfUrl(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

export function filterHistory(
	entries: HistoryEntry[],
	query: string,
	filter: HistoryFilter,
): HistoryEntry[] {
	const needle = query.trim().toLowerCase();
	return entries.filter((entry) => {
		if (filter === "read" && entry.readRecommendation !== "read") return false;
		if (filter === "skip" && entry.readRecommendation !== "skip") return false;
		if (filter === "readLater" && !entry.isReadLater) return false;
		if (!needle) return true;
		return `${entry.title}\n${hostOfUrl(entry.url)}`
			.toLowerCase()
			.includes(needle);
	});
}

const LOCALE: Record<ServiceLang, string> = {
	English: "en",
	Korean: "ko",
	Chinese: "zh",
};

const JUST_NOW: Record<ServiceLang, string> = {
	English: "just now",
	Korean: "방금",
	Chinese: "刚刚",
};

export function formatSavedAgo(
	savedAt: number,
	language: ServiceLang,
	now: number = Date.now(),
): string {
	const minutes = Math.round((savedAt - now) / 60_000);
	if (minutes === 0) return JUST_NOW[language];
	const format = new Intl.RelativeTimeFormat(LOCALE[language], {
		numeric: "auto",
	});
	if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return format.format(hours, "hour");
	return format.format(Math.round(hours / 24), "day");
}

function hasStorage(): boolean {
	return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function getSummaryHistory(): Promise<HistoryEntry[]> {
	if (!hasStorage()) return [];
	const data = await chrome.storage.local.get(SUMMARY_HISTORY_KEY);
	return parseHistory(data[SUMMARY_HISTORY_KEY]);
}

// 읽고 고쳐 쓰는 작업이 겹치면 앞선 변경이 사라지므로 순서대로 실행
let writeQueue: Promise<unknown> = Promise.resolve();

function updateHistory(
	update: (entries: HistoryEntry[]) => HistoryEntry[],
): Promise<void> {
	const run = writeQueue.then(async () => {
		if (!hasStorage()) return;
		const next = update(await getSummaryHistory());
		await chrome.storage.local.set({ [SUMMARY_HISTORY_KEY]: next });
	});
	writeQueue = run.catch(() => {});
	return run;
}

export function saveToHistory(entry: HistoryEntry): Promise<void> {
	return updateHistory((entries) => upsertHistoryEntry(entries, entry));
}

/** 자동 저장이 꺼져 있으면, 표시를 해제한 글은 남기지 않음 */
export function setReadLater(
	entry: HistoryEntry,
	isReadLater: boolean,
	isAutoSaveEnabled: boolean,
): Promise<void> {
	const key = historyEntryKey(entry);
	return updateHistory((entries) => {
		if (!isReadLater && !isAutoSaveEnabled) {
			return entries.filter((item) => historyEntryKey(item) !== key);
		}
		if (!entries.some((item) => historyEntryKey(item) === key)) {
			return upsertHistoryEntry(entries, { ...entry, isReadLater });
		}
		return entries.map((item) =>
			historyEntryKey(item) === key ? { ...item, isReadLater } : item,
		);
	});
}

export function removeFromHistory(entry: HistoryEntry): Promise<void> {
	const key = historyEntryKey(entry);
	return updateHistory((entries) =>
		entries.filter((item) => historyEntryKey(item) !== key),
	);
}

export function clearHistory(): Promise<void> {
	return updateHistory(() => []);
}

export async function getHistoryEnabled(): Promise<boolean> {
	if (!hasStorage()) return true;
	const data = await chrome.storage.local.get(SUMMARY_HISTORY_ENABLED_KEY);
	return data[SUMMARY_HISTORY_ENABLED_KEY] !== false;
}

/** 새 설치는 켜짐. 저장하지 않던 버전에서 업데이트한 사용자는 직접 켜기 전까지 꺼 둠 */
export async function applyHistoryDefaultOnInstalled(
	reason: string,
): Promise<void> {
	if (!hasStorage() || (reason !== "install" && reason !== "update")) return;
	const data = await chrome.storage.local.get(SUMMARY_HISTORY_ENABLED_KEY);
	if (data[SUMMARY_HISTORY_ENABLED_KEY] !== undefined) return;
	await chrome.storage.local.set({
		[SUMMARY_HISTORY_ENABLED_KEY]: reason === "install",
	});
}

export async function setHistoryEnabled(enabled: boolean): Promise<void> {
	if (!hasStorage()) return;
	await chrome.storage.local.set({ [SUMMARY_HISTORY_ENABLED_KEY]: enabled });
}

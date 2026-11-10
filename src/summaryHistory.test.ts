import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	MAX_HISTORY_ENTRIES,
	REUSE_WINDOW_MS,
	SUMMARY_HISTORY_ENABLED_KEY,
	SUMMARY_HISTORY_KEY,
	applyHistoryDefaultOnInstalled,
	clearHistory,
	filterHistory,
	findReusableEntry,
	formatSavedAgo,
	getHistoryEnabled,
	getSummaryHistory,
	isAutoPausedForHistory,
	normalizeHistoryUrl,
	parseHistory,
	removeFromHistory,
	saveToHistory,
	setHistoryEnabled,
	setReadLater,
	upsertHistoryEntry,
	type HistoryEntry,
} from "./summaryHistory";

const NOW = Date.UTC(2026, 10, 5, 12);

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
	return {
		url: "https://example.com/a",
		language: "Korean",
		readRecommendation: "read",
		readReason: "이유",
		title: "제목",
		briefLines: ["하나", "둘", "셋"],
		savedAt: NOW,
		isReadLater: false,
		...overrides,
	};
}

describe("normalizeHistoryUrl", () => {
	it("drops the fragment and keeps the query", () => {
		expect(normalizeHistoryUrl("https://a.com/x?id=1#part")).toBe(
			"https://a.com/x?id=1",
		);
	});

	it.each([
		"https://a.com/app#/article/1",
		"https://a.com/app#!article-1",
		"https://a.com/app#article/1",
	])("keeps the hash route in %s", (url) => {
		expect(normalizeHistoryUrl(url)).toBe(url);
	});

	it("drops a text fragment", () => {
		expect(normalizeHistoryUrl("https://a.com/x#:~:text=a/b")).toBe(
			"https://a.com/x",
		);
	});

	it("rejects anything but http(s)", () => {
		expect(normalizeHistoryUrl("javascript:alert(1)")).toBe("");
		expect(normalizeHistoryUrl("chrome://settings")).toBe("");
		expect(normalizeHistoryUrl("not a url")).toBe("");
	});
});

describe("parseHistory", () => {
	it("keeps only valid entries", () => {
		const good = entry();
		expect(
			parseHistory([
				good,
				{ ...good, url: "javascript:alert(1)" },
				{ ...good, readRecommendation: "maybe" },
				{ ...good, briefLines: [1] },
				null,
				"x",
			]),
		).toEqual([good]);
	});

	it("treats a broken value as empty", () => {
		expect(parseHistory({ a: 1 })).toEqual([]);
		expect(parseHistory(undefined)).toEqual([]);
	});
});

describe("upsertHistoryEntry", () => {
	it("puts the newest first and replaces the same page", () => {
		const a = entry();
		const b = entry({ url: "https://example.com/b" });
		const updated = entry({ title: "새 제목", savedAt: NOW + 1 });
		const result = upsertHistoryEntry([b, a], updated);
		expect(result.map((item) => item.title)).toEqual(["새 제목", "제목"]);
		expect(result).toHaveLength(2);
	});

	it("keeps pages in different languages apart", () => {
		const result = upsertHistoryEntry(
			[entry()],
			entry({ language: "English" }),
		);
		expect(result).toHaveLength(2);
	});

	it("keeps the read later mark when summarizing again", () => {
		const result = upsertHistoryEntry(
			[entry({ isReadLater: true })],
			entry({ savedAt: NOW + 1 }),
		);
		expect(result[0].isReadLater).toBe(true);
	});

	it("removes the oldest regular entry past the limit", () => {
		const old = entry({ url: "https://example.com/old" });
		const kept = entry({ url: "https://example.com/kept", isReadLater: true });
		const newer = entry({ url: "https://example.com/newer" });
		const result = upsertHistoryEntry(
			[newer, old, kept],
			entry({ url: "https://example.com/new" }),
			3,
		);
		expect(result.map((item) => item.url)).toEqual([
			"https://example.com/new",
			"https://example.com/newer",
			"https://example.com/kept",
		]);
	});

	it("drops the oldest when every entry is read later", () => {
		const first = entry({ url: "https://example.com/1", isReadLater: true });
		const second = entry({ url: "https://example.com/2", isReadLater: true });
		const result = upsertHistoryEntry(
			[first, second],
			entry({ url: "https://example.com/3", isReadLater: true }),
			2,
		);
		expect(result.map((item) => item.url)).toEqual([
			"https://example.com/3",
			"https://example.com/1",
		]);
	});
});

describe("findReusableEntry", () => {
	it("matches url, language, and age", () => {
		const saved = entry({ savedAt: NOW - 1000 });
		expect(
			findReusableEntry([saved], "https://example.com/a#top", "Korean", NOW),
		).toBe(saved);
		expect(
			findReusableEntry([saved], "https://example.com/a", "English", NOW),
		).toBeUndefined();
		expect(
			findReusableEntry([saved], "https://example.com/b", "Korean", NOW),
		).toBeUndefined();
	});

	it("does not show one hash-routed article for another", () => {
		const saved = entry({
			url: "https://example.com/app#/article/1",
			savedAt: NOW - 1000,
		});
		expect(
			findReusableEntry(
				[saved],
				"https://example.com/app#/article/2",
				"Korean",
				NOW,
			),
		).toBeUndefined();
		expect(
			findReusableEntry(
				[saved],
				"https://example.com/app#/article/1",
				"Korean",
				NOW,
			),
		).toBe(saved);
	});

	it("stops reusing after the window", () => {
		const saved = entry({ savedAt: NOW - REUSE_WINDOW_MS });
		expect(
			findReusableEntry([saved], "https://example.com/a", "Korean", NOW),
		).toBeUndefined();
	});
});

describe("filterHistory", () => {
	const read = entry({ title: "Rust 입문", url: "https://www.rust-lang.org/a" });
	const skip = entry({
		title: "광고 기사",
		url: "https://news.example.com/b",
		readRecommendation: "skip",
	});
	const later = entry({
		title: "긴 글",
		url: "https://blog.example.com/c",
		isReadLater: true,
	});
	const all = [read, skip, later];

	it("filters by verdict and read later", () => {
		expect(filterHistory(all, "", "all")).toEqual(all);
		expect(filterHistory(all, "", "read")).toEqual([read, later]);
		expect(filterHistory(all, "", "skip")).toEqual([skip]);
		expect(filterHistory(all, "", "readLater")).toEqual([later]);
	});

	it("searches titles and hosts without case", () => {
		expect(filterHistory(all, " rust ", "all")).toEqual([read]);
		expect(filterHistory(all, "NEWS.EXAMPLE", "all")).toEqual([skip]);
		expect(filterHistory(all, "없는 말", "all")).toEqual([]);
	});

	it("does not search the page query", () => {
		const withQuery = entry({ url: "https://a.com/x?token=secret" });
		expect(filterHistory([withQuery], "secret", "all")).toEqual([]);
	});
});

describe("formatSavedAgo", () => {
	it("says just now under a minute", () => {
		expect(formatSavedAgo(NOW - 5_000, "Korean", NOW)).toBe("방금");
		expect(formatSavedAgo(NOW - 5_000, "English", NOW)).toBe("just now");
	});

	it("uses minutes, hours, and days", () => {
		expect(formatSavedAgo(NOW - 5 * 60_000, "English", NOW)).toBe(
			"5 minutes ago",
		);
		expect(formatSavedAgo(NOW - 2 * 3_600_000, "English", NOW)).toBe(
			"2 hours ago",
		);
		expect(formatSavedAgo(NOW - 3 * 86_400_000, "English", NOW)).toBe(
			"3 days ago",
		);
		expect(formatSavedAgo(NOW - 2 * 3_600_000, "Korean", NOW)).toBe("2시간 전");
	});
});

describe("isAutoPausedForHistory", () => {
	const base = {
		isHistoryOpen: false,
		isOpenedFromHistory: false,
		activeUrl: "https://example.com/a",
		urlWhenOpened: "https://example.com/a",
	};

	it("runs when no history is on screen", () => {
		expect(isAutoPausedForHistory(base)).toBe(false);
	});

	it("pauses while the list is open, even on another page", () => {
		expect(
			isAutoPausedForHistory({
				...base,
				isHistoryOpen: true,
				activeUrl: "https://example.com/b",
			}),
		).toBe(true);
	});

	it("keeps an opened entry until the user moves to another page", () => {
		const reading = { ...base, isOpenedFromHistory: true };
		expect(isAutoPausedForHistory(reading)).toBe(true);
		expect(
			isAutoPausedForHistory({
				...reading,
				activeUrl: "https://example.com/b",
			}),
		).toBe(false);
	});
});

describe("storage", () => {
	let stored: Record<string, unknown>;

	beforeEach(() => {
		stored = {};
		vi.stubGlobal("chrome", {
			storage: {
				local: {
					get: vi.fn(async (key: string) => ({ [key]: stored[key] })),
					set: vi.fn(async (values: Record<string, unknown>) => {
						await Promise.resolve();
						Object.assign(stored, values);
					}),
				},
			},
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("turns auto-save on for new installs only", async () => {
		await applyHistoryDefaultOnInstalled("install");
		expect(stored[SUMMARY_HISTORY_ENABLED_KEY]).toBe(true);

		stored = {};
		await applyHistoryDefaultOnInstalled("update");
		expect(stored[SUMMARY_HISTORY_ENABLED_KEY]).toBe(false);
		expect(await getHistoryEnabled()).toBe(false);
	});

	it("keeps an existing auto-save choice across updates", async () => {
		await applyHistoryDefaultOnInstalled("install");
		await applyHistoryDefaultOnInstalled("update");
		expect(stored[SUMMARY_HISTORY_ENABLED_KEY]).toBe(true);

		stored = { [SUMMARY_HISTORY_ENABLED_KEY]: false };
		await applyHistoryDefaultOnInstalled("update");
		expect(stored[SUMMARY_HISTORY_ENABLED_KEY]).toBe(false);
	});

	it("ignores other install events", async () => {
		await applyHistoryDefaultOnInstalled("chrome_update");
		expect(stored).toEqual({});
	});

	it("does not lose entries when saves overlap", async () => {
		await Promise.all(
			["a", "b", "c"].map((name) =>
				saveToHistory(entry({ url: `https://example.com/${name}` })),
			),
		);
		expect(await getSummaryHistory()).toHaveLength(3);
	});

	it("keeps working after a failed write", async () => {
		vi.mocked(chrome.storage.local.set).mockRejectedValueOnce(
			new Error("quota"),
		);
		await expect(saveToHistory(entry())).rejects.toThrow("quota");
		await saveToHistory(entry());
		expect(await getSummaryHistory()).toHaveLength(1);
	});

	it("marks and unmarks read later without moving the entry", async () => {
		const a = entry({ url: "https://example.com/a" });
		const b = entry({ url: "https://example.com/b" });
		stored[SUMMARY_HISTORY_KEY] = [a, b];
		await setReadLater(b, true, true);
		expect(stored[SUMMARY_HISTORY_KEY]).toEqual([
			a,
			{ ...b, isReadLater: true },
		]);
		await setReadLater(b, false, true);
		expect(stored[SUMMARY_HISTORY_KEY]).toEqual([a, b]);
	});

	it("saves a read later page even with auto save off", async () => {
		await setReadLater(entry(), true, false);
		expect(await getSummaryHistory()).toEqual([entry({ isReadLater: true })]);
	});

	it("forgets an unmarked page when auto save is off", async () => {
		stored[SUMMARY_HISTORY_KEY] = [entry({ isReadLater: true })];
		await setReadLater(entry(), false, false);
		expect(await getSummaryHistory()).toEqual([]);
	});

	it("removes one entry or everything", async () => {
		const a = entry({ url: "https://example.com/a" });
		const b = entry({ url: "https://example.com/b" });
		stored[SUMMARY_HISTORY_KEY] = [a, b];
		await removeFromHistory(a);
		expect(await getSummaryHistory()).toEqual([b]);
		await clearHistory();
		expect(await getSummaryHistory()).toEqual([]);
	});

	it("is on by default and remembers being turned off", async () => {
		expect(await getHistoryEnabled()).toBe(true);
		await setHistoryEnabled(false);
		expect(stored[SUMMARY_HISTORY_ENABLED_KEY]).toBe(false);
		expect(await getHistoryEnabled()).toBe(false);
	});

	it("never grows past the limit", async () => {
		stored[SUMMARY_HISTORY_KEY] = Array.from(
			{ length: MAX_HISTORY_ENTRIES },
			(_, i) => entry({ url: `https://example.com/${i}` }),
		);
		await saveToHistory(entry({ url: "https://example.com/new" }));
		expect(await getSummaryHistory()).toHaveLength(MAX_HISTORY_ENTRIES);
	});
});

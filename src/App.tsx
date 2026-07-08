import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, ArrowRight, Clock, Settings } from "lucide-react";
import { extractLoadingSnippets } from "./extractLoadingSnippets";
import { LoadingSnippetTypewriter } from "./components/LoadingSnippetTypewriter";
import { SummaryResultView } from "./components/SummaryResultView";
import { ErrorDialog } from "./components/ErrorDialog";
import { LanguagePicker } from "./components/LanguagePicker";
import { getGeminiApiKey, GEMINI_API_KEY_STORAGE_KEY } from "./apiKeyStorage";
import { detectServiceLang } from "./detectServiceLang";
import {
	getUiLanguage,
	setUiLanguage,
	UI_LANGUAGE_STORAGE_KEY,
	getAutoSummarizeEnabled,
	setAutoSummarizeEnabled,
	AUTO_SUMMARIZE_STORAGE_KEY,
	getHasCompletedFirstSummary,
	setHasCompletedFirstSummary,
	FIRST_SUMMARY_COMPLETED_STORAGE_KEY,
} from "./uiLanguageStorage";
import type { ServiceLang } from "./privacyNotice";
import { LEGAL_LINK } from "./privacyNotice";
import { summarizeArticle } from "./geminiClient";
import { isServiceLang } from "./supportedLanguages";
import {
	isErrorCode,
	resolveUserFacingError,
	WebSummaryError,
} from "./userFacingError";
import { extensionIconUrl, openLegalPage } from "./openLegalPage";
import { PRODUCT_DISPLAY_NAME } from "./productBrand";
import {
	addAutoSummarizeBlockedHost,
	AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY,
	getAutoSummarizeBlockedHosts,
	hostFromTabUrl,
	isHostBlocked,
	isTabUrlAutoBlocked,
} from "./autoSummarizeBlocklist";

function isChromeExtension(): boolean {
	return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

type UiCopy = {
	title: string;
	analyzeBtn: string;
	languageChange: string;
	emptyHint: string;
	errDialogTitle: string;
	errDialogClose: string;
	statsSource: string;
	statsOutputCap: string;
	statsBodyChars: string;
	statsInputEst: string;
	statsFromTab: string;
	statsSubtitle: string;
	loadingFromPage: string;
	stopAnalysisBtn: string;
	processing: string;
	settings: string;
	autoOff: string;
	autoOn: string;
	apiKeyBanner: string;
	apiKeyBannerBtn: string;
	setupGuideBtn: string;
	setupEmptyHint: string;
	readyEmptyTitle: string;
	readyEmptyBody: string;
	readyEmptyAutoNote: string;
	copySummary: string;
	copiedSummary: string;
	autoComplianceNote: string;
	blockAutoForSiteBtn: string;
	blockAutoForSiteDone: string;
	blockAutoForSiteAlready: string;
};

type AppSummaryResult = {
	sourceTabUrl: string;
	summaryLanguage: ServiceLang;
	readRecommendation: "read" | "skip";
	readReason: string;
	title: string;
	briefLines: string[];
	stats: {
		originalLength: number;
		model?: string;
		sentToModelChars?: number;
		approxInputTokensHint?: number;
		maxOutputTokensCap?: number;
		source?: string;
	};
};

const TRANSLATIONS: Record<string, UiCopy> = {
	English: {
		title: PRODUCT_DISPLAY_NAME,
		analyzeBtn: "Summarize this tab",
		languageChange: "Change language",
		emptyHint:
			"Open an article tab and tap Summarize this tab. AI-generated — verify before sharing.",
		errDialogTitle: "Something went wrong",
		errDialogClose: "OK",
		statsSource: "Source",
		statsOutputCap: "Out cap",
		statsBodyChars: "Body chars",
		statsInputEst: "Input (est.)",
		statsFromTab: "Current tab",
		statsSubtitle: "Meta",
		loadingFromPage: "From the page",
		stopAnalysisBtn: "Stop summarizing",
		processing: "Summarizing with Gemini…",
		settings: "Settings",
		autoOff: "⚡ Auto OFF",
		autoOn: "⚡ Auto ON",
		apiKeyBanner: "Setup required",
		apiKeyBannerBtn: "Settings",
		setupGuideBtn: "Setup guide",
		setupEmptyHint: "Open the setup guide to continue.",
		readyEmptyTitle: "You're all set",
		readyEmptyBody:
			"Open the article tab you want summarized, then tap Summarize this tab below.",
		readyEmptyAutoNote:
			"Auto is on — stay on an article tab for a few seconds to summarize automatically.",
		copySummary: "Copy",
		copiedSummary: "Copied",
		autoComplianceNote:
			"Auto extracts page text after ~3s—use only where site terms allow.",
		blockAutoForSiteBtn: "Turn off Auto for this site",
		blockAutoForSiteDone: "Auto off for {host}",
		blockAutoForSiteAlready: "Auto already off for this site",
	},
	Korean: {
		title: PRODUCT_DISPLAY_NAME,
		analyzeBtn: "현재 탭 요약하기",
		languageChange: "언어 변경",
		emptyHint:
			"기사 탭을 연 뒤 「현재 탭 요약하기」를 누르세요. AI 생성 · 공유 전 직접 확인",
		errDialogTitle: "문제가 발생했습니다",
		errDialogClose: "확인",
		statsSource: "출처",
		statsOutputCap: "출력 상한",
		statsBodyChars: "본문 길이",
		statsInputEst: "입력(추정)",
		statsFromTab: "현재 탭",
		statsSubtitle: "메타",
		loadingFromPage: "페이지에서",
		stopAnalysisBtn: "요약 중지",
		processing: "Gemini로 요약 중…",
		settings: "설정",
		autoOff: "⚡ Auto OFF",
		autoOn: "⚡ Auto ON",
		apiKeyBanner: "설정 필요",
		apiKeyBannerBtn: "설정",
		setupGuideBtn: "설정 가이드",
		setupEmptyHint: "설정 가이드를 열어 계속 진행하세요.",
		readyEmptyTitle: "준비됐어요",
		readyEmptyBody:
			"요약할 기사 탭으로 이동한 뒤, 아래 「현재 탭 요약하기」를 누르세요.",
		readyEmptyAutoNote:
			"Auto가 켜져 있으면 기사 탭에서 잠시 머물면 자동으로 요약됩니다.",
		copySummary: "복사",
		copiedSummary: "복사됨",
		autoComplianceNote:
			"Auto는 약 3초 후 본문을 추출합니다. 사이트 약관이 허용하는 경우에만 사용하세요.",
		blockAutoForSiteBtn: "이 사이트에서 Auto 끄기",
		blockAutoForSiteDone: "{host}에서 Auto 꺼짐",
		blockAutoForSiteAlready: "이 사이트는 이미 Auto 제외 목록에 있음",
	},
	Chinese: {
		title: PRODUCT_DISPLAY_NAME,
		analyzeBtn: "摘要当前标签",
		languageChange: "更改语言",
		emptyHint: "打开文章页后点击摘要当前标签。AI 生成 · 分享前请自行核实",
		errDialogTitle: "出错了",
		errDialogClose: "确定",
		statsSource: "来源",
		statsOutputCap: "输出上限",
		statsBodyChars: "正文长度",
		statsInputEst: "输入(估)",
		statsFromTab: "当前标签",
		statsSubtitle: "摘要信息",
		loadingFromPage: "页面摘取",
		stopAnalysisBtn: "停止摘要",
		processing: "Gemini 摘要中…",
		settings: "设置",
		autoOff: "⚡ Auto OFF",
		autoOn: "⚡ Auto ON",
		apiKeyBanner: "需要完成设置",
		apiKeyBannerBtn: "设置",
		setupGuideBtn: "设置指南",
		setupEmptyHint: "请打开设置指南继续。",
		readyEmptyTitle: "已准备就绪",
		readyEmptyBody: "切换到要摘要的文章标签页，然后点击下方「摘要当前标签」。",
		readyEmptyAutoNote: "已开启 Auto — 在文章标签页停留几秒即可自动摘要。",
		copySummary: "复制",
		copiedSummary: "已复制",
		autoComplianceNote: "Auto 约 3 秒后提取正文，请仅在网站条款允许时使用。",
		blockAutoForSiteBtn: "此站点关闭 Auto",
		blockAutoForSiteDone: "已关闭 {host} 的 Auto",
		blockAutoForSiteAlready: "此站点已在排除列表中",
	},
};

const getT = (lang: string) => TRANSLATIONS[lang] ?? TRANSLATIONS.English;

const AUTO_SUMMARIZE_DWELL_MS = 3000;

const LOADING_PHASE_COPY: Record<
	ServiceLang,
	Array<{ line: string; hint: string }>
> = {
	English: [
		{
			line: "Reading the page",
			hint: "Pulling out the main article text from this tab.",
		},
		{
			line: "Preparing the draft",
			hint: "Keeping the parts that matter most for a clear summary.",
		},
		{
			line: "Writing the summary",
			hint: "Deciding read or skip and three one-sentence lines.",
		},
		{
			line: "Finishing up",
			hint: "Almost done—thanks for waiting.",
		},
	],
	Korean: [
		{
			line: "페이지 읽는 중",
			hint: "이 탭에서 기사 본문을 가져오고 있어요.",
		},
		{
			line: "요약 준비 중",
			hint: "요약에 필요한 핵심 내용만 정리하고 있어요.",
		},
		{
			line: "요약 작성 중",
			hint: "읽기/건너뛰기와 한 문장씩 세 줄을 작성하고 있어요.",
		},
		{
			line: "마무리 중",
			hint: "거의 다 됐어요. 잠시만 기다려 주세요.",
		},
	],
	Chinese: [
		{
			line: "读取页面",
			hint: "正在从当前标签提取文章正文。",
		},
		{
			line: "整理要点",
			hint: "保留对摘要最重要的内容。",
		},
		{
			line: "撰写摘要",
			hint: "正在判断读/跳过并撰写三行单句摘要。",
		},
		{
			line: "即将完成",
			hint: "快好了，请稍候。",
		},
	],
};

function loadingPhasesFor(lang: ServiceLang) {
	return LOADING_PHASE_COPY[lang] ?? LOADING_PHASE_COPY.English;
}

const LOADING_WAIT_HINTS: Record<ServiceLang, string[]> = {
	English: [
		"Still putting the summary together…",
		"Long pages can take a little longer.",
		"Packaging read/skip and three one-liners.",
		"Almost there—hang tight.",
	],
	Korean: [
		"요약을 마무리하는 중이에요…",
		"긴 페이지는 조금 더 걸릴 수 있어요.",
		"읽기/건너뛰기와 한 문장씩 세 줄을 정리하고 있어요.",
		"곧 완료됩니다. 잠시만 기다려 주세요.",
	],
	Chinese: [
		"仍在整理摘要…",
		"较长页面可能需要多几秒。",
		"正在整理读/跳过与三行单句摘要。",
		"即将完成，请稍候。",
	],
};

function bodyCharUnit(language: ServiceLang): string {
	if (language === "Chinese") return " 字";
	if (language === "Korean") return "자";
	return " chars";
}

type ExtractPageDataResponse = {
	title?: string;
	articleText?: string;
	textContent?: string;
	url?: string;
	errorCode?: string;
	error?: string;
};

const TAB_EXTRACT_MAX_RETRY = 3;

function sleepMs(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isReceivingEndMissingError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return /receiving end does not exist/i.test(message);
}

async function injectContentScript(tabId: number): Promise<void> {
	await chrome.scripting.executeScript({
		target: { tabId },
		files: ["content.js"],
	});
}

/** 탭 본문 추출 — content.js가 있으면 재주입하지 않음 */
async function extractPageDataFromTab(
	tabId: number,
): Promise<ExtractPageDataResponse> {
	let contentScriptInjected = false;
	let lastExtractError: unknown = null;

	for (let attempt = 0; attempt < TAB_EXTRACT_MAX_RETRY; attempt++) {
		try {
			return (await chrome.tabs.sendMessage(tabId, {
				action: "EXTRACT_PAGE_DATA",
			})) as ExtractPageDataResponse;
		} catch (sendErr: unknown) {
			lastExtractError = sendErr;
			if (isReceivingEndMissingError(sendErr) && !contentScriptInjected) {
				await injectContentScript(tabId);
				contentScriptInjected = true;
				await sleepMs(220);
				continue;
			}
			if (attempt < TAB_EXTRACT_MAX_RETRY - 1) {
				await sleepMs(220);
			}
		}
	}

	if (lastExtractError) {
		if (isReceivingEndMissingError(lastExtractError)) {
			throw new WebSummaryError("E04", "receiving_end_missing");
		}
		throw new WebSummaryError(
			"E07",
			lastExtractError instanceof Error
				? lastExtractError.message
				: String(lastExtractError),
		);
	}

	throw new WebSummaryError("E05", "extract_no_response");
}

export default function App() {
	const [isProcessing, setIsProcessing] = useState(false);
	const [language, setLanguageState] = useState<ServiceLang>(() =>
		detectServiceLang(),
	);
	const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
	const [hasCompletedFirstSummary, setHasCompletedFirstSummaryState] =
		useState<boolean | null>(null);
	const [autoSummarizeEnabled, setAutoSummarizeEnabledState] = useState(false);
	const [blockedHosts, setBlockedHosts] = useState<string[]>([]);
	const [currentTabHost, setCurrentTabHost] = useState<string | null>(null);
	const [blockSiteFeedback, setBlockSiteFeedback] = useState("");
	const [result, setResult] = useState<AppSummaryResult | null>(null);

	const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
	const [waitingHintIdx, setWaitingHintIdx] = useState(0);
	const [loadingSnippets, setLoadingSnippets] = useState<string[]>([]);
	const [errorDialog, setErrorDialog] = useState<{
		isOpen: boolean;
		message: string;
	}>({ isOpen: false, message: "" });

	const autoDwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const autoDwellGenerationRef = useRef(0);
	const analysisRunIdRef = useRef(0);
	const analysisAbortRef = useRef<AbortController | null>(null);
	const autoSummarizeEnabledRef = useRef(autoSummarizeEnabled);
	const blockedHostsRef = useRef(blockedHosts);
	const hasApiKeyRef = useRef(hasApiKey);
	const isProcessingRef = useRef(isProcessing);
	const resultRef = useRef(result);
	const languageRef = useRef(language);

	autoSummarizeEnabledRef.current = autoSummarizeEnabled;
	blockedHostsRef.current = blockedHosts;
	hasApiKeyRef.current = hasApiKey;
	isProcessingRef.current = isProcessing;
	resultRef.current = result;
	languageRef.current = language;

	const T = getT(language);

	const clearAutoDwellTimer = useCallback(() => {
		if (autoDwellTimerRef.current) {
			window.clearTimeout(autoDwellTimerRef.current);
			autoDwellTimerRef.current = null;
		}
	}, []);

	const refreshActiveTabHost = useCallback(async () => {
		if (!isChromeExtension()) {
			setCurrentTabHost(null);
			return;
		}
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		setCurrentTabHost(hostFromTabUrl(tab?.url ?? ""));
	}, []);

	const showError = useCallback((error: unknown) => {
		const { message, logDetail } = resolveUserFacingError(
			error,
			languageRef.current,
		);
		console.error("[Web Summary]", logDetail);
		setErrorDialog({ isOpen: true, message });
	}, []);

	const handleCancelAnalysis = useCallback(() => {
		analysisRunIdRef.current += 1;
		analysisAbortRef.current?.abort();
		clearAutoDwellTimer();
		setIsProcessing(false);
		setLoadingSnippets([]);
	}, [clearAutoDwellTimer]);

	const runAnalysis = useCallback(
		async (trigger: "manual" | "auto" = "manual") => {
			if (isProcessingRef.current) return;

			if (!isChromeExtension()) {
				if (trigger === "manual") showError(new WebSummaryError("E01"));
				return;
			}

			const apiKey = await getGeminiApiKey();
			if (!apiKey) {
				setHasApiKey(false);
				if (trigger === "manual") showError(new WebSummaryError("E02"));
				return;
			}
			setHasApiKey(true);

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			const tabUrl = tab?.url ?? "";
			if (!tab?.id || !tabUrl.startsWith("http")) {
				if (trigger === "manual") showError(new WebSummaryError("E03"));
				return;
			}

			const currentLanguage = languageRef.current;
			const currentResult = resultRef.current;
			if (
				currentResult &&
				currentResult.sourceTabUrl === tabUrl &&
				currentResult.summaryLanguage === currentLanguage
			) {
				return;
			}

			const runId = analysisRunIdRef.current + 1;
			analysisRunIdRef.current = runId;
			const abortController = new AbortController();
			analysisAbortRef.current = abortController;

			setLoadingSnippets([]);
			setIsProcessing(true);
			setResult(null);

			try {
				const data = await extractPageDataFromTab(tab.id);
				if (runId !== analysisRunIdRef.current) return;

				if (data.errorCode || data.error) {
					if (data.errorCode && isErrorCode(data.errorCode)) {
						throw new WebSummaryError(data.errorCode, data.error);
					}
					throw new WebSummaryError("E05", data.error);
				}

				const raw = (data.articleText ?? data.textContent ?? "").trim();
				if (raw.length < 48) {
					throw new WebSummaryError("E06");
				}

				setLoadingSnippets(extractLoadingSnippets(raw, data.title));

				const summary = await summarizeArticle({
					apiKey,
					language: currentLanguage,
					articleTitle: data.title,
					articleText: raw,
					signal: abortController.signal,
				});

				if (runId !== analysisRunIdRef.current) return;

				setResult({
					...summary,
					sourceTabUrl: tabUrl,
					summaryLanguage: currentLanguage,
				});
				setHasCompletedFirstSummaryState(true);
				void setHasCompletedFirstSummary();
			} catch (e: unknown) {
				if (isAbortError(e) || abortController.signal.aborted) return;
				showError(e);
			} finally {
				if (runId === analysisRunIdRef.current) {
					analysisAbortRef.current = null;
					setIsProcessing(false);
					setLoadingSnippets([]);
				}
			}
		},
		[showError],
	);

	const scheduleAutoSummarize = useCallback(() => {
		clearAutoDwellTimer();
		if (!autoSummarizeEnabledRef.current || hasApiKeyRef.current !== true) {
			return;
		}

		void (async () => {
			if (!isChromeExtension()) return;

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			const tabUrl = tab?.url ?? "";
			const tabHost = hostFromTabUrl(tabUrl);
			setCurrentTabHost(tabHost);
			if (!tab?.id || !tabUrl.startsWith("http")) return;
			if (isTabUrlAutoBlocked(tabUrl, blockedHostsRef.current)) return;

			const generation = ++autoDwellGenerationRef.current;
			autoDwellTimerRef.current = window.setTimeout(() => {
				if (generation !== autoDwellGenerationRef.current) return;
				if (!autoSummarizeEnabledRef.current || isProcessingRef.current) return;

				void (async () => {
					if (!isChromeExtension()) return;

					const [activeTab] = await chrome.tabs.query({
						active: true,
						currentWindow: true,
					});
					const activeUrl = activeTab?.url ?? "";
					const activeHost = hostFromTabUrl(activeUrl);
					setCurrentTabHost(activeHost);
					if (!activeTab?.id || !activeUrl.startsWith("http")) return;
					if (isTabUrlAutoBlocked(activeUrl, blockedHostsRef.current)) return;

					const currentResult = resultRef.current;
					const currentLanguage = languageRef.current;
					if (
						currentResult &&
						currentResult.sourceTabUrl === activeUrl &&
						currentResult.summaryLanguage === currentLanguage
					) {
						return;
					}

					await runAnalysis("auto");
				})();
			}, AUTO_SUMMARIZE_DWELL_MS);
		})();
	}, [clearAutoDwellTimer, runAnalysis]);

	useEffect(() => {
		void getUiLanguage().then(setLanguageState);
		void getAutoSummarizeEnabled().then(setAutoSummarizeEnabledState);
		void getHasCompletedFirstSummary().then(setHasCompletedFirstSummaryState);
		void getAutoSummarizeBlockedHosts().then(setBlockedHosts);
		void refreshActiveTabHost();
	}, [refreshActiveTabHost]);

	useEffect(() => {
		const syncApiKeyState = () => {
			void getGeminiApiKey().then((k) => setHasApiKey(Boolean(k)));
		};
		syncApiKeyState();

		if (!isChromeExtension() || !chrome.storage?.onChanged) return;

		const onStorageChanged = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => {
			if (areaName !== "local") return;
			if (GEMINI_API_KEY_STORAGE_KEY in changes) {
				syncApiKeyState();
			}
			if (UI_LANGUAGE_STORAGE_KEY in changes) {
				const next = changes[UI_LANGUAGE_STORAGE_KEY].newValue;
				if (isServiceLang(next)) {
					setLanguageState(next);
				}
			}
			if (AUTO_SUMMARIZE_STORAGE_KEY in changes) {
				setAutoSummarizeEnabledState(
					changes[AUTO_SUMMARIZE_STORAGE_KEY].newValue === true,
				);
			}
			if (AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY in changes) {
				const next = changes[AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY].newValue;
				if (Array.isArray(next)) {
					setBlockedHosts(
						next.filter((entry): entry is string => typeof entry === "string"),
					);
				}
			}
			if (FIRST_SUMMARY_COMPLETED_STORAGE_KEY in changes) {
				setHasCompletedFirstSummaryState(
					changes[FIRST_SUMMARY_COMPLETED_STORAGE_KEY].newValue === true,
				);
			}
		};

		chrome.storage.onChanged.addListener(onStorageChanged);
		return () => chrome.storage.onChanged.removeListener(onStorageChanged);
	}, []);

	const openSettings = () => {
		if (isChromeExtension() && chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		}
	};

	const openWelcomeGuide = () => {
		if (isChromeExtension() && chrome.runtime.getURL) {
			void chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
			return;
		}
		window.open("/welcome.html", "_blank", "noopener,noreferrer");
	};

	const handleLanguageChange = (next: ServiceLang) => {
		setLanguageState(next);
		void setUiLanguage(next);
	};

	const handleAutoSummarizeToggle = () => {
		const next = !autoSummarizeEnabled;
		if (next && hasApiKey !== true) {
			showError(new WebSummaryError("E02"));
			return;
		}
		setAutoSummarizeEnabledState(next);
		void setAutoSummarizeEnabled(next);
		if (next) {
			void refreshActiveTabHost();
		} else {
			setBlockSiteFeedback("");
		}
	};

	const handleBlockAutoForCurrentSite = () => {
		if (!currentTabHost) return;
		if (isHostBlocked(currentTabHost, blockedHosts)) {
			setBlockSiteFeedback(T.blockAutoForSiteAlready);
			window.setTimeout(() => setBlockSiteFeedback(""), 2200);
			return;
		}
		clearAutoDwellTimer();
		void addAutoSummarizeBlockedHost(currentTabHost).then((next) => {
			setBlockedHosts(next);
			setBlockSiteFeedback(
				T.blockAutoForSiteDone.replace("{host}", currentTabHost),
			);
			window.setTimeout(() => setBlockSiteFeedback(""), 2200);
		});
	};

	useEffect(() => {
		if (!autoSummarizeEnabled) {
			clearAutoDwellTimer();
			return;
		}
		scheduleAutoSummarize();
		return clearAutoDwellTimer;
	}, [
		autoSummarizeEnabled,
		hasApiKey,
		language,
		scheduleAutoSummarize,
		clearAutoDwellTimer,
	]);

	useEffect(() => {
		if (!autoSummarizeEnabled || !isChromeExtension()) return;

		const onTabContextChange = () => {
			void refreshActiveTabHost();
			scheduleAutoSummarize();
		};
		const onTabUpdated = (
			_tabId: number,
			changeInfo: { status?: string; url?: string },
		) => {
			if (changeInfo.status === "complete" || changeInfo.url) {
				onTabContextChange();
			}
		};

		chrome.tabs.onActivated.addListener(onTabContextChange);
		chrome.tabs.onUpdated.addListener(onTabUpdated);
		return () => {
			chrome.tabs.onActivated.removeListener(onTabContextChange);
			chrome.tabs.onUpdated.removeListener(onTabUpdated);
			clearAutoDwellTimer();
		};
	}, [
		autoSummarizeEnabled,
		scheduleAutoSummarize,
		clearAutoDwellTimer,
		refreshActiveTabHost,
	]);

	useEffect(() => {
		if (!isProcessing) {
			setLoadingPhaseIdx(0);
			setWaitingHintIdx(0);
			return;
		}
		setLoadingPhaseIdx(0);
		setWaitingHintIdx(0);
		const t1 = window.setTimeout(() => setLoadingPhaseIdx(1), 450);
		const t2 = window.setTimeout(() => setLoadingPhaseIdx(2), 2200);
		const t3 = window.setTimeout(() => setLoadingPhaseIdx(3), 4800);
		return () => {
			window.clearTimeout(t1);
			window.clearTimeout(t2);
			window.clearTimeout(t3);
		};
	}, [isProcessing]);

	const phases = loadingPhasesFor(language);
	const phasedIdx = Math.min(loadingPhaseIdx, phases.length - 1);
	const isWaitingOnModel = isProcessing && phasedIdx === phases.length - 1;
	const waitingHints = LOADING_WAIT_HINTS[language];
	const activeWaitingHint =
		waitingHints[waitingHintIdx % waitingHints.length] ??
		phases[phasedIdx].hint;

	useEffect(() => {
		if (!isWaitingOnModel) return;
		const interval = window.setInterval(() => {
			setWaitingHintIdx((idx) => idx + 1);
		}, 2200);
		return () => window.clearInterval(interval);
	}, [isWaitingOnModel, language]);

	const handleStartAnalysis = () => void runAnalysis("manual");

	const isCurrentHostBlocked =
		currentTabHost !== null && isHostBlocked(currentTabHost, blockedHosts);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFC] font-sans text-[#1E293B]">
			<header className="shrink-0 space-y-2.5 border-b border-slate-200 bg-white p-3 shadow-sm">
				<div className="flex items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-1.5">
						<img
							src={extensionIconUrl(48)}
							alt=""
							width={24}
							height={24}
							className="h-6 w-6 rounded-lg shadow-md shadow-indigo-200"
						/>
						<h1 className="truncate text-sm font-black uppercase tracking-tighter text-slate-900">
							{T.title}
						</h1>
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						<LanguagePicker
							value={language}
							onChange={handleLanguageChange}
							label={T.languageChange}
							id="panel-ui-language"
							className="w-[5.75rem] shrink-0 [&>span]:sr-only [&_select]:border-slate-200 [&_select]:px-1.5 [&_select]:py-1 [&_select]:text-[9px] [&_select]:font-black"
						/>
						<button
							type="button"
							onClick={openSettings}
							className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
							title={T.settings}
						>
							<Settings size={12} />
						</button>
					</div>
				</div>

				{hasApiKey === false ? (
					<div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
						<span className="text-[9px] font-bold text-amber-800">
							{T.apiKeyBanner}
						</span>
						<div className="flex shrink-0 items-center gap-2">
							<button
								type="button"
								onClick={openWelcomeGuide}
								className="text-[9px] font-black text-indigo-700 underline"
							>
								{T.setupGuideBtn}
							</button>
							<button
								type="button"
								onClick={openSettings}
								className="text-[9px] font-black text-indigo-600 underline"
							>
								{T.apiKeyBannerBtn}
							</button>
						</div>
					</div>
				) : null}

				{autoSummarizeEnabled && currentTabHost ? (
					<div className="space-y-1">
						<button
							type="button"
							onClick={handleBlockAutoForCurrentSite}
							disabled={isCurrentHostBlocked || isProcessing}
							className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-black text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isCurrentHostBlocked
								? T.blockAutoForSiteAlready
								: T.blockAutoForSiteBtn}
						</button>
						{blockSiteFeedback ? (
							<p className="text-center text-[9px] font-semibold text-emerald-700">
								{blockSiteFeedback}
							</p>
						) : null}
					</div>
				) : null}

				<div className={`flex ${autoSummarizeEnabled ? "gap-0" : "gap-2"}`}>
					<button
						type="button"
						onClick={() => void handleStartAnalysis()}
						disabled={isProcessing || autoSummarizeEnabled}
						className={`flex min-w-0 items-center justify-center gap-2 rounded-xl text-xs font-black transition-all duration-200 ${
							autoSummarizeEnabled
								? "w-0 max-w-0 flex-[0] overflow-hidden border-0 p-0 opacity-0"
								: "flex-[8] py-2.5"
						} ${
							isProcessing
								? "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none"
								: autoSummarizeEnabled
									? "pointer-events-none"
									: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95"
						}`}
					>
						<span className="truncate">
							{isProcessing ? T.processing : T.analyzeBtn}
						</span>
					</button>
					<button
						type="button"
						onClick={handleAutoSummarizeToggle}
						disabled={hasApiKey === false || isProcessing}
						className={`flex min-w-0 items-center justify-center rounded-xl px-2 py-2.5 text-[10px] font-black transition-all duration-200 active:scale-95 ${
							autoSummarizeEnabled ? "flex-1" : "flex-[2]"
						} ${
							autoSummarizeEnabled
								? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
								: "border border-slate-200 bg-white text-slate-500 shadow-none hover:border-slate-300 hover:bg-slate-50"
						} disabled:cursor-not-allowed disabled:opacity-40`}
						title={autoSummarizeEnabled ? T.autoOn : T.autoOff}
					>
						<span className="truncate">
							{autoSummarizeEnabled ? T.autoOn : T.autoOff}
						</span>
					</button>
				</div>
				{autoSummarizeEnabled ? (
					<p className="text-[9px] leading-snug text-slate-400">
						{T.autoComplianceNote}
					</p>
				) : null}
			</header>

			<main className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-4 custom-scrollbar">
				<div className="space-y-4">
					<AnimatePresence mode="wait">
						{isProcessing && (
							<motion.div
								layout
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.22 }}
								className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white px-5 py-6 shadow-[0_8px_30px_-12px_rgba(79,70,229,0.25)]"
							>
								<motion.div
									aria-hidden
									className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-linear-to-r from-transparent via-indigo-400/25 to-transparent"
									initial={{ x: "-110%" }}
									animate={{ x: ["-110%", "320%"] }}
									transition={{
										duration: 2.6,
										repeat: Infinity,
										ease: "linear",
									}}
									style={{ willChange: "transform" }}
								/>

								<div className="relative z-1">
									<div className="flex items-center justify-center gap-2.5 pb-6">
										{phases.map((_, dotIdx) => (
											<motion.span
												key={dotIdx}
												aria-hidden
												className={`h-1 rounded-full ${
													dotIdx <= phasedIdx ? "bg-indigo-600" : "bg-slate-200"
												}`}
												animate={{
													width: dotIdx === phasedIdx ? 22 : 6,
													opacity:
														dotIdx === phasedIdx
															? 1
															: dotIdx < phasedIdx
																? 0.7
																: 0.35,
												}}
												transition={{
													type: "spring",
													stiffness: 420,
													damping: 30,
												}}
											/>
										))}
									</div>

									<AnimatePresence mode="wait">
										<motion.div
											key={
												isWaitingOnModel ? `wait-${waitingHintIdx}` : phasedIdx
											}
											initial={{ opacity: 0, y: 6 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -6 }}
											transition={{ duration: 0.26 }}
											className="mb-8 text-center"
										>
											<p className="text-[13px] font-black uppercase tracking-[0.12em] text-indigo-800">
												{phases[phasedIdx].line}
											</p>
											<p className="mt-2 px-2 text-[10px] font-medium leading-relaxed text-slate-600">
												{isWaitingOnModel
													? activeWaitingHint
													: phases[phasedIdx].hint}
											</p>
										</motion.div>
									</AnimatePresence>

									<LoadingSnippetTypewriter
										snippets={loadingSnippets}
										language={language}
										label={T.loadingFromPage}
										cycleFast={isWaitingOnModel}
									/>

									<div className="mt-5 flex justify-center">
										<button
											type="button"
											onClick={handleCancelAnalysis}
											className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
										>
											{T.stopAnalysisBtn}
										</button>
									</div>
								</div>
							</motion.div>
						)}

						{!isProcessing && result ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								className="space-y-4 pb-8"
							>
								<SummaryResultView
									readRecommendation={result.readRecommendation}
									readReason={result.readReason}
									title={result.title}
									briefLines={result.briefLines}
									sourceTabUrl={result.sourceTabUrl}
									language={language}
									copyLabel={T.copySummary}
									copiedLabel={T.copiedSummary}
								/>

								<div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl">
									<div className="mb-3 border-b border-slate-800 pb-2">
										<div className="flex items-center justify-between">
											<span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
												{result.stats?.model || "Gemini"}
											</span>
											<div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
												<Clock size={10} />
												{T.statsSubtitle}
											</div>
										</div>
									</div>
									<div className="flex flex-col gap-1 text-[10px] font-bold">
										<div className="flex justify-between">
											<span className="text-slate-400">
												{T.statsSource}:{" "}
												<strong className="text-slate-200">
													{T.statsFromTab}
												</strong>
											</span>
											<span className="text-slate-400">
												{T.statsOutputCap}:{" "}
												<strong className="text-slate-200">
													{result.stats?.maxOutputTokensCap ?? "—"} tok
												</strong>
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">
												{T.statsBodyChars}:{" "}
												<strong className="text-emerald-400">
													{result.stats?.sentToModelChars ??
														result.stats?.originalLength}
													{bodyCharUnit(language)}
												</strong>
											</span>
											<span className="text-slate-400">
												{T.statsInputEst}:{" "}
												<strong className="text-slate-200">
													~
													{result.stats?.approxInputTokensHint ??
														Math.ceil(
															(result.stats?.originalLength || 0) / 4,
														)}{" "}
													tok
												</strong>
											</span>
										</div>
									</div>
								</div>
							</motion.div>
						) : (
							!isProcessing && (
								<div
									className={`flex flex-col items-center justify-center px-4 py-20 text-center ${
										hasApiKey === true && hasCompletedFirstSummary === false
											? "opacity-60"
											: "opacity-40"
									}`}
								>
									<FileText size={48} className="text-slate-300 mb-4" />
									{hasApiKey === false ? (
										<h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
											{T.setupEmptyHint}
										</h3>
									) : hasCompletedFirstSummary === false ? (
										<div className="max-w-[17rem] space-y-2">
											<h3 className="text-sm font-black text-slate-600">
												{T.readyEmptyTitle}
											</h3>
											<p className="text-xs font-medium leading-relaxed text-slate-500">
												{T.readyEmptyBody}
											</p>
											{autoSummarizeEnabled ? (
												<p className="text-[10px] font-medium leading-relaxed text-indigo-500/90">
													{T.readyEmptyAutoNote}
												</p>
											) : null}
										</div>
									) : (
										<p className="max-w-[17rem] text-xs font-medium leading-relaxed text-slate-500">
											{T.emptyHint}
										</p>
									)}
								</div>
							)
						)}
					</AnimatePresence>
				</div>
			</main>

			<footer className="shrink-0 border-t border-slate-100 bg-white px-3 py-2 text-center">
				<button
					type="button"
					onClick={openLegalPage}
					className="text-[9px] font-bold text-slate-400 underline hover:text-indigo-600"
				>
					{LEGAL_LINK[language]}
				</button>
			</footer>

			<ErrorDialog
				isOpen={errorDialog.isOpen}
				title={T.errDialogTitle}
				message={errorDialog.message}
				closeLabel={T.errDialogClose}
				onClose={() => setErrorDialog({ isOpen: false, message: "" })}
			/>
		</div>
	);
}

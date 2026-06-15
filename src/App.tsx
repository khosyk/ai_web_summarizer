import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ArrowRight,
  Activity,
  Clock,
  Settings,
} from 'lucide-react';
import { extractLoadingSnippets } from './extractLoadingSnippets';
import { LoadingSnippetTypewriter } from './components/LoadingSnippetTypewriter';
import { SummaryResultView } from './components/SummaryResultView';
import { ErrorDialog } from './components/ErrorDialog';
import { getGeminiApiKey, GEMINI_API_KEY_STORAGE_KEY } from './apiKeyStorage';
import { detectServiceLang } from './detectServiceLang';
import { getUiLanguage, setUiLanguage, UI_LANGUAGE_STORAGE_KEY } from './uiLanguageStorage';
import type { ServiceLang } from './privacyNotice';
import { summarizeArticle, MAX_INPUT_CHARS } from './geminiClient';
import {
  isErrorCode,
  resolveUserFacingError,
  WebSummaryError,
} from './userFacingError';
import { LEGAL_LINK } from './privacyNotice';
import { extensionIconUrl, openLegalPage } from './openLegalPage';

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
}

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Chinese', label: '中文' },
] as const;

type UiCopy = {
  title: string;
  analyzeBtn: string;
  statusReady: string;
  statusExtracting: string;
  statusRunning: string;
  statusDone: string;
  legalLink: string;
  emptyHint: string;
  errTabHttpOnly: string;
  errBodyTooShort: string;
  errExtractFailedFallback: string;
  errTabCommFallback: string;
  errTabRefreshRequired: string;
  errNoApiKey: string;
  errNotExtension: string;
  errDialogTitle: string;
  errDialogClose: string;
  statsSource: string;
  statsOutputCap: string;
  statsBodyChars: string;
  statsInputEst: string;
  statsFromTab: string;
  statsSubtitle: string;
  loadingFromPage: string;
  processing: string;
  settings: string;
  apiKeyBanner: string;
  apiKeyBannerBtn: string;
  setupGuideBtn: string;
  setupEmptyHint: string;
  inputTruncatedNote: string;
  copySummary: string;
  copiedSummary: string;
};

const TRANSLATIONS: Record<string, UiCopy> = {
  English: {
    title: 'Web Summary',
    analyzeBtn: 'Summarize this tab',
    statusReady: 'Ready',
    statusExtracting: 'Collecting tab text…',
    statusRunning: 'Summarizing…',
    statusDone: 'Done',
    legalLink: LEGAL_LINK.English,
    emptyHint: 'Open an article page and tap Summarize',
    errTabHttpOnly: 'Only http(s) pages can be summarized.',
    errBodyTooShort: 'Page text is too short. Try an article-like page.',
    errExtractFailedFallback: 'Could not extract page body.',
    errTabCommFallback: 'Could not talk to the tab. Refresh the page and try again.',
    errTabRefreshRequired:
      'Could not read this tab yet. Refresh the page once, then try again.',
    errNoApiKey: 'Add your Gemini API key in Settings first.',
    errNotExtension: 'Load this app as a Chrome extension (build dist/ and reload).',
    errDialogTitle: 'Something went wrong',
    errDialogClose: 'OK',
    statsSource: 'Source',
    statsOutputCap: 'Out cap',
    statsBodyChars: 'Body chars',
    statsInputEst: 'Input (est.)',
    statsFromTab: 'Current tab',
    statsSubtitle: 'Meta',
    loadingFromPage: 'From the page',
    processing: 'Summarizing with Gemini…',
    settings: 'Settings',
    apiKeyBanner: 'Setup required',
    apiKeyBannerBtn: 'Settings',
    setupGuideBtn: 'Setup guide',
    setupEmptyHint: 'Open the setup guide to continue.',
    inputTruncatedNote: `Long page — only the first ~${MAX_INPUT_CHARS.toLocaleString('en-US')} characters were sent.`,
    copySummary: 'Copy',
    copiedSummary: 'Copied',
  },
  Chinese: {
    title: '网页摘要',
    analyzeBtn: '摘要当前标签',
    statusReady: '就绪',
    statusExtracting: '正在采集标签页正文…',
    statusRunning: '摘要中…',
    statusDone: '完成',
    legalLink: LEGAL_LINK.Chinese,
    emptyHint: '打开文章页后点击摘要',
    errTabHttpOnly: '仅支持 http(s) 页面。',
    errBodyTooShort: '正文过短，请在类似文章页重试。',
    errExtractFailedFallback: '无法提取页面正文。',
    errTabCommFallback: '无法与标签页通信，请刷新后重试。',
    errTabRefreshRequired: '暂时无法读取当前标签，请先刷新页面后重试。',
    errNoApiKey: '请先在设置中填写 Gemini API 密钥。',
    errNotExtension: '请以 Chrome 扩展方式加载（构建 dist/ 后重新加载）。',
    errDialogTitle: '出错了',
    errDialogClose: '确定',
    statsSource: '来源',
    statsOutputCap: '输出上限',
    statsBodyChars: '正文长度',
    statsInputEst: '输入(估)',
    statsFromTab: '当前标签',
    statsSubtitle: '摘要信息',
    loadingFromPage: '页面摘取',
    processing: 'Gemini 摘要中…',
    settings: '设置',
    apiKeyBanner: '需要完成设置',
    apiKeyBannerBtn: '设置',
    setupGuideBtn: '设置指南',
    setupEmptyHint: '请打开设置指南继续。',
    inputTruncatedNote: `页面较长 — 仅发送了前约 ${MAX_INPUT_CHARS.toLocaleString('en-US')} 个字符。`,
    copySummary: '复制',
    copiedSummary: '已复制',
  },
};

const getT = (lang: string) => TRANSLATIONS[lang] ?? TRANSLATIONS.English;

const LOADING_PHASE_COPY: Record<string, Array<{ line: string; hint: string }>> = {
  English: [
    {
      line: 'Gathering body text',
      hint: 'Article-style pages work best; we may use broader visible text on other layouts.',
    },
    {
      line: 'Sizing to send',
      hint: `We cap what we send (about ${String(MAX_INPUT_CHARS)} chars from the top).`,
    },
    {
      line: 'Calling Gemini',
      hint: 'Uses your API key and Google’s generativelanguage endpoint.',
    },
    {
      line: 'Waiting on the model',
      hint: 'A good moment for a sip of tea.',
    },
  ],
  Chinese: [
    {
      line: '采集正文',
      hint: '文章页效果最好；非文章页可能使用更宽的可见正文。',
    },
    {
      line: '控制发送体量',
      hint: `从开头截取约最多 ${String(MAX_INPUT_CHARS)} 字符再发送。`,
    },
    {
      line: '调用 Gemini',
      hint: '使用您保存的 API 密钥请求 Google 接口。',
    },
    {
      line: '等待模型返回',
      hint: '可以稍微转移一下注意力。',
    },
  ],
};

function loadingPhasesFor(lang: string) {
  return LOADING_PHASE_COPY[lang] ?? LOADING_PHASE_COPY.English;
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
    files: ['content.js'],
  });
}

export default function App() {
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguageState] = useState<ServiceLang>(() => detectServiceLang());
  const [displayUrl, setDisplayUrl] = useState('');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [result, setResult] = useState<{
    readRecommendation: 'read' | 'skip';
    readReason: string;
    title: string;
    briefLines: string[];
    fullSummary: string;
    wasInputTruncated: boolean;
    stats: {
      originalLength: number;
      model?: string;
      sentToModelChars?: number;
      approxInputTokensHint?: number;
      maxOutputTokensCap?: number;
      source?: string;
    };
  } | null>(null);

  const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
  const [loadingSnippets, setLoadingSnippets] = useState<string[]>([]);
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  const T = getT(language);

  const setLanguage = (next: ServiceLang) => {
    setLanguageState(next);
    void setUiLanguage(next);
  };

  useEffect(() => {
    void getUiLanguage().then(setLanguageState);
  }, []);

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
      if (areaName !== 'local') return;
      if (GEMINI_API_KEY_STORAGE_KEY in changes) {
        syncApiKeyState();
      }
      if (UI_LANGUAGE_STORAGE_KEY in changes) {
        const next = changes[UI_LANGUAGE_STORAGE_KEY].newValue;
        if (next === 'English' || next === 'Chinese') {
          setLanguageState(next);
        }
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
      void chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
      return;
    }
    window.open('/welcome.html', '_blank', 'noopener,noreferrer');
  };

  const showError = (error: unknown) => {
    const { message, logDetail } = resolveUserFacingError(error, language);
    console.error('[Web Summary]', logDetail);
    setStatus(T.statusReady);
    setErrorDialog({ isOpen: true, message });
  };

  useEffect(() => {
    if (!isProcessing) {
      setLoadingPhaseIdx(0);
      return;
    }
    setLoadingPhaseIdx(0);
    const t1 = window.setTimeout(() => setLoadingPhaseIdx(1), 450);
    const t2 = window.setTimeout(() => setLoadingPhaseIdx(2), 2200);
    const t3 = window.setTimeout(() => setLoadingPhaseIdx(3), 4800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing) {
      setStatus(T.statusReady);
    }
  }, [language, isProcessing, T.statusReady]);

  const handleStartAnalysis = async () => {
    if (isProcessing) return;

    if (!isChromeExtension()) {
      showError(new WebSummaryError('E01'));
      return;
    }

    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      setHasApiKey(false);
      showError(new WebSummaryError('E02'));
      return;
    }
    setHasApiKey(true);

    setLoadingSnippets([]);
    setIsProcessing(true);
    setResult(null);
    setStatus(T.statusExtracting);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tabUrl = tab?.url ?? '';
      if (!tab?.id || !tabUrl.startsWith('http')) {
        throw new WebSummaryError('E03');
      }

      setDisplayUrl(tabUrl);

      await injectContentScript(tab.id);

      let data: ExtractPageDataResponse | undefined;
      let lastExtractError: unknown = null;
      for (let attempt = 0; attempt < TAB_EXTRACT_MAX_RETRY; attempt++) {
        try {
          data = (await chrome.tabs.sendMessage(tab.id, {
            action: 'EXTRACT_PAGE_DATA',
          })) as ExtractPageDataResponse | undefined;
          break;
        } catch (sendErr: unknown) {
          lastExtractError = sendErr;
          if (attempt < TAB_EXTRACT_MAX_RETRY - 1) {
            await sleepMs(220);
          }
        }
      }

      if (!data && lastExtractError) {
        if (isReceivingEndMissingError(lastExtractError)) {
          throw new WebSummaryError('E04', 'receiving_end_missing');
        }
        throw new WebSummaryError(
          'E07',
          lastExtractError instanceof Error
            ? lastExtractError.message
            : String(lastExtractError),
        );
      }

      if (!data || data.errorCode || data.error) {
        if (data?.errorCode && isErrorCode(data.errorCode)) {
          throw new WebSummaryError(data.errorCode, data.error);
        }
        throw new WebSummaryError('E05', data?.error);
      }

      const raw = (data.articleText ?? data.textContent ?? '').trim();
      if (raw.length < 48) {
        throw new WebSummaryError('E06');
      }

      const wasInputTruncated = raw.length > MAX_INPUT_CHARS;
      const articleText = raw.slice(0, MAX_INPUT_CHARS);
      setLoadingSnippets(
        extractLoadingSnippets(articleText, data.title),
      );
      setDisplayUrl(data.url || tabUrl);
      setStatus(T.statusRunning);

      const summary = await summarizeArticle({
        apiKey,
        language,
        articleTitle: data.title,
        articleText,
      });

      setResult({ ...summary, wasInputTruncated });
      setStatus(T.statusDone);
    } catch (e: unknown) {
      showError(e);
    } finally {
      setIsProcessing(false);
      setLoadingSnippets([]);
    }
  };

  const phases = loadingPhasesFor(language);
  const phasedIdx = Math.min(loadingPhaseIdx, phases.length - 1);
  const footerStatusText = isProcessing ? phases[phasedIdx].line : status;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-hidden">
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
            <div
              role="group"
              aria-label="Output language"
              className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  aria-pressed={language === lang.id}
                  className={`rounded-md px-2 py-1 text-[9px] font-black transition-all ${
                    language === lang.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
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
            <span className="text-[9px] font-bold text-amber-800">{T.apiKeyBanner}</span>
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

        <button
          onClick={() => void handleStartAnalysis()}
          disabled={isProcessing}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all shadow-lg active:scale-95 ${
            isProcessing
              ? 'cursor-not-allowed bg-slate-100 text-slate-400 shadow-none'
              : 'bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? T.processing : T.analyzeBtn}
          {!isProcessing && <ArrowRight size={16} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
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
                  initial={{ x: '-110%' }}
                  animate={{ x: ['-110%', '320%'] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ willChange: 'transform' }}
                />

                <div className="relative z-1">
                  <div className="flex items-center justify-center gap-2.5 pb-6">
                    {phases.map((_, dotIdx) => (
                      <motion.span
                        key={dotIdx}
                        aria-hidden
                        className={`h-1 rounded-full ${
                          dotIdx <= phasedIdx ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                        animate={{
                          width: dotIdx === phasedIdx ? 22 : 6,
                          opacity: dotIdx === phasedIdx ? 1 : dotIdx < phasedIdx ? 0.7 : 0.35,
                        }}
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phasedIdx}
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
                        {phases[phasedIdx].hint}
                      </p>
                      <p className="mt-2 truncate font-mono text-[9px] text-indigo-300/95">
                        {displayUrl}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <LoadingSnippetTypewriter
                    snippets={loadingSnippets}
                    language={language}
                    label={T.loadingFromPage}
                  />
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
                  fullSummary={result.fullSummary}
                  language={language}
                  copyLabel={T.copySummary}
                  copiedLabel={T.copiedSummary}
                />

                {result.wasInputTruncated ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800">
                    {T.inputTruncatedNote}
                  </p>
                ) : null}

                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl">
                  <div className="mb-3 border-b border-slate-800 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                        {result.stats?.model || 'Gemini'}
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
                        {T.statsSource}:{' '}
                        <strong className="text-slate-200">{T.statsFromTab}</strong>
                      </span>
                      <span className="text-slate-400">
                        {T.statsOutputCap}:{' '}
                        <strong className="text-slate-200">
                          {result.stats?.maxOutputTokensCap ?? '—'} tok
                        </strong>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {T.statsBodyChars}:{' '}
                        <strong className="text-emerald-400">
                          {result.stats?.sentToModelChars ?? result.stats?.originalLength}
                          {language === 'Chinese' ? ' 字' : ' chars'}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        {T.statsInputEst}:{' '}
                        <strong className="text-slate-200">
                          ~{result.stats?.approxInputTokensHint ?? Math.ceil((result.stats?.originalLength || 0) / 4)} tok
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : !isProcessing && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <FileText size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {hasApiKey === false ? T.setupEmptyHint : T.emptyHint}
                </h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] font-bold text-slate-400">
          <Activity
            size={10}
            className={isProcessing ? 'animate-pulse text-indigo-500' : 'text-slate-400'}
          />
          <span className="truncate">{footerStatusText}</span>
        </div>
        <button
          type="button"
          onClick={openLegalPage}
          className="shrink-0 text-[9px] font-black text-indigo-600 underline hover:text-indigo-700"
        >
          {T.legalLink}
        </button>
      </footer>

      <ErrorDialog
        isOpen={errorDialog.isOpen}
        title={T.errDialogTitle}
        message={errorDialog.message}
        closeLabel={T.errDialogClose}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}

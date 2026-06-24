import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ArrowRight,
  Clock,
  Settings,
} from 'lucide-react';
import { extractLoadingSnippets } from './extractLoadingSnippets';
import { LoadingSnippetTypewriter } from './components/LoadingSnippetTypewriter';
import { SummaryResultView } from './components/SummaryResultView';
import { ErrorDialog } from './components/ErrorDialog';
import { LanguagePicker } from './components/LanguagePicker';
import { getGeminiApiKey, GEMINI_API_KEY_STORAGE_KEY } from './apiKeyStorage';
import { detectServiceLang } from './detectServiceLang';
import { getUiLanguage, setUiLanguage, UI_LANGUAGE_STORAGE_KEY } from './uiLanguageStorage';
import type { ServiceLang } from './privacyNotice';
import { summarizeArticle, MAX_INPUT_CHARS } from './geminiClient';
import { isServiceLang } from './supportedLanguages';
import {
  isErrorCode,
  resolveUserFacingError,
  WebSummaryError,
} from './userFacingError';
import { extensionIconUrl } from './openLegalPage';
import { PRODUCT_DISPLAY_NAME } from './productBrand';

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
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

type AppSummaryResult = {
  sourceTabUrl: string;
  summaryLanguage: ServiceLang;
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
};

const TRANSLATIONS: Record<string, UiCopy> = {
  English: {
    title: PRODUCT_DISPLAY_NAME,
    analyzeBtn: 'Summarize this tab',
    languageChange: 'Change language',
    emptyHint: 'Open an article page and tap Summarize',
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
  Korean: {
    title: PRODUCT_DISPLAY_NAME,
    analyzeBtn: '이 탭 요약하기',
    languageChange: '언어 변경',
    emptyHint: '기사 페이지를 연 뒤 요약하기를 누르세요',
    errDialogTitle: '문제가 발생했습니다',
    errDialogClose: '확인',
    statsSource: '출처',
    statsOutputCap: '출력 상한',
    statsBodyChars: '본문 길이',
    statsInputEst: '입력(추정)',
    statsFromTab: '현재 탭',
    statsSubtitle: '메타',
    loadingFromPage: '페이지에서',
    processing: 'Gemini로 요약 중…',
    settings: '설정',
    apiKeyBanner: '설정 필요',
    apiKeyBannerBtn: '설정',
    setupGuideBtn: '설정 가이드',
    setupEmptyHint: '설정 가이드를 열어 계속 진행하세요.',
    inputTruncatedNote: `긴 페이지 — 앞부분 약 ${MAX_INPUT_CHARS.toLocaleString('en-US')}자만 전송했습니다.`,
    copySummary: '복사',
    copiedSummary: '복사됨',
  },
  Chinese: {
    title: PRODUCT_DISPLAY_NAME,
    analyzeBtn: '摘要当前标签',
    languageChange: '更改语言',
    emptyHint: '打开文章页后点击摘要',
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
  Korean: [
    {
      line: '본문 수집 중',
      hint: '기사형 페이지가 가장 잘 됩니다. 다른 레이아웃은 더 넓은 본문을 사용할 수 있습니다.',
    },
    {
      line: '전송 분량 조정',
      hint: `앞부분 약 ${String(MAX_INPUT_CHARS)}자까지만 보냅니다.`,
    },
    {
      line: 'Gemini 호출',
      hint: '저장된 API 키로 Google generativelanguage 엔드포인트를 사용합니다.',
    },
    {
      line: '모델 응답 대기',
      hint: '잠깐 여유를 가져도 좋습니다.',
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

const LOADING_WAIT_HINTS: Record<ServiceLang, string[]> = {
  English: [
    'Still waiting on the model…',
    'Long articles can take a few more seconds.',
    'Trying another model if the first one is busy.',
    'Packaging read/skip, three lines, and full summary.',
    'Your API key is calling Google from this browser.',
    'Almost there—hang tight.',
  ],
  Korean: [
    '모델 응답을 기다리는 중…',
    '긴 기사는 조금 더 걸릴 수 있어요.',
    '첫 모델이 바쁘면 다른 모델로 재시도합니다.',
    '읽기/건너뛰기·세 줄·전체 요약을 정리하고 있어요.',
    '브라우저에서 Google API로 직접 요청 중입니다.',
    '곧 완료됩니다. 잠시만 기다려 주세요.',
  ],
  Chinese: [
    '仍在等待模型返回…',
    '较长文章可能需要多几秒。',
    '若首个模型繁忙会尝试其他模型。',
    '正在整理读/跳过、三行与全文摘要。',
    '正在通过浏览器用您的密钥请求 Google。',
    '即将完成，请稍候。',
  ],
};

function bodyCharUnit(language: ServiceLang): string {
  if (language === 'Chinese') return ' 字';
  if (language === 'Korean') return '자';
  return ' chars';
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

/** 탭 본문 추출 — content.js가 있으면 재주입하지 않음 */
async function extractPageDataFromTab(
  tabId: number,
): Promise<ExtractPageDataResponse> {
  let contentScriptInjected = false;
  let lastExtractError: unknown = null;

  for (let attempt = 0; attempt < TAB_EXTRACT_MAX_RETRY; attempt++) {
    try {
      return (await chrome.tabs.sendMessage(tabId, {
        action: 'EXTRACT_PAGE_DATA',
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
      throw new WebSummaryError('E04', 'receiving_end_missing');
    }
    throw new WebSummaryError(
      'E07',
      lastExtractError instanceof Error
        ? lastExtractError.message
        : String(lastExtractError),
    );
  }

  throw new WebSummaryError('E05', 'extract_no_response');
}

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguageState] = useState<ServiceLang>(() => detectServiceLang());
  const [displayUrl, setDisplayUrl] = useState('');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [result, setResult] = useState<AppSummaryResult | null>(null);

  const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
  const [waitingHintIdx, setWaitingHintIdx] = useState(0);
  const [loadingSnippets, setLoadingSnippets] = useState<string[]>([]);
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  const T = getT(language);

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
        if (isServiceLang(next)) {
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

  const handleLanguageChange = (next: ServiceLang) => {
    setLanguageState(next);
    void setUiLanguage(next);
  };

  const showError = (error: unknown) => {
    const { message, logDetail } = resolveUserFacingError(error, language);
    console.error('[Web Summary]', logDetail);
    setErrorDialog({ isOpen: true, message });
  };

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
    waitingHints[waitingHintIdx % waitingHints.length] ?? phases[phasedIdx].hint;

  useEffect(() => {
    if (!isWaitingOnModel) return;
    const interval = window.setInterval(() => {
      setWaitingHintIdx((idx) => idx + 1);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [isWaitingOnModel, language]);

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

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tabUrl = tab?.url ?? '';
    if (!tab?.id || !tabUrl.startsWith('http')) {
      showError(new WebSummaryError('E03'));
      return;
    }

    if (
      result &&
      result.sourceTabUrl === tabUrl &&
      result.summaryLanguage === language
    ) {
      return;
    }

    setLoadingSnippets([]);
    setIsProcessing(true);
    setResult(null);

    try {
      setDisplayUrl(tabUrl);

      const data = await extractPageDataFromTab(tab.id);

      if (data.errorCode || data.error) {
        if (data.errorCode && isErrorCode(data.errorCode)) {
          throw new WebSummaryError(data.errorCode, data.error);
        }
        throw new WebSummaryError('E05', data.error);
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

      const summary = await summarizeArticle({
        apiKey,
        language,
        articleTitle: data.title,
        articleText,
      });

      setResult({
        ...summary,
        wasInputTruncated,
        sourceTabUrl: tabUrl,
        summaryLanguage: language,
      });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setIsProcessing(false);
      setLoadingSnippets([]);
    }
  };

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
                      key={isWaitingOnModel ? `wait-${waitingHintIdx}` : phasedIdx}
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
                        {isWaitingOnModel ? activeWaitingHint : phases[phasedIdx].hint}
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
                    cycleFast={isWaitingOnModel}
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
                          {bodyCharUnit(language)}
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

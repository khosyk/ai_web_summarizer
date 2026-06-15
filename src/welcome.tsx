import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  KeyRound,
  PanelRight,
  Puzzle,
  Settings,
  ShieldCheck,
  X,
  ZoomIn,
} from 'lucide-react';
import { detectServiceLang } from './detectServiceLang';
import { LEGAL_LINK, PRIVACY_DETAIL } from './privacyNotice';
import { openLegalPage } from './openLegalPage';
import './index.css';

const API_KEY_URL = 'https://aistudio.google.com/apikey';
const EXTENSION_LIST_NAME = 'A · Web Summary';

type Lang = 'English' | 'Chinese';

type GuideStep = {
  title: string;
  caption: string;
  image: string;
};

type WelcomeCopy = {
  welcome: string;
  subtitle: string;
  setupLabel: string;
  panelHero: string;
  readSkipHero: string;
  footer: string;
  step0Title: string;
  step0Desc: string;
  step0Btn: string;
  step0Pin1: string;
  step0Pin2: string;
  step0Pin3: string;
  step1Title: string;
  step1Desc: string;
  step1Btn: string;
  step2Title: string;
  step2Desc: string;
  step2Btn: string;
  step2Figcaption: string;
  step2Image: string;
  step3Title: string;
  step3Desc: string;
  imageZoomHint: string;
  guideSteps: GuideStep[];
};

type LightboxTarget = { src: string; alt: string };

const TRANSLATIONS: Record<Lang, WelcomeCopy> = {
  English: {
    welcome: 'Welcome',
    subtitle:
      'Too many tabs? Summarize the current one and get a read or skip verdict, a three-line summary, and a full summary—all from the side panel. Your API key stays in this browser only.',
    setupLabel: 'Setup · 4 steps',
    panelHero:
      'Start here: open the side panel first — it stays open while you get and save your API key.',
    readSkipHero:
      'After setup, tap Summarize on any article tab. Web Summary shows Worth reading or Skip for now (with a one-line reason), plus three-line and full summaries so you can triage tabs faster.',
    footer:
      'You can close this tab after setup. Reopen Settings anytime from the side panel.',
    step0Title: '1. Open the side panel',
    step0Desc:
      'Web Summary runs in Chrome’s side panel, not in this tab. Pin the extension, then open the panel.',
    step0Btn: 'Open side panel now',
    step0Pin1: 'Click the puzzle icon (Extensions) in the toolbar.',
    step0Pin2: `Pin “${EXTENSION_LIST_NAME}” — it is first in the A–Z list.`,
    step0Pin3: 'Click the pinned icon to open the side panel (or use the button above).',
    step1Title: '2. Get a Gemini API key',
    step1Desc: 'Create a free key at Google AI Studio.',
    step1Btn: 'Open API key page →',
    step2Title: '3. Save your key in Settings',
    step2Desc:
      'Open extension Settings (Options), paste your key, and tap Save.',
    step2Btn: 'Open Settings',
    step2Figcaption: 'Paste the copied key, tap Save, then return to the side panel.',
    step2Image: 'guide-step-4-paste-settings.png',
    step3Title: '4. Summarize any article tab',
    step3Desc:
      'With the side panel open, go to an http(s) article tab and tap Summarize this tab. You will see read or skip, three lines, and a full summary.',
    imageZoomHint: 'Click image to enlarge',
    guideSteps: [
      {
        title: 'Click Create API key',
        caption: 'Open Google AI Studio → API Key, then click Create API key (top right).',
        image: 'guide-step-1-api-page.png',
      },
      {
        title: 'Confirm key creation',
        caption: 'Name your key, pick a project, then confirm to generate it.',
        image: 'guide-step-2-create-key.png',
      },
      {
        title: 'Copy the key',
        caption:
          'Copy the full key. Do not share screenshots with the key visible.',
        image: 'guide-step-3-copy-key.png',
      },
    ],
  },
  Chinese: {
    welcome: '欢迎',
    subtitle:
      '标签太多？在侧边栏摘要当前页，获得「值得读 / 可跳过」判断、三行摘要与全文摘要。API 密钥仅保存在本浏览器。',
    setupLabel: '设置 · 4 步',
    panelHero: '从这里开始：先打开侧边栏——获取并保存 API 密钥时可保持侧边栏打开。',
    readSkipHero:
      '设置完成后，在任意文章页点击摘要。扩展会显示「值得读」或「可跳过」（附一句理由），以及三行与全文摘要，便于快速筛选标签。',
    footer: '设置完成后可关闭此标签。随时可从侧边栏打开设置。',
    step0Title: '1. 打开侧边栏',
    step0Desc: 'Web Summary 在 Chrome 侧边栏运行，而非本标签页。请先固定扩展，再打开侧边栏。',
    step0Btn: '立即打开侧边栏',
    step0Pin1: '点击工具栏中的拼图图标（扩展程序）。',
    step0Pin2: `固定「${EXTENSION_LIST_NAME}」——在 A–Z 列表中排在最前。`,
    step0Pin3: '点击固定后的图标打开侧边栏（或使用上方按钮）。',
    step1Title: '2. 获取 Gemini API 密钥',
    step1Desc: '在 Google AI Studio 创建免费密钥。',
    step1Btn: '打开 API 密钥页面 →',
    step2Title: '3. 在设置中保存密钥',
    step2Desc: '打开扩展设置（Options），粘贴密钥并点击保存。',
    step2Btn: '打开设置',
    step2Figcaption: '粘贴复制的密钥，点击 Save，然后返回侧边栏。',
    step2Image: 'guide-step-4-paste-settings.png',
    step3Title: '4. 摘要任意文章标签页',
    step3Desc:
      '保持侧边栏打开，切换到 http(s) 文章页，点击「摘要当前标签」。将看到读/跳过判断、三行摘要与全文摘要。',
    imageZoomHint: '点击图片放大查看',
    guideSteps: [
      {
        title: '点击 Create API key',
        caption: '打开 Google AI Studio → API Key，点击右上角 Create API key。',
        image: 'guide-step-1-api-page.png',
      },
      {
        title: '确认创建密钥',
        caption: '命名密钥、选择项目，然后确认生成。',
        image: 'guide-step-2-create-key.png',
      },
      {
        title: '复制密钥',
        caption: '复制完整密钥。请勿分享显示密钥的截图。',
        image: 'guide-step-3-copy-key.png',
      },
    ],
  },
};

function detectLang(): Lang {
  return detectServiceLang();
}

function welcomeAsset(filename: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(`welcome/${filename}`);
  }
  return `/welcome/${filename}`;
}

function openSidePanel() {
  if (typeof chrome === 'undefined' || !chrome.sidePanel?.open) return;
  chrome.windows.getCurrent((win) => {
    if (win?.id !== undefined) {
      void chrome.sidePanel.open({ windowId: win.id });
    }
  });
}

function openApiKeyGuide() {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url: API_KEY_URL });
    return;
  }
  window.open(API_KEY_URL, '_blank', 'noopener,noreferrer');
}

function openSettings() {
  if (typeof chrome !== 'undefined' && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
}

// 가이드 이미지 라이트박스
function ImageLightbox({
  target,
  onClose,
}: {
  target: LightboxTarget;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={target.alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X size={22} />
      </button>
      <img
        src={target.src}
        alt={target.alt}
        className="max-h-[90vh] max-w-[min(96vw,900px)] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function GuideImageThumb({
  image,
  alt,
  zoomHint,
  onOpen,
}: {
  image: string;
  alt: string;
  zoomHint: string;
  onOpen: () => void;
}) {
  const src = welcomeAsset(image);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mx-auto block w-full max-w-lg cursor-zoom-in"
      aria-label={`${alt} — ${zoomHint}`}
    >
      <img
        src={src}
        alt={alt}
        className="mx-auto h-48 w-full object-contain"
        loading="lazy"
      />
      <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-slate-900/65 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
        <ZoomIn size={10} />
        {zoomHint}
      </span>
    </button>
  );
}

function GuideImageCard({
  step,
  index,
  zoomHint,
  onOpenImage,
}: {
  step: GuideStep;
  index: number;
  zoomHint: string;
  onOpenImage: (target: LightboxTarget) => void;
}) {
  const alt = `${step.title} — step ${index + 1}`;
  return (
    <figure className="space-y-2">
      <GuideImageThumb
        image={step.image}
        alt={alt}
        zoomHint={zoomHint}
        onOpen={() => onOpenImage({ src: welcomeAsset(step.image), alt })}
      />
      <figcaption className="space-y-0.5">
        <p className="text-[11px] font-black text-slate-800">
          {index + 1}. {step.title}
        </p>
        <p className="text-[10px] leading-relaxed text-slate-500">{step.caption}</p>
      </figcaption>
    </figure>
  );
}

function WelcomePage() {
  const [language, setLanguage] = useState<Lang>(detectLang);
  const [lightbox, setLightbox] = useState<LightboxTarget | null>(null);
  const T = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      {lightbox ? (
        <ImageLightbox target={lightbox} onClose={() => setLightbox(null)} />
      ) : null}
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          <div className="flex gap-1.5">
            {(['English', 'Chinese'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all ${
                  language === lang
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {lang === 'Chinese' ? '中文' : 'English'}
              </button>
            ))}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
            {T.welcome}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Web Summary
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {T.setupLabel}
          </p>
          <p className="text-sm leading-relaxed text-slate-600">{T.subtitle}</p>
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-[11px] font-bold leading-relaxed text-indigo-900">
            {T.panelHero}
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-emerald-900">
            {T.readSkipHero}
          </div>
          <div className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
            <ShieldCheck
              size={14}
              className="mt-0.5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <div className="space-y-2">
              <p>{PRIVACY_DETAIL[language]}</p>
              <button
                type="button"
                onClick={openLegalPage}
                className="font-black text-indigo-600 underline hover:text-indigo-700"
              >
                {LEGAL_LINK[language]}
              </button>
            </div>
          </div>
        </header>

        <ol className="space-y-6">
          <li className="rounded-2xl border-2 border-indigo-300 bg-white p-5 shadow-md shadow-indigo-100">
            <div className="mb-4 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <PanelRight size={20} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900">{T.step0Title}</p>
                <p className="text-xs leading-relaxed text-slate-500">{T.step0Desc}</p>
                <button
                  type="button"
                  onClick={openSidePanel}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700"
                >
                  {T.step0Btn}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <ol className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-[11px] leading-relaxed text-slate-700">
              <li className="flex gap-2">
                <Puzzle size={14} className="mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                <span>{T.step0Pin1}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-indigo-600">A</span>
                <span>{T.step0Pin2}</span>
              </li>
              <li className="flex gap-2">
                <PanelRight size={14} className="mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                <span>{T.step0Pin3}</span>
              </li>
            </ol>
          </li>

          <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <KeyRound size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900">{T.step1Title}</p>
                <p className="text-xs text-slate-500">{T.step1Desc}</p>
                <button
                  type="button"
                  onClick={openApiKeyGuide}
                  className="text-xs font-black text-indigo-600 underline"
                >
                  {T.step1Btn}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {T.guideSteps.map((step, idx) => (
                <div key={step.image}>
                  <GuideImageCard
                    step={step}
                    index={idx}
                    zoomHint={T.imageZoomHint}
                    onOpenImage={setLightbox}
                  />
                </div>
              ))}
            </div>
          </li>

          <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Settings size={20} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900">{T.step2Title}</p>
                <p className="text-xs text-slate-500">{T.step2Desc}</p>
                <button
                  type="button"
                  onClick={openSettings}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                >
                  {T.step2Btn}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <figure className="space-y-2">
              <GuideImageThumb
                image={T.step2Image}
                alt={T.step2Figcaption}
                zoomHint={T.imageZoomHint}
                onOpen={() =>
                  setLightbox({
                    src: welcomeAsset(T.step2Image),
                    alt: T.step2Figcaption,
                  })
                }
              />
              <figcaption className="text-[10px] leading-relaxed text-slate-500">
                {T.step2Figcaption}
              </figcaption>
            </figure>
          </li>

          <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <PanelRight size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{T.step3Title}</p>
              <p className="text-xs leading-relaxed text-slate-500">{T.step3Desc}</p>
            </div>
          </li>
        </ol>

        <p className="text-center text-[11px] leading-relaxed text-slate-400">{T.footer}</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WelcomePage />
  </StrictMode>,
);

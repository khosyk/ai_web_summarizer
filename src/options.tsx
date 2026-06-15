import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiKeyForm } from './components/ApiKeyForm';
import { detectServiceLang } from './detectServiceLang';
import type { ServiceLang } from './privacyNotice';
import './index.css';

const API_KEY_URL = 'https://aistudio.google.com/apikey';

type OptionsCopy = {
  subtitle: string;
  footerBeforeLink: string;
  footerAfterLink: string;
};

const TRANSLATIONS: Record<ServiceLang, OptionsCopy> = {
  English: {
    subtitle: 'Your Gemini API key is stored locally in this browser only.',
    footerBeforeLink: 'Get a key at ',
    footerAfterLink: '. Summaries use your quota on the free or paid tier.',
  },
  Chinese: {
    subtitle: 'Gemini API 密钥仅保存在本浏览器。',
    footerBeforeLink: '在 ',
    footerAfterLink: ' 获取密钥。摘要将消耗免费或付费配额。',
  },
};

// Chrome 확장 options_ui (manifest options.html)
function OptionsPage() {
  const [language, setLanguage] = useState<ServiceLang>(detectServiceLang);
  const T = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <div>
          <h1 className="text-xl font-black text-slate-900">Web Summary</h1>
          <p className="mt-1 text-sm text-slate-500">{T.subtitle}</p>
        </div>

        <ApiKeyForm language={language} />

        <p className="text-[11px] leading-relaxed text-slate-400">
          {T.footerBeforeLink}
          <a
            href={API_KEY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            Google AI Studio
          </a>
          {T.footerAfterLink}
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsPage />
  </StrictMode>,
);

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiKeyForm } from './components/ApiKeyForm';
import { AutoBlocklistForm } from './components/AutoBlocklistForm';
import { detectServiceLang } from './detectServiceLang';
import { LEGAL_LINK, type ServiceLang } from './privacyNotice';
import { openLegalPage } from './openLegalPage';
import { getUiLanguage, UI_LANGUAGE_STORAGE_KEY } from './uiLanguageStorage';
import { isServiceLang } from './supportedLanguages';
import { PRODUCT_DISPLAY_NAME } from './productBrand';
import './index.css';

type OptionsCopy = {
  subtitle: string;
};

const TRANSLATIONS: Record<ServiceLang, OptionsCopy> = {
  English: {
    subtitle: 'Your Gemini API key is stored locally in this browser only.',
  },
  Korean: {
    subtitle: 'Gemini API 키는 이 브라우저에만 로컬로 저장됩니다.',
  },
  Chinese: {
    subtitle: 'Gemini API 密钥仅保存在本浏览器。',
  },
};

// Chrome 확장 options_ui (manifest options.html)
function OptionsPage() {
  const [language, setLanguage] = useState<ServiceLang>(detectServiceLang);
  const T = TRANSLATIONS[language];

  useEffect(() => {
    void getUiLanguage().then(setLanguage);

    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return;
      if (UI_LANGUAGE_STORAGE_KEY in changes) {
        const next = changes[UI_LANGUAGE_STORAGE_KEY].newValue;
        if (isServiceLang(next)) setLanguage(next);
      }
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">{PRODUCT_DISPLAY_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">{T.subtitle}</p>
        </div>

        <ApiKeyForm language={language} />

        <AutoBlocklistForm language={language} />

        <button
          type="button"
          onClick={openLegalPage}
          className="text-[11px] font-black text-indigo-600 underline hover:text-indigo-700"
        >
          {LEGAL_LINK[language]}
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsPage />
  </StrictMode>,
);

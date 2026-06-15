import { detectServiceLang } from './detectServiceLang';
import type { ServiceLang } from './privacyNotice';

export const UI_LANGUAGE_STORAGE_KEY = 'uiLanguage';

function isServiceLang(value: unknown): value is ServiceLang {
  return value === 'English' || value === 'Chinese';
}

/** 저장된 UI 언어 → 없으면 브라우저 언어 */
export async function getUiLanguage(): Promise<ServiceLang> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const data = await chrome.storage.local.get(UI_LANGUAGE_STORAGE_KEY);
    const stored = data[UI_LANGUAGE_STORAGE_KEY];
    if (isServiceLang(stored)) return stored;
  }
  return detectServiceLang();
}

/** 사이드패널 UI 언어 저장 */
export async function setUiLanguage(language: ServiceLang): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [UI_LANGUAGE_STORAGE_KEY]: language });
  }
}

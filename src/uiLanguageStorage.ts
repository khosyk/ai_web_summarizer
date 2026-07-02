import { detectServiceLang } from "./detectServiceLang";
import type { ServiceLang } from "./privacyNotice";
import { isServiceLang } from "./supportedLanguages";

export const UI_LANGUAGE_STORAGE_KEY = "uiLanguage";
export const AUTO_SUMMARIZE_STORAGE_KEY = "autoSummarizeEnabled";
export const FIRST_SUMMARY_COMPLETED_STORAGE_KEY = "hasCompletedFirstSummary";

const AUTO_SUMMARIZE_DEFAULT = false;

/** 저장된 UI 언어 → 없으면 브라우저 언어 */
export async function getUiLanguage(): Promise<ServiceLang> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		const data = await chrome.storage.local.get(UI_LANGUAGE_STORAGE_KEY);
		const stored = data[UI_LANGUAGE_STORAGE_KEY];
		if (isServiceLang(stored)) return stored;
	}
	return detectServiceLang();
}

/** 사이드패널·Welcome UI 언어 저장 */
export async function setUiLanguage(language: ServiceLang): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		await chrome.storage.local.set({ [UI_LANGUAGE_STORAGE_KEY]: language });
	}
}

/** 자동 요약 토글 (기본 OFF) */
export async function getAutoSummarizeEnabled(): Promise<boolean> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		const data = await chrome.storage.local.get(AUTO_SUMMARIZE_STORAGE_KEY);
		return data[AUTO_SUMMARIZE_STORAGE_KEY] === true;
	}
	return AUTO_SUMMARIZE_DEFAULT;
}

/** 자동 요약 토글 저장 */
export async function setAutoSummarizeEnabled(enabled: boolean): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		await chrome.storage.local.set({
			[AUTO_SUMMARIZE_STORAGE_KEY]: enabled,
		});
	}
}

/** 첫 요약 성공 여부 */
export async function getHasCompletedFirstSummary(): Promise<boolean> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		const data = await chrome.storage.local.get(
			FIRST_SUMMARY_COMPLETED_STORAGE_KEY,
		);
		return data[FIRST_SUMMARY_COMPLETED_STORAGE_KEY] === true;
	}
	return false;
}

/** 첫 요약 성공 기록 */
export async function setHasCompletedFirstSummary(): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		await chrome.storage.local.set({
			[FIRST_SUMMARY_COMPLETED_STORAGE_KEY]: true,
		});
	}
}

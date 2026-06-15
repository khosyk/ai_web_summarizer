export const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';

export async function getGeminiApiKey(): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const data = await chrome.storage.local.get(GEMINI_API_KEY_STORAGE_KEY);
    const stored = data[GEMINI_API_KEY_STORAGE_KEY];
    if (typeof stored === 'string' && stored.trim()) {
      return stored.trim();
    }
  }
  return null;
}

export async function setGeminiApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [GEMINI_API_KEY_STORAGE_KEY]: key.trim() });
}

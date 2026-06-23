import type { ServiceLang } from './privacyNotice';

export const SERVICE_LANGUAGES: ReadonlyArray<{
  id: ServiceLang;
  nativeLabel: string;
}> = [
  { id: 'English', nativeLabel: 'English' },
  { id: 'Korean', nativeLabel: '한국어' },
  { id: 'Chinese', nativeLabel: '中文' },
] as const;

export function isServiceLang(value: unknown): value is ServiceLang {
  return value === 'English' || value === 'Korean' || value === 'Chinese';
}

export const LANGUAGE_SECTION_ID = 'language';

export function getLanguageNativeLabel(id: ServiceLang): string {
  return SERVICE_LANGUAGES.find((lang) => lang.id === id)?.nativeLabel ?? 'English';
}

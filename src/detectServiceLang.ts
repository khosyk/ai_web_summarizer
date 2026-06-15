import type { ServiceLang } from './privacyNotice';

/** 브라우저 언어 → 서비스 UI 언어 (English / 中文) */
export function detectServiceLang(): ServiceLang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  return nav.startsWith('zh') ? 'Chinese' : 'English';
}

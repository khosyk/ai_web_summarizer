import type { ServiceLang } from './privacyNotice';

/** 브라우저 언어 → 기본 서비스 언어 */
export function detectServiceLang(): ServiceLang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav.startsWith('ko')) return 'Korean';
  if (nav.startsWith('zh')) return 'Chinese';
  return 'English';
}

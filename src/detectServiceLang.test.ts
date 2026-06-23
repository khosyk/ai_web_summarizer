import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectServiceLang } from './detectServiceLang';

describe('detectServiceLang', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns Korean when browser language starts with ko', () => {
    vi.stubGlobal('navigator', { language: 'ko-KR' });
    expect(detectServiceLang()).toBe('Korean');
  });

  it('returns Chinese when browser language starts with zh', () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' });
    expect(detectServiceLang()).toBe('Chinese');
  });

  it('returns English for other browser languages', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectServiceLang()).toBe('English');
  });
});

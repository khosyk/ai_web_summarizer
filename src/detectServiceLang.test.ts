import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectServiceLang } from './detectServiceLang';

describe('detectServiceLang', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns Chinese when browser language starts with zh', () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' });
    expect(detectServiceLang()).toBe('Chinese');
  });

  it('returns English for non-Chinese browser language', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectServiceLang()).toBe('English');
  });
});

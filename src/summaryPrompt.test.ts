import { describe, expect, it } from 'vitest';
import {
  buildLeanPrompt,
  buildSummaryFormatGuide,
  buildSystemInstructionForLang,
  langTag,
} from './summaryPrompt';

describe('langTag', () => {
  it('maps Chinese UI to zh', () => {
    expect(langTag('Chinese')).toBe('zh');
  });

  it('maps other UI languages to en', () => {
    expect(langTag('English')).toBe('en');
  });
});

describe('buildLeanPrompt', () => {
  it('includes language tag, title, and article content', () => {
    const prompt = buildLeanPrompt({
      language: 'English',
      title: 'Sample article',
      content: 'Body text here.',
    });

    expect(prompt).toContain('LANG=en');
    expect(prompt).toContain('T: Sample article');
    expect(prompt).toContain('Body text here.');
    expect(prompt).toContain('readRecommendation');
    expect(prompt).toContain('briefLines');
  });

  it('uses Chinese output instructions for Chinese UI', () => {
    const prompt = buildLeanPrompt({
      language: 'Chinese',
      title: '示例',
      content: '正文',
    });

    expect(prompt).toContain('LANG=zh');
    expect(prompt).toContain('OUTPUT_FIXED=zh-CN');
  });
});

describe('buildSummaryFormatGuide', () => {
  it('requires exactly three briefLines in English guide', () => {
    expect(buildSummaryFormatGuide('en')).toContain('exactly 3 strings');
  });
});

describe('buildSystemInstructionForLang', () => {
  it('requests JSON schema fields', () => {
    expect(buildSystemInstructionForLang('en')).toContain('readRecommendation');
    expect(buildSystemInstructionForLang('zh')).toContain('简体中文');
  });
});

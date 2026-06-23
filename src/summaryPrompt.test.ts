import { describe, expect, it } from 'vitest';
import {
  buildLeanPrompt,
  buildSystemInstructionForLang,
  langTag,
} from './summaryPrompt';

describe('langTag', () => {
  it('maps Chinese UI to zh', () => {
    expect(langTag('Chinese')).toBe('zh');
  });

  it('maps Korean UI to ko', () => {
    expect(langTag('Korean')).toBe('ko');
  });

  it('maps English UI to en', () => {
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
  });

  it('uses zh language tag for Chinese UI', () => {
    const prompt = buildLeanPrompt({
      language: 'Chinese',
      title: '示例',
      content: '正文',
    });

    expect(prompt).toContain('LANG=zh');
  });
});

describe('buildSystemInstructionForLang', () => {
  it('requests JSON schema fields', () => {
    expect(buildSystemInstructionForLang('en')).toContain('readRecommendation');
    expect(buildSystemInstructionForLang('zh')).toContain('简体中文');
    expect(buildSystemInstructionForLang('ko')).toContain('한국어');
  });
});

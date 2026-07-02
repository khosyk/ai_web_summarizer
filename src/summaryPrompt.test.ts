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
  it('uses English labels with output language code and article content', () => {
    const prompt = buildLeanPrompt({
      language: 'English',
      title: 'Sample article',
      content: 'Body text here.',
    });

    expect(prompt).toContain('OUTPUT_LANG=en');
    expect(prompt).toContain('TITLE: Sample article');
    expect(prompt).toContain('Body text here.');
    expect(prompt).not.toMatch(/한국어|简体中文/);
  });

  it('sets OUTPUT_LANG=zh for Chinese UI without non-English prompt labels', () => {
    const prompt = buildLeanPrompt({
      language: 'Chinese',
      title: '示例',
      content: '正文',
    });

    expect(prompt).toContain('OUTPUT_LANG=zh');
    expect(prompt).toContain('TITLE: 示例');
    expect(prompt).not.toMatch(/한국어|简体中文/);
  });
});

describe('buildSystemInstructionForLang', () => {
  it('keeps instructions in English for all output languages', () => {
    for (const L of ['en', 'ko', 'zh'] as const) {
      const instruction = buildSystemInstructionForLang(L);
      expect(instruction).toContain('readRecommendation');
      expect(instruction).not.toMatch(/한국어|简体中文|全部/);
    }
  });

  it('requests Korean output when L is ko', () => {
    expect(buildSystemInstructionForLang('ko')).toContain('Korean');
  });

  it('requests Simplified Chinese output when L is zh', () => {
    expect(buildSystemInstructionForLang('zh')).toContain('Simplified Chinese');
  });

  it('assigns editor role and one-sentence briefLines rules', () => {
    const instruction = buildSystemInstructionForLang('en');
    expect(instruction).toContain('reading-triage editor');
    expect(instruction).toContain('briefLines');
    expect(instruction).toContain('exactly one sentence');
    expect(instruction).not.toContain('fullSummary');
  });
});

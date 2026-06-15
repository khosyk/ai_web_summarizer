import { describe, expect, it } from 'vitest';
import {
  extractGeneratedTitleAndBody,
  pickSummaryDisplayTitle,
} from './summaryParse';

describe('pickSummaryDisplayTitle', () => {
  it('returns English fallback for empty scraped title', () => {
    expect(pickSummaryDisplayTitle('', false)).toBe('Untitled summary');
  });

  it('returns Chinese fallback when UI is Chinese and title is empty', () => {
    expect(pickSummaryDisplayTitle('untitled', true)).toBe('无标题摘要');
  });

  it('replaces Korean title with English fallback when UI is English', () => {
    expect(pickSummaryDisplayTitle('한국어 제목', false)).toBe('Untitled summary');
  });

  it('keeps Latin title when UI is English', () => {
    expect(pickSummaryDisplayTitle('Export policy update', false)).toBe(
      'Export policy update',
    );
  });

  it('replaces Hangul title with Chinese fallback when UI is Chinese', () => {
    expect(pickSummaryDisplayTitle('한국어 제목', true)).toBe('无标题摘要');
  });
});

describe('extractGeneratedTitleAndBody', () => {
  it('parses TITLE line and returns body', () => {
    const { displayTitle, summaryBody } = extractGeneratedTitleAndBody(
      'TITLE: Custom headline\n\nFirst paragraph.\nSecond line.',
      'Scraped',
      false,
    );

    expect(displayTitle).toBe('Custom headline');
    expect(summaryBody).toBe('First paragraph.\nSecond line.');
  });

  it('uses scraped title when TITLE line is absent', () => {
    const { displayTitle, summaryBody } = extractGeneratedTitleAndBody(
      'Summary without title prefix.',
      'Scraped headline',
      false,
    );

    expect(displayTitle).toBe('Scraped headline');
    expect(summaryBody).toBe('Summary without title prefix.');
  });

  it('returns Chinese empty-body fallback when response is blank', () => {
    const { displayTitle, summaryBody } = extractGeneratedTitleAndBody(
      '',
      '',
      true,
    );

    expect(displayTitle).toBe('无标题摘要');
    expect(summaryBody).toBe('（未返回概要正文，请重试。）');
  });
});

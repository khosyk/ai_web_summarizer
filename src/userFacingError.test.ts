import { describe, expect, it } from 'vitest';
import {
  resolveUserFacingError,
  userMessageForCode,
  webSummaryErrorFromGeminiResponse,
  WebSummaryError,
} from './userFacingError';

describe('webSummaryErrorFromGeminiResponse', () => {
  it('maps 401 to E11 invalid API key', () => {
    const error = webSummaryErrorFromGeminiResponse(401, undefined, 'Unauthorized');
    expect(error.code).toBe('E11');
  });

  it('maps 429 to E12 rate limit', () => {
    const error = webSummaryErrorFromGeminiResponse(
      429,
      { status: 'RESOURCE_EXHAUSTED' },
      'Too many requests',
    );
    expect(error.code).toBe('E12');
  });

  it('maps other HTTP errors to E13 service unavailable', () => {
    const error = webSummaryErrorFromGeminiResponse(503, undefined, 'Unavailable');
    expect(error.code).toBe('E13');
  });
});

describe('resolveUserFacingError', () => {
  it('returns localized message for WebSummaryError', () => {
    const resolved = resolveUserFacingError(
      new WebSummaryError('E02'),
      'English',
    );
    expect(resolved.message).toContain('Gemini API key');
    expect(resolved.logDetail).toContain('[E02]');
  });

  it('returns E99 for unknown errors', () => {
    const resolved = resolveUserFacingError(new Error('boom'), 'Chinese');
    expect(resolved.message).toBe('出了点问题，请再试一次。');
    expect(resolved.logDetail).toBe('boom');
  });
});

describe('userMessageForCode', () => {
  it('returns Chinese copy when UI language is Chinese', () => {
    expect(userMessageForCode('E03', 'Chinese')).toContain('http(s)');
  });
});

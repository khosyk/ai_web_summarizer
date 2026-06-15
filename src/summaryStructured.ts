import { pickSummaryDisplayTitle } from './summaryParse';
import { WebSummaryError } from './userFacingError';

export type ReadRecommendation = 'read' | 'skip';

/** Gemini structured output 스키마 */
export const GEMINI_SUMMARY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    readRecommendation: { type: 'string', enum: ['read', 'skip'] },
    readReason: { type: 'string' },
    title: { type: 'string' },
    briefLines: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
    fullSummary: { type: 'string' },
  },
  required: [
    'readRecommendation',
    'readReason',
    'title',
    'briefLines',
    'fullSummary',
  ],
} as const;

export type StructuredSummary = {
  readRecommendation: ReadRecommendation;
  readReason: string;
  title: string;
  briefLines: string[];
  fullSummary: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeLine(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReadRecommendation(value: unknown): ReadRecommendation {
  const raw = normalizeLine(value).toLowerCase();
  if (raw === 'skip') return 'skip';
  if (raw === 'read') return 'read';
  return 'read';
}

/** 모델이 ```json 펜스 등을 붙인 응답에서 객체 JSON만 추출 */
function normalizeRawJsonPayload(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

/** Gemini JSON 응답 → 구조화 요약 */
export function parseStructuredSummary(
  raw: string,
  scrapedTitle: string,
  langIsZh: boolean,
): StructuredSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizeRawJsonPayload(raw));
  } catch {
    throw new WebSummaryError('E10', 'invalid_json');
  }

  if (!isRecord(parsed)) {
    throw new WebSummaryError('E10', 'invalid_shape');
  }

  const readRecommendation = normalizeReadRecommendation(
    parsed.readRecommendation,
  );
  const readReason = normalizeLine(parsed.readReason);
  const titleRaw = normalizeLine(parsed.title);
  const fullSummary = normalizeLine(parsed.fullSummary);
  const briefRaw = parsed.briefLines;

  if (!readReason) {
    throw new WebSummaryError('E10', 'read_reason');
  }

  if (!Array.isArray(briefRaw)) {
    throw new WebSummaryError('E10', 'brief_lines');
  }

  const briefLines = briefRaw
    .map(normalizeLine)
    .filter((line) => line.length > 0)
    .slice(0, 3);

  if (briefLines.length !== 3) {
    throw new WebSummaryError('E10', 'brief_lines');
  }

  if (!fullSummary) {
    throw new WebSummaryError('E10', 'full_summary');
  }

  const title = titleRaw || pickSummaryDisplayTitle(scrapedTitle, langIsZh);

  return {
    readRecommendation,
    readReason,
    title,
    briefLines,
    fullSummary,
  };
}

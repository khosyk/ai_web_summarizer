export const ERROR_CODES = [
  'E01',
  'E02',
  'E03',
  'E04',
  'E05',
  'E06',
  'E07',
  'E10',
  'E11',
  'E12',
  'E13',
  'E99',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const USER_COPY: Record<ErrorCode, { en: string; ko: string; zh: string }> = {
  E01: {
    en: 'Load this app as a Chrome extension (build dist/ and reload).',
    ko: 'Chrome 확장으로 로드해 주세요(dist/ 빌드 후 다시 로드).',
    zh: '请以 Chrome 扩展方式加载（构建 dist/ 后重新加载）。',
  },
  E02: {
    en: 'Add your Gemini API key in Settings first.',
    ko: '먼저 설정에서 Gemini API 키를 입력해 주세요.',
    zh: '请先在设置中填写 Gemini API 密钥。',
  },
  E03: {
    en: 'Only http(s) pages can be summarized.',
    ko: 'http(s) 페이지만 요약할 수 있습니다.',
    zh: '仅支持 http(s) 页面。',
  },
  E04: {
    en: 'Could not read this tab yet. Refresh the page once, then try again.',
    ko: '아직 이 탭을 읽을 수 없습니다. 페이지를 한 번 새로고침한 뒤 다시 시도해 주세요.',
    zh: '暂时无法读取当前标签，请先刷新页面后重试。',
  },
  E05: {
    en: 'Could not extract page body.',
    ko: '페이지 본문을 추출하지 못했습니다.',
    zh: '无法提取页面正文。',
  },
  E06: {
    en: 'Page text is too short. Try an article-like page.',
    ko: '본문이 너무 짧습니다. 기사 형식 페이지에서 다시 시도해 주세요.',
    zh: '正文过短，请在类似文章页重试。',
  },
  E07: {
    en: 'Could not talk to the tab. Refresh the page and try again.',
    ko: '탭과 통신할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    zh: '无法与标签页通信，请刷新后重试。',
  },
  E10: {
    en: "We couldn't complete the summary. Please tap Summarize again.",
    ko: '요약을 완료하지 못했습니다. 다시 Summarize를 눌러 주세요.',
    zh: '暂时无法完成摘要，请再试一次。',
  },
  E11: {
    en: 'Your API key was rejected. Open Settings and enter a valid Gemini key.',
    ko: 'API 키가 거부되었습니다. 설정에서 올바른 Gemini 키를 입력해 주세요.',
    zh: 'API 密钥无效，请在设置中填写正确的 Gemini 密钥。',
  },
  E12: {
    en: 'Too many requests. Please wait a minute and try again.',
    ko: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    zh: '请求过于频繁，请稍候再试。',
  },
  E13: {
    en: 'The summary service is temporarily unavailable. Please try again in a moment.',
    ko: '요약 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    zh: '摘要服务暂时不可用，请稍后再试。',
  },
  E99: {
    en: 'Something went wrong. Please try again.',
    ko: '문제가 발생했습니다. 다시 시도해 주세요.',
    zh: '出了点问题，请再试一次。',
  },
};

export class WebSummaryError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, detail?: string) {
    super(detail ? `[${code}] ${detail}` : `[${code}]`);
    this.name = 'WebSummaryError';
    this.code = code;
  }
}

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

function messageLocale(language: string): 'en' | 'ko' | 'zh' {
  if (language === 'Chinese') return 'zh';
  if (language === 'Korean') return 'ko';
  return 'en';
}

export function userMessageForCode(
  code: ErrorCode,
  language: string,
): string {
  const copy = USER_COPY[code];
  return copy[messageLocale(language)];
}

type GeminiErrBody = {
  message?: string;
  code?: number;
  status?: string;
};

/** Gemini HTTP 응답 → E11/E12/E13 */
export function webSummaryErrorFromGeminiResponse(
  httpStatus: number,
  errObj: GeminiErrBody | undefined,
  fallbackDetail: string,
): WebSummaryError {
  const detail = errObj?.message ?? fallbackDetail;

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    errObj?.status === 'PERMISSION_DENIED' ||
    /API key|API_KEY|invalid.*key/i.test(detail)
  ) {
    return new WebSummaryError('E11', detail);
  }

  if (
    httpStatus === 429 ||
    errObj?.status === 'RESOURCE_EXHAUSTED' ||
    errObj?.code === 429
  ) {
    return new WebSummaryError('E12', detail);
  }

  return new WebSummaryError('E13', detail);
}

export type ResolvedUserError = {
  message: string;
  logDetail: string;
};

/** throw/catch된 값 → 사용자 문구 + console용 [Exx] detail */
export function resolveUserFacingError(
  error: unknown,
  language: string,
): ResolvedUserError {
  if (error instanceof WebSummaryError) {
    return {
      message: userMessageForCode(error.code, language),
      logDetail: error.message,
    };
  }

  const logDetail =
    error instanceof Error ? error.message : String(error);

  return {
    message: userMessageForCode('E99', language),
    logDetail,
  };
}

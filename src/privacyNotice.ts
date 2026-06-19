/** 서비스 언어: English / Chinese only */
export type ServiceLang = 'English' | 'Chinese';

/** 짧은 한 줄 (레거시·문서용) */
export const PRIVACY_SHORT: Record<ServiceLang, string> = {
  English:
    'No server · not saved · read/skip + summaries via your Gemini key (Google)',
  Chinese: '无服务端 · 不保存 · 读/跳过判断与摘要经您的 Gemini 密钥发送至 Google',
};

/** Legal & Privacy 전문 링크 라벨 */
export const LEGAL_LINK: Record<ServiceLang, string> = {
  English: 'Legal & Privacy',
  Chinese: '法律与隐私',
};

export const SUPPORT_EMAIL = 'thisistest20260619@gmail.com';

/** 상세 안내 (Welcome) */
export const PRIVACY_DETAIL: Record<ServiceLang, string> = {
  English:
    'Web Summary does not operate backend servers and does not collect, log, or store your browsing text, URLs, read/skip verdicts, or generated summaries. Data kept on your device: your Gemini API key (if saved in Settings) and your side panel UI language. When you run a summary, article text is sent directly from your browser to Google’s Gemini API using your key; Google’s terms and privacy policy apply. Results appear in the side panel only and are not persisted.',
  Chinese:
    'Web Summary 不运营后端服务器，不会收集、记录或保存您的浏览正文、URL、读/跳过判断或生成的摘要。本设备可能保存：您在设置中的 Gemini API 密钥，以及侧边栏界面语言。运行摘要时，正文会从浏览器直接发送至 Google Gemini API（使用您的密钥）；该处理受 Google 条款与隐私政策约束。结果仅在侧边栏显示，本扩展不会持久保存。',
};

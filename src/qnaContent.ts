import { SUPPORT_EMAIL } from './privacyNotice';

export type QnaItem = {
  id: string;
  question: string;
  answer: string;
  email?: string;
};

export type QnaCopy = {
  title: string;
  items: QnaItem[];
};

const QNA: Record<string, QnaCopy> = {
  English: {
    title: 'Q&A',
    items: [
      {
        id: 'api-key',
        question: 'Do I need my own Gemini API key?',
        answer:
          'Yes. Web Summary uses BYOK (bring your own key). Create a free key in Google AI Studio, then paste it in Settings. Summaries run from your browser directly to Google using your key.',
      },
      {
        id: 'create-key',
        question: 'How do I create a key? Do I need Google Cloud expertise?',
        answer:
          'Open Google AI Studio → API Key → Create API key. You can choose Create new project — no manual Cloud Console setup required. Copy the full key into extension Settings and tap Save.',
      },
      {
        id: 'free-tier',
        question: 'Is the API free? Any daily limits?',
        answer:
          'Google offers a free tier with per-project limits (requests per minute/day) that vary by model. This extension prefers gemini-2.5-flash-lite. Check usage in AI Studio if you see rate-limit errors.',
      },
      {
        id: 'privacy',
        question: 'What data is stored?',
        answer:
          'No Web Summary backend server. Your API key (if saved) and UI language stay in chrome.storage.local on this device. Summaries are not persisted — only shown in the side panel.',
      },
      {
        id: 'pages',
        question: 'Which pages can be summarized?',
        answer:
          'http(s) article-like pages work best. Summarize injects a script on demand to extract body text. If extraction fails, refresh the page once and try again.',
      },
      {
        id: 'read-skip',
        question: 'What do Read and Skip mean?',
        answer:
          'Read: three lines are not enough — keep the tab open. Skip: three lines are enough to decide — safe to close. The model picks based on the article, with a one-line reason.',
      },
      {
        id: 'errors',
        question: 'Too many requests or invalid key?',
        answer:
          'Invalid key (E11): fix it in Settings. Too many requests (E12): wait a minute or check AI Studio quota. Other errors: try another article page or Summarize again.',
      },
      {
        id: 'contact',
        question: 'Still have questions?',
        answer: 'Email us at',
        email: SUPPORT_EMAIL,
      },
    ],
  },
  Chinese: {
    title: '常见问题',
    items: [
      {
        id: 'api-key',
        question: '需要自己准备 Gemini API 密钥吗？',
        answer:
          '需要。本扩展为 BYOK（自带密钥）。请在 Google AI Studio 创建免费密钥，粘贴到设置中保存。摘要由浏览器直接使用您的密钥请求 Google。',
      },
      {
        id: 'create-key',
        question: '如何创建密钥？需要懂 Google Cloud 吗？',
        answer:
          '打开 Google AI Studio → API Key → Create API key。可选择 Create new project，无需手动配置 Cloud Console。复制完整密钥到扩展设置并保存。',
      },
      {
        id: 'free-tier',
        question: 'API 免费吗？有每日限制吗？',
        answer:
          'Google 提供免费额度，按项目限制每分钟/每日请求次数（因模型而异）。本扩展优先使用 gemini-2.5-flash-lite。若出现限流，请在 AI Studio 查看用量。',
      },
      {
        id: 'privacy',
        question: '会保存哪些数据？',
        answer:
          '无 Web Summary 后端服务器。API 密钥（若保存）与界面语言仅存于本机 chrome.storage.local。摘要不会持久保存，仅在侧边栏显示。',
      },
      {
        id: 'pages',
        question: '哪些页面可以摘要？',
        answer:
          'http(s) 文章类页面效果最佳。点击摘要时会按需注入脚本提取正文。若失败，请刷新页面后重试。',
      },
      {
        id: 'read-skip',
        question: '「值得读」和「可跳过」是什么意思？',
        answer:
          '值得读：三行摘要不够，建议继续阅读。可跳过：三行已足够判断，可关闭标签。模型会根据文章给出一句理由。',
      },
      {
        id: 'errors',
        question: '请求过多或密钥无效？',
        answer:
          '密钥无效（E11）：请在设置中更换。请求过多（E12）：稍候再试或查看 AI Studio 配额。其他错误：换一篇文章页或再次点击摘要。',
      },
      {
        id: 'contact',
        question: '仍有疑问？',
        answer: '请发送邮件至',
        email: SUPPORT_EMAIL,
      },
    ],
  },
};

/** UI 언어 → Q&A 복사 */
export function getQnaCopy(language: string): QnaCopy {
  return QNA[language] ?? QNA.English;
}

export const QNA_SECTION_ID = 'web-summary-qna';

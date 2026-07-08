/** 서비스 언어: UI + 요약 출력 */
export type ServiceLang = 'English' | 'Korean' | 'Chinese';

/** 짧은 한 줄 (레거시·문서용) */
export const PRIVACY_SHORT: Record<ServiceLang, string> = {
  English:
    'No server · not saved · your Gemini key → Google · see Legal for EU/copyright',
  Korean:
    '서버 없음 · 저장 안 함 · Gemini 키로 Google 직접 전송 · EU/저작권은 법률 페이지 참고',
  Chinese: '无服务端 · 不保存 · 您的 Gemini 密钥直连 Google · EU/版权见法律页面',
};

/** Legal & Privacy 전문 링크 라벨 */
export const LEGAL_LINK: Record<ServiceLang, string> = {
  English: 'Legal & Privacy',
  Korean: '법률 및 개인정보',
  Chinese: '法律与隐私',
};

export const SUPPORT_EMAIL = 'thisistest20260619@gmail.com';

/** 상세 안내 (Welcome) */
export const PRIVACY_DETAIL: Record<ServiceLang, string> = {
  English:
    'Web Summary does not operate backend servers and does not collect, log, or store your browsing text, URLs, read/skip verdicts, or generated summaries. Locally: your Gemini API key (if saved), UI language, Auto toggle, Auto excluded domains list, and first-summary flag. When you summarize, article text is sent from your browser to Google’s Gemini API using your key—you accept Google’s terms when you create the key. Unpaid (free) tier keys may allow Google to use API content for product improvement. If you are in the EEA, UK, or Switzerland, Google’s terms recommend a billing-enabled (Paid) project. Output may include translation when UI language differs from the article. Use only on pages you may process; summaries are AI-generated triage aids, not republication.',
  Korean:
    'Web Summary는 백엔드 서버를 운영하지 않으며, 브라우징 본문·URL·읽기/건너뛰기 판정·생성 요약을 수집·기록·저장하지 않습니다. 로컬 저장: Gemini API 키(선택), UI 언어, Auto 토글, Auto 제외 도메인 목록, 첫 요약 완료 여부. 요약 시 본문은 브라우저에서 사용자 키로 Google Gemini API에 직접 전송되며, 키 생성 시 Google 약관에 동의한 것입니다. 무료(Unpaid) tier 키는 Google이 API 콘텐츠를 제품 개선에 활용할 수 있습니다. EEA·영국·스위스 거주 시 Google 약관상 billing 연결(Paid) 프로젝트를 권장합니다. UI 언어와 기사 언어가 다르면 번역된 요약이 포함될 수 있습니다. 처리 권한이 있는 페이지에서만 사용하세요. 요약은 AI 생성 triage 보조이며 재배포용이 아닙니다.',
  Chinese:
    'Web Summary 不运营后端服务器，不会收集、记录或保存浏览正文、URL、读/跳过判断或生成的摘要。本地可能保存：Gemini API 密钥、界面语言、Auto 开关、Auto 排除域名列表及首次摘要标记。摘要时正文由浏览器经您的密钥直接发送至 Google Gemini API；创建密钥即表示您接受 Google 条款。免费（Unpaid）额度下 Google 可能将 API 内容用于产品改进。若位于 EEA、英国或瑞士，Google 条款建议使用已启用 billing 的（Paid）项目。界面语言与文章语言不同时，输出可能含翻译。请仅在有权处理的页面上使用；摘要为 AI 生成的浏览辅助，非再发布工具。',
};

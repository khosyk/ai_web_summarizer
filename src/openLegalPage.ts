/** 확장 아이콘 URL (개발·빌드 공통) */
export function extensionIconUrl(size: 16 | 48 | 128 = 48): string {
  const iconPath = `icons/icon-${size}.png`;
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(iconPath);
  }
  return `/${iconPath}`;
}

/** public/legal.html → dist/legal.html (welcome과 동일 빌드) */
export function openLegalPage(): void {
  const url =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('legal.html')
      : '/legal.html';

  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

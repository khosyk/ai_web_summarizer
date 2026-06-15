// 아이콘 클릭 시 사이드바를 열어주는 백그라운드 서비스 워커
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Web Summary] service worker installed', details.reason);

  if (details.reason === 'install') {
    void chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html'),
    });
  }
});

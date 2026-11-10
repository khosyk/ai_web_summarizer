// MV3 확장 페이지는 인라인 스크립트를 막으므로 별도 파일로 둠
(function () {
  var buttons = document.querySelectorAll('.lang-bar button');
  var en = document.getElementById('lang-en');
  var ko = document.getElementById('lang-ko');
  var zh = document.getElementById('lang-zh');
  var navLang = (navigator.language || '').toLowerCase();
  var initial = navLang.startsWith('zh')
    ? 'zh'
    : navLang.startsWith('ko')
      ? 'ko'
      : 'en';

  function setLang(lang) {
    en.hidden = lang !== 'en';
    ko.hidden = lang !== 'ko';
    zh.hidden = lang !== 'zh';
    buttons.forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.documentElement.lang =
      lang === 'zh' ? 'zh-Hans' : lang === 'ko' ? 'ko' : 'en';
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'));
    });
  });

  setLang(initial);
})();

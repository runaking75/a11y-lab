/* ═══════════════════════════════════════
   A11y Lab — Common (공통 헤더)
   모든 HTML이 루트에 있으므로 경로 단순
   ═══════════════════════════════════════ */

var Common = {
  nav: [
    { href: 'index.html',     label: '홈',         key: 'home' },
    { href: 'dict.html',      label: 'ARIA 사전',   key: 'dict' },
    { href: 'challenge.html', label: '코드 챌린지',  key: 'challenge' },
    { href: 'quiz.html',      label: '퀴즈',        key: 'quiz' },
    { href: 'audit.html',     label: '검수 사례',    key: 'audit' }
  ],

  init: function(activeKey) {
    this.renderHeader(activeKey);
  },

  renderHeader: function(activeKey) {
    var header = document.getElementById('site-header');
    if (!header) return;

    var navHtml = this.nav.map(function(item) {
      var cls = item.key === activeKey ? ' class="is-active"' : '';
      return '<a href="' + item.href + '"' + cls + '>' + item.label + '</a>';
    }).join('');

    header.innerHTML =
      '<a class="al-header__logo" href="index.html">' +
        '<div class="al-header__logo-icon">A</div>' +
        'A11y Lab' +
      '</a>' +
      '<nav class="al-header__nav">' + navHtml + '</nav>';
  }
};

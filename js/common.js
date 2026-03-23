/* ═══════════════════════════════════════
   A11y Lab — Common
   데스크탑: 헤더 nav + 사이드바 분리
   모바일: 햄버거(GNB) + 사이드바→필터 바
   ═══════════════════════════════════════ */

var Common = {
  nav: [
    { href: 'index.html',     label: '홈',         key: 'home' },
    { href: 'aria.html',      label: 'ARIA 사전',   key: 'dict' },
    { href: 'challenge.html', label: '코드 챌린지',  key: 'challenge' },
    { href: 'quiz.html',      label: '퀴즈',        key: 'quiz' },
    { href: '',               label: '검수 사례',    key: 'audit', disabled: true }
  ],

  init: function(activeKey) {
    this.renderHeader(activeKey);
  },

  renderHeader: function(activeKey) {
    var header = document.getElementById('site-header');
    if (!header) return;

    var navItems = this.nav.filter(function(item) { return item.key !== 'home'; });

    var navHtml = navItems.map(function(item) {
      if (item.disabled) {
        return '<span class="is-disabled">' + item.label + '</span>';
      }
      if (item.key === activeKey) {
        return '<span class="is-active" aria-current="page">' + item.label + '</span>';
      }
      return '<a href="' + item.href + '">' + item.label + '</a>';
    }).join('');

    header.innerHTML =
      '<a class="al-header__logo" href="index.html">' +
        '<div class="al-header__logo-icon">A</div>' +
        'A11y Lab' +
      '</a>' +
      '<nav class="al-header__nav" aria-label="메인 메뉴">' + navHtml + '</nav>' +
      '<button type="button" class="al-hamburger" id="al-hamburger" aria-label="메뉴 열기" aria-expanded="false">' +
        '<span class="al-hamburger__bar"></span>' +
        '<span class="al-hamburger__bar"></span>' +
        '<span class="al-hamburger__bar"></span>' +
      '</button>';

    // 오버레이 + 패널
    var overlay = document.createElement('div');
    overlay.className = 'al-overlay';
    overlay.id = 'al-overlay';

    var panel = document.createElement('div');
    panel.className = 'al-mobile-panel';
    panel.id = 'al-mobile-panel';
    panel.setAttribute('aria-label', '메뉴');

    panel.innerHTML =
      '<div class="al-mobile-panel__header">' +
        '<a class="al-header__logo" href="index.html">' +
          '<div class="al-header__logo-icon">A</div>' +
          'A11y Lab' +
        '</a>' +
        '<button type="button" class="al-mobile-panel__close" id="al-panel-close" aria-label="메뉴 닫기">✕</button>' +
      '</div>' +
      '<nav class="al-mobile-panel__nav" aria-label="메인 메뉴">' +
        this.nav.filter(function(item) { return item.key !== 'home'; }).map(function(item) {
          if (item.disabled) {
            return '<span class="is-disabled">' + item.label + '</span>';
          }
          if (item.key === activeKey) {
            return '<span class="is-active" aria-current="page">' + item.label + '</span>';
          }
          return '<a href="' + item.href + '">' + item.label + '</a>';
        }).join('') +
      '</nav>';

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    var hamburger = document.getElementById('al-hamburger');
    var closeBtn = document.getElementById('al-panel-close');

    hamburger.addEventListener('click', function() { Common.openPanel(); });
    closeBtn.addEventListener('click', function() { Common.closePanel(); });
    overlay.addEventListener('click', function() { Common.closePanel(); });
  },

  openPanel: function() {
    document.getElementById('al-overlay').classList.add('is-open');
    document.getElementById('al-mobile-panel').classList.add('is-open');
    document.getElementById('al-hamburger').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  },

  closePanel: function() {
    document.getElementById('al-overlay').classList.remove('is-open');
    document.getElementById('al-mobile-panel').classList.remove('is-open');
    document.getElementById('al-hamburger').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  scToUrl: function(sc) {
    var base = 'https://runaking75.github.io/a11y-playground/';
    var parts = sc.split(' ');
    var std = parts[0];
    var num = parts[1];
    if (!num) return null;
    var dashed = num.replace(/\./g, '-');
    var principle = num.split('.')[0];
    if (std === 'WCAG') return base + '#wcag22-' + principle + ':sc-' + dashed;
    if (std === 'KWCAG') return base + '#kwcag22-' + principle + ':sc-' + dashed;
    if (std === '모바일') return base + '#mobile-' + principle + ':sc-' + dashed;
    return null;
  },

  scToLink: function(sc) {
    var url = this.scToUrl(sc);
    if (url) return '<a href="' + url + '" target="_blank" class="sc-link">' + sc + '</a>';
    return '<span>' + sc + '</span>';
  }
};

/* ═══════════════════════════════════════
   A11y Lab — ARIA 사전
   사이드바: 항상 표시 (검색 + 필터 + 속성 목록)
   메인: 목록(테이블) 또는 상세
   ═══════════════════════════════════════ */

var Dict = {
  indexData: [],
  filtered: [],
  activeCategory: '',
  activeType: '',
  searchQuery: '',
  currentId: null,

  categories: [
    { key: '', label: '전체' },
    { key: 'widget', label: 'Widget' },
    { key: 'liveRegion', label: 'Live Region' },
    { key: 'relationship', label: '관계' },
    { key: 'dragDrop', label: 'D&D' }
  ],

  types: [
    { key: 'role', label: 'Role' },
    { key: 'state', label: 'State' },
    { key: 'property', label: 'Property' }
  ],

  init: function() {
    var self = this;

    fetch('data/dict/index.json')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        self.indexData = d;
        self.filtered = d;
        self.renderLayout();
        self.onRoute();
        window.addEventListener('hashchange', function() { self.onRoute(); });
      });
  },

  onRoute: function() {
    var hash = location.hash.replace('#', '');
    this.currentId = hash || null;
    this.updateSidebarActive();

    if (hash) {
      this.loadDetail(hash);
    } else {
      this.renderTable();
    }
  },

  /* ═══════════════════
     공통 레이아웃 (1회)
     ═══════════════════ */
  renderLayout: function() {
    var container = document.getElementById('dict-content');
    if (!container) return;
    var self = this;

    container.innerHTML =
      '<div class="al-layout">' +
        '<aside class="al-sidebar" id="dict-sidebar">' +
          '<div class="al-sidebar__title">ARIA 사전</div>' +
          '<input class="al-sidebar__search" type="text" placeholder="속성명 검색..." id="dict-search">' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label">카테고리</div>' +
            '<div class="al-chips" id="dict-cat"></div>' +
          '</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label">유형</div>' +
            '<div class="al-chips" id="dict-type"></div>' +
          '</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label">속성 목록</div>' +
            '<div id="dict-nav-list"></div>' +
          '</div>' +
        '</aside>' +
        '<main class="al-main" id="dict-main"></main>' +
      '</div>';

    // 칩 렌더링
    document.getElementById('dict-cat').innerHTML = this.categories.map(function(c) {
      return '<span class="al-chip' + (c.key === self.activeCategory ? ' is-active' : '') + '" data-cat="' + c.key + '">' + c.label + '</span>';
    }).join('');

    document.getElementById('dict-type').innerHTML = this.types.map(function(t) {
      return '<span class="al-chip' + (t.key === self.activeType ? ' is-active' : '') + '" data-type="' + t.key + '">' + t.label + '</span>';
    }).join('');

    // 속성 목록 (사이드바 내비)
    this.renderSidebarNav();

    // 이벤트
    document.getElementById('dict-search').addEventListener('input', function() {
      self.searchQuery = this.value.toLowerCase();
      self.applyFilter();
    });

    document.getElementById('dict-cat').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeCategory = chip.dataset.cat;
      // 칩 상태 갱신
      this.querySelectorAll('.al-chip').forEach(function(c) {
        c.classList.toggle('is-active', c.dataset.cat === self.activeCategory);
      });
      self.applyFilter();
    });

    document.getElementById('dict-type').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeType = self.activeType === chip.dataset.type ? '' : chip.dataset.type;
      this.querySelectorAll('.al-chip').forEach(function(c) {
        c.classList.toggle('is-active', c.dataset.type === self.activeType);
      });
      self.applyFilter();
    });
  },

  renderSidebarNav: function() {
    var navList = document.getElementById('dict-nav-list');
    if (!navList) return;
    var self = this;

    navList.innerHTML = this.filtered.map(function(item) {
      var isActive = item.id === self.currentId;
      return '<a href="#' + item.id + '" class="al-sidebar__item' + (isActive ? ' is-active' : '') + '">' +
        '<span class="al-sidebar__item-name">' + item.id + '</span>' +
        '<span class="al-sidebar__item-desc">' + item.nameKo + '</span>' +
      '</a>';
    }).join('');
  },

  updateSidebarActive: function() {
    var items = document.querySelectorAll('.al-sidebar__item');
    var self = this;
    items.forEach(function(el) {
      var id = el.getAttribute('href').replace('#', '');
      el.classList.toggle('is-active', id === self.currentId);
    });
  },

  applyFilter: function() {
    var self = this;
    this.filtered = this.indexData.filter(function(item) {
      if (self.activeCategory && item.category !== self.activeCategory) return false;
      if (self.activeType && item.type !== self.activeType) return false;
      if (self.searchQuery) {
        return item.id.toLowerCase().indexOf(self.searchQuery) > -1 ||
               item.nameKo.indexOf(self.searchQuery) > -1;
      }
      return true;
    });
    this.renderSidebarNav();
    // 목록 뷰일 때만 테이블 갱신
    if (!this.currentId) this.renderTable();
  },

  /* ═══════════════════
     메인: 목록 (테이블)
     ═══════════════════ */
  renderTable: function() {
    var main = document.getElementById('dict-main');
    if (!main) return;

    var h = '<div class="dict-count"><strong>' + this.filtered.length + '</strong>개 속성</div>' +
      '<table class="dict-table"><thead><tr>' +
        '<th style="width:28%">속성</th>' +
        '<th style="width:36%">설명</th>' +
        '<th class="is-center" style="width:14%">유형</th>' +
        '<th class="is-center" style="width:22%">스크린리더 지원</th>' +
      '</tr></thead><tbody>';

    h += this.filtered.map(function(item) {
      var typeLabel = item.type === 'property' ? 'Property' : item.type === 'state' ? 'State' : 'Role';
      var dots = ['jaws','nvda','voiceover','talkback'].map(function(k) {
        var s = item.support[k] || 'none';
        return '<span class="al-dot al-dot--' + (s === 'full' ? 'full' : s === 'partial' ? 'partial' : 'none') + '"></span>';
      }).join('');

      return '<tr onclick="location.hash=\'' + item.id + '\'">' +
        '<td><span class="dict-table__name">' + item.id + '</span></td>' +
        '<td><span class="dict-table__desc">' + item.nameKo + '</span></td>' +
        '<td style="text-align:center"><span class="al-badge al-badge--' + item.type + '">' + typeLabel + '</span></td>' +
        '<td><div class="al-dots">' + dots + '</div></td></tr>';
    }).join('');

    h += '</tbody></table>';
    main.innerHTML = h;
  },

  /* ═══════════════════
     메인: 상세
     ═══════════════════ */
  loadDetail: function(id) {
    var self = this;
    var main = document.getElementById('dict-main');

    fetch('data/dict/' + id + '.json')
      .then(function(r) {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(function(item) { self.renderDetail(item); })
      .catch(function() {
        main.innerHTML = '<div class="page-placeholder">속성을 찾을 수 없습니다.</div>';
      });
  },

  renderDetail: function(item) {
    var main = document.getElementById('dict-main');
    if (!main) return;

    var typeLabel = item.type === 'property' ? 'Property' : item.type === 'state' ? 'State' : 'Role';
    var catMap = { widget:'Widget 속성', liveRegion:'Live Region', relationship:'관계 속성', dragDrop:'D&D' };

    // 이전/다음
    var idx = -1;
    for (var i = 0; i < this.indexData.length; i++) {
      if (this.indexData[i].id === item.id) { idx = i; break; }
    }
    var prev = idx > 0 ? this.indexData[idx - 1] : null;
    var next = idx < this.indexData.length - 1 ? this.indexData[idx + 1] : null;

    var h = '<div class="dict-detail--inner">';

    // 타이틀
    h += '<h1 class="dict-detail__title">' + item.id + '</h1>';
    h += '<div class="dict-detail__badges">' +
      '<span class="al-badge al-badge--' + item.type + '">' + typeLabel + '</span>' +
      '<span class="al-badge al-badge--neutral">' + (catMap[item.category] || item.category) + '</span></div>';
    h += '<p class="dict-detail__desc">' + item.descriptionKo + '</p>';

    // 속성 정보
    h += '<div class="dict-section"><div class="dict-section__title">속성 정보</div><div class="dict-meta">' +
      this._meta('값 유형', item.valueType) +
      this._meta('기본값', item.defaultValue) +
      this._meta('적용 대상', item.applicableTo.join(', ')) +
      this._meta('관련 속성', item.relatedAttrs.map(function(a) { return '<code>' + a + '</code>'; }).join(' ')) +
    '</div></div>';

    // 코드 예시
    h += '<div class="dict-section"><div class="dict-section__title">코드 예시</div><div class="code-pair">' +
      this._code('good', item.codeExamples.good) + this._code('bad', item.codeExamples.bad) +
    '</div></div>';

    // 발화
    var sp = item.screenReaderSpeech;
    var sr = item.screenReaderSupport;
    h += '<div class="dict-section"><div class="dict-section__title">스크린리더 발화</div>' +
      '<div class="speech-context">' + sp.context + '</div><div class="speech-grid">' +
      this._speech('JAWS', sr.jaws.version, sp.jaws) +
      this._speech('NVDA', sr.nvda.version, sp.nvda) +
      this._speech('VoiceOver', sr.voiceover.version, sp.voiceover) +
      this._speech('TalkBack', sr.talkback.version, sp.talkback) +
    '</div></div>';

    // 지원 현황
    h += '<div class="dict-section"><div class="dict-section__title">스크린리더 지원 현황</div><div class="support-grid">' +
      this._support('JAWS', sr.jaws) + this._support('NVDA', sr.nvda) +
      this._support('VoiceOver', sr.voiceover) + this._support('TalkBack', sr.talkback) +
    '</div></div>';

    // WCAG SC
    h += '<div class="dict-section"><div class="dict-section__title">관련 WCAG SC</div><div class="sc-tags">' +
      item.wcagSC.map(function(sc) {
        return '<a class="sc-tag" href="https://runaking75.github.io/a11y-playground/#wcag-' + sc.id + '" target="_blank">' +
          sc.id + ' ' + sc.name + ' (' + sc.level + ')</a>';
      }).join('') + '</div></div>';

    // 참고
    if (item.notes) {
      h += '<div class="dict-section" style="border-top:none;padding-top:0">' +
        '<p class="dict-note">' + item.notes + '</p>' +
        '<a class="dict-spec-link" href="' + item.specUrl + '" target="_blank">WAI-ARIA 1.2 스펙 보기 ↗</a></div>';
    }

    // 이전/다음
    h += '<div class="dict-nav">';
    h += prev ? '<a href="#' + prev.id + '">← ' + prev.id + '</a>' : '<span></span>';
    h += next ? '<a href="#' + next.id + '">' + next.id + ' →</a>' : '<span></span>';
    h += '</div></div>';

    main.innerHTML = h;
    window.scrollTo(0, 0);
  },

  /* ── Helpers ── */
  _meta: function(k, v) {
    return '<div class="dict-meta__row"><span class="dict-meta__key">' + k + '</span><span class="dict-meta__val">' + v + '</span></div>';
  },
  _code: function(type, ex) {
    var cls = type === 'good' ? 'code-block__head--good' : 'code-block__head--bad';
    var hlCls = type === 'good' ? 'hl-good' : 'hl-bad';
    var code = ex.html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    code = code.replace(/(aria-[\w-]+="[^"]*")/g, '<span class="' + hlCls + '">$1</span>');
    if (type === 'good') code = code.replace(/(id="[^"]*")/g, '<span class="hl-good">$1</span>');
    return '<div class="code-block"><div class="code-block__head ' + cls + '">' + (type === 'good' ? 'Good' : 'Bad') + '</div>' +
      '<div class="code-block__body">' + code + '</div>' +
      '<div class="code-block__note">' + ex.description + '</div></div>';
  },
  _speech: function(name, ver, text) {
    return '<div class="speech-card"><div class="speech-card__label">' + name + ' ' + ver + '</div><div class="speech-card__text">' + text + '</div></div>';
  },
  _support: function(name, info) {
    var cls = info.support === 'full' ? 'full' : info.support === 'partial' ? 'partial' : 'none';
    return '<div class="support-card"><div class="support-card__name">' + name + '</div><div><span class="support-card__icon support-card__icon--' + cls + '"></span></div><div class="support-card__version">' + info.version + '</div></div>';
  }
};

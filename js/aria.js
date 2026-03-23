var Dict = {
  indexData: [],
  filtered: [],
  groups: [],
  config: null,
  activeType: '',
  searchQuery: '',
  currentId: null,
  currentGroup: null,

  types: [
    { key: '', label: '전체' },
    { key: 'role', label: 'Role' },
    { key: 'state', label: 'State' },
    { key: 'property', label: 'Property' }
  ],

  groupColors: {
    purple: { bg: '#EEEAFF', text: '#5B4FC7', border: '#5B4FC7' },
    orange: { bg: '#FFF7ED', text: '#EA580C', border: '#EA580C' },
    teal:   { bg: '#F0FDFA', text: '#0D9488', border: '#0D9488' },
    amber:  { bg: '#FFFBEB', text: '#D97706', border: '#D97706' }
  },

  init: function() {
    var self = this;
    fetch('data/aria/config.json')
      .then(function(r) { return r.json(); })
      .then(function(cfg) {
        self.config = cfg;
        return fetch('data/aria/groups.json');
      })
      .then(function(r) { return r.json(); })
      .then(function(g) {
        self.groups = g;
        return fetch('data/aria/index.json');
      })
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
    if (hash === 'groups') {
      this.currentId = null;
      this.currentGroup = null;
      this.updateSidebarActive();
      this.renderGroupCards();
    } else if (hash.startsWith('group/')) {
      this.currentId = null;
      this.currentGroup = hash.split('/')[1];
      this.updateSidebarActive();
      this.renderGroup(this.currentGroup);
    } else if (hash && hash !== 'attrs') {
      this.currentId = hash;
      this.currentGroup = null;
      this.updateSidebarActive();
      this.loadDetail(hash);
    } else {
      this.currentId = null;
      this.currentGroup = null;
      this.updateSidebarActive();
      this.renderTable();
    }
  },

  renderLayout: function() {
    var container = document.getElementById('dict-content');
    if (!container) return;
    var self = this;

    container.innerHTML =
      '<div class="al-layout">' +
        '<aside class="al-sidebar" id="dict-sidebar">' +
          '<div class="al-sidebar__title">ARIA 사전</div>' +
          '<label for="dict-search" class="sr-only">속성명 검색</label>' +
          '<input class="al-sidebar__search" type="text" placeholder="속성명 검색..." id="dict-search">' +
          '<div class="al-sidebar__group"><div class="al-sidebar__label" id="type-label">유형</div><div class="al-chips" id="dict-type" role="group" aria-labelledby="type-label"></div></div>' +
          '<div class="al-sidebar__group al-sidebar__group--nav"><div class="al-sidebar__label">속성 목록</div><div id="dict-nav-list"></div></div>' +
          '<div class="al-sidebar__group al-sidebar__group--nav"><div class="al-sidebar__label al-sidebar__label--accent">비교 그룹</div><div id="dict-groups"></div></div>' +
        '</aside>' +
        '<div class="al-mobile-chips" id="dict-mobile-chips" role="group" aria-label="필터"></div>' +
        '<main class="al-main" id="dict-main"></main>' +
      '</div>';

    document.getElementById('dict-type').innerHTML = this.types.map(function(t) {
      var isActive = t.key === self.activeType;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-type="' + t.key + '" aria-pressed="' + isActive + '">' + t.label + '</button>';
    }).join('');

    this.renderSidebarGroups();
    this.renderSidebarNav();
    this.renderMobileChips();

    document.getElementById('dict-search').addEventListener('input', function() {
      self.searchQuery = this.value.toLowerCase();
      self.applyFilter();
    });

    document.getElementById('dict-type').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeType = chip.dataset.type;
      this.querySelectorAll('.al-chip').forEach(function(c) {
        var active = c.dataset.type === self.activeType;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      self.applyFilter();
    });
  },

  renderSidebarGroups: function() {
    var el = document.getElementById('dict-groups');
    if (!el) return;
    var self = this;
    el.innerHTML = this.groups.map(function(g) {
      var isActive = g.id === self.currentGroup;
      return '<a href="#group/' + g.id + '" class="al-sidebar__item' + (isActive ? ' is-active' : '') + '">' +
        '<span class="al-sidebar__item-name al-sidebar__item-name--group">' + g.title + '</span>' +
      '</a>';
    }).join('');
  },

  renderSidebarNav: function() {
    var el = document.getElementById('dict-nav-list');
    if (!el) return;
    var self = this;
    el.innerHTML = this.filtered.map(function(item) {
      var isActive = item.id === self.currentId;
      return '<a href="#' + item.id + '" class="al-sidebar__item' + (isActive ? ' is-active' : '') + '">' +
        '<span class="al-sidebar__item-name">' + item.id + '</span>' +
      '</a>';
    }).join('');
  },

  renderMobileChips: function() {
    var el = document.getElementById('dict-mobile-chips');
    if (!el) return;
    var hash = location.hash.replace('#', '');
    var isGroup = hash === 'groups' || hash.indexOf('group/') === 0;

    el.innerHTML =
      '<a href="#" class="al-chip' + (!isGroup ? ' is-active' : '') + '">속성</a>' +
      '<a href="#groups" class="al-chip' + (isGroup ? ' is-active' : '') + '">비교 그룹</a>';
  },

  updateSidebarActive: function() {
    this.renderSidebarNav();
    this.renderSidebarGroups();
    this.renderMobileChips();
  },

  applyFilter: function() {
    var self = this;
    this.filtered = this.indexData.filter(function(item) {
      if (self.activeType && item.type !== self.activeType) return false;
      if (self.searchQuery) {
        return item.id.toLowerCase().indexOf(self.searchQuery) > -1 ||
               item.nameKo.indexOf(self.searchQuery) > -1;
      }
      return true;
    });
    this.renderSidebarNav();
    if (!this.currentId && !this.currentGroup) this.renderTable();
  },

  _getGroupForAttr: function(attrId) {
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].attrs.indexOf(attrId) > -1) return this.groups[i];
    }
    return null;
  },

  renderTable: function() {
    var main = document.getElementById('dict-main');
    if (!main) return;
    var self = this;
    var srNames = { jaws: 'JAWS', nvda: 'NVDA', voiceover: 'VoiceOver', talkback: 'TalkBack' };
    var supportLabels = { full: '전체 지원', partial: '부분 지원', none: '미지원' };

    var h = '<div class="dict-count"><strong>' + this.filtered.length + '</strong>개 속성</div>' +
      '<div class="dict-legend" aria-label="범례">' +
        '<span class="dict-legend__item"><span class="dict-legend__chk dict-legend__chk--full">✓</span> 전체 지원</span>' +
        '<span class="dict-legend__item"><span class="dict-legend__chk dict-legend__chk--partial">△</span> 부분 지원</span>' +
        '<span class="dict-legend__item"><span class="dict-legend__chk dict-legend__chk--none">✕</span> 미지원</span>' +
      '</div>' +
      '<table class="al-table"><thead><tr>' +
      '<th style="width:22%">속성</th>' +
      '<th style="width:26%">설명</th>' +
      '<th class="is-center" style="width:10%">유형</th>' +
      '<th class="is-center" style="width:26%"><abbr title="JAWS / NVDA / VoiceOver / TalkBack">스크린리더</abbr></th>' +
      '<th class="is-center" style="width:16%">비교</th>' +
      '</tr></thead><tbody>';

    h += this.filtered.map(function(item) {
      var typeLabel = item.type === 'property' ? 'Property' : item.type === 'state' ? 'State' : 'Role';

      var srCells = ['jaws','nvda','voiceover','talkback'].map(function(k) {
        var s = item.support[k] || 'none';
        var chkCls = s === 'full' ? 'full' : s === 'partial' ? 'partial' : 'none';
        var chkChar = s === 'full' ? '✓' : s === 'partial' ? '△' : '✕';
        var label = srNames[k] + ' ' + supportLabels[s];
        var abbr = { jaws: 'J', nvda: 'N', voiceover: 'V', talkback: 'T' };
        return '<span class="al-sr-item" role="img" aria-label="' + label + '" title="' + label + '">' +
          abbr[k] + '<span class="al-sr-chk al-sr-chk--' + chkCls + '">' + chkChar + '</span>' +
        '</span>';
      }).join('');

      var group = self._getGroupForAttr(item.id);
      var badgeHtml = '';
      if (group) {
        var c = self.groupColors[group.color] || self.groupColors.purple;
        badgeHtml = '<a href="#group/' + group.id + '" class="dict-group-badge" style="background:' + c.bg + ';color:' + c.text + '">' + group.title + '</a>';
      } else {
        badgeHtml = '<span class="dict-table__empty">—</span>';
      }

      return '<tr>' +
        '<td data-label="속성"><a href="#' + item.id + '" class="dict-table__link">' + item.id + '</a></td>' +
        '<td data-label="설명"><span class="dict-table__desc">' + item.nameKo + '</span></td>' +
        '<td data-label="유형" class="is-center"><span class="al-badge al-badge--' + item.type + '">' + typeLabel + '</span></td>' +
        '<td data-label="스크린리더"><div class="al-sr-group" role="group" aria-label="스크린리더 지원 현황">' + srCells + '</div></td>' +
        '<td data-label="비교" class="is-center">' + badgeHtml + '</td></tr>';
    }).join('');

    h += '</tbody></table>';
    main.innerHTML = h;
  },

  renderGroupCards: function() {
    var main = document.getElementById('dict-main');
    if (!main) return;
    var self = this;

    var h = '<h2 class="al-section-title">비교 그룹</h2>';
    h += '<div class="ch-card-grid">';
    h += this.groups.map(function(g) {
      var c = self.groupColors[g.color] || self.groupColors.purple;
      return '<a href="#group/' + g.id + '" class="ch-card" style="border-left:3px solid ' + c.border + '">' +
        '<h3 class="ch-card__title" style="color:' + c.text + '">' + g.title + '</h3>' +
        '<p class="ch-card__desc">' + g.attrs.join(', ') + '</p>' +
        '<span class="ch-card__meta">' + g.attrs.length + '개 속성</span>' +
      '</a>';
    }).join('');
    h += '</div>';
    main.innerHTML = h;
  },

  renderGroup: function(groupId) {
    var main = document.getElementById('dict-main');
    if (!main) return;
    var group = null;
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].id === groupId) { group = this.groups[i]; break; }
    }
    if (!group) { main.innerHTML = '<div class="page-placeholder">비교 그룹을 찾을 수 없습니다.</div>'; return; }

    var c = this.groupColors[group.color] || this.groupColors.purple;
    var comp = group.comparison;

    var h = '<div class="al-detail">';
    h += '<h1 class="al-detail-title al-detail-title--display">' + group.title + ' 비교</h1>';

    h += '<div class="dict-group-chips">';
    group.attrs.forEach(function(attrId) {
      h += '<a href="#' + attrId + '" class="dict-group-chip" style="background:' + c.bg + ';color:' + c.text + '">' + attrId + '</a>';
    });
    h += '</div>';

    h += '<div class="dict-section dict-section--flush"><table class="dict-compare-table"><thead><tr><th class="dict-compare-table__label">속성</th>';
    group.attrs.forEach(function(a) { h += '<th class="dict-compare-table__head">' + a + '</th>'; });
    h += '</tr></thead><tbody>';
    comp.rows.forEach(function(row) {
      h += '<tr><td class="dict-compare-table__label">' + row.label + '</td>';
      row.values.forEach(function(v) { h += '<td class="dict-compare-table__cell">' + v + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table></div>';

    if (group.notes && group.notes.length) {
      h += '<div class="dict-section"><h2 class="al-section-title">주의사항</h2><div class="dict-compare-notes">';
      group.notes.forEach(function(n) { h += '<div class="dict-compare-note">' + n + '</div>'; });
      h += '</div></div>';
    }

    h += '</div>';
    main.innerHTML = h;
    window.scrollTo(0, 0);
  },

  loadDetail: function(id) {
    var self = this;
    var main = document.getElementById('dict-main');
    fetch('data/aria/' + id + '.json')
      .then(function(r) { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(function(item) { self.renderDetail(item); })
      .catch(function() { main.innerHTML = '<div class="page-placeholder">속성을 찾을 수 없습니다.</div>'; });
  },

  renderDetail: function(item) {
    var main = document.getElementById('dict-main');
    if (!main) return;
    var cfg = this.config;
    var env = cfg.testEnvironment;
    var self = this;
    var typeLabel = item.type === 'property' ? 'Property' : item.type === 'state' ? 'State' : 'Role';

    var idx = -1;
    for (var i = 0; i < this.indexData.length; i++) {
      if (this.indexData[i].id === item.id) { idx = i; break; }
    }
    var prev = idx > 0 ? this.indexData[idx - 1] : null;
    var next = idx < this.indexData.length - 1 ? this.indexData[idx + 1] : null;

    var h = '<div class="al-detail">';
    h += '<h1 class="al-detail-title">' + item.id + '</h1>';
    h += '<div class="al-detail-badges">' +
      '<span class="al-badge al-badge--' + item.type + '">' + typeLabel + '</span>' +
      '<span class="al-badge al-badge--neutral">' + (cfg.categories[item.category] || item.category) + '</span>';
    var group = this._getGroupForAttr(item.id);
    if (group) {
      var gc = this.groupColors[group.color] || this.groupColors.purple;
      h += '<a href="#group/' + group.id + '" class="al-badge al-badge--group" style="background:' + gc.bg + ';color:' + gc.text + '">' + group.title + ' 비교 →</a>';
    }
    h += '</div>';
    h += '<p class="al-detail-desc">' + item.descriptionKo + '</p>';

    h += '<div class="dict-section"><h2 class="al-section-title">속성 정보</h2><div class="dict-meta">' +
      this._meta('값 유형', item.valueType) + this._meta('기본값', item.defaultValue) +
      this._meta('적용 대상', item.applicableTo.join(', ')) +
      this._meta('관련 속성', item.relatedAttrs.map(function(a) { return '<code>' + a + '</code>'; }).join(' ')) +
    '</div></div>';

    h += '<div class="dict-section"><h2 class="al-section-title">코드 예시</h2><div class="code-pair">' +
      this._code('good', item.codeExamples.good) + this._code('bad', item.codeExamples.bad) + '</div></div>';

    var sp = item.screenReaderSpeech;
    var sr = item.screenReaderSupport;
    h += '<div class="dict-section"><h2 class="al-section-title">스크린리더 발화</h2>' +
      '<div class="speech-context">' + sp.context + '</div><div class="speech-grid">' +
      this._speech('JAWS', env.jaws, sp.jaws) + this._speech('NVDA', env.nvda, sp.nvda) +
      this._speech('VoiceOver', env.voiceover, sp.voiceover) + this._speech('TalkBack', env.talkback, sp.talkback) +
    '</div></div>';

    h += '<div class="dict-section"><h2 class="al-section-title">스크린리더 지원 현황</h2><div class="support-grid">' +
      this._support('JAWS', sr.jaws, env.jaws) + this._support('NVDA', sr.nvda, env.nvda) +
      this._support('VoiceOver', sr.voiceover, env.voiceover) + this._support('TalkBack', sr.talkback, env.talkback) +
    '</div></div>';

    var scDefs = cfg.wcagSC;
    h += '<div class="dict-section"><h2 class="al-section-title">관련 WCAG SC</h2><div class="sc-tags">' +
      item.wcagSC.map(function(scId) {
        var sc = scDefs[scId] || { name: scId, level: '' };
        var url = Common.scToUrl('WCAG ' + scId);
        return '<a class="sc-tag" href="' + url + '" target="_blank">' + scId + ' ' + sc.name + ' (' + sc.level + ')</a>';
      }).join('') + '</div></div>';

    if (item.notes) {
      h += '<div class="dict-section dict-section--flush"><p class="dict-note">' + item.notes + '</p>' +
        '<a class="dict-spec-link" href="' + cfg.specBaseUrl + item.id + '" target="_blank">WAI-ARIA 1.2 스펙 보기 ↗</a></div>';
    }

    h += '<div class="dict-nav">';
    h += prev ? '<a href="#' + prev.id + '">← ' + prev.id + '</a>' : '<span></span>';
    h += next ? '<a href="#' + next.id + '">' + next.id + ' →</a>' : '<span></span>';
    h += '</div></div>';

    main.innerHTML = h;
    window.scrollTo(0, 0);
  },

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
      '<div class="code-block__body">' + code + '</div><div class="code-block__note">' + ex.description + '</div></div>';
  },
  _speech: function(name, ver, text) {
    return '<div class="speech-card"><div class="speech-card__label">' + name + ' ' + ver + '</div><div class="speech-card__text">' + text + '</div></div>';
  },
  _support: function(name, support, version) {
    var cls = support === 'full' ? 'full' : support === 'partial' ? 'partial' : 'none';
    var statusText = support === 'full' ? '전체 지원' : support === 'partial' ? '부분 지원' : '미지원';
    var label = name + ' ' + statusText;
    return '<div class="support-card" aria-label="' + label + '">' +
      '<div class="support-card__name">' + name + '</div>' +
      '<div class="support-card__version">' + version + '</div>' +
      '<div><span class="support-card__icon support-card__icon--' + cls + '" role="img" aria-hidden="true"></span></div>' +
      '<div class="support-card__status">' + statusText + '</div>' +
    '</div>';
  }
};

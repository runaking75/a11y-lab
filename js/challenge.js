var Challenge = {
  indexData: [],
  filtered: [],
  activeDifficulty: '',
  currentId: null,
  revealed: false,

  difficulties: [
    { key: '', label: '전체' },
    { key: 'beginner', label: '초급' },
    { key: 'intermediate', label: '중급' },
    { key: 'advanced', label: '고급' }
  ],

  diffLabels: { beginner: '초급', intermediate: '중급', advanced: '고급' },
  diffColors: {
    beginner: { bg: 'var(--success-bg)', text: 'var(--success)' },
    intermediate: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
    advanced: { bg: 'var(--danger-bg)', text: 'var(--danger)' }
  },

  init: function() {
    var self = this;
    fetch('data/challenge/index.json')
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
    this.revealed = false;
    if (hash) {
      this.currentId = hash;
      this.updateSidebarActive();
      this.loadDetail(hash);
    } else {
      this.currentId = null;
      this.updateSidebarActive();
      this.renderCards();
    }
  },

  renderLayout: function() {
    var container = document.getElementById('challenge-content');
    if (!container) return;
    var self = this;

    container.innerHTML =
      '<div class="al-layout">' +
        '<aside class="al-sidebar">' +
          '<div class="al-sidebar__title">코드 챌린지</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label" id="diff-label">난이도</div>' +
            '<div class="al-chips" id="ch-diff" role="group" aria-labelledby="diff-label"></div>' +
          '</div>' +
          '<div class="al-sidebar__group al-sidebar__group--nav">' +
            '<div class="al-sidebar__label">문제 목록</div>' +
            '<div id="ch-nav-list"></div>' +
          '</div>' +
        '</aside>' +
        '<div class="al-mobile-chips" id="ch-mobile-chips" role="group" aria-label="난이도"></div>' +
        '<main class="al-main" id="ch-main"></main>' +
      '</div>';

    document.getElementById('ch-diff').innerHTML = this.difficulties.map(function(d) {
      var isActive = d.key === self.activeDifficulty;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-diff="' + d.key + '" aria-pressed="' + isActive + '">' + d.label + '</button>';
    }).join('');

    this.renderSidebarNav();
    this.renderMobileChips();

    document.getElementById('ch-diff').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeDifficulty = chip.dataset.diff;
      this.querySelectorAll('.al-chip').forEach(function(c) {
        var active = c.dataset.diff === self.activeDifficulty;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      self.applyFilter();
    });

    document.getElementById('ch-mobile-chips').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      e.preventDefault();
      self.activeDifficulty = chip.dataset.diff;
      self.currentId = null;
      location.hash = '';
      self.renderMobileChips();
      self.applyFilter();
      self.renderCards();
    });
  },

  renderSidebarNav: function() {
    var el = document.getElementById('ch-nav-list');
    if (!el) return;
    var self = this;
    el.innerHTML = this.filtered.map(function(item) {
      var isActive = item.id === self.currentId;
      return '<a href="#' + item.id + '" class="al-sidebar__item' + (isActive ? ' is-active' : '') + '">' +
        '<span class="al-sidebar__item-name al-sidebar__item-name--group">' + item.title + '</span>' +
      '</a>';
    }).join('');
  },

  renderMobileChips: function() {
    var el = document.getElementById('ch-mobile-chips');
    if (!el) return;
    var self = this;
    el.innerHTML = this.difficulties.map(function(d) {
      var isActive = d.key === self.activeDifficulty;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-diff="' + d.key + '">' + d.label + '</button>';
    }).join('');
  },

  updateSidebarActive: function() {
    this.renderSidebarNav();
    this.renderMobileChips();
  },

  applyFilter: function() {
    var self = this;
    this.filtered = this.indexData.filter(function(item) {
      if (self.activeDifficulty && item.difficulty !== self.activeDifficulty) return false;
      return true;
    });
    this.renderSidebarNav();
    if (!this.currentId) this.renderCards();
  },

  renderCards: function() {
    var main = document.getElementById('ch-main');
    if (!main) return;
    var self = this;

    var h = '<div class="ch-count"><strong>' + this.filtered.length + '</strong>개 챌린지</div>';
    h += '<div class="ch-card-grid">';

    h += this.filtered.map(function(item) {
      var dc = self.diffColors[item.difficulty];
      return '<a href="#' + item.id + '" class="ch-card">' +
        '<span class="ch-card__diff" style="background:' + dc.bg + ';color:' + dc.text + '">' + self.diffLabels[item.difficulty] + '</span>' +
        '<h2 class="ch-card__title">' + item.title + '</h2>' +
        '<p class="ch-card__desc">' + item.description + '</p>' +
        '<span class="ch-card__meta">이슈 ' + item.issueCount + '개</span>' +
      '</a>';
    }).join('');

    h += '</div>';
    main.innerHTML = h;
  },

  loadDetail: function(id) {
    var self = this;
    var main = document.getElementById('ch-main');
    fetch('data/challenge/' + id + '.json')
      .then(function(r) { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(function(item) { self.renderDetail(item); })
      .catch(function() { main.innerHTML = '<div class="page-placeholder">챌린지를 찾을 수 없습니다.</div>'; });
  },

  renderDetail: function(item) {
    var main = document.getElementById('ch-main');
    if (!main) return;
    var self = this;
    var dc = this.diffColors[item.difficulty];

    var h = '<div class="al-detail">';

    // 헤더
    h += '<h1 class="al-detail-title al-detail-title--display">' + item.title + '</h1>';
    h += '<div class="al-detail-badges">' +
      '<span class="al-badge" style="background:' + dc.bg + ';color:' + dc.text + '">' + this.diffLabels[item.difficulty] + '</span>' +
      '<span class="al-badge al-badge--neutral">이슈 ' + item.issues.length + '개</span>' +
    '</div>';
    h += '<p class="al-detail-desc">' + item.description + '</p>';

    // 좌우 레이아웃 컨테이너
    h += '<div class="ch-split" id="ch-split">';

    // 왼쪽: 문제 코드 + 힌트
    h += '<div class="ch-split__left" id="ch-left">';

    h += '<div class="al-section">' +
      '<h2 class="al-section-title">문제 코드</h2>' +
      '<div class="code-block"><div class="code-block__head code-block__head--bad">Before</div>' +
      '<div class="code-block__body">' + this._esc(item.beforeCode) + '</div></div>' +
    '</div>';

    h += '<div class="al-section">' +
      '<h2 class="al-section-title">힌트</h2>' +
      '<div class="ch-hints">';
    item.issues.forEach(function(issue, i) {
      h += '<button type="button" class="ch-hint-btn" onclick="Challenge.toggleHint(this)" aria-expanded="false">' +
        '힌트 ' + (i + 1) + '</button>' +
        '<div class="ch-hint-content" hidden>' + issue.hint + '</div>';
    });
    h += '</div></div>';

    // 정답 보기 버튼 (왼쪽 안에)
    h += '<div class="ch-reveal-wrap">' +
      '<button type="button" class="ch-reveal-btn" id="ch-reveal-btn" onclick="Challenge.reveal()">정답 보기</button>' +
    '</div>';

    h += '</div>'; // ch-split__left

    // 오른쪽: 정답 영역 (처음에 숨김)
    h += '<div class="ch-split__right" id="ch-right" hidden>';

    // 접근성 이슈
    h += '<div class="al-section">' +
      '<h2 class="al-section-title">접근성 이슈 ' + item.issues.length + '개</h2>';
    item.issues.forEach(function(issue, i) {
      h += '<div class="ch-issue">' +
        '<div class="ch-issue__num">' + (i + 1) + '</div>' +
        '<div class="ch-issue__body">' +
          '<div class="ch-issue__title">' + issue.title + '</div>' +
          '<div class="ch-issue__desc">' + issue.description + '</div>' +
          '<div class="ch-issue__sc">' + issue.wcagSC.map(function(sc) {
            var url = Common.scToUrl('WCAG ' + sc);
            return '<a class="sc-tag" href="' + url + '" target="_blank">WCAG ' + sc + '</a>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';

    // After 코드
    h += '<div class="al-section">' +
      '<h2 class="al-section-title">수정된 코드</h2>' +
      '<div class="code-block"><div class="code-block__head code-block__head--good">After</div>' +
      '<div class="code-block__body">' + this._escAfter(item.afterCode) + '</div></div>' +
    '</div>';

    // 변경 사항
    h += '<div class="al-section">' +
      '<h2 class="al-section-title">변경 사항</h2>' +
      '<div class="ch-changes">';
    item.changes.forEach(function(c) {
      h += '<div class="ch-change">✓ ' + c + '</div>';
    });
    h += '</div></div>';

    // 해설
    h += '<div class="al-section">' +
      '<h2 class="al-section-title">해설</h2>' +
      '<p class="ch-explanation">' + item.explanation + '</p>' +
    '</div>';

    h += '</div>'; // ch-split__right
    h += '</div>'; // ch-split
    h += '</div>'; // ch-detail

    main.innerHTML = h;
    window.scrollTo(0, 0);
  },

  toggleHint: function(btn) {
    var content = btn.nextElementSibling;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    content.hidden = expanded;
  },

  reveal: function() {
    var split = document.getElementById('ch-split');
    var right = document.getElementById('ch-right');
    var btn = document.getElementById('ch-reveal-btn');
    if (right && split) {
      right.hidden = false;
      btn.hidden = true;
      split.classList.add('is-revealed');
      // 상하 정렬(1400px 이하)일 때만 스크롤
      if (window.innerWidth <= 1400) {
        var top = right.getBoundingClientRect().top + window.pageYOffset - 40;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
  },

  _esc: function(code) {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _escAfter: function(code) {
    var escaped = this._esc(code);
    escaped = escaped.replace(/(aria-[\w-]+="[^"]*")/g, '<span class="hl-good">$1</span>');
    escaped = escaped.replace(/(role="[^"]*")/g, '<span class="hl-good">$1</span>');
    escaped = escaped.replace(/(id="[^"]*")/g, '<span class="hl-good">$1</span>');
    escaped = escaped.replace(/(for="[^"]*")/g, '<span class="hl-good">$1</span>');
    return escaped;
  }
};

var Quiz = {
  allQuestions: [],
  currentQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  activeStandard: '',
  activeCategory: '',
  mode: 'setup',

  standards: [
    { key: '', label: '전체' },
    { key: 'WCAG', label: 'WCAG 2.2' },
    { key: 'KWCAG', label: 'KWCAG 2.2' }
  ],

  categories: [
    { key: '', label: '전체' },
    { key: 'perceivable', label: '인식' },
    { key: 'operable', label: '운용' },
    { key: 'understandable', label: '이해' },
    { key: 'robust', label: '견고' }
  ],

  catLabels: { perceivable: '인식', operable: '운용', understandable: '이해', robust: '견고' },

  init: function() {
    var self = this;
    fetch('data/quiz/index.json')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        self.allQuestions = d;
        self.renderLayout();
        self.renderSetup();
      });
  },

  renderLayout: function() {
    var container = document.getElementById('quiz-content');
    if (!container) return;

    container.innerHTML =
      '<div class="al-layout">' +
        '<aside class="al-sidebar">' +
          '<div class="al-sidebar__title">WCAG/KWCAG 퀴즈</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label" id="std-label">기준</div>' +
            '<div class="al-chips" id="qz-std" role="group" aria-labelledby="std-label"></div>' +
          '</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label" id="cat2-label">원칙</div>' +
            '<div class="al-chips" id="qz-cat" role="group" aria-labelledby="cat2-label"></div>' +
          '</div>' +
          '<div class="al-sidebar__group">' +
            '<div class="al-sidebar__label">문제 풀</div>' +
            '<div id="qz-pool-info"></div>' +
          '</div>' +
        '</aside>' +
        '<div class="al-mobile-chips" id="qz-mobile-chips" role="group" aria-label="기준"></div>' +
        '<main class="al-main" id="qz-main"></main>' +
      '</div>';

    var self = this;

    document.getElementById('qz-std').innerHTML = this.standards.map(function(s) {
      var isActive = s.key === self.activeStandard;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-std="' + s.key + '" aria-pressed="' + isActive + '">' + s.label + '</button>';
    }).join('');

    document.getElementById('qz-cat').innerHTML = this.categories.map(function(c) {
      var isActive = c.key === self.activeCategory;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-cat="' + c.key + '" aria-pressed="' + isActive + '">' + c.label + '</button>';
    }).join('');

    document.getElementById('qz-std').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeStandard = chip.dataset.std;
      this.querySelectorAll('.al-chip').forEach(function(c) {
        var active = c.dataset.std === self.activeStandard;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      self.updatePool();
    });

    document.getElementById('qz-cat').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      self.activeCategory = self.activeCategory === chip.dataset.cat ? '' : chip.dataset.cat;
      this.querySelectorAll('.al-chip').forEach(function(c) {
        var active = c.dataset.cat === self.activeCategory;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      self.updatePool();
    });

    this.updatePool();
    this.renderMobileChips();

    document.getElementById('qz-mobile-chips').addEventListener('click', function(e) {
      var chip = e.target.closest('.al-chip');
      if (!chip) return;
      e.preventDefault();
      self.activeStandard = chip.dataset.std;
      self.activeCategory = '';
      self.mode = 'setup';
      self.renderMobileChips();
      self.updatePool();
      self.renderSetup();
    });
  },

  renderMobileChips: function() {
    var el = document.getElementById('qz-mobile-chips');
    if (!el) return;
    var self = this;
    el.innerHTML = this.standards.map(function(s) {
      var isActive = s.key === self.activeStandard;
      return '<button type="button" class="al-chip' + (isActive ? ' is-active' : '') + '" data-std="' + s.key + '">' + s.label + '</button>';
    }).join('');
  },

  getFiltered: function() {
    var self = this;
    return this.allQuestions.filter(function(q) {
      if (self.activeStandard && q.standard !== self.activeStandard) return false;
      if (self.activeCategory && q.category !== self.activeCategory) return false;
      return true;
    });
  },

  updatePool: function() {
    var filtered = this.getFiltered();
    var el = document.getElementById('qz-pool-info');
    if (el) {
      el.innerHTML = '<div class="qz-pool-count">' +
        '<strong>' + filtered.length + '</strong>문제 중 선택' +
      '</div>';
    }
    if (this.mode === 'setup') this.renderSetup();
  },

  renderSetup: function() {
    var main = document.getElementById('qz-main');
    if (!main) return;
    var filtered = this.getFiltered();
    var max = Math.min(filtered.length, 20);

    var h = '<div class="qz-setup">' +
      '<h1 class="qz-setup__title">WCAG / KWCAG 퀴즈</h1>' +
      '<p class="qz-setup__desc">필터링된 <strong>' + filtered.length + '</strong>개 문제에서 랜덤으로 출제합니다.</p>';

    if (filtered.length === 0) {
      h += '<p class="qz-setup__empty">선택한 조건에 해당하는 문제가 없습니다.</p>';
    } else {
      h += '<div class="qz-setup__options">' +
        '<label for="qz-count" class="qz-setup__label">문제 수</label>' +
        '<select id="qz-count" class="qz-setup__select">';
      [5, 10, 15, 20].forEach(function(n) {
        if (n <= filtered.length) {
          h += '<option value="' + n + '"' + (n === Math.min(5, max) ? ' selected' : '') + '>' + n + '문제</option>';
        }
      });
      if (filtered.length < 5) {
        h += '<option value="' + filtered.length + '" selected>' + filtered.length + '문제 (전체)</option>';
      }
      h += '</select></div>' +
        '<button type="button" class="ch-reveal-btn" onclick="Quiz.start()">시작하기</button>';
    }

    h += '</div>';
    main.innerHTML = h;
    this.mode = 'setup';
  },

  shuffle: function(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  },

  start: function() {
    var filtered = this.getFiltered();
    var countEl = document.getElementById('qz-count');
    var count = countEl ? parseInt(countEl.value) : Math.min(5, filtered.length);
    this.currentQuestions = this.shuffle(filtered).slice(0, count);
    this.currentIndex = 0;
    this.score = 0;
    this.mode = 'playing';
    this.renderQuestion();
  },

  renderQuestion: function() {
    var main = document.getElementById('qz-main');
    if (!main) return;
    var q = this.currentQuestions[this.currentIndex];
    this.answered = false;

    var h = '<div class="qz-question">';

    h += '<h1 class="qz-page-title">WCAG / KWCAG 퀴즈</h1>';

    var curNum = this.currentIndex + 1;
    var totalNum = this.currentQuestions.length;
    h += '<div class="qz-progress" role="status" aria-label="총 ' + totalNum + '개 중 ' + curNum + '번째 문제, 정답 ' + this.score + '개">' +
      '<span class="qz-progress__current" aria-hidden="true">' + curNum + '</span>' +
      '<span class="qz-progress__total" aria-hidden="true"> / ' + totalNum + '</span>' +
      '<span class="qz-progress__score" aria-hidden="true"> · 정답 ' + this.score + '개</span>' +
    '</div>';

    h += '<div class="qz-question__meta">' +
      '<span class="al-badge al-badge--neutral">' + q.standard + '</span>' +
      '<span class="al-badge al-badge--neutral">' + q.sc + ' ' + q.scName + '</span>' +
    '</div>';

    h += '<h2 class="qz-question__text">' + this._esc(q.question) + '</h2>';

    if (q.type === 'ox') {
      h += '<div class="qz-choices qz-choices--ox">' +
        '<button type="button" class="qz-choice qz-choice--o" data-answer="true" onclick="Quiz.answer(true)"><span class="qz-ox qz-ox--o">O</span> 맞다</button>' +
        '<button type="button" class="qz-choice qz-choice--x" data-answer="false" onclick="Quiz.answer(false)"><span class="qz-ox qz-ox--x">X</span> 틀리다</button>' +
      '</div>';
    } else {
      h += '<div class="qz-choices">';
      q.choices.forEach(function(choice, i) {
        h += '<button type="button" class="qz-choice" data-answer="' + i + '" onclick="Quiz.answer(' + i + ')">' +
          '<span class="qz-choice__num">' + (i + 1) + '</span>' + Quiz._esc(choice) +
        '</button>';
      });
      h += '</div>';
    }

    h += '<div id="qz-feedback" class="qz-feedback" hidden></div>';
    h += '</div>';

    main.innerHTML = h;
    window.scrollTo(0, 0);
  },

  answer: function(selected) {
    if (this.answered) return;
    this.answered = true;
    var q = this.currentQuestions[this.currentIndex];
    var correct = selected === q.answer;
    if (correct) this.score++;

    var buttons = document.querySelectorAll('.qz-choice');
    buttons.forEach(function(btn) {
      btn.disabled = true;
      var val = q.type === 'ox' ? (btn.dataset.answer === 'true') : parseInt(btn.dataset.answer);
      if (val === q.answer) {
        btn.classList.add('qz-choice--correct');
      } else if (q.type === 'ox' ? (val === selected) : (val === selected)) {
        if (!correct) btn.classList.add('qz-choice--wrong');
      }
    });

    var feedback = document.getElementById('qz-feedback');
    var isLast = this.currentIndex >= this.currentQuestions.length - 1;
    var nextLabel = isLast ? '결과 보기' : '다음 문제';
    var nextFn = isLast ? 'Quiz.showResult()' : 'Quiz.next()';

    feedback.innerHTML =
      '<div class="qz-feedback__result qz-feedback__result--' + (correct ? 'correct' : 'wrong') + '">' +
        (correct ? '정답!' : '오답!') +
      '</div>' +
      '<p class="qz-feedback__explanation">' + q.explanation + '</p>' +
      '<button type="button" class="ch-reveal-btn" onclick="' + nextFn + '">' + nextLabel + '</button>';
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  next: function() {
    this.currentIndex++;
    this.renderQuestion();
  },

  showResult: function() {
    var main = document.getElementById('qz-main');
    if (!main) return;
    var total = this.currentQuestions.length;
    var pct = Math.round(this.score / total * 100);

    var h = '<div class="qz-result">' +
      '<h1 class="qz-result__title">퀴즈 결과</h1>' +
      '<div class="qz-result__score" role="status" aria-label="총 ' + total + '개 중 ' + this.score + '문제 맞춤, ' + pct + '%">' +
        '<span class="qz-result__num" aria-hidden="true">' + this.score + '</span>' +
        '<span class="qz-result__total" aria-hidden="true"> / ' + total + '</span>' +
      '</div>' +
      '<div class="qz-result__pct" aria-hidden="true">' + pct + '%</div>' +
      '<div class="qz-result__msg">' + this.getMsg(pct) + '</div>' +
      '<div class="qz-result__actions">' +
        '<button type="button" class="ch-reveal-btn" onclick="Quiz.start()">다시 풀기</button>' +
        '<button type="button" class="ch-hint-btn" onclick="Quiz.renderSetup()">설정으로</button>' +
      '</div>' +
    '</div>';

    main.innerHTML = h;
    this.mode = 'setup';
    window.scrollTo(0, 0);
  },

  getMsg: function(pct) {
    if (pct === 100) return '완벽합니다! 접근성 전문가시네요.';
    if (pct >= 80) return '훌륭해요! 대부분 정확하게 알고 있어요.';
    if (pct >= 60) return '좋아요, 몇 가지만 더 공부하면 완벽해질 거예요.';
    if (pct >= 40) return '기본기가 있어요. 틀린 문제를 복습해보세요.';
    return '접근성 기초부터 다시 한번 살펴보세요!';
  },

  _esc: function(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

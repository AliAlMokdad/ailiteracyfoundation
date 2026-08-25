/* AI Fluency Learning, course player engine v2.
   Progress, points and the learner's name live in localStorage only, on the
   learner's own device. Nothing is sent anywhere.
   Points: +10 per lesson read, +5 per inline check answered correctly (awarded
   once), quiz adds +2 per correct answer on the best attempt, +10 bonus for a
   perfect score. Passing the quiz earns the course credit and the certificate. */
(function () {
  'use strict';

  var courseEl = document.querySelector('[data-course]');

  /* ---------- storage (localStorage, with an in-memory fallback for
     private mode so the session still works; it just will not persist) ---------- */
  var memStore = {};
  function store(id) {
    try {
      var raw = localStorage.getItem('ailf_learn_' + id);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* blocked or corrupt */ }
    return memStore[id] || {};
  }
  function save(id, data) {
    memStore[id] = data;
    try { localStorage.setItem('ailf_learn_' + id, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }
  function profile() { return store('profile'); }
  function saveProfile(p) { save('profile', p); }

  var COURSES = ['foundations', 'capabilities', 'behaves', 'builders', 'educators', 'pk12', 'nonprofits', 'smallbiz', 'students', 'teaching', 'trainer', 'research'];

  function courseXP(s) {
    var xp = (s.read || []).filter(function (id) { return id !== 'quiz'; }).length * 10;
    var checks = s.checks || {};
    Object.keys(checks).forEach(function (k) { if (checks[k]) xp += 5; });
    if (s.quiz) {
      xp += (s.quiz.best || s.quiz.score || 0) * 2;
      if (s.quiz.passed && (s.quiz.best || s.quiz.score) === s.quiz.total) xp += 10;
    }
    return xp;
  }

  /* ---------- hub: status chips, progress edges, totals ---------- */
  var totalXP = 0, credits = 0;
  COURSES.forEach(function (id) {
    var s = store(id);
    totalXP += courseXP(s);
    if (s.quiz && s.quiz.passed) credits++;
  });
  document.querySelectorAll('[data-course-status]').forEach(function (chip) {
    var id = chip.getAttribute('data-course-status');
    var s = store(id);
    var card = chip.closest('.course-card');
    var read = (s.read || []).length;
    var total = parseInt(chip.getAttribute('data-lessons') || '0', 10);
    if (s.quiz && s.quiz.passed) {
      chip.textContent = 'Completed'; chip.hidden = false;
      if (card) { card.setAttribute('data-progress', ''); card.style.setProperty('--p', '100%'); }
    } else if (read > 0) {
      chip.textContent = 'In progress'; chip.hidden = false;
      if (card && total) { card.setAttribute('data-progress', ''); card.style.setProperty('--p', Math.min(100, Math.round(read / total * 100)) + '%'); }
    }
  });
  var xpEl = document.querySelector('[data-hub-xp]');
  var crEl = document.querySelector('[data-hub-credits]');
  if (xpEl) xpEl.textContent = totalXP;
  if (crEl) crEl.textContent = credits;

  if (!courseEl) return;

  /* ---------- course state ---------- */
  var courseId = courseEl.getAttribute('data-course');
  var state = store(courseId);
  state.read = state.read || [];
  state.checks = state.checks || {};

  var lessons = Array.prototype.slice.call(document.querySelectorAll('[data-lesson]'));
  var railItems = Array.prototype.slice.call(document.querySelectorAll('.course-rail li'));
  var bar = document.querySelector('.course-rail__bar > span');
  var pct = document.querySelector('.course-rail__pct');
  var xpChip = document.querySelector('[data-course-xp]');

  function railFor(id) {
    return railItems.filter(function (li) {
      var a = li.querySelector('a');
      return a && a.getAttribute('href') === '#' + id;
    })[0];
  }

  function paint() {
    var total = lessons.length;
    var done = lessons.filter(function (s) { return state.read.indexOf(s.id) >= 0; }).length;
    var p = total ? Math.round((done / total) * 100) : 0;
    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = done + ' of ' + total + ' complete · ' + p + '%';
    if (xpChip) xpChip.textContent = courseXP(state);
    lessons.forEach(function (s) {
      var li = railFor(s.id);
      if (li) li.classList.toggle('is-read', state.read.indexOf(s.id) >= 0);
    });
  }

  function markRead(id) {
    if (id && state.read.indexOf(id) < 0) { state.read.push(id); save(courseId, state); paint(); }
  }

  /* ---------- learner name ---------- */
  function greet() {
    var hello = document.querySelector('.course-rail__hello');
    var p = profile();
    if (hello) hello.textContent = p.name ? 'Learning as ' + p.name : '';
    var beginInput = document.querySelector('.begin-card input[type="text"]');
    if (beginInput && p.name && !beginInput.value) beginInput.value = p.name;
    var certInput = document.querySelector('.completion input[type="text"]');
    if (certInput && p.name && !certInput.value) certInput.value = p.name;
  }
  var beginSave = document.querySelector('[data-begin-save]');
  if (beginSave) {
    beginSave.addEventListener('click', function () {
      var input = document.querySelector('.begin-card input[type="text"]');
      var p = profile();
      p.name = (input.value || '').trim();
      saveProfile(p);
      greet();
      renderCert();
    });
  }

  /* ---------- paged lessons ----------
     One lesson at a time, like a course, not a scroll. Next marks the lesson
     complete; the rail jumps anywhere; the URL hash tracks the position. */
  var body = document.querySelector('.course-body');
  var current = 0;
  var pgPrev, pgNext, pgPos;

  function show(i, scroll) {
    current = Math.max(0, Math.min(lessons.length - 1, i));
    lessons.forEach(function (s, k) { s.classList.toggle('is-current', k === current); });
    railItems.forEach(function (li) { li.classList.remove('is-active'); });
    var li = railFor(lessons[current].id);
    if (li) li.classList.add('is-active');
    if (pgPos) pgPos.textContent = (current + 1) + ' of ' + lessons.length;
    if (pgPrev) { if (current === 0) pgPrev.setAttribute('disabled', ''); else pgPrev.removeAttribute('disabled'); }
    if (pgNext) {
      var last = current === lessons.length - 1;
      var hasQuiz = !!document.querySelector('.lesson--quiz');
      if (!last) {
        pgNext.textContent = 'Next →';
        pgNext.removeAttribute('disabled');
      } else if (hasQuiz) {
        pgNext.textContent = 'End of course';
        pgNext.setAttribute('disabled', '');
      } else if (state.read.indexOf(lessons[current].id) >= 0) {
        pgNext.textContent = 'Completed ✓';
        pgNext.setAttribute('disabled', '');
      } else {
        pgNext.textContent = 'Mark complete';
        pgNext.removeAttribute('disabled');
      }
    }
    body.classList.toggle('at-end', current === lessons.length - 1);
    if (history.replaceState) history.replaceState(null, '', '#' + lessons[current].id);
    state.at = current;
    save(courseId, state);
    if (scroll !== false) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, body.getBoundingClientRect().top + window.scrollY - 90), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  if (body && lessons.length > 1) {
    body.classList.add('is-paged');
    var pager = document.createElement('div');
    pager.className = 'pager';
    pgPrev = document.createElement('button');
    pgPrev.type = 'button'; pgPrev.className = 'lbtn'; pgPrev.textContent = '← Previous';
    pgPos = document.createElement('span');
    pgPos.className = 'pager__pos'; pgPos.setAttribute('aria-live', 'polite');
    pgNext = document.createElement('button');
    pgNext.type = 'button'; pgNext.className = 'lbtn lbtn--primary'; pgNext.textContent = 'Next →';
    pager.appendChild(pgPrev); pager.appendChild(pgPos); pager.appendChild(pgNext);
    var lastLesson = lessons[lessons.length - 1];
    lastLesson.parentNode.insertBefore(pager, lastLesson.nextSibling);

    pgPrev.addEventListener('click', function () { show(current - 1); });
    pgNext.addEventListener('click', function () {
      markRead(lessons[current].id);
      if (current === lessons.length - 1) show(current, false);
      else show(current + 1);
    });

    railItems.forEach(function (li) {
      var a = li.querySelector('a');
      if (!a) return;
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = -1;
        lessons.forEach(function (s, k) { if (s.id === id) target = k; });
        if (target >= 0) { e.preventDefault(); show(target); }
      });
    });

    var start = 0;
    var hashId = location.hash.slice(1);
    var hashIdx = -1;
    lessons.forEach(function (s, k) { if (s.id === hashId) hashIdx = k; });
    if (hashIdx >= 0) start = hashIdx;
    else if (typeof state.at === 'number') start = state.at;
    else {
      var firstUnread = -1;
      lessons.forEach(function (s, k) { if (firstUnread < 0 && state.read.indexOf(s.id) < 0) firstUnread = k; });
      if (firstUnread > 0) start = firstUnread;
    }
    show(start, false);
  }

  var railToggle = document.querySelector('.course-rail__toggle');
  if (railToggle) {
    railToggle.addEventListener('click', function () {
      var rail = document.querySelector('.course-rail');
      var open = rail.classList.toggle('is-expanded');
      railToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- inline knowledge checks ---------- */
  document.querySelectorAll('.check').forEach(function (check, idx) {
    var key = check.getAttribute('data-check') || ('c' + idx);
    var opts = Array.prototype.slice.call(check.querySelectorAll('.opt'));
    var award = check.querySelector('.check__award');

    function settle(picked, first) {
      check.classList.add('is-done');
      opts.forEach(function (o) {
        o.disabled = true;
        o.classList.toggle('is-answer', o.hasAttribute('data-correct'));
      });
      if (picked) {
        picked.classList.add('is-picked');
        picked.classList.add(picked.hasAttribute('data-correct') ? 'is-right' : 'is-wrong');
      }
      if (award) {
        award.textContent = state.checks[key] ? '+5 points' :
          (first ? 'The explanation below is the point; no points this time.' : '');
      }
    }

    if (key in state.checks) { settle(null, false); return; }

    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (check.classList.contains('is-done')) return;
        var right = opt.hasAttribute('data-correct');
        state.checks[key] = right;
        save(courseId, state);
        settle(opt, true);
        paint();
      });
    });
  });

  /* ---------- quiz ---------- */
  var renderCert = function () {};
  var quiz = document.querySelector('.quiz');
  if (quiz) {
    var form = quiz.querySelector('form');
    var result = quiz.querySelector('.quiz-result');
    var retry = quiz.querySelector('[data-retry]');
    var completion = document.querySelector('.completion');
    var PASS = 0.8;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var sets = Array.prototype.slice.call(form.querySelectorAll('fieldset'));
      var unanswered = sets.filter(function (fs) { return !fs.querySelector('input:checked'); });
      if (unanswered.length) {
        result.textContent = 'Answer every question first. ' + unanswered.length + ' left.';
        result.className = 'quiz-result fail';
        unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      var correct = 0;
      sets.forEach(function (fs) {
        fs.classList.add('is-graded');
        fs.classList.remove('is-correct', 'is-wrong');
        var checked = fs.querySelector('input:checked');
        var isRight = checked.hasAttribute('data-correct');
        fs.classList.add(isRight ? 'is-correct' : 'is-wrong');
        fs.querySelectorAll('.opt').forEach(function (opt) {
          opt.classList.toggle('is-answer', !!opt.querySelector('input[data-correct]'));
        });
        if (isRight) correct++;
      });
      var score = correct / sets.length;
      var passed = score >= PASS;
      var alreadyPassed = !!(state.quiz && state.quiz.passed);
      var prevBest = (state.quiz && state.quiz.best) || 0;
      state.quiz = {
        score: correct,
        best: Math.max(prevBest, correct),
        total: sets.length,
        passed: passed || !!(state.quiz && state.quiz.passed),
        when: (state.quiz && state.quiz.passed && state.quiz.when) || new Date().toISOString().slice(0, 10)
      };
      save(courseId, state);
      if (passed) {
        result.textContent = 'You passed. ' + correct + ' of ' + sets.length + ' correct (' + Math.round(score * 100) + '%).';
        result.className = 'quiz-result pass';
      } else if (alreadyPassed) {
        result.textContent = 'This attempt: ' + correct + ' of ' + sets.length + '. Your earlier pass and certificate stand.';
        result.className = 'quiz-result';
      } else {
        result.textContent = 'Not yet. ' + correct + ' of ' + sets.length + ' correct (' + Math.round(score * 100) + '%). The explanation under each question shows why. Unlimited retries.';
        result.className = 'quiz-result fail';
      }
      if (retry) retry.hidden = passed;
      if (passed) {
        var quizSection = document.querySelector('.lesson--quiz');
        if (quizSection) markRead(quizSection.id);
      }
      paint();
      if (passed && completion) {
        completion.classList.add('is-open');
        greet();
        renderCert();
        completion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (!passed) result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (retry) {
      retry.addEventListener('click', function () {
        form.querySelectorAll('fieldset').forEach(function (fs) {
          fs.classList.remove('is-graded', 'is-correct', 'is-wrong');
          fs.querySelectorAll('input').forEach(function (i) { i.checked = false; });
        });
        result.textContent = '';
        result.className = 'quiz-result';
        retry.hidden = true;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    /* certificate code: deterministic, human-checkable, no server.
       AILF-<course>-<hash of name|course|date> in base32, grouped. */
    function certCode(name, when) {
      var s = name + '|' + courseId + '|' + (when || '');
      var h = 5381;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; }
      var alpha = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
      var out = '';
      for (var j = 0; j < 8; j++) { out += alpha[h % alpha.length]; h = (h * 31 + j) >>> 0; }
      return 'AILF-' + out.slice(0, 4) + '-' + out.slice(4);
    }

    renderCert = function () {
      var p = profile();
      var name = p.name || '';
      var el;
      if ((el = document.querySelector('.cert__name'))) el.textContent = name || 'Add your name above';
      if ((el = document.querySelector('[data-cert-date]')) && state.quiz) el.textContent = state.quiz.when;
      if ((el = document.querySelector('[data-cert-score]')) && state.quiz) el.textContent = (state.quiz.best || state.quiz.score) + ' / ' + state.quiz.total;
      if ((el = document.querySelector('[data-cert-code]')) && state.quiz) el.textContent = name ? certCode(name, state.quiz.when) : 'needs a name';
      if ((el = document.querySelector('[data-cert-points]'))) el.textContent = courseXP(state);
    };

    var nameSave = document.querySelector('[data-save-name]');
    if (nameSave) {
      nameSave.addEventListener('click', function () {
        var input = document.querySelector('.completion input[type="text"]');
        var p = profile();
        p.name = (input.value || '').trim();
        saveProfile(p);
        greet();
        renderCert();
      });
    }

    var printBtn = document.querySelector('[data-print-cert]');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        if (!(profile().name || '').trim()) {
          var input = document.querySelector('.completion input[type="text"]');
          if (input) { input.focus(); input.placeholder = 'Add your name first'; }
          return;
        }
        document.body.classList.add('printing-cert');
        window.print();
        setTimeout(function () { document.body.classList.remove('printing-cert'); }, 300);
      });
    }

    if (state.quiz && state.quiz.passed && completion) {
      completion.classList.add('is-open');
      renderCert();
    }
  }

  greet();
  paint();
})();

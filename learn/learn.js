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
  var stEl = document.querySelector('[data-hub-started]');
  var started = COURSES.filter(function (id) {
    var s = store(id);
    return (s.read || []).length > 0 || (s.quiz && s.quiz.passed);
  }).length;
  if (xpEl) xpEl.textContent = totalXP;
  if (crEl) crEl.textContent = credits;
  if (stEl) stEl.textContent = started;
  /* the scoreboard means nothing to someone who has not begun */
  var statsEl = document.querySelector('[data-hub-stats]');
  if (statsEl && started > 0) statsEl.hidden = false;

  /* ---------- hub: the path, with live state ----------
     Stage 1 is the two foundation courses. Stage 2 is any one edition, because
     nobody needs all six. Stage 3 is the teaching material. */
  var doneIn = function (ids) {
    return ids.filter(function (id) { var s = store(id); return s.quiz && s.quiz.passed; }).length;
  };
  var STAGES = {
    foundation: ['foundations', 'capabilities'],
    edition: ['builders', 'educators', 'pk12', 'nonprofits', 'smallbiz', 'students'],
    teach: ['teaching', 'trainer']
  };
  var pathEls = document.querySelectorAll('.path > a[data-path]');
  if (pathEls.length) {
    var touchedIn = function (ids) {
      return ids.filter(function (id) { return (store(id).read || []).length > 0; }).length;
    };
    var fDone = doneIn(STAGES.foundation), eDone = doneIn(STAGES.edition), tDone = doneIn(STAGES.teach);
    var state = {
      foundation: { done: fDone >= 2, label: fDone ? fDone + ' of 2 courses passed' : (touchedIn(STAGES.foundation) ? 'In progress' : 'Start here') },
      edition: { done: eDone >= 1, label: eDone ? (eDone === 1 ? 'One edition passed' : eDone + ' editions passed') : (touchedIn(STAGES.edition) ? 'In progress' : 'Pick one when you are ready') },
      teach: { done: tDone >= 1, label: tDone ? 'Passed' : (touchedIn(STAGES.teach) ? 'In progress' : (eDone >= 1 ? 'Ready when you are' : 'Optional, for facilitators')) }
    };
    /* the active stage is the first one not yet finished */
    var order = ['foundation', 'edition', 'teach'];
    var active = order.filter(function (k) { return !state[k].done; })[0];
    pathEls.forEach(function (el) {
      var k = el.getAttribute('data-path');
      var s = state[k];
      if (!s) return;
      el.querySelector('.path__s').textContent = s.done ? 'Done' : s.label;
      el.classList.toggle('is-done', s.done);
      el.classList.toggle('is-active', k === active && started > 0);
    });
  }

  /* ---------- hub: one adaptive next action ----------
     A first-time visitor gets the first course. Someone mid-course gets that
     course and lesson. Someone between stages gets the next stage. */
  var actionEl = document.querySelector('[data-next-action]');
  var whereEl = document.querySelector('[data-next-where]');
  if (actionEl) {
    var linkFor = function (id) {
      var chip = document.querySelector('[data-course-status="' + id + '"]');
      var card = chip && chip.closest('.course-card');
      var a = card && card.querySelector('h3 a');
      return a ? { href: a.getAttribute('href'), title: a.textContent.trim(), lessons: parseInt(chip.getAttribute('data-lessons') || '0', 10) } : null;
    };
    var inProgress = null;
    COURSES.forEach(function (id) {
      var s = store(id);
      if (s.quiz && s.quiz.passed) return;
      if (!(s.read || []).length && typeof s.at !== 'number') return;
      if (!inProgress || (s.ts || 0) > (inProgress.s.ts || 0)) inProgress = { id: id, s: s };
    });
    if (inProgress) {
      var l = linkFor(inProgress.id);
      if (l) {
        actionEl.setAttribute('href', l.href);
        actionEl.textContent = 'Continue ' + l.title + ' →';
        var at = (typeof inProgress.s.at === 'number' ? inProgress.s.at : 0) + 1;
        if (whereEl && l.lessons) whereEl.textContent = 'You are on lesson ' + Math.min(at, l.lessons) + ' of ' + l.lessons + '. Saved in this browser only.';
      }
    } else if (started > 0) {
      var nextId = null, label = '';
      if (doneIn(STAGES.foundation) < 2) { nextId = STAGES.foundation.filter(function (i) { var s = store(i); return !(s.quiz && s.quiz.passed); })[0]; label = 'Continue stage 1: '; }
      else if (doneIn(STAGES.edition) < 1) { actionEl.setAttribute('href', '#editions'); actionEl.textContent = 'Stage 2: choose your edition →'; }
      else if (doneIn(STAGES.teach) < 1) { actionEl.setAttribute('href', 'learn/teaching-ai-fluency.html'); actionEl.textContent = 'Stage 3: teach it forward →'; }
      else { actionEl.setAttribute('href', 'learn/research.html'); actionEl.textContent = 'Read the research behind this →'; }
      if (nextId) {
        var nl = linkFor(nextId);
        if (nl) { actionEl.setAttribute('href', nl.href); actionEl.textContent = label + nl.title + ' →'; }
      }
      if (whereEl) whereEl.textContent = 'Saved in this browser only, so your progress stays on this device.';
    }
  }


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
    var ring = document.querySelector('.course-ring__fill');
    if (ring) {
      var C = 2 * Math.PI * 54;
      ring.setAttribute('stroke-dasharray', C.toFixed(1));
      ring.setAttribute('stroke-dashoffset', (C * (1 - p / 100)).toFixed(1));
    }
    var ringPct = document.querySelector('.course-ring__pct');
    if (ringPct) ringPct.textContent = p + '%';
    var ringFoot = document.querySelector('.course-ring__foot');
    if (ringFoot) ringFoot.textContent = done ? done + ' of ' + total + ' done' : 'Not started';
    var passedEl = document.querySelector('.course-rail__passed');
    if (passedEl) {
      var isPassed = !!(state.quiz && state.quiz.passed);
      passedEl.classList.toggle('is-on', isPassed);
      passedEl.textContent = isPassed ? 'Passed, certificate earned' : '';
    }
    lessons.forEach(function (s) {
      var li = railFor(s.id);
      if (li) li.classList.toggle('is-read', state.read.indexOf(s.id) >= 0);
    });
  }

  function markRead(id) {
    if (id && state.read.indexOf(id) < 0) { state.read.push(id); state.ts = Date.now(); save(courseId, state); paint(); }
  }

  /* ---------- learner name ---------- */
  function greet() {
    var hello = document.querySelector('.course-rail__hello');
    var p = profile();
    if (hello) hello.textContent = p.name ? 'Learning as ' + p.name : '';
    var card = document.querySelector('.begin-card');
    if (card) {
      card.classList.toggle('is-saved', !!p.name);
      var note = card.querySelector('p');
      if (note) {
        while (note.firstChild) note.removeChild(note.firstChild);
        var lead = document.createElement('strong');
        if (p.name) {
          lead.textContent = 'Ready, ' + p.name.split(' ')[0] + '.';
          note.appendChild(lead);
          note.appendChild(document.createTextNode(' This name goes on your certificate. Change it any time.'));
        } else {
          lead.textContent = 'Before you start:';
          note.appendChild(lead);
          note.appendChild(document.createTextNode(' add the name for your certificate. Progress and points stay in this browser.'));
        }
      }
    }
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

  /* initial === true on first render: do not touch the hash there. Writing it
     during a deferred script makes Chrome run its post-load fragment scroll and
     dump the learner into the middle of the page. */
  function show(i, scroll, initial) {
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
    body.classList.toggle('at-start', current === 0);
    body.classList.toggle('at-end', current === lessons.length - 1);
    if (!initial && history.replaceState) history.replaceState(null, '', '#' + lessons[current].id);
    state.at = current;
    state.ts = Date.now();
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
    show(start, false, true);
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
        when: (state.quiz && state.quiz.passed && state.quiz.when) || new Date().toISOString().slice(0, 10),
        /* carry the minted seed so a retake never changes an issued code */
        seed: state.quiz && state.quiz.seed
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

    /* Certificate code: minted once per earned certificate and stored, so it is
       unique even for two learners with the same name on the same day, and stable
       on every later view. Hash of name, course, date and a per-issue random seed,
       rendered in a base32 alphabet without lookalike characters. */
    function certCode(name, when) {
      if (!state.quiz) return '';
      if (!state.quiz.seed) {
        var seed = '';
        if (window.crypto && window.crypto.getRandomValues) {
          var arr = new Uint32Array(2);
          window.crypto.getRandomValues(arr);
          seed = arr[0].toString(36) + arr[1].toString(36);
        } else {
          seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
        }
        state.quiz.seed = seed;
        save(courseId, state);
      }
      var s = name + '|' + courseId + '|' + (when || '') + '|' + state.quiz.seed;
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

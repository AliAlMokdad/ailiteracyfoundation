/* AI Fluency Learning, course player engine v2.
   Progress, points and the learner's name live in localStorage only, on the
   learner's own device. Nothing is sent anywhere.
   Points: +10 per lesson read, +5 per inline check answered correctly (awarded
   once), quiz adds +2 per correct answer on the best attempt, +10 bonus for a
   perfect score. A course is finished, and its certificate issued, when every
   section has been read; the quiz section counts as read only once passed, so a
   quizzed course needs both the reading and the pass. */
(function () {
  'use strict';


  /* ---------- language ----------
     The page declares its language and the player follows it. Sentences are whole
     templates, not fragments joined at run time, because Danish does not put the
     pieces in the same order English does. */
  var LANG = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
  var STR = {
    en: {
      completed: 'Completed', inProgress: 'In progress', notStarted: 'Not started', done: 'Done',
      foundationPassed: '{n} of 2 courses passed',
      oneEdition: 'One edition passed', nEditions: '{n} editions passed',
      pickOne: 'Pick one when you are ready', readyWhen: 'Ready when you are',
      optionalFac: 'Optional, for facilitators', teachDone: '{n} of 3 done',
      continueTo: 'Continue: {title} \u2192', continueStage1: 'Continue stage 1: {title} \u2192',
      stage2: 'Stage 2: choose your edition \u2192', stage3To: 'Stage 3: {title} \u2192',
      stage3: 'Stage 3: teach it forward \u2192', readResearch: 'Read the research behind this \u2192',
      onLesson: 'You are on lesson {n} of {m}.',
      noStoreHub: 'No sign-up and no tracking. This browser is blocking storage, so nothing here will be remembered once you leave the page.',
      noStoreCourse: 'This browser is blocking storage, so this course cannot remember your progress.',
      readPct: '{n} of {m} read \u00b7 {p}%', readCount: '{n} of {m} read', notStartedRing: 'Not started',
      seeCert: 'Passed. See your certificate',
      unread1: 'Passed. 1 section still unread', unreadN: 'Passed. {n} sections still unread',
      quizPassed: 'Quiz passed', courseComplete: 'Course complete',
      gate1: 'The certificate is issued for the whole course. 1 section is still unread. Finish them and it appears here.',
      gateN: 'The certificate is issued for the whole course. {n} sections are still unread. Finish them and it appears here.',
      gotoUnread: 'Go to the first unread section \u2192',
      certHow: 'Add your name, then print or save as PDF. The record lives in this browser only, so keep the file.',
      learningAs: 'Learning as {name}',
      readyName: 'Ready, {first}.',
      nameNote: ' This name goes on your certificate. Change it any time; the certificate code stays the same.',
      beforeStart: 'Before you start:',
      beforeStartNote: ' add the name for your certificate. Progress and points stay in this browser.',
      next: 'Next \u2192', endOfCourse: 'End of course', markedDone: 'Completed \u2713',
      markComplete: 'Mark complete', prev: '\u2190 Previous', pagerPos: '{n} of {m}',
      checkAward: '+5 points', checkMiss: 'The explanation below is the point; no points this time.',
      answerAll: 'Answer every question first. {n} left.',
      passed: 'You passed. {c} of {t} correct ({p}%).',
      passedBefore: 'This attempt: {c} of {t}. Your earlier pass and certificate stand.',
      notYet: 'Not yet. {c} of {t} correct ({p}%). The explanation under each question shows why. Unlimited retries.',
      retake: 'Retake this quiz', submit: 'Submit answers',
      allDone: 'Revisit any course \u2192',
      allDoneNote: 'You have finished the path. Every course stays open if you want to come back to one.',
      needsName: 'needs a name', addNameAbove: 'Add your name above', addNameFirst: 'Add your name first',
      updateName: 'Update the name', putOnCert: 'Put it on the certificate'
    },
    da: {
      completed: 'Gennemf\u00f8rt', inProgress: 'I gang', notStarted: 'Ikke begyndt', done: 'F\u00e6rdig',
      foundationPassed: '{n} af 2 kurser best\u00e5et',
      oneEdition: '\u00c9n udgave best\u00e5et', nEditions: '{n} udgaver best\u00e5et',
      pickOne: 'V\u00e6lg \u00e9n, n\u00e5r du er klar', readyWhen: 'Klar, n\u00e5r du er',
      optionalFac: 'Valgfrit, for undervisere', teachDone: '{n} af 3 f\u00e6rdige',
      continueTo: 'Forts\u00e6t: {title} \u2192', continueStage1: 'Forts\u00e6t trin 1: {title} \u2192',
      stage2: 'Trin 2: v\u00e6lg din udgave \u2192', stage3To: 'Trin 3: {title} \u2192',
      stage3: 'Trin 3: l\u00e6r det videre \u2192', readResearch: 'L\u00e6s forskningen bag \u2192',
      onLesson: 'Du er p\u00e5 lektion {n} af {m}.',
      noStoreHub: 'Ingen oprettelse og ingen sporing. Denne browser blokerer lagring, s\u00e5 intet her bliver husket, n\u00e5r du forlader siden.',
      noStoreCourse: 'Denne browser blokerer lagring, s\u00e5 dette kursus kan ikke huske, hvor langt du er n\u00e5et.',
      readPct: '{n} af {m} l\u00e6st \u00b7 {p}%', readCount: '{n} af {m} l\u00e6st', notStartedRing: 'Ikke begyndt',
      seeCert: 'Best\u00e5et. Se dit bevis',
      unread1: 'Best\u00e5et. 1 afsnit mangler at blive l\u00e6st', unreadN: 'Best\u00e5et. {n} afsnit mangler at blive l\u00e6st',
      quizPassed: 'Test best\u00e5et', courseComplete: 'Kurset er gennemf\u00f8rt',
      gate1: 'Beviset g\u00e6lder hele kurset. Der mangler 1 afsnit. L\u00e6s det, s\u00e5 dukker beviset op her.',
      gateN: 'Beviset g\u00e6lder hele kurset. Der mangler {n} afsnit. L\u00e6s dem, s\u00e5 dukker beviset op her.',
      gotoUnread: 'G\u00e5 til det f\u00f8rste ul\u00e6ste afsnit \u2192',
      certHow: 'Skriv dit navn, og udskriv derefter beviset eller gem det som PDF. Det ligger kun i denne browser, s\u00e5 gem filen.',
      learningAs: 'Du l\u00e6rer som {name}',
      readyName: 'Klar, {first}.',
      nameNote: ' Dette navn kommer p\u00e5 dit bevis. Du kan \u00e6ndre det n\u00e5r som helst, og bevisets kode forbliver den samme.',
      beforeStart: 'F\u00f8r du begynder:',
      beforeStartNote: ' skriv navnet til dit bevis. Fremgang og point bliver i denne browser.',
      next: 'N\u00e6ste \u2192', endOfCourse: 'Kurset slutter her', markedDone: 'Gennemf\u00f8rt \u2713',
      markComplete: 'Marker som l\u00e6st', prev: '\u2190 Forrige', pagerPos: '{n} af {m}',
      checkAward: '+5 point', checkMiss: 'Forklaringen nedenfor er pointen. Ingen point denne gang.',
      answerAll: 'Svar p\u00e5 alle sp\u00f8rgsm\u00e5l f\u00f8rst. Der mangler {n}.',
      passed: 'Du best\u00e5r. {c} ud af {t} rigtige ({p}%).',
      passedBefore: 'Dette fors\u00f8g: {c} ud af {t}. Din tidligere best\u00e5else og dit bevis st\u00e5r ved magt.',
      notYet: 'Ikke endnu. {c} ud af {t} rigtige ({p}%). Forklaringen under hvert sp\u00f8rgsm\u00e5l viser hvorfor. Ubegr\u00e6nsede fors\u00f8g.',
      retake: 'Tag testen igen', submit: 'Send svar',
      allDone: 'Se et kursus igen \u2192',
      allDoneNote: 'Du har gennemf\u00f8rt forl\u00f8bet. Alle kurser bliver st\u00e5ende, hvis du vil vende tilbage til et af dem.',
      needsName: 'mangler et navn', addNameAbove: 'Skriv dit navn ovenfor', addNameFirst: 'Skriv dit navn f\u00f8rst',
      updateName: 'Ret navn', putOnCert: 'S\u00e6t det p\u00e5 beviset'
    }
  };
  function T(k, vars) {
    var s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  }

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
  /* does this browser actually keep what we write? private mode and blocked
     storage both throw, and the copy must not promise persistence we cannot give */
  var persists = (function () {
    try {
      localStorage.setItem('ailf_probe', 'x');
      var ok = localStorage.getItem('ailf_probe') === 'x';
      localStorage.removeItem('ailf_probe');
      return ok;
    } catch (e) { return false; }
  })();

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

  /* ONE definition of finished, used by the hub, the path and the certificate:
     every section of the course has been read. The quiz section is only marked
     read when the quiz is passed, so for a course with a quiz this means the
     learner read the material AND passed. For the reference, the workshop kit
     and the research, which have no quiz, it means they read all of it. */
  var TOTAL = {};
  document.querySelectorAll('[data-course-status]').forEach(function (c) {
    TOTAL[c.getAttribute('data-course-status')] = parseInt(c.getAttribute('data-lessons') || '0', 10);
  });
  function isComplete(id) {
    var s = store(id);
    var t = (typeof s.total === 'number' && s.total > 0) ? s.total : (TOTAL[id] || 0);
    return t > 0 && (s.read || []).length >= t;
  }
  /* one predicate for "has this learner begun", used by the chips, the scoreboard
     and the next action alike. Opening a course writes state.at, and that counts:
     otherwise the hub offered Continue for a course it also called unstarted. */
  function hasBegun(id) {
    var s = store(id);
    return (s.read || []).length > 0 || typeof s.at === 'number' || isComplete(id);
  }

  /* ---------- hub: status chips, progress edges, totals ---------- */
  var totalXP = 0, credits = 0;
  COURSES.forEach(function (id) {
    var s = store(id);
    totalXP += courseXP(s);
    if (s.quiz && s.quiz.passed && isComplete(id)) credits++;
  });
  document.querySelectorAll('[data-course-status]').forEach(function (chip) {
    var id = chip.getAttribute('data-course-status');
    var s = store(id);
    var card = chip.closest('.course-card');
    var read = (s.read || []).length;
    var total = parseInt(chip.getAttribute('data-lessons') || '0', 10);
    var complete = isComplete(id);
    if (complete) { chip.textContent = T('completed'); chip.hidden = false; }
    else if (hasBegun(id)) { chip.textContent = T('inProgress'); chip.hidden = false; }
    /* the edge always shows how much has been read, never a rounded-up 100% */
    if ((complete || hasBegun(id)) && card && total) {
      card.setAttribute('data-progress', '');
      card.style.setProperty('--p', Math.min(100, Math.round(read / total * 100)) + '%');
    }
  });
  var xpEl = document.querySelector('[data-hub-xp]');
  var crEl = document.querySelector('[data-hub-credits]');
  var stEl = document.querySelector('[data-hub-started]');
  var started = COURSES.filter(hasBegun).length;
  if (xpEl) xpEl.textContent = totalXP;
  if (crEl) crEl.textContent = credits;
  if (stEl) stEl.textContent = started;
  /* the scoreboard means nothing to someone who has not begun */
  var statsEl = document.querySelector('[data-hub-stats]');
  if (statsEl && started > 0) statsEl.hidden = false;
  if (!persists) {
    var warnEl = document.querySelector('[data-next-where]');
    if (warnEl) {
      warnEl.textContent = T('noStoreHub');
      warnEl.setAttribute('data-locked', '');
    }
  }

  /* ---------- hub: the path, with live state ----------
     Stage 1 is the two foundation courses. Stage 2 is any one edition, because
     nobody needs all six. Stage 3 is the teaching material. */
  var doneIn = function (ids) {
    return ids.filter(isComplete).length;
  };
  var STAGES = {
    foundation: ['foundations', 'capabilities'],
    edition: ['builders', 'educators', 'pk12', 'nonprofits', 'smallbiz', 'students'],
    teach: ['teaching', 'trainer', 'research']
  };
  var pathEls = document.querySelectorAll('.path > a[data-path]');
  if (pathEls.length) {
    var touchedIn = function (ids) { return ids.filter(hasBegun).length; };
    var fDone = doneIn(STAGES.foundation), eDone = doneIn(STAGES.edition), tDone = doneIn(STAGES.teach);
    var state = {
      foundation: { done: fDone >= 2, label: fDone ? T('foundationPassed', { n: fDone }) : (touchedIn(STAGES.foundation) ? T('inProgress') : T('notStarted')) },
      edition: { done: eDone >= 1, label: eDone ? (eDone === 1 ? T('oneEdition') : T('nEditions', { n: eDone })) : (touchedIn(STAGES.edition) ? T('inProgress') : T('pickOne')) },
      teach: { done: tDone >= 3, label: tDone ? T('teachDone', { n: tDone }) : (touchedIn(STAGES.teach) ? T('inProgress') : (eDone >= 1 ? T('readyWhen') : T('optionalFac'))) }
    };
    /* the active stage is the first one not yet finished */
    var order = ['foundation', 'edition', 'teach'];
    var active = order.filter(function (k) { return !state[k].done; })[0];
    pathEls.forEach(function (el) {
      var k = el.getAttribute('data-path');
      var s = state[k];
      if (!s) return;
      el.querySelector('.path__s').textContent = s.done ? T('done') : s.label;
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
      if (isComplete(id) || !hasBegun(id)) return;
      if (!inProgress || (s.ts || 0) > (inProgress.s.ts || 0)) inProgress = { id: id, s: s };
    });
    if (inProgress) {
      var l = linkFor(inProgress.id);
      if (l) {
        actionEl.setAttribute('href', l.href);
        actionEl.textContent = T('continueTo', { title: l.title });
        var at = (typeof inProgress.s.at === 'number' ? inProgress.s.at : 0) + 1;
        if (whereEl && l.lessons && !whereEl.hasAttribute('data-locked')) whereEl.textContent = T('onLesson', { n: Math.min(at, l.lessons), m: l.lessons });
      }
    } else if (started > 0 && doneIn(STAGES.foundation) >= 2 && doneIn(STAGES.edition) >= 1
               && doneIn(STAGES.teach) >= STAGES.teach.length) {
      /* the path is finished. There may be editions left, but the learner was told to
         take one, so pointing them at a course they already completed is a lie. */
      actionEl.setAttribute('href', '#start-here');
      actionEl.textContent = T('allDone');
      if (whereEl && !whereEl.hasAttribute('data-locked')) {
        whereEl.hidden = false;
        whereEl.textContent = T('allDoneNote');
      }
    } else if (started > 0) {
      var nextId = null;
      if (doneIn(STAGES.foundation) < 2) { nextId = STAGES.foundation.filter(function (i) { var s = store(i); return !(s.quiz && s.quiz.passed); })[0]; }
      else if (doneIn(STAGES.edition) < 1) { actionEl.setAttribute('href', '#editions'); actionEl.textContent = T('stage2'); }
      else if (doneIn(STAGES.teach) < STAGES.teach.length) {
        var nextTeach = STAGES.teach.filter(function (i) { return !isComplete(i); })[0];
        var tl = linkFor(nextTeach);
        if (tl) { actionEl.setAttribute('href', tl.href); actionEl.textContent = T('stage3To', { title: tl.title }); }
        else { actionEl.setAttribute('href', '#teach'); actionEl.textContent = T('stage3'); }
      }
      else { actionEl.setAttribute('href', 'learn/research.html'); actionEl.textContent = T('readResearch'); }
      if (nextId) {
        var nl = linkFor(nextId);
        if (nl) { actionEl.setAttribute('href', nl.href); actionEl.textContent = T('continueStage1', { title: nl.title }); }
      }
      if (whereEl && !whereEl.hasAttribute('data-locked')) whereEl.hidden = true;
    }
  }


  if (!courseEl) return;

  /* ---------- course state ---------- */
  var courseId = courseEl.getAttribute('data-course');
  var state = store(courseId);
  state.read = state.read || [];
  state.checks = state.checks || {};

  if (!persists) {
    var progTop = document.querySelector('.course-rail__progress--top');
    if (progTop && !document.querySelector('.course-rail__warn')) {
      var warn = document.createElement('p');
      warn.className = 'course-rail__warn';
      warn.setAttribute('role', 'status');
      warn.textContent = T('noStoreCourse');
      progTop.parentNode.insertBefore(warn, progTop.nextSibling);
    }
  }

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

  var hasQuiz = !!document.querySelector('.quiz form');

  (function () {
    var el = document.querySelector('.course-rail__passed');
    if (!el) return;
    var goToCert = function () {
      if (!el.classList.contains('is-link')) return;
      var q = -1;
      lessons.forEach(function (s, k) { if (s.classList.contains('lesson--quiz')) q = k; });
      if (q < 0) return;
      show(q, false);
      var comp = document.querySelector('.completion');
      if (comp) {
        window.requestAnimationFrame(function () {
          comp.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };
    el.addEventListener('click', goToCert);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToCert(); }
    });
  })();

  /* A certificate is issued for a course that was read and passed. Passing alone
     opens the card and says plainly what is still missing, rather than blocking in
     silence or handing out a credential for one minute of work. */
  function updateCompletion(done, total) {
    var comp = document.querySelector('.completion');
    if (!comp) return;
    var passed = !!(state.quiz && state.quiz.passed);
    if (!passed) return;
    var left = total - done;
    var head = comp.querySelector('.completion__bar h3');
    var note = comp.querySelector('.completion__bar p');
    var row = comp.querySelector('.name-row');
    var frame = comp.querySelector('.cert-frame');
    comp.classList.toggle('is-locked', left > 0);
    if (left > 0) {
      if (head) head.textContent = T('quizPassed');
      if (note) note.textContent = left === 1 ? T('gate1') : T('gateN', { n: left });
      if (row) row.hidden = true;
      if (frame) frame.hidden = true;
      /* the learner is standing on the quiz with the pager spent, so give them the
         way back to the material rather than leaving them to find it */
      var go = comp.querySelector('[data-goto-unread]');
      if (!go && row && row.parentNode) {
        go = document.createElement('button');
        go.type = 'button';
        go.className = 'lbtn lbtn--primary';
        go.setAttribute('data-goto-unread', '');
        row.parentNode.appendChild(go);
        go.addEventListener('click', function () {
          var target = -1;
          lessons.forEach(function (s, k) {
            if (target < 0 && state.read.indexOf(s.id) < 0 && !s.classList.contains('lesson--quiz')) target = k;
          });
          if (target >= 0) show(target);
        });
      }
      if (go) { go.hidden = false; go.textContent = T('gotoUnread'); }
    } else {
      if (head) head.textContent = T('courseComplete');
      if (note) note.textContent = T('certHow');
      if (row) row.hidden = false;
      if (frame) frame.hidden = false;
      var goDone = comp.querySelector('[data-goto-unread]');
      if (goDone) goDone.hidden = true;
    }
  }

  function paint() {
    var total = lessons.length;
    var done = lessons.filter(function (s) { return state.read.indexOf(s.id) >= 0; }).length;
    var p = total ? Math.round((done / total) * 100) : 0;
    if (total && state.total !== total) { state.total = total; save(courseId, state); }

    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = T('readPct', { n: done, m: total, p: p });
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
    if (ringFoot) ringFoot.textContent = done ? T('readCount', { n: done, m: total }) : T('notStartedRing');
    var passedEl = document.querySelector('.course-rail__passed');
    if (passedEl) {
      var isPassed = !!(state.quiz && state.quiz.passed);
      var left = total - done;
      passedEl.classList.toggle('is-on', isPassed);
      passedEl.classList.toggle('is-part', isPassed && left > 0);
      var ready = isPassed && left <= 0;
      passedEl.textContent = !isPassed ? ''
        : (ready ? T('seeCert') : (left === 1 ? T('unread1') : T('unreadN', { n: left })));
      passedEl.classList.toggle('is-link', ready);
      if (ready) {
        passedEl.setAttribute('role', 'button');
        passedEl.setAttribute('tabindex', '0');
      } else {
        passedEl.removeAttribute('role');
        passedEl.removeAttribute('tabindex');
      }
    }
    updateCompletion(done, total);
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
    if (hello) hello.textContent = p.name ? T('learningAs', { name: p.name }) : '';
    var card = document.querySelector('.begin-card');
    if (card) {
      card.classList.toggle('is-saved', !!p.name);
      var note = card.querySelector('p');
      if (note) {
        while (note.firstChild) note.removeChild(note.firstChild);
        var lead = document.createElement('strong');
        if (p.name) {
          lead.textContent = T('readyName', { first: p.name.split(' ')[0] });
          note.appendChild(lead);
          note.appendChild(document.createTextNode(T('nameNote')));
        } else {
          lead.textContent = T('beforeStart');
          note.appendChild(lead);
          note.appendChild(document.createTextNode(T('beforeStartNote')));
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
    var leaving = lessons[current];
    if (!initial && leaving && !leaving.classList.contains('lesson--quiz') && i !== current) markRead(leaving.id);
    current = Math.max(0, Math.min(lessons.length - 1, i));
    lessons.forEach(function (s, k) { s.classList.toggle('is-current', k === current); });
    railItems.forEach(function (li) { li.classList.remove('is-active'); });
    var li = railFor(lessons[current].id);
    if (li) li.classList.add('is-active');
    if (pgPos) pgPos.textContent = T('pagerPos', { n: current + 1, m: lessons.length });
    if (pgPrev) { if (current === 0) pgPrev.setAttribute('disabled', ''); else pgPrev.removeAttribute('disabled'); }
    if (pgNext) {
      var last = current === lessons.length - 1;
      var hasQuiz = !!document.querySelector('.lesson--quiz');
      if (!last) {
        pgNext.textContent = T('next');
        pgNext.removeAttribute('disabled');
      } else if (hasQuiz) {
        pgNext.textContent = T('endOfCourse');
        pgNext.setAttribute('disabled', '');
      } else if (state.read.indexOf(lessons[current].id) >= 0) {
        pgNext.textContent = T('markedDone');
        pgNext.setAttribute('disabled', '');
      } else {
        pgNext.textContent = T('markComplete');
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
    pgPrev.type = 'button'; pgPrev.className = 'lbtn'; pgPrev.textContent = T('prev');
    pgPos = document.createElement('span');
    pgPos.className = 'pager__pos'; pgPos.setAttribute('aria-live', 'polite');
    pgNext = document.createElement('button');
    pgNext.type = 'button'; pgNext.className = 'lbtn lbtn--primary'; pgNext.textContent = T('next');
    pager.appendChild(pgPrev); pager.appendChild(pgPos); pager.appendChild(pgNext);
    var lastLesson = lessons[lessons.length - 1];
    lastLesson.parentNode.insertBefore(pager, lastLesson.nextSibling);

    pgPrev.addEventListener('click', function () { show(current - 1); });
    pgNext.addEventListener('click', function () {
      /* the last section has nothing after it to leave for, so mark it here */
      if (current === lessons.length - 1) { markRead(lessons[current].id); show(current, false); }
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
        award.textContent = state.checks[key] ? T('checkAward') :
          (first ? T('checkMiss') : '');
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
        result.textContent = T('answerAll', { n: unanswered.length });
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
        when: (state.quiz && state.quiz.passed && state.quiz.when) || (function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); })(new Date()),
        /* carry the issued code and its seed, so neither a retake nor a later
           correction to the name can change a certificate already given out */
        seed: state.quiz && state.quiz.seed,
        code: state.quiz && state.quiz.code
      };
      save(courseId, state);
      if (passed) {
        result.textContent = T('passed', { c: correct, t: sets.length, p: Math.round(score * 100) });
        result.className = 'quiz-result pass';
      } else if (alreadyPassed) {
        result.textContent = T('passedBefore', { c: correct, t: sets.length });
        result.className = 'quiz-result';
      } else {
        result.textContent = T('notYet', { c: correct, t: sets.length, p: Math.round(score * 100) });
        result.className = 'quiz-result fail';
      }
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = (passed || alreadyPassed) ? T('retake') : T('submit');
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

    function clearAttempt() {
      form.querySelectorAll('fieldset').forEach(function (fs) {
        fs.classList.remove('is-graded', 'is-correct', 'is-wrong');
        fs.querySelectorAll('input').forEach(function (i) { i.checked = false; });
      });
      result.textContent = '';
      result.className = 'quiz-result';
      if (retry) retry.hidden = true;
      var sb = form.querySelector('button[type="submit"]');
      if (sb) sb.textContent = T('submit');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    form.addEventListener('click', function (ev) {
      var sb = ev.target.closest('button[type="submit"]');
      if (sb && sb.textContent === T('retake')) { ev.preventDefault(); ev.stopPropagation(); clearAttempt(); }
    }, true);

    if (retry) { retry.addEventListener('click', clearAttempt); }

    /* Certificate code: minted once, on first issue, and then stored. Two learners
       with the same name on the same day get different codes, and correcting your
       own name later does not reissue a different one. Hash of name, course, date
       and a per-issue random seed, in a base32 alphabet without lookalikes. */
    function certCode(name, when) {
      if (!state.quiz) return '';
      /* already issued: return it unchanged, whatever the name says now */
      if (state.quiz.code) return state.quiz.code;
      var seed = state.quiz.seed;
      if (!seed) {
        if (window.crypto && window.crypto.getRandomValues) {
          var arr = new Uint32Array(2);
          window.crypto.getRandomValues(arr);
          seed = arr[0].toString(36) + arr[1].toString(36);
        } else {
          seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
        }
      }
      var s = name + '|' + courseId + '|' + (when || '') + '|' + seed;
      var h = 5381;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; }
      var alpha = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
      var out = '';
      for (var j = 0; j < 8; j++) { out += alpha[h % alpha.length]; h = (h * 31 + j) >>> 0; }
      state.quiz.seed = seed;
      state.quiz.code = 'AILF-' + out.slice(0, 4) + '-' + out.slice(4);
      save(courseId, state);
      return state.quiz.code;
    }

    renderCert = function () {
      var p = profile();
      var name = p.name || '';
      var el;
      if ((el = document.querySelector('.cert__name'))) el.textContent = name || T('addNameAbove');
      if ((el = document.querySelector('[data-cert-date]')) && state.quiz) el.textContent = state.quiz.when;
      if ((el = document.querySelector('[data-cert-score]')) && state.quiz) el.textContent = (state.quiz.best || state.quiz.score) + ' / ' + state.quiz.total;
      if ((el = document.querySelector('[data-cert-code]')) && state.quiz) el.textContent = name ? certCode(name, state.quiz.when) : T('needsName');
      if ((el = document.querySelector('[data-cert-points]'))) el.textContent = courseXP(state);
    };

    var printBtn0 = document.querySelector('[data-print-cert]');
    var nameBtn0 = document.querySelector('[data-save-name]');
    function certButtons() {
      var named = !!(profile().name || '').trim();
      if (nameBtn0) nameBtn0.className = 'lbtn' + (named ? '' : ' lbtn--primary');
      if (printBtn0) printBtn0.className = 'lbtn' + (named ? ' lbtn--primary' : '');
      if (nameBtn0) nameBtn0.textContent = named ? T('updateName') : T('putOnCert');
    }

    var nameSave = document.querySelector('[data-save-name]');
    if (nameSave) {
      nameSave.addEventListener('click', function () {
        var input = document.querySelector('.completion input[type="text"]');
        var p = profile();
        p.name = (input.value || '').trim();
        saveProfile(p);
        greet();
        renderCert();
        certButtons();
      });
    }
    certButtons();

    var printBtn = document.querySelector('[data-print-cert]');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        if (!(profile().name || '').trim()) {
          var input = document.querySelector('.completion input[type="text"]');
          if (input) { input.focus(); input.placeholder = T('addNameFirst'); }
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

/* ---------------------------------------------------------------------------
   Entrance choreography. Tags its own targets, so no HTML changes anywhere.
   Reveals in reading order with a small stagger, once, on first approach.
   Skipped entirely under reduced motion, and skipped if IntersectionObserver
   is missing, in which case nothing is ever hidden.
   --------------------------------------------------------------------------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var GROUPS = [
    ['.learn-hero h1, .learn-hero .lede, .learn-cta, .learn-note-inline, .loops-figure', 70],
    ['.path > a', 60],
    ['.course-card', 55],
    ['.learn-section > .wrap--wide > h2, .learn-section .section-sub', 60]
  ];

  var targets = [];
  GROUPS.forEach(function (g) {
    var nodes = document.querySelectorAll(g[0]);
    for (var i = 0; i < nodes.length; i++) targets.push([nodes[i], g[1]]);
  });
  if (!targets.length) return;

  document.documentElement.classList.add('js-reveal');
  targets.forEach(function (t) { t[0].setAttribute('data-rise', ''); });

  var io = new IntersectionObserver(function (entries) {
    /* stagger within the batch that crosses together, so a row of cards
       arrives as a sequence rather than a slab */
    var shown = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var step = Number(e.target.getAttribute('data-step')) || 60;
      e.target.style.setProperty('--rise-delay', (shown++ * step) + 'ms');
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  targets.forEach(function (t) {
    t[0].setAttribute('data-step', t[1]);
    io.observe(t[0]);
  });

  /* Guarantee one: anything already on screen reveals immediately, so the fold
     is never blank while waiting for a scroll that may never come. */
  requestAnimationFrame(function () {
    var vh = window.innerHeight || 800, shown = 0;
    targets.forEach(function (t) {
      var el = t[0];
      if (el.classList.contains('is-in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.style.setProperty('--rise-delay', (shown++ * t[1]) + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  });

  /* Guarantee two: a hard failsafe. Whatever happened, nothing stays invisible. */
  setTimeout(function () {
    targets.forEach(function (t) {
      if (!t[0].classList.contains('is-in')) { t[0].style.transitionDelay = '0ms'; t[0].classList.add('is-in'); }
    });
  }, 2500);
})();

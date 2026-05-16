/* AI Literacy Foundation — motion.js
   - Scroll-triggered reveal via IntersectionObserver
   - Count-up for status numbers
   - Rotating word in hero headlines
   - Header scroll-state toggle
   - Mobile nav: close on link click + close on Escape
   - Respects prefers-reduced-motion
*/
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Welcome / full-view toggle: when ?view=full is in the URL on mobile,
  // hide the mobile-landing and show the rich desktop-home content.
  try {
    if ((new URLSearchParams(window.location.search)).get('view') === 'full') {
      document.body.classList.add('view-full');
    }
  } catch (e) { /* old browser, ignore */ }

  // Mobile nav extras: close menu when a nav link is tapped, close on Escape
  var navEl = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  if (navEl && navToggle) {
    navEl.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (navEl.classList.contains('is-open')) {
          navEl.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navEl.classList.contains('is-open')) {
        navEl.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // Inject back-to-top button (no per-page HTML needed)
  var scrollTopBtn = null;
  (function() {
    scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top';
    scrollTopBtn.type = 'button';
    scrollTopBtn.setAttribute('aria-label', 'Back to top');
    scrollTopBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(scrollTopBtn);
    scrollTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  })();

  // Header scroll state + scroll progress bar + chapter indicator + back-to-top
  var header = document.querySelector('.site-header');
  var progressBar = document.querySelector('.scroll-progress');
  var chapter = document.querySelector('.chapter-indicator');
  var chapterNum = chapter ? chapter.querySelector('.chapter-indicator__current') : null;
  var chapterLabel = chapter ? chapter.querySelector('.chapter-indicator__label') : null;
  var chapterSections = chapter ? Array.prototype.slice.call(document.querySelectorAll('[data-chapter]')) : [];

  function onScroll() {
    if (header) {
      if (window.scrollY > 12) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    if (progressBar) {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (window.scrollY > 80) progressBar.classList.add('is-active');
      else progressBar.classList.remove('is-active');
    }
    if (scrollTopBtn) {
      if (window.scrollY > 600) scrollTopBtn.classList.add('is-visible');
      else scrollTopBtn.classList.remove('is-visible');
    }
    if (chapter && chapterSections.length) {
      var trigger = window.innerHeight * 0.4;
      var active = null;
      for (var i = 0; i < chapterSections.length; i++) {
        var rect = chapterSections[i].getBoundingClientRect();
        if (rect.top <= trigger) active = chapterSections[i];
      }
      if (active) {
        chapter.classList.add('is-visible');
        var num = active.getAttribute('data-chapter');
        var label = active.getAttribute('data-chapter-label') || '';
        if (chapterNum && chapterNum.textContent !== num) chapterNum.textContent = num;
        if (chapterLabel && chapterLabel.textContent !== label) chapterLabel.textContent = label;
      } else {
        chapter.classList.remove('is-visible');
      }
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // ---- Count-up animation ----
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target) || target === 0) {
      el.textContent = target || 0;
      return;
    }
    if (prefersReduced) {
      el.textContent = target.toLocaleString();
      return;
    }
    var duration = 1400;
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var value = Math.round(target * eased);
      el.textContent = value.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  // ---- Rotating word ----
  function lockRotatorWidth(el, words) {
    var measurer = document.createElement('span');
    var s = getComputedStyle(el);
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'nowrap';
    measurer.style.fontFamily = s.fontFamily;
    measurer.style.fontSize = s.fontSize;
    measurer.style.fontWeight = s.fontWeight;
    measurer.style.fontStyle = s.fontStyle;
    measurer.style.letterSpacing = s.letterSpacing;
    measurer.style.fontVariant = s.fontVariant;
    document.body.appendChild(measurer);
    var max = 0;
    words.forEach(function (w) {
      measurer.textContent = w;
      if (measurer.offsetWidth > max) max = measurer.offsetWidth;
    });
    document.body.removeChild(measurer);
    if (max > 0) el.style.minWidth = Math.ceil(max) + 'px';
  }

  function setupRotator(el) {
    var words;
    try { words = JSON.parse(el.getAttribute('data-words')); }
    catch (e) { return; }
    if (!Array.isArray(words) || words.length < 2) return;

    // Lock width to the widest word so layout doesn't reflow on swap
    // Wait for fonts before measuring so we get accurate width
    var doLock = function () { lockRotatorWidth(el, words); };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doLock);
    } else {
      doLock();
    }

    if (prefersReduced) return;

    var i = 0;
    var holdMs = 2400;   // how long each word holds
    var swapMs = 360;    // exit duration
    var started = false;

    function next() {
      el.classList.add('is-out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove('is-out');
        el.classList.add('is-in');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.classList.remove('is-in');
          });
        });
      }, swapMs);
    }

    function startCycle() {
      if (started) return;
      started = true;
      // Initial delay lets any hero entrance animation settle
      setTimeout(function loop() {
        next();
        setTimeout(loop, holdMs + swapMs);
      }, 1400);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            startCycle();
            io.disconnect();
          }
        });
      }, { threshold: 0.3 });
      io.observe(el);
    } else {
      startCycle();
    }
  }

  document.querySelectorAll('.rotator').forEach(setupRotator);

  // ---- Scroll reveal + count-up triggers ----
  var revealTargets = document.querySelectorAll('[data-reveal]');
  var countTargets = document.querySelectorAll('[data-count]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
    countTargets.forEach(function (el) {
      var n = parseInt(el.getAttribute('data-count'), 10);
      el.textContent = isNaN(n) ? '0' : n.toLocaleString();
    });
    return;
  }

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  countTargets.forEach(function (el) { countObserver.observe(el); });
})();

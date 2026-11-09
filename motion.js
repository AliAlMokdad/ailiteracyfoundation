/* AI Literacy Foundation: motion.js
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
    // Inject EN/DA language toggle into the mobile nav (only visible when nav opens on mobile).
    // Not on the error page: it is served for any missing address, so its "twin" is missing too.
    if (!document.querySelector('.error-page')) try {
      var path = window.location.pathname;
      var isDa = path.indexOf('/da/') === 0 || path === '/da' || path.indexOf('/da/') !== -1;
      // Compute partner URL: EN <-> DA mirror
      var partnerHref;
      if (isDa) {
        partnerHref = path.replace('/da/', '/');
        if (partnerHref === '/') partnerHref = '/index.html';
      } else {
        // EN -> DA. Strip leading slash, prepend /da/
        var rel = path.replace(/^\//, '');
        if (rel === '' || rel === 'index.html') rel = 'index.html';
        partnerHref = '/da/' + rel;
      }
      var langWrap = document.createElement('div');
      langWrap.className = 'nav-lang-mobile';
      langWrap.setAttribute('aria-label', 'Language');
      // Active language is a <span>, not a dead-link <a href="#">. Prevents browser navigation,
      // hash-pollution in the URL, and a confusing focus target for keyboard users.
      langWrap.innerHTML = isDa
        ? '<a href="' + partnerHref + '">EN</a><span aria-hidden="true">·</span><span class="active" aria-current="page">DA</span>'
        : '<span class="active" aria-current="page">EN</span><span aria-hidden="true">·</span><a href="' + partnerHref + '">DA</a>';
      navEl.appendChild(langWrap);
    } catch (e) { /* ignore */ }

    // The menu sits before its toggle in the page, so after opening it Tab would skip it.
    // Move focus to the first item (only for a keyboard press; a tap leaves focus alone).
    navToggle.setAttribute('aria-controls', navEl.id || 'nav');
    // The icon becomes a close cross while the menu is open (it used to turn sideways).
    var togglePath = navToggle.querySelector('path');
    var syncIcon = function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      togglePath.setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
    };
    if (togglePath) {
      syncIcon(); // the menu may already be open if it was tapped before this script ran
      if ('MutationObserver' in window) new MutationObserver(syncIcon).observe(navToggle, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    navToggle.addEventListener('click', function (e) {
      if (e.detail !== 0) return; // a mouse or touch click; keyboard activation reports 0
      setTimeout(function () {
        if (!navEl.classList.contains('is-open')) return;
        var first = navEl.querySelector('a');
        if (first) first.focus();
      }, 0);
    });

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
    // Close the open mobile menu on a tap/click outside it (all pages)
    document.addEventListener('click', function (e) {
      if (!navEl.classList.contains('is-open')) return;
      if (navEl.contains(e.target) || navToggle.contains(e.target)) return;
      navEl.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
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
      progressBar.style.transform = 'scaleX(' + (Math.max(0, Math.min(100, pct)) / 100) + ')';
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
      if (el.getAttribute('data-count-done')) return; // finished early, for example for printing
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
  function measureWords(el, words) {
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
    var widths = words.map(function (w) {
      measurer.textContent = w;
      return Math.ceil(measurer.getBoundingClientRect().width);
    });
    document.body.removeChild(measurer);
    return widths;
  }

  function setupRotator(el) {
    var words;
    try { words = JSON.parse(el.getAttribute('data-words')); }
    catch (e) { return; }
    if (!Array.isArray(words) || words.length < 2) return;

    // A word at the end of a line keeps the width of the widest word, so nothing reflows on
    // a swap. A word in the middle of a sentence ("We think in public.") would leave a gap
    // before the rest of the sentence, so there the width follows each word and the rest of
    // the line glides to its new place. Measured after the fonts load, again on resize.
    var after = el.nextSibling;
    var fluid = !!(after && after.nodeType === 3 && /[^\s.,;:!?]/.test(after.textContent));
    var widths = null;
    var i = 0;
    var doLock = function () {
      widths = measureWords(el, words);
      if (fluid) {
        if (prefersReduced) return;
        el.classList.add('rotator--fluid');
        el.style.width = widths[i] + 'px';
      } else {
        var max = Math.max.apply(null, widths);
        if (max > 0) el.style.minWidth = max + 'px';
      }
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doLock);
    } else {
      doLock();
    }
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doLock, 150);
    });

    if (prefersReduced) return;

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
        if (fluid && widths) {
          // the slot resizes while the new word is still unseen, then the word fades in
          el.style.width = widths[i] + 'px';
          setTimeout(function () { el.classList.remove('is-in'); }, 220);
          return;
        }
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
  // Start every counter at 0 straight away. Its section reveals earlier than the counter
  // triggers, so the final figure used to show for a moment, snap to 0 and count up again.
  // Without JavaScript the real figures stay in the page.
  countTargets.forEach(function (el) {
    var n = parseInt(el.getAttribute('data-count'), 10);
    if (!isNaN(n) && n > 0) el.textContent = '0';
    countObserver.observe(el);
  });
  // Printing shows every section without scrolling, so the counters must print their real figures.
  window.addEventListener('beforeprint', function () {
    countTargets.forEach(function (el) {
      var n = parseInt(el.getAttribute('data-count'), 10);
      el.setAttribute('data-count-done', '1');
      el.textContent = isNaN(n) ? '0' : n.toLocaleString();
      countObserver.unobserve(el);
    });
  });
})();

/* ===== MEMO SHARE: copy-link fallback for Instagram (and anywhere) ===== */
(function () {
  'use strict';
  document.querySelectorAll('.memo-share__link[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var url = btn.getAttribute('data-copy');
      var tip = btn.querySelector('.memo-share__tooltip');
      var done = function () {
        if (!tip) return;
        tip.classList.add('is-visible');
        setTimeout(function () { tip.classList.remove('is-visible'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done).catch(function () { /* silent */ });
      } else {
        var ta = document.createElement('textarea');
        ta.value = url; ta.setAttribute('readonly', '');
        ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* silent */ }
        document.body.removeChild(ta);
      }
    });
  });
})();

/* Edge field (desktop only).
   Etched contour lines with stippled shading in the outer margins, never over the
   reading column. Drifts slowly, flows with scroll, ripples around the cursor.
   Off on touch, narrow screens, Save-Data and print; one still frame under
   reduced motion. Self-contained: a failure here cannot affect anything else. */
(function () {
  'use strict';
  try {
    if (!window.matchMedia || !window.requestAnimationFrame) return;
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    var mq = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
    var rq = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* 2D simplex noise (after Gustavson), seeded so the plate is the same on every visit. */
    var perm = new Uint8Array(512);
    var GX = [1, -1, 1, -1, 1, -1, 0, 0], GY = [1, 1, -1, -1, 0, 0, 1, -1];
    (function () {
      var p = new Uint8Array(256), i, j, tmp, s = 20260427;
      for (i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        j = s % (i + 1); tmp = p[i]; p[i] = p[j]; p[j] = tmp;
      }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    })();
    var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    function noise(xin, yin) {
      var s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
      var t0 = (i + j) * G2, x0 = xin - (i - t0), y0 = yin - (j - t0);
      var i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i & 255, jj = j & 255, n = 0, g, q;
      q = 0.5 - x0 * x0 - y0 * y0;
      if (q > 0) { g = perm[ii + perm[jj]] & 7; q *= q; n += q * q * (GX[g] * x0 + GY[g] * y0); }
      q = 0.5 - x1 * x1 - y1 * y1;
      if (q > 0) { g = perm[ii + i1 + perm[jj + j1]] & 7; q *= q; n += q * q * (GX[g] * x1 + GY[g] * y1); }
      q = 0.5 - x2 * x2 - y2 * y2;
      if (q > 0) { g = perm[ii + 1 + perm[jj + 1]] & 7; q *= q; n += q * q * (GX[g] * x2 + GY[g] * y2); }
      return 70 * n;
    }

    var CELL = 12, DOT_STEP = 2, PARALLAX = 0.35;
    var LEVELS = [-0.7, -0.52, -0.34, -0.16, 0.02, 0.2, 0.38, 0.56, 0.74];
    var ACCENT = 4; /* index of the one terracotta line */
    var INK = 'rgba(21, 20, 15, 0.16)', CLAY = 'rgba(176, 84, 51, 0.46)', DOTS = 'rgba(21, 20, 15, 0.13)';

    var canvas = null, ctx = null, raf = 0, active = false;
    var W = 0, H = 0, dpr = 1, band = 0, cols = 0, rows = 0, half = 0;
    var field = null, xs = null;
    var t = 0, last = 0, lastScroll = 0;
    var printing = false;
    var mx = -9999, my = -9999, px = -9999, py = -9999, lens = 0, lensTarget = 0;

    function measure() {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* The band fades out just before the left edge of the widest text column on this page. */
      var left = W, k, els = document.querySelectorAll('main .wrap, main .wrap--wide, main .wrap--data, main .wrap--narrow');
      for (k = 0; k < els.length; k++) {
        var r = els[k].getBoundingClientRect();
        if (r.width < 240) continue;
        var pl = parseFloat(getComputedStyle(els[k]).paddingLeft) || 0;
        left = Math.min(left, r.left + pl);
      }
      if (left === W) left = Math.max(0, (W - 1180) / 2 + 40);
      band = Math.max(0, Math.min(460, left - 12));
      /* Sample columns: the left band, then the right band, mirrored. */
      var n = Math.ceil(band / CELL) + 1, list = [];
      for (k = 0; k < n; k++) list.push(k * CELL);
      for (k = n - 1; k >= 0; k--) list.push(W - k * CELL);
      xs = list; cols = list.length; half = n; rows = Math.ceil(H / CELL) + 1;
      field = new Float32Array(cols * rows);
    }

    function sample(scrollY) {
      var yo = scrollY * PARALLAX, a = t * 0.010, b = t * 0.006, c = t * 0.014;
      var lr2 = 2 * 110 * 110, k = 0, useLens = lens > 0.002;
      for (var j = 0; j < rows; j++) {
        var y = j * CELL, fy = y + yo;
        for (var i = 0; i < cols; i++, k++) {
          var x = xs[i];
          var v = 0.68 * noise(x / 330 + a, fy / 330 + b) + 0.32 * noise(x / 150 - c + 31.7, fy / 150 + 7.3);
          if (useLens) {
            var dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
            if (d2 < 9 * lr2) v += 0.6 * lens * Math.exp(-d2 / lr2);
          }
          field[k] = v;
        }
      }
    }

    function contour(level) {
      for (var j = 0; j < rows - 1; j++) {
        var y0 = j * CELL, y1 = y0 + CELL;
        for (var i = 0; i < cols - 1; i++) {
          if (i === half - 1) continue; /* the gap between the two bands */
          var x0 = xs[i], x1 = xs[i + 1];
          var a = field[j * cols + i], b = field[j * cols + i + 1];
          var c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          var idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var tx = x0 + (x1 - x0) * (level - a) / (b - a);   /* top edge */
          var ry = y0 + CELL * (level - b) / (c - b);        /* right edge */
          var bx = x0 + (x1 - x0) * (level - d) / (c - d);   /* bottom edge */
          var ly = y0 + CELL * (level - a) / (d - a);        /* left edge */
          switch (idx) {
            case 1: case 14: ctx.moveTo(x0, ly); ctx.lineTo(bx, y1); break;
            case 2: case 13: ctx.moveTo(bx, y1); ctx.lineTo(x1, ry); break;
            case 3: case 12: ctx.moveTo(x0, ly); ctx.lineTo(x1, ry); break;
            case 4: case 11: ctx.moveTo(tx, y0); ctx.lineTo(x1, ry); break;
            case 5: case 10:
              /* Saddle: the asymptotic decider picks which diagonal stays connected. */
              if ((a - level) * (c - level) - (b - level) * (d - level) >= 0) {
                ctx.moveTo(tx, y0); ctx.lineTo(x1, ry); ctx.moveTo(x0, ly); ctx.lineTo(bx, y1);
              } else {
                ctx.moveTo(x0, ly); ctx.lineTo(tx, y0); ctx.moveTo(bx, y1); ctx.lineTo(x1, ry);
              }
              break;
            case 6: case 9: ctx.moveTo(tx, y0); ctx.lineTo(bx, y1); break;
            case 7: case 8: ctx.moveTo(x0, ly); ctx.lineTo(tx, y0); break;
          }
        }
      }
    }

    function draw(scrollY) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      sample(scrollY);
      /* Stipple: dots on the high ground, like the shading on an engraved plate. */
      ctx.fillStyle = DOTS;
      for (var j = 0; j < rows; j += DOT_STEP) {
        var y = j * CELL;
        for (var i = 0; i < cols; i += DOT_STEP) {
          var v = field[j * cols + i];
          if (v > 0.3) { var s = v > 0.55 ? 1.6 : 1.1; ctx.fillRect(xs[i] - s / 2, y - s / 2, s, s); }
        }
      }
      ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.beginPath();
      for (var l = 0; l < LEVELS.length; l++) if (l !== ACCENT) contour(LEVELS[l]);
      ctx.stroke();
      ctx.lineWidth = 1.15; ctx.strokeStyle = CLAY; ctx.beginPath();
      contour(LEVELS[ACCENT]);
      ctx.stroke();
      /* Fade every mark out before it reaches the text. */
      ctx.globalCompositeOperation = 'destination-in';
      var e1 = Math.min(0.49, band * 0.45 / W), e2 = Math.min(0.5, band / W);
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(e1, 'rgba(0,0,0,1)'); g.addColorStop(e2, 'rgba(0,0,0,0)');
      g.addColorStop(1 - e2, 'rgba(0,0,0,0)'); g.addColorStop(1 - e1, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!active) return;
      raf = requestAnimationFrame(frame);
      if (last && now - last < 33) return; /* about 30 frames a second is plenty for ink */
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      var sy = window.scrollY || 0, dy = Math.abs(sy - lastScroll);
      lastScroll = sy;
      t += dt + Math.min(dy, 80) * 0.004; /* the plate flows a little faster while you scroll */
      lens += (lensTarget - lens) * 0.08;
      if (px > -9000) { px += (mx - px) * 0.18; py += (my - py) * 0.18; }
      draw(sy);
    }

    function onMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (px < -9000) { px = mx; py = my; }
      lensTarget = (mx < band + 40 || mx > W - band - 40) ? 1 : 0;
    }
    function onLeave() { lensTarget = 0; }
    function onResize() { sync(); }
    function onVis() { if (document.hidden) halt(); else sync(); }

    function build() {
      canvas = document.createElement('canvas');
      canvas.className = 'edge-field';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:0;transition:opacity 1.6s ease';
      var st = document.createElement('style');
      st.textContent = '@media print{.edge-field{display:none!important}}';
      document.head.appendChild(st);
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }

    function halt() {
      active = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    function start() {
      if (!canvas) build();
      if (!ctx) return;
      canvas.style.display = '';
      measure();
      if (rq.matches) { halt(); draw(0); }
      else if (!active) { active = true; last = 0; lastScroll = window.scrollY || 0; raf = requestAnimationFrame(frame); }
      requestAnimationFrame(function () { if (canvas) canvas.style.opacity = '1'; });
    }
    function hide() {
      halt();
      if (canvas) { canvas.style.opacity = '0'; canvas.style.display = 'none'; }
    }
    function sync() {
      if (printing) { halt(); return; }
      if (mq.matches && !document.hidden) start();
      else if (!mq.matches) hide();
      else halt();
    }

    function init() {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('beforeprint', function () { printing = true; halt(); });
      window.addEventListener('afterprint', function () { printing = false; sync(); });
      var watch = function (q) { if (q.addEventListener) q.addEventListener('change', sync); else if (q.addListener) q.addListener(sync); };
      watch(mq); watch(rq);
      sync();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (err) { /* decorative only */ }
})();

/* Edge field (phones, tablets and narrow windows).
   The same etched plate as the desktop margins, reshaped for a narrow screen:
   a thin frame of contour lines along the edges and under the header, and a
   deeper band at the bottom that rises like a tide while the page scrolls and
   settles when it stops. A touch sends rings out from the finger; they show in
   the frame as they reach it. Never behind the reading column. One still frame
   under reduced motion; nothing under Save-Data or print. Self-contained. */
(function () {
  'use strict';
  try {
    if (!window.matchMedia || !window.requestAnimationFrame) return;
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    var desk = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
    var rq = window.matchMedia('(prefers-reduced-motion: reduce)');

    var perm = new Uint8Array(512);
    var GX = [1, -1, 1, -1, 1, -1, 0, 0], GY = [1, 1, -1, -1, 0, 0, 1, -1];
    (function () {
      var p = new Uint8Array(256), i, j, tmp, s = 20261109;
      for (i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        j = s % (i + 1); tmp = p[i]; p[i] = p[j]; p[j] = tmp;
      }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    })();
    var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    function noise(xin, yin) {
      var s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
      var t0 = (i + j) * G2, x0 = xin - (i - t0), y0 = yin - (j - t0);
      var i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i & 255, jj = j & 255, n = 0, g, q;
      q = 0.5 - x0 * x0 - y0 * y0;
      if (q > 0) { g = perm[ii + perm[jj]] & 7; q *= q; n += q * q * (GX[g] * x0 + GY[g] * y0); }
      q = 0.5 - x1 * x1 - y1 * y1;
      if (q > 0) { g = perm[ii + i1 + perm[jj + j1]] & 7; q *= q; n += q * q * (GX[g] * x1 + GY[g] * y1); }
      q = 0.5 - x2 * x2 - y2 * y2;
      if (q > 0) { g = perm[ii + 1 + perm[jj + 1]] & 7; q *= q; n += q * q * (GX[g] * x2 + GY[g] * y2); }
      return 70 * n;
    }

    var CELL = 12, PARALLAX = 0.35, TOP_DEPTH = 40, BASE_DEPTH = 66, TIDE_MAX = 120;
    var LEVELS = [-0.7, -0.52, -0.34, -0.16, 0.02, 0.2, 0.38, 0.56, 0.74], ACCENT = 4;
    var INK = 'rgba(21, 20, 15, 0.22)', CLAY = 'rgba(176, 84, 51, 0.62)', DOTS = 'rgba(21, 20, 15, 0.16)';

    var canvas = null, ctx = null, mask = null, mctx = null, raf = 0, active = false, printing = false;
    var W = 0, H = 0, dpr = 1, side = 16, headBottom = 0, cols = 0, rows = 0, field = null;
    var t = 0, last = 0, lastScroll = 0, speed = 0, depth = BASE_DEPTH, maskDepth = -1, calmSince = 0;
    var ripples = [], dirty = false, pending = 0;

    var layoutW = -1;
    function measure() {
      var w = window.innerWidth, h = window.innerHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === W && h === H && d === dpr && field) return; /* nothing changed: keep the bitmap */
      W = w; H = h; dpr = d;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mask.width = canvas.width; mask.height = canvas.height;
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
      field = new Float32Array(cols * rows);
      maskDepth = -1;
      if (W === layoutW) return; /* a toolbar showing or hiding changes only the height */
      layoutW = W;
      var left = W, els = document.querySelectorAll('main .wrap, main .wrap--wide, main .wrap--data, main .wrap--narrow'), k;
      for (k = 0; k < els.length; k++) {
        var r = els[k].getBoundingClientRect();
        if (r.width < 200) continue;
        left = Math.min(left, r.left + (parseFloat(getComputedStyle(els[k]).paddingLeft) || 0));
      }
      side = Math.max(10, Math.min(44, (left === W ? 20 : left) - 2));
      var hd = document.querySelector('.site-header');
      headBottom = hd ? Math.max(0, Math.min(140, hd.getBoundingClientRect().bottom)) : 0;
    }

    function buildMask(d) {
      maskDepth = d;
      mctx.globalCompositeOperation = 'source-over';
      mctx.clearRect(0, 0, W, H);
      mctx.globalCompositeOperation = 'lighter';
      var g = mctx.createLinearGradient(0, 0, side, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.fillRect(0, 0, side, H);
      g = mctx.createLinearGradient(W, 0, W - side, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.fillRect(W - side, 0, side, H);
      var tEnd = headBottom + TOP_DEPTH;
      g = mctx.createLinearGradient(0, 0, 0, tEnd);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(Math.min(0.99, headBottom / tEnd), 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.fillRect(0, 0, W, tEnd);
      g = mctx.createLinearGradient(0, H, 0, H - d);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.fillRect(0, H - d, W, d);
      mctx.globalCompositeOperation = 'source-over';
    }

    function sample(scrollY, now) {
      var yo = scrollY * PARALLAX, a = t * 0.012, b = t * 0.007, c = t * 0.016, k = 0, n = ripples.length;
      for (var j = 0; j < rows; j++) {
        var y = j * CELL, fy = y + yo;
        for (var i = 0; i < cols; i++, k++) {
          var x = i * CELL;
          var v = 0.66 * noise(x / 150 + a, fy / 150 + b) + 0.34 * noise(x / 68 - c + 17.3, fy / 68 + 4.1);
          for (var r = 0; r < n; r++) {
            var rp = ripples[r], age = (now - rp.t) / 1000;
            var dx = x - rp.x, dy = y - rp.y, dist = Math.sqrt(dx * dx + dy * dy) - (30 + 320 * age);
            if (dist > -60 && dist < 60) v += 1.1 * (1 - age / 1.8) * Math.exp(-dist * dist / 392);
          }
          field[k] = v;
        }
      }
    }

    function inFrame(x, y) {
      return x < side + CELL || x > W - side - CELL || y < headBottom + TOP_DEPTH + CELL || y > H - depth - CELL;
    }

    function contour(level) {
      for (var j = 0; j < rows - 1; j++) {
        var y0 = j * CELL, y1 = y0 + CELL;
        for (var i = 0; i < cols - 1; i++) {
          var x0 = i * CELL, x1 = x0 + CELL;
          if (!inFrame(x0, y0) && !inFrame(x1, y1)) continue;
          var a = field[j * cols + i], b = field[j * cols + i + 1];
          var c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          var idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var tx = x0 + CELL * (level - a) / (b - a), ry = y0 + CELL * (level - b) / (c - b);
          var bx = x0 + CELL * (level - d) / (c - d), ly = y0 + CELL * (level - a) / (d - a);
          switch (idx) {
            case 1: case 14: ctx.moveTo(x0, ly); ctx.lineTo(bx, y1); break;
            case 2: case 13: ctx.moveTo(bx, y1); ctx.lineTo(x1, ry); break;
            case 3: case 12: ctx.moveTo(x0, ly); ctx.lineTo(x1, ry); break;
            case 4: case 11: ctx.moveTo(tx, y0); ctx.lineTo(x1, ry); break;
            case 5: case 10:
              if ((a - level) * (c - level) - (b - level) * (d - level) >= 0) {
                ctx.moveTo(tx, y0); ctx.lineTo(x1, ry); ctx.moveTo(x0, ly); ctx.lineTo(bx, y1);
              } else {
                ctx.moveTo(x0, ly); ctx.lineTo(tx, y0); ctx.moveTo(bx, y1); ctx.lineTo(x1, ry);
              }
              break;
            case 6: case 9: ctx.moveTo(tx, y0); ctx.lineTo(bx, y1); break;
            case 7: case 8: ctx.moveTo(x0, ly); ctx.lineTo(tx, y0); break;
          }
        }
      }
    }

    function draw(scrollY, now) {
      sample(scrollY, now);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DOTS;
      for (var j = 0; j < rows; j += 2) {
        for (var i = 0; i < cols; i += 2) {
          var x = i * CELL, y = j * CELL, v = field[j * cols + i];
          if (v > 0.3 && inFrame(x, y)) { var s = v > 0.55 ? 1.6 : 1.1; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
        }
      }
      ctx.lineWidth = 0.9; ctx.strokeStyle = INK; ctx.beginPath();
      for (var l = 0; l < LEVELS.length; l++) if (l !== ACCENT) contour(LEVELS[l]);
      ctx.stroke();
      ctx.lineWidth = 1.1; ctx.strokeStyle = CLAY; ctx.beginPath();
      contour(LEVELS[ACCENT]);
      ctx.stroke();
      var bucket = Math.round(depth / 4) * 4;
      if (bucket !== maskDepth) buildMask(bucket);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(mask, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!active) return;
      raf = requestAnimationFrame(frame);
      var calm = !ripples.length && now - calmSince > 2500;
      if (last && now - last < (calm ? 66 : 33)) return;
      if (dirty) { dirty = false; measure(); if (W < 300) { hide(); return; } }
      var dt = last ? Math.min((now - last) / 1000, 0.12) : 0;
      last = now;
      var sy = window.scrollY || 0, dy = Math.abs(sy - lastScroll);
      lastScroll = sy;
      if (dy > 0.5) calmSince = now;
      speed += ((dt > 0 ? dy / dt : 0) - speed) * 0.2;
      var target = BASE_DEPTH + Math.min(TIDE_MAX, speed * 0.09);
      depth += (target - depth) * 0.12;
      if (Math.abs(target - depth) > 1) calmSince = now;
      t += dt + Math.min(dy, 60) * 0.004;
      for (var r = ripples.length - 1; r >= 0; r--) if ((now - ripples[r].t) / 1000 > 1.8) ripples.splice(r, 1);
      draw(sy, now);
    }

    function onDown(e) {
      if (!active) return;
      if (ripples.length >= 4) ripples.shift();
      var now = performance.now();
      ripples.push({ x: e.clientX, y: e.clientY, t: now });
      calmSince = now;
    }

    function build() {
      canvas = document.createElement('canvas');
      canvas.className = 'edge-field edge-field--phone';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;height:100dvh;z-index:-1;pointer-events:none;opacity:0;transition:opacity 1.4s ease';
      if (!document.querySelector('style[data-edge-field]')) {
        var st = document.createElement('style');
        st.setAttribute('data-edge-field', '');
        st.textContent = '@media print{.edge-field{display:none!important}}';
        document.head.appendChild(st);
      }
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      mask = document.createElement('canvas');
      mctx = mask.getContext('2d');
    }

    function halt() { active = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function hide() { halt(); if (canvas) { canvas.style.opacity = '0'; canvas.style.display = 'none'; } }
    function start() {
      if (!canvas) build();
      if (!ctx || !mctx) return;
      canvas.style.display = '';
      measure();
      if (W < 300) { hide(); return; }
      if (rq.matches) { halt(); ripples = []; depth = BASE_DEPTH; draw(0, performance.now()); }
      else {
        draw(window.scrollY || 0, performance.now());
        if (!active) { active = true; last = 0; lastScroll = window.scrollY || 0; calmSince = performance.now(); raf = requestAnimationFrame(frame); }
      }
      requestAnimationFrame(function () { if (canvas) canvas.style.opacity = '1'; });
    }
    function onResize() {
      if (printing) return;
      if (desk.matches) { hide(); return; }
      if (active) { dirty = true; return; }
      if (!pending) pending = requestAnimationFrame(function () { pending = 0; sync(); });
    }
    function sync() {
      if (printing) { halt(); return; }
      if (!desk.matches && !document.hidden) start();
      else if (desk.matches) hide();
      else halt();
    }

    function init() {
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('beforeprint', function () { printing = true; halt(); });
      window.addEventListener('afterprint', function () { printing = false; sync(); });
      var watch = function (q) { if (q.addEventListener) q.addEventListener('change', sync); else if (q.addListener) q.addListener(sync); };
      watch(desk); watch(rq);
      sync();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (err) { /* decorative only */ }
})();

/* Statement band: one ripple each time the rotating word changes. */
(function () {
  'use strict';
  try {
    if (!window.MutationObserver) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var init = function () {
      var band = document.querySelector('body.home .section--statement');
      var word = band && band.querySelector('.rotator');
      if (!word) return;
      var last = word.textContent;
      new MutationObserver(function () {
        if (word.textContent === last) return;
        last = word.textContent;
        band.classList.remove('is-rippling');
        void band.offsetWidth;
        band.classList.add('is-rippling');
      }).observe(word, { childList: true, characterData: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (err) { /* decorative only */ }
})();

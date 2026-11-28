/* Cookie consent for ailiteracyfoundation.eu.
   Every page head sets Google Consent Mode v2 to "denied" and re-applies a stored "granted"
   choice before the Google tag runs. This file shows the choice on a first visit, stores it
   for 12 months, and adds the footer control that reopens it. Same key and rules as the head;
   raise VERSION here and in the head snippet if the purposes ever change, so everyone is asked again. */
(function () {
  'use strict';
  if (window.ailfConsent) return;

  var KEY = 'ailf-consent';
  var VERSION = 1;
  var MAX_AGE = 31536e6; // 365 days in ms, the same limit the head snippet uses
  var TYPES = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'];

  var doc = document;
  var root = doc.documentElement;
  var me = doc.currentScript;
  var assetVersion = ((me && /[?&]v=([^&#]+)/.exec(me.src)) || [])[1] || '1';
  var da = /^da\b/i.test(root.getAttribute('lang') || '') || /^\/da(\/|$)/.test(location.pathname);

  var T = da ? {
    title: 'Cookies',
    text: 'Vi bruger cookies til at se, hvordan siden bruges, kun hvis du siger ja.',
    accept: 'Accepter',
    reject: 'Afvis',
    settings: 'Cookieindstillinger'
  } : {
    title: 'Cookies',
    text: 'We use cookies to see how the site is used, only if you agree.',
    accept: 'Accept',
    reject: 'Reject',
    settings: 'Cookie settings'
  };

  var memory = null;          // this page's own choice, used when it could not be saved
  var persistFailed = false;

  function valid(c) {
    if (!c || c.v !== VERSION || (c.choice !== 'granted' && c.choice !== 'denied') || typeof c.ts !== 'number') return false;
    var age = Date.now() - c.ts;
    return age >= 0 && age < MAX_AGE;
  }

  function read() {
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      // storage blocked: only then does this page's own choice stand in for it
      return valid(memory) ? memory : null;
    }
    try {
      var c = JSON.parse(raw);
      if (valid(c)) return c;
    } catch (e) { /* corrupt record */ }
    return persistFailed && valid(memory) ? memory : null;
  }

  function store(choice) {
    var now = new Date();
    var c = { v: VERSION, choice: choice, ts: now.getTime(), date: now.toISOString() };
    memory = c;
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
      persistFailed = false;
    } catch (e) {
      persistFailed = true;
      // never leave an older "granted" behind for the next page to restore
      try { localStorage.removeItem(KEY); } catch (e2) { /* nothing more to do */ }
    }
    return c;
  }

  function gtagPush() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  // The state the head actually queued before this script ran (storage may have changed since).
  function queuedState() {
    var dl = window.dataLayer || [];
    var st = 'denied';
    for (var i = 0; i < dl.length; i++) {
      var a = dl[i];
      if (a && a[0] === 'consent' && (a[1] === 'default' || a[1] === 'update') && a[2] && a[2].ad_storage) {
        st = a[2].ad_storage === 'granted' ? 'granted' : 'denied';
      }
    }
    return st;
  }
  var applied = queuedState();
  var expiryTimer = 0;

  function update(choice) {
    var state = choice === 'granted' ? 'granted' : 'denied';
    var u = {};
    for (var i = 0; i < TYPES.length; i++) u[TYPES[i]] = state;
    gtagPush('consent', 'update', u);
    applied = state;
  }

  // After a "Reject" that follows an earlier "Accept", remove what Google already stored.
  function clearGoogleStorage() {
    var parts = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('; domain=.' + parts.slice(i).join('.'));
    var all = doc.cookie ? doc.cookie.split(';') : [];
    for (var j = 0; j < all.length; j++) {
      var name = all[j].split('=')[0].replace(/^\s+|\s+$/g, '');
      if (!/^(_ga|_gid|_gat|_gcl_|_gac_)/.test(name)) continue;
      for (var k = 0; k < domains.length; k++) {
        doc.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domains[k];
      }
    }
    var stores = [];
    try { stores.push(window.localStorage); } catch (e) { /* blocked */ }
    try { stores.push(window.sessionStorage); } catch (e) { /* blocked */ }
    for (var s = 0; s < stores.length; s++) {
      try {
        for (var n = stores[s].length - 1; n >= 0; n--) {
          var key = stores[s].key(n);
          if (key && /^_gcl_/.test(key)) stores[s].removeItem(key);
        }
      } catch (e) { /* blocked */ }
    }
  }

  /* ---------- UI ---------- */

  var MARK =
    '<svg class="ailf-consent__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      '<path pathLength="1" d="M20.70 3.88A13 13 0 1 0 28.32 11.86A6.5 6.5 0 0 1 20.70 3.88Z"/>' +
      '<path pathLength="1" d="M16.61 7.02A9 9 0 1 0 25.00 15.81A10.5 10.5 0 0 1 16.61 7.02Z"/>' +
      '<path pathLength="1" d="M13.80 11.51A5 5 0 1 0 20.38 18.40A14.5 14.5 0 0 1 13.80 11.51Z"/>' +
    '</svg>';

  var box = null;
  var link = null;
  var live = null;
  var mounted = false;
  var reopened = false;
  var hideTimer = 0;
  var sizeObserver = null;

  function build() {
    box = doc.createElement('section');
    box.className = 'ailf-consent';
    box.id = 'ailf-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-labelledby', 'ailf-consent-title');
    box.setAttribute('aria-describedby', 'ailf-consent-text');
    box.setAttribute('lang', da ? 'da' : 'en');
    box.setAttribute('tabindex', '-1');
    box.hidden = true;
    // Reject and Accept share one class and one size; Reject comes first in reading order.
    box.innerHTML =
      '<div class="ailf-consent__head">' + MARK +
        '<p class="ailf-consent__title" id="ailf-consent-title">' + T.title + '</p>' +
      '</div>' +
      '<p class="ailf-consent__text" id="ailf-consent-text">' + T.text + '</p>' +
      '<div class="ailf-consent__actions">' +
        '<button type="button" class="ailf-consent__btn" data-choice="denied">' + T.reject + '</button>' +
        '<button type="button" class="ailf-consent__btn" data-choice="granted">' + T.accept + '</button>' +
      '</div>';

    box.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-choice]') : null;
      if (b) choose(b.getAttribute('data-choice'));
    });
    box.addEventListener('keydown', function (e) {
      // Escape closes the reopened settings and leaves the stored choice as it was.
      if ((e.key === 'Escape' || e.key === 'Esc') && read()) { e.preventDefault(); hide(); }
    });

    var skip = doc.querySelector('body > .skip-link');
    if (skip && skip.parentNode) skip.parentNode.insertBefore(box, skip.nextSibling);
    else doc.body.insertBefore(box, doc.body.firstChild);

    // the warm light behind the glass; follows the card through CSS (.ailf-consent + .ailf-consent-glow)
    var glow = doc.createElement('div');
    glow.className = 'ailf-consent-glow';
    glow.setAttribute('aria-hidden', 'true');
    glow.innerHTML = '<div class="ailf-consent-glow__light"></div>';
    box.parentNode.insertBefore(glow, box.nextSibling);

    live = doc.createElement('div');
    live.className = 'ailf-consent-live';
    // visually hidden inline, so it stays hidden even if the stylesheet never arrives
    live.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('lang', da ? 'da' : 'en');
    doc.body.appendChild(live);
  }

  function setSheetSpace() {
    if (!box || box.hidden) return;
    root.style.setProperty('--ailf-consent-h', box.offsetHeight + 'px');
  }

  function show(byUser) {
    if (!box) build();
    clearTimeout(hideTimer);
    box.classList.remove('ailf-consent--out');
    var wasHidden = box.hidden;
    box.hidden = false;
    root.classList.add('ailf-consent-open');
    setSheetSpace();
    if (window.ResizeObserver && !sizeObserver) {
      sizeObserver = new ResizeObserver(setSheetSpace);
      sizeObserver.observe(box);
    }
    if (link) link.setAttribute('aria-expanded', 'true');
    // two frames so the entrance transition starts from the hidden state
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add('ailf-consent--in'); });
    });
    if (byUser) {
      box.focus({ preventScroll: true });
    } else if (wasHidden && live) {
      // announced once, without moving focus: the page stays the visitor's
      setTimeout(function () { if (!box.hidden) live.textContent = T.title + '. ' + T.text; }, 500);
    }
  }

  function hide() {
    if (!box || box.hidden) return;
    var hadFocus = box.contains(doc.activeElement);
    box.classList.remove('ailf-consent--in');
    box.classList.add('ailf-consent--out');
    root.classList.remove('ailf-consent-open');
    root.style.removeProperty('--ailf-consent-h');
    if (link) link.setAttribute('aria-expanded', 'false');
    if (live) live.textContent = '';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hideTimer = setTimeout(function () { box.hidden = true; box.classList.remove('ailf-consent--out'); }, reduce ? 0 : 240);
    if (hadFocus) {
      if (reopened && link) link.focus({ preventScroll: true });
      else {
        var main = doc.getElementById('main') || doc.querySelector('main');
        if (main) {
          if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
      }
    }
    reopened = false;
  }

  function choose(choice) {
    if (choice !== 'granted') choice = 'denied';
    store(choice);
    update(choice);
    if (choice === 'denied') clearGoogleStorage();
    reconcile(); // schedules the expiry of this choice
    hide();
  }

  // Bring the consent signals in line with what is stored: another tab, a page restored
  // from the back/forward cache, a cleared storage, or a choice that expired while open.
  function reconcile() {
    var c = read();
    var want = c ? c.choice : 'denied';
    var wasGranted = applied === 'granted';
    if (want !== applied) update(want);
    if (want === 'denied' && (wasGranted || c)) clearGoogleStorage();
    clearTimeout(expiryTimer);
    if (c) {
      var left = c.ts + MAX_AGE - Date.now();
      expiryTimer = setTimeout(sync, Math.min(Math.max(left, 0) + 1000, 2147483000));
    }
    return c;
  }

  function sync() {
    var c = reconcile();
    if (!mounted) return;
    if (c) {
      if (box && !box.hidden && !reopened) hide();
    } else if (!box || box.hidden) {
      show(false);
    }
  }

  function addFooterControl() {
    var legal = doc.querySelector('.site-footer__legal');
    if (!legal) return;
    link = doc.createElement('button');
    link.type = 'button';
    link.className = 'ailf-consent-link';
    link.textContent = T.settings;
    link.setAttribute('aria-controls', 'ailf-consent');
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', function () {
      reopened = true;
      show(true);
    });
    var line = legal.firstElementChild;
    if (line && !line.classList.contains('lang-toggle')) {
      line.appendChild(doc.createTextNode(' · '));
      line.appendChild(link);
    } else {
      var wrap = doc.createElement('div');
      wrap.appendChild(link);
      legal.insertBefore(wrap, legal.firstChild);
    }
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    addFooterControl();
    sync();
  }

  // Keyboard focus never sits under the card: scroll the focused element clear of it.
  doc.addEventListener('focusin', function (e) {
    if (!box || box.hidden || !root.classList.contains('ailf-consent-open')) return;
    var el = e.target;
    if (!el || el === box || box.contains(el) || !el.getBoundingClientRect) return;
    var a = el.getBoundingClientRect();
    var b = box.getBoundingClientRect();
    if (a.height > b.top - 16) return; // too tall to lift clear (a whole section): leave it
    if (a.right > b.left && a.left < b.right && a.bottom > b.top - 8 && a.top < b.bottom) {
      try { window.scrollBy({ top: a.bottom - b.top + 24, left: 0, behavior: 'instant' }); }
      catch (err) { window.scrollBy(0, a.bottom - b.top + 24); }
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key !== KEY && e.key !== null) return;
    memory = null; // another tab changed the record: it decides now
    persistFailed = false;
    sync();
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) sync(); });
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') sync(); });

  window.ailfConsent = {
    open: function () { reopened = true; show(true); },
    choice: function () { var c = read(); return c ? c.choice : null; }
  };

  function start() {
    var css = doc.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/consent.css?v=' + encodeURIComponent(assetVersion);
    css.onload = mount;
    css.onerror = mount; // unstyled but usable beats no choice at all
    doc.head.appendChild(css);
    setTimeout(mount, 3000);
  }

  reconcile(); // fix any change made in another tab while this page was loading
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})();

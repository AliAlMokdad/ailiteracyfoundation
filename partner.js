/* Partner with us: the contour field behind the hero. */
(function () {
  'use strict';

  /* ---------- contour plate ---------- */
  try {
    var canvas = document.querySelector('.pt-plate__field');
    if (!canvas || !canvas.getContext || !window.requestAnimationFrame) return;
    var conn = navigator.connection;
    var rq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var still = rq.matches || !!(conn && conn.saveData);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* 2D simplex noise (after Gustavson), same seed as the site's edge plate. */
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

    var CELL = 10;
    var LEVELS = [-0.62, -0.46, -0.3, -0.14, 0.02, 0.18, 0.34, 0.5, 0.66];
    var ACCENT = [2, 6]; /* the two terracotta lines */
    var INK = 'rgba(21, 20, 15, 0.20)', CLAY = 'rgba(176, 84, 51, 0.5)', DOTS = 'rgba(21, 20, 15, 0.12)';
    var W = 0, H = 0, cols = 0, rows = 0, field = null, t = 0, last = 0, raf = 0, visible = true;

    function measure() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
      field = new Float32Array(cols * rows);
    }
    function sample() {
      var a = t * 0.012, b = t * 0.007, c = t * 0.016, k = 0;
      var sc = W < 700 ? 0.75 : 1; /* tighter lines on a phone */
      for (var j = 0; j < rows; j++) {
        var y = j * CELL;
        for (var i = 0; i < cols; i++, k++) {
          var x = i * CELL;
          field[k] = 0.7 * noise(x / (300 * sc) + a, y / (300 * sc) + b) + 0.3 * noise(x / (140 * sc) - c + 31.7, y / (140 * sc) + 7.3);
        }
      }
    }
    function contour(level) {
      for (var j = 0; j < rows - 1; j++) {
        var y0 = j * CELL, y1 = y0 + CELL;
        for (var i = 0; i < cols - 1; i++) {
          var x0 = i * CELL, x1 = x0 + CELL;
          var a = field[j * cols + i], b = field[j * cols + i + 1];
          var c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          var idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var tx = x0 + CELL * (level - a) / (b - a);
          var ry = y0 + CELL * (level - b) / (c - b);
          var bx = x0 + CELL * (level - d) / (c - d);
          var ly = y0 + CELL * (level - a) / (d - a);
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
    function draw() {
      ctx.clearRect(0, 0, W, H);
      sample();
      ctx.fillStyle = DOTS;
      for (var j = 0; j < rows; j += 2) {
        for (var i = 0; i < cols; i += 2) {
          var v = field[j * cols + i];
          if (v > 0.32) { var s = v > 0.55 ? 1.6 : 1.1; ctx.fillRect(i * CELL - s / 2, j * CELL - s / 2, s, s); }
        }
      }
      ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.beginPath();
      for (var l = 0; l < LEVELS.length; l++) if (ACCENT.indexOf(l) < 0) contour(LEVELS[l]);
      ctx.stroke();
      ctx.lineWidth = 1.4; ctx.strokeStyle = CLAY; ctx.beginPath();
      for (var m = 0; m < ACCENT.length; m++) contour(LEVELS[ACCENT[m]]);
      ctx.stroke();
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (last && now - last < 40) return; /* 25 frames a second is plenty for ink */
      t += last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      draw();
    }
    function run() {
      if (still) { draw(); return; }
      if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
    }

    measure(); draw();
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); draw(); }, 120); }, { passive: true });
    document.addEventListener('visibilitychange', run);
    if (rq.addEventListener) rq.addEventListener('change', function (e) { still = e.matches; run(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; run(); }).observe(canvas);
    }
    run();
  } catch (err) { /* decorative only */ }
})();

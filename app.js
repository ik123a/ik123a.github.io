/* ==========================================================================
   ISHAAN KUMAR — SYSTEM DOSSIER · behaviour layer
   No dependencies. Every DOM lookup is null-guarded so a markup change can
   never throw and strand the page. All motion is gated on
   prefers-reduced-motion, and the rAF loop parks itself when the tab is
   hidden.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * 1. BOOT PRELOADER
   * Ticks a mono counter while the page settles, then lifts. The
   * setTimeout fallback guarantees the overlay never traps the user if
   * some resource hangs.
   * ------------------------------------------------------------------ */
  (function boot() {
    var el   = document.getElementById('boot');
    var num  = document.getElementById('boot-count');
    var fill = document.getElementById('boot-fill');
    if (!el) return;

    var done = false;
    var shown = 0;

    function finish() {
      if (done) return;
      done = true;
      if (num)  num.textContent = '100';
      if (fill) fill.style.width = '100%';
      window.setTimeout(function () {
        el.classList.add('is-done');
        document.body.classList.remove('is-locked');
        window.setTimeout(function () { el.setAttribute('hidden', ''); }, 600);
      }, 180);
    }

    if (reduceMotion.matches) { finish(); return; }

    document.body.classList.add('is-locked');
    var start = performance.now();
    var SPAN = 1100;

    (function tick(now) {
      var t = Math.min((now - start) / SPAN, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.floor(eased * 100);
      if (val !== shown) {
        shown = val;
        if (num)  num.textContent = ('00' + val).slice(-3);
        if (fill) fill.style.width = val + '%';
      }
      if (t < 1) requestAnimationFrame(tick);
    })(start);

    window.addEventListener('load', function () { window.setTimeout(finish, 260); });
    window.setTimeout(finish, 2600);
  })();

  /* ------------------------------------------------------------------ *
   * 2. STAGGERED REVEALS
   * data-d becomes --d so CSS owns the delay maths. Without JS the
   * `.reveal` rules never apply, so every element is visible by default.
   * ------------------------------------------------------------------ */
  (function reveals() {
    var items = $$('.reveal');
    if (!items.length) return;

    items.forEach(function (el) {
      var d = el.getAttribute('data-d');
      if (d) el.style.setProperty('--d', d);
    });

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    var pending = items.slice();

    function sweep() {
      var h = window.innerHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        var r = el.getBoundingClientRect();
        if (r.top < h * 1.25 && r.bottom > -h * 0.25) {
          el.classList.add('is-in');
          io.unobserve(el);
          pending.splice(i, 1);
        }
      }
    }

    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued || !pending.length) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; sweep(); });
    }, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });

    items.forEach(function (el) { io.observe(el); });
    sweep();
  })();

  (function heroLines() {
    var lines = $$('.hero__title .line');
    if (!lines.length) return;

    lines.forEach(function (el) {
      var d = el.getAttribute('data-d');
      if (d) el.style.setProperty('--d', d);
    });

    if (reduceMotion.matches) {
      lines.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    window.requestAnimationFrame(function () {
      lines.forEach(function (el) { el.classList.add('is-in'); });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 3. SIGNAL BUS
   * A sparse orthogonal schematic — square nodes joined by straight
   * horizontal/vertical traces, with a pulse travelling a random edge.
   * Reads as a dependency graph, not a particle field.
   * ------------------------------------------------------------------ */
  (function signalBus() {
    var cv = document.getElementById('signal-bus');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');

    var COLS = 7, ROWS = 9;
    var nodes = [];
    var edges = [];
    var pulses = [];
    var w = 0, h = 0;
    var raf = 0, running = false, spawnAt = 0;

    var INK_NODE = 'rgba(242,238,230,0.34)';
    var INK_EDGE = 'rgba(242,238,230,0.10)';
    var SIGNAL   = '#FF4A1C';
    var MINT     = '#5EE6C4';

    function build() {
      var host = cv.parentElement;
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      cv.width  = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var padX = w * 0.11;
      var padY = h * 0.13;
      var iw = (w - padX * 2) / (COLS - 1);
      var ih = (h - padY * 2) / (ROWS - 1);

      nodes = [];
      for (var r = 0; r < ROWS; r++) {
        var row = [];
        for (var c = 0; c < COLS; c++) {
          // Jitter keeps the lattice from reading as a spreadsheet.
          row.push({
            x: padX + c * iw + (Math.random() - 0.5) * iw * 0.28,
            y: padY + r * ih + (Math.random() - 0.5) * ih * 0.28
          });
        }
        nodes.push(row);
      }

      edges = [];
      for (var r2 = 0; r2 < ROWS; r2++) {
        for (var c2 = 0; c2 < COLS; c2++) {
          if (c2 < COLS - 1 && Math.random() < 0.62) {
            edges.push({ a: nodes[r2][c2], b: nodes[r2][c2 + 1] });
          }
          if (r2 < ROWS - 1 && Math.random() < 0.5) {
            edges.push({ a: nodes[r2][c2], b: nodes[r2 + 1][c2] });
          }
        }
      }
      return true;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 1;
      ctx.strokeStyle = INK_EDGE;
      ctx.beginPath();
      for (var i = 0; i < edges.length; i++) {
        var e = edges[i];
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
      }
      ctx.stroke();

      ctx.fillStyle = INK_NODE;
      for (var r = 0; r < nodes.length; r++) {
        for (var c = 0; c < nodes[r].length; c++) {
          var n = nodes[r][c];
          ctx.fillRect(n.x - 1.5, n.y - 1.5, 3, 3);
        }
      }

      for (var p = pulses.length - 1; p >= 0; p--) {
        var pu = pulses[p];
        var t = pu.t;
        var x = pu.e.a.x + (pu.e.b.x - pu.e.a.x) * t;
        var y = pu.e.a.y + (pu.e.b.y - pu.e.a.y) * t;

        // Trail: three fading squares behind the head.
        for (var k = 1; k <= 3; k++) {
          var tt = Math.max(0, t - k * 0.045);
          var tx = pu.e.a.x + (pu.e.b.x - pu.e.a.x) * tt;
          var ty = pu.e.a.y + (pu.e.b.y - pu.e.a.y) * tt;
          ctx.fillStyle = k === 1
            ? 'rgba(255,74,28,0.55)'
            : 'rgba(255,74,28,' + (0.2 / k) + ')';
          ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
        }

        ctx.fillStyle = pu.alt ? MINT : SIGNAL;
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);

        pu.t += pu.speed;
        if (pu.t >= 1) pulses.splice(p, 1);
      }
    }

    function frame(now) {
      if (!running) return;
      if (now - spawnAt > 620 && edges.length && pulses.length < 5) {
        spawnAt = now;
        pulses.push({
          e: edges[(Math.random() * edges.length) | 0],
          t: 0,
          speed: 0.0075 + Math.random() * 0.0075,
          alt: Math.random() < 0.28
        });
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion.matches || !edges.length) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    if (!build()) return;

    if (reduceMotion.matches) {
      draw();                       // static schematic, no rAF at all
    } else {
      start();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stop(); } else { start(); }
      });
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (!build()) return;
        pulses.length = 0;
        if (reduceMotion.matches) { draw(); } else { start(); }
      }, 220);
    }, { passive: true });
  })();

  /* ------------------------------------------------------------------ *
   * 4. HEADER STATE + SCROLL PROGRESS + RAIL READOUT
   * ------------------------------------------------------------------ */
  (function scrollChrome() {
    var head    = document.getElementById('masthead');
    var bar     = document.getElementById('progress-fill');
    var pct     = document.getElementById('scroll-pct');
    var ticking = false;

    function frame() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(y / max, 1) : 0;

      if (head) head.classList.toggle('is-stuck', y > 24);
      if (bar)  bar.style.width = (ratio * 100).toFixed(2) + '%';
      if (pct)  pct.textContent = ('00' + Math.round(ratio * 100)).slice(-3);

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }, { passive: true });

    frame();
  })();

  /* ------------------------------------------------------------------ *
   * 5. ACTIVE SECTION → left rail + nav underline
   * ------------------------------------------------------------------ */
  (function sectionSpy() {
    var marks = $$('.rail__mark');
    var links = $$('.nav a');
    if (!('IntersectionObserver' in window)) return;

    var map = {};
    marks.forEach(function (m) { map[m.getAttribute('data-rail')] = m; });
    var linkMap = {};
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      if (id) linkMap[id] = a;
    });

    var sections = $$('[data-sec]');
    if (!sections.length) return;

    function activate(id) {
      marks.forEach(function (m) { m.classList.toggle('is-active', m.getAttribute('data-rail') === id); });
      links.forEach(function (a) { a.classList.remove('is-on'); });
      if (linkMap[id]) linkMap[id].classList.add('is-on');
    }

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.getAttribute('data-sec');
        visible[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null, bestVal = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestVal) { bestVal = visible[id]; best = id; }
      });
      if (best) activate(best);
    }, { threshold: [0, 0.15, 0.4, 0.75], rootMargin: '-20% 0px -30% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  })();

  /* ------------------------------------------------------------------ *
   * 6. MOBILE NAV
   * ------------------------------------------------------------------ */
  (function mobileNav() {
    var btn  = document.getElementById('burger');
    var menu = document.getElementById('mobile-nav');
    if (!btn || !menu) return;

    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.hidden = !open;
    }

    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') set(false);
    });
  })();

  /* ------------------------------------------------------------------ *
   * 7. REPO FILTERS
   * ------------------------------------------------------------------ */
  (function filters() {
    var bar    = $('.filters');
    var grid   = document.getElementById('repos');
    var status = document.getElementById('filter-status');
    if (!bar || !grid) return;

    var buttons = $$('.filter', bar);
    var cards   = $$('.repo', grid);

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-filter');
        var shown = 0;

        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });

        cards.forEach(function (card) {
          var match = key === 'all' || card.getAttribute('data-domain') === key;
          card.classList.toggle('is-hidden', !match);
          if (match) shown++;
        });

        if (status) {
          var label = btn.textContent.replace(/\s*\d+\s*$/, '').trim();
          status.textContent = key === 'all'
            ? 'Showing all ' + shown + ' repositories'
            : 'Showing ' + shown + ' in ' + label;
        }
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 8. STAT COUNTERS
   * ------------------------------------------------------------------ */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      if (reduceMotion.matches) { el.textContent = String(target); return; }

      var dur = 1500;
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------ *
   * 9. CONTRIBUTION GRAPH FALLBACK
   * The external chart is a third-party service; if it 404s or is blocked,
   * swap in a CSS dot-matrix so the panel is never empty.
   * ------------------------------------------------------------------ */
  (function chart() {
    var img = document.getElementById('chart');
    var fb  = document.getElementById('chart-fallback');
    var note = document.getElementById('signal-note');
    if (!img) return;

    function fail() {
      if (img) img.style.display = 'none';
      if (fb)  fb.hidden = false;
      if (note) note.textContent = 'ik123a \u00b7 graph unavailable offline';
    }

    img.addEventListener('error', fail);
    // If the image never settles (blocked, offline), fail after a beat.
    window.setTimeout(function () {
      if (img.complete && img.naturalWidth === 0) fail();
    }, 6000);
  })();

  /* Repository metadata is curated into the markup rather than fetched at
     runtime: the unauthenticated GitHub API allows only 60 requests per hour
     per IP, so a static site would 403 for most visitors and the headline
     numbers would flip between live and fallback values. To refresh, update
     the data-count attributes and the per-card star labels in index.html. */

})();

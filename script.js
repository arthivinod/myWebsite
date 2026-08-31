(function () {
  'use strict';

  var systemReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- wisp scroll parallax ----------
  (function () {
    var ticking = false;
    function updateParallax() {
      var shift = window.scrollY * 0.03;
      document.documentElement.style.setProperty('--scroll-shift', shift.toFixed(2));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    });
  })();

  // ---------- cursor sparkler trail ----------
  if (!systemReducedMotion) {
    (function () {
      var canvas = document.getElementById('trailCanvas');
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resizeCanvas() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      var LIFETIME = 1200;
      var SMOOTH_EASE = 0.35;
      var MOVE_TIMEOUT = 250;

      var rawX = null, rawY = null;
      var smoothX = null, smoothY = null;
      var lastMoveTime = 0;
      var segments = [];
      var flecks = [];

      window.addEventListener('mousemove', function (e) {
        rawX = e.clientX; rawY = e.clientY;
        lastMoveTime = performance.now();
        if (smoothX === null) { smoothX = rawX; smoothY = rawY; }
      });

      (function tick() {
        var now = performance.now();
        var recentlyMoving = rawX !== null && (now - lastMoveTime) < MOVE_TIMEOUT;
        if (recentlyMoving) {
          var prevX = smoothX, prevY = smoothY;
          smoothX += (rawX - smoothX) * SMOOTH_EASE;
          smoothY += (rawY - smoothY) * SMOOTH_EASE;
          var dx = smoothX - prevX, dy = smoothY - prevY;
          var dist = Math.hypot(dx, dy);
          if (dist > 0.15) {
            segments.push({ x1: prevX, y1: prevY, x2: smoothX, y2: smoothY, width: 1.7 + Math.min(2, dist * 0.35), born: now });
            var fleckCount = dist > 3 ? Math.min(4, Math.floor(dist / 10) + 1) : 0;
            for (var i = 0; i < fleckCount; i++) {
              var t = Math.random();
              var px = prevX + dx * t, py = prevY + dy * t;
              var perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
              var offset = (Math.random() - 0.5) * 11;
              flecks.push({ x: px + Math.cos(perpAngle) * offset, y: py + Math.sin(perpAngle) * offset, r: 0.6 + Math.random() * 1, born: now });
            }
          }
        }

        segments = segments.filter(function (s) { return now - s.born < LIFETIME; });
        flecks = flecks.filter(function (f) { return now - f.born < LIFETIME; });
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        segments.forEach(function (s) {
          var age = (now - s.born) / LIFETIME, a = 1 - age;
          ctx.save();
          ctx.strokeStyle = 'rgba(206, 190, 255, ' + (0.62 * a).toFixed(3) + ')';
          ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.shadowColor = 'rgba(166, 135, 255, ' + (0.4 * a).toFixed(3) + ')'; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
          ctx.restore();
        });
        flecks.forEach(function (f) {
          var age = (now - f.born) / LIFETIME, a = 1 - age;
          ctx.save();
          ctx.fillStyle = 'rgba(238, 232, 255, ' + (0.82 * a).toFixed(3) + ')';
          ctx.shadowColor = 'rgba(206, 190, 255, ' + (0.35 * a).toFixed(3) + ')'; ctx.shadowBlur = 2.5;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
        requestAnimationFrame(tick);
      })();
    })();
  }

  // ---------- companion avatar: eye tracking + section-follow + hover-nudge ----------
  (function () {
    var follow = document.getElementById('avatarFollow');
    var charEl = document.getElementById('avatarChar');
    if (!follow || !charEl) return;
    var svg = charEl.querySelector('svg');
    var HALF = 48;

    var MAX_OFFSET = 3, TRACK_RADIUS = 160, EYE_EASE = 0.18;
    var eyes = Array.prototype.slice.call(follow.querySelectorAll('.avatar-eye')).map(function (g) {
      return { group: g, ex: parseFloat(g.getAttribute('data-ex')), ey: parseFloat(g.getAttribute('data-ey')), curX: 0, curY: 0, targetX: 0, targetY: 0 };
    });
    window.addEventListener('mousemove', function (e) {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      eyes.forEach(function (eye) {
        var ex = rect.left + (eye.ex / 200) * rect.width, ey = rect.top + (eye.ey / 200) * rect.height;
        var dx = e.clientX - ex, dy = e.clientY - ey, dist = Math.hypot(dx, dy) || 1, angle = Math.atan2(dy, dx);
        var mag = Math.min(MAX_OFFSET, MAX_OFFSET * (dist / TRACK_RADIUS));
        eye.targetX = Math.cos(angle) * mag; eye.targetY = Math.sin(angle) * mag;
      });
    });

    var headings = Array.prototype.slice.call(document.querySelectorAll('.mock-heading'));
    var activeHeading = headings[0];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) activeHeading = entry.target; });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    headings.forEach(function (h) { io.observe(h); });

    var hoverTarget = null;
    document.querySelectorAll('.mock-link, .project-card-link').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var rect = el.getBoundingClientRect();
        var spaceRight = window.innerWidth - rect.right;
        hoverTarget = spaceRight > 160
          ? { x: rect.right + 26, y: rect.top + rect.height / 2 }
          : { x: rect.left + rect.width / 2, y: rect.bottom + 42 };
      });
      el.addEventListener('mouseleave', function () { hoverTarget = null; });
    });

    function computeSectionTarget() {
      var rect = activeHeading.getBoundingClientRect();
      return { x: rect.right + 30, y: rect.top + rect.height / 2 };
    }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    var narrow = window.innerWidth <= 900;
    window.addEventListener('resize', function () { narrow = window.innerWidth <= 900; });

    var curX = null, curY = null;
    function frame() {
      if (narrow) {
        follow.classList.add('pinned');
      } else {
        follow.classList.remove('pinned');
        var target = hoverTarget || computeSectionTarget();
        var tx = clamp(target.x, HALF + 12, window.innerWidth - HALF - 12);
        var ty = clamp(target.y, HALF + 12, window.innerHeight - HALF - 12);
        if (curX === null) { curX = tx; curY = ty; }
        if (systemReducedMotion) { curX = tx; curY = ty; }
        else { curX += (tx - curX) * 0.12; curY += (ty - curY) * 0.12; }
        follow.style.transform = 'translate(' + (curX - HALF) + 'px,' + (curY - HALF) + 'px)';
      }
      eyes.forEach(function (eye) {
        eye.curX += (eye.targetX - eye.curX) * EYE_EASE;
        eye.curY += (eye.targetY - eye.curY) * EYE_EASE;
        eye.group.setAttribute('transform', 'translate(' + eye.curX.toFixed(2) + ',' + eye.curY.toFixed(2) + ')');
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // randomized blink
    var eyeEls = [document.getElementById('eyeL'), document.getElementById('eyeR')];
    function scheduleBlink() {
      var delay = 2800 + Math.random() * 3400;
      setTimeout(function () {
        eyeEls.forEach(function (el) { el.style.transition = 'transform 90ms ease-in'; el.style.transform = 'scaleY(0.12)'; });
        setTimeout(function () {
          eyeEls.forEach(function (el) { el.style.transition = 'transform 110ms ease-out'; el.style.transform = 'scaleY(1)'; });
          scheduleBlink();
        }, 110);
      }, delay);
    }
    if (!systemReducedMotion) scheduleBlink();
  })();

  // ---------- career highlight stats: count-up + ring/bar reveal, once per element ----------
  (function () {
    var tiles = document.querySelectorAll('.stat-tile');
    if (!tiles.length) return;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function animateNumber(el, target, duration) {
      var start = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - start) / duration);
        var val = Math.round(target * easeOutCubic(p));
        el.textContent = val.toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function activateTile(tile) {
      var duration = 1400;
      var numberEl = tile.querySelector('.stat-number');
      var target = parseInt(numberEl.getAttribute('data-target'), 10);

      if (systemReducedMotion) {
        numberEl.textContent = target.toLocaleString('en-US');
      } else {
        animateNumber(numberEl, target, duration);
      }

      var ringFill = tile.querySelector('.stat-ring-fill');
      if (ringFill) {
        var r = parseFloat(ringFill.getAttribute('r'));
        var circumference = 2 * Math.PI * r;
        var percent = parseFloat(ringFill.getAttribute('data-percent'));
        ringFill.style.strokeDasharray = circumference;
        var targetOffset = circumference * (1 - percent / 100);
        if (systemReducedMotion) {
          ringFill.style.transition = 'none';
          ringFill.style.strokeDashoffset = targetOffset;
        } else {
          ringFill.style.strokeDashoffset = targetOffset;
        }
      }

      var barFill = tile.querySelector('.stat-bar-fill');
      if (barFill) {
        if (systemReducedMotion) barFill.style.transition = 'none';
        barFill.style.width = '100%';
      }

      if (!systemReducedMotion) {
        setTimeout(function () { tile.classList.add('stat-glow'); }, duration + 100);
      }
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activateTile(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    tiles.forEach(function (t) { io.observe(t); });
  })();
})();

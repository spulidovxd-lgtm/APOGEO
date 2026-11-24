/* ==========================================================================
   APOGEO · Motor de vuelo
   - Física: ignición -> empuje -> inercia -> frenado (resorte amortiguado)
   - Mundo vertical: la cámara sigue al cohete y los planetas, asteroides,
     nubes de nebulosa y satélites PASAN a su lado con parallax.
   - Todo se dibuja en <canvas>; el cohete sigue siendo tu rocket.svg.
   API:  Flight.init({stage,rocket,altEl,zones,onZone})
         Flight.reset()  Flight.start()  Flight.stop()
         Flight.launch(altitudKm, tier 0-5)   Flight.fail(tiempoAgotado)
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- Constantes ajustables ---------- */
  var KM_PER_PT = 12.7;          // 1 punto = 12.7 km (igual que app.js)
  var PX_PER_KM = 0.4;           // escala del mundo
  var PX_PER_PT = KM_PER_PT * PX_PER_KM;
  var IGN = 0.38;                // segundos de ignición antes del despegue
  var TAIL_INSET = 0.05;         // cuánto entra la llama dentro del cohete (fracción de su alto)
  var TAU = Math.PI * 2;

  function P(pts) { return pts * PX_PER_PT; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function mix(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }

  /* Color de llama por rareza: COMMON ... COSMIC */
  var TIERS = [
    { a: '#ffe2a8', b: '#ff7a2b' },
    { a: '#c9fff9', b: '#2fd3ff' },
    { a: '#d6e6ff', b: '#4d7dff' },
    { a: '#e6d8ff', b: '#8a5bff' },
    { a: '#fff4b8', b: '#ffa62e' },
    { a: '#ffffff', b: '#ff63c4' }
  ];

  /* Color de ambiente según la zona (se mezcla de forma continua) */
  var LOOK = [
    { top: [4, 10, 24], bot: [10, 40, 92] },    // órbita terrestre
    { top: [5, 7, 15], bot: [26, 30, 46] },     // luna
    { top: [12, 6, 5], bot: [72, 26, 15] },     // marte
    { top: [3, 14, 30], bot: [16, 66, 90] },    // europa / júpiter
    { top: [20, 6, 42], bot: [58, 14, 72] }     // nebulosa
  ];

  var S = {
    ready: false, running: false, W: 0, H: 0, dpr: 1,
    t: 0, pos: 0, vel: 0, target: 0, D0: 0, omega: 3, burning: false, burnT: 0, ignited: true,
    thrust: 0.16, tier: 0, lag: 0, ang: 0, angVel: 0, roll: 0, rollT: 0,
    shake: 0, sputter: 0, flash: 0, flashCol: '255,255,255', emitAcc: 0, streakAcc: 0,
    rx: 0, ry: 0, rang: 0, rw: 64, rh: 110, anchorY: 200,
    particles: [], streaks: [], rings: [], comet: null, cometDone: false,
    zoneIdx: 0, maxZone: 0, zoneStartPx: [0], lastKm: -1, lastVel: '', last: 0
  };

  /* ====================================================================
     INICIALIZACIÓN
     ==================================================================== */
  function mk(cls) {
    var c = document.createElement('canvas');
    c.className = 'fl-canvas ' + cls;
    c.setAttribute('aria-hidden', 'true');
    return c;
  }

  function init(o) {
    if (S.ready) return;
    S.stage = o.stage; S.rocket = o.rocket; S.altEl = o.altEl;
    S.zones = o.zones || []; S.onZone = o.onZone || function () {};
    S.zoneStartPx = S.zones.map(function (z) { return P(z.min); });
    S.reduce = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

    S.cvB = mk('fl-back'); S.cvF = mk('fl-front');
    S.gB = S.cvB.getContext('2d'); S.gF = S.cvF.getContext('2d');
    S.stage.insertBefore(S.cvF, S.stage.firstChild);
    S.stage.insertBefore(S.cvB, S.stage.firstChild);

    var banner = document.createElement('div');
    banner.className = 'zone-banner'; banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = '<small></small><strong></strong>';
    S.stage.appendChild(banner); S.banner = banner;

    var hud = document.createElement('div');
    hud.className = 'fl-hud'; hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<span>VEL <b>0.0</b> km/s</span><span>EMPUJE <i><em></em></i></span>';
    S.stage.appendChild(hud); S.hudV = hud.querySelector('b'); S.hudT = hud.querySelector('em');

    buildWorld();
    S.rocket.addEventListener('load', function () { measureRocket(); });
    if (global.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(S.stage);
    else global.addEventListener('resize', resize);
    S.ready = true;
    resize();
    reset();
  }

  /* ---------- Generación del mundo (determinista) ---------- */
  function buildWorld() {
    var r = mulberry(20260);
    var i;

    // Estrellas en 3 capas de profundidad
    S.stars = [];
    [{ n: 46, par: 0.05, s: [0.6, 1.1], a: 0.5, drift: 2 },
     { n: 30, par: 0.14, s: [0.9, 1.5], a: 0.75, drift: 5 },
     { n: 16, par: 0.34, s: [1.2, 2.1], a: 0.95, drift: 10 }].forEach(function (L) {
      for (i = 0; i < L.n; i++) {
        S.stars.push({
          x: r(), y: r(), par: L.par, size: lerp(L.s[0], L.s[1], r()), a: L.a,
          drift: L.drift, tw: 1 + r() * 3, ph: r() * TAU,
          tint: r() < 0.15 ? '#bcd7ff' : r() < 0.1 ? '#ffd9b0' : '#ffffff'
        });
      }
    });

    // Asteroides: cinturón entre Marte y Europa (pts 250-312)
    S.rocks = [];
    for (i = 0; i < 64; i++) {
      var layer = i % 4; // 0,1 fondo · 2 plano del cohete (colisiona) · 3 primer plano
      var par = layer < 2 ? 0.55 + r() * 0.3 : layer === 2 ? 1.0 : 1.35 + r() * 0.25;
      var rr = layer < 2 ? 4 + r() * 6 : layer === 2 ? 8 + r() * 12 : 16 + r() * 20;
      var verts = [], n = 9 + (r() * 3 | 0);
      for (var v = 0; v < n; v++) verts.push(0.7 + r() * 0.5);
      S.rocks.push({
        h: P(250) + r() * P(62), x: r(), vx: (r() - 0.5) * 0.02, par: par, r: rr,
        rot: r() * TAU, rotV: (r() - 0.5) * 1.6, verts: verts, hit: false,
        shade: ['#7a6a5c', '#6d6258', '#8a786a', '#5f5750'][i % 4]
      });
    }

    // Nubes de nebulosa (fondo) y gas cercano (primer plano)
    var cols = ['255,99,196', '154,123,255', '103,245,230', '255,150,90'];
    S.neb = []; S.nebNear = [];
    for (i = 0; i < 40; i++) {
      S.neb.push({ h: P(330 + r() * 470), x: r(), rad: 90 + r() * 170, par: 0.3 + r() * 0.35, a: 0.35 + r() * 0.4, c: cols[i % 4] });
    }
    for (i = 0; i < 9; i++) {
      S.nebNear.push({ h: P(390 + r() * 330), x: r(), rad: 150 + r() * 120, par: 1.4, a: 0.14, c: cols[(i + 1) % 4] });
    }

    // Bruma de polvo marciano y destellos de hielo (primer plano)
    S.haze = []; S.glints = [];
    for (i = 0; i < 10; i++) S.haze.push({ h: P(205 + r() * 55), x: r(), w: 160 + r() * 140, par: 1.25, sp: 8 + r() * 14, ph: r() * TAU });
    for (i = 0; i < 26; i++) S.glints.push({ h: P(315 + r() * 55), x: r(), s: 2 + r() * 4, par: 1.2, ph: r() * TAU, tw: 2 + r() * 3 });

    // Satélites en órbita terrestre
    S.sats = [{ h: 60, y0: 0.2, dir: 1, sp: 14, s: 1 }, { h: 215, y0: 0.7, dir: -1, sp: 20, s: 0.8 }, { h: 360, y0: 0.4, dir: 1, sp: 11, s: 1.1 }];

    // Continentes y nubes de la Tierra
    S.cont = []; S.clouds = [];
    var ccols = ['#2f7d46', '#6f8f45', '#b6a35a', '#3c6b3a'];
    for (i = 0; i < 18; i++) S.cont.push({ a: (r() - 0.5) * 1.3, rx: 16 + r() * 40, ry: 8 + r() * 18, rot: (r() - 0.5) * 1.2, c: ccols[i % 4], dy: (r() - 0.5) * 30 });
    for (i = 0; i < 24; i++) S.clouds.push({ a: (r() - 0.5) * 1.3, rx: 20 + r() * 60, ry: 3 + r() * 8, al: 0.3 + r() * 0.35, dy: (r() - 0.5) * 40 });
  }

  /* ---------- Tamaño y sprites ---------- */
  function resize() {
    var w = S.stage.clientWidth, h = S.stage.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    if (w === S.W && h === S.H && dpr === S.dpr) return;
    S.W = w; S.H = h; S.dpr = dpr;
    [S.cvB, S.cvF].forEach(function (c) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
    S.anchorY = Math.round(h * 0.6);
    measureRocket();
    buildSprites();
  }

  function measureRocket() {
    if (!S.W) return;
    S.rw = Math.round(clamp(S.W * 0.17, 50, 74));
    S.rocket.style.width = S.rw + 'px';
    var nw = S.rocket.naturalWidth, nh = S.rocket.naturalHeight;
    S.rh = Math.round(S.rw * ((nw && nh) ? nh / nw : 1.75));
    detectTail(nw, nh);
  }

  /* Busca la fila más baja con píxeles visibles para que la llama salga de la boquilla */
  function detectTail(nw, nh) {
    S.tailFrac = 0.5 - TAIL_INSET; S.tailDx = 0;           // respaldo
    if (!nw || !nh) return;
    try {
      var cw = 64, ch = Math.max(8, Math.round(64 * nh / nw)), c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      var g = c.getContext('2d'); g.drawImage(S.rocket, 0, 0, cw, ch);
      var d = g.getImageData(0, 0, cw, ch).data, y, x, low = -1;
      for (y = ch - 1; y >= 0 && low < 0; y--) for (x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 40) { low = y; break; }
      if (low < 0) return;
      var sum = 0, n = 0;
      for (y = Math.max(0, low - 4); y <= low; y++) for (x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 40) { sum += x; n++; }
      S.tailFrac = (low + 1) / ch - 0.5 - 0.02;            // fracción del alto desde el centro
      S.tailDx = n ? (sum / n / cw - 0.5) : 0;             // desvío horizontal (fracción del ancho)
    } catch (e) { /* file:// puede bloquear la lectura: se usa el respaldo */ }
  }

  function makeSphere(R, pad, sc, base, feat, glow, seed) {
    var size = Math.ceil((R + pad) * 2 * sc), c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d'); g.scale(sc, sc);
    var cx = R + pad, cy = R + pad, i;
    if (glow) {
      var gl = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R + pad);
      gl.addColorStop(0, glow[0]); gl.addColorStop(1, glow[1]);
      g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R + pad, 0, TAU); g.fill();
    }
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    var bg = g.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx - R * 0.1, cy - R * 0.1, R * 1.35);
    for (i = 0; i < base.length; i++) bg.addColorStop(base[i][0], base[i][1]);
    g.fillStyle = bg; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    feat(g, cx, cy, R, mulberry(seed));
    var sh = g.createRadialGradient(cx - R * 0.5, cy - R * 0.55, R * 0.35, cx - R * 0.2, cy - R * 0.2, R * 1.45);
    sh.addColorStop(0, 'rgba(0,0,12,0)'); sh.addColorStop(0.62, 'rgba(0,0,12,.18)'); sh.addColorStop(1, 'rgba(0,0,12,.84)');
    g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    return { c: c, R: R, pad: pad };
  }

  function featMoon(g, cx, cy, R, r) {
    var i, a, d, x, y, rr;
    g.fillStyle = 'rgba(70,76,92,.38)';
    for (i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx + (r() - 0.5) * R * 1.3, cy + (r() - 0.5) * R * 1.3, R * (0.15 + r() * 0.22), R * (0.1 + r() * 0.18), r() * 3, 0, TAU); g.fill(); }
    for (i = 0; i < 34; i++) {
      a = r() * TAU; d = R * Math.sqrt(r()) * 0.95; x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d; rr = R * (0.02 + r() * r() * 0.12);
      g.fillStyle = 'rgba(40,46,60,.38)'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = Math.max(1, rr * 0.18);
      g.beginPath(); g.arc(x - rr * 0.12, y - rr * 0.12, rr, Math.PI * 0.95, Math.PI * 1.65); g.stroke();
    }
  }

  function featMars(g, cx, cy, R, r) {
    var i;
    g.fillStyle = 'rgba(72,26,16,.42)';
    for (i = 0; i < 7; i++) { g.beginPath(); g.ellipse(cx + (r() - 0.5) * R * 1.4, cy + (r() - 0.35) * R * 1.2, R * (0.12 + r() * 0.26), R * (0.07 + r() * 0.14), r() * 3, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(60,20,12,.55)'; g.lineWidth = R * 0.035; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - R * 0.6, cy + R * 0.12); g.bezierCurveTo(cx - R * 0.2, cy + R * 0.02, cx + R * 0.1, cy + R * 0.25, cx + R * 0.55, cy + R * 0.1); g.stroke();
    for (i = 0; i < 12; i++) {
      var x = cx + (r() - 0.5) * R * 1.5, y = cy + (r() - 0.5) * R * 1.5, rr = R * (0.02 + r() * 0.05);
      g.fillStyle = 'rgba(60,20,12,.3)'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(cx, cy - R * 0.95, R * 0.46, R * 0.2, 0, 0, TAU); g.fill();
  }

  function featEuropa(g, cx, cy, R, r) {
    var i;
    g.fillStyle = 'rgba(165,110,90,.22)';
    for (i = 0; i < 8; i++) { g.beginPath(); g.ellipse(cx + (r() - 0.5) * R * 1.3, cy + (r() - 0.5) * R * 1.3, R * (0.08 + r() * 0.2), R * (0.05 + r() * 0.12), r() * 3, 0, TAU); g.fill(); }
    g.lineCap = 'round';
    for (i = 0; i < 22; i++) {
      g.strokeStyle = r() < 0.7 ? 'rgba(160,88,64,.55)' : 'rgba(255,255,255,.35)';
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      var x0 = cx + (r() - 0.5) * R * 2.2, y0 = cy + (r() - 0.5) * R * 2.2;
      g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + (r() - 0.5) * R, y0 + (r() - 0.5) * R, x0 + (r() - 0.5) * R * 1.4, y0 + (r() - 0.5) * R * 1.4, x0 + (r() - 0.5) * R * 1.8, y0 + (r() - 0.5) * R * 1.8);
      g.stroke();
    }
  }

  function featJupiter(g, cx, cy, R, r) {
    var cols = ['#f3e6cc', '#d8b48a', '#b98657', '#8e5a3a', '#ead7b3', '#c79a6c', '#a56a45', '#f0e0c0'];
    var y = cy - R, i = 0, k;
    while (y < cy + R) { var hh = R * (0.04 + r() * 0.1); g.fillStyle = cols[(i++ + (r() * 3 | 0)) % cols.length]; g.fillRect(cx - R, y, R * 2, hh + 1); y += hh; }
    g.globalAlpha = 0.2;
    for (k = 0; k < 70; k++) {
      var yy = cy - R + r() * R * 2;
      g.strokeStyle = r() < 0.5 ? '#ffffff' : '#5a3320'; g.lineWidth = 1 + r() * 2.5;
      g.beginPath(); g.moveTo(cx - R, yy);
      for (var x = -R; x <= R; x += R / 8) g.lineTo(cx + x, yy + Math.sin(x * 0.05 + k) * R * 0.018);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = '#b5472f'; g.beginPath(); g.ellipse(cx + R * 0.28, cy + R * 0.3, R * 0.19, R * 0.11, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,200,170,.45)'; g.beginPath(); g.ellipse(cx + R * 0.28, cy + R * 0.3, R * 0.1, R * 0.055, 0, 0, TAU); g.fill();
  }

  function buildSprites() {
    var W = S.W, sc = Math.min(S.dpr, 2);
    function sph(kind, R, pad, scale, base, feat, glow, seed) { return makeSphere(R, pad, scale, base, feat, glow, seed); }
    S.planets = [
      { x: 0.82, h: P(372), par: 0.8, spr: sph('jup', W * 0.5, 6, 1,
        [[0, '#f6ead2'], [0.5, '#d2a874'], [1, '#6b4128']], featJupiter, ['rgba(240,200,150,.25)', 'rgba(240,200,150,0)'], 11) },
      { x: 0.76, h: P(130), par: 1, spr: sph('moon', W * 0.33, 8, sc,
        [[0, '#f4f4f1'], [0.55, '#b9bcc4'], [1, '#4a4e5a']], featMoon, ['rgba(200,210,235,.22)', 'rgba(200,210,235,0)'], 21) },
      { x: 0.2, h: P(230), par: 1, spr: sph('mars', W * 0.34, 16, sc,
        [[0, '#ffa273'], [0.5, '#d9633a'], [1, '#6a2616']], featMars, ['rgba(255,130,80,.34)', 'rgba(255,130,80,0)'], 31) },
      { x: 0.3, h: P(340), par: 1, spr: sph('eur', W * 0.27, 16, sc,
        [[0, '#ffffff'], [0.5, '#cfe3f0'], [1, '#5a7893']], featEuropa, ['rgba(150,220,255,.34)', 'rgba(150,220,255,0)'], 41) }
    ];
    S.blobs = {};
    ['255,99,196', '154,123,255', '103,245,230', '255,150,90'].forEach(function (c) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 128;
      var g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(' + c + ',.6)'); gr.addColorStop(0.45, 'rgba(' + c + ',.22)'); gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128); S.blobs[c] = cv;
    });
    var dv = document.createElement('canvas'); dv.width = dv.height = 128;
    var dg = dv.getContext('2d'), dgr = dg.createRadialGradient(64, 64, 0, 64, 64, 64);
    dgr.addColorStop(0, 'rgba(230,140,90,.55)'); dgr.addColorStop(1, 'rgba(230,140,90,0)');
    dg.fillStyle = dgr; dg.fillRect(0, 0, 128, 128); S.dust = dv;
  }

  /* ====================================================================
     CONTROL PÚBLICO
     ==================================================================== */
  function reset() {
    S.pos = 0; S.vel = 0; S.target = 0; S.D0 = 0; S.burning = false; S.burnT = 0;
    S.thrust = 0.16; S.tier = 0; S.lag = 0; S.ang = 0; S.angVel = 0; S.rollT = 0; S.roll = 0;
    S.shake = 0; S.sputter = 0; S.flash = 0; S.particles.length = 0; S.streaks.length = 0; S.rings.length = 0;
    S.comet = null; S.cometDone = false; S.zoneIdx = 0; S.maxZone = 0; S.lastKm = -1;
    S.rocks.forEach(function (k) { k.hit = false; });
    if (S.banner) S.banner.classList.remove('show');
  }

  function start() {
    if (!S.ready) return;
    S.running = true; S.last = 0;
    resize();
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(loop);
  }
  function stop() { S.running = false; cancelAnimationFrame(S.raf); }

  function launch(targetKm, tier) {
    if (!S.ready) return;
    S.tier = clamp(tier | 0, 0, 5);
    S.target = targetKm * PX_PER_KM;
    var D0 = S.target - S.pos;
    S.D0 = Math.max(D0, 1);
    S.omega = clamp(4.4 - D0 / 220, 1.9, 4.4);   // más distancia => maniobra más larga y épica
    S.burning = true; S.burnT = 0; S.ignited = false;
    S.shake = Math.max(S.shake, 0.25);
    S.angVel += (Math.random() < 0.5 ? -1 : 1) * 1.2;
    if (S.tier >= 4) S.rollT = 0.0001;           // barrel roll para LEGENDARY y COSMIC
  }

  function fail(timeout) {
    if (!S.ready) return;
    S.sputter = timeout ? 1.5 : 0.95;
    S.shake = Math.max(S.shake, 0.85);
    S.angVel += (Math.random() < 0.5 ? -1 : 1) * (timeout ? 3 : 6.5);
    S.vel -= 32;
    S.flash = 0.3; S.flashCol = '255,60,110';
    for (var i = 0; i < 18; i++) emit('smoke', 1);
    for (i = 0; i < 8; i++) emit('spark', 1);
  }

  /* ====================================================================
     PARTÍCULAS
     ==================================================================== */
  function tail() {
    var L = S.rh * (S.tailFrac == null ? 0.5 - TAIL_INSET : S.tailFrac), th = S.rang, ox = (S.tailDx || 0) * S.rw;
    return { x: S.rx + ox * Math.cos(th) - Math.sin(th) * L, y: S.ry + ox * Math.sin(th) + Math.cos(th) * L, dx: -Math.sin(th), dy: Math.cos(th) };
  }

  function emit(type, power) {
    if (S.particles.length > 320) return;
    var t = tail(), sp, p;
    if (type === 'fire') {
      sp = 80 + S.thrust * 240;
      p = { type: 0, x: t.x + (Math.random() - 0.5) * S.rw * 0.16, y: t.y, vx: t.dx * sp + (Math.random() - 0.5) * 36, vy: t.dy * sp, life: 0, max: 0.35 + Math.random() * 0.45, size: 1.5 + Math.random() * 3 * (0.6 + S.thrust) };
    } else if (type === 'smoke') {
      p = { type: 1, x: t.x + (Math.random() - 0.5) * S.rw * 0.5, y: t.y + 6, vx: (Math.random() - 0.5) * 90, vy: 30 + Math.random() * 90, life: 0, max: 0.9 + Math.random() * 0.8, size: 4 + Math.random() * 7 };
    } else {
      var a = Math.random() * TAU, v = 60 + Math.random() * 170;
      p = { type: 2, x: t.x, y: t.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 40, life: 0, max: 0.35 + Math.random() * 0.4, size: 1.4 };
    }
    S.particles.push(p);
  }

  function ring(x, y, color, maxR, life, w) { S.rings.push({ x: x, y: y, r: 4, max: maxR, life: 0, dur: life, color: color, w: w || 2 }); }

  /* ====================================================================
     FÍSICA (un paso)
     ==================================================================== */
  function step(dt) {
    S.t += dt;
    var D = S.target - S.pos, acc = 0, u;

    if (S.burning) {
      S.burnT += dt;
      if (S.burnT >= IGN) {
        if (!S.ignited) {                                  // ¡DESPEGUE!
          S.ignited = true;
          S.shake = Math.max(S.shake, 0.55 + S.tier * 0.1);
          if (!S.reduce) S.flash = Math.max(S.flash, 0.18 + S.tier * 0.04);
          S.flashCol = '255,235,200';
          ring(S.rx, tail().y, TIERS[S.tier].a, 60 + S.tier * 22, 0.7, 2.5);
          if (S.tier >= 2) ring(S.rx, tail().y, TIERS[S.tier].b, 90 + S.tier * 26, 1.0, 2);
          for (var q = 0; q < 14; q++) emit('spark', 1);
        }
        var ramp = smooth((S.burnT - IGN) / 0.55);          // el empuje crece progresivamente
        acc = (S.omega * S.omega * D - 2 * 0.82 * S.omega * S.vel) * ramp;
        S.vel += acc * dt; S.pos += S.vel * dt;
        if (Math.abs(D) < 0.4 && Math.abs(S.vel) < 3) { S.pos = S.target; S.vel = 0; S.burning = false; }
      } else {
        S.shake = Math.max(S.shake, 0.22 + 0.4 * (S.burnT / IGN));   // retumbar durante la ignición
      }
    } else {
      var a2 = 20.25 * D - 9 * S.vel;                       // mantener posición (amortiguación crítica)
      S.vel += a2 * dt; S.pos += S.vel * dt;
      if (Math.abs(D) < 0.2 && Math.abs(S.vel) < 1) { S.pos = S.target; S.vel = 0; }
    }

    // Empuje visual
    var aRef = Math.max(S.omega * S.omega * S.D0 * 0.5, 70);
    if (S.burning) u = S.burnT < IGN ? 0.25 + 0.55 * (S.burnT / IGN) : clamp(0.3 + acc / aRef, 0.05, 1);
    else u = 0.16;
    if (S.sputter > 0) { S.sputter -= dt; u = Math.random() < 0.5 ? 0.02 : 0.38 * Math.random(); }
    S.thrust += (u - S.thrust) * Math.min(1, dt * 9);

    // Retraso de cámara: el cohete sube en pantalla al acelerar
    S.lag += (clamp(S.vel * 0.1, -10, 34) - S.lag) * Math.min(1, dt * 6);

    // Cabeceo (resorte angular)
    S.angVel += (-90 * S.ang - 7 * S.angVel) * dt;
    S.ang += S.angVel * dt;

    // Barrel roll
    if (S.rollT > 0) { S.rollT += dt; var k = S.rollT / 0.85; if (k >= 1) { S.rollT = 0; S.roll = 0; } else S.roll = k * TAU; }

    S.shake = Math.max(0, S.shake - dt * 1.6);
    S.flash = Math.max(0, S.flash - dt * 1.4);

    // Pose del cohete
    var sf = clamp(S.vel / 350, 0, 1);
    var swayX = Math.sin(S.t * 1.3) * (2.5 + sf * 9);
    var bob = Math.sin(S.t * 2.1) * 2 + Math.sin(S.t * 3.3) * 1;
    S.rx = S.W * 0.5 + swayX;
    S.ry = S.anchorY - S.lag + bob * (1 - sf * 0.7);
    S.ry = Math.max(S.ry, S.rh * 0.5 + 12);
    S.rang = Math.cos(S.t * 1.3) * (0.02 + sf * 0.035) + S.ang;

    // Emisión de partículas
    S.emitAcc += (S.thrust * 85 + 10) * dt * (S.reduce ? 0.4 : 1);
    while (S.emitAcc >= 1) { S.emitAcc -= 1; emit('fire', 1); if (Math.random() < 0.25) emit('smoke', 1); }

    // Líneas de velocidad
    if (!S.reduce && S.vel > 110) {
      S.streakAcc += (S.vel - 100) * 0.09 * dt;
      while (S.streakAcc >= 1) { S.streakAcc -= 1; S.streaks.push({ x: Math.random() * S.W, y: -30 - Math.random() * 60, len: 20 + Math.random() * 50, a: 0.2 + Math.random() * 0.3 }); }
    }

    updateParticles(dt);
    updateWorld(dt);
    checkZone();
  }

  function updateParticles(dt) {
    var i, p, scroll = S.vel;
    for (i = S.particles.length - 1; i >= 0; i--) {
      p = S.particles[i]; p.life += dt;
      if (p.life >= p.max) { S.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += (p.vy + scroll * 0.9) * dt;
      p.vx *= (1 - dt * 1.2); p.vy *= (1 - dt * 0.8);
    }
    for (i = S.streaks.length - 1; i >= 0; i--) {
      p = S.streaks[i]; p.y += (S.vel * 1.7 + 120) * dt;
      if (p.y - p.len > S.H) S.streaks.splice(i, 1);
    }
    for (i = S.rings.length - 1; i >= 0; i--) {
      p = S.rings[i]; p.life += dt; p.r = lerp(4, p.max, 1 - Math.pow(1 - clamp(p.life / p.dur, 0, 1), 2));
      if (p.life >= p.dur) S.rings.splice(i, 1);
    }
  }

  function rockScreen(k) {
    var x = ((k.x + k.vx * S.t) % 1 + 1) % 1;
    return { x: x * S.W, y: S.anchorY + (S.pos - k.h) * k.par };
  }

  function updateWorld(dt) {
    // Rotación y colisiones leves con asteroides del plano del cohete
    var i, k, s, dx, dy;
    for (i = 0; i < S.rocks.length; i++) {
      k = S.rocks[i]; k.rot += k.rotV * dt;
      if (k.par !== 1.0) continue;
      s = rockScreen(k);
      if (s.y < -60 || s.y > S.H + 60) { k.hit = false; continue; }
      if (k.hit) continue;
      dx = s.x - S.rx; dy = s.y - S.ry;
      if (Math.abs(dx) < S.rw * 0.34 + k.r && Math.abs(dy) < S.rh * 0.42 + k.r) {
        k.hit = true;
        var dir = dx >= 0 ? 1 : -1;
        k.vx += dir * 0.3; k.rotV += dir * 4;
        S.angVel += -dir * 3.2;
        S.shake = Math.max(S.shake, 0.5);
        for (var q = 0; q < 10; q++) emit('spark', 1);
      }
    }
    // Cometa que cruza entre la Luna y Marte
    if (!S.cometDone && S.pos > P(150)) {
      S.cometDone = true;
      S.comet = { x: S.W + 40, y: S.H * 0.12, vx: -300, vy: 130, t: 0 };
    }
    if (S.comet) {
      S.comet.t += dt; S.comet.x += S.comet.vx * dt; S.comet.y += (S.comet.vy + S.vel * 0.5) * dt;
      if (S.comet.x < -220 || S.comet.y > S.H + 80) S.comet = null;
    }
  }

  function checkZone() {
    var i, idx = 0, starts = S.zoneStartPx;
    for (i = 0; i < starts.length; i++) if (S.pos >= starts[i]) idx = i;
    S.zoneIdx = idx;
    if (idx > S.maxZone) {
      S.maxZone = idx;
      var z = S.zones[idx] || {};
      S.onZone(idx, z);
      if (S.banner) {
        S.banner.querySelector('small').textContent = (z.tag || '').split('·')[0].trim();
        S.banner.querySelector('strong').textContent = z.name || '';
        S.banner.classList.remove('show'); void S.banner.offsetWidth; S.banner.classList.add('show');
      }
      if (!S.reduce) { S.flash = Math.max(S.flash, 0.4); S.flashCol = '103,245,230'; S.shake = Math.max(S.shake, 0.35); }
      ring(S.rx, S.ry, '#67f5e6', S.W * 0.8, 1.1, 3);
      ring(S.rx, S.ry, '#9a7bff', S.W * 0.55, 0.9, 2);
    }
  }

  /* ====================================================================
     DIBUJO
     ==================================================================== */
  function yOf(h, par) { return S.anchorY + (S.pos - h) * par; }

  function drawBackground(g) {
    var st = S.zoneStartPx, t = LOOK[0].top, b = LOOK[0].bot, i, k;
    for (i = 1; i < st.length && i < LOOK.length; i++) {
      k = smooth((S.pos - (st[i] - P(45))) / P(85));
      if (k > 0) { t = mix(t, LOOK[i].top, k); b = mix(b, LOOK[i].bot, k); }
    }
    var gr = g.createLinearGradient(0, 0, 0, S.H);
    gr.addColorStop(0, rgb(t)); gr.addColorStop(1, rgb(b));
    g.fillStyle = gr; g.fillRect(-20, -20, S.W + 40, S.H + 40);
  }

  function drawStars(g) {
    var H = S.H, i, s, y, x, len;
    for (i = 0; i < S.stars.length; i++) {
      s = S.stars[i];
      y = ((s.y * H + S.pos * s.par + S.t * s.drift) % H + H) % H;
      x = s.x * S.W;
      g.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(S.t * s.tw + s.ph));
      g.fillStyle = s.tint;
      len = S.reduce ? 0 : clamp(S.vel * s.par * 0.06, 0, 70);
      if (len > 3) g.fillRect(x - s.size * 0.4, y - len, s.size * 0.8, len);
      else g.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
    }
    g.globalAlpha = 1;
  }

  function drawNebula(g) {
    var env = smooth((S.pos - P(300)) / P(110));
    if (env <= 0.01) return;
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < S.neb.length; i++) {
      var n = S.neb[i], y = yOf(n.h, n.par), d = n.rad * 2;
      if (y < -d || y > S.H + d) continue;
      g.globalAlpha = n.a * env * 0.55;
      g.drawImage(S.blobs[n.c], n.x * S.W - n.rad, y - n.rad, d, d);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  function drawPlanets(g) {
    for (var i = 0; i < S.planets.length; i++) {
      var p = S.planets[i], R = p.spr.R, pad = p.spr.pad;
      var y = yOf(p.h, p.par), d = Math.abs(S.pos - p.h);
      var sc = p.par === 1 ? 0.84 + 0.26 * (1 - clamp(d / P(70), 0, 1)) : 1;   // se agranda al acercarse
      var half = (R + pad) * sc;
      if (y + half < 0 || y - half > S.H) continue;
      g.drawImage(p.spr.c, p.x * S.W - half, y - half, half * 2, half * 2);
    }
  }

  function drawBlackHole(g) {
    var h = P(480), par = 0.8, y = yOf(h, par), x = S.W * 0.6, Rc = S.W * 0.085, rx = S.W * 0.46;
    if (y < -rx || y > S.H + rx) return;
    var ratio = 0.24, i;
    function disc(clipHalf) {
      g.save(); g.translate(x, y); g.rotate(-0.2);
      if (clipHalf) { g.beginPath(); g.rect(-rx * 1.2, clipHalf < 0 ? -rx : 0, rx * 2.4, rx); g.clip(); }
      g.scale(1, ratio);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(Rc / rx * 1.1, 'rgba(255,245,215,0)');
      gr.addColorStop(Rc / rx * 1.5, 'rgba(255,240,200,.95)'); gr.addColorStop(0.5, 'rgba(255,150,60,.7)');
      gr.addColorStop(0.8, 'rgba(160,40,130,.3)'); gr.addColorStop(1, 'rgba(90,20,120,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill();
      g.restore();
    }
    g.globalCompositeOperation = 'lighter';
    var halo = g.createRadialGradient(x, y, Rc, x, y, Rc * 4.2);
    halo.addColorStop(0, 'rgba(255,170,90,.38)'); halo.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(x, y, Rc * 4.2, 0, TAU); g.fill();
    disc(-1);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, Rc, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,225,190,.9)'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, Rc * 1.04, 0, TAU); g.stroke();
    g.globalCompositeOperation = 'lighter';
    disc(1);
    g.globalCompositeOperation = 'source-over';
  }

  function drawEarth(g) {
    var R = Math.max(S.W * 1.05, 360), topY = yOf(-110, 1);
    if (topY > S.H + 4) return;
    var cx = S.W * 0.5, cy = topY + R, i;
    // Atmósfera
    var at = g.createRadialGradient(cx, cy, R * 0.985, cx, cy, R + 42);
    at.addColorStop(0, 'rgba(110,190,255,.75)'); at.addColorStop(0.35, 'rgba(70,140,255,.28)'); at.addColorStop(1, 'rgba(70,140,255,0)');
    g.fillStyle = at; g.beginPath(); g.arc(cx, cy, R + 42, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    var oc = g.createRadialGradient(cx - R * 0.3, cy - R * 0.95, 0, cx, cy - R * 0.2, R * 1.15);
    oc.addColorStop(0, '#5db2ff'); oc.addColorStop(0.35, '#2a74d8'); oc.addColorStop(0.7, '#0f3a8c'); oc.addColorStop(1, '#030f2a');
    g.fillStyle = oc; g.fillRect(cx - R, topY - 4, R * 2, 260);
    var rot = S.t * 0.012, a, x, y;
    for (i = 0; i < S.cont.length; i++) {
      var c = S.cont[i]; a = ((c.a + rot + 0.75) % 1.5 + 1.5) % 1.5 - 0.75;
      x = cx + Math.sin(a) * R; y = cy - Math.cos(a) * R + 20 + c.dy;
      g.fillStyle = c.c; g.globalAlpha = 0.9;
      g.beginPath(); g.ellipse(x, y, c.rx, c.ry, c.rot + a, 0, TAU); g.fill();
    }
    for (i = 0; i < S.clouds.length; i++) {
      var cl = S.clouds[i]; a = ((cl.a + rot * 1.6 + 0.75) % 1.5 + 1.5) % 1.5 - 0.75;
      x = cx + Math.sin(a) * R; y = cy - Math.cos(a) * R + 14 + cl.dy;
      g.fillStyle = '#ffffff'; g.globalAlpha = cl.al;
      g.beginPath(); g.ellipse(x, y, cl.rx, cl.ry, a, 0, TAU); g.fill();
    }
    g.globalAlpha = 1; g.restore();
    g.strokeStyle = 'rgba(170,225,255,.85)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, R, Math.PI * 1.22, Math.PI * 1.78); g.stroke();
  }

  function drawSat(g, s, i) {
    var y = yOf(s.h, 1);
    if (y < -20 || y > S.H + 20) return;
    var span = S.W + 80, x = (((s.y0 * span + S.t * s.sp * s.dir) % span) + span) % span - 40;
    g.save(); g.translate(x, y); g.rotate(Math.sin(S.t * 0.5 + i) * 0.15); g.scale(s.s, s.s);
    g.fillStyle = '#c9d2e6'; g.fillRect(-5, -3, 10, 6);
    g.fillStyle = '#3d6bd1'; g.fillRect(-20, -2, 14, 4); g.fillRect(6, -2, 14, 4);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.6;
    for (var k = -18; k <= 18; k += 4) { g.beginPath(); g.moveTo(k, -2); g.lineTo(k, 2); g.stroke(); }
    if (Math.sin(S.t * 4 + i * 2) > 0.6) { g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(0, -4.5, 1.3, 0, TAU); g.fill(); }
    g.restore();
  }

  function drawRocks(g, front) {
    for (var i = 0; i < S.rocks.length; i++) {
      var k = S.rocks[i], isFront = k.par >= 1.0;
      if (isFront !== front) continue;
      var s = rockScreen(k);
      if (s.y < -k.r * 2 || s.y > S.H + k.r * 2) continue;
      var n = k.verts.length;
      g.save(); g.translate(s.x, s.y); g.rotate(k.rot);
      g.globalAlpha = k.par > 1.2 ? 0.88 : k.par < 0.9 ? 0.7 : 1;
      g.beginPath();
      for (var v = 0; v < n; v++) {
        var a = v / n * TAU, rr = k.r * k.verts[v];
        if (v === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath(); g.fillStyle = k.shade; g.fill();
      g.strokeStyle = 'rgba(255,235,215,.35)'; g.lineWidth = Math.max(0.8, k.r * 0.07); g.stroke();
      if (k.r > 9) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(k.r * 0.25, k.r * 0.1, k.r * 0.22, 0, TAU); g.fill(); }
      g.restore();
    }
    g.globalAlpha = 1;
  }

  function drawComet(g) {
    var c = S.comet; if (!c) return;
    var L = 170, ang = Math.atan2(c.vy, c.vx);
    g.save(); g.translate(c.x, c.y); g.rotate(ang); g.globalCompositeOperation = 'lighter';
    var gr = g.createLinearGradient(0, 0, L, 0);
    gr.addColorStop(0, 'rgba(210,245,255,.95)'); gr.addColorStop(0.3, 'rgba(120,200,255,.45)'); gr.addColorStop(1, 'rgba(120,200,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -4); g.lineTo(L, -1); g.lineTo(L, 1); g.lineTo(0, 4); g.closePath(); g.fill();
    var h = g.createRadialGradient(0, 0, 0, 0, 0, 14);
    h.addColorStop(0, '#fff'); h.addColorStop(1, 'rgba(160,220,255,0)');
    g.fillStyle = h; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill();
    g.restore(); g.globalCompositeOperation = 'source-over';
  }

  function flamePath(g, len, w) {
    g.beginPath(); g.moveTo(-w, 0);
    g.quadraticCurveTo(-w * 1.05, len * 0.55, 0, len);
    g.quadraticCurveTo(w * 1.05, len * 0.55, w, 0);
    g.closePath();
  }

  function drawFlame(g) {
    var t = tail(), T = S.thrust, tier = TIERS[S.tier];
    var len = (10 + T * S.rh * 0.95) * (0.9 + Math.random() * 0.2) * (S.sputter > 0 ? 0.55 : 1);
    var w = S.rw * (0.1 + T * 0.13);
    g.save(); g.translate(t.x, t.y); g.rotate(S.rang); g.globalCompositeOperation = 'lighter';
    var halo = g.createRadialGradient(0, 4, 0, 0, 4, w * 4.5);
    halo.addColorStop(0, tier.b); halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.18 + T * 0.3; g.fillStyle = halo; g.beginPath(); g.arc(0, 4, w * 4.5, 0, TAU); g.fill();
    var og = g.createLinearGradient(0, 0, 0, len * 1.25);
    og.addColorStop(0, tier.b); og.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55; g.fillStyle = og; flamePath(g, len * 1.25, w * 1.35); g.fill();
    var mg = g.createLinearGradient(0, 0, 0, len);
    mg.addColorStop(0, tier.a); mg.addColorStop(0.55, tier.b); mg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.9; g.fillStyle = mg; flamePath(g, len, w); g.fill();
    var cg = g.createLinearGradient(0, 0, 0, len * 0.6);
    cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.95; g.fillStyle = cg; flamePath(g, len * 0.6, w * 0.45); g.fill();
    g.restore();
  }

  function drawParticles(g) {
    var tier = TIERS[S.tier], i, p, k;
    for (i = 0; i < S.particles.length; i++) {
      p = S.particles[i]; k = p.life / p.max;
      if (p.type === 0) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - k) * 0.85;
        g.fillStyle = k < 0.35 ? tier.a : tier.b;
        g.beginPath(); g.arc(p.x, p.y, p.size * (1 - k * 0.6), 0, TAU); g.fill();
      } else if (p.type === 1) {
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = (1 - k) * 0.22;
        g.fillStyle = '#8a97b3';
        g.beginPath(); g.arc(p.x, p.y, p.size * (0.6 + k * 1.4), 0, TAU); g.fill();
      } else {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k;
        g.strokeStyle = '#ffd98a'; g.lineWidth = p.size;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); g.stroke();
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  function drawHaze(f) {
    var env = 1 - clamp(Math.abs(S.pos - P(235)) / P(60), 0, 1);
    if (env <= 0.02) return;
    for (var i = 0; i < S.haze.length; i++) {
      var h = S.haze[i], y = yOf(h.h, h.par);
      if (y < -60 || y > S.H + 60) continue;
      var x = (((h.x * (S.W + 300) + S.t * h.sp) % (S.W + 300)) + S.W + 300) % (S.W + 300) - 150;
      f.globalAlpha = 0.3 * env * (0.7 + 0.3 * Math.sin(S.t + h.ph));
      f.drawImage(S.dust, x - h.w / 2, y - h.w * 0.1, h.w, h.w * 0.2);
    }
    f.globalAlpha = 1;
  }

  function drawGlints(f) {
    var env = 1 - clamp(Math.abs(S.pos - P(342)) / P(55), 0, 1);
    if (env <= 0.02) return;
    f.strokeStyle = '#dff7ff'; f.fillStyle = '#ffffff';
    for (var i = 0; i < S.glints.length; i++) {
      var q = S.glints[i], y = yOf(q.h, q.par);
      if (y < -10 || y > S.H + 10) continue;
      var a = Math.max(0, Math.sin(S.t * q.tw + q.ph)) * env, x = q.x * S.W, s = q.s * (0.6 + a);
      if (a < 0.05) continue;
      f.globalAlpha = a; f.lineWidth = 1;
      f.beginPath(); f.moveTo(x - s, y); f.lineTo(x + s, y); f.moveTo(x, y - s); f.lineTo(x, y + s); f.stroke();
      f.beginPath(); f.arc(x, y, 1.1, 0, TAU); f.fill();
    }
    f.globalAlpha = 1;
  }

  function drawNearNebula(f) {
    var env = smooth((S.pos - P(380)) / P(40));
    if (env <= 0.01) return;
    f.globalCompositeOperation = 'lighter';
    for (var i = 0; i < S.nebNear.length; i++) {
      var n = S.nebNear[i], y = yOf(n.h, n.par), d = n.rad * 2;
      if (y < -d || y > S.H + d) continue;
      f.globalAlpha = n.a * env * 0.7;
      f.drawImage(S.blobs[n.c], n.x * S.W - n.rad, y - n.rad, d, d);
    }
    f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
  }

  function drawStreaks(f) {
    if (!S.streaks.length) return;
    f.strokeStyle = '#dff4ff'; f.lineWidth = 1;
    for (var i = 0; i < S.streaks.length; i++) {
      var s = S.streaks[i], len = s.len + clamp(S.vel * 0.12, 0, 80);
      f.globalAlpha = s.a; f.beginPath(); f.moveTo(s.x, s.y - len); f.lineTo(s.x, s.y); f.stroke();
    }
    f.globalAlpha = 1;
  }

  function drawRings(f) {
    for (var i = 0; i < S.rings.length; i++) {
      var r = S.rings[i];
      f.globalAlpha = 1 - clamp(r.life / r.dur, 0, 1); f.strokeStyle = r.color; f.lineWidth = r.w;
      f.beginPath(); f.arc(r.x, r.y, r.r, 0, TAU); f.stroke();
    }
    f.globalAlpha = 1;
  }

  function draw() {
    var g = S.gB, f = S.gF, W = S.W, H = S.H, dpr = S.dpr, i;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, W, H);
    var sx = 0, sy = 0;
    if (S.shake > 0 && !S.reduce) { sx = (Math.random() * 2 - 1) * S.shake * 5; sy = (Math.random() * 2 - 1) * S.shake * 5; }
    g.save(); g.translate(sx, sy); f.save(); f.translate(sx, sy);

    drawBackground(g); drawStars(g); drawNebula(g);
    drawPlanets(g); drawBlackHole(g); drawEarth(g);
    for (i = 0; i < S.sats.length; i++) drawSat(g, S.sats[i], i);
    drawRocks(g, false); drawComet(g);
    drawFlame(g); drawParticles(g);

    drawRocks(f, true); drawHaze(f); drawGlints(f); drawNearNebula(f); drawStreaks(f); drawRings(f);
    if (S.flash > 0.01) { f.fillStyle = 'rgba(' + S.flashCol + ',' + (S.flash * 0.55).toFixed(3) + ')'; f.fillRect(-10, -10, W + 20, H + 20); }

    g.restore(); f.restore();
    placeRocket(sx, sy);
    hud();
  }

  function placeRocket(sx, sy) {
    var sf = clamp(S.vel / 1400, 0, 0.07);
    var sq = !S.ignited && S.burning ? 0.97 : 1;
    var rc = S.roll ? Math.cos(S.roll) : 1;
    if (S.roll && Math.abs(rc) < 0.18) rc = rc < 0 ? -0.18 : 0.18;
    S.rocket.style.transform = 'translate3d(' + Math.round(S.rx - S.rw / 2 + sx) + 'px,' + Math.round(S.ry - S.rh / 2 + sy) + 'px,0) rotate(' + S.rang.toFixed(4) + 'rad) scale(' + (rc * (1 - sf * 0.4)).toFixed(3) + ',' + ((1 + sf) * sq).toFixed(3) + ')';
  }

  function hud() {
    var km = Math.round(clamp(S.pos, 0, Math.max(S.target, 0)) / PX_PER_KM);
    if (S.altEl && km !== S.lastKm) { S.lastKm = km; S.altEl.textContent = km.toLocaleString('es-CO'); }
    var v = (Math.max(0, S.vel) * 0.02).toFixed(1);
    if (v !== S.lastVel) { S.lastVel = v; S.hudV.textContent = v; }
    S.hudT.style.width = Math.round(clamp(S.thrust, 0, 1) * 100) + '%';
    S.stage.classList.toggle('flying', S.vel > 40);
  }

  function loop(ts) {
    if (!S.running) return;
    var dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 0.016;
    S.last = ts;
    if (S.W) { step(dt); draw(); }
    S.raf = requestAnimationFrame(loop);
  }

  global.Flight = { init: init, reset: reset, start: start, stop: stop, launch: launch, fail: fail, _S: S };
})(window);

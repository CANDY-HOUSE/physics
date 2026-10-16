/* 3.9 互動圖：地面基準，Q 以 u 等速前進，在時刻 t0 送出一圈消息（正圓）。
   箭頭畫在電場線與 t0 消息前緣的交點上，長度與電場強度成正比；
   另以等時間間隔畫出其他時刻送出的消息前緣。 */
(function () {
  var svg = document.getElementById('qj');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qj-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, SMAX = 700, NL = 24, QR = 9, DI = 60, KBASE = 60 * 100 * 100;
  var TEAL = '#5CD0B3', GOLD = '#F0AC5F';
  var B = 0.7, s = 0, spd = 0.5, mult = 1, flines = true, ring = true, irings = true;

  var gI = $('irings'), gF = $('lines'), gR = $('ring'), gA = $('arrows');
  var iring = [], lines = [], arrows = [];
  for (var i = 0; i < 30; i++) iring.push(el('circle', { fill: 'none', stroke: GOLD, 'stroke-opacity': .32, 'stroke-dasharray': '4 5', 'stroke-width': 1 }, gI));
  for (i = 0; i < NL; i++) {
    lines.push(el('line', { stroke: TEAL, 'stroke-opacity': .3, 'stroke-width': 1.2 }, gF));
    var g = el('g', {}, gA);
    arrows.push({ g: g,
      shaft: el('line', { stroke: TEAL, 'stroke-width': 2.2 }, g),
      head: el('path', { fill: TEAL }, g),
      cut1: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g),
      cut2: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g) });
  }
  var t0ring = el('circle', { cx: XE, cy: Y, fill: 'none', stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gR);
  var q = $('q'), ua = $('u'), ul = $('ulab');

  function emag(vx, vy) { var d2 = vx * vx + vy * vy, s2 = vy * vy / d2; return (1 - B * B) / Math.pow(1 - B * B * s2, 1.5) / d2; }
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.setAttribute('visibility', 'visible'); }
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }

  // 箭頭尖端在 (px,py)、方向 (ux,uy)、長度 L；超出可用長度 avail 時截短並加斷號
  function vec(A, px, py, ux, uy, L, avail) {
    show(A.g);
    if (L < 2) { hide(A.shaft); hide(A.cut1); hide(A.cut2); A.head.setAttribute('d', 'M' + f(px - 1.6) + ',' + f(py) + 'a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0'); return; }
    var cut = L > avail, Ld = cut ? Math.max(avail, 4) : L, h = Math.min(8, 0.45 * Ld), a = Math.atan2(uy, ux);
    show(A.shaft); seg(A.shaft, px - Ld * ux, py - Ld * uy, px - 0.6 * h * ux, py - 0.6 * h * uy);
    A.head.setAttribute('d', 'M' + f(px) + ',' + f(py) + 'L' + f(px - h * Math.cos(a - 0.42)) + ',' + f(py - h * Math.sin(a - 0.42)) + 'L' + f(px - h * Math.cos(a + 0.42)) + ',' + f(py - h * Math.sin(a + 0.42)) + 'Z');
    if (cut && Ld > 14) {
      var mx = px - 0.55 * Ld * ux, my = py - 0.55 * Ld * uy, nx = -uy, ny = ux, cs = [A.cut1, A.cut2], o = [-2.5, 2.5];
      for (var j = 0; j < 2; j++) { show(cs[j]); seg(cs[j], mx + o[j] * ux + 5 * nx + 2 * ux, my + o[j] * uy + 5 * ny + 2 * uy, mx + o[j] * ux - 5 * nx - 2 * ux, my + o[j] * uy - 5 * ny - 2 * uy); }
    } else { hide(A.cut1); hide(A.cut2); }
  }

  function render() {
    var gm = 1 / Math.sqrt(1 - B * B), xq = XE + B * s, K = KBASE * mult, ang = [], i;
    for (i = 0; i < NL; i++) { var th = (i + 0.5) * 2 * Math.PI / NL; ang.push(Math.atan2(Math.sin(th), Math.cos(th) / gm)); }
    gF.setAttribute('visibility', flines ? 'visible' : 'hidden');
    for (i = 0; i < NL; i++) seg(lines[i], xq + 10 * Math.cos(ang[i]), Y - 10 * Math.sin(ang[i]), xq + 1200 * Math.cos(ang[i]), Y - 1200 * Math.sin(ang[i]));
    var n = 0;
    if (irings) {
      var kmax = Math.floor(s / DI);
      for (var k = -12; k <= kmax && n < iring.length; k++) {
        if (k === 0) continue;
        var r = s - k * DI; if (r <= 0) continue;
        var c = iring[n++]; show(c); c.setAttribute('cx', f(XE + B * k * DI)); c.setAttribute('cy', Y); c.setAttribute('r', f(r));
      }
    }
    for (; n < iring.length; n++) hide(iring[n]);
    if (ring && s > 0) { show(t0ring); t0ring.setAttribute('r', f(s)); } else hide(t0ring);
    for (i = 0; i < NL; i++) {
      var a = ang[i], ux = Math.cos(a), uy = -Math.sin(a), d = s * (-B * Math.cos(a) + Math.sqrt(1 - B * B * Math.sin(a) * Math.sin(a)));
      var px = xq + d * ux, py = Y + d * uy;
      if (s <= 0 || px < -10 || px > W + 10 || py < -10 || py > H + 10 || d < 1e-6) { hide(arrows[i].g); continue; }
      vec(arrows[i], px, py, ux, uy, K * emag(d * ux, d * uy), d - QR - 3);
    }
    q.setAttribute('cx', f(xq));
    var L = 10 + 60 * B;
    if (B > 0) { show(ua); seg(ua, xq + 12, Y, xq + 12 + L - 5, Y); show(ul); ul.setAttribute('x', f(xq + 12 + L / 2 - 20)); }
    else { hide(ua); hide(ul); }
    $('out').textContent = '半徑 ' + Math.round(s);
    $('t').value = Math.round(s / SMAX * 1000);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, visible = true, last = 0;
  var bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-pressed', p ? 'true' : 'false'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * SMAX; render(); });
  $('b').addEventListener('input', function (e) { B = +e.target.value; $('bo').textContent = B.toFixed(1) + ' c'; render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('k').addEventListener('input', function (e) { mult = Math.pow(10, +e.target.value); $('ko').textContent = '×' + Math.round(mult); render(); });
  $('cf').addEventListener('change', function (e) { flines = e.target.checked; render(); });
  $('cr').addEventListener('change', function (e) { ring = e.target.checked; render(); });
  $('ci').addEventListener('change', function (e) { irings = e.target.checked; render(); });
  function loop(ts) {
    if (play && visible && ts - last > 33) { last = ts; s += 2 * spd; if (s > SMAX) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 120;
  setPlay(play);
  render();
  requestAnimationFrame(loop);
  window.qj = { at: function (v) { setPlay(false); s = v; render(); }, play: function () { setPlay(true); } };
})();

/* 3.9 動畫：平面上相鄰的五顆 Q（Q左2、Q左、Q、Q右、Q右2），在 t0、t1、t2 各送出一則消息；
   每顆 Q 的點在它送出時的位置正上方，跟著各自的前緣往上。上：等速；下：加速（先移 30、再移 50）。
   相鄰兩顆 Q 的間距取 Q(t0) 到 Q(t1) 的距離，所以等速時後一顆的點正好落在前一顆的點正下方。
   紅線：通過 Q 的 P1，連到「右邊第 m 顆的 P0」與「左邊第 m 顆的 P2」。m = 2 那條與 P0P1P2 左右對稱（預設顯示），
   m = 1、−1、−2，以及沿 t1 前緣、從 P1 水平連到左右的線，是其他紅線（預設隱藏）。等速時紅線都是直的；加速時在 P1 轉彎。 */
(function () {
  var svg = document.getElementById('rd');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.rd-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.removeAttribute('visibility'); }
  function place(e, x, y, anchor) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f(anchor === 'end' ? x - w : anchor === 'center' ? x - w / 2 : x)); e.setAttribute('y', f(y - h / 2)); show(e); }

  var C = ['#F0AC5F', '#58C4DD', '#B189F5'], RED = '#FC6255', TEAL = '#5CD0B3';
  var TE = [20, 110, 200], TEND = 260, SMAX = 310;          // c = 1 px／單位時間；相鄰兩次送出相隔 90
  var V0 = 20 / 90, A = 20 / 8100, X2 = 260 + V0 * 180 + 0.5 * A * 180 * 180, V2 = V0 + A * 180;
  var P = [
    { top: 0, D: 50, x: function (t) { return 260 + 50 / 90 * (t - 20); } },
    { top: 370, D: 30, x: function (t) { var s = t - 20; if (s < 0) return 260 + V0 * s; if (s <= 180) return 260 + V0 * s + 0.5 * A * s * s; return X2 + V2 * (s - 180); } }
  ];
  var OFF = [-2, -1, 0, 1, 2], s = 0, spd = 0.5;

  function panel(k) {
    var m = P[k], g = $('g' + k), top = m.top, Y = top + 300, t = Math.min(s, TEND);
    clear(g);
    el('line', { x1: 20, y1: Y, x2: 660, y2: Y, stroke: 'currentColor', 'stroke-opacity': .55, 'stroke-width': 2 }, g);
    var pt = {};                                     // pt[q][j] = [x, y]
    for (var j = 0; j < 3; j++) {
      var on = t >= TE[j], h = Y - (t - TE[j]), lf = $('f' + k + j);
      if (!on) { hide(lf); continue; }
      el('line', { x1: 20, y1: h, x2: 660, y2: h, stroke: C[j], 'stroke-opacity': .5, 'stroke-dasharray': '5 4' }, g);
      place(lf, 656, h - 12, 'end');
      OFF.forEach(function (q) { var x = m.x(TE[j]) + q * m.D; (pt[q] = pt[q] || [])[j] = [x, h];
        el('line', { x1: f(x), y1: Y, x2: f(x), y2: f(h), stroke: C[j], 'stroke-opacity': .4, 'stroke-width': 1.2 }, g);
        el('circle', { cx: f(x), cy: Y, r: 4, fill: 'none', stroke: C[j], 'stroke-width': 1.6 }, g); });
    }
    var all = t >= TE[2], p1 = all ? pt[0][1] : null;
    if (all) [[2, $('cr').checked], [1, $('co').checked], [-1, $('co').checked], [-2, $('co').checked]].forEach(function (r) {
      if (!r[1]) return;
      var a = pt[r[0]][0], b = pt[-r[0]][2];
      el('path', { d: 'M' + f(a[0]) + ',' + f(a[1]) + ' L' + f(p1[0]) + ',' + f(p1[1]) + ' L' + f(b[0]) + ',' + f(b[1]), fill: 'none', stroke: RED, 'stroke-width': r[0] === 2 ? 2.4 : 1.6, 'stroke-opacity': r[0] === 2 ? .95 : .7, 'stroke-linejoin': 'round' }, g);
    });
    if (all && $('co').checked) {                    // 水平的紅線：沿 t1 的前緣，從 P1 連到左右的點
      var l = pt[-2][1], r = pt[2][1];
      el('line', { x1: f(l[0]), y1: f(l[1]), x2: f(r[0]), y2: f(r[1]), stroke: RED, 'stroke-width': 1.6, 'stroke-opacity': .7 }, g);
    }
    OFF.forEach(function (q) {
      var ps = (pt[q] || []).filter(Boolean);
      if (ps.length > 1) el('path', { d: ps.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ',' + f(p[1]); }).join(''), fill: 'none', stroke: TEAL, 'stroke-width': q ? 1.8 : 3, 'stroke-opacity': q ? .7 : 1, 'stroke-linejoin': 'round' }, g);
      (pt[q] || []).forEach(function (p, j) { if (p) el('circle', { cx: f(p[0]), cy: f(p[1]), r: q ? 4 : 5.5, fill: C[j] }, g); });
      var xn = m.x(t) + q * m.D; el('circle', { cx: f(xn), cy: Y, r: 6, fill: RED }, g);
      place($('q' + k + (q + 2)), xn, Y + ((q + 2) % 2 ? 38 : 20), 'center');
    });
    for (j = 0; j < 3; j++) { var lp = $('p' + k + j); if (pt[0] && pt[0][j]) place(lp, pt[0][j][0] - 8, pt[0][j][1] - 13, 'end'); else hide(lp); }
  }
  function render() { panel(0); panel(1); if (window.rcAnim) window.rcAnim.render(s / SMAX); }   // 共用播放器：上方 rc 的動畫用同一個進度

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, last = 0, bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * SMAX; render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  ['cr', 'co'].forEach(function (k) { $(k).addEventListener('change', render); });
  function loop(ts) {
    if (play && vis && ts - last > 33) { last = ts; s += 2 * spd; if (s > SMAX) s = 0; render(); $('t').value = Math.round(s / SMAX * 1000); }
    requestAnimationFrame(loop);
  }
  if (!play) s = TEND;
  setPlay(play);
  render();
  requestAnimationFrame(loop);
})();

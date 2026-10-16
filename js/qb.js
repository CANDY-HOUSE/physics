/* 3.9 動畫：靜止的 Q 在時刻 0 憑空出現；它的電場以 c 從 Q 往外建立。
   半徑 c t 以內是 Q 的 Coulomb 電場（電場線），以外還沒有 Q 的電場。 */
(function () {
  var svg = document.getElementById('qb');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return svg.querySelector('#qb' + k); }
  function f(n) { return n.toFixed(1); }

  var CX = 320, CY = 210, RMAX = 330, NL = 16;
  var T0 = 0.6, TG = 6.0, TH = 1.6, T = T0 + TG + TH;   // 空白 → 建立 → 停留
  var linesG = $('lines'), front = $('front'), q = $('q'), lab = $('lab'), none = $('none');
  var lines = [];
  for (var i = 0; i < NL; i++) {
    var a = (i + 0.5) * 2 * Math.PI / NL, l = document.createElementNS(NS, 'line');
    l.setAttribute('stroke', '#5CD0B3'); l.setAttribute('stroke-width', '1.8');
    linesG.appendChild(l);
    lines.push({ c: Math.cos(a), s: Math.sin(a), el: l });
  }
  var NX = 548, NY = 352;                                  // 「還沒有 Q 的電場」的位置
  var ND = Math.hypot(NX - CX, NY - CY) - 30;

  function render(t) {
    var s = t % T, born = s >= T0, r = born ? Math.min(RMAX, (s - T0) / TG * RMAX) : 0;
    q.setAttribute('opacity', born ? 1 : 0);
    front.setAttribute('r', f(r)); front.setAttribute('opacity', born && r > 1 ? 1 : 0);
    lines.forEach(function (L) {
      var r1 = 13, r2 = Math.max(r1, r);
      L.el.setAttribute('x1', f(CX + r1 * L.c)); L.el.setAttribute('y1', f(CY - r1 * L.s));
      L.el.setAttribute('x2', f(CX + r2 * L.c)); L.el.setAttribute('y2', f(CY - r2 * L.s));
      L.el.setAttribute('opacity', r > r1 ? 1 : 0);
    });
    var la = -38 * Math.PI / 180;
    lab.setAttribute('x', f(CX + r * Math.cos(la) + 8)); lab.setAttribute('y', f(CY - r * Math.sin(la) - 12));
    lab.setAttribute('opacity', born && r > 40 && r < 250 ? 1 : 0);
    none.setAttribute('opacity', r < ND ? 1 : 0);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, t0 = null, tFix = null;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function loop(now) {
    if (t0 === null) t0 = now;
    if (tFix !== null) render(tFix);
    else if (visible && !reduce) render((now - t0) / 1000);
    requestAnimationFrame(loop);
  }
  render(T0 + TG * 0.45);
  requestAnimationFrame(loop);
  window.qb = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; } };
})();

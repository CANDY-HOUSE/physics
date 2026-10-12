/* 3.7 動畫：線圈固定在地面；電場跟著 Q 往右移。⊙ 代表 地B（大小代表強弱），整片跟著 Q 一起移動。
   線圈裡的 ⊙ 亮、外面的暗；剛滑進線圈的 ⊙ 閃金色，剛滑出線圈的 ⊙ 閃白色。 */
(function () {
  var svg = document.getElementById('fda');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return svg.querySelector('#fda' + k); }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var G = 1.6, CX = 200, CY = 352, R1 = 120, R2 = 300, T1 = 30 * Math.PI / 180, T2 = 80 * Math.PI / 180;
  var T = 8, X0 = CX - 120, X1 = CX + 120;           // Q 每秒走 30
  var FL = 21;                                         // 閃色的時間：⊙ 越過線圈的邊之後再走 FL（0.7 秒）
  var BLUE = '#58C4DD', GOLD = '#F0AC5F', GREY = '#E0E0E0', TEAL = '#5CD0B3';

  // 線圈：地面上壓扁的扇形（沿運動方向拉長 γ 倍就是以 Q 的起點為圓心的扇形）
  function inLoop(x, y) {
    var X = (x - CX) * G, Y = CY - y, r = Math.sqrt(X * X + Y * Y), t = Math.atan2(Y, X);
    return r > R1 && r < R2 && t > T1 && t < T2;
  }
  // 地B ∝ u·地E⊥：壓扁電場的垂直分量（3.1），dx、dy 是相對 Q 的位置
  function bmag(dx, dy) { return G * dy / Math.pow(G * G * dx * dx + dy * dy, 1.5); }
  var BREF = bmag(0, 140);

  var dots = [], dotsG = $('dots');
  for (var dx = -480; dx <= 600; dx += 30) {
    for (var dy = 26; dy <= 306; dy += 28) {
      var k = Math.min(1, bmag(dx, dy) / BREF), r = 2 + 6 * k;
      var g = mk('g', {}, dotsG);
      dots.push({ dx: dx, dy: dy, g: g, cls: null,
        ring: mk('circle', { r: f(r), fill: 'none', 'stroke-width': '1.4' }, g),
        dot: mk('circle', { r: f(Math.max(1, r * 0.32)) }, g) });
    }
  }
  var rays = [], raysG = $('rays');
  for (var j = 0; j <= 8; j++) {
    var t0 = j * 22.5 * Math.PI / 180, th = Math.atan2(Math.sin(t0), Math.cos(t0) / G);   // 壓扁電場的電場線方向
    rays.push({ c: Math.cos(th), s: Math.sin(th), el: mk('line', { stroke: TEAL, 'stroke-opacity': '.22', 'stroke-width': '1.1' }, raysG) });
  }
  var mov = $('mov'), qg = $('q'), qc = $('qc'), qt = $('qt'), uu = $('u'), Lu = $('Lu');
  var STYLE = { far: [BLUE, '.28'], in: [BLUE, '1'], enter: [GOLD, '1'], out: [GREY, '1'] };

  function render(t) {
    var s = (t % T) / T, xq = X0 + (X1 - X0) * s;
    var op = f(Math.min(1, s / 0.06, (1 - s) / 0.06));
    mov.setAttribute('opacity', op); qg.setAttribute('opacity', op);
    dots.forEach(function (d) {
      var x = xq + d.dx, y = CY - d.dy;
      if (x < -12 || x > 652) { d.g.setAttribute('display', 'none'); return; }
      d.g.removeAttribute('display');
      d.g.setAttribute('transform', 'translate(' + f(x) + ',' + f(y) + ')');
      // 0.7 秒前這顆 ⊙ 在 x − FL：那時在外面、現在在裡面 → 剛滑進；反過來 → 剛滑出
      var now = inLoop(x, y), before = inLoop(x - FL, y);
      var cls = now ? (before ? 'in' : 'enter') : (before ? 'out' : 'far');
      if (cls !== d.cls) {
        var st = STYLE[cls];
        d.ring.setAttribute('stroke', st[0]); d.ring.setAttribute('stroke-opacity', st[1]);
        d.dot.setAttribute('fill', st[0]); d.dot.setAttribute('fill-opacity', st[1]);
        d.cls = cls;
      }
    });
    rays.forEach(function (ry) {
      ry.el.setAttribute('x1', f(xq + 14 * ry.c)); ry.el.setAttribute('y1', f(CY - 14 * ry.s));
      ry.el.setAttribute('x2', f(xq + 460 * ry.c)); ry.el.setAttribute('y2', f(CY - 460 * ry.s));
    });
    qc.setAttribute('cx', f(xq)); qt.setAttribute('x', f(xq));
    uu.setAttribute('x1', f(xq + 12)); uu.setAttribute('x2', f(xq + 70));
    Lu.setAttribute('x', f(xq + 44 - 22));
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
  render(T / 2);
  requestAnimationFrame(loop);
  window.fda = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; } };
})();

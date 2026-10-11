/* 3.6 Biot-Savart 的 r² 立體圖：一小段電流朝上；在 r、2r、3r 處各放一扇和磁力線垂直的窗，邊長和距離成正比，
   每一扇都有同樣 9 條磁力線穿過（磁場 ∝ sinθ / r²，窗的面積 ∝ r²）。 */
(function () {
  var svg = document.getElementById('bsr');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return svg.querySelector('#bsr' + k); }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }

  var F = 900, D = 7.0, CX = 316, CY = 112, C = [1.8, 0, 0];
  var R0 = 1.0, S = 0.36, L = 0.62;                 // 窗的距離 k·R0、邊長 k·S；每條磁力線畫出的弧長 L
  var BLUE = '#58C4DD', GOLD = '#F0AC5F';
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function unit(a) { var l = Math.sqrt(dot(a, a)); return mul(a, 1 / l); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function f(n) { return n.toFixed(1); }

  var d, R, U;                                      // 右手系鏡頭：R × U = d（指向觀者）
  function camera(az, el) { d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]; R = unit(cross([0, 1, 0], d)); U = cross(d, R); }
  function P(p) { var q = sub(p, C), s = F / (D - dot(d, q)); return [CX + s * dot(R, q), CY - s * dot(U, q)]; }
  function setLine(el, a, b) { var s = P(a), e = P(b); el.setAttribute('x1', f(s[0])); el.setAttribute('y1', f(s[1])); el.setAttribute('x2', f(e[0])); el.setAttribute('y2', f(e[1])); }
  function label(el, p, dx, dy) { var s = P(p), w = +el.getAttribute('width'), h = +el.getAttribute('height'); el.setAttribute('x', f(s[0] + (dx || 0) - w / 2)); el.setAttribute('y', f(s[1] + (dy || 0) - h / 2)); }
  function txt(el, p, dx, dy) { var s = P(p); el.setAttribute('x', f(s[0] + dx)); el.setAttribute('y', f(s[1] + dy)); }

  var backG = $('back'), winG = $('win'), frontG = $('front');
  var wins = [1, 2, 3].map(function (k) {
    var w = { k: k, face: mk('polygon', { fill: GOLD, 'fill-opacity': '.1', stroke: GOLD, 'stroke-width': '1.6' }, winG), grid: [], lines: [] };
    for (var i = 1; i < k; i++) w.grid.push(mk('line', { stroke: GOLD, 'stroke-opacity': '.7', 'stroke-width': '1' }, winG), mk('line', { stroke: GOLD, 'stroke-opacity': '.7', 'stroke-width': '1' }, winG));
    [-1, 0, 1].forEach(function (a) {
      [-1, 0, 1].forEach(function (b) {
        w.lines.push({ a: a, b: b,
          back: mk('path', { fill: 'none', stroke: BLUE, 'stroke-width': '1.6', 'stroke-opacity': '.55' }, backG),
          front: mk('path', { fill: 'none', stroke: BLUE, 'stroke-width': '1.8', 'stroke-dasharray': '6 4' }, frontG),
          head: mk('polygon', { fill: BLUE, 'fill-opacity': '.6' }, backG),
          dot: mk('circle', { r: '2.6', fill: BLUE }, frontG) });
      });
    });
    return w;
  });
  var ray = $('ray'), el = $('el'), ang = $('ang'), LI = $('LI'), Lth = $('Lth'), LB = $('LB');
  var Lk = [1, 2, 3].map(function (k) { return { cells: $('c' + k), per: $('p' + k), dist: $('d' + k) }; });

  function arc(rho, y, p0, p1, n) {               // 半徑 rho、高度 y 的水平圓上，從角度 p0 到 p1
    var out = [];
    for (var i = 0; i <= n; i++) { var p = p0 + (p1 - p0) * i / n; out.push([rho * Math.cos(p), y, rho * Math.sin(p)]); }
    return out;
  }
  function pathOf(pts) { return pts.map(function (p, i) { var s = P(p); return (i ? 'L' : 'M') + f(s[0]) + ',' + f(s[1]); }).join(''); }

  function render(t) {
    camera((26 + 6 * Math.sin(2 * Math.PI * t / 20)) * Math.PI / 180, (14 + 3 * Math.sin(2 * Math.PI * t / 20 + 1.2)) * Math.PI / 180);
    setLine(ray, [0, 0, 0], [3.75, 0, 0]);
    setLine(el, [0, -0.32, 0], [0, 0.36, 0]);
    var a0 = P([0.13, 0, 0]), a1 = P([0.13, 0.13, 0]), a2 = P([0, 0.13, 0]);
    ang.setAttribute('d', 'M' + f(a0[0]) + ',' + f(a0[1]) + 'L' + f(a1[0]) + ',' + f(a1[1]) + 'L' + f(a2[0]) + ',' + f(a2[1]));
    label(LI, [0, 0.36, 0], 0, -18);
    label(Lth, [0.2, 0.2, 0], 10, -4);

    wins.forEach(function (w) {
      var k = w.k, cx = k * R0, h = k * S / 2;
      var corners = [[cx - h, -h, 0], [cx + h, -h, 0], [cx + h, h, 0], [cx - h, h, 0]];
      w.face.setAttribute('points', corners.map(function (p) { var s = P(p); return f(s[0]) + ',' + f(s[1]); }).join(' '));
      for (var i = 1; i < k; i++) {
        var u = -h + 2 * h * i / k;
        setLine(w.grid[2 * (i - 1)], [cx + u, -h, 0], [cx + u, h, 0]);
        setLine(w.grid[2 * (i - 1) + 1], [cx - h, u, 0], [cx + h, u, 0]);
      }
      // 磁力線：繞著電流的水平圓；在窗上（φ = 0）垂直穿過，方向朝 −z（ŷ × x̂ = −ẑ）
      w.lines.forEach(function (ln) {
        var rho = cx + ln.a * 2 * h / 3, y = ln.b * 2 * h / 3, dp = L / 2 / rho;
        ln.front.setAttribute('d', pathOf(arc(rho, y, dp, 0, 10)));     // z > 0：在窗的前面（靠近觀者）
        ln.front.setAttribute('stroke-dashoffset', f(-t * 14));
        var bk = arc(rho, y, 0, -dp, 10);
        ln.back.setAttribute('d', pathOf(bk));
        var tip = P(bk[bk.length - 1]), pre = P(bk[bk.length - 3]);
        var vx = tip[0] - pre[0], vy = tip[1] - pre[1], Lp = Math.sqrt(vx * vx + vy * vy) || 1, ux = vx / Lp, uy = vy / Lp;
        ln.head.setAttribute('points', f(tip[0] + ux * 5) + ',' + f(tip[1] + uy * 5) + ' ' + f(tip[0] - ux * 3 - uy * 3.5) + ',' + f(tip[1] - uy * 3 + ux * 3.5) + ' ' + f(tip[0] - ux * 3 + uy * 3.5) + ',' + f(tip[1] - uy * 3 - ux * 3.5));
        var sp = P([rho, y, 0]); ln.dot.setAttribute('cx', f(sp[0])); ln.dot.setAttribute('cy', f(sp[1]));
      });
      txt(Lk[k - 1].cells, [cx, h, 0], 0, -10);
      txt(Lk[k - 1].per, [cx, -h, 0], 0, 44);
      label(Lk[k - 1].dist, [cx, -h, 0], 0, 18);
    });
    label(LB, [3 * R0 + 3 * S / 2 * 2 / 3, 3 * S / 3, L / 2 / (3 * R0)], 24, -8);
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
  render(2);
  requestAnimationFrame(loop);
  window.bsr = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; } };
})();

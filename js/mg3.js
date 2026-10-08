/* 3.6 磁力線的立體圖：SVG 透視投影。電荷 Q 沿軸等速前進，磁力線是一圈圈繞軸的圓，跟著 Q 走。 */
(function () {
  var svg = document.getElementById('mg3');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return svg.querySelector('#' + id); }

  // ---- 場景（世界座標，右手系；y 向上，軸沿 +x，Q 向 +x 前進）----
  var G = 1.6;                                 // 壓扁電場的 γ
  var W = 640, F = 820, D = 7.2, CX = 320, CY = 200;
  var DXS = [-1.0, -0.5, 0, 0.5, 1.0], RS = [1.0];
  var EXTRA = [[0, 0.5]];                     // Q 正旁邊再多一圈小的
  var BLUE = '#58C4DD', TEAL = '#5CD0B3';

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function unit(a) { var l = Math.sqrt(dot(a, a)); return mul(a, 1 / l); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // 鏡頭：d 指向觀者；右 R、上 U、d 構成右手系（R × U = d），畫出來不會鏡像
  var d, R, U;
  function camera(az, el) {
    d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    R = unit(cross([0, 1, 0], d)); U = cross(d, R);
  }
  function P(p) { var s = F / (D - dot(d, p)); return [CX + s * dot(R, p), CY - s * dot(U, p)]; }
  function f(n) { return n.toFixed(1); }
  function pathOf(pts) { return pts.map(function (p, i) { var s = P(p); return (i ? 'L' : 'M') + f(s[0]) + ',' + f(s[1]); }).join(''); }
  function setLine(el, a, b) { var s = P(a), e = P(b); el.setAttribute('x1', f(s[0])); el.setAttribute('y1', f(s[1])); el.setAttribute('x2', f(e[0])); el.setAttribute('y2', f(e[1])); }
  function label(el, p, dx, dy) {
    var s = P(p), w = +el.getAttribute('width'), h = +el.getAttribute('height');
    el.setAttribute('x', f(s[0] + (dx || 0) - w / 2)); el.setAttribute('y', f(s[1] + (dy || 0) - h / 2));
  }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  }

  // 每一圈的磁場大小：B ∝ u·E⊥ ∝ γ·r⊥ / ((γ·Δx)² + r⊥²)^{3/2}（3.1 的壓扁電場）
  function bmag(dx, r) { return G * r / Math.pow(G * G * dx * dx + r * r, 1.5); }
  var BMAX = bmag(0, 0.5);

  var back = $('mg3back'), front = $('mg3front'), rays = $('mg3rays'), arrs = $('mg3arr');
  var rings = [];
  var pairs = [];
  DXS.forEach(function (dx) { RS.forEach(function (r) { pairs.push([dx, r]); }); });
  pairs = pairs.concat(EXTRA);
  pairs.forEach(function (pr) {
    var dx = pr[0], r = pr[1];
    {
      var k = Math.pow(bmag(dx, r) / BMAX, 0.6);
      var op = 0.34 + 0.62 * k, wd = 1.1 + 1.7 * k;
      var common = { fill: 'none', stroke: BLUE, 'stroke-width': f(wd), 'stroke-linecap': 'round' };
      var b = mk('path', Object.assign({ 'stroke-opacity': f(op * 0.45) }, common), back);
      var fr = mk('path', Object.assign({ 'stroke-opacity': f(op) }, common), front);
      var heads = [0, 1, 2].map(function () { return mk('polygon', { fill: BLUE, 'fill-opacity': f(Math.min(1, op + 0.1)) }, arrs); });
      rings.push({ dx: dx, r: r, b: b, f: fr, heads: heads });
    }
  });
  // 壓扁電場的電場線：靜止時夾角 θ 的線，前進時 tan θ' = γ·tan θ
  var dirs = [[1, 0, 0], [-1, 0, 0]];
  [45, 90, 135].forEach(function (th) {
    var t = th * Math.PI / 180, tl = Math.atan2(G * Math.sin(t), Math.cos(t));
    for (var j = 0; j < 6; j++) {
      var ph = j * Math.PI / 3 + (th === 90 ? 0 : Math.PI / 6);
      dirs.push([Math.cos(tl), Math.sin(tl) * Math.cos(ph), Math.sin(tl) * Math.sin(ph)]);
    }
  });
  var rayEls = dirs.map(function () { return mk('line', { stroke: TEAL, 'stroke-opacity': '.32', 'stroke-width': '1.1' }, rays); });

  var ax = $('mg3ax'), mov = $('mg3mov'), qc = $('mg3qc'), qt = $('mg3qt'), uu = $('mg3u'), rr = $('mg3r');
  var LB = $('mg3LB'), LE = $('mg3LE'), Lu = $('mg3Lu'), Lr = $('mg3Lr'), Lax = $('mg3Lax');
  var vE = $('mg3E'), vEa = $('mg3Ea'), vEp = $('mg3Ep'), vB = $('mg3Bv'), dotP = $('mg3P'), g1 = $('mg3g1'), g2 = $('mg3g2');
  var LEa = $('mg3LEa'), LEp = $('mg3LEp');
  var T = 8, X0 = -1.25, X1 = 1.25;

  function render(t) {
    camera((26 + 7 * Math.sin(2 * Math.PI * t / 20)) * Math.PI / 180, (16 + 3 * Math.sin(2 * Math.PI * t / 20 + 1.3)) * Math.PI / 180);
    var s = (t % T) / T, xq = X0 + (X1 - X0) * s;
    mov.setAttribute('opacity', f(Math.min(1, s / 0.1, (1 - s) / 0.1)));
    var Q = [xq, 0, 0];

    setLine(ax, [-2.5, 0, 0], [2.5, 0, 0]);
    var sa = P([2.5, 0, 0]); Lax.setAttribute('x', f(Math.min(sa[0] + 6, 612))); Lax.setAttribute('y', f(sa[1] - 8));

    rings.forEach(function (g) {
      var cx = xq + g.dx, bk = '', fr = '', lastB = -2, lastF = -2, i, pts = [];
      for (i = 0; i <= 96; i++) { var ph = 2 * Math.PI * i / 96; pts.push([cx, g.r * Math.cos(ph), g.r * Math.sin(ph)]); }
      // 每一小段依中點在軸的前面或後面，分到前半圈或後半圈
      for (i = 0; i < 96; i++) {
        var a0 = pts[i], a1 = pts[i + 1], s0 = P(a0), s1 = P(a1);
        var isFront = dot(d, [0, a0[1] + a1[1], a0[2] + a1[2]]) >= 0;
        var seg = 'L' + f(s1[0]) + ',' + f(s1[1]);
        if (isFront) { fr += (lastF === i - 1 ? '' : 'M' + f(s0[0]) + ',' + f(s0[1])) + seg; lastF = i; }
        else { bk += (lastB === i - 1 ? '' : 'M' + f(s0[0]) + ',' + f(s0[1])) + seg; lastB = i; }
      }
      g.b.setAttribute('d', bk); g.f.setAttribute('d', fr);
      // 箭頭沿著 B 的方向（φ 增加的方向 = x̂ × r̂）繞圈前進
      g.heads.forEach(function (h, k) {
        var ph = 2 * Math.PI * (k / 3 + t / 6), c = Math.cos(ph), sn = Math.sin(ph);
        var p = [cx, g.r * c, g.r * sn], tg = [0, -sn, c];
        var tip = P(add(p, mul(tg, 0.07))), bas = P(add(p, mul(tg, -0.07)));
        var vx = tip[0] - bas[0], vy = tip[1] - bas[1], L = Math.sqrt(vx * vx + vy * vy) || 1;
        var nx = -vy / L * 4.2, ny = vx / L * 4.2;
        h.setAttribute('points', f(tip[0]) + ',' + f(tip[1]) + ' ' + f(bas[0] + nx) + ',' + f(bas[1] + ny) + ' ' + f(bas[0] - nx) + ',' + f(bas[1] - ny));
      });
    });

    dirs.forEach(function (v, i) { setLine(rayEls[i], add(Q, mul(v, 0.16)), add(Q, mul(v, 1.15))); });
    var sq = P(Q); qc.setAttribute('cx', f(sq[0])); qc.setAttribute('cy', f(sq[1])); qt.setAttribute('x', f(sq[0])); qt.setAttribute('y', f(sq[1] + 5));
    setLine(uu, add(Q, [0.17, 0, 0]), add(Q, [0.75, 0, 0]));
    var phr = -70 * Math.PI / 180, A0 = [xq + 1.0, 0, 0], pr = [xq + 1.0, Math.cos(phr), Math.sin(phr)];
    setLine(rr, A0, add(A0, mul(sub(pr, A0), 0.97)));
    // 場點 P：在 Q 前方 0.5、半徑 1 那一圈的最上面；P 的電場從 Q 此刻的位置斜斜向外
    var Pp = [xq + 0.5, 1.0, 0], eh = unit(sub(Pp, Q)), EL = 0.62;
    var Ea = [eh[0] * EL, 0, 0], Ep = [0, eh[1] * EL, 0], Et = add(Pp, mul(eh, EL));
    var bh = cross([1, 0, 0], unit([0, Pp[1], Pp[2]]));   // x̂ × r̂：沿著繞軸的圓
    setLine(vE, Pp, Et); setLine(vEa, Pp, add(Pp, Ea)); setLine(vEp, Pp, add(Pp, Ep));
    setLine(g1, add(Pp, Ea), Et); setLine(g2, add(Pp, Ep), Et);
    setLine(vB, Pp, add(Pp, mul(bh, 0.55)));
    var sP = P(Pp); dotP.setAttribute('cx', f(sP[0])); dotP.setAttribute('cy', f(sP[1]));
    label(LE, Et, 18, -10);
    label(LEa, add(Pp, Ea), 10, 16);
    label(LEp, add(Pp, mul(Ep, 0.55)), -26, 0);
    label(LB, add(Pp, mul(bh, 0.55)), -18, 10);
    label(Lu, add(Q, [0.62, 0, 0]), 0, 18);
    label(Lr, [xq + 1.0, 0.5 * Math.cos(phr), 0.5 * Math.sin(phr)], 14, 4);
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
  render(3.2);
  requestAnimationFrame(loop);
  window.mg3 = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; },
    // 檢查用：世界中 B 的方向（x̂ × r̂）投影到畫面上
    check: function () { camera(26 * Math.PI / 180, 16 * Math.PI / 180); var p = [0, 1, 0], b = cross([1, 0, 0], [0, 1, 0]); return { R: R, U: U, d: d, rxu: cross(R, U), B_at_top: b, screen: [P(p), P(add(p, mul(b, 0.2)))] }; } };
})();

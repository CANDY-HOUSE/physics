/* 3.11 圖：求 −Q₁ 的位置 x₁ 與電量。共用上面那組圖的 θ、x 滑桿；−Q₁ 放在 x₁ = R²/x，與上面的圖一致。
   從 Q、−Q₁ 向直線 OP 作垂線，垂線與 P 處的切線方向平行，長 x sinθ、x₁ sinθ。
   x₁ = R²/x 時兩個三角形相似（著色）。 */
(function () {
  var svg = document.getElementById('mx');
  if (!svg) return;
  var fig = svg.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.mx-' + k); }
  function f(n) { return n.toFixed(1); }

  var OX = 450, OY = 195, RP = 130, RED = '#FC6255', BLUE = '#58C4DD', GREEN = '#83C167', GOLD = '#F0AC5F';
  var sth = document.querySelector('.mf-sth'), sx = document.querySelector('.mf-sx');
  if (!sth || !sx) return;
  var th = sth.value * Math.PI / 180, X = +sx.value, B = 1 / X, g = $('g');

  function el(G, tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    G.appendChild(e);
    return e;
  }
  function line(G, a, b, at) { at.x1 = f(a[0]); at.y1 = f(a[1]); at.x2 = f(b[0]); at.y2 = f(b[1]); return el(G, 'line', at); }
  function put(k, x, y) { var e = $(k); e.setAttribute('x', f(x - e.getAttribute('width') / 2)); e.setAttribute('y', f(y - e.getAttribute('height') / 2)); }
  function pts(a) { return a.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function bracket(x1, x2, y) {
    var a = { stroke: 'currentColor', 'stroke-opacity': '.75', 'stroke-width': '1' };
    line(g, [x1, y], [x2, y], a); line(g, [x1, y - 5], [x1, y + 5], a); line(g, [x2, y - 5], [x2, y + 5], a);
  }

  function render() {
    g.textContent = '';
    var u = [-Math.cos(th), -Math.sin(th)], t = [-u[1], u[0]];
    var at = function (d) { return [OX + RP * d * u[0], OY + RP * d * u[1]]; };
    var Q = [OX - X * RP, OY], Q1 = [OX - B * RP, OY], P = at(1), F = at(X * Math.cos(th)), F1 = at(B * Math.cos(th));
    var lo = Math.min(0, X * Math.cos(th), B * Math.cos(th)) - .25, hi = Math.max(1, X * Math.cos(th)) + .25, sim = Math.abs(B - 1 / X) < 1e-9;
    line(g, [Q[0] - 14, OY], [OX + RP + 14, OY], { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-dasharray': '4 3' });
    if (sim) {
      el(g, 'polygon', { points: pts([[OX, OY], Q, P]), fill: RED, 'fill-opacity': '.10', stroke: RED, 'stroke-width': '1' });
      el(g, 'polygon', { points: pts([[OX, OY], P, Q1]), fill: BLUE, 'fill-opacity': '.18', stroke: BLUE, 'stroke-width': '1' });
    }
    line(g, at(lo), at(hi), { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-width': '.8', 'stroke-dasharray': '2 3' });
    line(g, [OX, OY], P, { stroke: 'currentColor', 'stroke-width': '1.3' });
    line(g, [P[0] - t[0] * 50, P[1] - t[1] * 50], [P[0] + t[0] * 50, P[1] + t[1] * 50], { stroke: 'currentColor', 'stroke-opacity': '.5', 'stroke-width': '.8', 'stroke-dasharray': '2 3' });
    var arc = [];
    for (var i = 0; i <= 12; i++) { var a = Math.PI - th * i / 12; arc.push([OX + 24 * Math.cos(a), OY - 24 * Math.sin(a)]); }
    el(g, 'polyline', { points: pts(arc), fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.75', 'stroke-width': '1.2' });
    line(g, Q, P, { stroke: RED, 'stroke-width': '1.3' });
    line(g, Q1, P, { stroke: BLUE, 'stroke-width': '1.3' });
    [[Q, F], [Q1, F1]].forEach(function (s) {
      line(g, s[0], s[1], { stroke: GOLD, 'stroke-width': '1.6', 'stroke-dasharray': '4 3' });
      var w = Math.sign((s[0][0] - s[1][0]) * t[0] + (s[0][1] - s[1][1]) * t[1]) || 1, d = 6;
      var p1 = [s[1][0] + u[0] * d, s[1][1] + u[1] * d], p2 = [p1[0] + t[0] * w * d, p1[1] + t[1] * w * d], p3 = [s[1][0] + t[0] * w * d, s[1][1] + t[1] * w * d];
      if (Math.hypot(s[0][0] - s[1][0], s[0][1] - s[1][1]) > 10) el(g, 'polyline', { points: pts([p1, p2, p3]), fill: 'none', stroke: GOLD, 'stroke-width': '1' });
    });
    var gd = { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-width': '.8', 'stroke-dasharray': '2 3' }, Y1 = OY + RP + 12, Y2 = Y1 + 26;
    line(g, [Q[0], OY + 11], [Q[0], Y2], gd); line(g, [Q1[0], OY + 8], [Q1[0], Y1], gd); line(g, [OX, OY + 4], [OX, Y2], gd);
    bracket(Q1[0], OX, Y1); bracket(Q[0], OX, Y2);
    el(g, 'circle', { cx: f(Q1[0]), cy: OY, r: 7, fill: 'none', stroke: BLUE, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' });
    el(g, 'circle', { cx: OX, cy: OY, r: 3, fill: 'currentColor' });
    el(g, 'circle', { cx: f(P[0]), cy: f(P[1]), r: 4.5, fill: 'currentColor' });
    el(g, 'circle', { cx: f(Q[0]), cy: f(Q[1]), r: 10, fill: RED });
    el(g, 'text', { x: f(Q[0]), y: f(Q[1] + 5), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#1a1a1a' }).textContent = 'Q';

    put('O', OX + 13, OY + 15); put('P', P[0] + u[0] * 16 - t[0] * 12, P[1] + u[1] * 16 - t[1] * 12);
    put('mQ1', Q1[0] - 26, OY + (th < Math.PI / 2 ? 16 : -14));
    put('R', (OX + P[0]) / 2 + t[0] * 13, (OY + P[1]) / 2 + t[1] * 13);
    put('th', OX + 38 * Math.cos(Math.PI - th / 2), OY - 38 * Math.sin(Math.PI - th / 2));
    var dq = [P[0] - Q[0], P[1] - Q[1]], lq = Math.hypot(dq[0], dq[1]), nq = dq[0] > 0 ? [-dq[1] / lq, dq[0] / lq] : [dq[1] / lq, -dq[0] / lq];
    put('r', Q[0] + dq[0] * .4 + nq[0] * 13, Q[1] + dq[1] * .4 + nq[1] * 13);          // r 放在紅線靠 QO 線的一側，避開金色垂線
    var m1 = [(Q1[0] + P[0]) / 2, (Q1[1] + P[1]) / 2], d1 = [P[0] - Q1[0], P[1] - Q1[1]], l1 = Math.hypot(d1[0], d1[1]);
    put('r1', m1[0] + d1[1] / l1 * 13, m1[1] - d1[0] / l1 * 13);
    var mF = [(Q[0] + F[0]) / 2, (Q[1] + F[1]) / 2], sF = (mF[0] - OX) * u[0] + (mF[1] - OY) * u[1] > 0 ? 1 : -1;
    put('xs', mF[0] + sF * u[0] * 18, mF[1] + sF * u[1] * 18);                       // 垂線遠離 O 的一側
    var m1 = [(Q1[0] + F1[0]) / 2, (Q1[1] + F1[1]) / 2];
    if (th < Math.PI / 2) put('x1s', Q1[0] + 40, OY + 20);                             // θ < 90°：垂線夾在 r₁ 與 QO 線之間，標籤放到 QO 線下方
    else put('x1s', m1[0] - u[0] * 18, m1[1] - u[1] * 18);
    put('x1', (Q1[0] + OX) / 2, Y1 + 14); put('x', (Q[0] + OX) / 2, Y2 + 14);
  }

  sth.addEventListener('input', function () { th = sth.value * Math.PI / 180; render(); });
  sx.addEventListener('input', function () { X = +sx.value; B = 1 / X; render(); });
  render();
})();

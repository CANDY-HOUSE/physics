/* 3.11 兩張圖共用 θ、x。
   上圖：P 處的電場，Q 的（紅）與 −Q₁ 的（藍），兩者之和（綠）垂直球面；箭頭長度比 |E_{−Q₁}| : |E_Q| = x : R。
   下圖：在球心 O 放 Q₁，Q₁ 的電場（粉紅）沿著 OP；箭頭長度比 |E_{Q₁}| : |E_Q| = r² : (x R)，|綠| : |E_Q| = (x² − R²) : (R r)。 */
(function () {
  var svgF = document.getElementById('mf'), svgQ = document.getElementById('mq');
  if (!svgF || !svgQ) return;
  var fig = svgF.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.' + k); }
  function f(n) { return n.toFixed(1); }

  var OX = 440, OY = 180, RP = 110, RED = '#FC6255', BLUE = '#58C4DD', GREEN = '#83C167', PINK = '#D147BD';
  var th = 45 * Math.PI / 180, X = 1.8, gF = $('mf-g'), gQ = $('mq-g');

  function el(g, tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    g.appendChild(e);
    return e;
  }
  function line(g, a, b, at) { at.x1 = f(a[0]); at.y1 = f(a[1]); at.x2 = f(b[0]); at.y2 = f(b[1]); return el(g, 'line', at); }
  function arrow(g, a, b, col, w) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 4) return;
    var ux = dx / len, uy = dy / len, h = Math.min(11, len * .6), bx = b[0] - ux * h, by = b[1] - uy * h, q = h * .42;
    line(g, a, [bx, by], { stroke: col, 'stroke-width': w });
    el(g, 'polygon', { points: f(b[0]) + ',' + f(b[1]) + ' ' + f(bx - uy * q) + ',' + f(by + ux * q) + ' ' + f(bx + uy * q) + ',' + f(by - ux * q), fill: col });
  }
  function put(k, x, y) { var e = $(k); e.setAttribute('x', f(x - e.getAttribute('width') / 2)); e.setAttribute('y', f(y - e.getAttribute('height') / 2)); }
  function base(g, Q, P) {
    line(g, [Q[0] - 14, OY], [OX + RP + 14, OY], { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-dasharray': '4 3' });
    line(g, [OX, OY], P, { stroke: 'currentColor', 'stroke-width': '1.3' });
  }
  function dots(g, Q, P) {
    el(g, 'circle', { cx: OX, cy: OY, r: 3, fill: 'currentColor' });
    el(g, 'circle', { cx: f(P[0]), cy: f(P[1]), r: 4.5, fill: 'currentColor' });
    el(g, 'circle', { cx: f(Q[0]), cy: f(Q[1]), r: 10, fill: RED });
    el(g, 'text', { x: f(Q[0]), y: f(Q[1] + 5), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#1a1a1a' }).textContent = 'Q';
  }

  function render() {
    gF.textContent = ''; gQ.textContent = '';
    var Q = [OX - X * RP, OY], Q1 = [OX - RP / X, OY], P = [OX - RP * Math.cos(th), OY - RP * Math.sin(th)];
    var n = [(P[0] - OX) / RP, (P[1] - OY) / RP], t = [-n[1], n[0]], lab = [P[0] + n[0] * 18 + n[1] * 12, P[1] + n[1] * 18 - n[0] * 12];
    var r = Math.hypot(P[0] - Q[0], P[1] - Q[1]), r1 = Math.hypot(P[0] - Q1[0], P[1] - Q1[1]);

    // 上圖
    var L0 = Math.min(38, 64 / X), FQ = [(P[0] - Q[0]) / r * L0, (P[1] - Q[1]) / r * L0];             // Q 的電場：背離 Q
    var F1 = [(Q1[0] - P[0]) / r1 * L0 * X, (Q1[1] - P[1]) / r1 * L0 * X], FS = [FQ[0] + F1[0], FQ[1] + F1[1]];   // −Q₁ 的電場：指向 −Q₁
    base(gF, Q, P);
    el(gF, 'circle', { cx: f(Q1[0]), cy: OY, r: 7, fill: 'none', stroke: BLUE, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' });
    line(gF, Q, P, { stroke: RED, 'stroke-width': '.8', 'stroke-dasharray': '3 3' });
    line(gF, Q1, P, { stroke: BLUE, 'stroke-width': '.8', 'stroke-dasharray': '3 3' });
    arrow(gF, P, [P[0] + FQ[0], P[1] + FQ[1]], RED, 2.6); arrow(gF, P, [P[0] + F1[0], P[1] + F1[1]], BLUE, 2.6); arrow(gF, P, [P[0] + FS[0], P[1] + FS[1]], GREEN, 3.2);
    dots(gF, Q, P);
    put('mf-O', OX + 12, OY + 15); put('mf-Q1', Q1[0] - 20, OY + 16); put('mf-P', lab[0], lab[1]);
    var ang = Math.abs(Math.atan2(FS[0] * n[1] - FS[1] * n[0], FS[0] * n[0] + FS[1] * n[1])) * 180 / Math.PI;
    ang = Math.min(ang, 180 - ang);                                                       // 與直線 OP 的夾角
    $('mf-ro').textContent = ang.toFixed(2) + '°';

    // 下圖
    var M0 = 22, rr = r / RP, lg = M0 * (X * X - 1) / rr, lp = M0 * rr * rr / X;   // 粉紅箭頭最長 4.7 M0，不超過半徑
    line(gQ, [Q[0] - 14, OY], [OX + RP + 14, OY], { stroke: 'currentColor', 'stroke-opacity': '.6', 'stroke-width': '1.2', 'stroke-dasharray': '5 3' });
    line(gQ, [OX, OY], P, { stroke: 'currentColor', 'stroke-width': '1.3' });
    line(gQ, [P[0] - t[0] * 58, P[1] - t[1] * 58], [P[0] + t[0] * 58, P[1] + t[1] * 58], { stroke: 'currentColor', 'stroke-opacity': '.5', 'stroke-width': '.8', 'stroke-dasharray': '2 3' });
    var c = function (a, b) { return [P[0] + t[0] * a - n[0] * b, P[1] + t[1] * a - n[1] * b]; }, s = c(9, 0), m = c(9, 9), k = c(0, 9);
    el(gQ, 'polyline', { points: f(s[0]) + ',' + f(s[1]) + ' ' + f(m[0]) + ',' + f(m[1]) + ' ' + f(k[0]) + ',' + f(k[1]), fill: 'none', stroke: 'currentColor', 'stroke-width': '1' });
    el(gQ, 'circle', { cx: f(Q1[0]), cy: OY, r: 7, fill: 'none', stroke: BLUE, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' });
    el(gQ, 'circle', { cx: OX, cy: OY, r: 9, fill: 'none', stroke: RED, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' });
    arrow(gQ, P, [P[0] - n[0] * lg, P[1] - n[1] * lg], GREEN, 3.2);                      // Q 與 −Q₁ 的電場之和：朝 O
    arrow(gQ, P, [P[0] + n[0] * lp, P[1] + n[1] * lp], PINK, 3);                         // Q₁ 的電場：背離 O
    dots(gQ, Q, P);
    put('mq-O', OX + 13, OY + 17); put('mq-Q1', OX + 8, OY - 23); put('mq-mQ1', Q1[0] - 20, OY + 16); put('mq-P', lab[0], lab[1]); put('mq-line', 120, OY + 36);
  }

  $('mf-sth').addEventListener('input', function (e) { th = e.target.value * Math.PI / 180; $('mf-stho').textContent = e.target.value + '°'; render(); });
  $('mf-sx').addEventListener('input', function (e) { X = +e.target.value; $('mf-sxo').textContent = X.toFixed(2) + 'R'; render(); });
  render();
})();

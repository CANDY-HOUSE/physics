/* 3.11 圖：Q 到金屬球外表面上 P 的距離 r。
   從 P 向「O → Q」作垂線；拖動 θ、x。 */
(function () {
  var svg = document.getElementById('mr');
  if (!svg) return;
  var fig = svg.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.mr-' + k); }
  function f(n) { return n.toFixed(1); }

  var OX = 440, OY = 180, RP = 110, RED = '#FC6255', GOLD = '#F0AC5F';
  var Y1 = OY + RP + 24, Y2 = Y1 + 36;                     // 兩排尺規的高度
  var th = 60 * Math.PI / 180, X = 1.8, g = $('g');

  function el(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    g.appendChild(e);
    return e;
  }
  function line(x1, y1, x2, y2, a) { a.x1 = f(x1); a.y1 = f(y1); a.x2 = f(x2); a.y2 = f(y2); return el('line', a); }
  function put(k, x, y) {
    var e = $(k);
    e.setAttribute('x', f(x - e.getAttribute('width') / 2)); e.setAttribute('y', f(y - e.getAttribute('height') / 2));
    e.setAttribute('visibility', 'visible');
  }
  function hide(k) { $(k).setAttribute('visibility', 'hidden'); }
  function guide(x, y0, y1) { line(x, y0, x, y1, { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-width': '.8', 'stroke-dasharray': '2 3' }); }
  function bracket(x1, x2, y, k) {
    var a = { stroke: 'currentColor', 'stroke-opacity': '.75', 'stroke-width': '1' };
    line(x1, y, x2, y, a); line(x1, y - 5, x1, y + 5, a); line(x2, y - 5, x2, y + 5, a);
    put(k, (x1 + x2) / 2, y + 15);
  }

  function render() {
    g.textContent = '';
    var Q = [OX - X * RP, OY], P = [OX - RP * Math.cos(th), OY - RP * Math.sin(th)], H = [P[0], OY];
    var n = [(P[0] - OX) / RP, (P[1] - OY) / RP], left = H[0] <= OX;
    line(Q[0] - 14, OY, OX + RP + 14, OY, { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-dasharray': '4 3' });
    line(OX, OY, P[0], P[1], { stroke: 'currentColor', 'stroke-width': '1.3' });
    var arc = [];
    for (var i = 0; i <= 12; i++) { var a = Math.PI - th * i / 12; arc.push(f(OX + 24 * Math.cos(a)) + ',' + f(OY - 24 * Math.sin(a))); }
    el('polyline', { points: arc.join(' '), fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.75', 'stroke-width': '1.2' });
    line(Q[0], Q[1], P[0], P[1], { stroke: RED, 'stroke-width': '1.4' });
    line(P[0], P[1], H[0], H[1], { stroke: GOLD, 'stroke-width': '1.6', 'stroke-dasharray': '4 3' });
    var sq = left ? 7 : -7;
    el('polyline', { points: f(H[0]) + ',' + f(OY - 7) + ' ' + f(H[0] + sq) + ',' + f(OY - 7) + ' ' + f(H[0] + sq) + ',' + OY, fill: 'none', stroke: GOLD, 'stroke-width': '1' });
    guide(Q[0], OY + 11, Y2); guide(OX, OY + 4, Y2); guide(H[0], OY + 20, left ? Y1 : Y2);
    bracket(Q[0], H[0], Y1, 'qh');
    if (left) { bracket(H[0], OX, Y1, 'ho'); hide('hon'); }
    else { bracket(OX, H[0], Y2, 'hon'); hide('ho'); }
    bracket(Q[0], OX, Y2, 'qo');
    el('circle', { cx: OX, cy: OY, r: 3, fill: 'currentColor' });
    el('circle', { cx: f(P[0]), cy: f(P[1]), r: 4.5, fill: 'currentColor' });
    el('circle', { cx: f(Q[0]), cy: f(Q[1]), r: 10, fill: RED });
    var qt = el('text', { x: f(Q[0]), y: f(Q[1] + 5), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#1a1a1a' });
    qt.textContent = 'Q';

    put('O', OX + 12, OY + 15);
    put('P', P[0] + n[0] * 18 + n[1] * 12, P[1] + n[1] * 18 - n[0] * 12);
    put('R', (OX + P[0]) / 2 - n[1] * 13, (OY + P[1]) / 2 + n[0] * 13);
    put('th', OX + 38 * Math.cos(Math.PI - th / 2), OY - 38 * Math.sin(Math.PI - th / 2));
    put('r', Q[0] + (P[0] - Q[0]) * .35 - 8, Q[1] + (P[1] - Q[1]) * .35 - 12);
    put('rs', left ? H[0] - 38 : H[0] + 38, (P[1] + OY) / 2);
  }

  $('sth').addEventListener('input', function (e) { th = e.target.value * Math.PI / 180; $('stho').textContent = e.target.value + '°'; render(); });
  $('sx').addEventListener('input', function (e) { X = +e.target.value; $('sxo').textContent = X.toFixed(2) + 'R'; render(); });
  render();
})();

/* 3.11 圖：P 處的電子受 Q 的吸引，以及這個吸引力沿球面、垂直球面的部分。拖動 θ、x。 */
(function () {
  var svg = document.getElementById('me');
  if (!svg) return;
  var fig = svg.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.me-' + k); }
  function f(n) { return n.toFixed(1); }

  var OX = 440, OY = 180, RP = 110, RED = '#FC6255', GOLD = '#F0AC5F', GREY = '#888888';
  var th = 60 * Math.PI / 180, X = 1.8, g = $('g');

  function el(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    g.appendChild(e);
    return e;
  }
  function line(a, b, at) { at.x1 = f(a[0]); at.y1 = f(a[1]); at.x2 = f(b[0]); at.y2 = f(b[1]); return el('line', at); }
  function arrow(a, b, col, w, dash) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 4) return;
    var ux = dx / len, uy = dy / len, h = Math.min(11, len * .6), bx = b[0] - ux * h, by = b[1] - uy * h, q = h * .42;
    var at = { stroke: col, 'stroke-width': w };
    if (dash) at['stroke-dasharray'] = '4 3';
    line(a, [bx, by], at);
    el('polygon', { points: f(b[0]) + ',' + f(b[1]) + ' ' + f(bx - uy * q) + ',' + f(by + ux * q) + ' ' + f(bx + uy * q) + ',' + f(by - ux * q), fill: col });
  }
  function put(k, x, y) { var e = $(k); e.setAttribute('x', f(x - e.getAttribute('width') / 2)); e.setAttribute('y', f(y - e.getAttribute('height') / 2)); }

  function render() {
    g.textContent = '';
    var Q = [OX - X * RP, OY], P = [OX - RP * Math.cos(th), OY - RP * Math.sin(th)];
    var n = [(P[0] - OX) / RP, (P[1] - OY) / RP], t = [-n[1], n[0]];
    var r = Math.hypot(P[0] - Q[0], P[1] - Q[1]), L0 = Math.min(90, .6 * r);
    var FQ = [(Q[0] - P[0]) / r * L0, (Q[1] - P[1]) / r * L0];
    var ft = FQ[0] * t[0] + FQ[1] * t[1], fn = FQ[0] * n[0] + FQ[1] * n[1];
    var tip = function (v) { return [P[0] + v[0], P[1] + v[1]]; }, A = tip([t[0] * ft, t[1] * ft]), B = tip([n[0] * fn, n[1] * fn]);
    line([Q[0] - 14, OY], [OX + RP + 14, OY], { stroke: 'currentColor', 'stroke-opacity': '.45', 'stroke-dasharray': '4 3' });
    line([OX, OY], P, { stroke: 'currentColor', 'stroke-width': '1.3' });
    line([P[0] - t[0] * 58, P[1] - t[1] * 58], [P[0] + t[0] * 58, P[1] + t[1] * 58], { stroke: 'currentColor', 'stroke-opacity': '.5', 'stroke-width': '.8', 'stroke-dasharray': '2 3' });
    arrow(P, A, GOLD, 2.4, true); arrow(P, B, GREY, 2, true);
    var thin = { stroke: 'currentColor', 'stroke-opacity': '.4', 'stroke-width': '.8', 'stroke-dasharray': '2 2' };
    line(A, tip(FQ), thin); line(B, tip(FQ), thin);
    arrow(P, tip(FQ), RED, 2.8);
    el('circle', { cx: OX, cy: OY, r: 3, fill: 'currentColor' });
    el('circle', { cx: f(P[0]), cy: f(P[1]), r: 5, fill: '#BBBBBB', stroke: 'currentColor', 'stroke-width': 1 });
    el('circle', { cx: f(Q[0]), cy: f(Q[1]), r: 10, fill: RED });
    el('text', { x: f(Q[0]), y: f(Q[1] + 5), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#1a1a1a' }).textContent = 'Q';
    put('O', OX + 12, OY + 15);
    put('P', P[0] + n[0] * 18 + n[1] * 30, P[1] + n[1] * 18 - n[0] * 30);
    $('ro').textContent = (Math.abs(ft) / L0).toFixed(3);
  }

  $('sth').addEventListener('input', function (e) { th = e.target.value * Math.PI / 180; $('stho').textContent = e.target.value + '°'; render(); });
  $('sx').addEventListener('input', function (e) { X = +e.target.value; $('sxo').textContent = X.toFixed(2) + 'R'; render(); });
  render();
})();

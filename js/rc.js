/* 3.9 動畫（側視圖）：布滿 Q 的平面以很慢的速度 u 往右移動；在 t0、t1 各送出一則消息。
   兩個前緣（水平的平面）以 c 往上；P0、P1 在 Q(t0)、Q(t1) 正上方，跟著各自的前緣往上。
   兩點的連線＝電場的方向：水平相差 u·(t1 − t0)，垂直相差 c·(t1 − t0)，所以前緣往上時方向不變。
   播放器與下方五顆 Q 的動畫（rd.js）共用。 */
(function () {
  var svg = document.getElementById('rc');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.rc-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.removeAttribute('visibility'); }
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }
  function place(e, x, y, anchor) {
    var w = +e.getAttribute('width'), h = +e.getAttribute('height');
    e.setAttribute('x', f(anchor === 'end' ? x - w : anchor === 'center' ? x - w / 2 : x)); e.setAttribute('y', f(y - h / 2));
  }

  var Y = 350, XS = 328, U = 7 / 110, TE = [30, 140], TOP = 300, HOLD = 60, SMAX = TE[0] + TOP + HOLD;   // c = 1 px／單位時間
  var GOLD = '#F0AC5F', BLUE = '#58C4DD';
  var s = 0, spd = 0.5;
  function xq(t) { return XS + U * t; }

  var gD = $('dots'), dots = [];
  for (var k = 0; k < 22; k++) dots.push(el('circle', { cy: Y, r: 3, fill: '#FC6255', 'fill-opacity': .45 }, gD));
  var me = $('me');                                // 送出這兩則消息的那一顆 Q
  var fr = [$('f0'), $('f1')], vl = [$('v0'), $('v1')], pp = [$('p0'), $('p1')], qc = [$('q0'), $('q1')];
  var lf = [$('lf0'), $('lf1')], lp = [$('lp0'), $('lp1')], lq = [$('lq0'), $('lq1')];
  var hl = $('hleg'), vleg = $('vleg'), ln = $('line'), lh = $('lh'), lv = $('lv'), lt = $('lt');

  function render() {
    var t = Math.min(s, TE[0] + TOP), x = xq(t);
    dots.forEach(function (d, i) { var xx = 40 + ((i * 30 + U * t) % 660); d.setAttribute('cx', f(xx)); if (xx > 650 || Math.abs(xx - x) < 8) hide(d); else show(d); });
    me.setAttribute('cx', f(x));
    var P = [];
    for (var i = 0; i < 2; i++) {
      var on = t >= TE[i], xi = xq(TE[i]), yi = Y - (t - TE[i]);
      [fr[i], vl[i], pp[i], qc[i], lf[i], lp[i], lq[i]].forEach(on ? show : hide);
      if (!on) continue;
      P.push([xi, yi]);
      seg(fr[i], 20, yi, 660, yi); seg(vl[i], xi, Y, xi, yi);
      pp[i].setAttribute('cx', f(xi)); pp[i].setAttribute('cy', f(yi)); qc[i].setAttribute('cx', f(xi));
      place(lf[i], 650, yi - 12, 'end');
      place(lp[i], i ? xi + 10 : xi - 10, yi + 14, i ? 'start' : 'end');
      place(lq[i], i ? xi + 10 : xi - 10, Y + 22, i ? 'start' : 'end');
    }
    var two = P.length === 2;
    [hl, vleg, ln, lh, lv, lt].forEach(two ? show : hide);
    if (!two) return;
    var dx = P[0][0] - P[1][0], dy = P[0][1] - P[1][1], L = Math.hypot(dx, dy);
    var ext = Math.min(70, (Y - 12 - P[1][1]) * L / -dy);   // 往下延長，但不超過平面
    var ex = P[1][0] - dx / L * ext, ey = P[1][1] - dy / L * ext;
    seg(ln, ex, ey, P[0][0], P[0][1]);
    seg(hl, P[0][0], P[0][1], P[1][0], P[0][1]); seg(vleg, P[1][0], P[0][1], P[1][0], P[1][1]);
    place(lh, (P[0][0] + P[1][0]) / 2, P[0][1] - 14, 'center');
    place(lv, P[1][0] + 10, (P[0][1] + P[1][1]) / 2, 'start');
    place(lt, ex + 10, ey + 4, 'start');
    if (ext < 20) hide(lt);
  }

  // 播放器與 rd（五顆 Q 的動畫）共用：rd.js 以同一個進度 p（0～1）呼叫這裡
  window.rcAnim = { render: function (p) { s = p * SMAX; render(); } };
  s = TE[1] + 110;
  render();
})();

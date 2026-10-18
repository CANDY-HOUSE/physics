/* 3.9 動畫（布滿 Q 的無限大平面原本靜止，忽然開始作簡諧運動）：地面基準＝q 基準；側視圖（平面垂直於紙面，只看到它的邊）。
   平面上均勻布滿 Q（每單位面積的電量 σ 固定）；整片原本靜止，
   在時刻 T1 起沿紙面水平方向作簡諧運動 x = c0 + (u/ω)(1 − cos ω(t − T1))，速度 v = u sin ω(t − T1)（從 0 開始，速度連續；u：最大速度）。
   平面的電場不擴散（c = 1，y：到平面的距離）：
     垂直於平面的分量 E⊥ = σ/(2ε0) 處處相同（Gauss 定律，電量分布不變）；
     沿平面的分量來自面電流 σv 的變化，以光速傳出、不衰減：E∥ = −(μ0 σ/2) v(t − y)，所以 E∥ / E⊥ = −v(t − y)
     （消息還沒到時 v = 0，為 0）。
   電場線上 dx/dy = E∥/E⊥，從平面上每一顆 Q 出發往上、往下：
     y < t − T1：x = x_Q − (u/ω)[cos ω(t − T1 − y) − cos ω(t − T1)]；
     y ≥ t − T1：鉛直線，位在這顆 Q 原本靜止的位置 c0。
   有自己的一組控制與迴圈。 */
(function () {
  var svg = document.getElementById('ra');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.ra-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, D = 24, LE = 2;    // D：相鄰兩顆 Q 的間距；每 LE 顆 Q 畫一條電場線
  var T1 = 60, PER = 80, OM = 2 * Math.PI / PER, SMAX = T1 + 640, DR = 2, NR = Math.ceil(Math.max(Y, H - Y) / DR) + 1;
  var GOLD = '#F0AC5F', RED = '#FC6255', TEAL = '#5CD0B3';
  var B = 0.7, s = 0, spd = 0.5, fronts = true;
  var shift = new Float64Array(NR);                               // shift[i]：電場線在 y = i·DR 處相對於它所在的 Q 的水平位移

  function computeShift() {                                       // 上式，逐點寫出（精確的式子，不是數值積分）
    var U = s - T1, A = B / OM;
    for (var i = 0; i < NR; i++) {
      var y = i * DR;
      shift[i] = U <= 0 ? 0 : (y < U ? -A * (Math.cos(OM * (U - y)) - Math.cos(OM * U)) : -A * (1 - Math.cos(OM * U)));
    }
  }
  function xq(k, t) { var c0 = XE + k * D; return t <= T1 ? c0 : c0 + B / OM * (1 - Math.cos(OM * (t - T1))); }   // 第 k 顆 Q 的位置

  var gL = $('lines'), gF = $('fronts'), gQ = $('qs'), lines = [], beads = [];
  function line() { var p = el('path', { fill: 'none', stroke: TEAL, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, gL); lines.push(p); return p; }
  function bead() {
    var g = el('g', {}, gQ); el('circle', { cx: 0, cy: Y, r: 9, fill: RED }, g);
    var t = el('text', { x: 0, y: Y + 4.5, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#1a1a1a' }, g); t.textContent = 'Q';
    beads.push(g); return g;
  }
  var fu = el('line', { x1: 0, x2: W, stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gF);
  var fd = el('line', { x1: 0, x2: W, stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gF);
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.removeAttribute('visibility'); }

  function render() {
    computeShift();
    var x0 = xq(0, s), kmin = Math.floor((-60 - x0) / D), kmax = Math.ceil((W + 60 - x0) / D), nb = 0, nl = 0;
    var lo = Math.min(0, shift[NR - 1], Math.min.apply(null, shift)), hi = Math.max(0, Math.max.apply(null, shift));
    for (var k = kmin; k <= kmax; k++) {                          // 每一顆 Q
      var x = x0 + k * D, g = nb < beads.length ? beads[nb] : bead(); nb++;
      show(g); g.setAttribute('transform', 'translate(' + f(x) + ',0)');
    }
    for (; nb < beads.length; nb++) hide(beads[nb]);
    // 電場線：從每 LE 顆 Q 出發（電場線可能大幅向右偏，所以往左多取一些 Q）
    var k0 = Math.floor((-60 - hi - x0) / D), k1 = Math.ceil((W + 60 - lo - x0) / D);
    for (k = k0; k <= k1; k++) {
      if (((k % LE) + LE) % LE) continue;
      var xb = x0 + k * D, d = '';
      for (var i = NR - 1; i >= 0; i--) d += (d ? 'L' : 'M') + f(xb + shift[i]) + ',' + f(Y - i * DR);
      for (i = 1; i < NR; i++) d += 'L' + f(xb + shift[i]) + ',' + f(Y + i * DR);
      var p = nl < lines.length ? lines[nl] : line(); nl++;
      show(p); p.setAttribute('d', d);
    }
    for (; nl < lines.length; nl++) hide(lines[nl]);
    var U = s - T1;
    if (fronts && U > 0) { show(fu); show(fd); fu.setAttribute('y1', f(Y - U)); fu.setAttribute('y2', f(Y - U)); fd.setAttribute('y1', f(Y + U)); fd.setAttribute('y2', f(Y + U)); } else { hide(fu); hide(fd); }
    $('t').value = Math.round(s / SMAX * 1000);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, last = 0;
  var bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * SMAX; render(); });
  $('b').addEventListener('input', function (e) { B = +e.target.value; $('bo').innerHTML = B.toFixed(1) + ' <i>c</i>'; render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('cs').addEventListener('change', function (e) { fronts = e.target.checked; render(); });
  function loop(ts) {
    if (play && vis && ts - last > 33) { last = ts; s += 2 * spd; if (s > SMAX) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 0.75 * SMAX;
  setPlay(play);
  render();
  requestAnimationFrame(loop);
  window.ra = { at: function (v) { setPlay(false); s = v * SMAX; render(); }, play: function () { setPlay(true); },
    check: function () { var U = s - T1; return U > 0 && U < (NR - 1) * DR ? [shift[Math.round(U / DR)], -B / OM * (1 - Math.cos(OM * U))] : null; } };
})();

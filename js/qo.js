/* 3.9 動畫：地面基準＝q 基準，Q 以 u 等速前進，在時刻 t0 送出一圈消息，q 靜止。
   上圖（qo）：電場線、消息前緣、t0 消息前緣上的箭頭，以及 q 處的電場箭頭；
   下圖（qp）：q 處的電場強度隨時間的變化，橫軸與上圖 Q 的位置對齊。 */
(function () {
  var svg = document.getElementById('qo'), svg2 = document.getElementById('qp');
  if (!svg || !svg2) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qo-' + k); }
  function $2(k) { return svg2.querySelector('.qp-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, XEND = 630, QX = 370, QY = 170, NL = 24, QR = 9, DI = 60, KBASE = 60 * 100 * 100;
  var BY = 210, PK = 2;                      // 下圖：基線、曲線高度 ＝ PK × 箭頭長度（箭頭比例 ×1）
  var TEAL = '#5CD0B3', GOLD = '#F0AC5F';
  var B = 0.7, s = 0, spd = 0.5, mult = 1, flines = true, ring = true, irings = true;
  var followers = [];                        // 共用這組控制與迴圈的其他圖（例如 qr、qs）
  function state() { return { B: B, s: s, mult: mult, flines: flines, ring: ring, irings: irings }; }

  var gI = $('irings'), gF = $('lines'), gR = $('ring'), gA = $('arrows'), gQ = $('qe');
  var iring = [], lines = [], arrows = [];
  function mkRing() { var c = el('circle', { fill: 'none', stroke: GOLD, 'stroke-opacity': .32, 'stroke-dasharray': '4 5', 'stroke-width': 1 }, gI); iring.push(c); return c; }
  for (var i = 0; i < 40; i++) mkRing();
  function mkArrow(p, w) {
    var g = el('g', {}, p);
    return { g: g,
      shaft: el('line', { stroke: TEAL, 'stroke-width': w }, g),
      head: el('path', { fill: TEAL }, g),
      cut1: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g),
      cut2: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g) };
  }
  for (i = 0; i < NL; i++) {
    lines.push(el('line', { stroke: TEAL, 'stroke-opacity': .3, 'stroke-width': 1.2 }, gF));
    arrows.push(mkArrow(gA, 2.2));
  }
  var qArrow = mkArrow(gQ, 3);
  var t0ring = el('circle', { cx: XE, cy: Y, fill: 'none', stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gR);
  var q = $('q'), qt = $('qt'), qn = $('qnow'), ua = $('u'), ul = $('ulab');

  // 電場強度（Q 此刻到該點的向量 vx, vy；比例常數另乘）
  function emag(vx, vy) { var d2 = vx * vx + vy * vy, s2 = vy * vy / d2; return (1 - B * B) / Math.pow(1 - B * B * s2, 1.5) / d2; }
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.removeAttribute('visibility'); }
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }

  // 箭頭尖端在 (px,py)、方向 (ux,uy)、長度 L；超出可用長度 avail 時截短並加斷號
  function vec(A, px, py, ux, uy, L, avail) {
    show(A.g);
    if (L < 2) { hide(A.shaft); hide(A.cut1); hide(A.cut2); A.head.setAttribute('d', 'M' + f(px - 1.6) + ',' + f(py) + 'a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0'); return; }
    var cut = L > avail, Ld = cut ? Math.max(avail, 4) : L, h = Math.min(8, 0.45 * Ld), a = Math.atan2(uy, ux);
    show(A.shaft); seg(A.shaft, px - Ld * ux, py - Ld * uy, px - 0.6 * h * ux, py - 0.6 * h * uy);
    A.head.setAttribute('d', 'M' + f(px) + ',' + f(py) + 'L' + f(px - h * Math.cos(a - 0.42)) + ',' + f(py - h * Math.sin(a - 0.42)) + 'L' + f(px - h * Math.cos(a + 0.42)) + ',' + f(py - h * Math.sin(a + 0.42)) + 'Z');
    if (cut && Ld > 14) {
      var mx = px - 0.55 * Ld * ux, my = py - 0.55 * Ld * uy, nx = -uy, ny = ux, cs = [A.cut1, A.cut2], o = [-2.5, 2.5];
      for (var j = 0; j < 2; j++) { show(cs[j]); seg(cs[j], mx + o[j] * ux + 5 * nx + 2 * ux, my + o[j] * uy + 5 * ny + 2 * uy, mx + o[j] * ux - 5 * nx - 2 * ux, my + o[j] * uy - 5 * ny - 2 * uy); }
    } else { hide(A.cut1); hide(A.cut2); }
  }

  function smax() { return (XEND - XE) / B; }   // Q 從 Q(t0) 走到 XEND 時，t0 消息前緣的半徑
  function plotY(xq, k) { return BY - PK * k * emag(QX - xq, QY - Y); }

  function curve() {                           // 下圖：整條曲線（淡）
    var pts = [];
    for (var x = XE; x <= XEND + 0.01; x += 2) pts.push(f(x) + ',' + f(plotY(x, KBASE)));
    $2('all').setAttribute('points', pts.join(' '));
  }

  function render() {
    var gm = 1 / Math.sqrt(1 - B * B), xq = XE + B * s, K = KBASE * mult, ang = [], i;
    for (i = 0; i < NL; i++) { var th = (i + 0.5) * 2 * Math.PI / NL; ang.push(Math.atan2(Math.sin(th), Math.cos(th) / gm)); }
    if (flines) show(gF); else hide(gF);
    for (i = 0; i < NL; i++) seg(lines[i], xq + 10 * Math.cos(ang[i]), Y - 10 * Math.sin(ang[i]), xq + 1200 * Math.cos(ang[i]), Y - 1200 * Math.sin(ang[i]));
    var n = 0;
    if (irings) {                              // 從最近送出的消息前緣往前畫
      for (var k = Math.floor(s / DI); ; k--) {
        var r = s - k * DI, cx = XE + B * k * DI;
        // 這一圈已經把整個畫面包住時停止；更早送出的消息前緣也都包住了畫面
        if (r >= Math.max(Math.hypot(cx, Y), Math.hypot(W - cx, Y), Math.hypot(cx, H - Y), Math.hypot(W - cx, H - Y))) break;
        if (k === 0 || r <= 0) continue;
        var c = n < iring.length ? iring[n] : mkRing(); n++;
        show(c); c.setAttribute('cx', f(cx)); c.setAttribute('cy', Y); c.setAttribute('r', f(r));
      }
    }
    for (; n < iring.length; n++) hide(iring[n]);
    if (ring && s > 0) { show(t0ring); t0ring.setAttribute('r', f(s)); } else hide(t0ring);
    for (i = 0; i < NL; i++) {
      var a = ang[i], ux = Math.cos(a), uy = -Math.sin(a), d = s * (-B * Math.cos(a) + Math.sqrt(1 - B * B * Math.sin(a) * Math.sin(a)));
      var px = xq + d * ux, py = Y + d * uy;
      if (s <= 0 || px < -10 || px > W + 10 || py < -10 || py > H + 10 || d < 1e-6) { hide(arrows[i].g); continue; }
      vec(arrows[i], px, py, ux, uy, K * emag(d * ux, d * uy), d - QR - 3);
    }
    // q 處的電場：從 q 往外，方向沿 Q 此刻到 q 的連線
    var vx = QX - xq, vy = QY - Y, dq = Math.sqrt(vx * vx + vy * vy), Lq = K * emag(vx, vy), R0 = 9;   // 箭頭從 q 的圓點外緣開始
    var Ld = Math.min(Lq, 140);
    vec(qArrow, QX + (R0 + Ld) * vx / dq, QY + (R0 + Ld) * vy / dq, vx / dq, vy / dq, Lq, 140);
    q.setAttribute('cx', f(xq)); qt.setAttribute('x', f(xq));
    qn.setAttribute('x', f(xq - 35)); if (xq - XE > 70) show(qn); else hide(qn);
    var L = 18 + 60 * B;
    show(ua); seg(ua, xq + QR + 3, Y, xq + QR + 3 + L, Y); show(ul); ul.setAttribute('x', f(xq + QR + 3 + L / 2 - 20));
    // 下圖
    var pts = [];
    for (var x = XE; x < xq; x += 2) pts.push(f(x) + ',' + f(plotY(x, KBASE)));
    pts.push(f(xq) + ',' + f(plotY(xq, KBASE)));
    $2('past').setAttribute('points', pts.join(' '));
    var dot = $2('dot'); dot.setAttribute('cx', f(xq)); dot.setAttribute('cy', f(plotY(xq, KBASE)));
    var nw = $2('now'); nw.setAttribute('x1', f(xq)); nw.setAttribute('x2', f(xq));
    $2('q').setAttribute('cx', f(xq)); $2('qt').setAttribute('x', f(xq));   // 與上圖的 Q 上下對齊
    $('t').value = Math.round(s / smax() * 1000);
    for (var fi = 0; fi < followers.length; fi++) followers[fi].render(state());
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis1 = true, vis2 = true, last = 0;
  var bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { vis1 = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
    new IntersectionObserver(function (es) { vis2 = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg2);
  }
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * smax(); render(); });
  $('b').addEventListener('input', function (e) { var fr = s / smax(); B = +e.target.value; $('bo').innerHTML = B.toFixed(1) + ' <i>c</i>'; s = fr * smax(); curve(); for (var fi = 0; fi < followers.length; fi++) followers[fi].curve(state()); render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('k').addEventListener('input', function (e) { mult = Math.pow(10, +e.target.value); $('ko').textContent = '×' + Math.round(mult); render(); });
  $('cf').addEventListener('change', function (e) { flines = e.target.checked; render(); });
  $('cr').addEventListener('change', function (e) { ring = e.target.checked; render(); });
  $('ci').addEventListener('change', function (e) { irings = e.target.checked; render(); });
  function loop(ts) {
    var vf = followers.some(function (fl) { return fl.vis.some(Boolean); });
    if (play && (vis1 || vis2 || vf) && ts - last > 33) { last = ts; s += 2 * spd; if (s > smax()) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 0.4 * smax();
  setPlay(play);
  curve();
  render();
  requestAnimationFrame(loop);
  window.qo = { at: function (v) { setPlay(false); s = v * smax(); render(); }, play: function () { setPlay(true); },
    follow: function (fl) {                    // fl：{ svgs, render(st), curve(st) }
      fl.vis = fl.svgs.map(function () { return true; });
      if ('IntersectionObserver' in window) fl.svgs.forEach(function (sv, i) { new IntersectionObserver(function (es) { fl.vis[i] = es[0].isIntersecting; }, { threshold: 0.05 }).observe(sv); });
      followers.push(fl); fl.curve(state()); fl.render(state());
    } };
})();

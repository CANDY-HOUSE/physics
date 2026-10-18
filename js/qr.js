/* 3.9 動畫（同 qo、qp）：一排等距的 Q 以 u 等速前進，每一顆各在時刻 t0 送出一圈消息；q 靜止。
   上圖（qr）：每一顆 Q 的電場線、消息前緣、t0 消息前緣上的箭頭（各自的電場），以及 q 處的電場（所有 Q 相加）；
   下圖（qs）：q 處的電場強度隨時間的變化，橫軸與上圖第一顆 Q（從 Q(t0) 出發的那顆）的位置對齊。
   沒有自己的控制與迴圈：跟著 qo 那組控制（window.qo.follow）。 */
(function () {
  var svg = document.getElementById('qr'), svg2 = document.getElementById('qs');
  if (!svg || !svg2) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qr-' + k); }
  function $2(k) { return svg2.querySelector('.qs-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, XEND = 630, QX = 370, QY = 170, NL = 24, QR = 9, DI = 60, KBASE = 60 * 100 * 100;
  var SP = 200, KS = 80, R1 = 700, R2 = 900;   // R1～R2：其他時刻的消息前緣漸淡                       // 相鄰兩顆 Q 的間距；q 處相加時取 −KS…KS 顆
  var BY = 210, TOP = 30, PK = 2;              // 下圖：基線、頂端；PK 依最大值調整
  var TEAL = '#5CD0B3', GOLD = '#F0AC5F', RED = '#FC6255';
  var B = 0.7, s = 0, spd = 0.5, mult = 1, flines = true, ring = true, irings = true;

  var gI = $('irings'), gF = $('lines'), gR = $('ring'), gA = $('arrows'), gQ = $('qe'), gT0 = $('t0s'), gQs = $('qs');
  function pool(make) { var a = []; return { get: function (i) { while (a.length <= i) a.push(make()); return a[i]; }, hideFrom: function (n) { for (; n < a.length; n++) hide(a[n].g || a[n]); } }; }
  var iring = pool(function () { return el('circle', { fill: 'none', stroke: GOLD, 'stroke-opacity': .18, 'stroke-dasharray': '4 5', 'stroke-width': 1 }, gI); });
  var t0r = pool(function () { return el('circle', { cy: Y, fill: 'none', stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gR); });
  var lines = pool(function () { return el('line', { stroke: TEAL, 'stroke-opacity': .2, 'stroke-width': 1.2 }, gF); });
  function mkArrow(p, w) {
    var g = el('g', {}, p);
    return { g: g,
      shaft: el('line', { stroke: TEAL, 'stroke-width': w }, g),
      head: el('path', { fill: TEAL }, g),
      cut1: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g),
      cut2: el('line', { stroke: TEAL, 'stroke-width': 1.6 }, g) };
  }
  var arrows = pool(function () { return mkArrow(gA, 2.2); });
  var qArrow = mkArrow(gQ, 3);
  var qdots = pool(function () { var g = el('g', {}, gQs); el('circle', { cx: 0, cy: Y, r: 10, fill: RED }, g); var t = el('text', { x: 0, y: Y + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#1a1a1a' }, g); t.textContent = 'Q'; return g; });
  var pdots = pool(function () { var g = el('g', {}, $2('qs')); el('circle', { cx: 0, cy: BY + 21, r: 9, fill: RED }, g); var t = el('text', { x: 0, y: BY + 26, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#1a1a1a' }, g); t.textContent = 'Q'; return g; });
  var qn = $('qnow'), ua = $('u'), ul = $('ulab');

  // 每一顆 Q 在時刻 t0 的位置（固定）
  for (var k = -1; XE + k * SP <= W; k++) if (XE + k * SP >= 0) el('circle', { cx: XE + k * SP, cy: Y, r: 6, fill: 'none', stroke: GOLD, 'stroke-width': 1.8 }, gT0);
  // 下圖：某一顆 Q 經過 q 正下方的時刻（第一顆 Q 的位置）
  for (k = -5; k <= 5; k++) { var xm = QX - k * SP; if (xm >= XE && xm <= XEND) el('line', { x1: xm, y1: TOP + 16, x2: xm, y2: BY, stroke: 'currentColor', 'stroke-opacity': .35, 'stroke-dasharray': '3 4' }, $2('marks')); }

  // 電場（Q 此刻到該點的向量 vx, vy；比例常數另乘）
  function emag(vx, vy) { var d2 = vx * vx + vy * vy, s2 = vy * vy / d2; return (1 - B * B) / Math.pow(1 - B * B * s2, 1.5) / d2; }
  function etot(x0) {                          // 第一顆 Q 在 x0 時，q 處所有 Q 的電場相加
    var ex = 0, ey = 0;
    for (var k = -KS; k <= KS; k++) { var vx = QX - (x0 + k * SP), vy = QY - Y, d = Math.sqrt(vx * vx + vy * vy), m = emag(vx, vy); ex += m * vx / d; ey += m * vy / d; }
    return [ex, ey];
  }
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
  function far(cx) { return Math.max(Math.hypot(cx, Y), Math.hypot(W - cx, Y), Math.hypot(cx, H - Y), Math.hypot(W - cx, H - Y)); }
  function near(cx) { var dx = cx < 0 ? -cx : cx > W ? cx - W : 0; return dx; }   // 圓心到畫面的最近距離（圓心在路徑上，路徑在畫面內）

  function smax() { return (XEND - XE) / B; }
  function plotY(x0) { var e = etot(x0); return BY - PK * KBASE * Math.hypot(e[0], e[1]); }
  function scale() {                           // 讓 0.1c～0.9c 的曲線都放得進下圖
    var b0 = B, mx = 0;
    for (var bb = 0.1; bb < 0.95; bb += 0.1) { B = bb; for (var x = XE; x <= XEND; x += 4) { var e = etot(x); mx = Math.max(mx, Math.hypot(e[0], e[1])); } }
    B = b0; PK = Math.min(2, (BY - TOP - 18) / (KBASE * mx));
  }
  var cache = [];                              // 曲線上每 2 px 一點（速度改變時重算）
  function curve() {
    cache = [];
    for (var x = XE; x <= XEND + 0.01; x += 2) cache.push(f(x) + ',' + f(plotY(x)));
    $2('all').setAttribute('points', cache.join(' '));
  }

  function render() {
    var gm = 1 / Math.sqrt(1 - B * B), x0 = XE + B * s, K = KBASE * mult, ang = [], i, k, n;
    for (i = 0; i < NL; i++) { var th = (i + 0.5) * 2 * Math.PI / NL; ang.push(Math.atan2(Math.sin(th), Math.cos(th) / gm)); }
    var kmin = Math.ceil((-40 - x0) / SP), kmax = Math.floor((W + 40 - x0) / SP);   // 畫面內的 Q
    // 電場線（每一顆 Q 各自的）
    if (flines) show(gF); else hide(gF);
    n = 0;
    for (k = Math.ceil((-SP - x0) / SP); x0 + k * SP <= W + SP; k++) {
      var xq = x0 + k * SP, op = 0.2 * Math.max(0, 1 - near(xq) / SP);   // 離開畫面越遠越淡
      if (op <= 0) continue;
      for (i = 0; i < NL; i++) { var ln = lines.get(n++); show(ln); ln.setAttribute('stroke-opacity', op.toFixed(3)); seg(ln, xq + 10 * Math.cos(ang[i]), Y - 10 * Math.sin(ang[i]), xq + 1200 * Math.cos(ang[i]), Y - 1200 * Math.sin(ang[i])); }
    }
    lines.hideFrom(n);
    // 其他時刻送出的消息前緣（每一顆 Q 各自的）
    n = 0;
    if (irings) {
      for (k = Math.ceil((-R2 - x0) / SP); x0 + k * SP <= W + R2 + B * R2; k++) {
        for (var j = Math.floor(s / DI); ; j--) {
          var r = s - j * DI, cx = XE + k * SP + B * j * DI;
          if (r >= R2 || r >= far(cx)) break;               // 更早送出的也一樣：太舊，或已把整個畫面包住
          if (j === 0 || r <= 0 || r < near(cx)) continue;
          var c = iring.get(n++); show(c); c.setAttribute('cx', f(cx)); c.setAttribute('cy', Y); c.setAttribute('r', f(r));
          c.setAttribute('stroke-opacity', (0.18 * Math.min(1, (R2 - r) / (R2 - R1))).toFixed(3));
        }
      }
    }
    iring.hideFrom(n);
    // 時刻 t0 送出的消息前緣，以及前緣上的箭頭（每一顆 Q 各自的電場）
    var nr = 0, na = 0;
    for (k = Math.ceil((-s - W) / SP) - 1; XE + k * SP <= W + s; k++) {
      var c0 = XE + k * SP, xk = x0 + k * SP;
      if (!(s > 0) || s < near(c0) || s >= far(c0)) continue;
      if (ring) { var rr = t0r.get(nr++); show(rr); rr.setAttribute('cx', f(c0)); rr.setAttribute('r', f(s)); }
      for (i = 0; i < NL; i++) {
        var a = ang[i], ux = Math.cos(a), uy = -Math.sin(a), d = s * (-B * Math.cos(a) + Math.sqrt(1 - B * B * Math.sin(a) * Math.sin(a)));
        var px = xk + d * ux, py = Y + d * uy;
        if (px < -10 || px > W + 10 || py < -10 || py > H + 10 || d < 1e-6) continue;
        vec(arrows.get(na++), px, py, ux, uy, K * emag(d * ux, d * uy), d - QR - 3);
      }
    }
    t0r.hideFrom(nr); arrows.hideFrom(na);
    // 每一顆 Q
    n = 0;
    for (k = kmin; k <= kmax; k++) { var g = qdots.get(n++); show(g); g.setAttribute('transform', 'translate(' + f(x0 + k * SP) + ',0)'); }
    qdots.hideFrom(n);
    // q 處的電場：所有 Q 的電場相加
    var e = etot(x0), em = Math.hypot(e[0], e[1]), R0 = 9, Lq = K * em, Ld = Math.min(Lq, 140);
    vec(qArrow, QX + (R0 + Ld) * e[0] / em, QY + (R0 + Ld) * e[1] / em, e[0] / em, e[1] / em, Lq, 140);
    qn.setAttribute('x', f(x0 - 35)); if (x0 - XE > 70) show(qn); else hide(qn);
    var L = 18 + 60 * B;
    show(ua); seg(ua, x0 + QR + 3, Y, x0 + QR + 3 + L, Y); show(ul); ul.setAttribute('x', f(x0 + QR + 3 + L / 2 - 20));
    // 下圖
    var pts = cache.slice(0, Math.max(0, Math.ceil((x0 - XE) / 2)));
    pts.push(f(x0) + ',' + f(plotY(x0)));
    $2('past').setAttribute('points', pts.join(' '));
    var dot = $2('dot'); dot.setAttribute('cx', f(x0)); dot.setAttribute('cy', f(plotY(x0)));
    var nw = $2('now'); nw.setAttribute('x1', f(x0)); nw.setAttribute('x2', f(x0));
    n = 0;
    for (k = kmin; k <= kmax; k++) { var pg = pdots.get(n++); show(pg); pg.setAttribute('transform', 'translate(' + f(x0 + k * SP) + ',0)'); }
    pdots.hideFrom(n);
  }

  function apply(st) { B = st.B; s = st.s; mult = st.mult; flines = st.flines; ring = st.ring; irings = st.irings; }
  if (!window.qo || !window.qo.follow) return;
  scale();
  window.qo.follow({ svgs: [svg, svg2],
    render: function (st) { apply(st); render(); },
    curve: function (st) { apply(st); curve(); } });
})();

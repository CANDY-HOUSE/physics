/* 3.9 動畫（同 qo 的上圖）：Q 以 u 等速前進，在時刻 t0 送出一圈消息；q 由右邊的水平彈簧拉住，上下軌道只讓它水平移動。
   q 的運動是模擬出來的：水平方向受 Q 在 q 處的電場水平分量推動、受彈簧拉回（磁力在垂直方向，由軌道承受）；
   動量用 p = γmv，時間單位是光走 1 px 的時間（c = 1），從 Q 還在很遠的左邊、q 靜止時開始算。
   q 處的箭頭是 Q 在 q 此刻位置的電場。沒有自己的控制與迴圈：跟著 qo 那組控制（window.qo.follow）。 */
(function () {
  var svg = document.getElementById('qt');
  if (!svg || !window.qo || !window.qo.follow) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qt-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, XEND = 630, QX = 370, QY = 170, NL = 24, QR = 9, DI = 60, KBASE = 60 * 100 * 100;
  // 彈簧 k 與 q 的質量 m：k 取「m = 1 時單獨振動週期 600」的大小，m 取 1/3（q 的振盪更明顯）
  var ANCHOR = QX + 60, KSP = Math.pow(2 * Math.PI / 600, 2), MQ = 1 / 3, QC = 80, DS = 0.5;   // 固定端；k；m；q（任意單位）；積分步長
  var P0 = 2 * Math.PI / Math.sqrt(KSP / MQ), GQ = QC / MQ;                                     // 單獨振動的週期；q/m
  var traj = null, tB = null;                    // q 的位置（每 DS 一點，從 s = 0 起），速度改變時重算
  function ex(x, sv) { var vx = x - (XE + B * sv), vy = QY - Y, d = Math.sqrt(vx * vx + vy * vy); return emag(vx, vy) * vx / d; }
  function simulate() {
    var w2 = Math.pow(2 * Math.PI / P0, 2), sv = (-2000 - XE) / B, x = QX, p = 0, end = (XEND - XE) / B + 2 * DS;
    var out = [];
    function fx(sv, x, p) { return [p / Math.sqrt(1 + p * p), GQ * ex(x, sv) - w2 * (x - QX)]; }
    while (sv < end) {
      if (sv >= -DS / 2) out.push(x);
      var k1 = fx(sv, x, p), k2 = fx(sv + DS / 2, x + DS / 2 * k1[0], p + DS / 2 * k1[1]), k3 = fx(sv + DS / 2, x + DS / 2 * k2[0], p + DS / 2 * k2[1]), k4 = fx(sv + DS, x + DS * k3[0], p + DS * k3[1]);
      x += DS / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); p += DS / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); sv += DS;
    }
    traj = out; tB = B;
  }
  function qpos(sv) { var i = sv / DS, i0 = Math.max(0, Math.min(traj.length - 2, Math.floor(i))), fr = i - i0; return traj[i0] + (traj[i0 + 1] - traj[i0]) * fr; }
  var TEAL = '#5CD0B3', GOLD = '#F0AC5F';
  var B = 0.7, s = 0, spd = 0.5, mult = 1, flines = true, ring = true, irings = true;

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
    if (tB !== B) simulate();
    var qx = qpos(s);                                                  // q 此刻的位置（模擬）
    $('qc').setAttribute('cx', f(qx)); $('ql').setAttribute('x', f(qx - 15));
    var sp = 'M' + ANCHOR + ',' + QY, nz = 8, Lz = qx + 7 - ANCHOR;          // 彈簧：右邊的固定端到 q
    for (var zi = 1; zi < nz; zi++) sp += ' L' + f(ANCHOR + Lz * zi / nz) + ',' + (QY + (zi % 2 ? -3.5 : 3.5));
    $('spring').setAttribute('d', sp + ' L' + f(qx + 7) + ',' + QY);
    var vx = qx - xq, vy = QY - Y, dq = Math.sqrt(vx * vx + vy * vy), Lq = K * emag(vx, vy), R0 = 9;   // 箭頭從 q 的圓點外緣開始
    var Ld = Math.min(Lq, 140);
    vec(qArrow, qx + (R0 + Ld) * vx / dq, QY + (R0 + Ld) * vy / dq, vx / dq, vy / dq, Lq, 140);
    q.setAttribute('cx', f(xq)); qt.setAttribute('x', f(xq));
    qn.setAttribute('x', f(xq - 35)); if (xq - XE > 70) show(qn); else hide(qn);
    var L = 18 + 60 * B;
    show(ua); seg(ua, xq + QR + 3, Y, xq + QR + 3 + L, Y); show(ul); ul.setAttribute('x', f(xq + QR + 3 + L / 2 - 20));
  }

  function apply(st) { B = st.B; s = st.s; mult = st.mult; flines = st.flines; ring = st.ring; irings = st.irings; }
  window.qo.follow({ svgs: [svg],
    render: function (st) { apply(st); render(); },
    curve: function (st) { apply(st); simulate(); } });
})();

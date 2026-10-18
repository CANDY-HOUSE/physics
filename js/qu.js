/* 3.9 動畫（同 qo 的上圖）：Q 以 u 等速前進，在時刻 t0 送出一圈消息，走到 XS 時瞬間停下；q 靜止。
   Q 停下時送出的消息前緣以內：Q 已靜止，電場線從 XS 沿直線放射（瞬時靜止基準的角度 θ'）；
   以外：消息還沒到，仍是等速前進的電場，電場線從「若未停下，Q 此刻的位置」沿直線放射（tan θ = γ tan θ'）；
   兩段在這圈前緣上，沿前緣的圓弧接起來（瞬間停下時，這圈前緣上的電場與前緣相切）。
   有自己的一組控制與迴圈（與 qo 分開）。 */
(function () {
  var svg = document.getElementById('qu');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qu-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, XEND = 630, QX = 370, QY = 170, NL = 24, QR = 9, DI = 60, KBASE = 60 * 100 * 100;
  var XS = 300;                                  // Q 停下的位置
  var TEAL = '#5CD0B3', GOLD = '#F0AC5F';
  var B = 0.7, s = 0, spd = 0.5, mult = 1, flines = true, ring = true, irings = true, sring = true;

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
    lines.push(el('path', { fill: 'none', stroke: TEAL, 'stroke-opacity': .3, 'stroke-width': 1.2 }, gF));
    arrows.push(mkArrow(gA, 2.2));
  }
  var qArrow = mkArrow(gQ, 3);
  var t0ring = el('circle', { cx: XE, cy: Y, fill: 'none', stroke: GOLD, 'stroke-opacity': .85, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }, gR);
  var q = $('q'), qt = $('qt'), qn = $('qnow'), ua = $('u'), ul = $('ulab'), sr = $('sring'), gh = $('ghost'), gl = $('gl');

  // 等速前進時的電場強度（Q 此刻到該點的向量 vx, vy；比例常數另乘）；B = 0 時就是靜止的電場
  function emag(vx, vy, b) { var d2 = vx * vx + vy * vy, s2 = vy * vy / d2; return (1 - b * b) / Math.pow(1 - b * b * s2, 1.5) / d2; }
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

  function smax() { return (XEND - XE) / B; }   // 若未停下，Q 從 Q(t0) 走到 XEND 時，t0 消息前緣的半徑
  function render() {
    var gm = 1 / Math.sqrt(1 - B * B), ss = (XS - XE) / B, xv = XE + B * s, stop = s > ss, rs = s - ss;   // 停下的時刻；若未停下，Q 此刻的位置；停下時送出的消息前緣半徑
    var xq = stop ? XS : xv, K = KBASE * mult, th = [], ang = [], i;
    for (i = 0; i < NL; i++) { th.push((i + 0.5) * 2 * Math.PI / NL); ang.push(Math.atan2(Math.sin(th[i]), Math.cos(th[i]) / gm)); }
    if (flines) show(gF); else hide(gF);
    for (i = 0; i < NL; i++) {
      var ca = Math.cos(ang[i]), sa = Math.sin(ang[i]), far = 'L' + f(xv + 1200 * ca) + ',' + f(Y - 1200 * sa);
      if (!stop) { lines[i].setAttribute('d', 'M' + f(xv + 10 * ca) + ',' + f(Y - 10 * sa) + far); continue; }
      // 前緣以內：從 XS 沿 θ' 放射；在前緣上沿圓弧轉到 θe（cos θe = (cos θ' + β)/(1 + β cos θ')）；以外：沿 ang 直線
      var ct = Math.cos(th[i]), st = Math.sin(th[i]), dn = 1 + B * ct, te = Math.atan2(st / (gm * dn), (ct + B) / dn);
      var r0 = Math.min(10, rs), dl = te - th[i];
      while (dl > Math.PI) dl -= 2 * Math.PI;
      while (dl < -Math.PI) dl += 2 * Math.PI;
      lines[i].setAttribute('d', 'M' + f(XS + r0 * ct) + ',' + f(Y - r0 * st) + 'L' + f(XS + rs * ct) + ',' + f(Y - rs * st) +
        'A' + f(rs) + ',' + f(rs) + ' 0 0,' + (dl < 0 ? 1 : 0) + ' ' + f(XS + rs * Math.cos(te)) + ',' + f(Y - rs * Math.sin(te)) + far);
    }
    var n = 0;
    if (irings) {                              // 從最近送出的消息前緣往前畫；停下之後送出的都以 XS 為圓心
      for (var k = Math.floor(s / DI); ; k--) {
        var r = s - k * DI, cx = k * DI > ss ? XS : XE + B * k * DI;
        // 這一圈已經把整個畫面包住時停止；更早送出的消息前緣也都包住了畫面
        if (r >= Math.max(Math.hypot(cx, Y), Math.hypot(W - cx, Y), Math.hypot(cx, H - Y), Math.hypot(W - cx, H - Y))) break;
        if (k === 0 || r <= 0) continue;
        var c = n < iring.length ? iring[n] : mkRing(); n++;
        show(c); c.setAttribute('cx', f(cx)); c.setAttribute('cy', Y); c.setAttribute('r', f(r));
      }
    }
    for (; n < iring.length; n++) hide(iring[n]);
    if (ring && s > 0) { show(t0ring); t0ring.setAttribute('r', f(s)); } else hide(t0ring);
    if (stop && sring) { show(sr); sr.setAttribute('r', f(rs)); } else hide(sr);
    // t0 消息前緣上的箭頭：這圈前緣整個在「停下時送出的消息前緣」外面，仍是等速前進的電場（從 xv 算）
    for (i = 0; i < NL; i++) {
      var a = ang[i], ux = Math.cos(a), uy = -Math.sin(a), d = s * (-B * Math.cos(a) + Math.sqrt(1 - B * B * Math.sin(a) * Math.sin(a)));
      var px = xv + d * ux, py = Y + d * uy;
      if (s <= 0 || px < -10 || px > W + 10 || py < -10 || py > H + 10 || d < 1e-6) { hide(arrows[i].g); continue; }
      vec(arrows[i], px, py, ux, uy, K * emag(d * ux, d * uy, B), d - QR - 3);
    }
    // q 處的電場：停下時送出的消息到了 q 之後，是靜止的 Q 在 XS 的電場；之前是等速前進的電場
    var reach = stop && Math.hypot(QX - XS, QY - Y) <= rs, ox = reach ? XS : xv, vx = QX - ox, vy = QY - Y, dq = Math.sqrt(vx * vx + vy * vy);
    var Lq = K * emag(vx, vy, reach ? 0 : B), R0 = 9, Ld = Math.min(Lq, 140);   // 箭頭從 q 的圓點外緣開始
    vec(qArrow, QX + (R0 + Ld) * vx / dq, QY + (R0 + Ld) * vy / dq, vx / dq, vy / dq, Lq, 140);
    q.setAttribute('cx', f(xq)); qt.setAttribute('x', f(xq));
    qn.setAttribute('x', f(xq - 35)); if (xq - XE > 70) show(qn); else hide(qn);
    if (stop) {
      hide(ua); hide(ul);
      // 停下時送出的消息前緣還沒包住整個畫面時，畫面上才有從 xv 放射的電場線，這時才標出 xv
      var out = rs < Math.max(Math.hypot(XS, Y), Math.hypot(W - XS, Y), Math.hypot(XS, H - Y), Math.hypot(W - XS, H - Y));
      if (out && xv - xq > 24 && xv < W + 12) { show(gh); gh.setAttribute('cx', f(xv)); } else hide(gh);
      if (out && xv - xq > 115 && xv + 68 < W) { show(gl); gl.setAttribute('x', f(xv - 75)); } else hide(gl);
    } else {
      hide(gh); hide(gl);
      var L = 18 + 60 * B;
      show(ua); seg(ua, xq + QR + 3, Y, xq + QR + 3 + L, Y); show(ul); ul.setAttribute('x', f(xq + QR + 3 + L / 2 - 20));
    }
    $('t').value = Math.round(s / smax() * 1000);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, last = 0;
  var bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * smax(); render(); });
  $('b').addEventListener('input', function (e) { var fr = s / smax(); B = +e.target.value; $('bo').innerHTML = B.toFixed(1) + ' <i>c</i>'; s = fr * smax(); render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('k').addEventListener('input', function (e) { mult = Math.pow(10, +e.target.value); $('ko').textContent = '×' + Math.round(mult); render(); });
  $('cf').addEventListener('change', function (e) { flines = e.target.checked; render(); });
  $('cr').addEventListener('change', function (e) { ring = e.target.checked; render(); });
  $('ci').addEventListener('change', function (e) { irings = e.target.checked; render(); });
  $('cs').addEventListener('change', function (e) { sring = e.target.checked; render(); });
  function loop(ts) {
    if (play && vis && ts - last > 33) { last = ts; s += 2 * spd; if (s > smax()) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 0.6 * smax();
  setPlay(play);
  render();
  requestAnimationFrame(loop);
  window.qu = { at: function (v) { setPlay(false); s = v * smax(); render(); }, play: function () { setPlay(true); } };
})();

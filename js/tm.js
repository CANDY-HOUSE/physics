/* 1.9 動畫：同一個 E、pc、mc² 直角三角形。
   第一段：pc 固定，底角從 26.6° 縮到 6°（mc² 相對於 E 很小很小，斜邊 E 貼近底邊 pc）。
   第二段：mc² 固定，左頂點一路往左跑到畫面外的無限遠處，E 與 pc 變成兩條平行線。
   第二段時，底邊與斜邊上出現刻度，位在 pc 長度的 1/2、1/4、1/8…處：pc 每長一倍，每個刻度就移到左邊那個刻度原本的位置，
   所以刻度從右端不斷冒出、越流越快地往左飛出畫面；畫面左緣用淡出，線條看起來沒有盡頭。
   左下角共用頂點的小三角形（斜邊 c）同時顯示 v 逼近 c；進入第二段前，它的標籤先淡出，三角形再跟著左頂點離開畫面。 */
(function () {
  var svg = document.getElementById('tm');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return svg.querySelector('.tm-' + k); }
  function f(n) { return n.toFixed(1); }
  function place(e, x, y, anchor) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f(anchor === 'end' ? x - w : anchor === 'center' ? x - w / 2 : x)); e.setAttribute('y', f(y - h / 2)); }
  function line(g, x1, y1, x2, y2, color, op) { var l = document.createElementNS(NS, 'line'); l.setAttribute('x1', f(x1)); l.setAttribute('y1', f(y1)); l.setAttribute('x2', f(x2)); l.setAttribute('y2', f(y2)); l.setAttribute('stroke', color); l.setAttribute('stroke-width', '1.6'); l.setAttribute('opacity', op.toFixed(2)); g.appendChild(l); }

  var AY = 260, BX = 520, PC = 400, C = 260, R = 40, L0 = 40, XL = -200;   // L0：E、pc 標籤取畫面內那一段的中點；XL：畫線時左端最多畫到這裡
  var T0 = Math.atan(0.5), T1 = 6 * Math.PI / 180, H1 = PC * Math.tan(T1), K = 1e6;
  var tk = $('tk');

  // ax：左頂點的 x；H：mc² 的高；fade：小三角形標籤的不透明度；tka：刻度的不透明度
  function draw(ax, H, fade, tka) {
    var th = Math.atan(H / (BX - ax)), s = Math.sin(th), co = Math.cos(th), tn = H / (BX - ax), TY = AY - H;
    var xl = Math.max(ax, XL), yl = AY - (xl - ax) * tn;           // 左頂點跑太遠時，只畫到 XL（畫面外），免得座標過大
    $('tri').setAttribute('points', f(xl) + ',' + f(yl) + ' ' + f(xl) + ',' + AY + ' ' + BX + ',' + AY + ' ' + BX + ',' + f(TY));
    $('hyp').setAttribute('x1', f(xl)); $('hyp').setAttribute('y1', f(yl)); $('hyp').setAttribute('y2', f(TY));
    var r = Math.min(24, H * 0.6);
    $('rt').setAttribute('points', f(BX - r) + ',' + AY + ' ' + f(BX - r) + ',' + f(AY - r) + ' ' + BX + ',' + f(AY - r));
    var near = ax > XL - C;                                         // 小三角形與角弧還沒完全離開畫面
    ['arc', 'sm', 'srt'].forEach(function (k) { $(k).setAttribute('visibility', near ? 'visible' : 'hidden'); });
    if (near) {
      $('arc').setAttribute('d', 'M' + f(ax + R) + ',' + AY + ' A' + R + ',' + R + ' 0 0 0 ' + f(ax + R * co) + ',' + f(AY - R * s));
      var sx = ax + C * co, sh = C * s, r2 = Math.min(12, sh * 0.5);
      $('sm').setAttribute('points', f(ax) + ',' + AY + ' ' + f(sx) + ',' + AY + ' ' + f(sx) + ',' + f(AY - sh));
      $('srt').setAttribute('points', f(sx - r2) + ',' + AY + ' ' + f(sx - r2) + ',' + f(AY - r2) + ' ' + f(sx) + ',' + f(AY - r2));
    }
    // 刻度：x = BX − (pc 長度)/2^j
    while (tk.firstChild) tk.removeChild(tk.firstChild);
    if (tka > 0) {
      var Lp = BX - ax;
      for (var j = 1; j < 60; j++) {
        var d = Lp / Math.pow(2, j), x = BX - d;
        if (d < 4) break;
        if (x < -10) continue;
        var op = tka * Math.min(1, (d - 4) / 26);
        line(tk, x, AY - 6, x, AY + 6, 'currentColor', 0.7 * op);
        var yh = AY - (x - ax) * tn;
        line(tk, x, yh - 6, x, yh + 6, '#e0a800', 0.85 * op);
      }
    }
    // 標籤：E、c 沿斜邊法線往外推；v 在角度變小時往右移，留在斜邊與底邊之間的空隙裡
    var u = Math.min(1, (T0 - th) / (T0 - T1));
    var xm = (Math.max(ax, L0) + BX) / 2, ym = AY - (xm - ax) * tn;
    place($('pc'), xm, AY + 35, 'center');
    place($('mc'), BX + 28, AY - H / 2 + 7, 'start');
    place($('E'), xm - 18 * s, ym - 18 * co, 'center');
    ['c', 'v', 'r'].forEach(function (k) { $(k).setAttribute('opacity', f(fade)); $(k).setAttribute('visibility', fade > 0 ? 'visible' : 'hidden'); });
    if (fade > 0) {
      var sx2 = ax + C * co, sh2 = C * s;
      place($('c'), ax + C / 2 * co - 22 * s, AY - C / 2 * s - 22 * co, 'center');
      place($('v'), ax + (0.5 + 0.35 * u) * C * co, AY - 8, 'center');
      place($('r'), sx2 + 10, AY - sh2 / 2 + 3, 'start');
    }
  }

  // 第一段：u 從 0 到 1，底角 T0 → T1，pc 固定
  function stageA(u, fade) { var th = T0 + (T1 - T0) * u; draw(BX - PC, PC * Math.tan(th), fade === undefined ? 1 : fade, 0); }
  // 第二段：w 從 0 到 1，mc² 固定為 H1，pc 的長度從 400 指數增長到 400·K，左頂點跑出畫面；刻度在一開始淡入
  function stageB(w) { draw(BX - PC * Math.pow(K, w), H1, 0, Math.min(1, w / 0.04)); }

  function ease(x) { return (1 - Math.cos(Math.PI * x)) / 2; }
  // 小三角形的標籤在第二段開始前淡出、回到 6° 後淡入，免得角度更小時擠進斜邊與底邊之間
  var SEG = [[1000, function () { stageA(0); }],
             [4000, function (x) { stageA(ease(x)); }],
             [1000, function (x) { stageA(1, 1 - x); }],
             [6500, function (x) { stageB(ease(x)); }],
             [2500, function () { stageB(1); }],
             [3000, function (x) { stageB(1 - ease(x)); }],
             [1000, function (x) { stageA(1, x); }],
             [3000, function (x) { stageA(1 - ease(x)); }]];
  var CYCLE = SEG.reduce(function (a, s) { return a + s[0]; }, 0);
  function frame(t) {
    t %= CYCLE;
    for (var i = 0; i < SEG.length; i++) { if (t < SEG[i][0]) return SEG[i][1](t / SEG[i][0]); t -= SEG[i][0]; }
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { stageB(1); return; }
  stageA(0);
  var vis = true, last = 0, clock = 0, prev = null;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function loop(ts) {
    if (prev === null) prev = ts;
    var dt = ts - prev; prev = ts;
    if (vis) { clock += dt; if (ts - last > 33) { last = ts; frame(clock); } }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

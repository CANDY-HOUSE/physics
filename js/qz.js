/* 3.9 動畫（等加速度來回幾次後停下）：地面基準＝q 基準，Q 以 u 等速前進，到 XD 開始以固定大小的加速度（地面基準 dv/dt）
   來回 K 次：速度 +u → −u → +u …，最後 +u → 0，停在 XS。
   電場線：Q 只沿水平線運動，電場對這條線旋轉對稱；一條電場線就是「各時刻 τ 在 Q 的瞬時靜止基準中以同一角度 θ' 送出」的點連成的線，
   τ 時刻送出的點此刻在 x(τ) + (s − τ)(cos θ, sin θ)，cos θ = (cos θ' + β)/(1 + β cos θ')。
   開始減速前送出的部分是直線，從「若未減速，Q 此刻的位置」放射；停下後送出的部分是直線，從 XS 放射。
   有自己的一組控制與迴圈。 */
(function () {
  var svg = document.getElementById('qz');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.qz-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var W = 680, H = 600, Y = 300, XE = 110, XS = 300, NL = 24, QR = 9, HI = 4, NC = 2400;   // NC：整段減速、來回期間的取樣數
  var B = 0.7, TH = 20, K = 3, gm = 1 / Math.sqrt(1 - B * B);
  var SEG = [];                                  // 每段：[時間長度, 開始時的速度, 結束時的速度]；加速度大小都是 2B/TH
  for (var k = 0; k < K; k++) SEG.push([TH, B, -B], [TH, -B, B]);
  SEG.push([TH / 2, B, 0]);
  var TD = 0, DX = 0;
  SEG.forEach(function (g) { TD += g[0]; DX += (g[1] + g[2]) / 2 * g[0]; });
  var XD = XS - DX, T1 = (XD - XE) / B, T2 = T1 + TD, SMAX = T2 + 460;   // 開始減速的位置、時刻；停下的時刻；動畫結束的時刻
  var TEAL = '#5CD0B3';
  var s = 0, spd = 0.5, fronts = true, others = false;

  function traj(t) {                             // 時刻 t 的位置與速度
    if (t <= T1) return [XE + B * t, B];
    if (t >= T2) return [XS, 0];
    var u = t - T1, x = XD;
    for (var i = 0; i < SEG.length; i++) {
      var d = SEG[i][0], v0 = SEG[i][1], v1 = SEG[i][2];
      if (u <= d) return [x + v0 * u + (v1 - v0) / (2 * d) * u * u, v0 + (v1 - v0) * u / d];
      x += (v0 + v1) / 2 * d; u -= d;
    }
    return [XS, 0];
  }
  function pt(t, c, sn) { var tr = traj(t), b = tr[1], dn = 1 + b * c, R = s - t; return [tr[0] + R * (c + b) / dn, Y - R * sn * Math.sqrt(1 - b * b) / dn]; }
  function path(i) {
    var th = (i + 0.5) * 2 * Math.PI / NL, c = Math.cos(th), sn = Math.sin(th), ang = Math.atan2(sn, c / gm), ca = Math.cos(ang), sa = Math.sin(ang);
    var xv = XE + B * s, far = 'L' + f(xv + 1200 * ca) + ',' + f(Y - 1200 * sa);   // 開始減速前送出的部分：從 xv 放射
    if (s <= T1) return 'M' + f(xv + 10 * ca) + ',' + f(Y - 10 * sa) + far;
    var d = '', te = Math.min(s - 8, T2);        // 曲線上最新的送出時刻（離 Q 至少 8 px）
    if (s > T2) { var rs = s - T2, r0 = Math.min(10, rs); d = 'M' + f(XS + r0 * c) + ',' + f(Y - r0 * sn) + 'L' + f(XS + rs * c) + ',' + f(Y - rs * sn); }
    if (te > T1) {
      var n = Math.max(2, Math.ceil((te - T1) / TD * NC));
      for (var j = 0; j <= n; j++) { var p = pt(te - (te - T1) * j / n, c, sn); d += (d ? 'L' : 'M') + f(p[0]) + ',' + f(p[1]); }
    } else { var p1 = pt(T1, c, sn); d = 'M' + f(p1[0]) + ',' + f(p1[1]); }
    return d + far;
  }

  var gL = $('lines'), lines = [];
  for (var i = 0; i < NL; i++) lines.push(i === HI ? null : el('path', { fill: 'none', stroke: TEAL, 'stroke-opacity': .3, 'stroke-width': 1.2 }, gL));
  var hl = $('hl'), dr = $('dring'), sr = $('sring'), gh = $('ghost'), gl = $('gl');
  var q = $('q'), qt = $('qt'), qn = $('qnow'), ua = $('u'), ul = $('ulab');
  function hide(e) { e.setAttribute('visibility', 'hidden'); }
  function show(e) { e.removeAttribute('visibility'); }
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }
  function cover(cx, r) { return r >= Math.max(Math.hypot(cx, Y), Math.hypot(W - cx, Y), Math.hypot(cx, H - Y), Math.hypot(W - cx, H - Y)); }   // 這一圈已包住整個畫面

  function render() {
    hl.setAttribute('d', path(HI));
    for (var i = 0; i < NL; i++) { if (!lines[i]) continue; if (others) { show(lines[i]); lines[i].setAttribute('d', path(i)); } else hide(lines[i]); }
    if (fronts && s > T1) { show(dr); dr.setAttribute('cx', f(XD)); dr.setAttribute('r', f(s - T1)); } else hide(dr);
    if (fronts && s > T2) { show(sr); sr.setAttribute('cx', XS); sr.setAttribute('r', f(s - T2)); } else hide(sr);
    var tr = traj(s), x = tr[0], b = tr[1], xv = XE + B * s;
    q.setAttribute('cx', f(x)); qt.setAttribute('x', f(x));
    qn.setAttribute('x', f(x - 35)); if (x - XE > 70) show(qn); else hide(qn);
    if (s <= T1) {                               // 速度箭頭只在等速前進時畫（與其他動畫相同）
      var L = 18 + 60 * B;
      show(ua); seg(ua, x + QR + 3, Y, x + QR + 3 + L, Y); show(ul); ul.setAttribute('x', f(x + QR + 3 + L / 2 - 20));
    } else { hide(ua); hide(ul); }
    // 開始減速時送出的消息前緣還沒包住整個畫面時，畫面上才有從 xv 放射的電場線，這時才標出 xv
    var out = s > T1 && !cover(XD, s - T1);
    if (out && xv - x > 24 && xv < W + 12) { show(gh); gh.setAttribute('cx', f(xv)); } else hide(gh);
    if (out && xv - x > 115 && xv + 68 < W) { show(gl); gl.setAttribute('x', f(xv - 75)); } else hide(gl);
    $('t').value = Math.round(s / SMAX * 1000);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, last = 0;
  var bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * SMAX; render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('cs').addEventListener('change', function (e) { fronts = e.target.checked; render(); });
  $('co').addEventListener('change', function (e) { others = e.target.checked; render(); });
  function loop(ts) {
    if (play && vis && ts - last > 33) { last = ts; s += 2 * spd; if (s > SMAX) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 0.75 * SMAX;
  setPlay(play);
  render();
  requestAnimationFrame(loop);
  window.qz = { at: function (v) { setPlay(false); s = v * SMAX; render(); }, play: function () { setPlay(true); } };
})();

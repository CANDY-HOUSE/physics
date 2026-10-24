/* 3.10 動畫：Jennifer 式換基準，在 (c·t, x, y) 空間裡分三段演出「1.4 矩陣的反矩陣 · 地基準矩陣 · 1.4 矩陣」。
   一開始是 q 基準的格線與速度那一欄（q 在 q 基準裡靜止，只有時間方向）。
   第一段（藍）：乘上 1.4 矩陣，把 q 基準換成地基準表達；第二段（紫）：乘上地基準矩陣；第三段（藍）：乘上反矩陣，換回 q 基準。
   最後出現虛線箭頭：直接用 q 基準矩陣算出來的結果，和三段走完的箭頭重合。
   數字用固定的例子：q 的速度 0.6c，地基準 E/c = (0.5, 0.8)，B_z = 0.7（只看 c·t、x、y 三個方向）。可拖曳旋轉視角，不設限制。 */
(function () {
  var svg = document.getElementById('tcb');
  if (!svg) return;
  var fig = svg.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.tcb-' + k); }
  var g = svg.querySelector('.tcb-g');
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || g).appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var BLUE = '#58C4DD', PURPLE = '#B189F5', C_X = '#83C167', C_Y = '#FC6255';
  var b = 0.6, gm = 1 / Math.sqrt(1 - b * b);
  var L = [[gm, gm * b, 0], [gm * b, gm, 0], [0, 0, 1]], Li = [[gm, -gm * b, 0], [-gm * b, gm, 0], [0, 0, 1]];
  var S = [[0, 0.5, 0.8], [0.5, 0, 0.7], [0.8, -0.7, 0]];
  var I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function mul(a, c) { var r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) r[i][j] += a[i][k] * c[k][j]; return r; }
  function mix(a, c, s) { return a.map(function (r, i) { return r.map(function (v, j) { return (1 - s) * v + s * c[i][j]; }); }); }
  function ap(m, p) { return [0, 1, 2].map(function (i) { return m[i][0] * p[0] + m[i][1] * p[1] + m[i][2] * p[2]; }); }
  var A = [I, L, mul(S, L), mul(Li, mul(S, L))];          // 累積的矩陣
  var U = [1, 0, 0];                                        // 速度那一欄（c = 1）
  var STEP = [null, { c: BLUE, t: '① 把 q 基準換成地基準表達' }, { c: PURPLE, t: '② 地基準已知的 linear transformation' }, { c: BLUE, t: '③ 換回 q 基準' }];

  var yaw = -0.9, pitch = 0.35, SC = 120, CX = 320, CY = 205;
  function pr(p) { var T = p[0], X = p[1], Y = p[2], cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = X * cy - Y * sy, y1 = X * sy + Y * cy; return [CX + x1 * SC, CY - (T * cp - y1 * sp) * SC]; }
  function seg(p, q, c, w, o, dash) { var a = pr(p), e = pr(q), at = { x1: f(a[0]), y1: f(a[1]), x2: f(e[0]), y2: f(e[1]), stroke: c, 'stroke-width': w, opacity: o, 'stroke-linecap': 'round' }; if (dash) at['stroke-dasharray'] = dash; el('line', at); }
  function arrow(v, c, w, label, dash) {
    var a = pr([0, 0, 0]), e = pr(v), dx = e[0] - a[0], dy = e[1] - a[1], n = Math.hypot(dx, dy);
    if (n < 2) return;
    var ux = dx / n, uy = dy / n, hl = Math.min(14, n * 0.4);
    var at = { x1: f(a[0]), y1: f(a[1]), x2: f(e[0] - ux * hl * 0.8), y2: f(e[1] - uy * hl * 0.8), stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' };
    if (dash) { at['stroke-dasharray'] = dash; at.fill = 'none'; }
    el('line', at);
    var pts = [e[0], e[1], e[0] - ux * hl - uy * hl * 0.45, e[1] - uy * hl + ux * hl * 0.45, e[0] - ux * hl + uy * hl * 0.45, e[1] - uy * hl - ux * hl * 0.45].map(f);
    el('polygon', dash ? { points: pts.join(' '), fill: 'none', stroke: c, 'stroke-width': 1.5 } : { points: pts.join(' '), fill: c });
    if (label) { var t = el('text', { x: f(e[0] + ux * 16), y: f(e[1] + uy * 16 + 5), fill: c, 'font-size': 14, 'text-anchor': 'middle', 'font-style': 'italic' }); t.textContent = label; }
  }

  function draw(M, stage, ghost) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var N = [-1, 0, 1];
    N.forEach(function (i) { N.forEach(function (j) {
      seg(ap(M, [i, j, -1]), ap(M, [i, j, 1]), 'currentColor', 1, 0.18);
      seg(ap(M, [i, -1, j]), ap(M, [i, 1, j]), 'currentColor', 1, 0.18);
      seg(ap(M, [-1, i, j]), ap(M, [1, i, j]), 'currentColor', 1, 0.18);
    }); });
    // c·t 的基底向量就是速度那一欄（q 靜止），由金色箭頭代表，不另外畫
    arrow(ap(M, [0, 1, 0]), C_X, 2.2, 'x'); arrow(ap(M, [0, 0, 1]), C_Y, 2.2, 'y');
    if (ghost) arrow(ap(A[3], U), 'currentColor', 2, null, '6 5');
    arrow(ap(M, U), '#F0AC5F', 4, 'c·t');
    var cap = $('cap'), st = STEP[stage];
    cap.textContent = st ? st.t : (ghost ? '虛線：直接用 q 基準矩陣算出的結果，兩者重合' : 'q 基準的格線與速度那一欄');
    cap.setAttribute('fill', st ? st.c : 'currentColor');
  }

  // 時間軸：停 1.2 秒 → 三段各 2.8 秒（段間停 1 秒）→ 結尾停 3 秒
  var HOLD0 = 1200, MOVE = 2800, GAP = 1000, END = 3000, CYCLE = HOLD0 + 3 * MOVE + 2 * GAP + END;
  function ease(x) { return (1 - Math.cos(Math.PI * x)) / 2; }
  function frame(t) {
    t = ((t % CYCLE) + CYCLE) % CYCLE;
    if (t < HOLD0) return draw(A[0], 0, false);
    t -= HOLD0;
    for (var k = 0; k < 3; k++) {
      if (t < MOVE) return draw(mix(A[k], A[k + 1], ease(t / MOVE)), k + 1, false);
      t -= MOVE;
      if (k < 2) { if (t < GAP) return draw(A[k + 1], k + 1, false); t -= GAP; }
    }
    return draw(A[3], 0, true);
  }

  var clock = 0, prev = null, last = 0, play = true, vis = true;
  var bp = $('play'), ti = $('t');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  bp.addEventListener('click', function () { setPlay(!play); });
  ti.addEventListener('input', function () { setPlay(false); clock = +ti.value / 1000 * (CYCLE - 1); frame(clock); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function loop(ts) {
    if (prev === null) prev = ts;
    var dt = ts - prev; prev = ts;
    if (play && vis) { clock += dt; if (ts - last > 33) { last = ts; frame(clock); ti.value = Math.round((clock % CYCLE) / CYCLE * 1000); } }
    requestAnimationFrame(loop);
  }
  // 拖曳旋轉（上下左右都不設限）
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; drag = [e.clientX, e.clientY, yaw, pitch]; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
  svg.addEventListener('pointermove', function (e) { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.01; pitch = drag[3] + (e.clientY - drag[1]) * 0.01; frame(clock); });
  function end() { drag = null; svg.style.cursor = 'grab'; }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (k) { svg.addEventListener(k, end); });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  frame(0);
  if (reduce) { setPlay(false); clock = CYCLE - 1; frame(clock); }
  requestAnimationFrame(loop);
})();

/* 3.10 動畫：地基準矩陣（頂列與首欄都是 E/c，B 那塊反對稱）左乘 1.4 矩陣的反矩陣、右乘 1.4 矩陣。
   q 的速度從 0 慢慢加大，矩陣的數字跟著變；first row（青）與 first column（青）始終相同，B 那塊（金）始終反對稱。
   數字用固定的例子：E/c = (0.5, 0.8, −0.4)，B = (0.3, −0.6, 0.7)。 */
(function () {
  var svg = document.getElementById('tsy');
  if (!svg) return;
  var fig = svg.closest('figure'), NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.tsy-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }

  var TEAL = '#5CD0B3', GOLD = '#F0AC5F';
  var E = [0.5, 0.8, -0.4], B = [0.3, -0.6, 0.7];
  var S = [[0, E[0], E[1], E[2]], [E[0], 0, B[2], -B[1]], [E[1], -B[2], 0, B[0]], [E[2], B[1], -B[0], 0]];
  var X0 = 190, Y0 = 66, CW = 96, CH = 50;            // 第一格的中心、格寬、格高

  function mul(a, b) { var r = []; for (var i = 0; i < 4; i++) { r.push([]); for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[i][k] * b[k][j]; r[i].push(s); } } return r; }
  function L(beta, sign) { var g = 1 / Math.sqrt(1 - beta * beta), h = sign * g * beta; return [[g, h, 0, 0], [h, g, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; }

  // 不動的部分：括號、對角虛線、first row／first column 的標籤
  var left = X0 - CW / 2 - 8, right = X0 + 3.5 * CW + 8, top = Y0 - CH / 2 - 6, bot = Y0 + 3.5 * CH + 6;
  el('path', { d: 'M' + (left + 12) + ',' + top + ' Q' + (left - 6) + ',' + ((top + bot) / 2) + ' ' + (left + 12) + ',' + bot, fill: 'none', stroke: 'currentColor', 'stroke-width': 2 });
  el('path', { d: 'M' + (right - 12) + ',' + top + ' Q' + (right + 6) + ',' + ((top + bot) / 2) + ' ' + (right - 12) + ',' + bot, fill: 'none', stroke: 'currentColor', 'stroke-width': 2 });
  el('line', { x1: X0 - CW / 2 + 6, y1: Y0 - CH / 2 + 4, x2: X0 + 3.5 * CW - 6, y2: Y0 + 3.5 * CH - 4, stroke: 'currentColor', 'stroke-width': 1, 'stroke-dasharray': '5 5', opacity: .35 });
  var tr = el('text', { x: X0 + 1.5 * CW, y: Y0 - CH / 2 - 16, fill: TEAL, 'font-size': 14, 'text-anchor': 'middle' }); tr.textContent = 'first row';
  var tc = el('text', { x: left - 22, y: Y0 + 1.5 * CH, fill: TEAL, 'font-size': 14, 'text-anchor': 'middle', transform: 'rotate(-90 ' + (left - 22) + ' ' + (Y0 + 1.5 * CH) + ')' }); tc.textContent = 'first column';
  var cells = [];
  for (var i = 0; i < 4; i++) { cells.push([]); for (var j = 0; j < 4; j++) {
    var c = i === j ? 'currentColor' : (i === 0 || j === 0) ? TEAL : GOLD;
    var t = el('text', { x: X0 + j * CW, y: Y0 + i * CH + 6, fill: c, 'font-size': 19, 'text-anchor': 'middle', 'font-variant-numeric': 'tabular-nums', opacity: i === j ? .55 : 1 });
    cells[i].push(t);
  } }

  function draw(beta) {
    var M = mul(mul(L(beta, -1), S), L(beta, 1));
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var v = Math.abs(M[i][j]) < 5e-4 ? 0 : M[i][j];
      cells[i][j].textContent = (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
    }
    $('bo').textContent = beta.toFixed(2) + 'c';
  }

  var beta = 0, play = true, t0 = null, vis = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bp = $('play'), bi = $('b');
  function setPlay(p) { play = p; t0 = null; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  bp.addEventListener('click', function () { setPlay(!play); });
  bi.addEventListener('input', function () { setPlay(false); beta = +bi.value; draw(beta); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  // 播放：0 → 0.85 → 0 來回，每段 4 秒，兩端各停 1 秒
  var PER = 10000;
  function phase(t) { t %= PER; if (t < 1000) return 0; t -= 1000; if (t < 4000) return 0.85 * (1 - Math.cos(Math.PI * t / 4000)) / 2; t -= 4000; if (t < 1000) return 0.85; t -= 1000; return 0.85 * (1 + Math.cos(Math.PI * t / 4000)) / 2; }
  var clock = 0, prev = null, last = 0;
  function loop(ts) {
    if (prev === null) prev = ts;
    var dt = ts - prev; prev = ts;
    if (play && vis) { clock += dt; if (ts - last > 33) { last = ts; beta = phase(clock); bi.value = beta.toFixed(2); draw(beta); } }
    requestAnimationFrame(loop);
  }
  draw(0);
  if (reduce) setPlay(false);
  requestAnimationFrame(loop);
})();

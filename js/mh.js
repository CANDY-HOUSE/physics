/* 3.11 動畫：空洞的接力。Q 先把最近的電子吸到表面，原處留下空洞；
   稍遠的電子被 Q 與空洞同時吸引而來補（多出的電子比空洞遠，排斥較弱），空洞一路移到遠離 Q 的表面。
   每一步開頭畫出移動電子所受的力：取 Q = 100e，箭頭長度依 Coulomb 定律（距離以 SVG 單位計）。 */
(function () {
  var svg = document.getElementById('mh');
  if (!svg) return;
  var fig = svg.closest('figure');
  function $(k) { return fig.querySelector('.mh-' + k); }
  function f1(n) { return n.toFixed(1); }
  var hyp = Math.hypot, TP = 2 * Math.PI;
  var W = 680, H = 360, C = [440, 190], QP = [96, 190], QE = 100;
  var RED = '#FC6255', BLU = '#58C4DD', GLD = '#F0AC5F', PNK = '#DC75CD', DIM = 0.38;

  function rb(ph) { return 148 * (1 + 0.16 * Math.cos(2 * ph - 0.5) + 0.10 * Math.sin(3 * ph + 0.3) + 0.05 * Math.cos(5 * ph)); }
  function bp(ph) { return [C[0] + rb(ph) * Math.cos(ph), C[1] - rb(ph) * Math.sin(ph)]; }
  function inside(p) { return hyp(p[0] - C[0], C[1] - p[1]) < rb(Math.atan2(C[1] - p[1], p[0] - C[0])); }
  var fine = [];
  for (var i = 0; i < 1200; i++) fine.push(bp(TP * i / 1200));
  function distB(p) { var m = 1e9; fine.forEach(function (q) { m = Math.min(m, hyp(p[0] - q[0], p[1] - q[1])); }); return m; }

  var sp = 26, dyR = sp * Math.sqrt(3) / 2, sites = [];
  for (var r = -8; r <= 8; r++) for (var c = -9; c <= 9; c++) {
    var p = [C[0] + c * sp + (r & 1 ? sp / 2 : 0), C[1] + r * dyR];
    if (inside(p) && distB(p) >= 9) sites.push({ p: p, r: r });
  }
  var chain = sites.filter(function (o) { return o.r === 0; }).sort(function (a, b) { return a.p[0] - b.p[0]; });
  var N = chain.length;
  var XL = bp(Math.PI), X = [XL[0] + 4, XL[1]];               // 被吸到表面的那一顆電子
  function eP(o) { return [o.p[0] + 4.5, o.p[1]]; }
  function iP(o) { return [o.p[0] - 4.5, o.p[1]]; }

  function pull(p, to, q) { var dx = to[0] - p[0], dy = to[1] - p[1], d = hyp(dx, dy), k = q / (d * d * d); return [k * dx, k * dy]; }
  function forces(e, h) {
    var a = pull(e, QP, QE), b = h ? pull(e, iP(h), 1) : [0, 0], x = h ? pull(e, X, -1) : [0, 0];
    return { a: a, b: b, c: x, n: [a[0] + b[0] + x[0], a[1] + b[1] + x[1]] };
  }
  var K = 0;
  for (var k = 0; k < N; k++) {
    var F = forces(eP(chain[k]), k ? chain[k - 1] : null);
    [F.a, F.b, F.c, F.n].forEach(function (v) { K = Math.max(K, hyp(v[0], v[1])); });
  }
  K = 92 / K;

  function arrow(a, b, col, w) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = hyp(dx, dy);
    if (len < 3) return '';
    var ux = dx / len, uy = dy / len, h = Math.min(10, len * 0.55), bx = b[0] - ux * h, by = b[1] - uy * h, q = h * 0.42;
    return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(bx) + '" y2="' + f1(by) + '" stroke="' + col + '" stroke-width="' + w + '"/>' +
      '<polygon points="' + f1(b[0]) + ',' + f1(b[1]) + ' ' + f1(bx - uy * q) + ',' + f1(by + ux * q) + ' ' + f1(bx + uy * q) + ',' + f1(by - ux * q) + '" fill="' + col + '"/>';
  }
  function txt(x, y, t, col, sz, op) {
    return '<text x="' + f1(x) + '" y="' + f1(y) + '" dominant-baseline="central" font-size="' + sz + '" fill="' + col + '"' + (op < 1 ? ' fill-opacity="' + op + '"' : '') + '>' + t + '</text>';
  }
  function glyph(p, ch, col, sz, op) {
    return '<text x="' + f1(p[0]) + '" y="' + f1(p[1]) + '" text-anchor="middle" dominant-baseline="central" font-size="' + sz + '" font-weight="500" fill="' + col + '"' + (op < 1 ? ' opacity="' + op.toFixed(2) + '"' : '') + '>' + ch + '</text>';
  }
  function ring(p, op) {
    if (op <= 0.01) return '';
    return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="10" fill="none" stroke="' + PNK + '" stroke-width="1.6" stroke-dasharray="3 2.5"' + (op < 1 ? ' opacity="' + op.toFixed(2) + '"' : '') + '/>';
  }

  // 標籤擺放：避開已放好的標籤，並留在圖框內
  var placed = [];
  function tw(t, sz) { return Array.from(t).reduce(function (a, ch) { return a + (ch.charCodeAt(0) > 255 ? 1 : 0.58); }, 0) * sz; }
  var CAND = [[0, 0], [0, 14], [0, -14], [0, 28], [0, -28], [0, 42], [0, -42]];
  [-50, 50, -100, 100].forEach(function (d) { [0, 14, -14, 28].forEach(function (t) { CAND.push([d, t]); }); });
  function spot(x, y, w, h, anc) {
    var x0 = anc === 'end' ? x - w : anc === 'middle' ? x - w / 2 : x, best = null, bo = 1e18;
    function ov(a, b) { return placed.reduce(function (s2, q) { return s2 + Math.max(0, Math.min(a + w, q[2]) - Math.max(a, q[0])) * Math.max(0, Math.min(b + h / 2, q[3]) - Math.max(b - h / 2, q[1])); }, 0); }
    for (var i = 0; i < CAND.length; i++) {
      var a = Math.max(4, Math.min(W - 4 - w, x0 + CAND[i][0])), b = Math.max(h / 2 + 2, Math.min(H - h / 2 - 2, y + CAND[i][1])), o = ov(a, b);
      if (o < bo) { bo = o; best = [a, b]; }
      if (o === 0) break;
    }
    placed.push([best[0], best[1] - h / 2, best[0] + w, best[1] + h / 2]);
    return best;
  }
  function put(x, y, t, col, anc, sz, op) { sz = sz || 12.5; var b = spot(x, y, tw(t, sz), sz + 4, anc); return txt(b[0], b[1], t, col, sz, op === undefined ? 1 : op); }

  var dyn = $('dyn'), la = $('la'), LAW = 52;
  function stack(e, Fs, showH) {
    var L = hyp(Fs.a[0], Fs.a[1]), u = [Fs.a[0] / L, Fs.a[1] / L], nv = [-u[1], u[0]];
    if (nv[1] > 0) nv = [-nv[0], -nv[1]];
    function row(d, v, col, w, t) {
      var o = [e[0] + nv[0] * d, e[1] + nv[1] * d], tp = [o[0] + v[0] * K, o[1] + v[1] * K], l = hyp(v[0], v[1]) * K;
      if (l < 3) return '';
      var ux = v[0] * K / l, lx = tp[0] + (ux < 0 ? -6 : 6), anc = ux < 0 ? 'end' : 'start';
      if (t === null) { var b = spot(lx, tp[1], LAW, 18, anc); la.setAttribute('x', f1(b[0])); la.setAttribute('y', f1(b[1] - 10)); la.setAttribute('visibility', 'visible'); return arrow(o, tp, col, w); }
      return arrow(o, tp, col, w) + put(lx, tp[1], t, col, anc);
    }
    var out = row(16, Fs.a, GLD, 2.2, null);
    if (showH) out += row(31, Fs.b, PNK, 2.2, '空洞的吸引') + row(46, Fs.c, BLU, 2.2, '多出的電子的力');
    return out + row(-18, Fs.n, 'currentColor', 2.6, '合力');
  }

  var blob = '<path d="M' + fine.filter(function (_, i) { return i % 3 === 0; }).map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join('L') + 'Z" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/>' +
    '<circle cx="' + QP[0] + '" cy="' + QP[1] + '" r="12" fill="' + RED + '"/>' + glyph(QP, '+', '#fff', 16, 1);
  var lq = $('lq'); lq.setAttribute('x', QP[0] - 12); lq.setAttribute('y', QP[1] - 38);

  function render(s) {
    var k = Math.min(N, Math.floor(s + 1e-9)), t = s - k, o = blob;
    placed = [[QP[0] - 16, QP[1] - 38, QP[0] + 16, QP[1] + 14]];
    la.setAttribute('visibility', 'hidden');
    sites.forEach(function (c) {
      var j = chain.indexOf(c), op = j < 0 ? DIM : 1;
      o += glyph(iP(c), '+', RED, 14, op);
      if (j < 0) o += glyph(eP(c), '−', BLU, 15, op);
    });
    for (var j = 0; j < N; j++) {
      var a = eP(chain[j]), d = j === 0 ? X : eP(chain[j - 1]), q = k > j ? d : k === j ? [a[0] + (d[0] - a[0]) * t, a[1] + (d[1] - a[1]) * t] : a;
      o += glyph(q, '−', BLU, 15, 1);
    }
    if (k >= 1) o += ring(chain[k - 1].p, k < N ? 1 - t : 1);
    if (k < N && (k >= 1 || t > 0)) o += ring(chain[k].p, t);
    if (s >= 1) o += put(X[0] - 14, X[1] + 22, '多出的電子', 'currentColor', 'end', 12.5, 0.75);
    if (k < N && t < 1e-9) {
      var e = eP(chain[k]);
      o += '<circle cx="' + f1(e[0]) + '" cy="' + f1(e[1]) + '" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/>';
      o += stack(e, forces(e, k ? chain[k - 1] : null), k > 0);
    }
    if (k === N) { var hp = chain[N - 1].p; o += put(hp[0] + 14, hp[1] + 30, '外側沒有電子可補：空洞停住', PNK, 'middle', 13); }
    dyn.innerHTML = o;
  }

  // 播放：每一步開頭停 0.9 秒（畫出受力），再移動；走完停 2.5 秒後重來
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, s = 0, hold = 900, last = null, tFix = null, bp_ = $('play'), sl = $('t');
  function setPlay(v) { play = v; bp_.setAttribute('aria-label', v ? '暫停' : '播放'); bp_.querySelector('.ic-pause').style.display = v ? '' : 'none'; bp_.querySelector('.ic-play').style.display = v ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp_.addEventListener('click', function () { if (!play && s >= N) { s = 0; hold = 900; } setPlay(!play); });
  sl.addEventListener('input', function (ev) { setPlay(false); s = +ev.target.value / 1000 * N; render(s); });
  function loop(now) {
    var dt = last === null ? 0 : now - last; last = now;
    if (tFix === null && play && vis) {
      if (hold > 0) hold -= dt;
      else if (s >= N) { s = 0; hold = 900; render(s); sl.value = 0; }
      else {
        var ns = s + dt / 1000 * 1.4, nk = Math.floor(s + 1e-9) + 1;
        if (ns >= nk) { s = nk; hold = s >= N ? 2500 : 900; } else s = ns;
        render(s); sl.value = Math.round(s / N * 1000);
      }
    }
    requestAnimationFrame(loop);
  }
  if (!play) s = 3;
  setPlay(play);
  render(s); sl.value = Math.round(s / N * 1000);
  requestAnimationFrame(loop);
  window.mh = { at: function (v) { tFix = v; render(v); }, play: function () { tFix = null; } };
})();

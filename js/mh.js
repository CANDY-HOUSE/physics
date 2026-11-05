/* 3.11 動畫：空洞的接力（一條車道接一條車道）。兩張圖共用：#mh（實心金屬）與 #mh2（中間挖掉大洞，data-cavity = 洞的半徑）。
   第 1 條車道：Q 先把最近的電子吸到表面，原處留下空洞；稍遠的電子移入空洞，空洞一路移到遠離 Q 的表面。
   車道是一串相鄰的格點；碰到大洞時沿洞壁繞過去（上半的車道從上方繞，下半的從下方繞），所以電子從右邊繞大洞過來。
   移動途中：左右兩個空洞的吸引互相抵銷，上下的正離子也互相抵銷（放大圖）；只剩 Q 的吸引與殼上電荷（多出的電子、空洞）的斥力。
   只要 Q 的吸引較大，隔壁車道就再有一顆電子被吸過來，直到兩者相等。
   取：殼上的電荷按同一比例增加，所以殼上電荷的斥力 = 比例 ×（−Q 的吸引），金屬內每一處皆然。 */
(function () {
  function setup(svg) {
    var fig = svg.closest('figure');
    function $(k) { return fig.querySelector('.mh-' + k); }
    function f1(n) { return n.toFixed(1); }
    var hyp = Math.hypot, TP = 2 * Math.PI;
    var W = 680, H = 360, C = [440, 190], QP = [96, 190], CAV = +(svg.getAttribute('data-cavity') || 0);
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
      if (inside(p) && distB(p) >= 9 && (!CAV || hyp(p[0] - C[0], p[1] - C[1]) >= CAV + 9)) sites.push({ p: p, r: r });
    }
    function eP(o) { return [o.p[0] + 4.5, o.p[1]]; }
    function iP(o) { return [o.p[0] - 4.5, o.p[1]]; }
    function lerp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }

    // 車道：中間一條，接著上下隔壁的車道輪流；從該列最左的格點走到最右的格點（相鄰格點相連，碰到大洞就沿洞壁繞）
    // 最短路徑；步數相同時，盡量貼著自己那一列（只在碰到大洞的地方離開，緊貼洞壁繞過，再回到原來那一列）
    function route(a, b, up, rowY) {
      var ok = function (o) { return up ? o.p[1] <= C[1] + 0.5 : o.p[1] >= C[1] - 0.5; };
      var dist = new Map([[a, 0]]), prev = new Map([[a, null]]), open = [a], done = new Set();
      while (open.length) {
        open.sort(function (x, y) { return dist.get(x) - dist.get(y); });
        var u = open.shift();
        if (done.has(u)) continue;
        done.add(u);
        if (u === b) break;
        sites.forEach(function (v) {
          if (done.has(v) || !ok(v) || hyp(v.p[0] - u.p[0], v.p[1] - u.p[1]) >= sp * 1.05) return;
          var nd = dist.get(u) + 1 + 0.001 * Math.abs(v.p[1] - rowY);
          if (!dist.has(v) || nd < dist.get(v)) { dist.set(v, nd); prev.set(v, u); open.push(v); }
        });
      }
      var path = [];
      for (var v = b; v; v = prev.get(v)) path.unshift(v);
      return path;
    }
    var LANES = [0, -1, 1, -2, 2], NF = LANES.length;
    var lanes = LANES.map(function (rr) {
      var row = sites.filter(function (o) { return o.r === rr; }).sort(function (a, b) { return a.p[0] - b.p[0]; });
      var y = C[1] + rr * dyR, x = row[0].p[0], path = route(row[0], row[row.length - 1], rr <= 0, y);
      while (inside([x - 0.5, y])) x -= 0.5;
      path.forEach(function (o) { o.lane = true; });
      return { P: path, X: [x + 4, y], N: path.length };
    });
    var starts = [], STOT = 0;
    lanes.forEach(function (L) { starts.push(STOT); STOT += L.N; });
    var TS = 22 / 26;                                   // 水平移動時，電子恰在兩個正離子正中間的時刻
    var hopPause = !CAV;                                // 實心金屬：第 1 條車道每次移到正中間時停下
    function fQ(p) { var dx = QP[0] - p[0], dy = QP[1] - p[1], d = hyp(dx, dy), k = 1 / (4 * Math.PI * d * d * d); return [k * dx, k * dy]; }
    var K = 0;
    lanes.forEach(function (L, q) {
      K = Math.max(K, hyp.apply(null, fQ(eP(L.P[0]))));
      if (q === 0) for (var j = 1; j < L.N; j++) K = Math.max(K, hyp.apply(null, fQ(lerp(eP(L.P[j]), eP(L.P[j - 1]), TS))));
    });
    K = 84 / K;                                         // 固定比例：Q 的吸引隨距離變小

    function arrow(a, b, col, w) {
      var dx = b[0] - a[0], dy = b[1] - a[1], len = hyp(dx, dy);
      if (len < 3) return '';
      var ux = dx / len, uy = dy / len, h = Math.min(10, len * 0.55), bx = b[0] - ux * h, by = b[1] - uy * h, q = h * 0.42;
      return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(bx) + '" y2="' + f1(by) + '" stroke="' + col + '" stroke-width="' + w + '"/>' +
        '<polygon points="' + f1(b[0]) + ',' + f1(b[1]) + ' ' + f1(bx - uy * q) + ',' + f1(by + ux * q) + ' ' + f1(bx + uy * q) + ',' + f1(by - ux * q) + '" fill="' + col + '"/>';
    }
    function txt(x, y, t, col, sz, op, anc) {
      return '<text x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + (anc || 'start') + '" dominant-baseline="central" font-size="' + sz + '" fill="' + col + '"' + (op < 1 ? ' fill-opacity="' + op + '"' : '') + '>' + t.replace(/(^|[^A-Za-z])Q(?![A-Za-z])/g, '$1<tspan font-style="italic" font-family="Times New Roman, serif">Q</tspan>') + '</text>';
    }
    function glyph(p, ch, col, sz, op) {
      return '<text x="' + f1(p[0]) + '" y="' + f1(p[1]) + '" text-anchor="middle" dominant-baseline="central" font-size="' + sz + '" font-weight="500" fill="' + col + '"' + (op < 1 ? ' opacity="' + op.toFixed(2) + '"' : '') + '>' + ch + '</text>';
    }
    function ring(p, rr) { return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (rr || 10) + '" fill="none" stroke="' + PNK + '" stroke-width="1.6" stroke-dasharray="3 2.5"/>'; }

    // 標籤擺放：避開已放好的標籤與箭頭，並留在圖框內
    var placed = [];
    function tw(t, sz) { return Array.from(t).reduce(function (a, ch) { return a + (ch.charCodeAt(0) > 255 ? 1 : 0.58); }, 0) * sz; }
    var CAND = [[0, 0], [0, 14], [0, -14], [0, 28], [0, -28], [0, 42], [0, -42]];
    [-50, 50, -100, 100].forEach(function (d) { [0, 14, -14, 28].forEach(function (t) { CAND.push([d, t]); }); });
    [[0, 56], [0, -56], [0, 70], [0, -70]].forEach(function (c) { CAND.push(c); });
    [-25, 25, -75, 75, -150, 150].forEach(function (d) { [0, 14, -14, 28, -28, 42, -42].forEach(function (t) { CAND.push([d, t]); }); });
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
    function putFO(el, x, y, w, anc) { var b = spot(x, y, w, 18, anc); el.setAttribute('x', f1(b[0])); el.setAttribute('y', f1(b[1] - 10)); el.setAttribute('visibility', 'visible'); }

    var dyn = $('dyn'), la = $('la');
    // 移動中的電子所受的力：Q 的吸引、殼上電荷（多出的電子與空洞）的斥力 = −比例 × Q 的吸引、合力；太短（< 3）的箭頭不畫
    function stack(e, frac, netLab) {
      var a = fQ(e), L = hyp(a[0], a[1]), u = [a[0] / L, a[1] / L], nv = [-u[1], u[0]];
      if (nv[1] > 0) nv = [-nv[0], -nv[1]];
      var out = '', rows = [];
      function row(d, v, col, w, lab) {
        var o = [e[0] + nv[0] * d, e[1] + nv[1] * d], tp = [o[0] + v[0] * K, o[1] + v[1] * K], l = hyp(v[0], v[1]) * K;
        if (l >= 3) rows.push({ o: o, tp: tp, col: col, w: w, lab: lab, ux: v[0] * K / l });
      }
      row(16, a, GLD, 2.2, null);
      row(31, [-a[0] * frac, -a[1] * frac], BLU, 2.2, '殼上電荷的斥力');
      row(-18, [a[0] * (1 - frac), a[1] * (1 - frac)], 'currentColor', 2.6, netLab);
      placed.push([e[0] - 9, e[1] - 9, e[0] + 9, e[1] + 9]);
      rows.forEach(function (r) {
        out += arrow(r.o, r.tp, r.col, r.w);
        placed.push([Math.min(r.o[0], r.tp[0]), Math.min(r.o[1], r.tp[1]) - 5, Math.max(r.o[0], r.tp[0]), Math.max(r.o[1], r.tp[1]) + 5]);
      });
      var net = false;
      rows.forEach(function (r) {
        var lx = r.tp[0] + (r.ux < 0 ? -6 : 6), anc = r.ux < 0 ? 'end' : 'start';
        if (r.lab === null) putFO(la, lx, r.tp[1], 52, anc);
        else { out += put(lx, r.tp[1], r.lab, r.col, anc); if (r.lab === netLab) net = true; }
      });
      if (!net) out += put(e[0], e[1] - 22, netLab, 'currentColor', 'middle', 13);
      return out;
    }
    // 放大圖（一直顯示）：只畫移動中電子四周的正離子；電子恰在兩個空洞正中間，左右互相抵銷，上下互相抵銷
    var IN = [16, 10, 262, 138], IC = [120, 80], SC = 31 / 13;
    function inset(e) {
      var o = '<rect x="' + IN[0] + '" y="' + IN[1] + '" width="' + IN[2] + '" height="' + IN[3] + '" rx="8" fill="none" stroke="currentColor" stroke-opacity=".3"/>';
      o += txt(IN[0] + IN[2] - 8, IN[1] + 12, '放大：四周的正離子', 'currentColor', 12, 0.6, 'end');
      if (e) o += '<line x1="' + (IN[0] + IN[2]) + '" y1="' + (IN[1] + IN[3] - 14) + '" x2="' + f1(e[0] - 9) + '" y2="' + f1(e[1] + 6) + '" stroke="currentColor" stroke-opacity=".35" stroke-width=".8" stroke-dasharray="2 2"/>';
      var dl = 13 * SC, du = dyR * SC, lr = 24, ud = lr * (13 / dyR) * (13 / dyR);
      o += glyph([IC[0] - dl, IC[1]], '+', RED, 18, 1) + ring([IC[0] - dl, IC[1]], 12);
      o += glyph([IC[0] + dl, IC[1]], '+', RED, 18, 1) + ring([IC[0] + dl, IC[1]], 12);
      o += glyph([IC[0], IC[1] - du], '+', RED, 18, 1) + glyph([IC[0], IC[1] + du], '+', RED, 18, 1);
      o += glyph(IC, '−', BLU, 19, 1);
      o += arrow([IC[0] - 6, IC[1]], [IC[0] - 6 - lr, IC[1]], PNK, 2) + arrow([IC[0] + 6, IC[1]], [IC[0] + 6 + lr, IC[1]], PNK, 2);
      o += arrow([IC[0], IC[1] - 7], [IC[0], IC[1] - 7 - ud], RED, 2) + arrow([IC[0], IC[1] + 7], [IC[0], IC[1] + 7 + ud], RED, 2);
      o += txt(IC[0], IC[1] + 26, '左右兩個空洞的吸引互相抵銷', PNK, 12, 1, 'middle');
      o += txt(IC[0] + 18, IC[1] - 38, '上下兩個正離子的吸引', RED, 12, 1, 'start') + txt(IC[0] + 18, IC[1] - 22, '互相抵銷', RED, 12, 1, 'start');
      return o;
    }

    var outline = 'M' + fine.filter(function (_, i) { return i % 3 === 0; }).map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join('L') + 'Z';
    if (CAV) outline += 'M' + (C[0] + CAV) + ',' + C[1] + 'A' + CAV + ',' + CAV + ' 0 1,0 ' + (C[0] - CAV) + ',' + C[1] + 'A' + CAV + ',' + CAV + ' 0 1,0 ' + (C[0] + CAV) + ',' + C[1] + 'Z';
    var blob = '<path d="' + outline + '" fill="currentColor" fill-opacity=".06" fill-rule="evenodd" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/>' +
      '<circle cx="' + QP[0] + '" cy="' + QP[1] + '" r="12" fill="' + RED + '"/>' + glyph(QP, '+', '#fff', 16, 1);
    var lq = $('lq'); lq.setAttribute('x', QP[0] - 12); lq.setAttribute('y', QP[1] - 38);

    function locate(s) {
      if (s >= STOT - 1e-9) return { r: NF, j: 0, t: 0, end: true };
      var q = 0;
      while (q < NF - 1 && s >= starts[q + 1] - 1e-9) q++;
      var u = s - starts[q], j = Math.floor(u + 1e-9);
      return { r: q, j: j, t: Math.max(0, u - j) };
    }

    function render(s) {
      var st = locate(s), o = blob, extra = [], holes = [];
      placed = [[QP[0] - 16, QP[1] - 38, QP[0] + 16, QP[1] + 14]];
      la.setAttribute('visibility', 'hidden');
      // 每個格點有沒有電子：走完的車道，終點留下空洞；目前車道走到第 j 步
      var empty = new Set(), done = st.end ? NF : st.r, curP = st.end ? null : lanes[st.r].P, j = st.j, t = st.t;
      for (var q = 0; q < done; q++) { empty.add(lanes[q].P[lanes[q].N - 1]); extra.push(lanes[q].X); holes.push(lanes[q].P[lanes[q].N - 1]); }
      var mov = null, from = null, to = null;
      if (curP) {
        if (hopPause && st.r === 0 && j >= 1 && Math.abs(t - TS) < 0.004) t = TS;
        from = curP[j]; to = j === 0 ? lanes[st.r].X : eP(curP[j - 1]);
        mov = lerp(eP(from), to, t);
        empty.add(from);
        if (j >= 1) { empty.add(curP[j - 1]); extra.push(lanes[st.r].X); }
      }
      var onCur = new Set(curP || []), ends = new Set(holes);
      sites.forEach(function (c) {
        var hi = onCur.has(c);
        o += glyph(iP(c), '+', RED, 14, hi || ends.has(c) ? 1 : DIM);
        if (!empty.has(c)) o += glyph(eP(c), '−', BLU, 15, hi || (st.end && c === lanes[0].P[0]) ? 1 : DIM);
      });
      extra.forEach(function (x) { o += glyph(x, '−', BLU, 15, 1); });
      if (mov) o += glyph(mov, '−', BLU, 15, 1);
      holes.forEach(function (c) { o += ring(iP(c)); });
      if (curP) {
        if (j >= 1) o += ring(iP(curP[j - 1]));
        if (t > 0) o += ring(iP(from));
      }
      if (CAV) o += txt(C[0], C[1] - (st.end ? 9 : 0), '挖掉的大洞', 'currentColor', 12.5, 0.6, 'middle') + (st.end ? txt(C[0], C[1] + 9, '洞壁上沒有電荷', 'currentColor', 12.5, 0.85, 'middle') : '');
      if (CAV) placed.push([C[0] - CAV, C[1] - 18, C[0] + CAV, C[1] + 18]);
      var frac = st.end ? 1 : (st.r + (j + st.t) / lanes[st.r].N) / NF, so = '';
      placed.push([IN[0], IN[1], IN[0] + IN[2], IN[1] + IN[3]]);
      so += inset(mov);
      if (mov) {
        so += '<circle cx="' + f1(mov[0]) + '" cy="' + f1(mov[1]) + '" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/>';
        so += stack(mov, frac, '合力：還吸得動');
      } else {
        var e = eP(lanes[0].P[0]);
        so += '<circle cx="' + f1(e[0]) + '" cy="' + f1(e[1]) + '" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/>';
        so += stack(e, 1, '合力 = 0：吸不動');
      }
      if (curP) { var le = iP(curP[curP.length - 1]); o += put(le[0] + 4, le[1] - 15, st.r === 0 ? '第 1 條車道' : '隔壁車道', 'currentColor', 'end', 12, 0.75); }
      if (extra.length) { var lo = extra.reduce(function (a, b) { return b[1] > a[1] ? b : a; }); o += put(lo[0] - 10, lo[1] + 40, '多出的電子', 'currentColor', 'end', 12.5, 0.75); }
      if (holes.length) { var hi2 = iP(holes.reduce(function (a, b) { return b.p[1] > a.p[1] ? b : a; })); o += put(hi2[0] + 14, hi2[1] + 26, '空洞停在遠離 Q 的表面', PNK, 'middle', 12.5); }
      dyn.innerHTML = o + so;
    }

    // 播放：每條車道開頭停 1.5 秒；（實心金屬）第 1 條車道每次移到兩個空洞正中間停 1.2 秒；隔壁車道每秒 1.6 步；最後停 3.5 秒後重來
    var stops = [];
    lanes.forEach(function (L, q) { stops.push([starts[q], 1500]); if (q === 0 && hopPause) for (var j = 1; j < L.N; j++) stops.push([starts[0] + j + TS, 1200]); });
    stops.push([STOT, 3500]);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var play = !reduce, vis = true, s = 0, hold = 1500, last = null, tFix = null, btn = $('play'), sl = $('t');
    function nextStop(v) { for (var i = 0; i < stops.length; i++) if (stops[i][0] > v + 1e-6) return stops[i]; return null; }
    function setPlay(v) { play = v; btn.setAttribute('aria-label', v ? '暫停' : '播放'); btn.querySelector('.ic-pause').style.display = v ? '' : 'none'; btn.querySelector('.ic-play').style.display = v ? 'none' : ''; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
    btn.addEventListener('click', function () { if (!play && s >= STOT) { s = 0; hold = 1500; render(s); sl.value = 0; } setPlay(!play); });
    var TOL = STOT / 2000 + 1e-6;                        // 半個滑桿刻度：每個停頓點都拖得到
    sl.addEventListener('input', function (ev) {
      setPlay(false); s = +ev.target.value / 1000 * STOT; hold = 0;
      var ns = nextStop(s - TOL);
      if (ns && Math.abs(ns[0] - s) <= TOL) { s = ns[0]; hold = ns[1]; }
      render(s);
    });
    function loop(now) {
      var dt = last === null ? 0 : now - last; last = now;
      if (tFix === null && play && vis) {
        if (hold > 0) hold -= dt;
        else if (s >= STOT) { s = 0; hold = 1500; render(s); sl.value = 0; }
        else {
          var sp2 = s < starts[1] && hopPause ? 1.2 : 1.6, ns = s + dt / 1000 * sp2, nx = nextStop(s);
          if (nx && ns >= nx[0]) { s = nx[0]; hold = nx[1]; } else s = ns;
          render(s); sl.value = Math.round(s / STOT * 1000);
        }
      }
      requestAnimationFrame(loop);
    }
    if (!play) s = hopPause ? starts[0] + 3 + TS : starts[1];
    setPlay(play);
    render(s); sl.value = Math.round(s / STOT * 1000);
    requestAnimationFrame(loop);
    window[svg.id] = { at: function (v) { tFix = v; render(v); }, play: function () { tFix = null; } };
  }
  ['mh', 'mh2'].forEach(function (id) { var el = document.getElementById(id); if (el) setup(el); });
})();

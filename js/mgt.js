/* 3.6 磁的 Gauss 定律立體圖：一圈圈磁力線跟著 Q 前進，穿過一個小盒子；每一圈穿進幾次，就穿出幾次。 */
(function () {
  var svg = document.getElementById('mgt');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return svg.querySelector('#' + id); }

  var G = 1.6, F = 820, D = 7.2, CX = 320, CY = 205;
  var DXS = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5], RR = 1.0;
  var B0 = [-0.4, 0.3, -0.45], B1 = [0.5, 1.2, 0.55];   // 小盒子（固定在地面基準），各面和座標軸平行
  var BLUE = '#58C4DD', GOLD = '#F0AC5F';

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function unit(a) { var l = Math.sqrt(dot(a, a)); return mul(a, 1 / l); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  var d, R, U;                                      // 右手系鏡頭：R × U = d（指向觀者）
  function camera(az, el) {
    d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    R = unit(cross([0, 1, 0], d)); U = cross(d, R);
  }
  function P(p) { var s = F / (D - dot(d, p)); return [CX + s * dot(R, p), CY - s * dot(U, p)]; }
  function f(n) { return n.toFixed(1); }
  function setLine(el, a, b) { var s = P(a), e = P(b); el.setAttribute('x1', f(s[0])); el.setAttribute('y1', f(s[1])); el.setAttribute('x2', f(e[0])); el.setAttribute('y2', f(e[1])); }
  function label(el, p, dx, dy) {
    var s = P(p), w = +el.getAttribute('width'), h = +el.getAttribute('height');
    el.setAttribute('x', f(s[0] + (dx || 0) - w / 2)); el.setAttribute('y', f(s[1] + (dy || 0) - h / 2));
  }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
  function bmag(dx, r) { return G * r / Math.pow(G * G * dx * dx + r * r, 1.5); }
  var BMAX = bmag(0, RR);

  var back = $('mgtback'), front = $('mgtfront'), inside = $('mgtin'), arrs = $('mgtarr'), marks = $('mgtmk'), tube = $('mgttube');
  var rings = DXS.map(function (dx) {
    var k = Math.pow(bmag(dx, RR) / BMAX, 0.6), op = 0.38 + 0.57 * k;
    var c = { fill: 'none', stroke: BLUE, 'stroke-width': '1.8', 'stroke-linecap': 'round' };
    return {
      dx: dx, op: op,
      b: mk('path', Object.assign({ 'stroke-opacity': f(op * 0.45) }, c), back),
      f: mk('path', Object.assign({ 'stroke-opacity': f(op) }, c), front),
      i: mk('path', Object.assign({ 'stroke-opacity': f(op * 0.8), 'stroke-dasharray': '3 4' }, c), inside),
      heads: [0, 1].map(function () { return mk('polygon', { fill: BLUE, 'fill-opacity': f(Math.min(1, op + 0.1)) }, arrs); })
    };
  });
  var pool = [];                                   // ⊙：磁力線穿出盒子；⊗：穿進盒子
  for (var n = 0; n < 8; n++) {
    var g = mk('g', {}, marks);
    pool.push({ g: g, ring: mk('circle', { r: '7', style: 'fill:var(--bg)', stroke: GOLD, 'stroke-width': '1.8' }, g),
                dot: mk('circle', { r: '2.2', fill: GOLD }, g),
                x1: mk('line', { stroke: GOLD, 'stroke-width': '1.8' }, g), x2: mk('line', { stroke: GOLD, 'stroke-width': '1.8' }, g) });
  }
  var ax = $('mgtax'), mov = $('mgtmov'), qc = $('mgtqc'), qt = $('mgtqt'), uu = $('mgtu'), boxg = $('mgtbox');
  var Lax = $('mgtLax'), Lu = $('mgtLu'), Lsp = $('mgtLsp'), Ltb = $('mgtLtb');
  var T = 10, X0 = -1.4, X1 = 1.4;

  function inBox(p) { return p[0] > B0[0] && p[0] < B1[0] && p[1] > B0[1] && p[1] < B1[1] && p[2] > B0[2] && p[2] < B1[2]; }
  var V = [];
  for (var vi = 0; vi < 8; vi++) V.push([vi & 1 ? B1[0] : B0[0], vi & 2 ? B1[1] : B0[1], vi & 4 ? B1[2] : B0[2]]);
  var FACES = [[[0, 2, 6, 4], [-1, 0, 0]], [[1, 3, 7, 5], [1, 0, 0]], [[0, 1, 5, 4], [0, -1, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[0, 1, 3, 2], [0, 0, -1]], [[4, 5, 7, 6], [0, 0, 1]]];
  var EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  var faceEls = FACES.map(function () { return mk('polygon', { fill: '#BBBBBB', 'fill-opacity': '.08', stroke: 'none' }, boxg); });
  var edgeEls = EDGES.map(function () { return mk('line', { stroke: 'currentColor', 'stroke-width': '1.4' }, boxg); });

  function render(t) {
    camera((26 + 7 * Math.sin(2 * Math.PI * t / 24)) * Math.PI / 180, (18 + 3 * Math.sin(2 * Math.PI * t / 24 + 1.3)) * Math.PI / 180);
    var s = (t % T) / T, xq = X0 + (X1 - X0) * s, Q = [xq, 0, 0];
    mov.setAttribute('opacity', f(Math.min(1, s / 0.08, (1 - s) / 0.08)));

    setLine(ax, [-2.5, 0, 0], [2.5, 0, 0]);
    label(Lax, [2.5, 0, 0], 8, -16); if (+Lax.getAttribute('x') > 640 - 74) Lax.setAttribute('x', 640 - 74);

    var cam = mul(d, D), vis = FACES.map(function (fc) { var c = mul(add(add(V[fc[0][0]], V[fc[0][1]]), add(V[fc[0][2]], V[fc[0][3]])), 0.25); return dot(fc[1], sub(cam, c)) > 0; });
    FACES.forEach(function (fc, k) { faceEls[k].setAttribute('points', fc[0].map(function (i) { var q = P(V[i]); return f(q[0]) + ',' + f(q[1]); }).join(' ')); faceEls[k].setAttribute('fill-opacity', vis[k] ? '.09' : '.05'); });
    EDGES.forEach(function (e, k) {
      var shown = FACES.some(function (fc, j) { return vis[j] && fc[0].indexOf(e[0]) >= 0 && fc[0].indexOf(e[1]) >= 0; });
      setLine(edgeEls[k], V[e[0]], V[e[1]]); edgeEls[k].setAttribute('stroke-opacity', shown ? '.6' : '.25'); edgeEls[k].setAttribute('stroke-dasharray', shown ? 'none' : '3 4');
    });
    var top = P(V[6]); Lsp.setAttribute('x', f(top[0] - 50)); Lsp.setAttribute('y', f(top[1] - 4));
    var sc = P(mul(add(B0, B1), 0.5));

    var used = 0, best = null;
    rings.forEach(function (g) {
      var cx = xq + g.dx, bk = '', fr = '', ins = '', last = { b: -2, f: -2, i: -2 }, i, pts = [];
      for (i = 0; i <= 120; i++) { var ph = 2 * Math.PI * i / 120; pts.push([cx, RR * Math.cos(ph), RR * Math.sin(ph)]); }
      for (i = 0; i < 120; i++) {
        var a0 = pts[i], a1 = pts[i + 1], m = mul(add(a0, a1), 0.5), s0 = P(a0), s1 = P(a1);
        var key = inBox(m) ? 'i' : (dot(d, [0, m[1], m[2]]) >= 0 ? 'f' : 'b');
        var seg = (last[key] === i - 1 ? '' : 'M' + f(s0[0]) + ',' + f(s0[1])) + 'L' + f(s1[0]) + ',' + f(s1[1]);
        if (key === 'i') ins += seg; else if (key === 'f') fr += seg; else bk += seg;
        last[key] = i;
      }
      g.b.setAttribute('d', bk); g.f.setAttribute('d', fr); g.i.setAttribute('d', ins);

      // 與盒子各面的交點：垂直於軸的兩面和磁力線平行，沒有交點；只算其餘四面
      if (cx > B0[0] && cx < B1[0]) {
        var hits = [];
        [[1, B0[1], -1], [1, B1[1], 1], [2, B0[2], -1], [2, B1[2], 1]].forEach(function (fc) {
          var axis = fc[0], v = fc[1], sg = fc[2], o = axis === 1 ? 2 : 1, lo = o === 1 ? B0[1] : B0[2], hi = o === 1 ? B1[1] : B1[2];
          if (Math.abs(v) >= RR) return;
          var w = Math.sqrt(RR * RR - v * v);
          [w, -w].forEach(function (ww) {
            if (ww < lo || ww > hi) return;
            var p = [cx, 0, 0]; p[axis] = v; p[o] = ww;
            var bdir = [0, -p[2] / RR, p[1] / RR], n = [0, 0, 0]; n[axis] = sg;
            hits.push({ p: p, out: dot(bdir, n) > 0, n: n });
          });
        });
        hits.forEach(function (h) {
          if (used >= pool.length) return;
          var sp = P(h.p), m = pool[used++], X = sp[0], Y = sp[1], k = 4.6;
          m.g.setAttribute('opacity', '1');
          m.ring.setAttribute('cx', f(X)); m.ring.setAttribute('cy', f(Y));
          m.dot.setAttribute('cx', f(X)); m.dot.setAttribute('cy', f(Y)); m.dot.setAttribute('opacity', h.out ? '1' : '0');
          [[m.x1, 1], [m.x2, -1]].forEach(function (q) {
            q[0].setAttribute('x1', f(X - k)); q[0].setAttribute('y1', f(Y - k * q[1])); q[0].setAttribute('x2', f(X + k)); q[0].setAttribute('y2', f(Y + k * q[1]));
            q[0].setAttribute('opacity', h.out ? '0' : '1');
          });
        });
        if (hits.length) { var dist = Math.abs(cx - (B0[0] + B1[0]) / 2); if (!best || dist < best.dist) best = { dist: dist, cx: cx }; }
      }
      g.heads.forEach(function (h, k) {
        var ph = 2 * Math.PI * (k / 2 + t / 8), c = Math.cos(ph), sn = Math.sin(ph);
        var p = [cx, RR * c, RR * sn], tg = [0, -sn, c];
        var tip = P(add(p, mul(tg, 0.07))), bas = P(add(p, mul(tg, -0.07)));
        var vx = tip[0] - bas[0], vy = tip[1] - bas[1], L = Math.sqrt(vx * vx + vy * vy) || 1, nx = -vy / L * 4.2, ny = vx / L * 4.2;
        h.setAttribute('points', f(tip[0]) + ',' + f(tip[1]) + ' ' + f(bas[0] + nx) + ',' + f(bas[1] + ny) + ' ' + f(bas[0] - nx) + ',' + f(bas[1] - ny));
      });
    });
    for (var j = used; j < pool.length; j++) pool[j].g.setAttribute('opacity', '0');

    // 環管：正在穿過曲面、離球心最近的那一圈，畫成一根粗的半透明管子
    if (best) {
      var tp = [];
      for (var i2 = 0; i2 <= 96; i2++) { var a = 2 * Math.PI * i2 / 96, sp2 = P([best.cx, RR * Math.cos(a), RR * Math.sin(a)]); tp.push((i2 ? 'L' : 'M') + f(sp2[0]) + ',' + f(sp2[1])); }
      tube.setAttribute('d', tp.join('')); tube.setAttribute('opacity', '1');
      label(Ltb, [best.cx, -RR, 0], 0, 18); Ltb.setAttribute('opacity', '1');
    } else { tube.setAttribute('opacity', '0'); Ltb.setAttribute('opacity', '0'); }

    var sq = P(Q); qc.setAttribute('cx', f(sq[0])); qc.setAttribute('cy', f(sq[1])); qt.setAttribute('x', f(sq[0])); qt.setAttribute('y', f(sq[1] + 5));
    setLine(uu, add(Q, [0.17, 0, 0]), add(Q, [0.75, 0, 0]));
    label(Lu, add(Q, [0.62, 0, 0]), 0, 18);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, t0 = null, tFix = null;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function loop(now) {
    if (t0 === null) t0 = now;
    if (tFix !== null) render(tFix);
    else if (visible && !reduce) render((now - t0) / 1000);
    requestAnimationFrame(loop);
  }
  render(4.6);
  requestAnimationFrame(loop);
  window.mgt = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; } };
})();

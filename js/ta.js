/* 3.10 立體圖：3.4 的例子。上：地面基準；下：q 基準。拖曳任何一個面板，兩個一起旋轉；左右、上下都不設限，可以轉很多圈。
   x 軸是 Q 的運動線；q 在 x y 平面裡，此刻在 Q 的右方 X、上方 Y。左端的小三軸標出 y、z 的方向。
   E 沿 Q 此刻的位置 → q 的方向（3.1）：E∥ 兩個基準相同；E⊥ 在 q 基準裡乘上 ^地γ_q(1 − ^地u·^地v/c²)。
   q 基準裡 Q 此刻的水平距離是 ^地γ_Q·X / ^qγ_Q（兩者的 Q 基準距離相同）。
   滑桿改變 q 的速度 ^地v（Q 的速度 ^地u = 0.8c 固定）。
   B 沿 z：^地B = ^地u·^地E⊥/c²，^qB = ^qV·^qE⊥/c²；箭頭長度畫的是 c·B，與 E 用同一個比例尺。正對讀者時畫成 ⊙（背對時 ⊗）。
   JS 驅動的 SVG 投影：繞 y 轉 φ、往下俯視 θ。畫面上 x 向右、y 向上、z 朝向讀者（右手座標）。 */
(function () {
  var svg = document.getElementById('ta');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.ta-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f1(n) { return n.toFixed(1); }

  var GREEN = '#83C167', TEAL = '#5CD0B3', GOLD = '#F0AC5F', RED = '#FC6255', GREY = '#BBBBBB';
  var U = 0.8, GU = 1 / Math.sqrt(1 - U * U), V = 0.6;
  var X = 1.2, Y = 1.1, EA = 0.7, EP = EA * Y / X;      // c = 1 單位 = 100 px；E∥ 畫成 0.7
  var S = 100, CX = 330, PIV = [0, 0.55, 0];
  var PANELS = [{ k: 'g', top: 16, Qx: -X, uQ: U, Ep: EP, B: U * EP }, { k: 'q', top: 266, vq: 0 }];
  function setV(v) {                                  // 滑桿：q 的速度 ^地v；q 基準的量跟著改變
    V = v;
    var GV = 1 / Math.sqrt(1 - V * V), QV = (U - V) / (1 - U * V), GQQ = 1 / Math.sqrt(1 - QV * QV);
    PANELS[0].vq = V;
    PANELS[1].Qx = -GU * X / GQQ; PANELS[1].uQ = QV; PANELS[1].Ep = GV * (1 - U * V) * EP; PANELS[1].B = QV * PANELS[1].Ep;
  }
  setV(V);
  var phi = 0, theta = 0;                         // 預設：x y 平面平行於螢幕，z 朝向讀者

  function P(p, pn) {
    var x = p[0] - PIV[0], y = p[1] - PIV[1], z = p[2] - PIV[2];
    var c = Math.cos(phi), s = Math.sin(phi), xr = x * c + z * s, zr = -x * s + z * c;
    return [CX + S * xr, pn.top + 145 - S * (y * Math.cos(theta) - zr * Math.sin(theta))];
  }
  function depth(v) { return v[1] * Math.sin(theta) + (-v[0] * Math.sin(phi) + v[2] * Math.cos(phi)) * Math.cos(theta); }   // > 0：朝向讀者
  function dotOrCross(c, r, col, out, g) {           // 正對（或背對）讀者的向量畫成 ⊙（或 ⊗）
    el('circle', { cx: f1(c[0]), cy: f1(c[1]), r: r, fill: 'none', stroke: col, 'stroke-width': 1.8 }, g);
    if (out) return;
    var k = r * 0.62;
    el('path', { d: 'M' + f1(c[0] - k) + ',' + f1(c[1] - k) + 'L' + f1(c[0] + k) + ',' + f1(c[1] + k) + 'M' + f1(c[0] - k) + ',' + f1(c[1] + k) + 'L' + f1(c[0] + k) + ',' + f1(c[1] - k), stroke: col, 'stroke-width': 1.8 }, g);
  }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function line(a, b, pn, attr, g) { var p = P(a, pn), q = P(b, pn); attr.x1 = f1(p[0]); attr.y1 = f1(p[1]); attr.x2 = f1(q[0]); attr.y2 = f1(q[1]); return el('line', attr, g); }
  function place(e, p) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f1(p[0] - w / 2)); e.setAttribute('y', f1(p[1] - h / 2)); }
  function away(p, from, d) { var dx = p[0] - from[0], dy = p[1] - from[1], n = Math.hypot(dx, dy) || 1; return [p[0] + d * dx / n, p[1] + d * dy / n]; }
  function side(a, b, ref, d, t) {                    // 線段 a→b（畫面上）上 t 處（預設中點），往遠離 ref 的那一側推開 d
    t = t === undefined ? 0.5 : t;
    var mx = a[0] + t * (b[0] - a[0]), my = a[1] + t * (b[1] - a[1]), ux = b[0] - a[0], uy = b[1] - a[1], n = Math.hypot(ux, uy) || 1;
    var nx = -uy / n, ny = ux / n;
    if ((ref[0] - mx) * nx + (ref[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    return [mx + d * nx, my + d * ny];
  }

  var defs = el('defs', {});
  [['taG', GREEN], ['taT', TEAL], ['taB', GOLD], ['taA', GREY], ['taC', 'currentColor']].forEach(function (m) {
    var mk = el('marker', { id: m[0], markerUnits: 'userSpaceOnUse', markerWidth: 12, markerHeight: 10, refX: 10, refY: 5, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L12,5 L0,10 z', fill: m[1] }, mk);
  });
  PANELS.forEach(function (pn) {                        // 每個面板只畫在自己的那一條裡
    var cp = el('clipPath', { id: 'tac' + pn.k }, defs);
    el('rect', { x: 0, y: pn.top - 16, width: 640, height: 250 }, cp);
    pn.g = el('g', { 'clip-path': 'url(#tac' + pn.k + ')' });
    pn.d = el('g', {}, pn.g);
    Array.prototype.slice.call(svg.querySelectorAll('foreignObject[class^="ta-' + pn.k + '-"]')).forEach(function (e) { pn.g.appendChild(e); });   // 標籤留在最上層
  });

  function render() {
    PANELS.forEach(function (pn) {
      var g = pn.d, L = function (k) { return $(pn.k + '-' + k); };
      while (g.firstChild) g.removeChild(g.firstChild);
      var q = [0, Y, 0], Q = [pn.Qx, 0, 0], pTip = add(q, [0, pn.Ep, 0]), tip = add(pTip, [EA, 0, 0]), bTip = add(q, [0, 0, pn.B]);
      // x 軸（Q 的運動線）與左端的 y、z 小三軸
      line([-3.0, 0, 0], [2.5, 0, 0], pn, { stroke: 'currentColor', 'stroke-opacity': .35, 'stroke-width': 1.2, 'marker-end': 'url(#taC)' }, g);
      place(L('lx'), P([2.55, 0.22, 0], pn));
      var T0 = [-2.75, 0, 0];
      line(T0, add(T0, [0, 0.6, 0]), pn, { stroke: GREY, 'stroke-opacity': .7, 'stroke-width': 1.2, 'marker-end': 'url(#taA)' }, g);
      var s0 = P(T0, pn), sz = P(add(T0, [0, 0, 0.6]), pn);
      if (Math.hypot(sz[0] - s0[0], sz[1] - s0[1]) > 5) {
        line(T0, add(T0, [0, 0, 0.6]), pn, { stroke: GREY, 'stroke-opacity': .7, 'stroke-width': 1.2, 'marker-end': 'url(#taA)' }, g);
        place(L('lz'), P(add(T0, [0, 0, 0.8]), pn));
      } else { dotOrCross(s0, 6, GREY, depth([0, 0, 1]) > 0, g); place(L('lz'), [s0[0] - 18, s0[1] + 16]); }
      place(L('ly'), P(add(T0, [0, 0.78, 0]), pn));
      // Q → q 的虛線（E 沿這個方向）
      line(Q, add(q, [EA * 1.25, pn.Ep * 1.25, 0]), pn, { stroke: GREY, 'stroke-opacity': .7, 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }, g);
      // Q 與它的速度
      var sQ = P(Q, pn), a0 = add(Q, [pn.uQ < 0 ? -0.12 : 0.12, 0, 0]);
      if (Math.abs(pn.uQ) > 0.02) line(a0, add(a0, [pn.uQ, 0, 0]), pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#taG)' }, g);
      var mQ = P(add(a0, [pn.uQ / 2, 0, 0]), pn); place(L('u'), [mQ[0], mQ[1] + 20]);
      el('circle', { cx: f1(sQ[0]), cy: f1(sQ[1]), r: 10, fill: RED }, g);
      el('text', { x: f1(sQ[0]), y: f1(sQ[1] + 5), 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#1a1a1a' }, g).textContent = 'Q';
      // E 與它的分量：先往上（⊥），再往右（∥）
      line(q, pTip, pn, { stroke: TEAL, 'stroke-width': 1.6, 'stroke-dasharray': '5 4', 'stroke-opacity': .85 }, g);
      line(pTip, tip, pn, { stroke: TEAL, 'stroke-width': 1.6, 'stroke-dasharray': '5 4', 'stroke-opacity': .85 }, g);
      line(q, tip, pn, { stroke: TEAL, 'stroke-width': 2.6, 'marker-end': 'url(#taT)' }, g);
      var sq = P(q, pn), sp = P(pTip, pn), st = P(tip, pn), sb = P(bTip, pn);
      place(L('Ep'), side(sq, sp, st, 24));
      place(L('Ea'), side(sp, st, sq, 14));
      place(L('E'), side(sq, st, sp, 22, 1));
      // B（沿 z）
      var bl = Math.hypot(sb[0] - sq[0], sb[1] - sq[1]), flat = bl < 6, none = Math.abs(pn.B) < 0.005;
      L('B').setAttribute('visibility', none ? 'hidden' : 'visible');
      if (none) { }
      else if (flat) { dotOrCross(sq, 12, GOLD, depth([0, 0, pn.B]) > 0, g); place(L('B'), [sq[0] + 10, sq[1] + 30]); }
      else {
        line(q, bTip, pn, { stroke: GOLD, 'stroke-width': 2.4, 'marker-end': 'url(#taB)' }, g);
        place(L('B'), away(sq, sb, -Math.max(bl + 20, 32)));
      }
      // q 與它的速度
      if (pn.k === 'g') {
        L('v').setAttribute('visibility', pn.vq > 0.02 ? 'visible' : 'hidden');
        if (pn.vq > 0.02) {
          var v0 = add(q, [0.14, 0, 0]), v1 = add(v0, [pn.vq, 0, 0]);
          line(v0, v1, pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#taG)' }, g);
          place(L('v'), away(P(v1, pn), sq, 22));
        }
      } else place(L('v'), [sq[0] + 38, sq[1] - 4]);
      el('circle', { cx: f1(sq[0]), cy: f1(sq[1]), r: 5.5, fill: 'currentColor' }, g);
      place(L('q'), flat ? [sq[0] - 26, sq[1] + 2] : [sq[0] + 6, sq[1] + 24]);
    });
  }

  // 拖曳旋轉（兩個面板一起；左右、上下都不設限，可以轉很多圈）
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; drag = [e.clientX, e.clientY, phi, theta]; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) { drag = null; return; }
    phi = drag[2] + (e.clientX - drag[0]) * 0.01;
    theta = drag[3] + (e.clientY - drag[1]) * 0.01;
    render();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'contextmenu'].forEach(function (t) { svg.addEventListener(t, function () { drag = null; }); });
  $('v').addEventListener('input', function (e) { setV(+e.target.value); $('vo').textContent = V.toFixed(2) + 'c'; $('fo').textContent = (PANELS[1].Ep / EP).toFixed(2); render(); });
  window.ta = { view: function (p, t) { phi = p; theta = t; render(); }, v: function (v) { setV(v); render(); } };
  render();
})();

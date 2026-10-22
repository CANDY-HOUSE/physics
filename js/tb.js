/* 3.10 立體圖：同一個例子（3.4、圖 ta）在三維空間裡。上：地面基準；下：q 基準。拖曳任何一個面板，兩個一起旋轉。
   x 軸是 Q 的運動線；y、z 軸從 q 在 x 軸上的垂足畫出，y z 平面通過 q。E⊥ 的分量：先沿 z、再沿 y；E = E⊥ 再接 E_x（不與 q 的速度重疊）。
   q 此刻在 Q 的右方 X、垂直距離 R（在 y z 平面裡，與 y 軸夾 AL）。E 沿 Q 此刻的位置 → q 的方向（3.1）：
   E_x 兩個基準相同；E⊥ 在 q 基準裡乘上 ^地γ_q(1 − ^地u·^地v/c²)。q 基準裡 Q 此刻的水平距離是 ^地γ_Q·X / ^qγ_Q（兩者的 Q 基準距離相同）。
   滑桿改變 ^地v：q 基準裡的 E⊥ 整體伸縮，y、z 分量等比例；淡線是地面基準的 E⊥（同一個比例尺），用來比較。
   JS 驅動的 SVG 投影：繞 y 轉 φ、往下俯視 θ。畫面上 x 向右、y 向上、z 朝向讀者（右手座標）。 */
(function () {
  var svg = document.getElementById('tb');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.tb-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f1(n) { return n.toFixed(1); }

  var GREEN = '#83C167', TEAL = '#5CD0B3', RED = '#FC6255', GREY = '#BBBBBB';
  var U = 0.8, GU = 1 / Math.sqrt(1 - U * U), V = 0.6;
  var X = 1.1, R = 1.2, AL = 35 * Math.PI / 180, EX = 1.2, EP = EX * R / X;
  var CA = Math.cos(AL), SA = Math.sin(AL), S = 100, CX = 330, PIV = [-0.5, 1.0, 0.6];
  var PANELS = [{ k: 'g', top: 0, Qx: -X, uQ: U, Ep: EP }, { k: 'q', top: 380, vq: 0 }];
  function setV(v) {                                  // q 基準的量隨 ^地v 改變
    V = v;
    var GV = 1 / Math.sqrt(1 - V * V), QV = (U - V) / (1 - U * V), GQQ = 1 / Math.sqrt(1 - QV * QV);
    PANELS[0].vq = V;
    PANELS[1].Qx = -GU * X / GQQ; PANELS[1].uQ = QV; PANELS[1].Ep = GV * (1 - U * V) * EP;
  }
  setV(V);
  var phi = -0.6, theta = 0.35;

  function P(p, pn) {
    var x = p[0] - PIV[0], y = p[1] - PIV[1], z = p[2] - PIV[2];
    var c = Math.cos(phi), s = Math.sin(phi), xr = x * c + z * s, zr = -x * s + z * c;
    return [CX + S * xr, pn.top + 192 - S * (y * Math.cos(theta) - zr * Math.sin(theta))];
  }
  function add(a, b, k) { return [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]]; }
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
  [['tbG', GREEN], ['tbT', TEAL], ['tbA', GREY]].forEach(function (m) {
    var mk = el('marker', { id: m[0], markerUnits: 'userSpaceOnUse', markerWidth: 12, markerHeight: 10, refX: 10, refY: 5, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L12,5 L0,10 z', fill: m[1] }, mk);
  });
  PANELS.forEach(function (pn) {                        // 每個面板只畫在自己的那一條（380 高）裡
    var cp = el('clipPath', { id: 'tbc' + pn.k }, defs);
    el('rect', { x: 0, y: pn.top, width: 640, height: 380 }, cp);
    pn.g = el('g', { 'clip-path': 'url(#tbc' + pn.k + ')' });
    pn.d = el('g', {}, pn.g);
    Array.prototype.slice.call(svg.querySelectorAll('foreignObject[class^="tb-' + pn.k + '-"]')).forEach(function (e) { pn.g.appendChild(e); });   // 標籤留在最上層
  });

  function render() {
    PANELS.forEach(function (pn) {
      var g = pn.d;
      while (g.firstChild) g.removeChild(g.firstChild);
      var L = function (k) { return $(pn.k + '-' + k); };
      var O = [0, 0, 0], q = [0, R * CA, R * SA], Q = [pn.Qx, 0, 0];
      var Eperp = [0, pn.Ep * CA, pn.Ep * SA], Ez = [0, 0, pn.Ep * SA];
      var pTip = add(q, Eperp, 1), tip = add(pTip, [EX, 0, 0], 1), zTip = add(q, Ez, 1);
      // y z 平面（通過 q）與座標軸
      el('polygon', { points: [[0, -0.2, -0.2], [0, 2.5, -0.2], [0, 2.5, 1.85], [0, -0.2, 1.85]].map(function (p) { var s = P(p, pn); return f1(s[0]) + ',' + f1(s[1]); }).join(' '),
        fill: 'currentColor', 'fill-opacity': .05, stroke: 'currentColor', 'stroke-opacity': .3, 'stroke-dasharray': '4 4' }, g);
      line([-2.2, 0, 0], [1.9, 0, 0], pn, { stroke: 'currentColor', 'stroke-opacity': .45, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      line(O, [0, 2.65, 0], pn, { stroke: GREY, 'stroke-opacity': .8, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      line(O, [0, 0, 2.0], pn, { stroke: GREY, 'stroke-opacity': .8, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      place(L('lx'), P([2.08, 0, 0], pn)); place(L('ly'), P([0, 2.85, 0], pn)); place(L('lz'), P([0, 0, 2.2], pn));
      // Q → q 的虛線（E 沿這個方向）
      line(Q, add(q, [EX, pn.Ep * CA, pn.Ep * SA], 1.25), pn, { stroke: GREY, 'stroke-opacity': .7, 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }, g);
      // Q 與它的速度
      var sQ = P(Q, pn);
      var sg = pn.uQ < 0 ? -1 : 1, a0 = add(Q, [sg * 0.13, 0, 0], 1);
      if (Math.abs(pn.uQ) > 0.02) line(a0, add(a0, [pn.uQ, 0, 0], 1), pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#tbG)' }, g);
      var mQ = P(add(a0, [pn.uQ / 2, 0, 0], 1), pn); place(L('u'), [mQ[0], mQ[1] + 20]);
      el('circle', { cx: f1(sQ[0]), cy: f1(sQ[1]), r: 10, fill: RED }, g);
      el('text', { x: f1(sQ[0]), y: f1(sQ[1] + 5), 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#1a1a1a' }, g).textContent = 'Q';
      if (pn.k === 'q') {                             // 淡線：地面基準的 E⊥ 與它的 z、y 分量
        var gz = add(q, [0, 0, EP * SA], 1), gp = add(q, [0, EP * CA, EP * SA], 1), ghost = { stroke: TEAL, 'stroke-width': 1.2, 'stroke-opacity': .35 };
        line(q, gz, pn, Object.assign({ 'stroke-dasharray': '2 3' }, ghost), g);
        line(gz, gp, pn, Object.assign({ 'stroke-dasharray': '2 3' }, ghost), g);
        line(q, gp, pn, Object.assign({ 'stroke-dasharray': '6 4' }, ghost), g);
      }
      // E⊥ 在 y z 平面裡的分量：先沿 z，再沿 y
      line(q, zTip, pn, { stroke: TEAL, 'stroke-width': 1.3, 'stroke-dasharray': '2 3', 'stroke-opacity': .9 }, g);
      line(zTip, pTip, pn, { stroke: TEAL, 'stroke-width': 1.3, 'stroke-dasharray': '2 3', 'stroke-opacity': .9 }, g);
      // E = E⊥ + E_x（虛線箭頭），再加上 E 本身
      line(q, pTip, pn, { stroke: TEAL, 'stroke-width': 1.8, 'stroke-dasharray': '6 4', 'marker-end': 'url(#tbT)' }, g);
      line(pTip, tip, pn, { stroke: TEAL, 'stroke-width': 1.8, 'stroke-dasharray': '6 4', 'marker-end': 'url(#tbT)' }, g);
      line(q, tip, pn, { stroke: TEAL, 'stroke-width': 2.8, 'marker-end': 'url(#tbT)' }, g);
      var sq = P(q, pn), sp = P(pTip, pn), st = P(tip, pn), sz = P(zTip, pn);
      place(L('Ez'), pn.k === 'g' ? side(sq, sz, sp, -18, 0.45) : side(sq, sz, sp, 16, 0.8));
      var ex = P([0, 0, 1.85], pn)[0], dir = sp[0] < sq[0] ? -1 : 1;           // E_y 的標籤放在 y z 平面外
      place(L('Ey'), [(dir < 0 ? Math.min(ex, sp[0]) : Math.max(ex, sp[0])) + dir * 22, (sz[1] + sp[1]) / 2]);
      place(L('Ep'), side(sq, sp, st, -18, 0.42));
      place(L('Ex'), side(sp, st, sq, 15, 0.68));
      place(L('E'), side(sq, st, sp, 22, 1));
      // q 與它的速度
      if (pn.vq > 0) {
        line(add(q, [0.1, 0, 0], 1), add(q, [0.1 + pn.vq, 0, 0], 1), pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#tbG)' }, g);
        var mv = P(add(q, [0.1 + pn.vq, 0, 0], 1), pn); place(L('v'), [mv[0] + 18, mv[1] + 10]); L('v').removeAttribute('visibility');
      } else if (pn.k === 'q') place(L('v'), [sq[0] + 6, sq[1] + 44]);
      else L('v').setAttribute('visibility', 'hidden');
      el('circle', { cx: f1(sq[0]), cy: f1(sq[1]), r: 6, fill: 'currentColor' }, g);
      place(L('q'), [sq[0] + 6, sq[1] + 24]);
    });
  }

  // 拖曳旋轉（兩個面板一起）
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; drag = [e.clientX, e.clientY, phi, theta]; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) { drag = null; return; }
    phi = drag[2] + (e.clientX - drag[0]) * 0.01;          // 左右、上下都不設限，可以轉很多圈
    theta = drag[3] + (e.clientY - drag[1]) * 0.01;
    render();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'contextmenu'].forEach(function (t) { svg.addEventListener(t, function () { drag = null; }); });
  $('v').addEventListener('input', function (e) { setV(+e.target.value); $('vo').textContent = V.toFixed(2) + 'c'; $('fo').textContent = (PANELS[1].Ep / EP).toFixed(2); render(); });
  window.tb = { view: function (p, t) { phi = p; theta = t; render(); }, v: function (v) { setV(v); render(); } };
  render();
})();

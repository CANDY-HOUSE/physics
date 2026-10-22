/* 3.10 立體圖：同一個例子（3.4、圖 ta）在三維空間裡。上：地面基準；下：q 基準。拖曳任何一個面板，兩個一起旋轉。
   x 軸是 Q 的運動線；y、z 軸從 q 在 x 軸上的垂足畫出，y z 平面通過 q。每一個半徑方向上都是 E⊥，不必再拆成 y、z 分量。
   切面：以 x 軸為邊、沿半徑張開的半平面；它與 y 軸的夾角（從 y 量向 z）由圓形旋鈕拖動，可以轉無限圈（顯示 0°–359°），q 落在切面與正圓的交點。
   轉到 y、z、−y、−z 軸附近（±3°）時吸附對齊：旋鈕發光彈跳、顯示軸名，切面也亮起來。
   切面與 y 軸重合（0°）時 E⊥ 就是 E_y，與 z 軸重合（90°）時就是 E_z，標籤跟著換。
   q 此刻在 Q 的右方 X、垂直距離 R（在 y z 平面裡，與 y 軸夾 AL）。E 沿 Q 此刻的位置 → q 的方向（3.1）：
   E_x 兩個基準相同；E⊥ 在 q 基準裡乘上 ^地γ_q(1 − ^地u·^地v/c²)。q 基準裡 Q 此刻的水平距離是 ^地γ_Q·X / ^qγ_Q（兩者的 Q 基準距離相同）。
   以 Q 的 x 軸為軸心，y z 平面上的 E⊥ 是對稱的正圓：圓上每一點（半徑 R，每隔 30°）的 E⊥ 都沿半徑、一樣長。
   滑桿改變 ^地v：q 基準裡整圈 E⊥ 沿半徑同步等比例伸縮，y、z 分量也等比例；淡線是地面基準的 E⊥（同一個比例尺），用來比較。
   JS 驅動的 SVG 投影：繞 y 轉 φ、往下俯視 θ。畫面上 x 向右、y 向上、z 朝向讀者（右手座標）。 */
(function () {
  var svg = document.getElementById('tb');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.tb-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f1(n) { return n.toFixed(1); }

  var GREEN = '#83C167', TEAL = '#5CD0B3', BLUE = '#58C4DD', RED = '#FC6255', GREY = '#BBBBBB';
  var U = 0.8, GU = 1 / Math.sqrt(1 - U * U), V = 0.6;   // E∥ 畫成 EX（只用來定 E⊥ 的長度：E 沿 Q→q）
  var X = 1.6, R = 1.2, AL = 35 * Math.PI / 180, SNAP = -1, EX = 1.0, EP = EX * R / X, NR = 12, PL = 2.2;   // AL：切面與 y 軸的夾角
  var S = 70, CX = 330, PIV = [-0.5, 0, 0];
  var PANELS = [{ k: 'g', top: 0, Qx: -X, uQ: U, Ep: EP }, { k: 'q', top: 380, vq: 0 }];
  function setV(v) {                                  // q 基準的量隨 ^地v 改變
    V = v;
    var GV = 1 / Math.sqrt(1 - V * V), QV = (U - V) / (1 - U * V), GQQ = 1 / Math.sqrt(1 - QV * QV);
    PANELS[0].vq = V;
    PANELS[1].Qx = -GU * X / GQQ; PANELS[1].uQ = QV; PANELS[1].Ep = GV * (1 - U * V) * EP;
  }
  setV(V);
  var phi = -1.0, theta = 0.3;

  function P(p, pn) {
    var x = p[0] - PIV[0], y = p[1] - PIV[1], z = p[2] - PIV[2];
    var c = Math.cos(phi), s = Math.sin(phi), xr = x * c + z * s, zr = -x * s + z * c;
    return [CX + S * xr, pn.top + 195 - S * (y * Math.cos(theta) - zr * Math.sin(theta))];
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
      var CA = Math.cos(AL), SA = Math.sin(AL), O = [0, 0, 0], q = [0, R * CA, R * SA], Q = [pn.Qx, 0, 0];
      var pTip = add(q, [0, pn.Ep * CA, pn.Ep * SA], 1), tip = add(pTip, [EX, 0, 0], 1);   // E = E⊥ 再接 E_x（整支 E 在切面裡）
      // y z 平面（通過 q，以 x 軸為中心）與座標軸
      el('polygon', { points: [[0, -PL, -PL], [0, PL, -PL], [0, PL, PL], [0, -PL, PL]].map(function (p) { var s = P(p, pn); return f1(s[0]) + ',' + f1(s[1]); }).join(' '),
        fill: 'currentColor', 'fill-opacity': .05, stroke: 'currentColor', 'stroke-opacity': .3, 'stroke-dasharray': '4 4' }, g);
      line([-3.0, 0, 0], [1.9, 0, 0], pn, { stroke: 'currentColor', 'stroke-opacity': .45, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      line(O, [0, PL + 0.2, 0], pn, { stroke: GREY, 'stroke-opacity': .8, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      line(O, [0, 0, PL + 0.2], pn, { stroke: GREY, 'stroke-opacity': .8, 'stroke-width': 1.3, 'marker-end': 'url(#tbA)' }, g);
      place(L('lx'), P([2.08, 0, 0], pn)); place(L('ly'), P([0, PL + 0.4, 0], pn)); place(L('lz'), P([0, 0, PL + 0.4], pn));
      // 切面：以 x 軸為邊、沿半徑張開的半平面
      var hit = SNAP >= 0;                            // 切面剛好與 y 或 z 軸重合：亮起來
      el('polygon', { points: [[-3.0, 0, 0], [1.9, 0, 0], [1.9, PL * CA, PL * SA], [-3.0, PL * CA, PL * SA]].map(function (p) { var s = P(p, pn); return f1(s[0]) + ',' + f1(s[1]); }).join(' '),
        fill: hit ? TEAL : BLUE, 'fill-opacity': hit ? .22 : .1, stroke: hit ? TEAL : BLUE, 'stroke-opacity': hit ? 1 : .55, 'stroke-width': hit ? 2.4 : 1, 'stroke-dasharray': hit ? 'none' : '5 4' }, g);
      // 切面與 y 軸的夾角（從 y 量向 z）
      if (AL > 0.01) {
        var arc = [];
        for (var k = 0; k <= 40; k++) { var t = AL * k / 40, sa = P([0, 0.42 * Math.cos(t), 0.42 * Math.sin(t)], pn); arc.push(f1(sa[0]) + ',' + f1(sa[1])); }
        el('polyline', { points: arc.join(' '), fill: 'none', stroke: BLUE, 'stroke-width': 1.4 }, g);   // 角度的數值顯示在滑桿旁
      }
      // 正圓：圓上每一點的 E⊥ 都沿半徑、一樣長（q 自己的那一支在下面另外畫）
      var ring = [];
      for (var j = 0; j <= 72; j++) { var w = j * Math.PI / 36, s2 = P([0, R * Math.cos(w), R * Math.sin(w)], pn); ring.push(f1(s2[0]) + ',' + f1(s2[1])); }
      el('polyline', { points: ring.join(' '), fill: 'none', stroke: TEAL, 'stroke-opacity': .45, 'stroke-dasharray': '3 4' }, g);
      for (var i = 0; i < NR; i++) {
        var w2 = AL + i * 2 * Math.PI / NR, rd = [0, Math.cos(w2), Math.sin(w2)], p0 = add(O, rd, R);
        if (pn.k === 'q') line(p0, add(p0, rd, EP), pn, { stroke: TEAL, 'stroke-width': 1.2, 'stroke-opacity': .3, 'stroke-dasharray': '6 4' }, g);   // 淡線：地面基準
        if (i > 0) line(p0, add(p0, rd, pn.Ep), pn, { stroke: TEAL, 'stroke-width': 1.5, 'stroke-opacity': .75, 'marker-end': 'url(#tbT)' }, g);
      }
      // Q → q 的虛線（E 沿這個方向）
      line(Q, add(q, [EX, pn.Ep * CA, pn.Ep * SA], 1.25), pn, { stroke: GREY, 'stroke-opacity': .7, 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }, g);
      // Q 與它的速度
      var sQ = P(Q, pn);
      var sg = pn.uQ < 0 ? -1 : 1, a0 = add(Q, [sg * 0.13, 0, 0], 1);
      if (Math.abs(pn.uQ) > 0.02) line(a0, add(a0, [pn.uQ, 0, 0], 1), pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#tbG)' }, g);
      var mQ = P(add(a0, [pn.uQ / 2, 0, 0], 1), pn); place(L('u'), [mQ[0], mQ[1] + 20]);
      el('circle', { cx: f1(sQ[0]), cy: f1(sQ[1]), r: 10, fill: RED }, g);
      el('text', { x: f1(sQ[0]), y: f1(sQ[1] + 5), 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#1a1a1a' }, g).textContent = 'Q';
      // q 的 E⊥（圓上的其中一支，加粗），再接 E_x（虛線），以及整支 E
      line(q, pTip, pn, { stroke: TEAL, 'stroke-width': 2.8, 'marker-end': 'url(#tbT)' }, g);
      line(pTip, tip, pn, { stroke: TEAL, 'stroke-width': 1.8, 'stroke-dasharray': '6 4', 'marker-end': 'url(#tbT)' }, g);
      line(q, tip, pn, { stroke: TEAL, 'stroke-width': 2.2, 'stroke-opacity': .9, 'marker-end': 'url(#tbT)' }, g);
      var st = P(tip, pn);
      var sq = P(q, pn), sp = P(pTip, pn), rx = sp[0] - sq[0], ry = sp[1] - sq[1], rn = Math.hypot(rx, ry) || 1, nx = -ry / rn, ny = rx / rn;
      var exPos = side(sp, st, sq, 15, 0.6), ePos = side(sq, st, sp, 22, 1), mx0 = (sq[0] + sp[0]) / 2, my0 = (sq[1] + sp[1]) / 2;
      function far(px, py) { return Math.min(Math.hypot(px - exPos[0], py - exPos[1]), Math.hypot(px - ePos[0], py - ePos[1])); }
      if (far(mx0 + 20 * nx, my0 + 20 * ny) < far(mx0 - 20 * nx, my0 - 20 * ny)) { nx = -nx; ny = -ny; }   // n：E⊥ 標籤那一側（離 E_x、E 的標籤較遠）
      var lk = SNAP === 0 || SNAP === 180 ? 'Ey' : SNAP === 90 || SNAP === 270 ? 'Ez' : 'Ep';   // 切面與 y 軸重合：E⊥ 就是 E_y；與 z 軸重合：就是 E_z
      ['Ep', 'Ey', 'Ez'].forEach(function (k) { L(k).setAttribute('visibility', k === lk ? 'visible' : 'hidden'); });
      var epPos = [(sq[0] + sp[0]) / 2 + 20 * nx, (sq[1] + sp[1]) / 2 + 20 * ny], used = [exPos, ePos, epPos];
      function far3(c) { return Math.min.apply(null, used.map(function (u) { return Math.hypot(c[0] - u[0], c[1] - u[1]); })); }
      function best(cs) { cs.sort(function (a, b) { return far3(b) - far3(a); }); used.push(cs[0]); return cs[0]; }
      place(L(lk), epPos);
      place(L('Ex'), exPos);
      place(L('E'), ePos);
      // q 與它的速度
      if (pn.vq > 0) {
        line(add(q, [0.1, 0, 0], 1), add(q, [0.1 + pn.vq, 0, 0], 1), pn, { stroke: GREEN, 'stroke-width': 2.4, 'marker-end': 'url(#tbG)' }, g);
        var mv = P(add(q, [0.1 + pn.vq, 0, 0], 1), pn), mx = mv[0] - sq[0], my = mv[1] - sq[1], mn = Math.hypot(mx, my) || 1;
        var c1 = [mv[0] + 16 * mx / mn - 14 * my / mn, mv[1] + 16 * my / mn + 14 * mx / mn], c2 = [mv[0] + 16 * mx / mn + 14 * my / mn, mv[1] + 16 * my / mn - 14 * mx / mn];
        place(L('v'), best([c1, c2])); L('v').removeAttribute('visibility');   // 箭頭前端，選離其他標籤較遠的一側
      } else if (pn.k === 'q') {                      // 靜止：q 附近，選離 E、E_x 標籤最遠的位置
        var cs = [[sq[0] - 18 * nx + 30, sq[1] - 18 * ny], [sq[0] - 18 * nx - 30, sq[1] - 18 * ny], [sq[0] - 34 * nx, sq[1] - 34 * ny]];
        place(L('v'), best(cs));
      }
      else L('v').setAttribute('visibility', 'hidden');
      el('circle', { cx: f1(sq[0]), cy: f1(sq[1]), r: 6, fill: 'currentColor' }, g);
      place(L('q'), best([[sq[0] - 18 * nx, sq[1] - 18 * ny], [sq[0], sq[1] + 20], [sq[0] - 20, sq[1]], [sq[0] + 20, sq[1]], [sq[0], sq[1] - 20]]));   // q 的標籤：選離其他標籤最遠的位置
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
  // 圓形旋鈕：y 在上、z 在左（從 +x 看過去），角度從 y 量向 z（逆時針）；可以轉無限圈
  var dial = $('a'), AX4 = ['y 軸', 'z 軸', '−y 軸', '−z 軸'], acc = 35, last = null;
  dial.innerHTML = '<svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden="true">' +
    '<circle class="dial-track" r="20"/>' +
    [0, 90, 180, 270].map(function (d, i) {
      var r = d * Math.PI / 180, x1 = -Math.sin(r) * 16, y1 = -Math.cos(r) * 16, x2 = -Math.sin(r) * 23, y2 = -Math.cos(r) * 23, tx = -Math.sin(r) * 28.5, ty = -Math.cos(r) * 28.5 + 3;
      return '<line class="dial-tick" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/><text class="dial-lab" x="' + tx + '" y="' + ty + '">' + ['y', 'z', '−y', '−z'][i] + '</text>';
    }).join('') +
    '<line class="dial-hand" x1="0" y1="0" x2="0" y2="-20"/><circle class="dial-knob" r="4.6" cy="-20"/><circle class="dial-hub" r="2.2"/></svg>';
  var hand = dial.querySelector('.dial-hand'), knob = dial.querySelector('.dial-knob');
  function setAngle(a) {
    acc = a;
    var d = ((a % 360) + 360) % 360, near = Math.round(d / 90) * 90;
    SNAP = Math.abs(d - near) <= 3 ? near % 360 : -1;
    if (SNAP >= 0) d = SNAP;
    AL = d * Math.PI / 180;
    var r = AL, x = -Math.sin(r) * 20, y = -Math.cos(r) * 20;
    hand.setAttribute('x2', x.toFixed(2)); hand.setAttribute('y2', y.toFixed(2)); knob.setAttribute('cx', x.toFixed(2)); knob.setAttribute('cy', y.toFixed(2));
    var shown = Math.round(d) % 360;                   // 361° 顯示成 1°
    $('ao').textContent = SNAP >= 0 ? AX4[SNAP / 90] + ' ' + shown + '°' : shown + '°';
    dial.setAttribute('aria-valuenow', shown);
    var was = dial.classList.contains('hit');
    dial.classList.toggle('hit', SNAP >= 0); $('ao').classList.toggle('hit', SNAP >= 0);
    if (SNAP >= 0 && !was) { dial.classList.remove('pop'); void dial.offsetWidth; dial.classList.add('pop'); }   // 剛吸附上：彈一下
    render();
  }
  function ptAngle(e) {                               // 指標相對旋鈕中心的角度（y 在上，往 z（左）為正）
    var b = dial.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
    return Math.atan2(-dx, -dy) * 180 / Math.PI;
  }
  dial.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; last = ptAngle(e); dial.setPointerCapture(e.pointerId); e.preventDefault(); });
  dial.addEventListener('pointermove', function (e) {
    if (last === null) return;
    var a = ptAngle(e), d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360;   // 跨過 ±180° 時不跳：累加，轉幾圈都行
    last = a; setAngle(acc + d);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { dial.addEventListener(t, function () { last = null; }); });
  dial.addEventListener('keydown', function (e) {
    var k = e.key, step = e.shiftKey ? 15 : 1;
    if (k === 'ArrowLeft' || k === 'ArrowUp') { setAngle(acc + step); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'ArrowDown') { setAngle(acc - step); e.preventDefault(); }
  });
  $('v').addEventListener('input', function (e) { setV(+e.target.value); $('vo').textContent = V.toFixed(2) + 'c'; $('fo').textContent = (PANELS[1].Ep / EP).toFixed(2); render(); });
  window.tb = { view: function (p, t) { phi = p; theta = t; render(); }, v: function (v) { setV(v); render(); } };
  setAngle(35);
})();

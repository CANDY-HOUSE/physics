/* 3.10 立體圖：q 所在處的 ^地v、^地E、^地B，各畫在一個面板裡；三個向量都不平行於任何一軸，在 x、y、z 上同時有分量。
   分量畫在三條軸上（粗線），虛線從箭頭拉到軸：箭頭 → 地板上的投影 → x、z 軸；箭頭 → y 軸。
   JS 驅動的 SVG 投影：繞 y 轉 φ、往下俯視 θ；拖曳任何一個面板，三個一起旋轉。畫面上 x 向右、y 向上、z 朝向讀者（右手座標）。 */
(function () {
  var svg = document.getElementById('tc');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.tc-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f1(n) { return n.toFixed(1); }

  var GREY = '#BBBBBB', CY = 205, S = 66, AX = 2.1;
  var phi = 0.6, theta = 0.45;
  var VEC = [
    { k: 'v', c: '#83C167', a: [1.4, 1.1, 1.0], cx: 46 },
    { k: 'e', c: '#5CD0B3', a: [0.8, 1.6, 0.9], cx: 259 },
    { k: 'b', c: '#F0AC5F', a: [1.2, 1.6, 0.6], cx: 472 }
  ];

  function P(p, cx) {                               // 投影：回傳 [sx, sy]
    var c = Math.cos(phi), s = Math.sin(phi), xr = p[0] * c + p[2] * s, zr = -p[0] * s + p[2] * c;
    return [cx + S * xr, CY - S * (p[1] * Math.cos(theta) - zr * Math.sin(theta))];
  }
  function line(a, b, cx, attr, g) { var p = P(a, cx), q = P(b, cx); attr.x1 = f1(p[0]); attr.y1 = f1(p[1]); attr.x2 = f1(q[0]); attr.y2 = f1(q[1]); return el('line', attr, g); }
  function place(e, p) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f1(p[0] - w / 2)); e.setAttribute('y', f1(p[1] - h / 2)); e.removeAttribute('visibility'); }
  function away(p, from, d) { var dx = p[0] - from[0], dy = p[1] - from[1], n = Math.hypot(dx, dy) || 1; return [p[0] + d * dx / n, p[1] + d * dy / n]; }
  function off(p, o, t, d, at) {                     // 把 at（預設 p）從 o→t 這條線（畫面上）往 p 那一側推開 d（d < 0：推往另一側）
    var ux = t[0] - o[0], uy = t[1] - o[1], n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n;
    var k = (p[0] - o[0]) * ux + (p[1] - o[1]) * uy, nx = p[0] - o[0] - k * ux, ny = p[1] - o[1] - k * uy, m = Math.hypot(nx, ny) || 1;
    at = at || p;
    return [at[0] + d * nx / m, at[1] + d * ny / m];
  }

  var defs = el('defs', {});
  VEC.concat([{ k: 'a', c: GREY }]).forEach(function (m) {
    var mk = el('marker', { id: 'tc' + m.k, markerUnits: 'userSpaceOnUse', markerWidth: 11, markerHeight: 9, refX: 9, refY: 4.5, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L11,4.5 L0,9 z', fill: m.c }, mk);
  });
  var g = el('g', {});
  Array.prototype.slice.call(svg.querySelectorAll('foreignObject')).forEach(function (e) { svg.appendChild(e); });   // 標籤留在最上層

  function render() {
    while (g.firstChild) g.removeChild(g.firstChild);
    VEC.forEach(function (V) {
      var O = [0, 0, 0], o = P(O, V.cx), a = V.a, tip = P(a, V.cx);
      [[AX, 0, 0, 'x'], [0, AX, 0, 'y'], [0, 0, AX, 'z']].forEach(function (A) {
        line(O, A, V.cx, { stroke: GREY, 'stroke-width': 1.3, 'stroke-opacity': .75, 'marker-end': 'url(#tca)' }, g);
        place($(V.k + 'l' + A[3]), P([A[0] * 1.13, A[1] * 1.13, A[2] * 1.13], V.cx));
      });
      var foot = [a[0], 0, a[2]], dash = { stroke: V.c, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', 'stroke-opacity': .7 };
      [[a, foot], [foot, [a[0], 0, 0]], [foot, [0, 0, a[2]]], [a, [0, a[1], 0]]].forEach(function (L) { line(L[0], L[1], V.cx, Object.assign({}, dash), g); });
      [0, 1, 2].forEach(function (i) {                 // 分量：畫在軸上，標籤放在軸的外側（遠離箭頭的那一側）
        var e = [0, 0, 0]; e[i] = a[i];
        line(O, e, V.cx, { stroke: V.c, 'stroke-width': 3.2, 'stroke-opacity': .75, 'stroke-linecap': 'round' }, g);
        var m = e.map(function (t) { return t * 0.72; });
        place($(V.k + i), off(tip, o, P(e, V.cx), -17 - (i === 1 ? 6 : 0), P(m, V.cx)));
      });
      line(O, a, V.cx, { stroke: V.c, 'stroke-width': 2.6, 'marker-end': 'url(#tc' + V.k + ')' }, g);
      place($(V.k), away(tip, o, 20));
      el('circle', { cx: f1(o[0]), cy: f1(o[1]), r: 4.5, fill: 'currentColor' }, g);
      place($(V.k + 'q'), [o[0] - 13, o[1] - 11]);
    });
  }

  // 拖曳旋轉
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, phi, theta]; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    phi = drag[2] + (e.clientX - drag[0]) * 0.01;
    theta = Math.max(-0.2, Math.min(0.8, drag[3] + (e.clientY - drag[1]) * 0.01));
    render();
  });
  svg.addEventListener('pointerup', function () { drag = null; });
  window.tc = { view: function (p, t) { phi = p; theta = t; render(); } };
  render();
})();

/* 3.9 立體動畫：布滿 Q 的平面（地面，x z 平面）原本靜止，t = 0 起每一顆 Q 都照 x = cos 2πft 運動。
   沿 ŷ 往上，在高度 y 的地方：^qE_x = (^qE_y/c)·2πf·sin 2πf(t − y/c)，^qB_z = −^qE_x / c；更外面（y > ct）都是 0。
   JS 驅動的 SVG 投影：繞 ŷ 轉 φ、往下俯視 θ；拖曳可旋轉。單位：c = 1，f = 1（波長 1）。 */
(function () {
  var svg = document.getElementById('rw');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.rw-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
  function f1(n) { return n.toFixed(1); }

  var TEAL = '#5CD0B3', GOLD = '#F0AC5F', RED = '#FC6255';
  var CX = 340, CY = 400, S = 105, YMAX = 3, HALF = 1.3, AMP = 0.75, NY = 60, SMAX = 9;
  var phi = -0.35, theta = 0.45, s = 0, spd = 0.5, showB = true;

  function P(x, y, z) {                                   // 投影：回傳 [sx, sy]
    var c = Math.cos(phi), sn = Math.sin(phi), xr = x * c + z * sn, zr = -x * sn + z * c;
    return [CX + S * xr, CY - S * (y * Math.cos(theta) - zr * Math.sin(theta))];
  }
  function pts(a) { return a.map(function (p) { var q = P(p[0], p[1], p[2]); return f1(q[0]) + ',' + f1(q[1]); }).join(' '); }
  function line(a, b, attr, g) { var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); attr.x1 = f1(p[0]); attr.y1 = f1(p[1]); attr.x2 = f1(q[0]); attr.y2 = f1(q[1]); return el('line', attr, g); }

  var defs = el('defs', {});
  [['rwE', TEAL], ['rwB', GOLD], ['rwA', '#bdbdbd']].forEach(function (m) {
    var mk = el('marker', { id: m[0], markerUnits: 'userSpaceOnUse', markerWidth: 12, markerHeight: 10, refX: 10, refY: 5, orient: 'auto' }, defs);
    el('path', { d: 'M0,0 L12,5 L0,10 z', fill: m[1] }, mk);
  });
  var g = el('g', {});
  var lx = $('lx'), ly = $('ly'), lz = $('lz'), lf = $('lf');
  function place(e, p, dx, dy) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f1(p[0] + dx - w / 2)); e.setAttribute('y', f1(p[1] + dy - h / 2)); }

  function Ex(y, t) { return t - y < 0 ? 0 : Math.sin(2 * Math.PI * (t - y)); }   // 以 ^qE_y·2πf/c 為單位

  function render() {
    while (g.firstChild) g.removeChild(g.firstChild);
    var t = s;
    // 地面（x z 平面）
    el('polygon', { points: pts([[-HALF, 0, -HALF], [HALF, 0, -HALF], [HALF, 0, HALF], [-HALF, 0, HALF]]), fill: 'currentColor', 'fill-opacity': .06, stroke: 'currentColor', 'stroke-opacity': .35 }, g);
    for (var i = -2; i <= 2; i++) {
      var u = i * HALF / 2.5;
      line([u, 0, -HALF], [u, 0, HALF], { stroke: 'currentColor', 'stroke-opacity': .12 }, g);
      line([-HALF, 0, u], [HALF, 0, u], { stroke: 'currentColor', 'stroke-opacity': .12 }, g);
    }
    var dx = 0.08 * (Math.cos(2 * Math.PI * Math.max(t, 0)) - 1);   // 每一顆 Q 的位移（示意）
    for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) {
      var q = P(a * 0.5 + dx, 0, b * 0.5); el('circle', { cx: f1(q[0]), cy: f1(q[1]), r: 3.5, fill: RED, 'fill-opacity': .8 }, g);
    }
    // 座標軸
    line([0, 0, 0], [HALF + 0.35, 0, 0], { stroke: '#bdbdbd', 'stroke-width': 1.4, 'marker-end': 'url(#rwA)' }, g);
    line([0, 0, 0], [0, 0, HALF + 0.35], { stroke: '#bdbdbd', 'stroke-width': 1.4, 'marker-end': 'url(#rwA)' }, g);
    line([0, 0, 0], [0, YMAX + 0.3, 0], { stroke: '#bdbdbd', 'stroke-width': 1.4, 'stroke-opacity': .7, 'marker-end': 'url(#rwA)' }, g);
    place(lx, P(HALF + 0.5, 0, 0), 0, 0); place(lz, P(0, 0, HALF + 0.5), 0, 0); place(ly, P(0, YMAX + 0.45, 0), 0, 0);
    // 前緣（y = ct）
    var yf = Math.min(t, YMAX);
    if (t < YMAX) {
      el('polygon', { points: pts([[-HALF, yf, -HALF], [HALF, yf, -HALF], [HALF, yf, HALF], [-HALF, yf, HALF]]), fill: 'currentColor', 'fill-opacity': .05, stroke: 'currentColor', 'stroke-opacity': .3, 'stroke-dasharray': '5 4' }, g);
      place(lf, P(HALF, yf, -HALF), 34, -10); lf.removeAttribute('visibility');
    } else lf.setAttribute('visibility', 'hidden');
    // 兩個直立的平面：E 在 x y 平面（青綠），B 在 z y 平面（金色）
    var W = AMP + 0.15;
    el('polygon', { points: pts([[-W, 0, 0], [W, 0, 0], [W, YMAX, 0], [-W, YMAX, 0]]), fill: TEAL, 'fill-opacity': .05, stroke: TEAL, 'stroke-opacity': .35, 'stroke-dasharray': '4 4' }, g);
    if (showB) el('polygon', { points: pts([[0, 0, -W], [0, 0, W], [0, YMAX, W], [0, YMAX, -W]]), fill: GOLD, 'fill-opacity': .05, stroke: GOLD, 'stroke-opacity': .35, 'stroke-dasharray': '4 4' }, g);
    // 沿 ŷ 的 E_x（青綠，x 方向）與 B_z（金色，z 方向；B_z = −E_x/c）；波與軸之間塗上顏色，看得出各在哪一個平面
    var ce = '', cb = '', fe = [], fb = [];
    for (var k = 0; k <= NY; k++) {
      var y = YMAX * k / NY; if (y > yf) break;
      var e = AMP * Ex(y, t), pe = P(e, y, 0), pb = P(0, y, -e);
      fe.push([e, y, 0]); fb.push([0, y, -e]);
      ce += (ce ? 'L' : 'M') + f1(pe[0]) + ',' + f1(pe[1]); cb += (cb ? 'L' : 'M') + f1(pb[0]) + ',' + f1(pb[1]);
      if (k % 3 === 0 && Math.abs(e) > 0.04) {
        if (showB) line([0, y, 0], [0, y, -e], { stroke: GOLD, 'stroke-width': 1.6, 'stroke-opacity': .85, 'marker-end': 'url(#rwB)' }, g);
        line([0, y, 0], [e, y, 0], { stroke: TEAL, 'stroke-width': 1.8, 'marker-end': 'url(#rwE)' }, g);
      }
    }
    if (fe.length > 1) {
      var top = fe[fe.length - 1][1];
      if (showB) el('polygon', { points: pts(fb.concat([[0, top, 0], [0, 0, 0]])), fill: GOLD, 'fill-opacity': .22, stroke: 'none' }, g);
      el('polygon', { points: pts(fe.concat([[0, top, 0], [0, 0, 0]])), fill: TEAL, 'fill-opacity': .22, stroke: 'none' }, g);
    }
    if (showB && cb) el('path', { d: cb, fill: 'none', stroke: GOLD, 'stroke-width': 2, 'stroke-opacity': .9 }, g);
    if (ce) el('path', { d: ce, fill: 'none', stroke: TEAL, 'stroke-width': 2 }, g);
    $('t').value = Math.round(s / SMAX * 1000);
  }

  // 拖曳旋轉
  var drag = null;
  svg.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, phi, theta]; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    phi = drag[2] + (e.clientX - drag[0]) * 0.01;
    theta = Math.max(0.05, Math.min(1.2, drag[3] + (e.clientY - drag[1]) * 0.01));
    render();
  });
  svg.addEventListener('pointerup', function () { drag = null; });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var play = !reduce, vis = true, last = 0, bp = $('play');
  function setPlay(p) { play = p; bp.setAttribute('aria-label', p ? '暫停' : '播放'); bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : ''; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  bp.addEventListener('click', function () { setPlay(!play); });
  $('t').addEventListener('input', function (e) { s = +e.target.value / 1000 * SMAX; render(); });
  $('sp').addEventListener('input', function (e) { spd = +e.target.value; $('spo').textContent = spd + '×'; });
  $('cb').addEventListener('change', function (e) { showB = e.target.checked; render(); });
  function loop(ts) {
    if (play && vis && ts - last > 33) { last = ts; s += 0.02 * spd; if (s > SMAX) s = 0; render(); }
    requestAnimationFrame(loop);
  }
  if (!play) s = 2;
  setPlay(play);
  render();
  requestAnimationFrame(loop);
})();

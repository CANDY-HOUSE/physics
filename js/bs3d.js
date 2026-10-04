/* 3.3 Biot–Savart 3D 圖：SVG 透視投影，鏡頭緩慢擺動，P 沿圓周移動。 */
(function () {
  var svg = document.getElementById('bs3d');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return svg.querySelector('#' + id); }

  // ---- 場景（世界座標；y 向上，電流元在原點，方向 +z）----
  var A = 3.0, R = 1.15, H = 1.5;          // 到平面的距離 a、圓半徑 R、平面半寬
  var C = [0, 0.1, 1.7];                  // 鏡頭注視點
  var W = 640, Hh = 400, F = 900, D = 9.5;  // 畫布、焦距、鏡頭距離

  function wire(s) {                         // 通過原點、切線為 +z 的彎曲導線
    return [-0.38 * s * s, 0.32 * s * s - (s > 0 ? 0.55 * s * s * s : 0), s];
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
  function unit(a) { return mul(a, 1 / len(a)); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  var yaw, pitch;
  function P(p) {                            // 世界 → 畫布
    // 畫面座標（右、上、往裡）是左手系；先把世界 x 反號，畫出來的才是右手系
    var q = sub(p, C), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    q[0] = -q[0];
    var x1 = q[0] * cy + q[2] * sy, z1 = -q[0] * sy + q[2] * cy;
    var y2 = q[1] * cp + z1 * sp, z2 = -q[1] * sp + z1 * cp;
    var s = F / (D + z2);
    return [W / 2 + 8 + s * x1, Hh / 2 + 18 - s * y2];
  }
  function f(n) { return n.toFixed(1); }
  function path(pts) { return pts.map(function (p, i) { var s = P(p); return (i ? 'L' : 'M') + f(s[0]) + ',' + f(s[1]); }).join(''); }
  function line(el, a, b) { var s = P(a), e = P(b); el.setAttribute('x1', f(s[0])); el.setAttribute('y1', f(s[1])); el.setAttribute('x2', f(e[0])); el.setAttribute('y2', f(e[1])); }
  function label(el, p, dx, dy) {           // foreignObject 以 (p + 偏移) 為中心
    var s = P(p), w = +el.getAttribute('width'), h = +el.getAttribute('height');
    el.setAttribute('x', f(s[0] + (dx || 0) - w / 2)); el.setAttribute('y', f(s[1] + (dy || 0) - h / 2));
  }

  var el = {};
  ['wire', 'wireFlow', 'axFar', 'axNear', 'plane', 'cx1', 'cx2', 'circ', 'rad', 'wedge', 'rvec', 'dl', 'dB', 'Pdot',
   'Lr', 'Lth', 'Ldl', 'LdB', 'LR', 'La', 'LI', 'aDim', 'tx', 'ty', 'tz', 'Ltx', 'Lty', 'Ltz'].forEach(function (k) { el[k] = $(k); });

  var S0 = -1.7, S1 = 1.5;
  function render(t) {
    yaw = (60 + 7 * Math.sin(2 * Math.PI * t / 16)) * Math.PI / 180;
    pitch = (19 + 3 * Math.sin(2 * Math.PI * t / 16 + 1.1)) * Math.PI / 180;
    var phi = 0.6 + 2 * Math.PI * t / 8;

    // 導線與電流流動
    var wp = [], i;
    for (i = 0; i <= 60; i++) wp.push(wire(S0 + (S1 - S0) * i / 60));
    var d = path(wp);
    el.wire.setAttribute('d', d); el.wireFlow.setAttribute('d', d);
    el.wireFlow.setAttribute('stroke-dashoffset', f(-t * 34));

    // 軸（虛線）：平面後方、前方分兩段
    line(el.axFar, [0, 0, A], [0, 0, A + H + 0.5]);
    line(el.axNear, [0, 0, -0.8], [0, 0, A]);

    // 垂直於軸的平面與十字線
    el.plane.setAttribute('d', path([[-H, -H, A], [H, -H, A], [H, H, A], [-H, H, A]]) + 'Z');
    line(el.cx1, [-H, 0, A], [H, 0, A]); line(el.cx2, [0, -H, A], [0, H, A]);

    // 半徑 R 的圓
    var cp = [];
    for (i = 0; i <= 72; i++) { var a = 2 * Math.PI * i / 72; cp.push([R * Math.cos(a), R * Math.sin(a), A]); }
    el.circ.setAttribute('d', path(cp));

    // P、半徑、r、θ、dB
    var Pw = [R * Math.cos(phi), R * Math.sin(phi), A];
    line(el.rad, [0, 0, A], Pw);
    line(el.rvec, [0, 0, 0], mul(Pw, 0.985));
    var e = [0, 0, 1], rh = unit(Pw), wd = [[0, 0, 0]];
    for (i = 0; i <= 14; i++) { var k = i / 14, v = unit(add(mul(e, 1 - k), mul(rh, k))); wd.push(mul(v, 1.05)); }
    el.wedge.setAttribute('d', path(wd) + 'Z');
    var tB = unit(cross(e, Pw));
    line(el.dB, Pw, add(Pw, mul(tB, 0.95)));
    var sP = P(Pw); el.Pdot.setAttribute('cx', f(sP[0])); el.Pdot.setAttribute('cy', f(sP[1]));

    // 電流元 I dℓ
    line(el.dl, [0, 0, -0.32], [0, 0, 0.42]);

    // a 的尺寸線（軸下方平行）
    var off = [0, -0.42, 0];
    line(el.aDim, add([0, 0, 0], off), add([0, 0, A], off));

    // 標籤
// r 的標籤放在 r 遠離軸的那一側；θ 放在角的平分線上
var so = P([0, 0, 0]), sm = P(mul(Pw, 0.55)), sa = P([0, 0, len(Pw) * 0.55]);
var rx = sm[0] - so[0], ry = sm[1] - so[1], rl = Math.sqrt(rx * rx + ry * ry) || 1;
var nx = -ry / rl, ny = rx / rl;
if (nx * (sa[0] - sm[0]) + ny * (sa[1] - sm[1]) > 0) { nx = -nx; ny = -ny; }
label(el.Lr, mul(Pw, 0.55), nx * 18, ny * 18);
label(el.Lth, mul(unit(add(e, rh)), 1.75), 0, 0);
    label(el.Ldl, [0, 0, 0], -6, 30);
    label(el.LdB, add(Pw, mul(tB, 1.25)), 4, -6);
    label(el.LR, mul(Pw, 0.5).map(function (x, j) { return j === 2 ? A : x; }), 12, 0);
    label(el.La, add([0, 0, A / 2], off), 0, 18);
    label(el.LI, wire(S1 - 0.05), 18, 4);

    // 座標軸三腳架（固定位置，跟著鏡頭轉）
    var o = [50, 352], k3 = 30;
    [['tx', 'Ltx', [1, 0, 0]], ['ty', 'Lty', [0, 1, 0]], ['tz', 'Ltz', [0, 0, 1]]].forEach(function (q) {
      var a0 = P(C), a1 = P(add(C, mul(q[2], 0.6)));
      var dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var ex = o[0] + dx / L * k3 * Math.min(1, L / 40), ey = o[1] + dy / L * k3 * Math.min(1, L / 40);
      var ln = el[q[0]]; ln.setAttribute('x1', o[0]); ln.setAttribute('y1', o[1]); ln.setAttribute('x2', f(ex)); ln.setAttribute('y2', f(ey));
      var lb = el[q[1]], w = +lb.getAttribute('width'), h = +lb.getAttribute('height');
      lb.setAttribute('x', f(ex + dx / L * 11 - w / 2)); lb.setAttribute('y', f(ey + dy / L * 11 - h / 2));
    });
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
  render(1.2);
  requestAnimationFrame(loop);
  window.bs3d = { at: function (t) { tFix = t; render(t); }, play: function () { tFix = null; } };
})();

/* 2.4 光的相位螺旋 —— three.js r128 3D 動畫（3Blue1Brown 風格）。
   圖 A：軸上一排相位箭頭隨翻頁旋轉，箭尖連成螺旋；右側為沿軸方向看的視角。
   圖 B：同一排相位箭頭帶動輪子（對外作功）。
   WebGL 不可用時保留原本的 SVG 動畫。 */
(function () {
  if (typeof THREE === 'undefined') return;
  var BLUE = 0x58c4dd, BLUE_HI = 0xbfeaf5, GOLD = 0xe0a800, RED = 0xfc6255, GRAY = 0xbdbdbd, BG = 0x0b0b0f;
  var TURN_PAGES = 3;          // 每翻三頁螺旋一圈

  function labelSprite(text, cssColor, size) {
    var c = document.createElement('canvas'); c.width = 96; c.height = 96;
    var g = c.getContext('2d');
    g.font = '600 56px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = cssColor; g.fillText(text, 48, 50);
    var tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false }));
    sp.scale.set(size, size, 1);
    return sp;
  }

  // 箭頭：沿 +Y，長 len；回傳 group（rotation.x = 相位）
  function arrow(len, color, opacity, shaftR, headR, headL) {
    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: opacity >= 1 });
    var g = new THREE.Group();
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, len - headL, 10), mat);
    shaft.position.y = (len - headL) / 2;
    var head = new THREE.Mesh(new THREE.ConeGeometry(headR, headL, 14), mat);
    head.position.y = len - headL / 2;
    g.add(shaft); g.add(head);
    g.userData.mat = mat;
    return g;
  }

  // 座標軸：from → to，含兩端箭頭與刻度
  function axis(scene, from, to, ticks, tickDir, tickLen) {
    var mat = new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), mat));
    var dir = new THREE.Vector3().subVectors(to, from).normalize();
    [[to, dir], [from, dir.clone().negate()]].forEach(function (e) {
      var cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 12), new THREE.MeshBasicMaterial({ color: GRAY }));
      cone.position.copy(e[0]);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), e[1]);
      scene.add(cone);
    });
    var pts = [];
    ticks.forEach(function (p) {
      pts.push(p.clone().addScaledVector(tickDir, tickLen), p.clone().addScaledVector(tickDir, -tickLen));
    });
    if (pts.length) scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }

  function setup(fig, opts) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 1);
    renderer.autoClear = false;
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    var svg = fig.querySelector('svg');
    fig.insertBefore(canvas, fig.firstChild);
    if (svg) svg.style.display = 'none';

    var scene = new THREE.Scene();
    var spacing = opts.spacing, pages = opts.pages;
    var xEnd = spacing * (pages - 1);
    var k = 2 * Math.PI / (TURN_PAGES * spacing);          // 每單位長度的相位
    var omega = 2 * Math.PI / opts.turnSeconds;             // 固定一頁的箭頭每秒轉的相位
    var r = opts.radius;

    // 三條軸
    var xTicks = []; for (var i = 0; i < pages; i++) xTicks.push(new THREE.Vector3(i * spacing, 0, 0));
    var xTail = opts.beth ? 0.3 : 0.9;
    axis(scene, new THREE.Vector3(-0.8, 0, 0), new THREE.Vector3(xEnd + xTail, 0, 0), xTicks, new THREE.Vector3(0, 0, 1), 0.07);
    var yT = [], zT = []; [-1, 1].forEach(function (s) { yT.push(new THREE.Vector3(0, s * r, 0)); zT.push(new THREE.Vector3(0, 0, s * r)); });
    axis(scene, new THREE.Vector3(0, -r * 1.9, 0), new THREE.Vector3(0, r * 1.9, 0), yT, new THREE.Vector3(1, 0, 0), 0.06);
    axis(scene, new THREE.Vector3(0, 0, -r * 1.9), new THREE.Vector3(0, 0, r * 1.9), zT, new THREE.Vector3(1, 0, 0), 0.06);
    // 書頁：每一頁一片半透明平面（垂直於時間軸）
    var pageSize = r * 2.6;
    var pageGeo = new THREE.PlaneGeometry(pageSize, pageSize);
    var pageEdge = new THREE.EdgesGeometry(pageGeo);
    var pageMat = new THREE.MeshBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
    var pageEdgeMat = new THREE.LineBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0.3 });
    for (var n = 0; n < pages; n++) {
      var pl = new THREE.Mesh(pageGeo, pageMat); pl.rotation.y = Math.PI / 2; pl.position.x = n * spacing; scene.add(pl);
      var ed = new THREE.LineSegments(pageEdge, pageEdgeMat); ed.rotation.y = Math.PI / 2; ed.position.x = n * spacing; scene.add(ed);
      if (opts.numbers) { var sp = labelSprite(String(n + 1), '#bdbdbd', 0.32); sp.position.set(n * spacing, pageSize / 2 + 0.2, 0); scene.add(sp); }
    }

    // 相位箭頭（波包模式：格點從視野左外延伸到右外，長度乘上高斯包絡）
    var pk = opts.packet || null;
    var gridA = 0, gridB = xEnd, pkA = 0, pkB = 0;
    if (pk) { pkA = -pk.outL; pkB = xEnd + pk.outR; gridA = pkA - 3 * pk.sigma; gridB = pkB + 3 * pk.sigma; }
    var N = pk ? Math.round((gridB - gridA) / pk.dx) + 1 : opts.arrows;
    var dx = (gridB - gridA) / (N - 1);
    var arrows = [], xs = [];
    var hi = opts.highlight;
    for (var j = 0; j < N; j++) {
      var a = arrow(r, j === hi ? BLUE_HI : BLUE, j === hi ? 1 : 0.85, 0.02, 0.06, 0.24);
      a.position.x = gridA + j * dx; xs.push(gridA + j * dx);
      scene.add(a); arrows.push(a);
    }
    if (pk) omega = k * pk.speed;                           // 相速度＝群速度：整段螺旋剛性前進
    // 箭尖連線（螺旋）
    var tipPos = new Float32Array(N * 3);
    var tipGeo = new THREE.BufferGeometry(); tipGeo.setAttribute('position', new THREE.BufferAttribute(tipPos, 3));
    scene.add(new THREE.Line(tipGeo, new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.35 })));

    // 尖端的速度／加速度（掛在高亮箭頭上）
    var vArrow = null, aArrow = null;
    if (opts.tipArrows) {
      vArrow = arrow(0.7, GOLD, 1, 0.022, 0.065, 0.26);
      aArrow = arrow(0.5, RED, 1, 0.022, 0.065, 0.26);
      scene.add(vArrow); scene.add(aArrow);
    }

    // Beth 1936：細絲吊著的波片（細絲沿光的前進方向，扭轉軸＝光軸）
    var plate = null, plateX = xEnd + 0.3, fiberEnd = xEnd + 1.5;
    if (opts.beth) {
      plate = new THREE.Group();
      var disk = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.04, 48),
        new THREE.MeshBasicMaterial({ color: 0xcfd8dc, transparent: true, opacity: 0.28, depthWrite: false }));
      disk.rotation.z = Math.PI / 2; plate.add(disk);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.5, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: GRAY }));
      rim.rotation.y = Math.PI / 2; plate.add(rim);
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, r * 2.9, 0.035), new THREE.MeshBasicMaterial({ color: GRAY }));
      plate.add(stripe);                                   // 一條直徑，看得出扭轉
      plate.position.x = plateX;
      scene.add(plate);
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(plateX, 0, 0), new THREE.Vector3(fiberEnd, 0, 0)]),
        new THREE.LineBasicMaterial({ color: 0xe8e8e8 })));                     // 細絲
      var support = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: GRAY }));
      support.position.x = fiberEnd + 0.04; scene.add(support);                 // 固定端
    }

    var camMain = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    var camEnd = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camEnd.position.set(-4.2, r * 0.9, r * 1.3); camEnd.lookAt(xEnd * 0.35, 0, 0);
    var cx = (opts.beth ? fiberEnd : xEnd) / 2;
    var dist = (opts.beth ? fiberEnd : xEnd) * 0.6 + 1.9;
    var split = opts.endView ? 0.64 : 1;

    var W = 640, H = opts.height;
    function resize() {
      W = Math.min(fig.clientWidth || 640, 640); H = Math.round(W * opts.height / 640);
      renderer.setSize(W, H, false);
    }
    resize(); window.addEventListener('resize', resize);

    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);

    var tmp = new THREE.Vector3(), dirV = new THREE.Vector3(), dirA = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    var frames = 0, start = null;
    function update(time) {
      var xc = pk ? pkA + ((pk.speed * time) % (pkB - pkA)) : 0;
      var jMin = N, jMax = -1;
      for (var j = 0; j < N; j++) {
        var phi = k * xs[j] - omega * time;
        var e = 1;
        if (pk) {
          var d = (xs[j] - xc) / pk.sigma;
          e = Math.exp(-0.5 * d * d);
          arrows[j].visible = e > 0.04;
          arrows[j].scale.setScalar(Math.max(e, 0.001));
          if (e > 0.04) { if (j < jMin) jMin = j; jMax = j; }
        }
        arrows[j].rotation.x = phi;
        tipPos[3 * j] = xs[j]; tipPos[3 * j + 1] = r * e * Math.cos(phi); tipPos[3 * j + 2] = r * e * Math.sin(phi);
      }
      tipGeo.attributes.position.needsUpdate = true;
      if (pk) tipGeo.setDrawRange(jMax >= jMin ? jMin : 0, jMax >= jMin ? jMax - jMin + 1 : 0);
      if (vArrow) {
        var ph = k * xs[hi] - omega * time;
        tmp.set(xs[hi], r * Math.cos(ph), r * Math.sin(ph));
        dirV.set(0, Math.sin(ph), -Math.cos(ph));          // d/dt (cos φ, sin φ)，φ 隨時間減少
        dirA.set(0, -Math.cos(ph), -Math.sin(ph));         // 指向軸
        vArrow.position.copy(tmp); vArrow.quaternion.setFromUnitVectors(up, dirV);
        aArrow.position.copy(tmp); aArrow.quaternion.setFromUnitVectors(up, dirA);
      }
      if (plate) plate.rotation.x = 0.35 * (1 - Math.cos(2 * Math.PI * time / 4));   // 固定扭力下的扭擺：在 0 與最大扭角之間來回

      var az = -0.85 + 0.3 * Math.sin(time * 0.18);
      camMain.position.set(cx + dist * Math.sin(az), 1.6 + 0.3 * Math.sin(time * 0.12), dist * Math.cos(az));
      camMain.lookAt(cx, 0, 0);

      var pr = renderer.getPixelRatio();
      renderer.setScissorTest(false); renderer.clear();
      var wMain = Math.round(W * split);
      renderer.setViewport(0, 0, wMain, H); renderer.setScissor(0, 0, wMain, H); renderer.setScissorTest(true);
      camMain.aspect = wMain / H; camMain.updateProjectionMatrix();
      renderer.render(scene, camMain);
      if (opts.endView) {
        var x0 = wMain, wEnd = W - wMain;
        arrows.forEach(function (a, j) { a.userData.mat.opacity = j === hi ? 1 : 0.28; });
        renderer.setViewport(x0, 0, wEnd, H); renderer.setScissor(x0, 0, wEnd, H);
        camEnd.aspect = wEnd / H; camEnd.updateProjectionMatrix();
        renderer.render(scene, camEnd);
        arrows.forEach(function (a, j) { a.userData.mat.opacity = j === hi ? 1 : 0.85; });
      }
      frames++;
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      if (start === null) start = now;
      update((now - start) / 1000);
    }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: update };
  }


  // 多字標籤（寬度自動）
  function textSprite(text, cssColor, height) {
    var fs = 56, pad = 12;
    var c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = '600 ' + fs + 'px "Noto Sans TC", sans-serif';
    var w = Math.ceil(g.measureText(text).width) + pad * 2;
    c.width = w; c.height = fs + pad * 2;
    g = c.getContext('2d');
    g.font = '600 ' + fs + 'px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = cssColor; g.fillText(text, w / 2, c.height / 2 + 2);
    var tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(height * w / c.height, height, 1);
    return sp;
  }

  // 2.4：從側面看螺旋＝簡諧運動（3D 螺旋投影到牆上）
  function setupShm(fig) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 1);
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    var svg = fig.querySelector('svg');
    fig.insertBefore(canvas, fig.firstChild);
    if (svg) svg.style.display = 'none';

    var scene = new THREE.Scene();
    var R = 0.7, WZ = -1.5, v = 0.7, T = 3, om = 2 * Math.PI / T, S = 6, NS = 181, L = v * S;
    var MX = -0.6, CEIL = R + 0.7, BX = L + 0.7, BASE = -R - 0.3, BH = 1.3;
    renderer.localClippingEnabled = true;

    // 三條軸
    axis(scene, new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(L + 0.4, 0, 0), [], new THREE.Vector3(0, 0, 1), 0.06);
    axis(scene, new THREE.Vector3(0, -R * 1.5, 0), new THREE.Vector3(0, R * 1.5, 0), [new THREE.Vector3(0, R, 0), new THREE.Vector3(0, -R, 0)], new THREE.Vector3(1, 0, 0), 0.06);
    axis(scene, new THREE.Vector3(0, 0, WZ + 0.1), new THREE.Vector3(0, 0, R * 1.5), [new THREE.Vector3(0, 0, R), new THREE.Vector3(0, 0, -R)], new THREE.Vector3(1, 0, 0), 0.06);

    // 牆
    var x0 = MX - 0.55, x1 = L + 0.5, y0 = BASE - 0.45, y1 = CEIL + 0.3;
    var wallGeo = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
    var wall = new THREE.Mesh(wallGeo, new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    wall.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ - 0.01); scene.add(wall);
    var wallEdge = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.3 }));
    wallEdge.position.copy(wall.position); scene.add(wallEdge);
    // 牆上的時間軸（影子的中線）
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, WZ), new THREE.Vector3(L, 0, WZ)]),
      new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.35 })));

    // 旋轉的箭頭與它尖端畫出的螺旋
    var arr = arrow(R, BLUE, 1, 0.025, 0.07, 0.26); scene.add(arr);
    function dynLine(n, mat) {
      var pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var line = new THREE.Line(geo, mat); scene.add(line);
      return { pos: pos, geo: geo, line: line };
    }
    var hPts = [];
    for (var i = 0; i < NS; i++) { var s0 = S * i / (NS - 1); hPts.push(new THREE.Vector3(v * s0, R * Math.cos(-om * s0), R * Math.sin(-om * s0))); }
    var helixMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hPts), 360, 0.022, 8, false),
      new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.9 }));
    scene.add(helixMesh);
    // 牆上的影子：一條向 +x 流動的正弦管，只顯示 0 ≤ x ≤ L
    var lam = v * T, sPts = [];
    for (var i2 = 0; i2 <= 240; i2++) { var xx = -lam + (L + lam) * i2 / 240; sPts.push(new THREE.Vector3(xx, R * Math.cos(om * xx / v), WZ + 0.01)); }
    var shadowMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sPts), 480, 0.02, 6, false),
      new THREE.MeshBasicMaterial({ color: GOLD, clippingPlanes: [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), L)] }));
    scene.add(shadowMesh);
    var dropLine = dynLine(2, new THREE.LineDashedMaterial({ color: 0xdddddd, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.7 }));
    var toMass = dynLine(2, new THREE.LineDashedMaterial({ color: 0xdddddd, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.7 }));

    // 牆上的彈簧與質量
    var ceilPts = [new THREE.Vector3(MX - 0.28, CEIL, WZ), new THREE.Vector3(MX + 0.28, CEIL, WZ)];
    for (var h = 0; h < 6; h++) { ceilPts.push(new THREE.Vector3(MX - 0.25 + h * 0.1, CEIL, WZ), new THREE.Vector3(MX - 0.31 + h * 0.1, CEIL + 0.08, WZ)); }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ceilPts), new THREE.LineBasicMaterial({ color: GRAY })));
    var NSP = 16, spring = dynLine(NSP, new THREE.LineBasicMaterial({ color: 0xe8e8e8 }));
    var mass = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.06), new THREE.MeshBasicMaterial({ color: GOLD }));
    scene.add(mass);

    var sl = textSprite('彈簧', '#e4e2dd', 0.2); sl.position.set(MX, BASE - 0.2, WZ); scene.add(sl);
    var wl = textSprite('簡諧運動', '#e0a800', 0.2); wl.position.set(L / 2, BASE - 0.2, WZ); scene.add(wl);

    var cam = new THREE.PerspectiveCamera(34, 2, 0.1, 100);
    var cx = (x0 + x1) / 2, zc = WZ / 2, dist = 6.1;
    var Wd = 640, Hd = 300;
    function resize() { Wd = Math.min(fig.clientWidth || 640, 640); Hd = Math.round(Wd * 300 / 640); renderer.setSize(Wd, Hd, false); cam.aspect = Wd / Hd; cam.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);

    var frames = 0, start = null;
    function update(t) {
      var th = om * t, y = R * Math.cos(th);
      arr.rotation.x = th;
      helixMesh.rotation.x = th;
      shadowMesh.position.x = (v * t) % lam;
      dropLine.pos.set([0, y, R * Math.sin(th), 0, y, WZ], 0); dropLine.geo.attributes.position.needsUpdate = true; dropLine.line.computeLineDistances();
      toMass.pos.set([0, y, WZ, MX + 0.12, y, WZ], 0); toMass.geo.attributes.position.needsUpdate = true; toMass.line.computeLineDistances();
      var top = CEIL, bot = y + 0.12, len = bot - top;
      spring.pos.set([MX, top, WZ, MX, top + len * 0.08, WZ], 0);
      for (var k2 = 1; k2 <= NSP - 4; k2++) spring.pos.set([MX + (k2 % 2 ? 0.09 : -0.09), top + len * (0.08 + 0.84 * (k2 - 0.5) / (NSP - 4)), WZ], 3 * (k2 + 1));
      spring.pos.set([MX, top + len * 0.92, WZ], 3 * (NSP - 2)); spring.pos.set([MX, bot, WZ], 3 * (NSP - 1));
      spring.geo.attributes.position.needsUpdate = true;
      mass.position.set(MX, y, WZ);
      var az = -0.38 + 0.08 * Math.sin(t * 0.15);
      cam.position.set(cx - dist * Math.sin(az), 1.9 + 0.12 * Math.sin(t * 0.1), zc + dist * Math.cos(az));
      cam.lookAt(cx, 0.1, zc);
      renderer.render(scene, cam);
      frames++;
    }
    function frame(now) { requestAnimationFrame(frame); if (!visible || document.hidden) return; if (start === null) start = now; update((now - start) / 1000); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: update };
  }


  // 2.5：螺旋繞成甜甜圈的駐波（兩道反向繞行的螺旋疊加）
  function setupTorus(fig) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 1);
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    fig.insertBefore(canvas, fig.firstChild);

    var scene = new THREE.Scene();
    var RM = 1.7, A = 0.55, NW = 5, T = 2.4, om = 2 * Math.PI / T, NA = 80, NK = 400;
    var up = new THREE.Vector3(0, 1, 0);

    // 淡淡的甜甜圈表面與中心圓
    var torusGeo = new THREE.TorusGeometry(RM, A, 24, 120);
    var torus = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    torus.rotation.x = Math.PI / 2; scene.add(torus);
    var wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusGeometry(RM, A, 10, 60)), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.08 }));
    wire.rotation.x = Math.PI / 2; scene.add(wire);
    var ringPts = [];
    for (var i = 0; i <= 180; i++) { var q = 2 * Math.PI * i / 180; ringPts.push(new THREE.Vector3(RM * Math.cos(q), 0, RM * Math.sin(q))); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.5 })));

    // 兩道反向繞行的螺旋（形狀固定，整條繞 y 軸轉 ±ωt/NW）
    function knot(sign, color) {
      var pts = [];
      for (var i = 0; i <= NK; i++) {
        var th = 2 * Math.PI * i / NK, ph = sign * NW * th;
        var rr = RM + A * Math.cos(ph);
        pts.push(new THREE.Vector3(rr * Math.cos(th), A * Math.sin(ph), rr * Math.sin(th)));
      }
      var m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 800, 0.016, 6, true),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.55 }));
      scene.add(m); return m;
    }
    var k1 = knot(1, BLUE), k2 = knot(-1, GOLD);

    // 駐波：兩道螺旋的平均。每一處的箭頭一起轉（相位＝能量），長度 |cos(NW θ)| 固定，節點不動
    var arrows = [], thetas = [];
    for (var j = 0; j < NA; j++) {
      var th = 2 * Math.PI * j / NA;
      var a = arrow(A, BLUE_HI, 0.95, 0.018, 0.05, 0.18);
      a.position.set(RM * Math.cos(th), 0, RM * Math.sin(th));
      scene.add(a); arrows.push(a); thetas.push(th);
    }
    var tipPos = new Float32Array((NA + 1) * 3), tipGeo = new THREE.BufferGeometry();
    tipGeo.setAttribute('position', new THREE.BufferAttribute(tipPos, 3));
    scene.add(new THREE.Line(tipGeo, new THREE.LineBasicMaterial({ color: BLUE_HI, transparent: true, opacity: 0.6 })));

    var cam = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
    var Wd = 640, Hd = 320;
    function resize() { Wd = Math.min(fig.clientWidth || 640, 640); Hd = Math.round(Wd * 320 / 640); renderer.setSize(Wd, Hd, false); cam.aspect = Wd / Hd; cam.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);

    var dir = new THREE.Vector3(), rhat = new THREE.Vector3();
    var frames = 0, start = null;
    function update(t) {
      k1.rotation.y = -om * t / NW;       // 螺旋 1 往一個方向繞
      k2.rotation.y = om * t / NW;        // 螺旋 2 往反方向繞
      var ps = -om * t;
      for (var j = 0; j < NA; j++) {
        var th = thetas[j], amp = Math.cos(NW * th);
        rhat.set(Math.cos(th), 0, Math.sin(th));
        var psi = amp >= 0 ? ps : ps + Math.PI;
        dir.copy(rhat).multiplyScalar(Math.cos(psi)).addScaledVector(up, Math.sin(psi));
        arrows[j].quaternion.setFromUnitVectors(up, dir);
        var s = Math.abs(amp); arrows[j].scale.setScalar(Math.max(s, 0.001)); arrows[j].visible = s > 0.04;
        var base = arrows[j].position;
        tipPos[3 * j] = base.x + A * amp * Math.cos(ps) * rhat.x; tipPos[3 * j + 1] = A * amp * Math.sin(ps); tipPos[3 * j + 2] = base.z + A * amp * Math.cos(ps) * rhat.z;
      }
      tipPos[3 * NA] = tipPos[0]; tipPos[3 * NA + 1] = tipPos[1]; tipPos[3 * NA + 2] = tipPos[2];
      tipGeo.attributes.position.needsUpdate = true;
      var az = 0.5 + 0.35 * Math.sin(t * 0.12);
      cam.position.set(5.2 * Math.sin(az), 2.6 + 0.2 * Math.sin(t * 0.1), 5.2 * Math.cos(az));
      cam.lookAt(0, -0.1, 0);
      renderer.render(scene, cam);
      frames++;
    }
    function frame(now) { requestAnimationFrame(frame); if (!visible || document.hidden) return; if (start === null) start = now; update((now - start) / 1000); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: update };
  }

  function init() {
    var a = document.getElementById('helix3d-a'), b = document.getElementById('helix3d-b');
    window.__helix3d = {};
    var shm = document.getElementById('shm3d');
    if (shm) window.__helix3d.shm = setupShm(shm);
    var tor = document.getElementById('torus3d');
    if (tor) window.__helix3d.torus = setupTorus(tor);
    if (a) window.__helix3d.a = setup(a, { height: 320, pages: 9, spacing: 0.7, radius: 0.7, highlight: -1, numbers: true, tipArrows: false, endView: false, packet: { sigma: 0.8, speed: 1.6, outL: 4.2, outR: 6.4, dx: 0.156 } });
    if (b) window.__helix3d.b = setup(b, { height: 250, pages: 7, spacing: 0.7, radius: 0.55, arrows: 29, highlight: -1, numbers: false, tipArrows: false, endView: false, beth: true, turnSeconds: 2.4 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

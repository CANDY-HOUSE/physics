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
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
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
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
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
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
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


  // 2.5：猜測——電子是一顆繞兩圈的光子（Williamson 與 van der Mark 1997）
  function setupDoubleLoop(fig) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    fig.insertBefore(canvas, fig.firstChild);

    var scene = new THREE.Scene();
    var RM = 1.5, A = 0.6, TL = 3, om = 2 * Math.PI / TL;       // 一圈 3 秒，兩圈 6 秒
    var up = new THREE.Vector3(0, 1, 0);
    function pathPoint(s, out) {                                  // s：繞大圓的角度；繞管子的角度是 s/2
      var ph = s / 2, rr = RM + A * Math.cos(ph);
      return (out || new THREE.Vector3()).set(rr * Math.cos(s), A * Math.sin(ph), rr * Math.sin(s));
    }

    // 淡淡的甜甜圈
    var torus = new THREE.Mesh(new THREE.TorusGeometry(RM, A, 24, 120), new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    torus.rotation.x = Math.PI / 2; scene.add(torus);
    var wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusGeometry(RM, A, 10, 60)), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.07 }));
    wire.rotation.x = Math.PI / 2; scene.add(wire);

    // 光子的路徑：繞大圓兩圈、繞管子一圈才首尾相接
    var pts = [];
    for (var i = 0; i <= 480; i++) pts.push(pathPoint(4 * Math.PI * i / 480));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 960, 0.015, 6, true),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.45 })));

    // 光子與它身上的電場箭頭（從管子中心指向光子；繞一圈翻轉，繞兩圈才復原）
    var photon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: GOLD }));
    scene.add(photon);
    var efield = arrow(0.75, BLUE_HI, 1, 0.022, 0.065, 0.24); scene.add(efield);
    var trail = [], NT = 60;
    var trailPos = new Float32Array(NT * 3), trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    scene.add(new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: GOLD })));

    // 外圍：從遠處看，電場都朝外，像一個電荷
    var golden = Math.PI * (3 - Math.sqrt(5)), NR = 30, RO = 3.1;
    for (var k = 0; k < NR; k++) {
      var yv = 1 - 2 * (k + 0.5) / NR, rad = Math.sqrt(1 - yv * yv), th = golden * k;
      var d = new THREE.Vector3(rad * Math.cos(th), yv, rad * Math.sin(th));
      var fa = arrow(0.38, BLUE, 0.45, 0.012, 0.04, 0.14);
      fa.position.copy(d).multiplyScalar(RO); fa.quaternion.setFromUnitVectors(up, d); scene.add(fa);
    }

    var lap1 = textSprite('第 1 圈', '#e4e2dd', 0.34), lap2 = textSprite('第 2 圈', '#e4e2dd', 0.34);
    [lap1, lap2].forEach(function (sp) { sp.position.set(0, 1.35, 0); scene.add(sp); });

    var cam = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
    var Wd = 640, Hd = 320;
    function resize() { Wd = Math.min(fig.clientWidth || 640, 640); Hd = Math.round(Wd * 320 / 640); renderer.setSize(Wd, Hd, false); cam.aspect = Wd / Hd; cam.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);

    var p = new THREE.Vector3(), core = new THREE.Vector3(), dir = new THREE.Vector3(), tmp = new THREE.Vector3();
    var frames = 0, start = null;
    function update(t) {
      var s = (om * t) % (4 * Math.PI);
      pathPoint(s, p); photon.position.copy(p);
      core.set(RM * Math.cos(s), 0, RM * Math.sin(s));             // 管子中心
      dir.copy(p).sub(core).normalize();
      efield.position.copy(p); efield.quaternion.setFromUnitVectors(up, dir);
      for (var i = 0; i < NT; i++) {
        pathPoint(s - 0.9 * i / (NT - 1), tmp);
        trailPos[3 * i] = tmp.x; trailPos[3 * i + 1] = tmp.y; trailPos[3 * i + 2] = tmp.z;
      }
      trailGeo.attributes.position.needsUpdate = true;
      var second = s >= 2 * Math.PI;
      lap1.visible = !second; lap2.visible = second;
      var az = 0.7 + 0.3 * Math.sin(t * 0.1);
      cam.position.set(5.9 * Math.sin(az), 2.7 + 0.2 * Math.sin(t * 0.08), 5.9 * Math.cos(az));
      cam.lookAt(0, 0.25, 0);
      renderer.render(scene, cam);
      frames++;
    }
    function frame(now) { requestAnimationFrame(frame); if (!visible || document.hidden) return; if (start === null) start = now; update((now - start) / 1000); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: update };
  }


  // 2.5：猜測——萬物由光組成？
  // 左：質量＝關住的光 → 周圍的鐘變慢 → 萬物都往鐘慢處掉（引力，一視同仁）
  // 右：電荷＝繞看不見小圓單向打轉的波（駐波正反各半、淨電荷為零）→ 周圍的小圓轉速改變 → 順繞的被推開、逆繞的被拉近、不繞的不動（電力，有正有負）
  function setupUnify(fig) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    fig.insertBefore(canvas, fig.firstChild);
    var scene = new THREE.Scene();
    var RED = 0xfc6255, CL = -3.4, CR = 3.4, W0 = 2 * Math.PI / 2.4;   // 遠處每 2.4 秒轉一圈
    var up = new THREE.Vector3(0, 1, 0);

    function floor(cx) {
      var pts = [], H = 2.6;
      for (var i = 0; i <= 8; i++) { var u = -H + 2 * H * i / 8; pts.push(new THREE.Vector3(cx - H, 0, u), new THREE.Vector3(cx + H, 0, u), new THREE.Vector3(cx + u, 0, -H), new THREE.Vector3(cx + u, 0, H)); }
      scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.12 })));
    }
    floor(CL); floor(CR);
    function rate(r) { return Math.exp(-r * r / 1.6); }               // 源附近效應最強，遠處趨近 0

    // ── 左：一格一格的鐘（平放，指針在地面上轉） ──
    var clocks = [], grid = [];
    for (var ix = -3; ix <= 3; ix++) for (var iz = -2; iz <= 2; iz++) { var gx = ix * 0.75, gz = iz * 0.95; if (Math.hypot(gx, gz) > 0.7) grid.push([gx, gz]); }
    var ringGeo = new THREE.RingGeometry(0.17, 0.19, 32);
    grid.forEach(function (p) {
      var r = Math.hypot(p[0], p[1]);
      var face = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xd8d8d8, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
      face.rotation.x = -Math.PI / 2; face.position.set(CL + p[0], 0.01, p[1]); scene.add(face);
      var hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.15), new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }));
      hand.geometry.translate(0, 0, -0.075);
      var pivot = new THREE.Group(); pivot.position.set(CL + p[0], 0.02, p[1]); pivot.add(hand); scene.add(pivot);
      clocks.push({ pivot: pivot, speed: W0 * (1 - 0.75 * rate(r)) });   // 越靠近質量，鐘越慢
    });
    // 中央：關住的光（金環＋原地振動的駐波）
    var massObj = new THREE.Group(); massObj.position.set(CL, 0.35, 0); scene.add(massObj);
    var mRing = [], NSp = 48, ringR = 0.3;
    for (var i = 0; i <= 96; i++) { var q = 2 * Math.PI * i / 96; mRing.push(new THREE.Vector3(ringR * Math.cos(q), 0, ringR * Math.sin(q))); }
    massObj.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(mRing), new THREE.LineBasicMaterial({ color: GOLD })));
    var spikePos = new Float32Array(NSp * 6), spikeGeo = new THREE.BufferGeometry();
    spikeGeo.setAttribute('position', new THREE.BufferAttribute(spikePos, 3));
    massObj.add(new THREE.LineSegments(spikeGeo, new THREE.LineBasicMaterial({ color: BLUE_HI })));
    // 兩個不同的東西（白球、藍球）從外面放手：都往中央掉，而且掉得一樣
    var fallers = [[0xf0f0f0, 2.4, 0.6], [BLUE, 2.4, 2.6]].map(function (a) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: a[0] }));
      scene.add(m); return { m: m, r0: a[1], ang: a[2] };
    });

    // ── 右：一格一格看不見的小圓（直立的小環，上面一點在轉） ──
    var circles = [];
    var hcGeo = new THREE.TorusGeometry(0.17, 0.008, 6, 40);
    grid.forEach(function (p) {
      var r = Math.hypot(p[0], p[1]);
      var g = new THREE.Group(); g.position.set(CR + p[0], 0.22, p[1]); scene.add(g);
      g.add(new THREE.Mesh(hcGeo, new THREE.MeshBasicMaterial({ color: 0xa98fbd, transparent: true, opacity: 0.8 })));
      var tick = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd9c6e8 })); g.add(tick);
      circles.push({ g: g, tick: tick, speed: W0 * (1 + 1.2 * rate(r)) });  // 越靠近電荷，小圓轉得越快
    });
    // 電荷：身上有自己的小圓，金點順繞＝正、逆繞＝負、不繞＝中性
    function charge(q, color) {
      var g = new THREE.Group(); scene.add(g);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: color })));
      var cp = []; for (var i = 0; i <= 64; i++) { var a = 2 * Math.PI * i / 64; cp.push(new THREE.Vector3(0.26 * Math.cos(a), 0.26 * Math.sin(a), 0)); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: q === 0 ? 0.25 : 0.7 })));
      var dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: GOLD })); g.add(dot);
      return { g: g, dot: dot, q: q };
    }
    var src = charge(1, RED); src.g.position.set(CR, 0.35, 0);
    var tests = [
      { c: charge(1, RED), ang: 0.5 },      // 同號：被推開
      { c: charge(-1, BLUE), ang: 2.3 },    // 異號：被拉近
      { c: charge(0, 0x9a9a9a), ang: 4.0 }  // 中性：不動
    ];

    // 標題
    function label(txt, color, h, x, y) { var s = textSprite(txt, color, h); s.position.set(x, y, -1.6); scene.add(s); return s; }
    label('質量＝關住的光', '#e0a800', 0.32, CL, 1.95);
    label('周圍的鐘變慢，萬物都往裡掉', '#e4e2dd', 0.24, CL, 1.58);
    label('電荷＝繞小圓打轉的波', '#e0a800', 0.32, CR, 1.95);
    label('周圍的小圓轉快，只有繞的會動', '#e4e2dd', 0.24, CR, 1.58);

    var cam = new THREE.PerspectiveCamera(34, 2, 0.1, 100);
    var Wd = 640, Hd = 340;
    function resize() { Wd = Math.min(fig.clientWidth || 640, 640); Hd = Math.round(Wd * 340 / 640); renderer.setSize(Wd, Hd, false); cam.aspect = Wd / Hd; cam.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
    function ease(x) { x = Math.min(Math.max(x, 0), 1); return x * x; }

    var frames = 0, start = null;
    function update(t) {
      // 鐘：角度＝速度×時間（越近越慢）
      clocks.forEach(function (c) { c.pivot.rotation.y = -c.speed * t; });
      // 關住的光：駐波原地振動
      var ps = -2 * Math.PI * t / 0.9;
      for (var j = 0; j < NSp; j++) {
        var th = 2 * Math.PI * j / NSp, amp = 0.18 * Math.cos(3 * th);
        var rx = Math.cos(th), rz = Math.sin(th), bx = ringR * rx, bz = ringR * rz;
        spikePos.set([bx, 0, bz, bx + amp * Math.cos(ps) * rx, amp * Math.sin(ps), bz + amp * Math.cos(ps) * rz], 6 * j);
      }
      spikeGeo.attributes.position.needsUpdate = true;
      // 掉落：兩個不同的東西以同樣的方式加速掉向中央（5 秒一輪）
      var tf = t % 5, fr = ease(tf / 4.2);
      fallers.forEach(function (f) { var r = f.r0 - (f.r0 - 0.5) * fr; f.m.position.set(CL + r * Math.cos(f.ang), 0.09, r * Math.sin(f.ang)); f.m.visible = tf < 4.6; });

      // 小圓：點的角度＝轉速×時間（越近越快）
      circles.forEach(function (c) { var a = c.speed * t; c.tick.position.set(0.17 * Math.cos(a), 0.17 * Math.sin(a), 0); });
      // 源電荷與測試電荷自己的小圓
      function spin(c) { var a = c.q * W0 * 1.6 * t; c.dot.position.set(0.26 * Math.cos(a), 0.26 * Math.sin(a), 0); }
      spin(src);
      var tc = t % 5, fc = ease(tc / 4.2);
      tests.forEach(function (o) {
        var r = o.c.q > 0 ? 1.1 + 1.4 * fc : o.c.q < 0 ? 2.4 - 1.7 * fc : 1.9;
        o.c.g.position.set(CR + r * Math.cos(o.ang), 0.35, r * Math.sin(o.ang));
        o.c.g.visible = tc < 4.6;
        spin(o.c);
      });

      var az = 0.1 * Math.sin(t * 0.12);
      cam.position.set(9.4 * Math.sin(az), 4.2, 9.4 * Math.cos(az));
      cam.lookAt(0, -0.2, 0);
      renderer.render(scene, cam);
      frames++;
    }
    function frame(now) { requestAnimationFrame(frame); if (!visible || document.hidden) return; if (start === null) start = now; update((now - start) / 1000); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: update };
  }



  // ───────── 強力、弱力的幾何：共用舞台 ─────────
  var RED3 = 0xfc6255, GREEN3 = 0x83c167, BLUE3 = 0x58c4dd;
  function stage(fig, height, build) {
    var canvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.maxWidth = '640px'; canvas.style.margin = '0 auto'; canvas.style.borderRadius = '6px';
    fig.insertBefore(canvas, fig.firstChild);
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 640 / height, 0.1, 100);
    function resize() { var W = Math.min(fig.clientWidth || 640, 640), H = Math.round(W * height / 640); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
    var update = build(scene, cam), frames = 0, start = null;
    function once(t) { update(t); renderer.render(scene, cam); frames++; }
    function frame(now) { requestAnimationFrame(frame); if (!visible || document.hidden) return; if (start === null) start = now; once((now - start) / 1000); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: once, scene: scene, cam: cam };
  }
  function ringLine(r, color, opacity) {
    var p = []; for (var i = 0; i <= 64; i++) { var a = 2 * Math.PI * i / 64; p.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity === undefined ? 1 : opacity }));
  }
  function wireSphere(r, color, opacity) {
    return new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(r, 16, 10)), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
  }
  function smooth(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  // 球面上的方向記號：金色長箭頭＋藍色短箭頭（看得出轉了哪裡）
  function orientMarker(R) {
    var g = new THREE.Group();
    var a1 = arrow(R * 0.95, GOLD, 1, 0.025, 0.07, 0.22); g.add(a1);
    var a2 = arrow(R * 0.6, BLUE3, 1, 0.022, 0.06, 0.18); a2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)); g.add(a2);
    return g;
  }

  // 1. 看不見的形狀有幾種轉法，就有幾種傳力粒子：圓 1、球面 3、CP² 8
  function setupShapes(fig) {
    return stage(fig, 340, function (scene, cam) {
      var X = [-3.3, 0, 3.3], Y0 = 0.1;
      // 圓
      var circ = new THREE.Group(); circ.position.set(X[0], Y0, 0); scene.add(circ);
      circ.add(ringLine(0.85, GRAY, 0.8));
      var cdot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: GOLD })); circ.add(cdot);
      // 球面
      var sph = new THREE.Group(); sph.position.set(X[1], Y0, 0); scene.add(sph);
      var sbody = new THREE.Group(); sph.add(sbody);
      sbody.add(wireSphere(0.85, GRAY, 0.22)); sbody.add(orientMarker(0.85));
      var axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)], axisCols = [RED3, GREEN3, BLUE3];
      var axisArrows = axes.map(function (v, i) { var a = arrow(1.35, axisCols[i], 1, 0.018, 0.055, 0.18); a.position.copy(v).multiplyScalar(-1.35 / 2 * 0); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); sph.add(a); return a; });
      // CP²：用紅、綠、藍三個相位盤代表它的一個點
      var cp = new THREE.Group(); cp.position.set(X[2], Y0, 0); scene.add(cp);
      var dialPos = [[0, 0.62], [-0.62, -0.42], [0.62, -0.42]], dialCol = [RED3, GREEN3, BLUE3], DR = 0.36;
      var dials = dialPos.map(function (p, i) {
        var g = new THREE.Group(); g.position.set(p[0], p[1], 0); cp.add(g);
        g.add(ringLine(DR, dialCol[i], 0.55));
        var a = arrow(DR, dialCol[i], 1, 0.02, 0.055, 0.16); g.add(a);
        return a;
      });
      // Gell-Mann 八個生成元（複數 3×3：[re, im]）
      function M() { var m = []; for (var i = 0; i < 3; i++) { m.push([]); for (var j = 0; j < 3; j++) m[i].push([0, 0]); } return m; }
      var L = [];
      var l1 = M(); l1[0][1] = [1, 0]; l1[1][0] = [1, 0]; L.push(l1);
      var l2 = M(); l2[0][1] = [0, -1]; l2[1][0] = [0, 1]; L.push(l2);
      var l3 = M(); l3[0][0] = [1, 0]; l3[1][1] = [-1, 0]; L.push(l3);
      var l4 = M(); l4[0][2] = [1, 0]; l4[2][0] = [1, 0]; L.push(l4);
      var l5 = M(); l5[0][2] = [0, -1]; l5[2][0] = [0, 1]; L.push(l5);
      var l6 = M(); l6[1][2] = [1, 0]; l6[2][1] = [1, 0]; L.push(l6);
      var l7 = M(); l7[1][2] = [0, -1]; l7[2][1] = [0, 1]; L.push(l7);
      var s3 = 1 / Math.sqrt(3), l8 = M(); l8[0][0] = [s3, 0]; l8[1][1] = [s3, 0]; l8[2][2] = [-2 * s3, 0]; L.push(l8);
      function evolve(psi, H, theta) {                            // ψ ← exp(−iθH/2) ψ，RK4
        var n = 48, h = theta / n;
        function f(p) { var out = []; for (var i = 0; i < 3; i++) { var re = 0, im = 0; for (var j = 0; j < 3; j++) { var a = H[i][j][0] / 2, b = H[i][j][1] / 2, c = p[j][0], d = p[j][1]; re += a * c - b * d; im += a * d + b * c; } out.push([im, -re]); } return out; }
        function add(p, k, s) { return p.map(function (z, i) { return [z[0] + s * k[i][0], z[1] + s * k[i][1]]; }); }
        var p = psi;
        for (var s = 0; s < n; s++) { var k1 = f(p), k2 = f(add(p, k1, h / 2)), k3 = f(add(p, k2, h / 2)), k4 = f(add(p, k3, h)); p = p.map(function (z, i) { return [z[0] + h / 6 * (k1[i][0] + 2 * k2[i][0] + 2 * k3[i][0] + k4[i][0]), z[1] + h / 6 * (k1[i][1] + 2 * k2[i][1] + 2 * k3[i][1] + k4[i][1])]; }); }
        return p;
      }
      var psi0 = [[0.78, 0], [0.5, 0.2], [0.26, -0.18]]; var nrm = Math.sqrt(psi0.reduce(function (s, z) { return s + z[0] * z[0] + z[1] * z[1]; }, 0)); psi0 = psi0.map(function (z) { return [z[0] / nrm, z[1] / nrm]; });
      // 標籤
      function lbl(txt, col, h, x, y) { var s = textSprite(txt, col, h); s.position.set(x, y, 0); scene.add(s); return s; }
      lbl('圓', '#e4e2dd', 0.3, X[0], 1.55); lbl('球面', '#e4e2dd', 0.3, X[1], 1.55); lbl('CP²（4 維，以三色相位代表）', '#e4e2dd', 0.24, X[2], 1.55);
      lbl('1 種轉法：光子', '#e0a800', 0.26, X[0], -1.35); lbl('3 種轉法：W⁺ W⁻ Z', '#e0a800', 0.26, X[1], -1.35); lbl('8 種轉法：8 種膠子', '#e0a800', 0.26, X[2], -1.35);
      var sCount = [1, 2, 3].map(function (k) { var s = lbl('第 ' + k + ' 種', '#bdbdbd', 0.2, X[1], -1.72); return s; });
      var gCount = [1, 2, 3, 4, 5, 6, 7, 8].map(function (k) { return lbl('第 ' + k + ' 種', '#bdbdbd', 0.2, X[2], -1.72); });
      var q = new THREE.Quaternion(), q0 = new THREE.Quaternion();
      cam.position.set(0, 1.0, 9.2); cam.lookAt(0, -0.05, 0);
      return function (t) {
        var a = 2 * Math.PI * t / 3; cdot.position.set(0.85 * Math.cos(a), 0.85 * Math.sin(a), 0);
        // 球面：每 2.5 秒換一個軸，轉一整圈
        var ks = Math.floor(t / 2.5) % 3, us = (t % 2.5) / 2.5;
        q.setFromAxisAngle(axes[ks], 2 * Math.PI * smooth(us)); sbody.quaternion.copy(q);
        axisArrows.forEach(function (ar, i) { ar.visible = i === ks; });
        sCount.forEach(function (s, i) { s.visible = i === ks; });
        // CP²：每 2.5 秒換一個生成元，轉 θ 從 0 到 2π 再回來
        var kg = Math.floor(t / 2.5) % 8, ug = (t % 2.5) / 2.5, th = 2 * Math.PI * Math.sin(Math.PI * ug);
        var p = evolve(psi0, L[kg], th);
        dials.forEach(function (d, i) { var mag = Math.hypot(p[i][0], p[i][1]), ang = Math.atan2(p[i][1], p[i][0]); d.scale.setScalar(Math.max(mag, 0.02)); d.rotation.z = ang - Math.PI / 2; });
        gCount.forEach(function (s, i) { s.visible = i === kg; });
        var az = 0.12 * Math.sin(t * 0.15); cam.position.set(9.2 * Math.sin(az), 1.0, 9.2 * Math.cos(az)); cam.lookAt(0, -0.05, 0);
      };
    });
  }

  // 2. 先後順序：圓的轉動先後無關；球面的轉動先後不同、結果就不同
  function setupOrder(fig) {
    return stage(fig, 320, function (scene, cam) {
      var X = [-4.2, -1.9, 1.9, 4.2], R = 0.75;
      function lbl(txt, col, h, x, y) { var s = textSprite(txt, col, h); s.position.set(x, y, 0); scene.add(s); return s; }
      // 圓：兩份，一份先轉 α 再轉 β，一份先 β 再 α
      var circles = [0, 1].map(function (i) {
        var g = new THREE.Group(); g.position.set(X[i], 0, 0); scene.add(g);
        g.add(ringLine(R, GRAY, 0.8));
        var ptr = arrow(R, GOLD, 1, 0.025, 0.07, 0.2); g.add(ptr);
        return ptr;
      });
      // 球面：兩份
      var spheres = [2, 3].map(function (i) {
        var g = new THREE.Group(); g.position.set(X[i], 0, 0); scene.add(g);
        var body = new THREE.Group(); g.add(body); body.add(wireSphere(R, GRAY, 0.22)); body.add(orientMarker(R));
        return body;
      });
      lbl('圓：先 α 再 β', '#e4e2dd', 0.21, X[0], 1.45); lbl('圓：先 β 再 α', '#e4e2dd', 0.21, X[1], 1.45);
      lbl('球面：先繞 x 再繞 y', '#e4e2dd', 0.21, X[2], 1.45); lbl('球面：先繞 y 再繞 x', '#e4e2dd', 0.21, X[3], 1.45);
      var same = lbl('結果一樣：光子不互相扭動', '#83c167', 0.24, (X[0] + X[1]) / 2, -1.45);
      var diff = lbl('結果不同：W 與膠子會互相扭動', '#fc6255', 0.24, (X[2] + X[3]) / 2, -1.45);
      var ex = new THREE.Vector3(1, 0, 0), ey = new THREE.Vector3(0, 1, 0);
      var qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qt = new THREE.Quaternion(), id = new THREE.Quaternion();
      var A1 = 0.9, B1 = 1.6;                                    // 圓的兩個轉角
      cam.position.set(0, 1.4, 10.5); cam.lookAt(0, -0.05, 0);
      return function (t) {
        var T = 7, u = t % T, s1 = smooth(u / 2.2), s2 = smooth((u - 2.4) / 2.2);
        // 圓
        circles[0].rotation.z = A1 * s1 + B1 * s2; circles[1].rotation.z = B1 * s1 + A1 * s2;
        // 球面：各轉 90 度
        var h = Math.PI / 2;
        qa.setFromAxisAngle(ex, h * s1); qb.setFromAxisAngle(ey, h * s2); qt.multiplyQuaternions(qb, qa); spheres[0].quaternion.copy(qt);   // 先 x 後 y
        qa.setFromAxisAngle(ey, h * s1); qb.setFromAxisAngle(ex, h * s2); qt.multiplyQuaternions(qb, qa); spheres[1].quaternion.copy(qt);   // 先 y 後 x
        same.visible = diff.visible = u > 4.7;
        var az = 0.1 * Math.sin(t * 0.13); cam.position.set(10.5 * Math.sin(az), 1.4, 10.5 * Math.cos(az)); cam.lookAt(0, -0.05, 0);
      };
    });
  }

  // 3. 壓扁：圓球三種轉法都不費力；壓扁後只剩繞對稱軸的不費力，其餘的費力→傳力粒子變重
  function setupSquash(fig) {
    return stage(fig, 320, function (scene, cam) {
      var R = 1.0;
      var holder = new THREE.Group(); scene.add(holder);
      var body = new THREE.Group(); holder.add(body);
      var surf = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24), new THREE.MeshBasicMaterial({ color: 0x9fb6c8, transparent: true, opacity: 0.12, depthWrite: false }));
      body.add(surf); body.add(wireSphere(R, GRAY, 0.3));
      var ghost = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R, 16, 10)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 }));
      holder.add(ghost);                                          // 原位的輪廓：看得出轉動後形狀有沒有變
      var axes = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)], cols = [GREEN3, RED3, RED3];
      var axisArrows = axes.map(function (v, i) { var a = arrow(1.6, cols[i], 1, 0.02, 0.06, 0.2); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); scene.add(a); return a; });
      function lbl(txt, col, h, x, y) { var s = textSprite(txt, col, h); s.position.set(x, y, 0); scene.add(s); return s; }
      var titles = [lbl('圓球：三種轉法都不費力', '#e4e2dd', 0.28, 0, 1.85), lbl('壓扁', '#e4e2dd', 0.28, 0, 1.85), lbl('繞對稱軸轉：形狀不變，不費力，粒子沒有質量', '#83c167', 0.24, 0, 1.85), lbl('繞其他軸轉：形狀改變，費力，粒子變重（W、Z）', '#fc6255', 0.24, 0, 1.85)];
      var q = new THREE.Quaternion();
      cam.position.set(0, 1.6, 6.4); cam.lookAt(0, 0.1, 0);
      return function (t) {
        var T = 20, u = t % T, squash = smooth((u - 6) / 1.5);
        body.scale.set(1, 1 - 0.45 * squash, 1); ghost.scale.copy(body.scale);
        ghost.material.opacity = u > 8 ? 0.35 : 0;
        var k = -1, ang = 0;
        if (u < 6) { k = Math.floor(u / 2); ang = 2 * Math.PI * smooth((u % 2) / 2); }
        else if (u >= 8 && u < 13) { k = 0; ang = 2 * Math.PI * smooth((u - 8) / 4.5); }
        else if (u >= 13 && u < 19) { k = 1; ang = 0.9 * Math.sin(Math.PI * smooth((u - 13) / 5.5)); }
        if (k >= 0) { q.setFromAxisAngle(axes[k], ang); body.quaternion.copy(q); } else body.quaternion.set(0, 0, 0, 1);
        axisArrows.forEach(function (a, i) { a.visible = i === k; a.material = a.material; });
        var w = u < 6 ? 0 : u < 8 ? 1 : u < 13 ? 2 : 3; titles.forEach(function (s, i) { s.visible = i === w; });
        var az = 0.55 + 0.15 * Math.sin(t * 0.12); cam.position.set(6.4 * Math.sin(az), 1.6, 6.4 * Math.cos(az)); cam.lookAt(0, 0.1, 0);
      };
    });
  }

  // 4. 十一維總覽：四維時空的每一點，都掛著看不見的圓、球面與 CP²
  function setupEleven(fig) {
    return stage(fig, 340, function (scene, cam) {
      var pts = [];
      for (var i = -6; i <= 6; i++) { pts.push(new THREE.Vector3(i, 0, -3), new THREE.Vector3(i, 0, 3)); }
      for (var j = -3; j <= 3; j++) { pts.push(new THREE.Vector3(-6, 0, j), new THREE.Vector3(6, 0, j)); }
      scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3b6e8f, transparent: true, opacity: 0.5 })));
      var sites = [], dotGeo = new THREE.SphereGeometry(0.035, 8, 6);
      for (var x = -4.5; x <= 4.5; x += 1.5) for (var z = -1.5; z <= 1.5; z += 1.5) {
        var g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
        var c = ringLine(0.18, GOLD, 0.8); c.position.set(-0.28, 0.35, 0); g.add(c);
        var cd = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: GOLD })); c.add(cd);
        var s = new THREE.Group(); s.position.set(0.05, 0.4, 0); g.add(s); s.add(wireSphere(0.17, GRAY, 0.35));
        var sa = arrow(0.17, BLUE_HI, 1, 0.012, 0.035, 0.08); s.add(sa);
        var tri = new THREE.Group(); tri.position.set(0.38, 0.34, 0); g.add(tri);
        var tds = [RED3, GREEN3, BLUE3].map(function (col, k) { var a = arrow(0.11, col, 1, 0.01, 0.03, 0.06); var an = Math.PI / 2 + 2 * Math.PI * k / 3; a.position.set(0.1 * Math.cos(an), 0.1 * Math.sin(an), 0); tri.add(a); return a; });
        sites.push({ x: x, z: z, cd: cd, s: s, tds: tds });
      }
      function lbl(txt, col, h, x, y, zz) { var sp = textSprite(txt, col, h); sp.position.set(x, y, zz || 0); scene.add(sp); return sp; }
      lbl('我們的 4 維 ＋ 圓 1 ＋ 球面 2 ＋ CP² 4 ＝ 11 維', '#e4e2dd', 0.34, 0, 2.3);
      lbl('金：圓（電磁）　白：球面（弱）　三色：CP²（強）', '#bdbdbd', 0.24, 0, 1.85);
      var q = new THREE.Quaternion(), axis = new THREE.Vector3();
      cam.position.set(0, 4.2, 9); cam.lookAt(0, 0.2, 0);
      return function (t) {
        sites.forEach(function (st) {
          var ph = 2 * Math.PI * (t / 3 - st.x / 6);                        // 電磁：沿 x 傳的波
          st.cd.position.set(0.18 * Math.cos(ph), 0.18 * Math.sin(ph), 0);
          axis.set(Math.sin(st.z + t * 0.4), 1, Math.cos(st.x * 0.5)).normalize();   // 弱：每一點的球面繞不同的軸轉
          q.setFromAxisAngle(axis, t * 1.3 + st.x * 0.3); st.s.quaternion.copy(q);
          st.tds.forEach(function (a, k) { a.rotation.z = t * (1.1 + 0.35 * k) + st.z; a.scale.setScalar(0.7 + 0.3 * Math.sin(t * 0.9 + k * 2.1 + st.x)); });  // 強：三色相位
        });
        var az = 0.35 * Math.sin(t * 0.08); cam.position.set(9 * Math.sin(az), 4.2, 9 * Math.cos(az)); cam.lookAt(0, 0.2, 0);
      };
    });
  }


  // ───────── 駐波圖鑑：14 種振動，共用一個 WebGL 引擎，各畫到自己的 2D 畫布 ─────────
  // 2.6：地球儀上的箭頭沿三角形走一圈，一路不轉，回到起點卻轉了；轉角＝面積÷半徑²
  function setupHolonomy(fig) {
    return stage(fig, 400, function (scene, cam) {
      var R = 1.5, up = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
      var LOOK = new THREE.Vector3(0.15, 0.2, 0.15), DIR = new THREE.Vector3(0.4265, 0.669, 0.6086), CAM = DIR.clone().multiplyScalar(6.6).add(LOOK);   // 仰角 42°、方位 35°
      var SCREEN_UP = up.clone().addScaledVector(DIR, -up.dot(DIR)).normalize();   // 畫面上「往上」對應的世界方向
      var N = new THREE.Vector3(0, R, 0), V0 = new THREE.Vector3(0, 0, 1), RT = R * 1.006;
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      var sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(3, 5, 6); scene.add(sun);
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshLambertMaterial({ color: 0x24465a })));
      // 經緯線：每 30°
      var gridMat = new THREE.LineBasicMaterial({ color: 0xbfeaf5, transparent: true, opacity: 0.18 }), RG = R * 1.002;
      for (var la = -60; la <= 60; la += 30) {
        var p = [], th = la * Math.PI / 180;
        for (var i = 0; i <= 96; i++) { var q = 2 * Math.PI * i / 96; p.push(new THREE.Vector3(RG * Math.cos(th) * Math.sin(q), RG * Math.sin(th), RG * Math.cos(th) * Math.cos(q))); }
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gridMat));
      }
      for (var lo = 0; lo < 180; lo += 30) {
        var p2 = [], l = lo * Math.PI / 180;
        for (var j = 0; j <= 96; j++) { var q2 = 2 * Math.PI * j / 96; p2.push(new THREE.Vector3(RG * Math.sin(q2) * Math.sin(l), RG * Math.cos(q2), RG * Math.sin(q2) * Math.cos(l))); }
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p2), gridMat));
      }
      // 三條大圓弧：北極 → 赤道經度 0 → 赤道經度 φ → 北極；沿大圓走，平行移動＝繞同一軸轉
      function legsFor(phi) {
        var a3 = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi));
        return [{ axis: X, ang: Math.PI / 2 }, { axis: up, ang: phi }, { axis: a3, ang: -Math.PI / 2 }];
      }
      function state(legs, s, out) {                  // s ∈ [0, 3]：走到第幾段
        var p = N.clone(), v = V0.clone(), qn = new THREE.Quaternion();
        for (var k = 0; k < 3; k++) {
          var f = Math.min(Math.max(s - k, 0), 1); if (f <= 0) break;
          qn.setFromAxisAngle(legs[k].axis, legs[k].ang * f); p.applyQuaternion(qn); v.applyQuaternion(qn);
        }
        out.p = p; out.v = v; return out;
      }
      var CYCLES = [Math.PI / 2, Math.PI / 4], SEG = 90, cyc = CYCLES.map(function (phi) {
        var legs = legsFor(phi), g = new THREE.Group(); g.visible = false; scene.add(g);
        var pts = [], st = {};
        for (var i = 0; i <= 3 * SEG; i++) { state(legs, i / SEG, st); pts.push(st.p.clone().multiplyScalar(RT / R)); }
        var trailMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 1 });
        var trail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 3 * SEG, 0.022, 8, false), trailMat); g.add(trail);
        // 三角形的面：極角 0–90°、經度 0–φ
        var n = 24, pos = [], idx = [], RP = R * 1.003;
        for (var a = 0; a <= n; a++) for (var b = 0; b <= n; b++) { var th2 = Math.PI / 2 * a / n, lb = phi * b / n; pos.push(RP * Math.sin(th2) * Math.sin(lb), RP * Math.cos(th2), RP * Math.sin(th2) * Math.cos(lb)); }
        for (var a2 = 0; a2 < n; a2++) for (var b2 = 0; b2 < n; b2++) { var i0 = a2 * (n + 1) + b2; idx.push(i0, i0 + n + 1, i0 + 1, i0 + 1, i0 + n + 1, i0 + n + 2); }
        var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setIndex(idx);
        var patchMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
        g.add(new THREE.Mesh(pg, patchMat));
        // 北極上的轉角弧
        var arcPts = [], AR = 0.5;
        for (var c = 0; c <= 40; c++) { var ac = phi * c / 40; arcPts.push(new THREE.Vector3(AR * Math.sin(ac), R + 0.03, AR * Math.cos(ac))); }
        var arcMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 1 });
        var arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 40, 0.014, 6, false), arcMat); g.add(arc);
        var deg = Math.round(phi * 180 / Math.PI);
        var turnLbl = textSprite('轉了 ' + deg + '°', '#e0a800', 0.3);
        turnLbl.position.copy(N).addScaledVector(SCREEN_UP, 0.5); g.add(turnLbl);
        var areaLbl = new THREE.Group(), al1 = textSprite('面積 ÷ 半徑²', '#bfeaf5', 0.19), al2 = textSprite('＝ ' + (deg === 90 ? 'π/2' : 'π/4') + ' ＝ ' + deg + '°', '#bfeaf5', 0.19);
        al1.position.copy(SCREEN_UP).multiplyScalar(0.13); al2.position.copy(SCREEN_UP).multiplyScalar(-0.13); areaLbl.add(al1); areaLbl.add(al2);
        var ta = 0.6 * Math.PI / 2, la2 = phi / 2; areaLbl.position.set(1.12 * R * Math.sin(ta) * Math.sin(la2), 1.12 * R * Math.cos(ta), 1.12 * R * Math.sin(ta) * Math.cos(la2)); g.add(areaLbl);
        return { legs: legs, g: g, trail: trail, trailMat: trailMat, patchMat: patchMat, arc: arc, arcMat: arcMat, turnLbl: turnLbl, areaLbl: areaLbl, phi: phi };
      });
      var mover = arrow(0.8, GOLD, 1, 0.03, 0.085, 0.26); scene.add(mover);
      var ghost = arrow(0.8, 0xe8e8e8, 0.7, 0.03, 0.085, 0.26); ghost.position.copy(N).multiplyScalar(1.02); ghost.quaternion.setFromUnitVectors(up, V0); scene.add(ghost);
      var T = 10, st2 = {};
      cam.position.copy(CAM); cam.lookAt(LOOK);
      return function (t) {
        var k = Math.floor(t / T) % CYCLES.length, u = t % T, C = cyc[k];
        cyc.forEach(function (c, i) { c.g.visible = i === k; });
        var fade = 1 - smooth((u - 9.2) / 0.8), show = smooth(u / 0.6) * fade;
        var s = 3 * Math.min(Math.max((u - 0.6) / 4.8, 0), 1);
        s = Math.floor(s) + smooth(s - Math.floor(s)); if (s > 3) s = 3;
        state(C.legs, s, st2);
        mover.position.copy(st2.p).multiplyScalar(1.02); mover.quaternion.setFromUnitVectors(up, st2.v.clone().normalize());
        mover.userData.mat.opacity = show; mover.userData.mat.depthWrite = show >= 1;
        ghost.userData.mat.opacity = 0.7 * (u > 0.6 ? 1 : 0) * fade;
        var lens = [Math.PI / 2, C.phi, Math.PI / 2], done = 0; for (var m = 0; m < 3; m++) done += lens[m] * Math.min(Math.max(s - m, 0), 1);
        C.trail.geometry.setDrawRange(0, Math.round(3 * SEG * done / (Math.PI + C.phi)) * 8 * 6); C.trailMat.opacity = fade;   // Tube 依弧長取樣
        var e = smooth((u - 5.6) / 1.0);
        C.patchMat.opacity = 0.32 * e * fade;
        C.arc.geometry.setDrawRange(0, Math.round(40 * e) * 6 * 6); C.arcMat.opacity = fade;
        C.turnLbl.material.opacity = e * fade; C.areaLbl.children.forEach(function (sp) { sp.material.opacity = smooth((u - 6.2) / 0.8) * fade; });
        var sw = 0.07 * Math.sin(2 * Math.PI * t / (T * CYCLES.length));
        cam.position.set(CAM.x * Math.cos(sw) + CAM.z * Math.sin(sw), CAM.y, -CAM.x * Math.sin(sw) + CAM.z * Math.cos(sw)); cam.lookAt(LOOK);
      };
    });
  }

  function setupModes(container) {
    var figs = [].slice.call(container.querySelectorAll('canvas[data-mode]'));
    if (!figs.length) return null;
    var glCanvas = document.createElement('canvas'), renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true }); } catch (e) { return null; }
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 320, H = 210;
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
    var up = new THREE.Vector3(0, 1, 0);

    function beads(n, color, r) {
      var mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: color }), n);
      var m = new THREE.Matrix4();
      return { mesh: mesh, set: function (i, x, y, z) { m.makeTranslation(x, y, z); mesh.setMatrixAt(i, m); }, done: function () { mesh.instanceMatrix.needsUpdate = true; } };
    }
    function dynLine(n, color, opacity) {
      var pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return { line: new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity || 1 })), pos: pos, geo: geo };
    }
    function staticLine(pts, color, opacity) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity })); }

    // 開弦：兩端自由，位移 cos(nπσ)
    function openString(n) {
      var s = new THREE.Scene(), N = 90, L = 3.2, A = 0.55, b = beads(N, GOLD, 0.05), env = [];
      s.add(b.mesh);
      [1, -1].forEach(function (sg) { var pts = []; for (var i = 0; i < N; i++) { var u = i / (N - 1); pts.push(new THREE.Vector3(-L / 2 + L * u, sg * A * Math.cos(n * Math.PI * u), 0)); } s.add(staticLine(pts, GRAY, 0.25)); });
      var ends = [0, 1].map(function () { var m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshBasicMaterial({ color: BLUE_HI })); s.add(m); return m; });
      var om = 2 * Math.PI / 1.6 * n;
      return { scene: s, cam: [0, 0.34, 3.78], look: [0, 0.01, 0], update: function (t) {
        for (var i = 0; i < N; i++) { var u = i / (N - 1), y = A * Math.cos(n * Math.PI * u) * Math.cos(om * t); b.set(i, -L / 2 + L * u, y, 0); if (i === 0) ends[0].position.set(-L / 2, y, 0); if (i === N - 1) ends[1].position.set(L / 2, y, 0); }
        b.done();
      } };
    }
    // 閉弦：半徑隨 cos(kθ) 振動；k = 2 是十字形（一邊拉長一邊壓扁）
    function closedString(k) {
      var s = new THREE.Scene(), N = 120, R = 1.05, E = 0.28, b = beads(N, GOLD, 0.045);
      s.add(b.mesh);
      var base = []; for (var i = 0; i <= 96; i++) { var q = 2 * Math.PI * i / 96; base.push(new THREE.Vector3(R * Math.cos(q), R * Math.sin(q), 0)); }
      s.add(staticLine(base, GRAY, 0.25));
      var om = 2 * Math.PI / 1.8 * (k / 2);
      return { scene: s, cam: [0, -2.03, 4.21], look: [0, -0.13, -0.06], update: function (t) {
        for (var i = 0; i < N; i++) { var q = 2 * Math.PI * i / N, r = R * (1 + E * Math.cos(k * q) * Math.cos(om * t)); b.set(i, r * Math.cos(q), r * Math.sin(q), 0); }
        b.done();
      } };
    }
    // 繞看不見的小圓：相位箭頭繞 n 圈（n = 0 不帶電）
    function momentum(n) {
      var s = new THREE.Scene(), RM = 1.05, A = 0.42, NA = 36;
      var torus = new THREE.Mesh(new THREE.TorusGeometry(RM, A, 16, 72), new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
      torus.rotation.x = Math.PI / 2; s.add(torus);
      var ring = []; for (var i = 0; i <= 96; i++) { var q = 2 * Math.PI * i / 96; ring.push(new THREE.Vector3(RM * Math.cos(q), 0, RM * Math.sin(q))); } s.add(staticLine(ring, GRAY, 0.5));
      var arrows = [], th = [];
      for (var j = 0; j < NA; j++) { var q2 = 2 * Math.PI * j / NA, a = arrow(A, n === 0 ? GRAY : n > 0 ? GOLD : BLUE3, 1, 0.012, 0.04, 0.12); a.position.set(RM * Math.cos(q2), 0, RM * Math.sin(q2)); s.add(a); arrows.push(a); th.push(q2); }
      var tip = dynLine(NA + 1, n === 0 ? GRAY : n > 0 ? GOLD : BLUE3, 0.6); s.add(tip.line);
      var om = 2 * Math.PI / 2.4 * Math.abs(n), dir = new THREE.Vector3(), rh = new THREE.Vector3();
      return { scene: s, cam: [0, 2.01, 3.24], look: [0, -0.22, 0.09], update: function (t) {
        for (var j = 0; j < NA; j++) {
          var ph = n * th[j] - om * t + Math.PI / 2; rh.set(Math.cos(th[j]), 0, Math.sin(th[j]));
          dir.copy(rh).multiplyScalar(Math.cos(ph)).addScaledVector(up, Math.sin(ph)); arrows[j].quaternion.setFromUnitVectors(up, dir);
          var p = arrows[j].position; tip.pos.set([p.x + A * dir.x, A * dir.y, p.z + A * dir.z], 3 * j);
        }
        tip.pos.set([tip.pos[0], tip.pos[1], tip.pos[2]], 3 * NA); tip.geo.attributes.position.needsUpdate = true;
      } };
    }
    // 纏繞：閉弦像橡皮筋一樣纏在看不見的小圓上 w 圈
    function winding(w) {
      var s = new THREE.Scene(), R = 0.8, LEN = 3.0, N = 160, b = beads(N, GOLD, 0.04);
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, LEN, 40, 1, true), new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
      cyl.rotation.z = Math.PI / 2; s.add(cyl);
      s.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(R, R, LEN, 20, 1, true)), new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.2 })).rotateZ(Math.PI / 2));
      s.add(b.mesh);
      var om = 2 * Math.PI / 2.0;
      return { scene: s, cam: [0.4, 1.38, 3.82], look: [-0.02, 0, 0], update: function (t) {
        for (var i = 0; i < N; i++) {
          var u = 2 * Math.PI * w * i / N, x = (w > 1 ? 0.28 * Math.sin(u / w) : 0) + 0.08 * Math.sin(3 * u / w) * Math.cos(om * t), rr = R * (1 + 0.05 * Math.cos(2 * u) * Math.cos(om * t));
          b.set(i, x, rr * Math.cos(u), rr * Math.sin(u));
        }
        b.done();
      } };
    }
    // 依振幅上色：金色向外鼓起，藍色向內凹下
    var cGold = new THREE.Color(GOLD), cBlue = new THREE.Color(BLUE3), cDim = new THREE.Color(0x24242c);
    function paint(col, i, a) { var c = a >= 0 ? cGold : cBlue, k = Math.min(1, Math.abs(a)); col.setXYZ(i, cDim.r + (c.r - cDim.r) * k, cDim.g + (c.g - cDim.g) * k, cDim.b + (c.b - cDim.b) * k); }
    // 表面（上色）與網格（淡灰）一起依 disp 變形；disp(x, y, z, ct, out) 回傳振幅並把新位置寫進 out
    function wavySurface(s, geo, wireSrc, disp) {
      var base = geo.attributes.position.array.slice(), n = base.length / 3;
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
      var wgeo = new THREE.WireframeGeometry(wireSrc), wbase = wgeo.attributes.position.array.slice();
      s.add(new THREE.LineSegments(wgeo, new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.28 })));
      var out = [0, 0, 0];
      return function (ct) {
        var p = geo.attributes.position, col = geo.attributes.color, w = wgeo.attributes.position.array, i;
        for (i = 0; i < n; i++) { var a = disp(base[3 * i], base[3 * i + 1], base[3 * i + 2], ct, out); p.setXYZ(i, out[0], out[1], out[2]); paint(col, i, a); }
        p.needsUpdate = true; col.needsUpdate = true;
        for (i = 0; i < w.length; i += 3) { disp(wbase[i], wbase[i + 1], wbase[i + 2], ct, out); w[i] = out[0]; w[i + 1] = out[1]; w[i + 2] = out[2]; }
        wgeo.attributes.position.needsUpdate = true;
      };
    }
    // 球面上的駐波：半徑隨 Legendre 多項式 P_ℓ(cos θ) 振動
    function sphereMode(l) {
      var s = new THREE.Scene(), R = 1.0, E = 0.22;
      function P(c) { return l === 1 ? c : 0.5 * (3 * c * c - 1); }
      var upd = wavySurface(s, new THREE.SphereGeometry(R, 64, 40), new THREE.SphereGeometry(R, 24, 16), function (x, y, z, ct, o) {
        var a = P(y / R) * ct, f = 1 + E * a; o[0] = x * f; o[1] = y * f; o[2] = z * f; return a;
      });
      var om = 2 * Math.PI / 2.0 * (l === 1 ? 1 : 1.6);
      return { scene: s, cam: [2.78, 1.55, 3.3], look: [0, 0.03, 0], update: function (t) { upd(Math.cos(om * t)); } };
    }
    // 甜甜圈上的駐波 (1, 1)：沿兩個方向各一個波長
    function torusMode() {
      var s = new THREE.Scene(), RM = 1.0, A = 0.4, E = 0.35;
      var upd = wavySurface(s, new THREE.TorusGeometry(RM, A, 48, 128), new THREE.TorusGeometry(RM, A, 12, 36), function (x, y, z, ct, o) {
        var u = Math.atan2(y, x), cu = Math.cos(u), su = Math.sin(u), nx = x - RM * cu, ny = y - RM * su, nl = Math.sqrt(nx * nx + ny * ny + z * z) || 1;
        var a = cu * Math.cos(Math.atan2(z, nx * cu + ny * su)) * ct, d = E * A * a;
        o[0] = x + d * nx / nl; o[1] = y + d * ny / nl; o[2] = z + d * z / nl; return a;
      });
      var om = 2 * Math.PI / 2.2;
      return { scene: s, cam: [0, -3.01, 3.01], look: [0, -0.14, -0.13], update: function (t) { upd(Math.cos(om * t)); } };
    }

    var makers = {
      open1: function () { return openString(1); }, open2: function () { return openString(2); }, open3: function () { return openString(3); },
      closed2: function () { return closedString(2); }, closed3: function () { return closedString(4); },
      p0: function () { return momentum(0); }, p1: function () { return momentum(1); }, pm1: function () { return momentum(-1); }, p2: function () { return momentum(2); },
      w1: function () { return winding(1); }, w2: function () { return winding(2); },
      s1: function () { return sphereMode(1); }, s2: function () { return sphereMode(2); }, t11: torusMode
    };
    var items = figs.map(function (cv) {
      var mk = makers[cv.getAttribute('data-mode')]; if (!mk) return null;
      var m = mk(), cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      cam.position.set(m.cam[0], m.cam[1], m.cam[2]); cam.lookAt(m.look[0], m.look[1], m.look[2]);
      cv.width = W * DPR; cv.height = H * DPR; cv.style.width = '100%'; cv.style.maxWidth = W + 'px'; cv.style.display = 'block'; cv.style.margin = '0 auto'; cv.style.borderRadius = '6px';
      var it = { cv: cv, ctx: cv.getContext('2d'), m: m, cam: cam, visible: true };
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { it.visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(cv);
      return it;
    }).filter(Boolean);
    var frames = 0, start = null;
    function once(t, force) {
      items.forEach(function (it) {
        if (!force && !it.visible) return;
        it.m.update(t); renderer.render(it.m.scene, it.cam);
        it.ctx.clearRect(0, 0, it.cv.width, it.cv.height);
        it.ctx.drawImage(renderer.domElement, 0, 0, it.cv.width, it.cv.height);
      });
      frames++;
    }
    function frame(now) { requestAnimationFrame(frame); if (document.hidden) return; if (start === null) start = now; once((now - start) / 1000, false); }
    requestAnimationFrame(frame);
    return { get frames() { return frames; }, renderer: renderer, renderOnce: function (t) { once(t, true); }, items: items };
  }

  function init() {
    var a = document.getElementById('helix3d-a'), b = document.getElementById('helix3d-b');
    window.__helix3d = {};
    var shm = document.getElementById('shm3d');
    if (shm) window.__helix3d.shm = setupShm(shm);
    var tor = document.getElementById('torus3d');
    if (tor) window.__helix3d.torus = setupTorus(tor);
    var dl = document.getElementById('loop3d');
    if (dl) window.__helix3d.loop = setupDoubleLoop(dl);
    var un = document.getElementById('unify3d');
    if (un) window.__helix3d.unify = setupUnify(un);
    [['shapes3d', setupShapes, 'shapes'], ['order3d', setupOrder, 'order'], ['squash3d', setupSquash, 'squash'], ['eleven3d', setupEleven, 'eleven'], ['holo3d', setupHolonomy, 'holo']].forEach(function (e) { var el = document.getElementById(e[0]); if (el) window.__helix3d[e[2]] = e[1](el); });
    var md = document.getElementById('modes3d');
    if (md) window.__helix3d.modes = setupModes(md);
    if (a) window.__helix3d.a = setup(a, { height: 320, pages: 9, spacing: 0.7, radius: 0.7, highlight: -1, numbers: true, tipArrows: false, endView: false, packet: { sigma: 0.8, speed: 1.6, outL: 4.2, outR: 6.4, dx: 0.156 } });
    if (b) window.__helix3d.b = setup(b, { height: 250, pages: 7, spacing: 0.7, radius: 0.55, arrows: 29, highlight: -1, numbers: false, tipArrows: false, endView: false, beth: true, turnSeconds: 2.4 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

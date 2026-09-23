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
      var cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 12), new THREE.MeshBasicMaterial({ color: GRAY }));
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
    var xTail = opts.wheel ? 0.3 : 0.9;
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

    // 相位箭頭
    var N = opts.arrows, dx = xEnd / (N - 1);
    var arrows = [], xs = [];
    var hi = opts.highlight;
    for (var j = 0; j < N; j++) {
      var a = arrow(r, j === hi ? BLUE_HI : BLUE, j === hi ? 1 : 0.85, 0.02, 0.08, 0.2);
      a.position.x = j * dx; xs.push(j * dx);
      scene.add(a); arrows.push(a);
    }
    // 箭尖連線（螺旋）
    var tipPos = new Float32Array(N * 3);
    var tipGeo = new THREE.BufferGeometry(); tipGeo.setAttribute('position', new THREE.BufferAttribute(tipPos, 3));
    scene.add(new THREE.Line(tipGeo, new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.35 })));

    // 尖端的速度／加速度（掛在高亮箭頭上）
    var vArrow = null, aArrow = null;
    if (opts.tipArrows) {
      vArrow = arrow(0.7, GOLD, 1, 0.022, 0.085, 0.2);
      aArrow = arrow(0.5, RED, 1, 0.022, 0.085, 0.2);
      scene.add(vArrow); scene.add(aArrow);
    }

    // 輪子
    var wheel = null;
    if (opts.wheel) {
      wheel = new THREE.Group();
      var wmat = new THREE.MeshBasicMaterial({ color: GRAY });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.6, 0.045, 10, 64), wmat);
      ring.rotation.y = Math.PI / 2; wheel.add(ring);
      for (var s = 0; s < 6; s++) {
        var spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, r * 3.2, 8), wmat);
        spoke.rotation.x = s * Math.PI / 6; wheel.add(spoke);
      }
      wheel.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), wmat));
      wheel.position.x = xEnd + 0.3;
      scene.add(wheel);
    }

    var camMain = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    var camEnd = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camEnd.position.set(-4.2, r * 0.9, r * 1.3); camEnd.lookAt(xEnd * 0.35, 0, 0);
    var cx = (opts.wheel ? xEnd + 0.3 : xEnd) / 2;
    var dist = (opts.wheel ? xEnd + 0.3 : xEnd) * 0.6 + 1.9;
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
      for (var j = 0; j < N; j++) {
        var phi = k * xs[j] - omega * time;
        arrows[j].rotation.x = phi;
        tipPos[3 * j] = xs[j]; tipPos[3 * j + 1] = r * Math.cos(phi); tipPos[3 * j + 2] = r * Math.sin(phi);
      }
      tipGeo.attributes.position.needsUpdate = true;
      if (vArrow) {
        var ph = k * xs[hi] - omega * time;
        tmp.set(xs[hi], r * Math.cos(ph), r * Math.sin(ph));
        dirV.set(0, Math.sin(ph), -Math.cos(ph));          // d/dt (cos φ, sin φ)，φ 隨時間減少
        dirA.set(0, -Math.cos(ph), -Math.sin(ph));         // 指向軸
        vArrow.position.copy(tmp); vArrow.quaternion.setFromUnitVectors(up, dirV);
        aArrow.position.copy(tmp); aArrow.quaternion.setFromUnitVectors(up, dirA);
      }
      if (wheel) wheel.rotation.x = k * (xEnd + 0.3) - omega * time;

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

  function init() {
    var a = document.getElementById('helix3d-a'), b = document.getElementById('helix3d-b');
    window.__helix3d = {};
    if (a) window.__helix3d.a = setup(a, { height: 320, pages: 9, spacing: 0.7, radius: 0.7, arrows: 37, highlight: 15, numbers: true, tipArrows: true, endView: true, turnSeconds: 2.4 });
    if (b) window.__helix3d.b = setup(b, { height: 250, pages: 7, spacing: 0.7, radius: 0.55, arrows: 29, highlight: -1, numbers: false, tipArrows: false, endView: false, wheel: true, turnSeconds: 2.4 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

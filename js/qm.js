/* 3.9 動畫：t0 送出的消息前緣往外長，Q 前進。
   綠色直角三角形 d、h、R（1.2 的光鐘）與粉紅 HP0 一起放大，各邊的比例不變。 */
(function () {
  var svg = document.getElementById('qm');
  if (!svg) return;
  function $(k) { return svg.querySelector('#qm' + k); }
  function f(n) { return n.toFixed(1); }

  var B = 0.5, G = 1 / Math.sqrt(1 - B * B), TH = 40 * Math.PI / 180, C = Math.cos(TH), S = Math.sin(TH);
  var X0 = 50.2, Y = 420, RMAX = 399.6;
  var K0 = 0.18, TG = 6.0, TH_ = 1.6, T = TG + TH_;            // 長大 → 停留
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }
  function fo(e, x, y) {
    var w = +e.getAttribute('width'), h = +e.getAttribute('height'), a = e.getAttribute('data-a');
    e.setAttribute('x', f(a === 'center' ? x - w / 2 : a === 'end' ? x - w : x)); e.setAttribute('y', f(y - h / 2));
  }
  var small = ['Ld', 'Lh', 'LH', 'LHP', 'LR', 'Lqr'];

  function render(k) {
    var R = k * RMAX, D = B * R, XT = X0 + D, top = Y - R / G;
    var P = [X0 + R * C, Y - R * S], HP = R - D * C, H = [P[0] - HP * C, P[1] + HP * S];
    $('Front').setAttribute('r', f(R));
    $('Tri').setAttribute('points', f(X0) + ',' + Y + ' ' + f(XT) + ',' + Y + ' ' + f(XT) + ',' + f(top));
    seg($('D'), X0, Y, XT, Y); seg($('Ht'), XT, Y, XT, top); seg($('Hyp'), X0, Y, XT, top);
    $('RA').setAttribute('d', 'M' + f(XT - 10) + ',' + Y + ' L' + f(XT - 10) + ',' + (Y - 10) + ' L' + f(XT) + ',' + (Y - 10));
    $('Top').setAttribute('cx', f(XT)); $('Top').setAttribute('cy', f(top));
    seg($('R'), X0, Y, P[0], P[1]); seg($('Qr'), XT, Y, P[0], P[1]);
    seg($('Perp'), XT, Y, H[0], H[1]); seg($('HP'), H[0], H[1], P[0], P[1]);
    var ux = C, uy = -S, nx = S, ny = C;
    $('HA').setAttribute('d', 'M' + f(H[0] + 10 * ux) + ',' + f(H[1] + 10 * uy) + ' L' + f(H[0] + 10 * ux + 10 * nx) + ',' + f(H[1] + 10 * uy + 10 * ny) + ' L' + f(H[0] + 10 * nx) + ',' + f(H[1] + 10 * ny));
    $('Hd').setAttribute('cx', f(H[0])); $('Hd').setAttribute('cy', f(H[1]));
    $('Q').setAttribute('transform', 'translate(' + f(XT) + ',0)');
    $('P0').setAttribute('cx', f(P[0])); $('P0').setAttribute('cy', f(P[1]));
    fo($('Ln'), XT + 8, Y + 24);
    fo($('Ld'), (X0 + XT) / 2, Y - 14);
    fo($('Lh'), XT + 10, (Y + top) / 2 + 30 * k);
    fo($('Lq'), P[0] + 10, P[1] - 10);
    fo($('LH'), H[0] - 8, H[1] - 4);
    fo($('LHP'), (H[0] + P[0]) / 2 - 14, (H[1] + P[1]) / 2 - 12);
    fo($('LR'), (X0 + H[0]) / 2 - 10, (Y + H[1]) / 2 - 6);
    fo($('Lqr'), XT + (P[0] - XT) * 0.5 + 10, Y + (P[1] - Y) * 0.5 + 8);
    small.forEach(function (id) { $(id).setAttribute('visibility', k > 0.45 ? 'visible' : 'hidden'); });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, t0 = null, kFix = null;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function at(t) { var s = t % T; return s < TG ? K0 + (1 - K0) * s / TG : 1; }
  function loop(now) {
    if (t0 === null) t0 = now;
    if (kFix !== null) render(kFix);
    else if (visible && !reduce) render(at((now - t0) / 1000));
    requestAnimationFrame(loop);
  }
  render(1);
  requestAnimationFrame(loop);
  window.qm = { at: function (k) { kFix = k; render(k); }, play: function () { kFix = null; } };
})();

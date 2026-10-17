/* 3.9 動畫：t0 送出的消息前緣往外長，Q 前進。
   綠色直角三角形 d、h、R（1.2 的光鐘）與粉紅 HP0 一起放大，各邊的比例不變。 */
(function () {
  var svg = document.getElementById('qm');
  if (!svg) return;
  function $(k) { return svg.querySelector('#qm' + k); }
  function f(n) { return n.toFixed(1); }

  var B = 0.5, G = 1 / Math.sqrt(1 - B * B), TH = 40 * Math.PI / 180, C = Math.cos(TH), S = Math.sin(TH);
  var X0 = 50.2, Y = 420, RMAX = 399.6, QQ = [X0 + RMAX * C, Y - RMAX * S];   // q 靜止在最後的 P0
  var K0 = 0.18, TG = 6.0, TH_ = 1.6, T = TG + TH_;            // 長大 → 停留
  function seg(e, x1, y1, x2, y2) { e.setAttribute('x1', f(x1)); e.setAttribute('y1', f(y1)); e.setAttribute('x2', f(x2)); e.setAttribute('y2', f(y2)); }
  function fo(e, x, y) {
    var w = +e.getAttribute('width'), h = +e.getAttribute('height'), a = e.getAttribute('data-a');
    e.setAttribute('x', f(a === 'center' ? x - w / 2 : a === 'end' ? x - w : x)); e.setAttribute('y', f(y - h / 2));
  }
  var small = ['Ld', 'Lh', 'LH', 'LHP', 'LR', 'LR2', 'Lqr'];

  function render(k) {
    var R = k * RMAX, D = B * R, XT = X0 + D, top = Y - R / G;
    var P = [X0 + R * C, Y - R * S], HP = R - D * C, H = [P[0] - HP * C, P[1] + HP * S];
    $('Front').setAttribute('r', f(R));
    $('Tri').setAttribute('points', f(X0) + ',' + Y + ' ' + f(XT) + ',' + Y + ' ' + f(XT) + ',' + f(top));
    seg($('D'), X0, Y, XT, Y); seg($('Ht'), XT, Y, XT, top); seg($('Hyp'), X0, Y, XT, top);
    $('RA').setAttribute('d', 'M' + f(XT - 10) + ',' + Y + ' L' + f(XT - 10) + ',' + (Y - 10) + ' L' + f(XT) + ',' + (Y - 10));
    $('Top').setAttribute('cx', f(XT)); $('Top').setAttribute('cy', f(top));
    seg($('R'), X0, Y, P[0], P[1]); seg($('Qr'), XT, Y, QQ[0], QQ[1]); seg($('QP'), XT, Y, P[0], P[1]);
    seg($('Perp'), XT, Y, H[0], H[1]); seg($('HP'), H[0] + 9 * S, H[1] + 9 * C, P[0] + 9 * S, P[1] + 9 * C);   // HP0 畫在 R 旁邊
    var ux = C, uy = -S, nx = S, ny = C;
    $('HA').setAttribute('d', 'M' + f(H[0] + 10 * ux) + ',' + f(H[1] + 10 * uy) + ' L' + f(H[0] + 10 * ux + 10 * nx) + ',' + f(H[1] + 10 * uy + 10 * ny) + ' L' + f(H[0] + 10 * nx) + ',' + f(H[1] + 10 * ny));
    $('Hd').setAttribute('cx', f(H[0])); $('Hd').setAttribute('cy', f(H[1]));
    $('Q').setAttribute('transform', 'translate(' + f(XT) + ',0)');
    $('P0').setAttribute('cx', f(P[0])); $('P0').setAttribute('cy', f(P[1]));
    fo($('Ln'), XT + 8, Y + 24);
    fo($('Ld'), (X0 + XT) / 2, Y - 14);
    fo($('Lh'), XT + 10, (Y + top) / 2 + 30 * k);
    fo($('Lq'), P[0] - 12, P[1] - 12);
    fo($('LH'), H[0] - 8, H[1] - 4);
    fo($('LHP'), (H[0] + P[0]) / 2 + 9 * S + 12, (H[1] + P[1]) / 2 + 9 * C + 10);
    fo($('LR'), (X0 + P[0]) / 2 - 14 * S, (Y + P[1]) / 2 - 14 * C); fo($('LR2'), (X0 + XT) / 2 - 16, (Y + top) / 2 - 4);
    fo($('Lqr'), XT + (QQ[0] - XT) * 0.5 + 10, Y + (QQ[1] - Y) * 0.5 + 8);
    small.forEach(function (id) { $(id).setAttribute('visibility', k > 0.45 ? 'visible' : 'hidden'); });
  }

  var fig = svg.closest('figure'), bp = fig.querySelector('.qm-play'), sl = fig.querySelector('.qm-t');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, play = !reduce, tm = reduce ? TG : 0, last = null;   // tm：動畫時間（秒）
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  function kOf(t) { var s = t % T; return s < TG ? K0 + (1 - K0) * s / TG : 1; }
  function show(t) { var k = kOf(t); render(k); if (sl) sl.value = Math.round((k - K0) / (1 - K0) * 1000); }
  function setPlay(p) {
    play = p; if (!bp) return;
    bp.setAttribute('aria-label', p ? '暫停' : '播放');
    bp.querySelector('.ic-pause').style.display = p ? '' : 'none'; bp.querySelector('.ic-play').style.display = p ? 'none' : '';
  }
  if (bp) bp.addEventListener('click', function () { if (!play && kOf(tm) >= 1) tm = 0; setPlay(!play); });
  if (sl) sl.addEventListener('input', function () { setPlay(false); tm = (+sl.value / 1000) * TG; show(tm); });
  function loop(now) {
    if (last === null) last = now;
    var dt = (now - last) / 1000; last = now;
    if (play && visible) { tm = (tm + dt) % T; show(tm); }
    requestAnimationFrame(loop);
  }
  setPlay(play); show(tm);
  requestAnimationFrame(loop);
  window.qm = { at: function (k) { setPlay(false); tm = (k - K0) / (1 - K0) * TG; render(k); if (sl) sl.value = Math.round((k - K0) / (1 - K0) * 1000); }, play: function () { setPlay(true); } };
})();

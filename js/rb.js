/* 3.9 互動圖：Q 在等間隔的時刻送出許多圈消息；每一則消息在 Q 基準中都朝同一方向 ^Qθ 送出。
   地面上的方向隨 Q 當時的速度改變（1.5）：cos ^qθ = (cos ^Qθ + β)/(1 + β cos ^Qθ)，sin ^qθ = sin ^Qθ·√(1 − β²)/(1 + β cos ^Qθ)。
   從每個 Q(t) 沿地面方向畫到各自的前緣得到 P 點；P 點連成的曲線就是此刻的電場線（3.9）。
   一直畫到此刻送出的消息（前緣半徑 0）：曲線的終點就是 Q 此刻的位置。
   可疊上 Q 的位置隨時間的圖（時間往上是越早），以及 Q 此刻的其他電場線（在 Q 基準中每隔 15° 一條，預設隱藏）。 */
(function () {
  var svg = document.getElementById('rb');
  if (!svg) return;
  var fig = svg.closest('figure');
  var NS = 'http://www.w3.org/2000/svg';
  function $(k) { return fig.querySelector('.rb-' + k); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
  function f(n) { return n.toFixed(1); }

  var Y = 380, X0 = 170, T = 290, NS2 = 400;     // c = 1 px／單位時間；最早在 t = 0 送出，此刻是 t = T（此刻送出的前緣半徑為 0）
  var A = 0.6 / T, W = 2 * Math.PI / 120;
  var MOVES = {                                   // 每種運動：時刻 t 的位置與速度（以 c 為單位）
    acc: function (t) { return [X0 + 0.1 * t + A * t * t / 2, 0.1 + A * t]; },
    dec: function (t) { return [X0 + 0.7 * t - A * t * t / 2, 0.7 - A * t]; },
    shm: function (t) { return [X0 + 40 + 0.7 / W * Math.sin(W * t), 0.7 * Math.cos(W * t)]; }
  };
  var g = { fr: $('fronts'), ry: $('rays'), wl: $('wl'), ot: $('others'), cv: $('curve'), pt: $('pts') };
  var NL = 12;                                    // 其他電場線：Q 基準中 ^Qθ = 7.5°, 22.5°, …, 172.5°

  function at(t, mv, C, S) {                      // 時刻 t 送出、在 Q 基準中朝 ^Qθ 的消息，此刻所在的點
    var q = MOVES[mv](t), b = q[1], dn = 1 + b * C, R = T - t;
    return [q[0], q[0] + R * (C + b) / dn, Y - R * S * Math.sqrt(1 - b * b) / dn, R];
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function place(e, x, y) { var w = +e.getAttribute('width'), h = +e.getAttribute('height'); e.setAttribute('x', f(x)); e.setAttribute('y', f(y - h / 2)); }

  function render() {
    var N = +$('n').value, th = +$('th').value * Math.PI / 180, mv = $('mv').value, C = Math.cos(th), S = Math.sin(th);
    $('no').textContent = N; $('tho').textContent = Math.round(th * 180 / Math.PI) + '°';
    for (var k in g) clear(g[k]);
    var P = [], small = N > 20, i;
    for (i = 0; i < N; i++) P.push(at(T * i / (N - 1), mv, C, S));
    for (i = 0; i < N - 1; i++) {
      var p = P[i], R = p[3];
      el('path', { d: 'M' + f(p[0] - R) + ',' + Y + ' A' + f(R) + ',' + f(R) + ' 0 0,1 ' + f(p[0] + R) + ',' + Y, fill: 'none', stroke: '#F0AC5F', 'stroke-opacity': small ? .22 : .4, 'stroke-dasharray': '4 4', 'stroke-width': 1 }, g.fr);
      el('line', { x1: f(p[0]), y1: Y, x2: f(p[1]), y2: f(p[2]), stroke: '#58C4DD', 'stroke-opacity': .35, 'stroke-width': 1 }, g.ry);
    }
    if ($('cw').checked) {
      var d = '';
      for (var k1 = 0; k1 <= NS2; k1++) { var t1 = T * k1 / NS2; d += (k1 ? 'L' : 'M') + f(MOVES[mv](t1)[0]) + ',' + f(Y - (T - t1)); }
      el('path', { d: d, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .6, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g.wl);
      for (i = 0; i < N - 1; i++) el('circle', { cx: f(P[i][0]), cy: f(Y - P[i][3]), r: small ? 2.5 : 3.5, fill: '#FC6255' }, g.wl);   // 每次送出時 Q 的位置，高度＝送出的時刻（越早越高）
    }
    function line(c, s) { var d = ''; for (var k = 0; k <= NS2; k++) { var q = at(T * k / NS2, mv, c, s); d += (k ? 'L' : 'M') + f(q[1]) + ',' + f(q[2]); } return d; }
    if ($('co').checked) for (var j = 0; j < NL; j++) { var a = (j + 0.5) * Math.PI / NL; el('path', { d: line(Math.cos(a), Math.sin(a)), fill: 'none', stroke: '#FFEA94', 'stroke-opacity': .5, 'stroke-width': 1.2 }, g.ot); }
    el('path', { d: line(C, S), fill: 'none', stroke: '#5CD0B3', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g.cv);
    for (i = 0; i < N - 1; i++) {
      el('circle', { cx: f(P[i][1]), cy: f(P[i][2]), r: small ? 2.8 : 4, fill: '#58C4DD' }, g.pt);
      el('circle', { cx: f(P[i][0]), cy: Y, r: small ? 2.5 : 3.5, fill: '#FC6255' }, g.pt);
    }
    var xn = P[N - 1][0];                          // 此刻送出的消息還在 Q 身上：最後一個 P 點就是 Q 此刻
    el('circle', { cx: f(xn), cy: Y, r: 7, fill: '#FC6255' }, g.pt);
    place($('l0'), P[0][1] + 10, P[0][2] - 8);
    var lq = $('lq'), ln = $('ln'), wq = +lq.getAttribute('width'), wn = +ln.getAttribute('width');
    place(lq, P[0][0] - wq / 2, Y + 22);
    place(ln, xn - wn / 2, Math.abs(xn - P[0][0]) < (wq + wn) / 2 + 6 ? Y + 46 : Y + 22);   // 與 Q(t0) 太近時往下排
  }

  ['n', 'th'].forEach(function (k) { $(k).addEventListener('input', render); });
  ['mv', 'cw', 'co'].forEach(function (k) { $(k).addEventListener('change', render); });
  render();
})();

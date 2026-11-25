/* 英文版、日文版：圖中文字比中文長。文字超出圖框、或同一列的文字互相重疊時，等比例縮小那段文字；中文版不動。
   SVG 的 <text> 改字級（錨點不動）；foreignObject 裡的標籤用 zoom（高度補回，垂直置中不變）。 */
(function () {
  if (!window.I18N || I18N.lang === 'zh') return;
  var SPILL = 24;   // foreignObject 的內容可以比框寬這麼多（中文版也有）
  var MIN = 0.5;

  function anchorFrac(t) {
    var a = getComputedStyle(t).textAnchor;
    return a === 'middle' ? 0.5 : a === 'end' ? 1 : 0;
  }
  function visible(r) { return r.width > 0 && r.height > 0; }

  function fitText(svg, sr) {
    var texts = [].filter.call(svg.querySelectorAll('text'), function (t) { return t.textContent.trim(); });
    texts.forEach(function (t) {
      if (t.dataset.fs0 === undefined) t.dataset.fs0 = parseFloat(getComputedStyle(t).fontSize);
      t.style.fontSize = '';
    });
    // 超出圖框（只看有字的標籤；單一符號如 +、− 會隨動畫移出圖框，不能縮）
    texts.filter(function (t) { return t.textContent.trim().length > 3; }).forEach(function (t) {
      var fs0 = +t.dataset.fs0, z = 1, a = anchorFrac(t);
      for (var i = 0; i < 4; i++) {
        var r = t.getBoundingClientRect(); if (!visible(r)) return;
        var vert = r.height > r.width * 1.5 && t.textContent.trim().length > 3;
        var w = vert ? r.height : r.width;
        var lo = vert ? sr.top - r.top : sr.left - r.left, hi = vert ? r.bottom - sr.bottom : r.right - sr.right;
        var o = Math.max(lo, hi) + 2; if (o <= 2) break;
        var part = a === 0.5 ? w / 2 : (vert ? w : (hi > lo ? w * (1 - a) : w * a));
        if (part <= o) break;
        z = Math.max(MIN, z * (1 - o / part));
        t.style.fontSize = (fs0 * z).toFixed(2) + 'px';
      }
    });
    // 同一列互相重疊（只看有字的標籤，不看單一符號）
    var items = texts.filter(function (t) { return t.textContent.trim().length > 3; }).map(function (t) {
      return { t: t, r: t.getBoundingClientRect(), a: anchorFrac(t) };
    }).filter(function (x) { return visible(x.r) && x.r.width >= x.r.height; });
    items.forEach(function (p) {
      items.forEach(function (q) {
        if (p === q || p.r.left + p.r.width / 2 > q.r.left + q.r.width / 2) return;
        var ox = p.r.right - q.r.left + 4, oy = Math.min(p.r.bottom, q.r.bottom) - Math.max(p.r.top, q.r.top);
        if (ox <= 4 || oy < Math.min(p.r.height, q.r.height) * 0.5) return;
        if (q.r.right <= p.r.right) return;   // 一個包住另一個：不是並排的標籤
        var room = p.r.width * (1 - p.a) + q.r.width * q.a; if (room <= ox) return;
        var z = Math.max(MIN, 1 - ox / room);
        [p, q].forEach(function (x) {
          var cur = parseFloat(x.t.style.fontSize) || +x.t.dataset.fs0;
          x.t.style.fontSize = Math.min(cur, +x.t.dataset.fs0 * z).toFixed(2) + 'px';
        });
      });
    });
  }

  function fitFO(svg, sr) {
    [].forEach.call(svg.querySelectorAll('foreignObject'), function (fo) {
      var d = fo.firstElementChild; if (!d) return;
      if (d.dataset.h0 === undefined) d.dataset.h0 = d.style.height || '';
      d.style.zoom = ''; d.style.height = d.dataset.h0;
      var fr = fo.getBoundingClientRect(); if (!visible(fr)) return;
      var rg = document.createRange(); rg.selectNodeContents(d);
      var h = parseFloat(getComputedStyle(d).height), z = 1;
      var scale = fr.width / fo.width.baseVal.value;          // 螢幕 px ÷ SVG 單位
      for (var i = 0; i < 4; i++) {
        var cr = rg.getBoundingClientRect(); if (!visible(cr)) return;
        // 內容可以比框寬 SPILL，但不能超出圖框
        var over = Math.max(cr.width - (fr.width + SPILL * scale), sr.left + 3 * scale - cr.left, cr.right - (sr.right - 3 * scale));
        if (over <= 0.5) break;
        z = Math.max(MIN, z * (1 - over / cr.width) * 0.995);
        d.style.zoom = z.toFixed(4);
        if (h) d.style.height = (h / z).toFixed(2) + 'px';
        if (z === MIN) break;
      }
    });
  }

  function fitAll() {
    document.querySelectorAll('figure svg').forEach(function (svg) {
      var sr = svg.getBoundingClientRect(); if (!visible(sr)) return;
      fitFO(svg, sr); fitText(svg, sr);
    });
  }

  function start() {
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(fitAll, 300); });
  }
  (function wait() {
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function () { setTimeout(start, 200); });
    else setTimeout(wait, 100);
  })();
})();

/* 不出現橫向捲軸：行間公式、表格比欄寬還寬時，整個等比例縮小到剛好放得下。
   用 zoom 而不是改 font-size，因為瀏覽器的最小字級會讓小字縮不下去，比例就不準。
   視窗或側欄寬度一改變就重算。 */
(function () {
  function fit(box, inner) {
    if (!inner) return;
    inner.style.zoom = '';
    // 帶編號的公式，mjx-math 本身寬 100%，真正的寬度要看 scrollWidth；縮一次後再量，還超出就再縮
    for (var i = 0; i < 4; i++) {
      var avail = box.clientWidth, need = Math.max(inner.getBoundingClientRect().width, box.scrollWidth);
      if (need <= avail + 0.5) break;
      inner.style.zoom = ((+inner.style.zoom || 1) * avail / need * 0.995).toFixed(4);
    }
  }
  function fitAll() {
    document.querySelectorAll('mjx-container[display="true"]').forEach(function (c) { fit(c, c.firstElementChild); });
    document.querySelectorAll('.table-scroll').forEach(function (t) { fit(t, t.querySelector('table')); });
  }

  var pending = 0;
  function schedule() { cancelAnimationFrame(pending); pending = requestAnimationFrame(fitAll); }

  function start() {
    fitAll();
    var main = document.querySelector('main');
    if (main && 'ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(function (es) { var w = es[0].contentRect.width; if (w !== lastW) { lastW = w; schedule(); } }).observe(main);
    } else window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  }

  (function wait() {
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(start);
    else setTimeout(wait, 100);
  })();
})();

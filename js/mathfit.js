/* 行間公式一律不出現橫向捲軸：比欄寬還寬的，整條等比例縮小到剛好放得下。
   用 zoom 而不是改 font-size，因為瀏覽器的最小字級會讓小字縮不下去，比例就不準。
   視窗或側欄寬度一改變就重算。 */
(function () {
  function fit(c) {
    var m = c.firstElementChild;
    if (!m) return;
    m.style.zoom = '';
    // 帶編號的公式，mjx-math 本身寬 100%，真正的寬度要看 scrollWidth；縮一次後再量，還超出就再縮
    for (var i = 0; i < 4; i++) {
      var avail = c.clientWidth, need = Math.max(m.getBoundingClientRect().width, c.scrollWidth);
      if (need <= avail + 0.5) break;
      m.style.zoom = ((+m.style.zoom || 1) * avail / need * 0.995).toFixed(4);
    }
  }
  function fitAll() { document.querySelectorAll('mjx-container[display="true"]').forEach(fit); }

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

/* 3.9 靜態圖（電場線的彎折，qv；同一張圖、彎折那段畫成虛線，qw）：
   qv 上的兩個勾選框（預設不勾）同時控制兩張圖：「Q 停下時送出的消息前緣」與強調那條以外的電場線。 */
(function () {
  var svg = document.getElementById('qv');
  if (!svg) return;
  var fig = svg.closest('figure'), svgs = [svg, document.getElementById('qw')].filter(Boolean);
  function toggle(box, cls) {
    fig.querySelector('.qv-' + box).addEventListener('change', function (e) {
      svgs.forEach(function (sv) {
        sv.querySelectorAll('.' + sv.id + '-' + cls).forEach(function (el) { if (e.target.checked) el.removeAttribute('visibility'); else el.setAttribute('visibility', 'hidden'); });
      });
    });
  }
  toggle('cs', 'front');
  toggle('co', 'other');
})();

/* 3.9 靜態圖（電場線的彎折）：兩個勾選框，隱藏「Q 停下時送出的消息前緣」與強調那條以外的電場線。 */
(function () {
  var svg = document.getElementById('qv');
  if (!svg) return;
  var fig = svg.closest('figure');
  function toggle(box, cls) {
    fig.querySelector('.qv-' + box).addEventListener('change', function (e) {
      svg.querySelectorAll('.' + cls).forEach(function (el) { if (e.target.checked) el.removeAttribute('visibility'); else el.setAttribute('visibility', 'hidden'); });
    });
  }
  toggle('cs', 'qv-front');
  toggle('co', 'qv-other');
})();

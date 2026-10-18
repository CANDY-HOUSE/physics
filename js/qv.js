/* 3.9 靜態圖：電場線的彎折（qw：瞬間停下，彎折那段畫成虛線；qx：等加速度減速到停下；qy：以同樣大小的加速度來回幾次後停下）。
   qw 上的兩個勾選框（預設不勾）同時控制這三張圖：隱藏消息前緣、隱藏強調那條以外的電場線。 */
(function () {
  var svg = document.getElementById('qw');
  if (!svg) return;
  var fig = svg.closest('figure'), svgs = [svg, document.getElementById('qx'), document.getElementById('qy')].filter(Boolean);
  function toggle(box, cls) {
    fig.querySelector('.qw-' + box).addEventListener('change', function (e) {
      svgs.forEach(function (sv) {
        sv.querySelectorAll('.' + sv.id + '-' + cls).forEach(function (el) { if (e.target.checked) el.removeAttribute('visibility'); else el.setAttribute('visibility', 'hidden'); });
      });
    });
  }
  toggle('cs', 'front');
  toggle('co', 'other');
})();

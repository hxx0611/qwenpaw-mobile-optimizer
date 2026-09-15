// iOS Safari keyboard adaptation for the native QwenPaw/AntD model-ID Select.
// This is intentionally scoped to /models and only runs while the keyboard is open.
var MARK = 'data-mo2-model-popup';
var timer = 0;
var listeners = [];
var saved = new WeakMap();

function mobile() {
  try { return window.matchMedia('(max-width: 768px)').matches; } catch (e) { return false; }
}
function keyboardOpen() {
  var vv = window.visualViewport;
  return !!(vv && window.innerHeight - vv.height > 80);
}
function candidates() {
  return Array.prototype.filter.call(document.querySelectorAll('.ant-select-dropdown'), function (el) {
    if (el.getAttribute(MARK) === '1') return true;
    var text = (el.textContent || '').toLowerCase();
    return !!el.querySelector('.ant-select-item-option') && (text.indexOf('api') >= 0 || text.indexOf('claude') >= 0 || text.indexOf('gpt') >= 0 || text.indexOf('gemini') >= 0 || text.indexOf('qwen') >= 0);
  });
}
function adjust() {
  if (!mobile() || !keyboardOpen()) return restore();
  var vv = window.visualViewport;
  var bottomLimit = Math.max(80, vv.height - 12);
  candidates().forEach(function (el) {
    if (!saved.has(el)) saved.set(el, { position: el.style.position, top: el.style.top, left: el.style.left, width: el.style.width, maxHeight: el.style.maxHeight, overflowY: el.style.overflowY, transform: el.style.transform, zIndex: el.style.zIndex });
    el.setAttribute(MARK, '1');
    var r = el.getBoundingClientRect();
    var maxH = Math.max(120, bottomLimit - r.top);
    if (r.bottom > bottomLimit || r.height > maxH) {
      el.style.maxHeight = Math.floor(maxH) + 'px';
      el.style.overflowY = 'auto';
      // Keep AntD's horizontal placement; move only the popup vertically above the keyboard.
      var shift = Math.min(0, bottomLimit - r.bottom);
      el.style.transform = 'translateY(' + Math.floor(shift) + 'px)';
    }
  });
}
function restore() {
  document.querySelectorAll('.ant-select-dropdown[' + MARK + '="1"]').forEach(function (el) {
    var s = saved.get(el);
    if (s) Object.keys(s).forEach(function (k) { el.style[k] = s[k]; });
    el.removeAttribute(MARK);
    saved.delete(el);
  });
}
export function startModelPopupGuard() {
  if (timer) return function () {};
  var run = function () { window.requestAnimationFrame(adjust); };
  var vv = window.visualViewport;
  ['resize', 'scroll'].forEach(function (ev) { if (vv) { vv.addEventListener(ev, run); listeners.push([vv, ev, run]); } });
  document.addEventListener('focusin', run, true);
  document.addEventListener('click', run, true);
  listeners.push([document, 'focusin', run, true], [document, 'click', run, true]);
  timer = window.setInterval(adjust, 300);
  adjust();
  return function () {
    if (timer) window.clearInterval(timer); timer = 0;
    listeners.forEach(function (x) { x[0].removeEventListener(x[1], x[2], x[3]); });
    listeners = []; restore();
  };
}

// 左右滑手势（C1-a）：左缘右滑 → 开会话栏；在会话栏上左滑 → 关。
// 参数与踩坑都来自 v1「G3」实测，不是拍脑袋：
//   · 起手必须在左缘 24vw 内 —— 否则和 iOS Safari 的「侧滑返回」抢手势；
//   · 阈值 90px，且横向位移要明显大于纵向（|dx| > |dy| * 1.2），否则会吞掉纵向滚动；
//   · 起手点若在「可横向滚动的容器」内直接放弃 —— 让代码块/表格自己横滚；
//   · 手势触发后 400ms 内 capture 阶段吞掉 click —— 否则松手那一下会误点条目；
//   · 监听一律 passive，不 preventDefault 官方节点，不用 Observer，不碰官方 DOM。

var EDGE_RATIO = 0.24;
var THRESHOLD = 90;
var GHOST_MS = 400;

export function startGestures(io) {
  var track = null;
  var ghostUntil = 0;
  var listeners = [];

  function scrollableX(el) {
    try {
      for (var n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (/auto|scroll/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 4) return true;
      }
    } catch (e) {}
    return false;
  }

  function fire(mode) {
    track = null;
    ghostUntil = Date.now() + GHOST_MS;
    try {
      if (mode === 'open') io.open();
      else io.close();
    } catch (e) {}
  }

  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) {
      track = null;
      return;
    }
    var open = false;
    try {
      open = !!io.isOpen();
    } catch (e2) {}
    if (open) {
      track = { x: e.clientX || 0, y: e.clientY || 0, mode: 'close' };
      return;
    }
    var x = e.clientX || 0;
    if (x > window.innerWidth * EDGE_RATIO || scrollableX(e.target)) {
      track = null;
      return;
    }
    track = { x: x, y: e.clientY || 0, mode: 'open' };
  }

  function onMove(e) {
    if (!track) return;
    var dx = (e.clientX || 0) - track.x;
    var dy = Math.abs((e.clientY || 0) - track.y);
    if (Math.abs(dx) < dy * 1.2) return; // 纵向手势让路
    if (track.mode === 'open' && dx >= THRESHOLD) fire('open');
    else if (track.mode === 'close' && dx <= -THRESHOLD) fire('close');
  }

  function onUp() {
    track = null;
  }

  // 手势尾巴的误触：只在手势刚结束时吞，平时完全不干预
  function onClickCapture(e) {
    if (Date.now() < ghostUntil) {
      try {
        e.stopPropagation();
        e.preventDefault();
      } catch (e2) {}
    }
  }

  function add(t, ev, fn, opt) {
    t.addEventListener(ev, fn, opt);
    listeners.push([t, ev, fn, opt]);
  }

  add(document, 'pointerdown', onDown, { passive: true });
  add(document, 'pointermove', onMove, { passive: true });
  add(document, 'pointerup', onUp, { passive: true });
  add(document, 'pointercancel', onUp, { passive: true });
  add(document, 'touchcancel', onUp, { passive: true });
  add(document, 'click', onClickCapture, true);

  return function stop() {
    listeners.forEach(function (x) {
      try {
        x[0].removeEventListener(x[1], x[2], x[3]);
      } catch (e) {}
    });
    listeners = [];
    track = null;
  };
}
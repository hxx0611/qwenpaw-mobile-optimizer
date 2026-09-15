// 视口/键盘/safe-area 测量：唯一必须常驻的几何 JS。
// 为什么留着：Safari（含 iOS 26）不支持 interactive-widget=resizes-content，
// 键盘弹起只体现在 visualViewport 上，布局视口不动 —— 只能自己测。
// v0.1.x 的教训：测出来的值绝不打到官方节点的内联 style 上（会与 React 拉锯），
// 只写成 :root 上的 CSS 自定义属性，由样式表去消费。

import { LOG } from '../gate.js';

var _raf = 0;
var _baseInner = 0;

export var state = {
  vh: 0,
  inner: 0,
  kbd: 0, // 键盘占用的像素高度（0 = 未弹起）
  kbdMax: 0, // 会话内观测到的最大键盘高度 → 自检项⑬用
  offsetTop: 0,
};

function doc() {
  return document.documentElement;
}

function measure() {
  _raf = 0;
  var vv = window.visualViewport;
  var inner = window.innerHeight || 0;
  state.inner = inner;
  if (!_baseInner) _baseInner = inner;

  if (vv) {
    state.vh = Math.round(vv.height);
    state.offsetTop = Math.round(vv.offsetTop || 0);
    // 键盘高度 = 布局视口高 - visualViewport 高（再扣掉偏移）
    var k = Math.max(0, Math.round(inner - vv.height - (vv.offsetTop || 0)));
    state.kbd = k;
    if (k > state.kbdMax) state.kbdMax = k;
  } else {
    state.vh = inner;
    state.kbd = 0;
  }

  var d = doc();
  if (!d || !d.style) return;
  // 只写 --mo2-kbd。刻意【不】用 visualViewport 高度覆盖 --mo2-vh：
  // 100dvh 本身已排除 Safari 工具栏，而键盘弹起时 vv.height 会变小，
  // 拿它当视口高会让 fixed 面板塌陷（G1 验证时想清楚的语义差别）。
  d.style.setProperty('--mo2-kbd', state.kbd + 'px');
}

function schedule() {
  if (_raf) return;
  _raf = window.requestAnimationFrame(measure);
}

export function start() {
  try {
    measure();
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('resize', schedule);
  } catch (e) {
    console.warn(LOG + ' 视口监听启动失败：' + (e && e.message));
  }
  return measure;
}

export function snapshot() {
  return {
    vh: state.vh,
    inner: state.inner,
    kbd: state.kbd,
    kbdMax: state.kbdMax,
    visualViewport: !!window.visualViewport,
  };
}

// 让位时收尾：v2 检测到 v1 迟到激活后必须能把自己拆干净。
export function stop() {
  try {
    if (_raf) {
      window.cancelAnimationFrame(_raf);
      _raf = 0;
    }
    var vv = window.visualViewport;
    if (vv) {
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
    }
    window.removeEventListener('orientationchange', schedule);
    window.removeEventListener('resize', schedule);
    var d = doc();
    if (d && d.style) {
      d.style.removeProperty('--mo2-vh');
      d.style.removeProperty('--mo2-kbd');
    }
    _baseInner = 0;
  } catch (e) {}
}

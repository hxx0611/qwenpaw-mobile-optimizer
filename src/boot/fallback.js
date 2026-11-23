// A 方案：官方 slot / route 渲染管线失效时的自绘兜底（2026-11-23 上游 2.3.0.post1 回归）。
//
// 判定与让路：
//   · 注册完成后等 2s；页面上若找不到「在兜底根之外」的自家 chrome 节点 → 官方没渲染，挂兜底；
//   · 挂上后每 2s 复查一次（共 30 次 ≈1 分钟）：官方节点一出现（升级修好 / 上游热修），
//     立刻卸载兜底并标记 yielded，回到正常通道；
//   · 登录页 cleanup 时整体停掉，回来（reactivate）时重新起一轮判定。
//
// 三条防竞态纪律（第一版实测踩过）：
//   ① 每次 startFallback 递增 epoch，旧定时器一律作废 —— 否则 cleanup/reactivate 交错时
//      两个定时器会互相覆盖状态（出现过「兜底已渲染、状态却写 idle」）；
//   ② 自己的根节点每次从 DOM 现取，不缓存引用 —— 引用过期会把自家按钮误判成"官方已恢复"；
//   ③ mount 幂等 —— 已有 React root 就直接返回，绝不对同一容器 createRoot 两次。
//
// 边界：兜底只解决「渲染不出来」，不解决官方 header 自身抛错；官方顶栏的按钮仍然不会回来。

import { ensureFallbackMount, FALLBACK_ID } from './inject.js';
import { FallbackShell } from '../ui/FallbackShell.jsx';

var PROBE = '[aria-label="mo2-功能面板"]';
var DELAY = 2000;
var WATCH_EVERY = 2000;
var WATCH_MAX = 30;

var S = {
  status: 'idle', // idle | pending | on | yielded | off
  reactRoot: null,
  timer: null,
  watcher: null,
  ticks: 0,
  epoch: 0,
  reason: '',
  since: 0,
  log: [],
};

function note(st, why) {
  S.status = st;
  S.reason = why || '';
  S.log.push({ t: Math.round(performance.now()), st: st, why: S.reason, epoch: S.epoch });
  if (S.log.length > 20) S.log.shift();
}

function snap() {
  return { status: S.status, reason: S.reason, since: S.since, ticks: S.ticks, log: S.log.slice(-6) };
}

function sync(info) {
  if (info) info.fallback = snap();
  try {
    if (window.__mo2) window.__mo2.fallback = snap();
  } catch (e) {}
}

// 官方插槽是否在渲染：存在一个不在「兜底根」里的探针节点。
// 根节点每次现取（规则②）：容器被 cleanup 删掉后，旧引用会指向游离树，contains 永远 false。
export function officialChromeVisible() {
  var root = document.getElementById(FALLBACK_ID);
  var nodes = document.querySelectorAll(PROBE);
  for (var i = 0; i < nodes.length; i++) {
    if (!root || !root.contains(nodes[i])) return true;
  }
  return false;
}

function clearTimers() {
  if (S.timer) {
    clearTimeout(S.timer);
    S.timer = null;
  }
  if (S.watcher) {
    clearInterval(S.watcher);
    S.watcher = null;
  }
}

function unmount() {
  try {
    if (S.reactRoot) S.reactRoot.unmount();
  } catch (e) {}
  S.reactRoot = null;
  try {
    var el = document.getElementById(FALLBACK_ID);
    if (el) el.textContent = '';
  } catch (e) {}
  try {
    document.documentElement.classList.remove('mo2-fb-on');
  } catch (e) {}
}

function mount(info) {
  if (S.reactRoot) return true; // 规则③
  var q = window.QwenPaw || {};
  var h = q.host || {};
  if (!h.React || !h.ReactDOM) {
    note('off', '缺少 host.React / host.ReactDOM');
    sync(info);
    return false;
  }
  try {
    var el = ensureFallbackMount();
    S.reactRoot = h.ReactDOM.createRoot(el);
    S.reactRoot.render(h.React.createElement(FallbackShell, {}));
    document.documentElement.classList.add('mo2-fb-on');
    S.since = Date.now();
    note('on', '注册成功但 ' + DELAY + 'ms 内插槽零渲染');
    sync(info);
    return true;
  } catch (e) {
    S.reactRoot = null;
    note('off', '兜底挂载失败：' + ((e && e.message) || e));
    sync(info);
    return false;
  }
}

function watch(info, epoch) {
  if (S.watcher) clearInterval(S.watcher);
  S.ticks = 0;
  S.watcher = setInterval(function () {
    if (epoch !== S.epoch) {
      clearInterval(S.watcher);
      S.watcher = null;
      return;
    }
    S.ticks++;
    if (S.status !== 'on') {
      clearInterval(S.watcher);
      S.watcher = null;
      return;
    }
    if (officialChromeVisible()) {
      unmount();
      note('yielded', '官方插槽已恢复渲染（第 ' + S.ticks + ' 次复查）');
      clearInterval(S.watcher);
      S.watcher = null;
      sync(info);
      return;
    }
    if (S.ticks >= WATCH_MAX) {
      clearInterval(S.watcher);
      S.watcher = null;
    }
    sync(info);
  }, WATCH_EVERY);
}

export function startFallback(info) {
  clearTimers();
  S.epoch++;
  var epoch = S.epoch;
  note('pending', '等待 ' + DELAY + 'ms 观察插槽');
  sync(info);
  S.timer = setTimeout(function () {
    S.timer = null;
    if (epoch !== S.epoch) return;
    if (officialChromeVisible()) {
      note('idle', '插槽正常，兜底不启用');
      sync(info);
      return;
    }
    if (mount(info)) watch(info, epoch);
  }, DELAY);
  return snap();
}

export function resetFallback(info) {
  clearTimers();
  S.epoch++;
  unmount();
  note('idle', '已重置');
  S.since = 0;
  S.ticks = 0;
  sync(info);
}

export function fallbackState() {
  return snap();
}
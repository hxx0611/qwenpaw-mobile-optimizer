// 入口闸门：决定「本插件这次到底要不要干活」。
// 设计原则：判定失败时不抛错、不注入、不 hook 任何东西 —— PC 端零影响由此保证。
//
// 基线判定用【能力探测】而不是 UA：真机 UA 的 "CPU iPhone OS 18_7" 是苹果冻结的兼容
// 字段（实测真机 UA = "...CPU iPhone OS 18_7... Version/27.0"），sniff 版本号必错。

export var LOG = '[浏览器插件 v2]';

// 官方 Console 是 BrowserRouter，会把 /?x=1 重定向到 /chat 并丢掉 query，
// 所以调试开关必须支持 localStorage（跨导航存活）。
export function debugRequested() {
  try {
    if (/[?&]mo2_debug=1/.test(window.location.search)) return true;
  } catch (e) {}
  try {
    return window.localStorage.getItem('mo2_debug') === '1';
  } catch (e) {
    return false;
  }
}

// iOS 26 基线锚点：CSS Anchor Positioning（Safari 26 起支持）。
// 它同时是 v0.2「弹层不飞出屏幕」的机制基础，所以拿它当门最诚实。
export function hasBaseline() {
  try {
    if (!window.CSS || typeof CSS.supports !== 'function') return false;
    return (
      CSS.supports('anchor-name', '--mo2-a') &&
      CSS.supports('selector(:has(*))') &&
      CSS.supports('height', '100dvh')
    );
  } catch (e) {
    return false;
  }
}


// 插件只作用于聊天路由；管理/设置页面必须完全让位，避免移动端样式和插槽影响官方页面。
export function isChatRoute() {
  try {
    var path = window.location.pathname || '/';
    return path === '/' || path === '/chat' || path.indexOf('/chat/') === 0;
  } catch (e) {
    return false;
  }
}

export function isModelsRoute() {
  try { return (window.location.pathname || '') === '/models' || (window.location.pathname || '').indexOf('/models/') === 0; } catch (e) { return false; }
}

export function isMobileWidth() {
  try {
    return window.matchMedia('(max-width: 768px)').matches;
  } catch (e) {
    return false;
  }
}

// v1（qwenpaw-mobile-optimizer）在跑吗？它注入的 <style id="qwenpaw-mo-style"> 是可靠指纹。
// 互斥靠这个探测实现：两个插件可以同时 enabled，但只会有一个真正生效。
export function legacyActive() {
  try {
    return !!document.getElementById('qwenpaw-mo-style');
  } catch (e) {
    return false;
  }
}

// ⚠️ 单看 DOM 指纹有竞态：v1 是 setTimeout(300ms) 之后才注入样式的，v2 若在那之前判定，
//    会误以为"v1 没跑"而抢先激活 → 两个插件同时改界面（G1 验收 R2 实测踩到）。
// 所以以【服务端插件清单】为准（公开端点、无需鉴权、与注入时机无关），DOM 指纹只作为补充铁证。
export async function legacyPresent(timeoutMs) {
  if (legacyActive()) return { found: true, via: 'dom' };
  try {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 2500) : 0;
    var r = await fetch('/api/frontend_plugin', ctrl ? { signal: ctrl.signal } : undefined);
    if (t) clearTimeout(t);
    if (r && r.ok) {
      var list = await r.json();
      var arr = Array.isArray(list) ? list : [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].id === 'qwenpaw-mobile-optimizer' && arr[i].enabled !== false) {
          return { found: true, via: 'api', version: arr[i].version };
        }
      }
      return { found: false, via: 'api' };
    }
    return { found: false, via: 'http-' + ((r && r.status) || '?') };
  } catch (e) {
    return { found: false, via: 'error', error: String((e && e.message) || e) };
  }
}

// 自检开关要能活过 SPA 重定向：官方前端会把 "/" 重定向到 "/chat" 并丢掉 query
// （G1 验收 R3 实测：?mo_selftest=1 进去后 URL 变成 /chat）。故用 sessionStorage 落一次。
function store() {
  try {
    return window.sessionStorage;
  } catch (e) {
    return null; // iOS 无痕下可能抛错，降级为只看 URL
  }
}

// SPA 会把 "/" 重定向成 "/chat" 并丢掉 query（实测 location.href 已无 mo_selftest），
// 但 performance 的 navigation 条目仍保留【最初请求的完整 URL】——这是重定向后唯一可靠的真相。
function navUrl() {
  try {
    var n = (window.performance && performance.getEntriesByType('navigation')) || [];
    return (n[0] && n[0].name) || '';
  } catch (e) {
    return '';
  }
}

function hasFlag(search) {
  return /[?&]mo_selftest=1/.test(search || '');
}

export function syncSelfTestFlag() {
  var s = store();
  var on = hasFlag(window.location.search) || hasFlag(navUrl());
  try {
    if (on) {
      if (s) s.setItem('mo2.selftest', '1');
    } else if (/[?&]mo_selftest=0/.test(window.location.search)) {
      if (s) s.removeItem('mo2.selftest');
    }
  } catch (e) {}
  return on;
}

export function selfTestRequested() {
  if (hasFlag(window.location.search) || hasFlag(navUrl())) return true;
  var s = store();
  try {
    return !!(s && s.getItem('mo2.selftest') === '1');
  } catch (e) {
    return false;
  }
}

// 返回 { ok, blocked[] }；blocked 里是按顺序命中的否决原因（供自检面板显示）。
export function decide() {
  var debug = debugRequested();
  var blocked = [];
  if (!isChatRoute() && !debug) blocked.push('当前不是聊天页面，插件让位');
  if (!isMobileWidth() && !debug) blocked.push('视口宽度 > 768px（PC 端不生效）');
  if (!hasBaseline() && !debug) blocked.push('不满足 iOS 26 能力基线（缺 anchor-name / :has / dvh）');
  if (legacyActive()) blocked.push('检测到 v1「移动端优化」正在运行，v2 让位（一键回滚设计）');
  return { ok: blocked.length === 0, blocked: blocked, debug: debug };
}

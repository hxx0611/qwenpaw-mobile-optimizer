// 官方扩展 API 薄封装。两条铁律：
//  1) 一律「调用时再取」window.QwenPaw —— 绝不在模块求值时捕获（时序风险）；
//  2) 取不到就抛 CapabilityMissing，由上层决定「整体不注入」，绝不降级成 DOM 猜测。

export function missing(what) {
  var e = new Error('[mo2] 缺少官方能力: ' + what);
  e.code = 'CAPABILITY_MISSING';
  e.what = what;
  return e;
}

export function root() {
  var q = typeof window !== 'undefined' ? window.QwenPaw : null;
  if (!q || typeof q !== 'object') throw missing('window.QwenPaw');
  return q;
}

export function host() {
  var h = root().host;
  if (!h || !h.React) throw missing('host.React');
  return h;
}

export function React() {
  return host().React;
}

export function antd() {
  var h = host();
  if (!h.antd) throw missing('host.antd');
  return h.antd;
}

export function api() {
  var h = host();
  if (typeof h.getApiUrl !== 'function' || typeof h.getApiToken !== 'function') {
    throw missing('host.getApiUrl/getApiToken');
  }
  return h;
}

export function icons() {
  var h = host();
  return h.antdIcons || {};
}

// 官方 toast（host.toast 优先，缺失则静默）
export function toast(msg, kind) {
  try {
    var h = host();
    if (typeof h.toast === 'function') {
      h.toast(msg, kind || 'info');
      return true;
    }
    var A = h.antd;
    if (A && A.message) {
      (A.message[kind === 'error' ? 'error' : 'success'] || A.message.info).call(A.message, msg);
      return true;
    }
  } catch (e) {}
  return false;
}

export function slot() {
  var s = root().slot;
  if (!s || typeof s.fill !== 'function' || typeof s.snapshot !== 'function') {
    throw missing('slot.fill/snapshot');
  }
  return s;
}

export function menu() {
  var m = root().menu;
  if (!m || typeof m.add !== 'function' || typeof m.snapshot !== 'function') {
    throw missing('menu.add/snapshot');
  }
  return m;
}

export function route() {
  var r = root().route;
  if (!r || typeof r.add !== 'function') throw missing('route.add');
  return r;
}

export function chat() {
  var c = root().chat;
  if (!c) throw missing('chat');
  return c;
}

// 探测版：不抛错，返回 { 名称: 是否可用 }，供自检面板用。
export function probe() {
  var out = {};
  var q = typeof window !== 'undefined' ? window.QwenPaw : null;
  out.QwenPaw = !!q;
  out['host.React'] = !!(q && q.host && q.host.React);
  out['host.ReactDOM'] = !!(q && q.host && q.host.ReactDOM);
  out['host.antd'] = !!(q && q.host && q.host.antd);
  out['host.antdIcons'] = !!(q && q.host && q.host.antdIcons);
  out['host.getApiUrl'] = !!(q && q.host && typeof q.host.getApiUrl === 'function');
  out['host.getApiToken'] = !!(q && q.host && typeof q.host.getApiToken === 'function');
  out['host.fetch'] = !!(q && q.host && typeof q.host.fetch === 'function');
  out.slot = !!(q && q.slot && typeof q.slot.fill === 'function' && typeof q.slot.snapshot === 'function');
  out.menu = !!(q && q.menu && typeof q.menu.add === 'function' && typeof q.menu.snapshot === 'function');
  out.route = !!(q && q.route && typeof q.route.add === 'function');
  out['route.wrap'] = !!(q && q.route && typeof q.route.wrap === 'function');
  out.chat = !!(q && q.chat);
  out['chat.sender'] = !!(q && q.chat && q.chat.sender);
  out['chat.actions'] = !!(q && q.chat && q.chat.actions);
  out['chat.card'] = !!(q && q.chat && typeof q.chat.card === 'function');
  out.audit = !!(q && q.audit && typeof q.audit.overrides === 'function');
  return out;
}

export var PLUGIN_ID = 'qwenpaw-mobile-optimizer-v2';

/* 浏览器插件 (Mobile Optimizer v2) v1.2.0 — 构建产物，请勿直接编辑，源码见 src/
   由 scripts/build.mjs 生成；改代码后必须重新构建再热加载。 */
// src/version.js
var VERSION = "1.2.0";

// src/gate.js
var LOG = "[\u6D4F\u89C8\u5668\u63D2\u4EF6 v2]";
function debugRequested() {
  try {
    if (/[?&]mo2_debug=1/.test(window.location.search)) return true;
  } catch (e) {
  }
  try {
    return window.localStorage.getItem("mo2_debug") === "1";
  } catch (e) {
    return false;
  }
}
function hasBaseline() {
  try {
    if (!window.CSS || typeof CSS.supports !== "function") return false;
    return CSS.supports("anchor-name", "--mo2-a") && CSS.supports("selector(:has(*))") && CSS.supports("height", "100dvh");
  } catch (e) {
    return false;
  }
}
function isChatRoute() {
  try {
    var path = window.location.pathname || "/";
    return path === "/" || path === "/chat" || path.indexOf("/chat/") === 0;
  } catch (e) {
    return false;
  }
}
function isBlockedRoute() {
  try {
    var p = window.location.pathname || "/";
    return /^\/(login|token|register)(\/|$)/.test(p);
  } catch (e) {
    return false;
  }
}
function isMobileWidth() {
  try {
    return window.matchMedia("(max-width: 768px)").matches;
  } catch (e) {
    return false;
  }
}
function legacyActive() {
  try {
    return !!document.getElementById("qwenpaw-mo-style");
  } catch (e) {
    return false;
  }
}
async function legacyPresent(timeoutMs) {
  if (legacyActive()) return { found: true, via: "dom" };
  try {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var t = ctrl ? setTimeout(function() {
      ctrl.abort();
    }, timeoutMs || 2500) : 0;
    var r = await fetch("/api/frontend_plugin", ctrl ? { signal: ctrl.signal } : void 0);
    if (t) clearTimeout(t);
    if (r && r.ok) {
      var list = await r.json();
      var arr = Array.isArray(list) ? list : [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].id === "qwenpaw-mobile-optimizer" && arr[i].enabled !== false) {
          return { found: true, via: "api", version: arr[i].version };
        }
      }
      return { found: false, via: "api" };
    }
    return { found: false, via: "http-" + (r && r.status || "?") };
  } catch (e) {
    return { found: false, via: "error", error: String(e && e.message || e) };
  }
}
function store() {
  try {
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}
function navUrl() {
  try {
    var n = window.performance && performance.getEntriesByType("navigation") || [];
    return n[0] && n[0].name || "";
  } catch (e) {
    return "";
  }
}
function hasFlag(search) {
  return /[?&]mo_selftest=1/.test(search || "");
}
function syncSelfTestFlag() {
  var s = store();
  var on = hasFlag(window.location.search) || hasFlag(navUrl());
  try {
    if (on) {
      if (s) s.setItem("mo2.selftest", "1");
    } else if (/[?&]mo_selftest=0/.test(window.location.search)) {
      if (s) s.removeItem("mo2.selftest");
    }
  } catch (e) {
  }
  return on;
}
function selfTestRequested() {
  if (hasFlag(window.location.search) || hasFlag(navUrl())) return true;
  var s = store();
  try {
    return !!(s && s.getItem("mo2.selftest") === "1");
  } catch (e) {
    return false;
  }
}
function decide() {
  var debug = debugRequested();
  var blocked = [];
  if (isBlockedRoute() && !debug) blocked.push("\u5F53\u524D\u662F\u767B\u5F55/\u9274\u6743\u9875\uFF0C\u63D2\u4EF6\u8BA9\u4F4D");
  if (!isMobileWidth() && !debug) blocked.push("\u89C6\u53E3\u5BBD\u5EA6 > 768px\uFF08PC \u7AEF\u4E0D\u751F\u6548\uFF09");
  if (!hasBaseline() && !debug) blocked.push("\u4E0D\u6EE1\u8DB3 iOS 26 \u80FD\u529B\u57FA\u7EBF\uFF08\u7F3A anchor-name / :has / dvh\uFF09");
  if (legacyActive()) blocked.push("\u68C0\u6D4B\u5230 v1\u300C\u79FB\u52A8\u7AEF\u4F18\u5316\u300D\u6B63\u5728\u8FD0\u884C\uFF0Cv2 \u8BA9\u4F4D\uFF08\u4E00\u952E\u56DE\u6EDA\u8BBE\u8BA1\uFF09");
  return { ok: blocked.length === 0, blocked, debug };
}

// src/api/qw.js
function missing(what) {
  var e = new Error("[mo2] \u7F3A\u5C11\u5B98\u65B9\u80FD\u529B: " + what);
  e.code = "CAPABILITY_MISSING";
  e.what = what;
  return e;
}
function root() {
  var q = typeof window !== "undefined" ? window.QwenPaw : null;
  if (!q || typeof q !== "object") throw missing("window.QwenPaw");
  return q;
}
function host() {
  var h = root().host;
  if (!h || !h.React) throw missing("host.React");
  return h;
}
function antd() {
  var h = host();
  if (!h.antd) throw missing("host.antd");
  return h.antd;
}
function icons() {
  var h = host();
  return h.antdIcons || {};
}
function toast(msg, kind) {
  try {
    var h = host();
    if (typeof h.toast === "function") {
      h.toast(msg, kind || "info");
      return true;
    }
    var A = h.antd;
    if (A && A.message) {
      (A.message[kind === "error" ? "error" : "success"] || A.message.info).call(A.message, msg);
      return true;
    }
  } catch (e) {
  }
  return false;
}
function slot() {
  var s = root().slot;
  if (!s || typeof s.fill !== "function" || typeof s.snapshot !== "function") {
    throw missing("slot.fill/snapshot");
  }
  return s;
}
function probe() {
  var out = {};
  var q = typeof window !== "undefined" ? window.QwenPaw : null;
  out.QwenPaw = !!q;
  out["host.React"] = !!(q && q.host && q.host.React);
  out["host.ReactDOM"] = !!(q && q.host && q.host.ReactDOM);
  out["host.antd"] = !!(q && q.host && q.host.antd);
  out["host.antdIcons"] = !!(q && q.host && q.host.antdIcons);
  out["host.getApiUrl"] = !!(q && q.host && typeof q.host.getApiUrl === "function");
  out["host.getApiToken"] = !!(q && q.host && typeof q.host.getApiToken === "function");
  out["host.fetch"] = !!(q && q.host && typeof q.host.fetch === "function");
  out.slot = !!(q && q.slot && typeof q.slot.fill === "function" && typeof q.slot.snapshot === "function");
  out.menu = !!(q && q.menu && typeof q.menu.add === "function" && typeof q.menu.snapshot === "function");
  out.route = !!(q && q.route && typeof q.route.add === "function");
  out["route.wrap"] = !!(q && q.route && typeof q.route.wrap === "function");
  out.chat = !!(q && q.chat);
  out["chat.sender"] = !!(q && q.chat && q.chat.sender);
  out["chat.actions"] = !!(q && q.chat && q.chat.actions);
  out["chat.card"] = !!(q && q.chat && typeof q.chat.card === "function");
  out.audit = !!(q && q.audit && typeof q.audit.overrides === "function");
  return out;
}
var PLUGIN_ID = "qwenpaw-mobile-optimizer-v2";

// src/styles/base.css
var base_default = '/* v0.2 \u57FA\u7840\u6837\u5F0F\u3002G1 \u53EA\u653E\uFF1A\u53D8\u91CF\u3001iOS26 \u57FA\u7EBF\u5B88\u536B\u3001Safari \u5E38\u9A7B\u4FEE\u6B63\u3001\u81EA\u68C0\u9762\u677F\u6837\u5F0F\u3002\n   \u6536\u7EB3/\u5F39\u5C42/\u9876\u680F\u6837\u5F0F\u5728 G2/G4 \u8FFD\u52A0\uFF1Blegacy.css \u5C1A\u672A\u521B\u5EFA\uFF08\u76EE\u6807\uFF1A\u5B98\u65B9\u7C7B\u540D\u5F15\u7528 \u22646 \u6761\u4E14\u53EA\u5728\u90A3\u4E2A\u6587\u4EF6\u91CC\uFF09\u3002 */\n\n:root {\n  /* \u81EA\u68C0\u9879\u2469\uFF1A\u8BC1\u660E\u672C <style> \u771F\u7684\u751F\u6548\uFF08\u8BFB\u8BA1\u7B97\u503C\uFF09 */\n  --mo2-marker: mo2-ok;\n\n  /* \u7531 env/viewport.js \u7528 JS \u5B9E\u65F6\u5237\u65B0\uFF08iOS \u7684 100vh \u542B\u5DE5\u5177\u680F\uFF0C\u4E0D\u53EF\u4FE1\uFF09 */\n  --mo2-vh: 100dvh;\n  --mo2-kbd: 0px;\n  --mo2-safe-top: env(safe-area-inset-top, 0px);\n  --mo2-safe-bottom: env(safe-area-inset-bottom, 0px);\n  --mo2-safe-left: env(safe-area-inset-left, 0px);\n  --mo2-safe-right: env(safe-area-inset-right, 0px);\n}\n\n@media (max-width: 768px) {\n  /* iOS \u805A\u7126\u9632\u6574\u9875\u653E\u5927\uFF1A\u5B57\u53F7 <16px \u4F1A\u89E6\u53D1 Safari \u7F29\u653E\uFF08\u5386\u53F2\u8E29\u5751\uFF0C\u505A\u5E38\u9A7B\u5B88\u536B\uFF09 */\n  input,\n  textarea,\n  select {\n    font-size: 16px !important;\n  }\n\n  /* \u53BB 300ms \u5EF6\u8FDF\u4E0E\u7070\u95EA */\n  a,\n  button,\n  [role="button"] {\n    touch-action: manipulation;\n    -webkit-tap-highlight-color: transparent;\n  }\n\n  /* \u9632\u6A61\u76AE\u7B4B\u6EDA\u52A8\u7A7F\u900F\uFF08\u9762\u677F\u4E0E\u6EDA\u52A8\u5BB9\u5668\uFF09 */\n  #qwenpaw-mo2-root {\n    overscroll-behavior: contain;\n  }\n}\n\n/* ---------- \u9876\u680F\u5165\u53E3\u4E0E\u529F\u80FD\u9762\u677F\uFF08G2\uFF09 ---------- */\n.mo2-topbar {\n  display: inline-flex;\n  align-items: center;\n  gap: 2px;\n}\n\n.mo2-topbar-on {\n  background: rgba(24, 144, 255, 0.12) !important;\n}\n\n.mo2-drawer .mo2-sheet-list .mo2-row-item {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 13px 4px;\n  border-bottom: 1px solid rgba(127, 127, 127, 0.14);\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.mo2-drawer .mo2-row-ico {\n  flex: 0 0 auto;\n  width: 22px;\n  text-align: center;\n  font-size: 16px;\n  opacity: 0.85;\n}\n\n.mo2-drawer .mo2-row-main {\n  flex: 1 1 auto;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n\n.mo2-drawer .mo2-row-label {\n  font-size: 15px;\n}\n\n.mo2-drawer .mo2-row-sub {\n  font-size: 11px;\n  opacity: 0.6;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.mo2-drawer .mo2-off {\n  opacity: 0.45;\n  pointer-events: none;\n}\n\n.mo2-sheet-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 8px;\n}\n\n.mo2-sheet-title {\n  font-size: 14px;\n  font-weight: 600;\n}\n\n.mo2-model-select {\n  width: 100%;\n}\n\n.mo2-err {\n  margin-top: 8px;\n  font-size: 12px;\n  color: #d4380d;\n}\n\n/* ---------- \u81EA\u68C0\u9762\u677F ---------- */\n.mo2-selftest {\n  position: fixed;\n  inset: auto 8px calc(8px + var(--mo2-safe-bottom)) 8px;\n  max-height: calc(var(--mo2-vh) - 24px);\n  overflow: auto;\n  -webkit-overflow-scrolling: touch;\n  z-index: 9999;\n  background: #fff;\n  color: #171717;\n  border: 1px solid #e5e5e5;\n  border-radius: 12px;\n  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);\n  padding: 12px 12px 14px;\n  font-size: 13px;\n  line-height: 1.5;\n  user-select: text;\n}\n\n@media (prefers-color-scheme: dark) {\n  .mo2-selftest {\n    background: #1f1f1f;\n    color: #f0f0f0;\n    border-color: #3a3a3a;\n  }\n}\n\n.mo2-selftest h3 {\n  margin: 0 0 8px;\n  font-size: 14px;\n}\n\n.mo2-row {\n  display: flex;\n  align-items: baseline;\n  gap: 6px;\n  padding: 3px 0;\n  border-bottom: 1px dashed rgba(127, 127, 127, 0.22);\n}\n\n.mo2-tag {\n  flex: 0 0 auto;\n  min-width: 46px;\n  text-align: center;\n  border-radius: 4px;\n  font-size: 11px;\n  padding: 1px 5px;\n  color: #fff;\n}\n\n.mo2-pass {\n  background: #22a06b;\n}\n\n.mo2-fail {\n  background: #d4380d;\n}\n\n.mo2-warn {\n  background: #d48806;\n}\n\n.mo2-name {\n  flex: 1 1 auto;\n}\n\n.mo2-detail {\n  flex: 0 0 auto;\n  font-family: ui-monospace, Menlo, monospace;\n  font-size: 11px;\n  opacity: 0.72;\n  max-width: 46%;\n  word-break: break-all;\n  text-align: right;\n}\n\n.mo2-actions {\n  display: flex;\n  gap: 8px;\n  margin-top: 10px;\n}\n\n.mo2-actions button {\n  font-size: 13px;\n  padding: 6px 10px;\n  border-radius: 8px;\n  border: 1px solid #d9d9d9;\n  background: #fafafa;\n  color: inherit;\n}\n\n.mo2-probe-input {\n  width: 100%;\n  margin: 8px 0 0;\n  padding: 8px 10px;\n  border: 1px solid #d9d9d9;\n  border-radius: 8px;\n}\n\n/* \u81EA\u68C0\u9879\u246D\uFF1A\u771F\u8BFB env(safe-area-inset-*)\uFF0C\u975E\u96F6\u8BF4\u660E viewport-fit=cover \u751F\u6548 */\n.mo2-safe-probe {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 1px;\n  height: 1px;\n  pointer-events: none;\n  opacity: 0;\n  padding-left: env(safe-area-inset-left, 0px);\n  padding-right: env(safe-area-inset-right, 0px);\n  padding-top: env(safe-area-inset-top, 0px);\n  padding-bottom: env(safe-area-inset-bottom, 0px);\n}\n/* ================= v1.2.0 \u8FFD\u52A0\uFF08C1-a \u4F1A\u8BDD\u680F / C1-b \u5E95\u90E8 Tab / C2-f \u66F4\u591A\u9875\u9762 / C1-c \u5DE5\u5177\u9875\uFF09 =================\n   \u5168\u90E8\u6302\u5728 .mo2-* \u81EA\u6709\u7C7B\u4E0A\uFF1A\u4E0D\u52A8\u5B98\u65B9\u7C7B\u540D\uFF08legacy.css \u9884\u7B97\u4ECD\u662F 3/6 \u6761\uFF09\uFF0C\n   \u4E5F\u4E0D\u6539\u5B98\u65B9\u8282\u70B9\u7684\u4EFB\u4F55\u5C5E\u6027 \u2014\u2014 \u8FD9\u662F\u300C\u5B98\u65B9\u63D2\u69FD + \u81EA\u6709 CSS\u300D\u8DEF\u7EBF\u7684\u5E95\u7EBF\u3002 */\n\n.mo2-tabs {\n  position: fixed;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 900;\n  display: flex;\n  align-items: stretch;\n  height: 52px;\n  padding-bottom: env(safe-area-inset-bottom, 0px);\n  background: rgba(255, 255, 255, 0.96);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border-top: 1px solid rgba(0, 0, 0, 0.08);\n}\n\n.mo2-tab {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 2px;\n  border: 0;\n  background: none;\n  padding: 0;\n  font-size: 11px;\n  color: #8c8c8c;\n  cursor: pointer;\n}\n\n.mo2-tab-on {\n  color: #1677ff;\n}\n\n.mo2-tab-ico {\n  font-size: 17px;\n  line-height: 1;\n}\n\n.mo2-session-body {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  height: 100%;\n  overflow: auto;\n  -webkit-overflow-scrolling: touch;\n}\n\n.mo2-session-tools {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 2px 6px;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.06);\n}\n\n.mo2-session-gtitle {\n  margin: 10px 4px 4px;\n  font-size: 12px;\n  color: #8c8c8c;\n}\n\n.mo2-session-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  min-height: 44px;\n  padding: 8px 10px;\n  border-radius: 8px;\n  background: rgba(0, 0, 0, 0.02);\n}\n\n.mo2-session-item:active {\n  background: rgba(0, 0, 0, 0.07);\n}\n\n.mo2-session-cur {\n  background: rgba(22, 119, 255, 0.08);\n}\n\n.mo2-session-name {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 14px;\n}\n\n.mo2-session-side {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  flex: 0 0 auto;\n  font-size: 11px;\n  color: #8c8c8c;\n}\n\n.mo2-empty {\n  padding: 16px 6px;\n  font-size: 13px;\n  color: #8c8c8c;\n  text-align: center;\n}\n\n.mo2-tools {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 14px 14px calc(76px + env(safe-area-inset-bottom, 0px));\n}\n\n.mo2-tools-head {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n}\n\n.mo2-tools-title {\n  font-size: 18px;\n  font-weight: 600;\n}\n\n.mo2-tools-ver {\n  font-size: 12px;\n  color: #8c8c8c;\n}\n\n.mo2-tools-card {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 10px 12px;\n  border: 1px solid rgba(0, 0, 0, 0.08);\n  border-radius: 10px;\n  background: rgba(0, 0, 0, 0.015);\n}\n\n.mo2-tools-line {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  font-size: 12px;\n}\n\n.mo2-tools-k {\n  flex: 0 0 auto;\n  color: #8c8c8c;\n}\n\n.mo2-tools-v {\n  text-align: right;\n  word-break: break-all;\n}\n\n.mo2-bad {\n  color: #cf1322;\n}\n\n.mo2-tools-sec {\n  margin-top: 4px;\n  font-size: 12px;\n  color: #8c8c8c;\n}\n\n.mo2-tools-grid,\n.mo2-pages-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n  padding-bottom: 6px;\n}\n\n.mo2-tools-item,\n.mo2-pages-item {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  min-height: 62px;\n  padding: 8px 4px;\n  border: 1px solid rgba(0, 0, 0, 0.08);\n  border-radius: 10px;\n  background: none;\n  font-size: 12px;\n  color: inherit;\n}\n\n.mo2-tools-ico {\n  font-size: 18px;\n  line-height: 1;\n}\n\n.mo2-tools-actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.mo2-sheet-body {\n  max-height: min(62vh, calc(var(--mo2-vh, 100dvh) - var(--mo2-kbd, 0px) - 120px));\n  overflow: auto;\n  -webkit-overflow-scrolling: touch;\n}\n\n/* \u6DF1\u8272\uFF1A\u5B98\u65B9\u63A7\u5236\u53F0\u53EF\u8DDF\u968F\u7CFB\u7EDF\u6DF1\u8272\uFF0C\u786C\u767D\u5E95\u4F1A\u523A\u773C */\n@media (prefers-color-scheme: dark) {\n  .mo2-tabs {\n    background: rgba(20, 20, 22, 0.94);\n    border-top-color: rgba(255, 255, 255, 0.12);\n  }\n  .mo2-session-item {\n    background: rgba(255, 255, 255, 0.04);\n  }\n  .mo2-session-cur {\n    background: rgba(22, 119, 255, 0.16);\n  }\n  .mo2-tools-card,\n  .mo2-tools-item,\n  .mo2-pages-item {\n    border-color: rgba(255, 255, 255, 0.12);\n    background: rgba(255, 255, 255, 0.03);\n  }\n}';

// src/styles/legacy.css
var legacy_default = '/* legacy.css \u2014\u2014 \u5168\u4ED3\u552F\u4E00\u5141\u8BB8\u51FA\u73B0\u5B98\u65B9\u7C7B\u540D\u524D\u7F00\u7684\u6587\u4EF6\u3002\u89C4\u5219\u4E0A\u9650 6 \u6761\uFF0C\u6BCF\u6761\u5FC5\u987B\u5199\u660E\u7406\u7531\u3002\n   \u5931\u6548\u6A21\u5F0F\u88AB\u523B\u610F\u538B\u6210\u300C\u67D0\u4E2A\u6309\u94AE\u6CA1\u85CF\u4F4F\u300D\u8FD9\u79CD\u5916\u89C2\u7455\u75B5\uFF0C\u4E0D\u4F1A\u5D29\u3001\u4E0D\u4F1A\u9501\u4EA4\u4E92\u3002\n   \u9009\u62E9\u5668\u53EA\u7528 CSS Modules \u7684\u3010\u6A21\u5757\u540D\u7247\u6BB5\u3011\uFF08modeTrigger / ApprovalToggle-module__trigger \u2026\uFF09\uFF0C\n   \u5B83\u4EEC\u8DE8\u6784\u5EFA\u7A33\u5B9A\uFF0C\u53EA\u6709 __\u54C8\u5E0C \u540E\u7F00\u4F1A\u53D8\uFF1B\u4E0D\u7528 aria-label\uFF08\u4E2D\u6587\u6587\u6848\uFF0Ci18n \u4E00\u53D8\u5C31\u5931\u6548\uFF09\u3002 */\n\n@media (max-width: 768px) {\n  /* \u89C4\u5219 1\uFF1A\u8F93\u5165\u6846\u4E0B\u65B9\u53EA\u7559 \u9EA6\u514B\u98CE/\u9644\u4EF6/\u4E0A\u4E0B\u6587\u7528\u91CF/\u53D1\u9001 \u2014\u2014 Loop\u3001\u5BA1\u6279\u3001\u9879\u76EE\u76EE\u5F55\u6536\u8FDB\u529F\u80FD\u9762\u677F\u3002\n     \u6CE8\u610F\uFF1A\u4E0D\u7528 display:none\uFF01display:none \u4F1A\u8BA9\u5143\u7D20\u5931\u53BB\u76D2\u5B50\uFF0C\u5B98\u65B9\u5F39\u5C42\u6309 getBoundingClientRect\n     \u5B9A\u4F4D\u65F6\u4F1A\u9000\u5316\u5230 (0,0) \u800C\u6574\u5C42\u98DE\u51FA\u5C4F\u5E55\uFF08v0.1.78 \u8E29\u8FC7\uFF09\u3002\u8FD9\u91CC\u628A\u76D2\u5B50\u538B\u6210 0 \u5BBD\u4F46\u4FDD\u7559\u4F4D\u7F6E\uFF0C\n     \u5F39\u5C42\u4ECD\u7136\u951A\u5728\u8F93\u5165\u6846\u90A3\u4E00\u884C\u7684\u539F\u4F4D\uFF0C\u843D\u5728\u5C4F\u5185\u3002 */\n  [class*="modeTrigger"],\n  [class*="ApprovalToggle-module__trigger"],\n  [class*="SessionProjectDirectory-module__trigger"] {\n    width: 0 !important;\n    min-width: 0 !important;\n    max-width: 0 !important;\n    padding: 0 !important;\n    margin: 0 !important;\n    border: 0 !important;\n    overflow: hidden !important;\n    font-size: 0 !important;\n    color: transparent !important;\n  }\n\n  /* \u89C4\u5219 2\uFF1A\u4E0A\u6761\u538B\u6241\u540E\u5B98\u65B9\u90A3\u7EC4\u6309\u94AE\u7684 gap \u4F1A\u7559\u4E0B\u7A7A\u9699\uFF0C\u6536\u7D27\u4E00\u6B21 */\n  [class*="mobileComposerControl"] {\n    gap: 0 !important;\n  }\n\n\n  /* \u89C4\u5219 3\uFF08\u6536\u5C3E\u65F6\u5355\u72EC\u6458\u56DE\uFF09\uFF1AiOS \u952E\u76D8\u5F39\u8D77\u65F6\u62AC\u5347\u8F93\u5165\u533A\u3002\n     Safari \u4E0D\u652F\u6301 interactive-widget=resizes-content\uFF0C\u952E\u76D8\u53EA\u7F29 visualViewport\u3001\u5E03\u5C40\u89C6\u53E3\u4E0D\u52A8\uFF0C\n     \u6240\u4EE5\u5FC5\u987B\u81EA\u5DF1\u62AC\uFF1B\u7528 transform \u800C\u975E\u6539 height/margin\uFF0C\u907F\u514D\u6574\u9875\u91CD\u6392\u3002\n     --mo2-kbd \u7531 src/env/viewport.js \u5199\u5728 :root \u4E0A\uFF0C\u4E0D\u78B0\u5B98\u65B9\u8282\u70B9\u7684\u5185\u8054\u6837\u5F0F\u3002 */\n  [class*="sender"] {\n    transform: translateY(calc(-1 * var(--mo2-kbd, 0px)));\n  }\n}\n';

// src/boot/inject.js
var STYLE_ID = "qwenpaw-mo2-style";
var ROOT_ID = "qwenpaw-mo2-root";
var PLUGIN_FILES = "/api/frontend_plugin/" + PLUGIN_ID + "/files/frontend";
function head() {
  return document.head || document.getElementsByTagName("head")[0];
}
function injectStyle() {
  if (document.getElementById(STYLE_ID)) return document.getElementById(STYLE_ID);
  var st = document.createElement("style");
  st.id = STYLE_ID;
  st.setAttribute("data-mo2", "1");
  st.textContent = base_default + "\n" + legacy_default;
  head().appendChild(st);
  return st;
}
function linkRel(rel) {
  return document.querySelector('head link[rel="' + rel + '"]');
}
function injectManifest() {
  var added = [];
  var existing = linkRel("manifest");
  if (!existing) {
    var l = document.createElement("link");
    l.setAttribute("data-mo2", "1");
    l.rel = "manifest";
    l.href = PLUGIN_FILES + "/manifest.json";
    head().appendChild(l);
    added.push("manifest");
  }
  if (!linkRel("apple-touch-icon")) {
    var a = document.createElement("link");
    a.setAttribute("data-mo2", "1");
    a.rel = "apple-touch-icon";
    a.sizes = "180x180";
    a.href = PLUGIN_FILES + "/icons/apple-touch-icon.png";
    head().appendChild(a);
    added.push("apple-touch-icon");
  }
  var dark = false;
  try {
    dark = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  } catch (e) {
  }
  if (!document.querySelector('head meta[name="theme-color"]')) {
    var m = document.createElement("meta");
    m.setAttribute("data-mo2", "1");
    m.name = "theme-color";
    m.content = dark ? "#000000" : "#ffffff";
    head().appendChild(m);
    added.push("theme-color");
  }
  return added;
}
function ensureMount() {
  var el = document.getElementById(ROOT_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = ROOT_ID;
  el.setAttribute("data-mo2", "1");
  document.body.appendChild(el);
  return el;
}
function manifestHref() {
  var l = linkRel("manifest");
  return l ? l.href : "";
}

// src/env/viewport.js
var _raf = 0;
var _baseInner = 0;
var state = {
  vh: 0,
  inner: 0,
  kbd: 0,
  // 键盘占用的像素高度（0 = 未弹起）
  kbdMax: 0,
  // 会话内观测到的最大键盘高度 → 自检项⑬用
  offsetTop: 0
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
    var k = Math.max(0, Math.round(inner - vv.height - (vv.offsetTop || 0)));
    state.kbd = k;
    if (k > state.kbdMax) state.kbdMax = k;
  } else {
    state.vh = inner;
    state.kbd = 0;
  }
  var d = doc();
  if (!d || !d.style) return;
  d.style.setProperty("--mo2-kbd", state.kbd + "px");
}
function schedule() {
  if (_raf) return;
  _raf = window.requestAnimationFrame(measure);
}
function start() {
  try {
    measure();
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", schedule);
      vv.addEventListener("scroll", schedule);
    }
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("resize", schedule);
  } catch (e) {
    console.warn(LOG + " \u89C6\u53E3\u76D1\u542C\u542F\u52A8\u5931\u8D25\uFF1A" + (e && e.message));
  }
  return measure;
}
function snapshot() {
  return {
    vh: state.vh,
    inner: state.inner,
    kbd: state.kbd,
    kbdMax: state.kbdMax,
    visualViewport: !!window.visualViewport
  };
}
function stop() {
  try {
    if (_raf) {
      window.cancelAnimationFrame(_raf);
      _raf = 0;
    }
    var vv = window.visualViewport;
    if (vv) {
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
    }
    window.removeEventListener("orientationchange", schedule);
    window.removeEventListener("resize", schedule);
    var d = doc();
    if (d && d.style) {
      d.style.removeProperty("--mo2-vh");
      d.style.removeProperty("--mo2-kbd");
    }
    _baseInner = 0;
  } catch (e) {
  }
}

// src/legacy/click.js
var SIGNALS = {
  newChat: [{ cls: "newChat" }, { cls: "newChat-module" }, { aria: "\u65B0\u5EFA\u4EFB\u52A1" }, { aria: "New task" }, { aria: "New chat" }],
  workspace: [
    { cls: "SessionProjectDirectory-module__trigger" },
    { cls: "ProjectDirectory" },
    { aria: "\u5F53\u524D\u4F1A\u8BDD\u9879\u76EE\u76EE\u5F55" },
    { aria: "\u9879\u76EE\u76EE\u5F55" }
  ],
  loopMode: [{ cls: "modeTrigger" }, { cls: "loopTrigger" }, { aria: "\u9009\u62E9 Loop \u6A21\u5F0F" }, { aria: "Loop" }],
  approval: [{ cls: "ApprovalToggle-module__trigger" }, { cls: "ApprovalToggle" }, { aria: "\u5DE5\u5177\u5BA1\u6279\u6A21\u5F0F" }, { aria: "\u5BA1\u6279\u6A21\u5F0F" }]
};
function firstVisible(sel) {
  var els;
  try {
    els = document.querySelectorAll(sel);
  } catch (e) {
    return null;
  }
  for (var i = 0; i < els.length; i++) {
    var r = els[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return els[i];
  }
  return els.length ? els[0] : null;
}
function findOfficial(key) {
  var sig = SIGNALS[key];
  if (!sig) return null;
  for (var i = 0; i < sig.length; i++) {
    var sel = sig[i].aria ? '[aria-label="' + sig[i].aria + '"]' : '[class*="' + sig[i].cls + '"]';
    var el = firstVisible(sel);
    if (el) return { el, via: sig[i].aria ? "aria" : "cls", sel, depth: i, weak: i > 0 };
  }
  return null;
}
function signalsReport() {
  var out = {};
  Object.keys(SIGNALS).forEach(function(k) {
    var hit = findOfficial(k);
    out[k] = hit ? { found: true, via: hit.via, depth: hit.depth, sel: hit.sel, weak: hit.weak } : { found: false, via: "none", depth: -1, sel: "", weak: true };
  });
  return out;
}
function clickOfficial(key) {
  var hit = findOfficial(key);
  if (!hit) return { ok: false, via: "none" };
  try {
    hit.el.click();
    return { ok: true, via: hit.via };
  } catch (e) {
    return { ok: false, via: "error:" + (e && e.message || e) };
  }
}
function availability() {
  var out = {};
  Object.keys(SIGNALS).forEach(function(k) {
    out[k] = !!findOfficial(k);
  });
  return out;
}
function waitOfficial(key, timeoutMs) {
  var limit = timeoutMs || 5e3;
  return new Promise(function(resolve) {
    var t0 = Date.now();
    (function step() {
      var hit = findOfficial(key);
      if (hit) {
        try {
          hit.el.click();
          resolve({ ok: true, via: hit.via });
        } catch (e) {
          resolve({ ok: false, via: "error:" + (e && e.message || e) });
        }
        return;
      }
      if (Date.now() - t0 > limit) {
        resolve({ ok: false, via: "timeout" });
        return;
      }
      setTimeout(step, 200);
    })();
  });
}

// src/api/models.js
async function api(path, init) {
  var h = host();
  if (typeof h.fetch === "function") return h.fetch(path, init);
  var url = typeof h.getApiUrl === "function" ? h.getApiUrl(path) : "/api" + path;
  var headers = Object.assign({}, init && init.headers || {});
  try {
    if (h.getApiToken) headers.Authorization = "Bearer " + h.getApiToken();
  } catch (e) {
  }
  return fetch(url, Object.assign({}, init, { headers }));
}
async function listProviders() {
  var r = await api("/models");
  if (!r.ok) throw new Error("GET /models \u2192 " + r.status);
  return r.json();
}
async function getActive() {
  var r = await api("/models/active");
  if (!r.ok) throw new Error("GET /models/active \u2192 " + r.status);
  return r.json();
}
function buildOptions(providers) {
  var out = [];
  (providers || []).forEach(function(p) {
    var seen = {};
    var list = [];
    [].concat(p.models || [], p.extra_models || [], p.discovered_models || []).forEach(function(m) {
      var id = typeof m === "string" ? m : m && m.id;
      if (!id || seen[id]) return;
      seen[id] = 1;
      list.push({ value: p.id + "::" + id, label: String((typeof m === "string" ? m : m.name || m.id) || "") });
    });
    if (list.length) out.push({ label: p.name || p.id, options: list, providerId: p.id });
  });
  return out;
}
async function setActive(providerId, model) {
  var h = host();
  var agentId = null;
  try {
    agentId = h.getSelectedAgentId ? h.getSelectedAgentId() : null;
  } catch (e) {
  }
  var body = { provider_id: providerId, model, scope: "agent", agent_id: agentId };
  var r = await api("/models/active", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  var text = "";
  if (!r.ok) {
    try {
      text = await r.text() || "";
    } catch (e) {
    }
    throw new Error("PUT /models/active \u2192 " + r.status + " " + text.slice(0, 160));
  }
  var json = null;
  try {
    json = await r.json();
  } catch (e) {
  }
  try {
    window.dispatchEvent(new CustomEvent("model-switched"));
  } catch (e) {
  }
  return json;
}

// src/ui/selftest.jsx
function bundleFingerprint() {
  try {
    var els = document.querySelectorAll('link[href*="assets/index-"], script[src*="assets/index-"]');
    for (var i = 0; i < els.length; i++) {
      var h = els[i].getAttribute("href") || els[i].getAttribute("src") || "";
      var m = /index-[A-Za-z0-9_-]+\.js/.exec(h);
      if (m) return m[0];
    }
  } catch (e) {
  }
  return "\u672A\u77E5";
}
function cssVarMarker() {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue("--mo2-marker").trim();
  } catch (e) {
    return "";
  }
}
function manifestFetched() {
  try {
    var list = performance.getEntriesByType("resource") || [];
    for (var i = 0; i < list.length; i++) {
      if (/manifest\.json/.test(list[i].name)) return list[i].name;
    }
  } catch (e) {
  }
  return "";
}
function standalone() {
  try {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  } catch (e) {
  }
  return !!(window.navigator && window.navigator.standalone === true);
}
function supports(prop, val) {
  try {
    return !!(window.CSS && CSS.supports && CSS.supports(prop, val));
  } catch (e) {
    return false;
  }
}
function collect(safeProbeEl, extra) {
  var p = probe();
  var d = decide();
  var vp = snapshot();
  var items = [];
  function push(name, ok, detail, warn) {
    items.push({ name, status: ok ? "pass" : warn ? "warn" : "fail", detail: detail == null ? "" : String(detail) });
  }
  push(
    "\u2460 \u73AF\u5883\u6307\u7EB9",
    true,
    "bundle " + bundleFingerprint() + " \xB7 v" + VERSION
  );
  items[0].status = "pass";
  push("\u2461 \u89C6\u53E3 \u2264768px", window.innerWidth <= 768, window.innerWidth + "x" + window.innerHeight, true);
  push("\u2462 CSS anchor-name (iOS26 \u57FA\u7EBF)", supports("anchor-name", "--mo2-a"), supports("anchor-name", "--mo2-a") ? "supported" : "\u4E0D\u652F\u6301\u2192v0.2 \u62D2\u8F7D");
  push("\u2463 CSS dvh", supports("height", "100dvh"), supports("height", "100dvh") ? "supported" : "\u4E0D\u652F\u6301");
  push(
    "\u2464 host.React / antd / api",
    p["host.React"] && p["host.antd"] && p["host.getApiUrl"] && p["host.getApiToken"],
    Object.keys(p).filter(function(k) {
      return k.indexOf("host.") === 0;
    }).map(function(k) {
      return k.replace("host.", "") + "=" + (p[k] ? "y" : "n");
    }).join(" ")
  );
  var via = ((window.__mo2 || {}).selftest || {}).via || "(\u672A\u6E32\u67D3)";
  push("\u2465 slot.fill(overlay.global) \u751F\u6548", via === "slot", "\u672C\u9762\u677F\u6E32\u67D3\u65B9\u5F0F=" + via);
  push("\u2466 menu.snapshot \u53EF\u679A\u4E3E", !!p.menu, p.menu ? "menu \u5728\u4F4D" : "menu \u7F3A\u5931");
  push("\u2467 route API \u5728\u4F4D", !!p.route, "route.wrap=" + (p["route.wrap"] ? "y" : "n") + "\uFF08\u672C\u8F6E\u51B3\u7B56\uFF1A\u53EA\u53E0\u52A0\u4E0D\u5305\u88C5\uFF09");
  push("\u2468 chat API \u5728\u4F4D", !!p.chat, "sender=" + (p["chat.sender"] ? "y" : "n") + " actions=" + (p["chat.actions"] ? "y" : "n") + " card=" + (p["chat.card"] ? "y" : "n"));
  push("\u2469 \u81EA\u6CE8\u5165\u6837\u5F0F\u751F\u6548", cssVarMarker() === "mo2-ok", cssVarMarker() || "(\u7A7A)");
  var mf = manifestFetched();
  push("\u246A manifest \u5DF2\u88AB\u6293\u53D6", !!mf, mf ? mf.split("/").slice(-2).join("/") : "(\u672A\u6293\u53D6) link=" + (manifestHref() ? "y" : "n"), !manifestHref());
  push("\u246B \u4E0E v1 \u4E92\u65A5\uFF08v1 \u5E94\u505C\uFF09", !legacyActive(), legacyActive() ? "v1 \u4ECD\u5728\u8FD0\u884C \u2192 v2 \u8BA9\u4F4D" : "v1 \u672A\u8FD0\u884C", legacyActive());
  push(
    "\u246C \u952E\u76D8 delta\uFF08\u70B9\u4E0B\u65B9\u8F93\u5165\u6846\uFF09",
    vp.kbdMax > 50,
    "max kbd=" + vp.kbdMax + "px \xB7 vh=" + vp.vh + " \xB7 inner=" + vp.inner,
    vp.kbdMax === 0
  );
  var safe = [0, 0, 0, 0];
  try {
    if (safeProbeEl) {
      var cs = getComputedStyle(safeProbeEl);
      safe = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
    }
  } catch (e) {
  }
  var safeNonZero = safe.some(function(v) {
    return parseFloat(v || "0") > 0;
  });
  push("\u246D safe-area \u975E\u96F6\uFF08\u771F\u673A\u5E94\u6709\u503C\uFF09", safeNonZero, "top/r/b/l=" + safe.join("/"), !safeNonZero);
  var fs = "";
  var ok16 = false;
  try {
    var el = document.querySelector(".mo2-probe-input");
    if (el) {
      fs = getComputedStyle(el).fontSize;
      ok16 = parseFloat(fs) >= 16;
    }
  } catch (e) {
  }
  push("\u246E \u8F93\u5165\u6846 \u226516px\uFF08\u9632 iOS \u805A\u7126\u653E\u5927\uFF09", ok16, fs || "(\u672A\u89C1\u6D4B\u8BD5\u8F93\u5165\u6846)");
  push("\u246F standalone\uFF08\u52A0\u4E3B\u5C4F\u5E55\u540E\u4E3A\u771F\uFF09", standalone(), standalone() ? "standalone" : "browser\uFF08Safari \u6807\u7B7E\u9875\u5185\uFF09", !standalone());
  var topBtn = null;
  try {
    topBtn = document.querySelector('[aria-label="mo2-\u529F\u80FD\u9762\u677F"]');
  } catch (e) {
  }
  var rect = topBtn ? topBtn.getBoundingClientRect() : null;
  push(
    "\u2470 \u9876\u680F\u5165\u53E3\u5DF2\u6E32\u67D3\u4E14\u53EF\u89C1",
    !!(rect && rect.width > 0 && rect.height > 0),
    rect ? Math.round(rect.x) + "," + Math.round(rect.y) + " " + Math.round(rect.width) + "x" + Math.round(rect.height) : "\u672A\u627E\u5230"
  );
  var ch = (window.__mo2 || {}).chrome || [];
  push(
    "\u2471 \u5B98\u65B9\u63D2\u69FD\u6CE8\u518C\u5168\u90E8\u6210\u529F",
    ch.length > 0 && ch.every(function(r) {
      return r.ok;
    }),
    ch.length ? ch.map(function(r) {
      return r.name + "=" + (r.ok ? "y" : "n");
    }).join(" ") : "(\u672A\u6CE8\u518C)"
  );
  var ex = extra || {};
  push("\u2472 \u6A21\u578B API \u53EF\u8FBE", !!ex.model, ex.model ? ex.provider_id + " / " + ex.model : ex.err || "\u8BFB\u53D6\u4E2D\u2026");
  var av = {};
  try {
    av = availability();
  } catch (e) {
  }
  var avKeys = Object.keys(av);
  var avOk = avKeys.filter(function(k) {
    return av[k];
  });
  push(
    "\u2473 \u5B98\u65B9\u5408\u6210\u70B9\u51FB\u5165\u53E3\u5728\u4F4D",
    avKeys.length > 0 && avOk.length === avKeys.length,
    avOk.length + "/" + avKeys.length + (avOk.length === avKeys.length ? "" : " \u7F3A:" + avKeys.filter(function(k) {
      return !av[k];
    }).join(",")),
    avOk.length > 0 && avOk.length < avKeys.length
  );
  var meta = window.__mo2 || {};
  var dr = meta.drift || {};
  push(
    "\u3251 bundle \u6307\u7EB9\u5DF2\u77E5\uFF08\u6F02\u79FB\u76D1\u6D4B\uFF09",
    !!dr.known,
    (dr.bundle || "?") + (dr.known ? "" : " \u2190 \u672A\u77E5\u6307\u7EB9\uFF0C\u53BB\u8DD1 scripts/drift-check.py"),
    !dr.known
  );
  var cp = meta.compat || {};
  push(
    "\u3252 \u5E73\u53F0\u7248\u672C\u5728\u5B9E\u6D4B\u533A\u95F4",
    cp.ok === true,
    (cp.version || "\u8BFB\u53D6\u4E2D\u2026") + " \u2208 [" + (cp.min || "?") + ", " + (cp.max || "?") + "]" + (cp.ok === false ? " \u2190 " + (cp.err || "") : ""),
    cp.ok === void 0 || cp.ok === false
  );
  var dbtn = document.querySelector('[aria-label="mo2-\u4F1A\u8BDD\u680F"]');
  var drect = dbtn ? dbtn.getBoundingClientRect() : null;
  push(
    "\u3253 \u4F1A\u8BDD\u680F\u5165\u53E3\u5728\u4F4D\uFF08\u9876\u680F\uFF09",
    !!(drect && drect.width > 0 && drect.height > 0),
    drect ? Math.round(drect.x) + "," + Math.round(drect.y) + " " + Math.round(drect.width) + "x" + Math.round(drect.height) : "\u672A\u627E\u5230"
  );
  var tabsEL = document.querySelector(".mo2-tabs");
  var trect = tabsEL ? tabsEL.getBoundingClientRect() : null;
  var onChat = /^\/($|chat(\/|$))/.test(location.pathname);
  var tabsIn = onChat ? !tabsEL : !!(trect && trect.bottom <= window.innerHeight + 1 && trect.height > 0);
  push(
    "\u3254 \u5E95\u90E8 Tab \u680F\uFF08\u975E\u804A\u5929\u9875\u5728\u5C4F\u5185 / \u804A\u5929\u9875\u8BA9\u4F4D\uFF09",
    tabsIn,
    onChat ? tabsEL ? "\u804A\u5929\u9875\u7ADF\u7136\u51FA\u73B0\u4E86\u5E95\u680F\uFF08\u4F1A\u538B\u8F93\u5165\u6846\uFF09" : "\u804A\u5929\u9875\u5DF2\u8BA9\u4F4D \u2713" : trect ? tabsEL.children.length + " \u9879 \xB7 y=" + Math.round(trect.y) + " h=" + Math.round(trect.height) : "\u672A\u627E\u5230"
  );
  var it = meta.integration || {};
  push(
    "\u3255 \u5B98\u65B9\u83DC\u5355\u5165\u53E3\u5DF2\u6CE8\u518C\uFF08C1-c\uFF09",
    it.menu === "ok" && (it.entries || []).length >= 1,
    "route=" + (it.route || "?") + " \xB7 menu=" + (it.menu || "?") + " \xB7 " + (it.entries || []).length + " \u6761",
    it.route !== "ok" || it.menu !== "ok"
  );
  var rep = {};
  try {
    rep = signalsReport();
  } catch (e) {
  }
  var keys = Object.keys(rep);
  var bad = keys.filter(function(k) {
    return !rep[k].found;
  });
  var weak = keys.filter(function(k) {
    return rep[k].found && rep[k].weak;
  });
  push(
    "\u3256 \u5408\u6210\u70B9\u51FB\u4FE1\u53F7\u672A\u6F02\u79FB\uFF08C3-g\uFF09",
    keys.length > 0 && bad.length === 0 && weak.length === 0,
    bad.length ? "\u7F3A:" + bad.join(",") : weak.length ? "\u5403\u515C\u5E95:" + weak.map(function(k) {
      return k + "#" + rep[k].depth;
    }).join(",") : keys.length + " \u6761\u5168\u8D70\u9996\u9009\u4FE1\u53F7",
    bad.length > 0 || weak.length > 0
  );
  return items;
}
function SelfTest(props) {
  var R = window.QwenPaw.host.React;
  var useState = R.useState;
  var useEffect = R.useEffect;
  var useRef = R.useRef;
  var ref = useRef(null);
  var st = useState(0);
  var tick = st[0];
  var setTick = st[1];
  var _m = useState(null);
  var minfo = _m[0];
  var setMInfo = _m[1];
  var items = collect(ref.current, minfo);
  useEffect(function() {
    var stop2 = false;
    getActive().then(function(j) {
      if (stop2) return;
      var a = j && j.active_llm || {};
      setMInfo({ model: a.model || "", provider_id: a.provider_id || "" });
    }).catch(function(e) {
      if (!stop2) setMInfo({ err: String(e && e.message || e) });
    });
    return function() {
      stop2 = true;
    };
  }, [tick]);
  useEffect(function() {
    var t = setTimeout(function() {
      setTick(tick + 1);
    }, 300);
    return function() {
      clearTimeout(t);
    };
  }, []);
  var passed = items.filter(function(i) {
    return i.status === "pass";
  }).length;
  var warned = items.filter(function(i) {
    return i.status === "warn";
  }).length;
  var Antd = null;
  try {
    Antd = window.QwenPaw.host.antd;
  } catch (e) {
  }
  var Tag = Antd && Antd.Tag;
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-selftest", "data-tick": tick }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("h3", null, "\u6D4F\u89C8\u5668\u63D2\u4EF6 v", VERSION, " \u81EA\u68C0 \xB7 ", passed, "/", items.length, " PASS", warned ? " \xB7 " + warned + " WARN" : ""), items.map(function(it, i) {
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-row", key: i }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tag mo2-" + it.status }, it.status.toUpperCase()), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-name" }, it.name), Tag ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Tag, { color: it.status === "pass" ? "success" : it.status === "warn" ? "warning" : "error" }, it.detail) : /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-detail" }, it.detail));
  }), /* @__PURE__ */ window.QwenPaw.host.React.createElement("input", { className: "mo2-probe-input", placeholder: "\u70B9\u6211\uFF1A\u6D4B\u952E\u76D8 delta \u4E0E 16px \u5B57\u53F7" }), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-safe-probe", ref }), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-actions" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("button", { onClick: () => setTick(tick + 1) }, "\u91CD\u65B0\u68C0\u6D4B"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("button", { onClick: () => window.location.reload() }, "\u5237\u65B0\u9875\u9762")));
}

// src/mobile-model-popup.js
var MARK = "data-mo2-model-popup";
var timer = 0;
var listeners = [];
var saved = /* @__PURE__ */ new WeakMap();
function mobile() {
  try {
    return window.matchMedia("(max-width: 768px)").matches;
  } catch (e) {
    return false;
  }
}
function keyboardOpen() {
  var vv = window.visualViewport;
  return !!(vv && window.innerHeight - vv.height > 80);
}
function candidates() {
  return Array.prototype.filter.call(document.querySelectorAll(".ant-select-dropdown"), function(el) {
    if (el.getAttribute(MARK) === "1") return true;
    var text = (el.textContent || "").toLowerCase();
    return !!el.querySelector(".ant-select-item-option") && (text.indexOf("api") >= 0 || text.indexOf("claude") >= 0 || text.indexOf("gpt") >= 0 || text.indexOf("gemini") >= 0 || text.indexOf("qwen") >= 0);
  });
}
function adjust() {
  if (!mobile() || !keyboardOpen()) return restore();
  var vv = window.visualViewport;
  var bottomLimit = Math.max(80, vv.height - 12);
  candidates().forEach(function(el) {
    if (!saved.has(el)) saved.set(el, { position: el.style.position, top: el.style.top, left: el.style.left, width: el.style.width, maxHeight: el.style.maxHeight, overflowY: el.style.overflowY, transform: el.style.transform, zIndex: el.style.zIndex });
    el.setAttribute(MARK, "1");
    var r = el.getBoundingClientRect();
    var maxH = Math.max(120, bottomLimit - r.top);
    if (r.bottom > bottomLimit || r.height > maxH) {
      el.style.maxHeight = Math.floor(maxH) + "px";
      el.style.overflowY = "auto";
      var shift = Math.min(0, bottomLimit - r.bottom);
      el.style.transform = "translateY(" + Math.floor(shift) + "px)";
    }
  });
}
function restore() {
  document.querySelectorAll(".ant-select-dropdown[" + MARK + '="1"]').forEach(function(el) {
    var s = saved.get(el);
    if (s) Object.keys(s).forEach(function(k) {
      el.style[k] = s[k];
    });
    el.removeAttribute(MARK);
    saved.delete(el);
  });
}
function startModelPopupGuard() {
  if (timer) return function() {
  };
  var run = function() {
    window.requestAnimationFrame(adjust);
  };
  var vv = window.visualViewport;
  ["resize", "scroll"].forEach(function(ev) {
    if (vv) {
      vv.addEventListener(ev, run);
      listeners.push([vv, ev, run]);
    }
  });
  document.addEventListener("focusin", run, true);
  document.addEventListener("click", run, true);
  listeners.push([document, "focusin", run, true], [document, "click", run, true]);
  timer = window.setInterval(adjust, 300);
  adjust();
  return function() {
    if (timer) window.clearInterval(timer);
    timer = 0;
    listeners.forEach(function(x) {
      x[0].removeEventListener(x[1], x[2], x[3]);
    });
    listeners = [];
    restore();
  };
}

// src/state.js
var _s = { sheet: false, modelView: false, drawer: false, pagesView: false };
var _subs = /* @__PURE__ */ new Set();
function get() {
  return _s;
}
function set(patch) {
  _s = Object.assign({}, _s, patch);
  _subs.forEach(function(f) {
    try {
      f();
    } catch (e) {
    }
  });
}
function subscribe(fn) {
  _subs.add(fn);
  return function() {
    _subs.delete(fn);
  };
}
function toggleSheet(v) {
  set({ sheet: typeof v === "boolean" ? v : !_s.sheet });
}
function toggleDrawer(v) {
  set({ drawer: typeof v === "boolean" ? v : !_s.drawer });
}
function useAppState() {
  var R = window.QwenPaw.host.React;
  return R.useSyncExternalStore(subscribe, get, get);
}

// src/api/nav.js
function currentPath() {
  try {
    return window.location.pathname || "/";
  } catch (e) {
    return "/";
  }
}
function isChatRoute2() {
  var p = currentPath();
  return p === "/" || /^\/chat(\/|$)/.test(p);
}
function navigate(path) {
  var want = String(path || "/").split("?")[0];
  try {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  } catch (e) {
    try {
      window.location.assign(path);
    } catch (e2) {
    }
    return "assign";
  }
  setTimeout(function() {
    if (currentPath() !== want) {
      try {
        window.location.assign(path);
      } catch (e) {
      }
    }
  }, 400);
  return "pushState";
}

// src/ui/TopBar.jsx
function TopBar() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var st = useAppState();
  function onNewChat() {
    var r = clickOfficial("newChat");
    if (!r.ok) navigate("/");
  }
  var Plus = I.PlusOutlined;
  var Grid = I.AppstoreOutlined;
  var List = I.UnorderedListOutlined;
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-topbar" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "text",
      shape: "circle",
      "aria-label": "mo2-\u4F1A\u8BDD\u680F",
      className: st.drawer ? "mo2-topbar-on" : "",
      icon: List ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(List, null) : "\u2630",
      onClick: function() {
        toggleDrawer();
      }
    }
  ), A.Tooltip ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Tooltip, { title: "\u65B0\u5EFA\u5BF9\u8BDD" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "text",
      shape: "circle",
      "aria-label": "mo2-\u65B0\u5EFA\u5BF9\u8BDD",
      icon: Plus ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Plus, null) : "+",
      onClick: onNewChat
    }
  )) : /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Button, { size: "small", type: "text", "aria-label": "mo2-\u65B0\u5EFA\u5BF9\u8BDD", onClick: onNewChat }, "\u65B0\u5EFA"), /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "text",
      shape: "circle",
      "aria-label": "mo2-\u529F\u80FD\u9762\u677F",
      className: st.sheet ? "mo2-topbar-on" : "",
      icon: Grid ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Grid, null) : "\u2317",
      onClick: function() {
        toggleSheet();
      }
    }
  ));
}

// src/api/pages.js
var PAGES = [
  { key: "sessions", label: "\u4F1A\u8BDD", path: "/sessions", icon: "MessageOutlined" },
  { key: "token-usage", label: "Token \u6D88\u8017", path: "/token-usage", icon: "BarChartOutlined" },
  { key: "files", label: "\u6587\u4EF6", path: "/files", icon: "FolderOpenOutlined" },
  { key: "skills", label: "\u6280\u80FD", path: "/skills", icon: "ThunderboltOutlined" },
  { key: "mcp", label: "MCP", path: "/mcp", icon: "ApiOutlined" },
  { key: "checkpoints", label: "\u68C0\u67E5\u70B9", path: "/checkpoints", icon: "HistoryOutlined" },
  { key: "cron-jobs", label: "\u5B9A\u65F6\u4EFB\u52A1", path: "/cron-jobs", icon: "ClockCircleOutlined" },
  { key: "agents", label: "\u667A\u80FD\u4F53", path: "/agents", icon: "TeamOutlined" },
  { key: "security", label: "\u5B89\u5168", path: "/security", icon: "SafetyCertificateOutlined" },
  { key: "backups", label: "\u5907\u4EFD", path: "/backups", icon: "CloudDownloadOutlined" },
  { key: "environments", label: "\u73AF\u5883\u53D8\u91CF", path: "/environments", icon: "SettingOutlined" },
  { key: "debug", label: "\u8C03\u8BD5", path: "/debug", icon: "BugOutlined" }
];

// src/ui/FeatureSheet.jsx
function FeatureSheet() {
  var R = window.QwenPaw.host.React;
  var useState = R.useState;
  var useEffect = R.useEffect;
  var A = antd();
  var I = icons();
  var st = useAppState();
  var _a = useState(null), active = _a[0], setActiveInfo = _a[1];
  var _o = useState(null), opts = _o[0], setOpts = _o[1];
  var _b = useState(false), busy = _b[0], setBusy = _b[1];
  var _v = useState({}), avail = _v[0], setAvail = _v[1];
  useEffect(
    function() {
      if (st.sheet) setAvail(availability());
    },
    [st.sheet]
  );
  useEffect(
    function() {
      var stop2 = false;
      getActive().then(function(j) {
        if (!stop2) setActiveInfo(j && j.active_llm || null);
      }).catch(function(e) {
        if (!stop2) setActiveInfo({ error: String(e && e.message || e) });
      });
      return function() {
        stop2 = true;
      };
    },
    [st.sheet, st.modelView]
  );
  function openModelView() {
    set({ modelView: true });
    if (opts) return;
    listProviders().then(function(ps) {
      setOpts(buildOptions(ps));
    }).catch(function(e) {
      toast("\u6A21\u578B\u5217\u8868\u52A0\u8F7D\u5931\u8D25\uFF1A" + (e && e.message || e), "error");
      setOpts([]);
    });
  }
  function onPick(val) {
    var parts2 = String(val).split("::");
    if (parts2.length < 2) return;
    setBusy(true);
    setActive(parts2[0], parts2[1]).then(function() {
      setActiveInfo({ provider_id: parts2[0], model: parts2[1] });
      toast("\u5DF2\u5207\u6362\u5230 " + parts2[1]);
    }).catch(function(e) {
      toast("\u5207\u6362\u5931\u8D25\uFF1A" + (e && e.message || e), "error");
    }).finally(function() {
      setBusy(false);
    });
  }
  function close() {
    toggleSheet(false);
    set({ modelView: false, pagesView: false });
  }
  function composerEntry(key) {
    var r = clickOfficial(key);
    if (r.ok) {
      close();
      return;
    }
    if (!isChatRoute2()) {
      navigate("/");
      waitOfficial(key, 5e3).then(function(r2) {
        if (r2.ok) close();
        else toast("\u5DF2\u56DE\u804A\u5929\u9875\uFF0C\u4F46\u5B98\u65B9\u5165\u53E3\u672A\u6302\u8F7D\uFF08" + r2.via + "\uFF09", "error");
      });
      return;
    }
    toast("\u6CA1\u627E\u5230\u5B98\u65B9\u5165\u53E3\uFF1A" + key, "error");
  }
  var onChat = isChatRoute2();
  function composerItem(sigKey, label, Icon) {
    var miss = avail[sigKey] === false;
    return {
      key: sigKey,
      label,
      icon: Icon,
      disabled: miss && onChat,
      // 聊天页真缺失 → 禁用
      hint: miss && !onChat,
      // 非聊天页未挂载 → 可点，先回聊天页
      run: function() {
        composerEntry(sigKey);
      }
    };
  }
  var items = [];
  items.push({
    key: "newChat",
    label: "\u65B0\u5EFA\u4F1A\u8BDD",
    icon: I.MessageOutlined,
    disabled: false,
    // 有 navigate('/') 兜底，永不缺失
    run: function() {
      var r = clickOfficial("newChat");
      if (!r.ok) navigate("/");
      close();
    }
  });
  items.push({
    key: "model",
    label: "\u6A21\u578B\u9009\u62E9",
    sub: active && active.model ? active.provider_id + " / " + active.model : "\u8BFB\u53D6\u4E2D\u2026",
    icon: I.RobotOutlined,
    run: openModelView
  });
  items.push({
    key: "modelManage",
    label: "\u6A21\u578B\u7BA1\u7406",
    sub: "/models",
    icon: I.SettingOutlined,
    run: function() {
      close();
      navigate("/models");
    }
  });
  items.push({
    key: "toolManage",
    label: "\u5DE5\u5177\u7BA1\u7406",
    sub: "/tools",
    icon: I.ToolOutlined,
    run: function() {
      close();
      navigate("/tools");
    }
  });
  items.push(composerItem("workspace", "\u6253\u5F00\u6587\u4EF6\u5DE5\u4F5C\u533A", I.FolderOpenOutlined));
  items.push(composerItem("loopMode", "Loop \u6A21\u5F0F", I.SyncOutlined));
  items.push(composerItem("approval", "\u5DE5\u5177\u5BA1\u6279\u6A21\u5F0F", I.SafetyCertificateOutlined));
  items.push({
    key: "sessions",
    label: "\u4F1A\u8BDD\u5217\u8868",
    sub: "\u81EA\u7ED8\u4FA7\u680F \xB7 \u5DE6\u53F3\u6ED1\u624B\u52BF\u4E5F\u80FD\u5F00",
    icon: I.UnorderedListOutlined,
    run: function() {
      close();
      toggleDrawer(true);
    }
  });
  items.push({
    key: "toolsPage",
    label: "\u79FB\u52A8\u7AEF\u5DE5\u5177",
    sub: "/mo2",
    icon: I.AppstoreOutlined,
    run: function() {
      close();
      navigate("/mo2");
    }
  });
  items.push({
    key: "more",
    label: "\u66F4\u591A\u5B98\u65B9\u9875\u9762",
    sub: PAGES.length + " \u4E2A\u5165\u53E3",
    icon: I.MoreOutlined,
    run: function() {
      set({ pagesView: true });
    }
  });
  if (!isChatRoute2()) {
    items.push({
      key: "back",
      label: "\u8FD4\u56DE\u804A\u5929",
      icon: I.HomeOutlined,
      run: function() {
        close();
        navigate("/");
      }
    });
  }
  var Back = I.ArrowLeftOutlined;
  function optionsWithActive() {
    var list = opts || [];
    if (active && active.provider_id && active.model) {
      var key = active.provider_id + "::" + active.model;
      var found = false;
      list.forEach(function(g) {
        (g.options || []).forEach(function(o) {
          if (o.value === key) found = true;
        });
      });
      if (!found) {
        list = [{ label: "\u5F53\u524D\u6A21\u578B", options: [{ value: key, label: active.model }] }].concat(list);
      }
    }
    return list;
  }
  var pagesBody = /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-sheet-body" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-sheet-head" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "text",
      "aria-label": "mo2-\u8FD4\u56DE\u6761\u76EE",
      icon: Back ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Back, null) : "\u2190",
      onClick: function() {
        set({ pagesView: false });
      }
    }
  ), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-sheet-title" }, "\u66F4\u591A\u5B98\u65B9\u9875\u9762")), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-pages-grid" }, PAGES.map(function(p) {
    var Ic = I[p.icon];
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
      "button",
      {
        key: p.key,
        type: "button",
        className: "mo2-pages-item",
        "aria-label": "mo2-page-" + p.key,
        onClick: function() {
          close();
          navigate(p.path);
        }
      },
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-ico" }, Ic ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Ic, null) : "\xB7"),
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-label" }, p.label)
    );
  })));
  var body = st.pagesView ? pagesBody : st.modelView ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-sheet-body" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-sheet-head" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "text",
      "aria-label": "mo2-\u8FD4\u56DE\u6761\u76EE",
      icon: Back ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Back, null) : "\u2190",
      onClick: function() {
        set({ modelView: false });
      }
    }
  ), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-sheet-title" }, "\u6A21\u578B\u9009\u62E9")), /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Select,
    {
      className: "mo2-model-select",
      showSearch: true,
      loading: busy,
      disabled: busy,
      placeholder: opts ? "\u9009\u62E9\u6A21\u578B" : "\u52A0\u8F7D\u6A21\u578B\u5217\u8868\u2026",
      value: active && active.model && active.provider_id ? active.provider_id + "::" + active.model : void 0,
      options: optionsWithActive(),
      onChange: onPick,
      optionFilterProp: "label",
      style: { width: "100%" }
    }
  ), active && active.error ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-err" }, "\u5F53\u524D\u6A21\u578B\u8BFB\u53D6\u5931\u8D25\uFF1A", active.error) : null) : /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.List,
    {
      className: "mo2-sheet-list",
      split: false,
      dataSource: items,
      renderItem: function(it) {
        var Ic = it.icon;
        var off = !!it.disabled;
        return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
          A.List.Item,
          {
            className: "mo2-row-item" + (off ? " mo2-off" : ""),
            onClick: function() {
              if (!off) it.run();
            }
          },
          /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-row-ico" }, Ic ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Ic, null) : "\xB7"),
          /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-row-main" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-row-label" }, it.label), it.sub ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-row-sub" }, it.sub) : null),
          off ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Tag, { color: "orange" }, "\u5165\u53E3\u7F3A\u5931") : it.hint ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Tag, { color: "blue" }, "\u9700\u56DE\u804A\u5929\u9875") : null
        );
      }
    }
  );
  if (!A || !A.Drawer) return null;
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Drawer,
    {
      title: "\u529F\u80FD\u9762\u677F",
      placement: "bottom",
      open: !!st.sheet,
      onClose: close,
      height: "78%",
      className: "mo2-drawer",
      rootClassName: "mo2-drawer-root",
      destroyOnClose: true,
      styles: { body: { padding: "4px 14px 18px" } },
      getContainer: false
    },
    body
  );
}

// src/ui/BottomTabs.jsx
var TABS = [
  { key: "chat", label: "\u804A\u5929", path: "/chat", icon: "MessageOutlined" },
  { key: "models", label: "\u6A21\u578B", path: "/models", icon: "RobotOutlined" },
  { key: "settings", label: "\u8BBE\u7F6E", path: "/settings", icon: "SettingOutlined" }
];
function isHere(pathname, tab) {
  if (tab.key === "chat") return pathname === "/" || /^\/chat(\/|$)/.test(pathname);
  return pathname === tab.path || pathname.indexOf(tab.path + "/") === 0;
}
function BottomTabs() {
  var A = antd();
  var I = icons();
  var here = currentPath();
  if (isChatRoute()) return null;
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement("nav", { className: "mo2-tabs", "aria-label": "mo2-\u5E95\u90E8\u5BFC\u822A" }, TABS.map(function(t) {
    var Ic = I[t.icon];
    var on = isHere(here, t);
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
      "button",
      {
        key: t.key,
        type: "button",
        className: "mo2-tab" + (on ? " mo2-tab-on" : ""),
        "aria-label": "mo2-tab-" + t.key,
        "aria-current": on ? "page" : void 0,
        onClick: function() {
          navigate(t.path);
        }
      },
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tab-ico" }, Ic ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Ic, null) : "\xB7"),
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tab-label" }, t.label)
    );
  }));
}

// src/api/chats.js
function pickName(c) {
  var n = c && (c.name || c.title || c.summary);
  if (typeof n === "string" && n.trim()) return n.trim();
  return "\u672A\u547D\u540D\u4F1A\u8BDD";
}
function norm(c) {
  if (!c || typeof c !== "object") return null;
  var id = c.id || c.chat_id || c.session_id || "";
  if (!id) return null;
  return {
    id: String(id),
    name: pickName(c),
    updated: c.updated_at || c.created_at || "",
    pinned: !!c.pinned,
    archived: !!c.archived_at,
    source: c.source || ""
  };
}
async function listChats() {
  var r = await api("/chats");
  if (!r.ok) throw new Error("GET /chats \u2192 " + r.status);
  var j = await r.json();
  var arr = Array.isArray(j) ? j : j && (j.chats || j.items || j.sessions) || [];
  return arr.map(norm).filter(function(c) {
    return !!c && !c.archived;
  });
}
function ts(c) {
  var t = Date.parse(c.updated);
  return isNaN(t) ? 0 : t;
}
function sortChats(list) {
  return (list || []).slice().sort(function(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return ts(b) - ts(a);
  });
}
function groupChats(list) {
  var now = Date.now();
  var week = 7 * 24 * 3600 * 1e3;
  var g = { pinned: [], recent: [], older: [] };
  sortChats(list).forEach(function(c) {
    if (c.pinned) g.pinned.push(c);
    else if (ts(c) && now - ts(c) < week) g.recent.push(c);
    else g.older.push(c);
  });
  var out = [];
  if (g.pinned.length) out.push({ title: "\u7F6E\u9876", items: g.pinned });
  if (g.recent.length) out.push({ title: "\u6700\u8FD1 7 \u5929", items: g.recent });
  if (g.older.length) out.push({ title: "\u66F4\u65E9", items: g.older });
  return out;
}
function relTime(iso) {
  var t = Date.parse(iso);
  if (isNaN(t)) return "";
  var d = Date.now() - t;
  if (d < 6e4) return "\u521A\u521A";
  if (d < 36e5) return Math.floor(d / 6e4) + " \u5206\u949F\u524D";
  if (d < 864e5) return Math.floor(d / 36e5) + " \u5C0F\u65F6\u524D";
  if (d < 7 * 864e5) return Math.floor(d / 864e5) + " \u5929\u524D";
  var dt = new Date(t);
  return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2);
}

// src/ui/SessionDrawer.jsx
function SessionDrawer() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var st = useAppState();
  var _s2 = R.useState({ loading: false, err: "", groups: [], n: 0 }), snap = _s2[0], setSnap = _s2[1];
  function load() {
    setSnap(function(p) {
      return Object.assign({}, p, { loading: true, err: "" });
    });
    listChats().then(function(list) {
      setSnap({ loading: false, err: "", groups: groupChats(list), n: list.length });
    }).catch(function(e) {
      setSnap({ loading: false, err: String(e && e.message || e), groups: [], n: 0 });
    });
  }
  R.useEffect(
    function() {
      if (st.drawer) load();
    },
    [st.drawer]
  );
  function close() {
    set({ drawer: false });
  }
  function openChat(c) {
    close();
    navigate("/chat/" + c.id);
  }
  var cur = currentPath();
  var curId = cur.replace(/^\/chat\//, "");
  function row(c) {
    var Star = I.PushpinOutlined || I.StarOutlined;
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
      "div",
      {
        key: c.id,
        className: "mo2-session-item" + (c.id === curId ? " mo2-session-cur" : ""),
        "data-chat": c.id,
        role: "button",
        onClick: function() {
          openChat(c);
        }
      },
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-session-name" }, c.name),
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-session-side" }, c.pinned && Star ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Star, null) : null, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-session-time" }, relTime(c.updated)))
    );
  }
  var body = /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-session-body" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-session-tools" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Button, { size: "small", type: "text", "aria-label": "mo2-\u4F1A\u8BDD\u5237\u65B0", onClick: load, loading: snap.loading }, "\u5237\u65B0"), /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Button,
    {
      size: "small",
      type: "link",
      "aria-label": "mo2-\u65B0\u5EFA\u4F1A\u8BDD",
      onClick: function() {
        close();
        navigate("/");
      }
    },
    "+ \u65B0\u5EFA\u4F1A\u8BDD"
  )), snap.err ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-err" }, "\u4F1A\u8BDD\u5217\u8868\u8BFB\u53D6\u5931\u8D25\uFF1A", snap.err) : null, !snap.err && !snap.loading && snap.n === 0 ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-empty" }, "\u8FD8\u6CA1\u6709\u4F1A\u8BDD") : null, (snap.groups || []).map(function(g) {
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { key: g.title, className: "mo2-session-group" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-session-gtitle" }, g.title), g.items.map(row));
  }));
  if (!A || !A.Drawer) return null;
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
    A.Drawer,
    {
      title: "\u4F1A\u8BDD",
      placement: "left",
      open: !!st.drawer,
      onClose: close,
      width: "78%",
      rootClassName: "mo2-session-root",
      className: "mo2-session-drawer",
      destroyOnClose: true,
      styles: { body: { padding: "6px 10px 18px" } },
      getContainer: false
    },
    body
  );
}

// src/env/drift.js
var KNOWN_BUNDLES = ["index-8OrhnpZF.js", "index-BpFaGbCq.js"];
var TESTED_MAX = "2.2.2.post1";
var TESTED_MIN = "2.2.0";
function fingerprint() {
  try {
    var els = document.querySelectorAll('link[href*="assets/index-"], script[src*="assets/index-"]');
    for (var i = 0; i < els.length; i++) {
      var h = els[i].getAttribute("href") || els[i].getAttribute("src") || "";
      var m = /index-[A-Za-z0-9_-]+\.js/.exec(h);
      if (m) return m[0];
    }
  } catch (e) {
  }
  return "\u672A\u77E5";
}
function bundleCheck() {
  var name = fingerprint();
  var known = KNOWN_BUNDLES.indexOf(name) >= 0;
  return {
    bundle: name,
    known,
    unknown: !known && name !== "\u672A\u77E5",
    hint: known ? "" : "\u5B98\u65B9 bundle \u6307\u7EB9\u672A\u77E5 \u2192 \u63D2\u69FD/\u4FE1\u53F7\u5047\u8BBE\u9700\u590D\u6838\uFF08\u8DD1 scripts/drift-check.py\uFF09"
  };
}
function parts(v) {
  var m = /^(\d+)\.(\d+)\.(\d+)(?:\.?(?:post|rc|a|b)(\d+))?/.exec(String(v || ""));
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 0, /post/.test(String(v)) ? 1 : 0];
}
function cmp(a, b) {
  var x = parts(a);
  var y = parts(b);
  if (!x || !y) return 0;
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  }
  return 0;
}
async function platformVersion() {
  try {
    var r = await fetch("/api/version");
    if (!r.ok) return null;
    var j = await r.json();
    return j && (j.version || j.qwenpaw_version || j.data && j.data.version) || null;
  } catch (e) {
    return null;
  }
}
async function compat() {
  var v = await platformVersion();
  if (!v) return { version: null, min: TESTED_MIN, max: TESTED_MAX, ok: false, err: "/api/version \u4E0D\u53EF\u8BFB" };
  var okMin = cmp(v, TESTED_MIN) >= 0;
  var okMax = cmp(v, TESTED_MAX) <= 0;
  return {
    version: v,
    min: TESTED_MIN,
    max: TESTED_MAX,
    ok: okMin && okMax,
    err: okMin && okMax ? "" : "\u5E73\u53F0\u7248\u672C\u8D85\u51FA\u5B9E\u6D4B\u533A\u95F4\uFF08\u5B9E\u6D4B " + TESTED_MIN + " ~ " + TESTED_MAX + "\uFF09"
  };
}

// src/ui/ToolsPage.jsx
function ToolsPage() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var _c = R.useState({ version: null, min: "", max: "", ok: null, err: "\u8BFB\u53D6\u4E2D\u2026" }), cp = _c[0], setCp = _c[1];
  var bp = bundleCheck();
  var agent = "";
  try {
    var h = host();
    agent = typeof h.getSelectedAgentId === "function" ? String(h.getSelectedAgentId() || "") : "";
  } catch (e) {
  }
  R.useEffect(function() {
    var stop2 = false;
    compat().then(function(r) {
      if (!stop2) setCp(r);
    });
    return function() {
      stop2 = true;
    };
  }, []);
  return /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-head" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-title" }, "\u79FB\u52A8\u7AEF\u5DE5\u5177"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-ver" }, "v", VERSION)), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-card" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-line" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-k" }, "\u5B98\u65B9 bundle"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-v" + (bp.known ? "" : " mo2-bad") }, bp.bundle, bp.known ? "" : "\uFF08\u672A\u77E5\u6307\u7EB9\uFF0C\u9700\u590D\u6838\uFF09")), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-line" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-k" }, "\u5E73\u53F0\u7248\u672C"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-v" + (cp.ok === false ? " mo2-bad" : "") }, cp.version || "\u2014", " \xB7 \u5B9E\u6D4B\u533A\u95F4 ", cp.min, "~", cp.max, cp.ok === false ? "\uFF08\u8D8A\u754C\uFF09" : "")), agent ? /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-line" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-k" }, "\u5F53\u524D\u667A\u80FD\u4F53"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-v" }, agent)) : null), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-sec" }, "\u5B98\u65B9\u9875\u9762"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-grid" }, PAGES.map(function(p) {
    var Ic = I[p.icon];
    return /* @__PURE__ */ window.QwenPaw.host.React.createElement(
      "button",
      {
        key: p.key,
        type: "button",
        className: "mo2-tools-item",
        "aria-label": "mo2-page-" + p.key,
        onClick: function() {
          navigate(p.path);
        }
      },
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-ico" }, Ic ? /* @__PURE__ */ window.QwenPaw.host.React.createElement(Ic, null) : "\xB7"),
      /* @__PURE__ */ window.QwenPaw.host.React.createElement("span", { className: "mo2-tools-label" }, p.label)
    );
  })), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-sec" }, "\u5FEB\u6377\u64CD\u4F5C"), /* @__PURE__ */ window.QwenPaw.host.React.createElement("div", { className: "mo2-tools-actions" }, /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Button, { size: "small", onClick: function() {
    set({ drawer: true });
  } }, "\u4F1A\u8BDD\u5217\u8868"), /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Button, { size: "small", onClick: function() {
    set({ sheet: true });
  } }, "\u529F\u80FD\u9762\u677F"), /* @__PURE__ */ window.QwenPaw.host.React.createElement(A.Button, { size: "small", onClick: function() {
    navigate("/chat");
  } }, "\u56DE\u804A\u5929")));
}

// src/env/gesture.js
var EDGE_RATIO = 0.24;
var THRESHOLD = 90;
var GHOST_MS = 400;
function startGestures(io) {
  var track = null;
  var ghostUntil = 0;
  var listeners2 = [];
  function scrollableX(el) {
    try {
      for (var n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (/auto|scroll/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 4) return true;
      }
    } catch (e) {
    }
    return false;
  }
  function fire(mode) {
    track = null;
    ghostUntil = Date.now() + GHOST_MS;
    try {
      if (mode === "open") io.open();
      else io.close();
    } catch (e) {
    }
  }
  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) {
      track = null;
      return;
    }
    var open = false;
    try {
      open = !!io.isOpen();
    } catch (e2) {
    }
    if (open) {
      track = { x: e.clientX || 0, y: e.clientY || 0, mode: "close" };
      return;
    }
    var x = e.clientX || 0;
    if (x > window.innerWidth * EDGE_RATIO || scrollableX(e.target)) {
      track = null;
      return;
    }
    track = { x, y: e.clientY || 0, mode: "open" };
  }
  function onMove(e) {
    if (!track) return;
    var dx = (e.clientX || 0) - track.x;
    var dy = Math.abs((e.clientY || 0) - track.y);
    if (Math.abs(dx) < dy * 1.2) return;
    if (track.mode === "open" && dx >= THRESHOLD) fire("open");
    else if (track.mode === "close" && dx <= -THRESHOLD) fire("close");
  }
  function onUp() {
    track = null;
  }
  function onClickCapture(e) {
    if (Date.now() < ghostUntil) {
      try {
        e.stopPropagation();
        e.preventDefault();
      } catch (e2) {
      }
    }
  }
  function add(t, ev, fn, opt) {
    t.addEventListener(ev, fn, opt);
    listeners2.push([t, ev, fn, opt]);
  }
  add(document, "pointerdown", onDown, { passive: true });
  add(document, "pointermove", onMove, { passive: true });
  add(document, "pointerup", onUp, { passive: true });
  add(document, "pointercancel", onUp, { passive: true });
  add(document, "touchcancel", onUp, { passive: true });
  add(document, "click", onClickCapture, true);
  return function stop2() {
    listeners2.forEach(function(x) {
      try {
        x[0].removeEventListener(x[1], x[2], x[3]);
      } catch (e) {
      }
    });
    listeners2 = [];
    track = null;
  };
}

// src/index.js
function fillChrome(name, el) {
  try {
    var d = slot().fill(PLUGIN_ID, name, function() {
      return el;
    });
    return { name, ok: true, disposable: d };
  } catch (e) {
    return { name, ok: false, error: String(e && e.message || e) };
  }
}
function registerChrome(info) {
  var list = [
    fillChrome("header.right", /* @__PURE__ */ window.QwenPaw.host.React.createElement(TopBar, null)),
    fillChrome("overlay.global", /* @__PURE__ */ window.QwenPaw.host.React.createElement(FeatureSheet, null)),
    fillChrome("overlay.global", /* @__PURE__ */ window.QwenPaw.host.React.createElement(BottomTabs, null)),
    fillChrome("overlay.global", /* @__PURE__ */ window.QwenPaw.host.React.createElement(SessionDrawer, null))
  ];
  info.chrome = list.map(function(r) {
    return { name: r.name, ok: r.ok, error: r.error || "" };
  });
  info.disposables = (info.disposables || []).concat(
    list.filter(function(r) {
      return r.ok && r.disposable;
    }).map(function(r) {
      return r.disposable;
    })
  );
  return list.every(function(r) {
    return r.ok;
  });
}
function registerIntegration(info) {
  var qw = window.QwenPaw || {};
  var out = { route: "skip", menu: "skip", entries: [] };
  if (qw.route && typeof qw.route.add === "function") {
    try {
      qw.route.add(PLUGIN_ID, { id: PLUGIN_ID + ".tools", path: "/mo2", component: ToolsPage });
      out.route = "ok";
    } catch (e) {
      out.route = "error: " + (e && e.message || e);
    }
  } else {
    out.route = "no route.add";
  }
  if (out.route !== "ok") {
    out.menu = "skipped\uFF08\u8DEF\u7531\u6CA1\u6CE8\u518C\uFF0C\u4E0D\u7ED9\u6B7B\u94FE\uFF09";
    return out;
  }
  if (!qw.menu || typeof qw.menu.add !== "function") {
    out.menu = "no menu.add";
    return out;
  }
  var items = [
    { id: PLUGIN_ID + ".tools.agent", label: "\u79FB\u52A8\u7AEF\u5DE5\u5177", location: "primary.agentScoped", route: PLUGIN_ID + ".tools", order: 90 },
    { id: PLUGIN_ID + ".tools.settings", label: "\u79FB\u52A8\u7AEF\u4F18\u5316", location: "primary.settings", route: PLUGIN_ID + ".tools", order: 90 },
    { id: PLUGIN_ID + ".tools.user", label: "\u79FB\u52A8\u7AEF\u5DE5\u5177", location: "userMenu", route: PLUGIN_ID + ".tools", order: 90 }
  ];
  try {
    qw.menu.add(PLUGIN_ID, items);
    out.menu = "ok";
    out.entries = items.map(function(i) {
      return i.id;
    });
  } catch (e) {
    out.menu = "error: " + (e && e.message || e);
  }
  return out;
}
function renderSelfTest() {
  var React = window.QwenPaw && window.QwenPaw.host && window.QwenPaw.host.React;
  if (!React) return { via: "none", error: "host.React \u4E0D\u53EF\u7528" };
  var el = /* @__PURE__ */ window.QwenPaw.host.React.createElement(SelfTest, null);
  try {
    var d = slot().fill(PLUGIN_ID, "overlay.global", function() {
      return el;
    });
    return { via: "slot", disposable: d };
  } catch (e) {
    try {
      var ReactDOM = window.QwenPaw.host.ReactDOM;
      var root2 = ReactDOM.createRoot(ensureMount());
      root2.render(el);
      return { via: "react-dom-fallback", error: e && e.message };
    } catch (e2) {
      return { via: "none", error: (e && e.message) + " / " + (e2 && e2.message) };
    }
  }
}
function cleanup(info) {
  try {
    (info.disposables || []).forEach(function(d) {
      if (typeof d === "function") d();
    });
  } catch (e) {
  }
  try {
    if (info.stopGestures) info.stopGestures();
  } catch (e) {
  }
  try {
    stop();
  } catch (e) {
  }
  try {
    var st = document.getElementById("qwenpaw-mo2-style");
    if (st) st.remove();
  } catch (e) {
  }
  try {
    var root2 = document.getElementById("qwenpaw-mo2-root");
    if (root2) root2.remove();
  } catch (e) {
  }
  try {
    document.querySelectorAll("head link[data-mo2], head meta[data-mo2]").forEach(function(el) {
      el.remove();
    });
  } catch (e) {
  }
  set({ sheet: false, modelView: false, drawer: false, pagesView: false });
  info.active = false;
  info.cleaned = true;
}
function reactivate(info) {
  injectStyle();
  start();
  var chromeGone = !document.querySelector('[aria-label="mo2-\u529F\u80FD\u9762\u677F"]');
  if (chromeGone) registerChrome(info);
  info.active = true;
  info.cleaned = false;
  info.reactivations = (info.reactivations || 0) + 1;
}
function watchRoute(info) {
  var last = window.location.pathname || "/";
  var check = function() {
    var now = window.location.pathname || "/";
    if (now === last) return;
    last = now;
    if (isBlockedRoute()) cleanup(info);
    else if (info.cleaned) reactivate(info);
  };
  window.addEventListener("popstate", check);
  window.addEventListener("hashchange", check);
  var timer2 = window.setInterval(check, 500);
  info.routeWatch = timer2;
}
async function boot() {
  var info = { version: VERSION, loaded: true, active: false, blocked: [], debug: debugRequested() };
  try {
    window.__mo2 = info;
  } catch (e) {
  }
  syncSelfTestFlag();
  var d = decide();
  if (!d.ok) {
    info.blocked = d.blocked;
    if (d.debug) console.info(LOG + " \u672A\u6FC0\u6D3B\uFF1A" + d.blocked.join("\uFF1B"));
    return;
  }
  info.drift = bundleCheck();
  if (info.drift.unknown) console.info(LOG + " \u6F02\u79FB\u544A\u8B66\uFF1A" + info.drift.hint);
  compat().then(function(c) {
    info.compat = c;
    if (!c.ok) console.info(LOG + " \u7248\u672C\u8D8A\u754C\uFF1A" + (c.err || ""));
  });
  info.popupGuard = true;
  info.popupDisposable = startModelPopupGuard();
  var legacy = await legacyPresent();
  info.legacy = legacy;
  if (legacy.found) {
    info.blocked = [
      "v1\u300C\u79FB\u52A8\u7AEF\u4F18\u5316\u300D\u5728\u8FD0\u884C\uFF08" + legacy.via + (legacy.version ? " v" + legacy.version : "") + "\uFF09\uFF0Cv2 \u8BA9\u4F4D"
    ];
    console.info(LOG + " \u672A\u6FC0\u6D3B\uFF1A" + info.blocked[0]);
    return;
  }
  injectStyle();
  info.manifestAdded = injectManifest();
  start();
  info.active = true;
  info.probe = probe();
  info.viewport = snapshot();
  info.chromeOk = registerChrome(info);
  info.integration = registerIntegration(info);
  info.stopGestures = startGestures({
    open: function() {
      set({ drawer: true });
    },
    close: function() {
      set({ drawer: false });
    },
    isOpen: function() {
      return !!get().drawer;
    }
  });
  watchRoute(info);
  if (selfTestRequested()) {
    var r = renderSelfTest();
    info.selftest = { via: r.via, error: r.error || "" };
    if (r.disposable) info.disposables = [r.disposable];
  }
  console.info(
    LOG + " v" + VERSION + " \u5DF2\u6FC0\u6D3B\uFF08\u79FB\u52A8\u7AEF \u2264768px \xB7 iOS26 \u57FA\u7EBF\u901A\u8FC7 \xB7 \u5168\u7AD9 chrome \u9664\u767B\u5F55\u9875\uFF09\xB7 \u81EA\u68C0\u5165\u53E3\uFF1AURL \u52A0 ?mo_selftest=1"
  );
}
boot().catch(function(e) {
  try {
    window.__mo2 = {
      version: VERSION,
      loaded: true,
      active: false,
      blocked: ["\u542F\u52A8\u5F02\u5E38\uFF1A" + (e && e.message || String(e))]
    };
  } catch (e2) {
  }
});

// v0.2 入口。激活顺序刻意保守：
//   1) 只留一个被动全局（供自动化/自检读取，不碰 DOM、不碰 console）
//   2) 闸门判定；不过 → 就此为止（PC 端零影响）
//   3) 问服务端插件清单做互斥判定（不用 DOM 指纹，避免与 v1 注入时机的竞态）
//   4) 注入样式 + manifest/图标链接
//   5) 起视口测量
//   6) 若请求了自检 → 经官方 slot 渲染自检面板
// 任何一步失败都必须「整体不注入」，不允许半套生效。

import { VERSION } from './version.js';
import {
  decide,
  debugRequested,
  legacyPresent,
  syncSelfTestFlag,
  selfTestRequested,
  isChatRoute,
  isModelsRoute,
  isMobileWidth,
  LOG,
} from './gate.js';
import { probe, slot, PLUGIN_ID } from './api/qw.js';
import { injectStyle, injectManifest, ensureMount } from './boot/inject.js';
import { start as startViewport, snapshot as vpSnapshot, stop as stopViewport } from './env/viewport.js';
import { SelfTest } from './ui/selftest.jsx';
import { startModelPopupGuard } from './mobile-model-popup.js';
import { TopBar } from './ui/TopBar.jsx';
import { FeatureSheet } from './ui/FeatureSheet.jsx';

// 把一段 React 内容注册进官方插槽。失败即返回错误，由上层决定"整体不注入"——
// chrome 不做 body 挂载兜底（那是 v1 的 DOM 手术老路），只有自检面板允许兜底。
function fillChrome(name, el) {
  try {
    var d = slot().fill(PLUGIN_ID, name, function () {
      return el;
    });
    return { name: name, ok: true, disposable: d };
  } catch (e) {
    return { name: name, ok: false, error: String((e && e.message) || e) };
  }
}

function registerChrome(info) {
  var React = window.QwenPaw.host.React;
  var list = [
    fillChrome('header.right', <TopBar />),
    fillChrome('overlay.global', <FeatureSheet />),
  ];
  info.chrome = list.map(function (r) {
    return { name: r.name, ok: r.ok, error: r.error || '' };
  });
  info.disposables = (info.disposables || []).concat(
    list.filter(function (r) { return r.ok && r.disposable; }).map(function (r) { return r.disposable; }),
  );
  return list.every(function (r) {
    return r.ok;
  });
}

function renderSelfTest() {
  var React = window.QwenPaw && window.QwenPaw.host && window.QwenPaw.host.React;
  if (!React) return { via: 'none', error: 'host.React 不可用' };
  var el = <SelfTest />;
  try {
    var d = slot().fill(PLUGIN_ID, 'overlay.global', function () {
      return el;
    });
    return { via: 'slot', disposable: d };
  } catch (e) {
    // 降级：官方插槽不可用 → 用官方 ReactDOM 挂到自有节点（仍然不碰官方 DOM 子树）
    try {
      var ReactDOM = window.QwenPaw.host.ReactDOM;
      var root = ReactDOM.createRoot(ensureMount());
      root.render(el);
      return { via: 'react-dom-fallback', error: e && e.message };
    } catch (e2) {
      return { via: 'none', error: (e && e.message) + ' / ' + (e2 && e2.message) };
    }
  }
}

function cleanup(info) {
  try { (info.disposables || []).forEach(function (d) { if (typeof d === 'function') d(); }); } catch (e) {}
  try { stopViewport(); } catch (e) {}
  try { var st = document.getElementById('qwenpaw-mo2-style'); if (st) st.remove(); } catch (e) {}
  try { var root = document.getElementById('qwenpaw-mo2-root'); if (root) root.remove(); } catch (e) {}
  try { document.querySelectorAll('head link[data-mo2], head meta[data-mo2]').forEach(function (el) { el.remove(); }); } catch (e) {}
  info.active = false;
  info.cleaned = true;
}

function reactivate(info) {
  // chat→非chat→chat 的回魂路径：cleanup 只摘了核心（样式/视口/chrome），
  // 官方插槽若有残留则 chrome 仍在——此时只补核心，避免重复注册。
  injectStyle();
  startViewport();
  var chromeGone = !document.querySelector('[aria-label="mo2-功能面板"]');
  if (chromeGone) registerChrome(info);
  info.active = true;
  info.cleaned = false;
  info.reactivations = (info.reactivations || 0) + 1;
}

function watchRoute(info) {
  var last = window.location.pathname || '/';
  var check = function () {
    var now = window.location.pathname || '/';
    if (now === last) return;
    last = now;
    if (!isChatRoute()) cleanup(info);
    else if (info.cleaned) reactivate(info);
  };
  window.addEventListener('popstate', check);
  window.addEventListener('hashchange', check);
  var timer = window.setInterval(check, 500);
  // 刻意【不】把本监听放进 info.disposables：cleanup 若把自己杀掉，
  // 聊天页就永远回不来了（zombie chrome 的根因）。它只是每 500ms 比一次路径，成本可忽略。
}

async function boot() {
  // 被动指纹：便于自动化区分「bundle 根本没执行」和「执行了但没激活」。
  var info = { version: VERSION, loaded: true, active: false, blocked: [], debug: debugRequested() };
  try {
    window.__mo2 = info;
  } catch (e) {}

  syncSelfTestFlag(); // 要在 SPA 把 "/" 重定向成 "/chat" 之前把开关落进 sessionStorage

  // Models page gets only the narrowly scoped keyboard/popup guard; no global UI/CSS injection.
  if (isModelsRoute() && isMobileWidth()) {
    info.active = true;
    info.modelsPopupGuard = true;
    info.disposables = [startModelPopupGuard()];
    watchRoute(info);
    return;
  }

  var d = decide();
  if (!d.ok) {
    info.blocked = d.blocked;
    if (d.debug) console.info(LOG + ' 未激活：' + d.blocked.join('；'));
    return; // ← PC 端到此为止：无样式、无 DOM、无监听、无 console 劫持
  }

  var legacy = await legacyPresent();
  info.legacy = legacy;
  if (legacy.found) {
    info.blocked = [
      'v1「移动端优化」在运行（' + legacy.via + (legacy.version ? ' v' + legacy.version : '') + '），v2 让位',
    ];
    console.info(LOG + ' 未激活：' + info.blocked[0]);
    return; // 一键回滚设计：v1 活着就绝不与它抢界面
  }

  injectStyle();
  info.manifestAdded = injectManifest();
  startViewport();
  info.active = true;
  info.probe = probe();
  info.viewport = vpSnapshot();
  info.chromeOk = registerChrome(info); // 顶栏入口 + 功能面板（官方插槽）
  watchRoute(info);

  if (selfTestRequested()) {
    var r = renderSelfTest();
    info.selftest = { via: r.via, error: r.error || '' };
    if (r.disposable) info.disposables = [r.disposable];
  }

  console.info(
    LOG + ' v' + VERSION + ' 已激活（仅移动端 ≤768px · iOS26 基线通过）· 自检入口：URL 加 ?mo_selftest=1',
  );
}

boot().catch(function (e) {
  try {
    window.__mo2 = {
      version: VERSION,
      loaded: true,
      active: false,
      blocked: ['启动异常：' + ((e && e.message) || String(e))],
    };
  } catch (e2) {}
});

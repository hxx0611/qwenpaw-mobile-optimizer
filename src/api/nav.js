// 路由跳转。官方 route API 只给了 add/replace/wrap/remove，**没有 navigate**，
// 且实测侧栏里没有任何 <a href> 可借。所以走 history + popstate，失败兜底整页跳转。
// 官方前端是 BrowserRouter（history 模式），pushState 后派发 popstate 可被 react-router 接住；
// 400ms 后核对 pathname，没动就说明没接住 → 退回 location.assign（可靠但会重载 SPA）。

import { setPath } from '../state.js';

export function currentPath() {
  try {
    return window.location.pathname || '/';
  } catch (e) {
    return '/';
  }
}

export function isChatRoute() {
  var p = currentPath();
  return p === '/' || /^\/chat(\/|$)/.test(p);
}

export function navigate(path) {
  var want = String(path || '/').split('?')[0];
  try {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    // 立即广播路径（不等 500ms 兜底轮询），底栏/抽屉据此重渲染。
    setPath(want);
  } catch (e) {
    try {
      window.location.assign(path);
    } catch (e2) {}
    return 'assign';
  }
  setTimeout(function () {
    if (currentPath() !== want) {
      try {
        window.location.assign(path);
      } catch (e) {}
    }
  }, 400);
  return 'pushState';
}

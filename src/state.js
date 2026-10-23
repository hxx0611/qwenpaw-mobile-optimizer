// 极简单值外部 store：顶栏按钮（header.right 槽）与功能面板（overlay.global 槽）是两次
// 独立注册，不在同一棵子树里，靠它共享开合状态。用官方 React 的 useSyncExternalStore 消费。

var _s = { sheet: false, modelView: false, drawer: false, pagesView: false };
var _subs = new Set();

export function get() {
  return _s;
}

export function set(patch) {
  _s = Object.assign({}, _s, patch);
  _subs.forEach(function (f) {
    try {
      f();
    } catch (e) {}
  });
}

export function subscribe(fn) {
  _subs.add(fn);
  return function () {
    _subs.delete(fn);
  };
}

export function toggleSheet(v) {
  set({ sheet: typeof v === 'boolean' ? v : !_s.sheet });
}

// v1.2.0：自绘会话栏（C1-a）与「更多功能」二级视图（C2-f）也走同一个 store，
// 因为它们分别由顶栏按钮、手势、面板条目三处驱动，必须共享同一份开合状态。
export function toggleDrawer(v) {
  set({ drawer: typeof v === 'boolean' ? v : !_s.drawer });
}

export function useAppState() {
  var R = window.QwenPaw.host.React;
  return R.useSyncExternalStore(subscribe, get, get);
}

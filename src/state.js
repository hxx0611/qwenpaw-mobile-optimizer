// 极简单值外部 store：顶栏按钮（header.right 槽）与功能面板（overlay.global 槽）是两次
// 独立注册，不在同一棵子树里，靠它共享开合状态。用官方 React 的 useSyncExternalStore 消费。

// v1.2.1：path 也进 store。底栏/抽屉这类挂在 overlay.global 槽里的组件不消费官方路由
// context，路由一变它们不会重渲染——只在 render 时读 location 就会拿到"首次渲染那一刻"
// 的快照（实测：/models 点「聊天」后底栏仍留在 /chat 上压住输入框）。
// 谁发现路径变了谁写进来（nav.navigate 立即写、watchRoute 兜底写），组件订阅即可。
function readPath() {
  try {
    return window.location.pathname || '/';
  } catch (e) {
    return '/';
  }
}

var _s = { sheet: false, modelView: false, drawer: false, pagesView: false, path: readPath() };
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

// 幂等：路径没变就不通知，避免 watchRoute 每 500ms 把整棵订阅树刷一遍。
export function setPath(p) {
  var next = p || '/';
  if (next === _s.path) return;
  set({ path: next });
}

export function useAppState() {
  var R = window.QwenPaw.host.React;
  return R.useSyncExternalStore(subscribe, get, get);
}

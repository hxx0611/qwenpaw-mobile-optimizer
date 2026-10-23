// 自绘会话栏（C1-a）：官方 overlay.global 槽里的 antd Drawer（左侧抽屉）。
// 数据全部来自官方 REST（GET /api/chats，见 api/chats.js），不读、不动官方 DOM —— 这是
// v1 时代「点官方侧栏再藏回去」那种杂技的替代品。开合状态放在 state.js，由手势/顶栏按钮共享。

import { antd, icons } from '../api/qw.js';
import { useAppState, set } from '../state.js';
import { listChats, groupChats, relTime } from '../api/chats.js';
import { navigate, currentPath } from '../api/nav.js';

export function SessionDrawer() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var st = useAppState();
  var _s = R.useState({ loading: false, err: '', groups: [], n: 0 }), snap = _s[0], setSnap = _s[1];

  function load() {
    setSnap(function (p) {
      return Object.assign({}, p, { loading: true, err: '' });
    });
    listChats()
      .then(function (list) {
        setSnap({ loading: false, err: '', groups: groupChats(list), n: list.length });
      })
      .catch(function (e) {
        setSnap({ loading: false, err: String((e && e.message) || e), groups: [], n: 0 });
      });
  }

  // 每次打开都刷新：会话列表是「会变的」，缓存会让用户看到过期列表
  R.useEffect(
    function () {
      if (st.drawer) load();
    },
    [st.drawer],
  );

  function close() {
    set({ drawer: false });
  }

  function openChat(c) {
    close();
    navigate('/chat/' + c.id);
  }

  var cur = currentPath();
  var curId = cur.replace(/^\/chat\//, '');

  function row(c) {
    var Star = I.PushpinOutlined || I.StarOutlined;
    return (
      <div
        key={c.id}
        className={'mo2-session-item' + (c.id === curId ? ' mo2-session-cur' : '')}
        data-chat={c.id}
        role="button"
        onClick={function () {
          openChat(c);
        }}
      >
        <span className="mo2-session-name">{c.name}</span>
        <span className="mo2-session-side">
          {c.pinned && Star ? <Star /> : null}
          <span className="mo2-session-time">{relTime(c.updated)}</span>
        </span>
      </div>
    );
  }

  var body = (
    <div className="mo2-session-body">
      <div className="mo2-session-tools">
        <A.Button size="small" type="text" aria-label="mo2-会话刷新" onClick={load} loading={snap.loading}>
          刷新
        </A.Button>
        <A.Button
          size="small"
          type="link"
          aria-label="mo2-新建会话"
          onClick={function () {
            close();
            navigate('/');
          }}
        >
          + 新建会话
        </A.Button>
      </div>
      {snap.err ? <div className="mo2-err">会话列表读取失败：{snap.err}</div> : null}
      {!snap.err && !snap.loading && snap.n === 0 ? <div className="mo2-empty">还没有会话</div> : null}
      {(snap.groups || []).map(function (g) {
        return (
          <div key={g.title} className="mo2-session-group">
            <div className="mo2-session-gtitle">{g.title}</div>
            {g.items.map(row)}
          </div>
        );
      })}
    </div>
  );

  if (!A || !A.Drawer) return null;

  return (
    <A.Drawer
      title="会话"
      placement="left"
      open={!!st.drawer}
      onClose={close}
      width="78%"
      rootClassName="mo2-session-root"
      className="mo2-session-drawer"
      destroyOnClose
      styles={{ body: { padding: '6px 10px 18px' } }}
      getContainer={false}
    >
      {body}
    </A.Drawer>
  );
}
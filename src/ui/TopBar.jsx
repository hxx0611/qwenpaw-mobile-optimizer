// 顶栏入口：官方 header.right 槽里放两个按钮（新建对话 / 功能面板）。
// 按已确认决策：面板入口放【顶栏右侧】，且【保留官方会话标题】——所以我们不隐藏任何标题类节点。

import { antd, icons } from '../api/qw.js';
import { useAppState, toggleSheet } from '../state.js';
import { clickOfficial } from '../legacy/click.js';
import { navigate } from '../api/nav.js';

export function TopBar() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var st = useAppState();

  function onNewChat() {
    // 优先点官方「新建任务」（走官方自己的建会话逻辑，含路由与状态）；找不到才退回整页跳首页
    var r = clickOfficial('newChat');
    if (!r.ok) navigate('/');
  }

  var Plus = I.PlusOutlined;
  var Grid = I.AppstoreOutlined;

  return (
    <span className="mo2-topbar">
      {A.Tooltip ? (
        <A.Tooltip title="新建对话">
          <A.Button
            size="small"
            type="text"
            shape="circle"
            aria-label="mo2-新建对话"
            icon={Plus ? <Plus /> : '+'}
            onClick={onNewChat}
          />
        </A.Tooltip>
      ) : (
        <A.Button size="small" type="text" aria-label="mo2-新建对话" onClick={onNewChat}>
          新建
        </A.Button>
      )}
      <A.Button
        size="small"
        type="text"
        shape="circle"
        aria-label="mo2-功能面板"
        className={st.sheet ? 'mo2-topbar-on' : ''}
        icon={Grid ? <Grid /> : '⌗'}
        onClick={function () {
          toggleSheet();
        }}
      />
    </span>
  );
}

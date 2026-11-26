// A 方案（2026-11-23）：官方插槽渲染管线整条失效时，把同一批 chrome 组件自绘到
// body 上的自有根节点。纪律：
//   ① 组件与状态复用现有实现，不复制第二份 UI，避免两套行为漂移；
//   ② 只在「注册成功但 2s 后页面上仍看不到我们的节点」时挂载，官方正常时零影响；
//   ③ 官方一旦恢复渲染，boot/fallback.js 的哨兵会卸载本壳，回到官方通道。

import { useAppState } from '../state.js';
import { currentPath } from '../api/nav.js';
import { TopBar } from './TopBar.jsx';
import { FeatureSheet } from './FeatureSheet.jsx';
import { BottomTabs } from './BottomTabs.jsx';
import { SessionDrawer } from './SessionDrawer.jsx';
import { ToolsPage } from './ToolsPage.jsx';

// 分段错误边界（2026-11-26 事故复盘）：
// v1.3.3 里 FeatureSheet 引用了一个被误删的函数，渲染时抛 ReferenceError，
// React 直接卸载整棵树 → 顶栏入口、底栏、侧滑抽屉一起消失，看起来像「越改越坏」。
// 现在每个区块各自包一层：谁崩谁自己变空，其余入口照常可用，错误写进 window.__mo2.lastError。
var GuardCls = null;

function Guard(props) {
  var R = window.QwenPaw.host.React;
  if (!GuardCls) {
    GuardCls = class extends R.Component {
      constructor(p) {
        super(p);
        this.state = { err: null };
        this.componentDidCatch = function (e, info) {
          try {
            console.error('[mo2] ' + ((this.props && this.props.label) || '?') + ' 渲染失败：', e);
          } catch (_) {}
          try {
            if (window.__mo2) window.__mo2.lastError = ((this.props && this.props.label) || '?') + ': ' + ((e && e.stack) || e);
          } catch (_) {}
        };
      }
      static getDerivedStateFromError(e) {
        return { err: e };
      }
      render() {
        return this.state.err ? null : this.props.children;
      }
    };
  }
  return R.createElement(GuardCls, props);
}

export function FallbackShell() {
  // 必须订阅：本壳自己挂在 body 上，不在官方路由 context 里，路径变化只能从 store 拿。
  var st = useAppState();
  var p = st.path || currentPath();
  var onTools = p === '/mo2' || p.indexOf('/mo2/') === 0;

  return (
    <div className="mo2-fb">
      {/* /mo2 由页面自己铺满，顶栏让位（页面底部快捷操作里有回聊天 / 功能面板） */}
      {onTools ? null : (
        <Guard label="dock">
          <div className="mo2-fb-dock" data-mo2-fb="dock">
            <TopBar />
          </div>
        </Guard>
      )}
      {onTools ? (
        <Guard label="page">
          <div className="mo2-fb-page" data-mo2-fb="page">
            <ToolsPage />
          </div>
        </Guard>
      ) : null}
      <Guard label="sheet">
        <FeatureSheet />
      </Guard>
      <Guard label="tabs">
        <BottomTabs />
      </Guard>
      <Guard label="drawer">
        <SessionDrawer />
      </Guard>
    </div>
  );
}
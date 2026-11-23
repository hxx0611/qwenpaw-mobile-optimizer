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

export function FallbackShell() {
  // 必须订阅：本壳自己挂在 body 上，不在官方路由 context 里，路径变化只能从 store 拿。
  var st = useAppState();
  var p = st.path || currentPath();
  var onTools = p === '/mo2' || p.indexOf('/mo2/') === 0;

  return (
    <div className="mo2-fb">
      {/* /mo2 由页面自己铺满，顶栏让位（页面底部快捷操作里有回聊天 / 功能面板） */}
      {onTools ? null : (
        <div className="mo2-fb-dock" data-mo2-fb="dock">
          <TopBar />
        </div>
      )}
      {onTools ? (
        <div className="mo2-fb-page" data-mo2-fb="page">
          <ToolsPage />
        </div>
      ) : null}
      <FeatureSheet />
      <BottomTabs />
      <SessionDrawer />
    </div>
  );
}
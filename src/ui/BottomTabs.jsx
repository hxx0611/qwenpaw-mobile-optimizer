// 底部 Tab 栏（C1-b）：官方 overlay.global 槽里的固定底栏，三个入口。
// 选路径的三条纪律：① 只写官方真实存在的一级路由（从 bundle 静态提取，不猜）；
// ② 不新增官方 DOM、不隐藏官方控件（底栏纯叠加）；③ 高度吃掉 safe-area，避免 iPhone 横条遮挡。

import { antd, icons } from '../api/qw.js';
import { navigate, currentPath } from '../api/nav.js';
import { isChatRoute } from '../gate.js';

export var TABS = [
  { key: 'chat', label: '聊天', path: '/chat', icon: 'MessageOutlined' },
  { key: 'models', label: '模型', path: '/models', icon: 'RobotOutlined' },
  { key: 'settings', label: '设置', path: '/settings', icon: 'SettingOutlined' },
];

function isHere(pathname, tab) {
  if (tab.key === 'chat') return pathname === '/' || /^\/chat(\/|$)/.test(pathname);
  return pathname === tab.path || pathname.indexOf(tab.path + '/') === 0;
}

export function BottomTabs() {
  var A = antd();
  var I = icons();
  var here = currentPath();

  // 聊天页主动让位：那里底部被官方输入框占着，压上去就是「输入框被盖住」的现场。
  // 聊天页的导航由顶栏三键 + 左缘手势 + 面板「更多官方页面」承担，功能不丢。
  if (isChatRoute()) return null;

  return (
    <nav className="mo2-tabs" aria-label="mo2-底部导航">
      {TABS.map(function (t) {
        var Ic = I[t.icon];
        var on = isHere(here, t);
        return (
          <button
            key={t.key}
            type="button"
            className={'mo2-tab' + (on ? ' mo2-tab-on' : '')}
            aria-label={'mo2-tab-' + t.key}
            aria-current={on ? 'page' : undefined}
            onClick={function () {
              navigate(t.path);
            }}
          >
            <span className="mo2-tab-ico">{Ic ? <Ic /> : '·'}</span>
            <span className="mo2-tab-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
// 「移动端工具」页（C1-c 的落地页）：用官方 route.add 注册在 /mo2，官方侧栏菜单用 route id 指过来。
// 内容只放「官方页面入口 + 本插件状态」，不复制官方任何功能细节 —— 它是导航页，不是平行后台。

import { antd, icons, host } from '../api/qw.js';
import { VERSION } from '../version.js';
import { PAGES } from '../api/pages.js';
import { navigate } from '../api/nav.js';
import { set } from '../state.js';
import { bundleCheck, compat } from '../env/drift.js';

export function ToolsPage() {
  var R = window.QwenPaw.host.React;
  var A = antd();
  var I = icons();
  var _c = R.useState({ version: null, min: '', max: '', ok: null, err: '读取中…' }), cp = _c[0], setCp = _c[1];
  var bp = bundleCheck();
  var agent = '';

  // 当前智能体：host.getSelectedAgentId 是普通 getter（非 hook），render 期同步读即可
  try {
    var h = host();
    agent = typeof h.getSelectedAgentId === 'function' ? String(h.getSelectedAgentId() || '') : '';
  } catch (e) {}

  R.useEffect(function () {
    var stop = false;
    compat().then(function (r) {
      if (!stop) setCp(r);
    });
    return function () {
      stop = true;
    };
  }, []);

  return (
    <div className="mo2-tools">
      <div className="mo2-tools-head">
        <span className="mo2-tools-title">移动端工具</span>
        <span className="mo2-tools-ver">v{VERSION}</span>
      </div>

      <div className="mo2-tools-card">
        <div className="mo2-tools-line">
          <span className="mo2-tools-k">官方 bundle</span>
          <span className={'mo2-tools-v' + (bp.known ? '' : ' mo2-bad')}>
            {bp.bundle}
            {bp.known ? '' : '（未知指纹，需复核）'}
          </span>
        </div>
        <div className="mo2-tools-line">
          <span className="mo2-tools-k">平台版本</span>
          <span className={'mo2-tools-v' + (cp.ok === false ? ' mo2-bad' : '')}>
            {cp.version || '—'} · 实测区间 {cp.min}~{cp.max}
            {cp.ok === false ? '（越界）' : ''}
          </span>
        </div>
        {agent ? (
          <div className="mo2-tools-line">
            <span className="mo2-tools-k">当前智能体</span>
            <span className="mo2-tools-v">{agent}</span>
          </div>
        ) : null}
      </div>

      <div className="mo2-tools-sec">官方页面</div>
      <div className="mo2-tools-grid">
        {PAGES.map(function (p) {
          var Ic = I[p.icon];
          return (
            <button
              key={p.key}
              type="button"
              className="mo2-tools-item"
              aria-label={'mo2-page-' + p.key}
              onClick={function () {
                navigate(p.path);
              }}
            >
              <span className="mo2-tools-ico">{Ic ? <Ic /> : '·'}</span>
              <span className="mo2-tools-label">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mo2-tools-sec">快捷操作</div>
      <div className="mo2-tools-actions">
        <A.Button size="small" onClick={function () { set({ drawer: true }); }}>
          会话列表
        </A.Button>
        <A.Button size="small" onClick={function () { set({ sheet: true }); }}>
          功能面板
        </A.Button>
        <A.Button size="small" onClick={function () { navigate('/chat'); }}>
          回聊天
        </A.Button>
      </div>
    </div>
  );
}
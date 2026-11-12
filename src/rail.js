// 官方 56px 折叠图标栏（dockableSidebar 的 anchor）在 390 宽屏上白吃 56px，正文只剩 334。
// v1.3.0 起默认把它「移出文档流但保留渲染」→ 正文吃满 390，入口改由我们自己的 UI 承载：
//   · 8 个图标入口（收件箱/定时任务/文件/运行配置/模型/扩展/移动端工具/移动端优化）
//     → 功能面板「更多官方页面」（/inbox、/cron-jobs、/files、/agent-config、/models、/market …）
//   · 选择智能体 → 合成点击官方按钮，气泡照旧弹出并锚在屏内（实测 left≈-2，可见）
//   · 想找回原样 → 功能面板的「官方图标栏」开关，写 localStorage，跨导航存活
//
// 为什么用 translateX(-100%) 而不是 display:none：
//   官方弹层（选择智能体、审批模式那类）靠 trigger 的 getBoundingClientRect 定位，
//   display:none 会让盒子消失、气泡退化到 (0,0) 飞出屏幕（v0.1.78 踩过）；
//   移出屏外时盒子还在，Rect 仍有坐标，气泡能正常落在屏内。
//
// 失效模式是「侧栏又回来了、正文窄 56px」这种外观回退，不会崩、不会锁交互。

var KEY = 'mo2_rail';

export function railOn() {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch (e) {
    return false;
  }
}

export function setRail(on) {
  try {
    var root = document.documentElement;
    if (on) root.setAttribute('data-mo2-rail', 'on');
    else root.removeAttribute('data-mo2-rail'); // 属性不在 = 默认收走，PC 端零足迹也靠这个
    window.localStorage.setItem(KEY, on ? '1' : '0');
  } catch (e) {}
  return !!on;
}

export function toggleRail() {
  return setRail(!railOn());
}

// 启动时把开关写回 <html>：CSS 一条规则读它，决定侧栏在流内还是屏外。
export function applyRail() {
  return setRail(railOn());
}

// 合成点击官方「选择智能体」按钮。侧栏被移到屏外后按钮仍在渲染，click() 有效；
// 多路信号：中文文案优先，留给官方换措辞时的英文兜底。
export function showAgentSwitcher() {
  var sels = [
    'button[aria-label="选择智能体"]',
    'button[aria-label="切换智能体"]',
    'button[aria-label="Switch agent"]',
    'button[aria-label="Select agent"]',
  ];
  for (var i = 0; i < sels.length; i++) {
    var btn = null;
    try {
      btn = document.querySelector(sels[i]);
    } catch (e) {
      btn = null;
    }
    if (btn) {
      btn.click();
      return true;
    }
  }
  return false;
}
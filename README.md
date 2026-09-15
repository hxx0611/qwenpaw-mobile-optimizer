# 📱 QwenPaw Mobile Optimizer

> 让 QwenPaw 控制台在手机浏览器里**真正能用**。非官方插件，MIT 开源。

[![license: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

---

## 为什么做这个 🤔

QwenPaw 的桌面控制台做得挺完整，但用手机浏览器打开……懂的都懂：

- 想换个模型，得在桌面布局里缩放半天 😮‍💨
- 键盘一弹，输入框直接没了 🫠
- 文件工作区、Loop 模式、工具审批这些功能，移动端**根本没有入口**

这个插件不魔改官方前端——**不重打包 React、不劫持渲染、不增删官方节点**，只用官方扩展 API 加一点点合成点击，把移动端该有的入口补齐。PC 端零足迹：屏幕宽于 768px 时它连 DOM 都不碰。

## ✨ 功能清单

| 功能 | 说明 |
|---|---|
| 🧩 **顶栏功能面板** | 底部抽屉一键直达：新建会话 / 模型切换 / 模型管理 / 工具管理 / 文件工作区 / Loop 模式 / 工具审批 |
| 🤖 **模型秒切** | 面板里直接换 provider + model，走官方 REST，显示的是人能读的名字 |
| ⌨️ **键盘适配** | `visualViewport` 实时测量，输入框不再被键盘顶没；`/models` 页的原生下拉也管 |
| 🧭 **路由感知** | 只在聊天页深度生效；在别的页面点「需回聊天页」的条目，会自动跳回聊天页**替你点开**官方入口 |
| 📲 **PWA** | 添加到主屏幕，全屏跑，跟原生 App 一样 |
| 🔍 **自检 20 项** | URL 加 `?mo_selftest=1`，坏了先自检，pass/fail 一目了然 |

## 📦 安装

**要求**：QwenPaw `2.2.0 ~ 2.4.0`；iOS Safari 16.4+ / Android Chrome 130+（CSS Anchor Positioning、`:has()`、`dvh` 能力基线，不满足会**主动不激活**——设计如此，防半套 UI）。

1. 去 [Releases](../../releases) 下载 `qwenpaw-mobile-optimizer.zip`
   （或者 clone 后自己构建：`npm i -g esbuild && node scripts/build.mjs`）
2. QwenPaw 控制台 → 设置 → 插件管理 → 上传安装 → 启用
3. 手机浏览器打开控制台，顶栏出现 **⊞ 图标** 就成功了 🎉

> 💡 建议用 Safari「添加到主屏幕」，体验直接上一个档次。

## 🧭 怎么用

- 顶栏 ⊞ 图标 → 功能面板（底部抽屉）
- 面板里点「模型选择」→ 直接换模型，不用进设置页
- 在设置页想开工作区/Loop/审批？条目会标「需回聊天页」，**点它**，自动跳回去帮你打开
- 出怪状？URL 加 `?mo_selftest=1` 看 20 项自检

## 🛠 开发 & 构建

```bash
# 源码都在 src/，产物 frontend/index.js 由 esbuild 打单文件 ESM
node scripts/build.mjs

# 静态守卫：四条硬约束（禁 DOM 手术 / 禁打包 React / Observer 预算 0 / legacy.css 条数预算）
node scripts/guard.mjs
```

几个不妥协的约定：

- JSX 编译到 `window.QwenPaw.host.React.createElement`——React 只在渲染时从官方宿主取，**产物里没有第二份 React**
- 与官方 DOM 的交互只允许发生在 `src/legacy/click.js` 一个文件里，且只做合成点击
- 任何一步失败 → 整体不注入，不存在"半套生效"

## ✅ 交互验收（可选）

```bash
pip install playwright && playwright install webkit
python3 scripts/g2-check.py http://localhost:8088   # 12 项断言，真点一遍
```

如果你的控制台开启了 QwenPaw Auth，先 `export MO2_TOKEN=<你的 qwenpaw_auth_token>` 再跑（脚本会把它注入无头浏览器的登录态）。

## 🚨 免责声明（认真脸）

- **非官方项目**，与 QwenPaw 团队无关；QwenPaw 与相关 logo 版权归其作者所有
- 部分功能依赖官方前端的**内部类名/插槽信号**，上游升级可能失效——出问题先跑自检，再来看 [issues](../../issues)
- 插件目录下的文件会经 `/api/frontend_plugin` **公开下发**，别往里放任何敏感文件

## License

[MIT](LICENSE) © 2026 hxx0611

---

## English

Unofficial mobile UX enhancement for the [QwenPaw](https://github.com/agentscope-ai/QwenPaw) web console. It adds a bottom-sheet feature panel (new chat / model switcher / workspace / loop mode / tool approval), keyboard-aware input, route-aware actions and PWA support — but **only** on mobile viewports (≤768px) that pass an iOS 26 capability baseline. Desktop gets zero footprint: no style injection, no DOM, no listeners.

Built purely on the official plugin extension APIs (`slot` / `menu` / `route` / `chat` + host React/antd). No React rebundling, no DOM surgery (enforced by a build-time guard). Some features rely on internal CSS-module class signals of the official frontend and may break on upstream upgrades — run the built-in 20-item self-test (`?mo_selftest=1`) first.

Requires QwenPaw 2.2.0–2.4.0. MIT licensed.

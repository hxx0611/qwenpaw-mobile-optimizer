# Changelog

遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，版本号遵循语义化版本。

## v1.0.0（2026-09-15）🎉

首次开源。内部迭代了三轮（骨架 → 能力集 → 路由感知），这里合并成一个干净的起点。

### Added

- 🧩 **顶栏功能面板**：官方 `overlay.global` 插槽渲染 antd Drawer 底部抽屉——新建会话 / 模型切换 / 模型管理 / 工具管理 / 文件工作区 / Loop 模式 / 工具审批，一个入口全搞定。
- 🤖 **模型秒切**：面板内直接换 provider + model，走官方 REST，永远显示人能读的名字（不会露出 `provider::model` 原始值）。
- ⌨️ **键盘适配**：`visualViewport` 实时测量 + CSS 变量驱动，输入框不再被键盘顶没；连 `/models` 页的原生模型下拉也做了键盘避让。
- 🧭 **路由感知**：插件只在聊天页深度生效；在设置页等非聊天路由打开面板时，依赖聊天页 composer 的条目会标「需回聊天页」，点一下自动跳回聊天页并替你点开官方入口。离开聊天页时统一回收样式/监听/注入物，回来时自动复活。
- 📲 **PWA**：manifest + apple-touch-icon + theme-color，可以「添加到主屏幕」全屏跑。
- 🔍 **自检面板**：URL 加 `?mo_selftest=1`，20 项 pass/fail，出问题先自检再提 issue。
- 🛡 **构建守卫** `scripts/guard.mjs`：四条硬约束变成构建失败——禁 DOM 手术（不增删改官方节点）、禁打包第二份 React、MutationObserver 预算 0、legacy 类名字面量只准待在预算内的样式文件里。
- ✅ **交互验收** `scripts/g2-check.py`：Playwright 真机模拟 iPhone 视口，12 项断言全真点一遍（含三个官方弹层的落屏几何校验）。

### 设计原则

- 只用官方扩展 API（`slot` / `menu` / `route` / `chat` + `host.React/antd`），不重打包 React，不劫持渲染。
- 能力基线不过（老 Safari / 老 WebView）→ 主动不激活，绝不半套生效。
- PC 端（>768px）零足迹：不注入、不建 DOM、不加监听。

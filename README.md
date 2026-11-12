# QwenPaw 手机端插件

QwenPaw 在电脑上挺好用，扔到手机上就别扭了：侧栏占掉 56 像素、按钮小得点不准、输入框一碰整页放大。

这个插件是修这些的。纯前端，不碰后端，电脑上完全不生效。

版本 **1.3.0**，要求 QwenPaw 2.2.0 ~ 2.4.0、iOS 26 以上。屏幕宽度 768 以下自动启用。

## 装

下载 zip → 设置 → 插件管理 → 上传安装 → 启用，然后刷新页面。

手机打开就生效了。想确认，加 `?mo_selftest=1`，会出一张检查表。

想当 App 用：Safari 分享 → 添加到主屏幕。从桌面图标进去是全屏，没有 Safari 工具栏。

## 手机上会变成什么样

- 顶栏剩三个按钮：新建对话、会话列表、功能面板。原来挤在顶上的东西都收进面板。
- 官方那条 56 像素的侧栏默认收走，390 宽的手机上正文从 334 撑到 390。想要回来，面板里点「官方图标栏」，随时能收回去，翻页也不会丢。
- 面板里有：新建会话、模型选择、模型管理、工具管理、打开文件工作区、Loop 模式、工具审批模式、切换智能体、官方图标栏、更多官方页面（收件箱 / 扩展 / 运行配置）。
- 输入框下面只留麦克风、附件、用量、发送。发送键不会再被挤到第二行。
- 输入框字号是 16px，点进去不会整页放大。
- 键盘弹起来，输入区跟着往上走，不会挡住。
- 底部三个 Tab：聊天、模型、设置。聊天页不显示，因为那里底部本来就是输入框。
- 左边往里划，拉出会话列表。
- 模型可以直接换，走的是官方 REST 接口，换完界面同步。

## 出问题先跑自检

地址后面加 `?mo_selftest=1`，26 项，红的截个图。

想在任何宽度下强行打开，加 `?mo2_debug=1`。

## 不要了

插件管理里禁用，或者把目录改名，后面加个 `.disabled`，刷新就回到官方原样。

## 改代码

```sh
node scripts/guard.mjs           # 构建前检查，不过就不给构建
node scripts/build.mjs           # 打成 frontend/index.js
python3 scripts/webkit-check.py  # WebKit 真引擎跑一遍
python3 scripts/g2-check.py      # 12 项交互验收
python3 scripts/g3-check.py      # 深链、Tab 往返、左缘手势
python3 scripts/probe-routes.py  # 官方页面能不能渲染，先探再选
```

构建要 Node 18+、esbuild、sharp。`build.mjs` 和 `make-icons.mjs` 里写的是我本机的工具路径，你按自己环境改一下。

守卫脚本卡五件事，违反直接失败：不许 `removeChild` / `insertBefore`；`appendChild` 只能出现在 `boot/inject.js`；不许 `import 'react'`（React 必须从 `host.React` 拿）；不许劫持 `console.error` / `console.warn`；官方类名只能写在 `legacy.css` 里，最多 6 条。

## 这些不是 bug

**iOS 26 以下不生效。** 判断靠能力探测，不看 UA —— 苹果把 UA 里的系统版本冻在 `18_7` 了，读它必错。

**Loop 模式、工具审批、打开工作区、新建会话**这四个，官方没给接口，只能模拟点击。都关在 `src/legacy/click.js` 一个文件里。找不到入口会显示「入口缺失」并禁用，不会点了没反应。

**官方弹层的位置是 JS 算的**，不吃 CSS 锚定，剩下那点偏移靠 `legacy.css` 兜。

**不做推送，也不做离线缓存。** 推送要后端配 APNs；离线缓存要面对带 hash 的资源名和会变的隧道域名，不划算。

**藏官方控件不用 `display:none`。** 那样元素没了盒子，官方按 `getBoundingClientRect` 算位置会退到 `(0,0)`，整个弹层飞出屏幕。改成压成 0 宽、位置留着。

## 顺带说说旧版

v1 是事后改官方 DOM 的做法：12 个 MutationObserver、425 处官方类名。上游一升级就静默失效，中间崩过好几轮。

v2 换了思路，只走官方扩展点：UI 用官方给的 React 画，往插槽里塞。JS 不碰官方 DOM 一个字节，所以「删节点把 React 搞崩」这种事从结构上就不可能发生。现在 MutationObserver 是 0，官方类名引用只剩 `legacy.css` 里 6 条，上游不兼容时直接不注入，外观回官方原样。

## 目录

```
src/index.js              启动顺序：全局 → 闸门 → 互斥探测 → 注入 → 视口 → 注册插槽
src/gate.js               宽度、iOS 26 能力基线、v1 互斥
src/state.js              外部 store，顶栏和面板分开注册，共用一份状态
src/api/{qw,models,nav}   官方接口的薄封装，取不到就抛 CapabilityMissing
src/api/{chats,pages}     会话列表、官方页面索引
src/boot/inject.js        全仓唯一能 appendChild 的地方（一个 style，几个 link）
src/env/viewport.js       唯一常驻的几何计算，只往 :root 写 CSS 变量
src/env/gesture.js        左缘手势，监听全是 passive
src/env/drift.js          官方 bundle 指纹白名单，变了就报警（`__mo2.drift`）
src/rail.js               官方侧栏收/放，纯 CSS 变量，不碰 DOM
src/legacy/click.js       全仓唯一跟官方 DOM 打交道的地方，只允许 .click()
src/ui/                   顶栏、功能面板、底部 Tab、会话抽屉、工具页、自检
src/styles/{base,legacy}.css
frontend/index.js         esbuild 出来的单文件，不带第二份 React
```
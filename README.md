# Mobile Optimizer（QwenPaw 移动端优化插件）

让 QwenPaw 在手机 / 小屏上更好用的纯前端插件。**v1.2.0**。

当前版本：**1.2.0** ｜ 插件 ID：`qwenpaw-mobile-optimizer-v2` ｜ 作者：hxx0611 ｜ 基线：iOS 26+ / QwenPaw 2.2.0 ~ 2.2.2.post1（实测上界，插件自己比对 `/api/version`）

仅移动端（≤768px）生效；PC 端零影响（不注入样式、不建 DOM、不加监听、不碰 console）；禁用插件后刷新即还原。

## 为什么是"第二代"

v1（`qwenpaw-mobile-optimizer`，已停用并归档删除）是**事后修补官方 DOM**：12 个 MutationObserver、425 处官方类名引用、合成点击官方按钮。它带来两类反复出现的故障：真机整树崩溃（v0.1.59→v0.1.80）与上游升级后静默失效（2.2.1 连坏两轮）。

v2 改为**通过官方扩展点参与渲染**：UI 用官方 `window.QwenPaw.host.React/antd` 画，注册进 `slot` / `menu` / `chat` 扩展位；官方多余元素只用 CSS 隐藏。**JS 不写官方 DOM 一个字节**，因此"删节点导致 React 崩溃"这类问题在结构上不可能发生。

| 指标 | v1 | v2 实际 |
|---|---|---|
| MutationObserver | 12 | **0** |
| 官方类名引用 | 425 | **3 条规则**，全部集中在 `src/styles/legacy.css` |
| 中文文案匹配 | 12 处 | **0** |
| PC 端运行时足迹 | 有 | **0 行代码执行** |
| 上游不兼容时 | 半套生效（"只剩设置按钮"） | **完全不注入**，外观回到官方原生 |

## 现在能用什么

- **顶栏三个入口**：新建对话 / 会话列表 / 功能面板（官方 `header.right` 槽 + antd Button）
- **功能面板**：底部抽屉（antd `Drawer` + `List`），条目 = 新建会话、模型选择、模型管理、工具管理、打开文件工作区、Loop 模式、工具审批模式、返回聊天（仅非聊天页）
- **模型切换走 REST**：`GET /api/models` 列表 + `PUT /api/models/active`（`scope:"agent"`），切换后派发 `model-switched` 让官方 UI 同步。不再需要 v1 那套"临时显示 header 骗出官方弹层"
- **输入框下方只留 4 项**：麦克风 / 附件 / 上下文用量 / 发送；Loop、工具审批、项目目录收进面板
- **键盘不挡输入框**：`--mo2-kbd` + `transform` 抬升输入区（Safari 不支持 `interactive-widget=resizes-content`，只能测 `visualViewport`）
- **PWA**：分享 → 添加到主屏幕，名称 **QwenPaw**、官方 logo 图标，打开后全屏无 Safari 工具栏
- **底部 Tab 导航**：聊天 / 模型 / 设置三入口；聊天页主动让位（那里底部是官方输入框，压上去就是"输入框被盖住"）
- **自绘会话栏 + 左缘手势**：官方 `overlay.global` 槽里的 antd Drawer（左缘 24vw 起手、90px 阈值、`|dx|>|dy|*1.2`、横向滚动容器让路、手势后 400ms 吞掉幽灵点击）。**不读不碰官方 DOM** —— 这是 v1 时代"点官方侧栏再藏回去"的替代品
- **官方菜单入口**：用官方 `route.add` 注册自有路由 `/mo2`，再用 `menu.add` 挂三条入口（智能体 / 设置 / 用户菜单）。纪律：**路由注册失败就不挂菜单**（未注册的 `/mo2` 是空白页）
- **自检面板**：URL 加 `?mo_selftest=1`，**26 项** pass/fail（能力探测、样式生效、manifest 抓取、safe-area、键盘 delta、16px 防放大、standalone、bundle 漂移、版本区间、会话栏入口、底部 Tab、官方菜单入口、合成点击信号深度…）

## 怎么用（给日常使用者）

1. 手机浏览器打开 Console 地址（≤768px 宽自动生效）。
2. 右上角三个图标：`＋` 新建对话、`⊞` 功能面板。
3. 面板里点「模型选择」→ 直接在下拉里选模型，选中即生效并提示。
4. 想装成 App：Safari 分享 → **添加到主屏幕** → 从桌面图标打开即全屏。
5. 出问题时：地址栏加 `?mo_selftest=1` 截图给开发者，比描述现象快得多。

调试开关：`?mo2_debug=1` 可在桌面强制激活（跳过宽度与基线判定）。

## 工程与发布

```sh
sh scripts/release.sh              # 守卫→构建→热加载→内外网 md5 比对→交互验收，一步到位
sh scripts/release.sh --no-check   # 只发布不跑验收
python3 scripts/drift-check.py     # 官方前端漂移巡检（退出码 0/2/3）
python3 scripts/g2-check.py        # 12 项交互验收（本地 WebKit = Safari 26.5 同源引擎）
python3 scripts/live-check.py      # 不拦截任何请求，模拟真机完整路径（26 项自检）
python3 scripts/webkit-check.py    # WebKit 真引擎：PC 零足迹 / 移动激活 + 自检面板
python3 scripts/g3-check.py        # 深链 /models 与回聊天的激活回归、底部 Tab 往返、左缘手势
python3 scripts/probe-routes.py    # 官方页面可渲染性探针（选路径前先跑，不凭印象）
```

四条硬约束由 `scripts/guard.mjs` 在构建前强制（违反即失败）：禁 `removeChild`/`insertBefore`；`appendChild` 白名单仅 `boot/inject.js`；禁 `import 'react'`（React 必须走 `host.React`）；禁劫持 `console.error/warn`；官方类名字面量只准待在 `legacy.css`，且规则数预算 6 条。

**漂移巡检 cron**：每周一 09:00 静默跑 `drift-check.py`，比对官方 bundle 指纹并跑交互验收；无异常不打扰，验收变红才告警。这是把"上游升级打坏插件"从用户报修变成主动发现的保险。

## 已知边界（不是 bug，别当 bug 报）

1. **iOS 26 以下设备不生效** —— 基线用能力探测判定（`CSS.supports('anchor-name')` / `:has()` / `dvh`），不用 UA（真机 UA 的 `CPU iPhone OS 18_7` 是苹果冻结字段，sniff 必错）。
2. **4 处合成点击耦合**：Loop 模式、工具审批、打开工作区、新建会话 —— 官方没有对应 API，只能点官方控件。已隔离在 `src/legacy/click.js` 单文件，定位优先用 CSS Modules 模块名片段（`modeTrigger` 等，跨构建稳定）而非中文 aria-label；信号找不到时条目显示「入口缺失」并禁用，**不会**出现"点了没反应"。合成点击不改变 DOM 结构，不会引发 React 崩溃。
3. **官方 antd 弹层仍由 rc-align 做 JS 定位**，不吃 CSS 锚定，残留部分靠 `legacy.css` 兜。
4. **不做**：Web Push（需后端配 APNs key）、Service Worker 离线缓存（官方资源带 hash 且隧道域名会变，收益低风险高）。
5. **隐藏官方控件不用 `display:none`**：那会让元素失去盒子，官方弹层按 `getBoundingClientRect` 定位会退化到 `(0,0)` 而整层飞出屏幕。`legacy.css` 用"压成 0 宽但保留原位"。

## 回滚与恢复

- **停用本插件**：在插件管理里禁用，或把目录改名为 `qwenpaw-mobile-optimizer-v2.disabled` 后触发一次插件重载；手机刷新即还原成官方原生界面。
- **v1 已删除**：最终版 v0.1.83 的完整包在 `workspaces/default/backups/qwenpaw-mobile-optimizer-v1-final-*.zip`（含 `index.js` md5 `fda2182e…`），需要时解压回 `plugins/` 即可复活。
- **会话栏手势的前世今生**：v1.0.0 时期做过一版 G3（自绘会话栏 + 左右滑手势），本地验收 15/15 PASS，但当时按决策未启用、代码删除。v1.2.0 的 **C1-a 重新实现**了这一能力（`src/api/chats.js` + `src/ui/SessionDrawer.jsx` + `src/env/gesture.js`），设计要点沿用当时那份笔记（数据契约 `GET /api/chats`、chat id ≠ session_id、隐藏官方控件禁用 `display:none`）。若要关掉：手势与入口都在自绘层内，禁用插件即还原，无官方 DOM 残留。

## 目录结构

```
src/index.js          启动编排：被动全局 → 闸门 → 互斥探测 → 注入 → 视口 → 插槽注册
src/gate.js           宽度 + iOS26 能力基线 + v1 互斥（以公开清单为准，避免注入时机竞态）
src/state.js          外部 store + useSyncExternalStore（顶栏与面板分属两次插槽注册）
src/api/{qw,models,nav}.js   官方 API 薄封装：调用时才取 host；取不到即抛 CapabilityMissing
src/api/{chats,pages}.js     会话列表（GET /api/chats，容忍多种包裹形态）/ 官方页面索引
src/boot/inject.js    全仓唯一允许 appendChild 的文件（1 个 style + manifest/图标链接）
src/env/viewport.js   唯一常驻几何 JS，只写 :root 的 CSS 变量
src/env/gesture.js    左缘手势状态机（监听全 passive，不 preventDefault）
src/env/drift.js      官方 bundle 指纹白名单 + 漂移告警（暴露 __mo2.drift）
src/legacy/click.js   全仓唯一允许与官方 DOM 交互的文件，且只允许 .click()
src/ui/{TopBar,FeatureSheet,BottomTabs,SessionDrawer,ToolsPage,selftest}.jsx
src/styles/{base,legacy}.css
frontend/index.js     esbuild 产物（单文件自包含 ESM，不含第二份 React）
```

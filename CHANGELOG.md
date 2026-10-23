# 变更日志

## v1.2.0（C 路线：功能升级）— 2026-10-23

用户拍板走 C 路线（升级功能，而不是只做「能用」），落点分三组：C1 官方 API 优先、C2 修边界、C3 兼容加固。

### C1 官方 API 优先

- **自绘会话栏 + 左右滑手势（C1-a）** 新增 `src/api/chats.js`（`GET /api/chats`，容忍 `{chats|items|sessions}` 包裹形态，按 pin/更新时间排序并分组）、`src/ui/SessionDrawer.jsx`（官方 `overlay.global` 槽里的 antd Drawer，左侧、宽 78%，条目点击走 `/chat/<chat id>`）、`src/env/gesture.js`（左缘 24vw 起手、90px 阈值、`|dx| > |dy|*1.2`、可横向滚动容器让路、手势后 400ms capture 吞 click、监听全 passive）。**不读不碰官方 DOM** —— 这是 v1 时代「点官方侧栏再藏回去」的替代品。
- **底部 Tab 导航（C1-b）** 新增 `src/ui/BottomTabs.jsx`：聊天 / 模型 / 设置三入口，路径全部来自官方 bundle 静态提取并逐个实测（`scripts/probe-routes.py`）。聊天页主动让位（那里底部是官方输入框，压上去就是「输入框被盖住」），导航由顶栏三键 + 左缘手势 + 面板「更多官方页面」承担。
- **官方侧栏菜单入口（C1-c）** 新增 `src/ui/ToolsPage.jsx` + `registerIntegration()`：用官方 `route.add` 注册自有路由 `/mo2`，再用官方 `menu.add` 挂三条入口（`primary.agentScoped` / `primary.settings` / `userMenu`）。纪律：**路由注册失败就不挂菜单**（实测未注册的 `/mo2` 是空白页，菜单点了会落空）。
- **模型弹窗键盘适配扩到全站（C1-d）** 从「只在 `/models` 起」改为全站常驻，且不随路由回收（`info.popupDisposable`）。官方模型弹窗在聊天页与 `/models` 都会出现，之前等于一半场景没覆盖。

### C2 修边界

- **深链 `/models` 再回聊天页需刷新一次（C2-e）** 根因：`/models` 分支提前 return，`info.cleaned` 从未置位，回聊天页时既没重注册 chrome 也没有回魂路径。v1.2.0 把激活面从「只在聊天路由」放宽为「除登录/鉴权页外都激活」（`gate.isBlockedRoute()`），chrome 常驻，问题从根上消失；`cleanup()`/`reactivate()` 保留，只服务登录页这个唯一让位场景。
- **功能面板扩容（C2-f）** 8 条 → 11 条：新增「会话列表」「移动端工具」，以及「更多官方页面」二级视图（12 个官方页面入口，`src/api/pages.js` 统一索引，路径均由 `probe-routes.py` 实测无 404）。

### C3 兼容加固

- **漂移韧性（C3-g）** `legacy/click.js` 每条信号链改多路回退（原始片段 → 无哈希裸模块名 → 文案兜底），并新增 `signalsReport()` 记录命中位置 `depth`：depth>0 = 正在吃兜底信号，自检 ㉖ 会先把这件事喊出来。新增 `src/env/drift.js`：官方 bundle 指纹白名单（`index-8OrhnpZF.js` / `index-BpFaGbCq.js`）与漂移告警，暴露到 `__mo2.drift` + 自检 ㉑，机器侧由 `scripts/drift-check.py` 每周比对落基线。
- **兼容区间收紧（C3-h）** `plugin.json` 的 `qwenpaw_version.max` 由乐观值 `2.4.0` 改为**实测上界** `2.2.2.post1`；插件侧自己读 `/api/version` 比对实测区间（自检 ㉒、工具页状态卡）。
- **元数据校正（C3-i）** 名称由「浏览器插件」改为「移动端优化 (Mobile Optimizer)」，描述与 features 对齐真实能力（`menu-api` / `route-api` / `session-drawer` / `edge-gesture` / `bottom-tabs` / `drift-guard`），版本 1.0.0 → 1.2.0。

### 验收

- 自检面板 16 项 → **26 项**（㉑ 漂移 ㉒ 版本区间 ㉓ 会话栏入口 ㉔ 底部 Tab ㉕ 官方菜单入口 ㉖ 信号链深度）。
- 新增 `scripts/g3-check.py`（WebKit 真引擎）：深链 `/models` 激活、回聊天不刷新、底部 Tab 往返导航、左缘手势开/关会话栏、条目跳会话、`/mo2` 自有路由渲染、官方菜单快照含本插件条目、PC 零足迹回归。
- 新增 `scripts/probe-routes.py`：官方页面可渲染性探针（选路径前先跑，不凭印象）。
- `accept.sh` 增加 G3 段；`g2-check.py` 基线 12 项不动（回归对照）。

## v1.0.0 增量（方案A：composer 三条目路由感知）— 2026-09-14 晚

手机实测截图暴露：在 `/models` 打开功能面板时，文件工作区/Loop/审批三项标「入口缺失」——根因是这三个官方触发器只随聊天页 composer 挂载，而顶栏插槽按钮在路由让位后仍残留可开面板。

- `legacy/click.js`：新增 `waitOfficial(key, timeoutMs)` —— 轮询等官方信号挂载后合成点击（铁律不变，不增删改官方节点）。
- `ui/FeatureSheet.jsx`：三条目三段式语义——聊天页有信号直接点；**非聊天页蓝色「需回聊天页」徽标且保留点击**（自动 `navigate('/')` → 代点）；聊天页真无信号才橙色「入口缺失」禁用。
- 前提实测（`mo2-tools/probe-popups.py`）：官方移动端把三触发器藏成 0×44（带 `mobileComposerControl` 类名），合成点击可弹出全部三个官方抽屉且落屏内。
- **回魂修复（同轮实测暴露的洞）** `src/index.js`：`watchRoute` 的 disposer 此前被收进 `info.disposables`，`cleanup()` 会连"回聊天页的唯一通道"一起杀掉 → chat→/models→chat 后插件永久僵尸（chrome 残留但样式/视口全摘）。现在监听器独立存活，新增 `reactivate()`：回到聊天页自动补挂核心（chrome 若已被官方真摘除则一并重注册），`__mo2.reactivations` 可观测。
- `scripts/g2-check.py`：新增 p3b（工作区弹层）/ p3c（审批弹层）断言，验收共 12 项。
- E2E 探针 `mo2-tools/probe-missing-entries.py`：/models 徽标计数 + 代点链路 + 回魂断言，三项全 PASS。

## v1.0.0 增量（路由避让 + SPA 清理 + 模型弹窗键盘适配）— 2026-09-14

本日改动此前只存在于安装目录，现收编入库（重建产物与线上逐字节一致，md5 `f0bcaffc`）。

### 新增

- **路由闸门** `src/gate.js`：`isChatRoute()` / `isModelsRoute()`。插件只在 `/`、`/chat`、`/chat/*` 生效；管理、设置等官方页面完全让位（不注样式、不建插槽），自检 blocked 增加「当前不是聊天页面，插件让位」。
- **模型弹窗键盘适配** `src/mobile-model-popup.js`：仅 `/models` 且键盘弹起（视口高度差 >80px）时，对原生 AntD 模型 Select 下拉做 iOS Safari 键盘避让；`data-mo2-model-popup` 标记 + WeakMap 保存/还原，离开即复原。
- **SPA 清理** `src/index.js`：`watchRoute()` 监听路由切换，`cleanup()` 统一回收 disposables、viewport 监听、`#qwenpaw-mo2-style`、`#qwenpaw-mo2-root` 与 head 注入物，杜绝跨路由残留。
- **注入物可识别** `src/boot/inject.js`：所有注入的 link/meta 打 `data-mo2` 属性，供 cleanup 精确移除。
- **验收登录态**（收编后追加）：`scripts/mo2_auth.py` 为 live/g2/webkit 三个 Playwright 验收脚本注入 Console 的 `qwenpaw_auth_token`（本机签发的 365 天专用 JWT，`backups/mo2-check-token.txt`，600 权限，可吊销可重签，不经手密码）。Auth 开启后 live-check 曾因 SPA 守卫被跳去 `/login` 误报 FAIL，现恢复 PASS；g2 十字全绿。

## v0.2.0（G1 骨架）— 2026-09-13

与 v1 并行的第二代实现，本版本**不改动任何用户可见界面**，只交付地基。

### 新增

- **官方扩展 API 薄封装** `src/api/qw.js`：`host/slot/menu/route/chat` 一律「调用时再取」，取不到即抛 `CapabilityMissing`，杜绝降级成 DOM 猜测。
- **生效闸门** `src/gate.js`：视口 ≤768px + iOS 26 能力基线（`CSS.supports('anchor-name')` / `:has()` / `dvh`）。判定不过 → 直接 return，不注入样式、不建 DOM、不加监听、不碰 console。
- **静态守卫** `scripts/guard.mjs`：四条硬约束变成构建失败（禁 `removeChild`/`insertBefore`；`appendChild` 白名单仅 `boot/inject.js`；禁 `import 'react'`；禁劫持 `console.error/warn`；官方类名字面量只准待在 `styles/legacy.css`）+ Observer 预算 0。
- **构建链** `scripts/build.mjs`：esbuild → 单文件自包含 ESM；JSX 编译为 `window.QwenPaw.host.React.createElement`，即 React 只在渲染时解析，产物不含第二份 React。
- **互斥守卫**：以服务端公开清单 `/api/frontend_plugin` 为准判定 v1 是否在 enabled 状态，在跑则 v2 主动让位 ⇒ 两个插件可同时安装，一键回滚安全。
- **PWA 资产**：`frontend/manifest.json`（名称 QwenPaw、`display: standalone`）+ 四张白底图标（官方 `online.svg` 经 headless Chromium 栅格化，`scripts/make-icons.sh`）；运行时注入 `<link rel=manifest>` 与 `apple-touch-icon`、`theme-color`。
- **自检面板** `src/ui/selftest.jsx`：URL 加 `?mo_selftest=1` → 经 `slot.fill('overlay.global')` 渲染 16 项 pass/fail（能力探测、样式生效、manifest 抓取、safe-area、键盘 delta、16px 防放大、standalone、互斥状态、bundle 指纹）。
- **视口测量** `src/env/viewport.js`：只写 `--mo2-kbd` 到 `:root`，不用 `visualViewport.height` 覆盖 `--mo2-vh`（dvh 已排除浏览器 UI，覆盖会让键盘弹起时面板塌陷）。
- **验收脚本** `scripts/webkit-check.py`：本地 Safari 26.5 引擎三场景（PC 零足迹 / 互斥让位 / 激活+自检）。
- **切换脚本** `scripts/switch.sh v1|v2`：靠目录 `.disabled` 后缀改启用状态，切换后重启 QwenPaw 生效。

### 修的问题（G1 验收暴露）

1. **互斥竞态**：原先只看 v1 注入的 `#qwenpaw-mo-style`，而 v1 在 `setTimeout(300ms)` 之后才注入，v2 判定早于它就抢跑了 → 两个插件同时改界面。改为以服务端插件清单为准。
2. **自检开关被 SPA 重定向吃掉**：官方前端把 `/` 重定向到 `/chat` 并丢 query，`?mo_selftest=1` 进去后失效。改为首次执行即落 `sessionStorage`（无痕模式抛错则降级只看 URL）。

## v0.2.0 G2（顶栏与功能面板）— 2026-09-13

按已确认决策实施：**面板入口放顶栏右侧**、**保留官方会话标题**（不隐藏任何标题类节点）。

### 新增模块

- `src/state.js`：极简外部 store + 官方 React 的 `useSyncExternalStore`。顶栏按钮（`header.right` 槽）与面板（`overlay.global` 槽）是两次独立注册、不在同一棵子树，靠它共享开合状态。
- `src/api/models.js`：模型全走官方 REST。契约从 bundle 与后端源码双向核实 —— `setActiveLlm = PUT /models/active`，body `{provider_id, model, scope, agent_id}`；**聊天页语义是 `scope:"agent"` + 当前 agent**（设置页才是 global）；切换成功后必须派发 `model-switched` 事件，否则官方 UI 不刷新。列表侧只保留有模型的供应商，模型取 `models ∪ extra_models ∪ discovered_models` 按 id 去重。
- `src/api/nav.js`：官方 route API 只有 add/replace/wrap/remove、**没有 navigate**，且实测侧栏无任何 `<a href>` 可借 → `pushState` + 派发 `popstate`，400ms 后核对 pathname，没动就退回 `location.assign`。
- `src/legacy/click.js`：**全仓唯一**允许与官方 DOM 交互的文件，且只允许 `.click()`（合成点击不改 DOM 结构，不会让 React 抛 NotFoundError）。定位信号优先用 CSS Modules 的**模块名片段**（`modeTrigger` / `ApprovalToggle-module__trigger` / `SessionProjectDirectory-module__trigger`，跨构建稳定，只有 `__哈希` 变），`aria-label` 中文文案只作兜底。
- `src/ui/TopBar.jsx`：`header.right` 槽里的两个 antd Button（新建对话 / 功能面板），带 `aria-label="mo2-*"` 前缀便于自检定位。
- `src/ui/FeatureSheet.jsx`：`overlay.global` 槽里的 antd `Drawer(placement=bottom)` + `List`，8 类条目。**诚实降级**：依赖官方控件的条目在信号找不到时显示「入口缺失」并禁用，绝不出现"点了没反应"的死按钮。
- `src/styles/legacy.css`：新建，是全仓唯一允许官方类名的文件，当前 2 条规则（上限 6）。
- 自检面板从 16 项扩到 **20 项**：⑰ 顶栏入口已渲染且可见（量 rect）· ⑱ 官方插槽注册全部成功 · ⑲ 模型 API 可达（真拉一次 active）· ⑳ 官方合成点击入口在位（n/4）。
- `scripts/g2-check.py`：真点一遍的交互验收（顶栏→面板→Loop 弹层几何→模型视图下拉→输入框下方剩余项），并抓 `pageerror`。

### 一个关键取舍（避免重演 v0.1.78）

隐藏输入框下方多余控件时**不能用 `display:none`**：元素失去盒子后，官方弹层按 `getBoundingClientRect` 定位会退化到 `(0,0)` 而整层飞出屏幕。`legacy.css` 改为把盒子压成 0 宽（`width/padding/margin/border/font-size` 归零 + `overflow:hidden`），**保留其在输入框行里的原位**，弹层仍锚在屏内。

### G2 验收抓到的真 bug（已修）

**模型选择器显示原始 key、且点选会静默失效**：`buildOptions()` 里 option 的 `value` 只放模型 id，而 `onPick()` 按 `provider::model` 拆分解析 —— 用户从下拉里选一个模型，`split('::')` 得到 `length < 2`，函数**直接 return，什么都没发生**：不报错、不请求、不提示。这是最坏的一种失效（看起来能用）。

修法：option 的 `value` 统一为 `provider_id + '::' + model`（不同供应商可能有同名模型，裸 id 也会互相撞车），并加两层防御：
- `optionsWithActive()`：当前 active 模型若不在任何 provider 的列表里（自定义/新配模型），Select 找不到 option 会把 `cavoti::qwen3.8-flash` 这种原始串直接显示出来 → 兜底插入「当前模型」分组；
- 验收脚本加回归断言 `modelValueReadable`：显示值里出现 `::` 即判 FAIL。

> 这个 bug 是**诊断脚本量出来的**，不是看出来的：截图里 Select 的文本是 `cavoti::qwen3.8-flash` 才暴露"value/label 不匹配"。教训：交互验收必须断言"显示的是人可读的值"，只断言"能打开、有选项"会放过它。

## v0.2.0 G3（会话栏与手势）— 2026-09-13

按已确认决策实施：**自绘覆盖式会话栏（不沿用官方侧栏）**、**不分组**（只按 置顶 + 最近活跃排序）、**「更多功能」放功能面板**（顶栏不加码）。

### 新增

- `src/api/chats.js`：`GET /api/chats?archived=false&include_app_owned=false` + `GET /api/chats/groups`，归一化层对缺字段给默认值；`sortChats()` 置顶优先、其次最近活跃；`currentChatId()` 从 `location.pathname` 取。
  **踩过的坑写进注释**：`/api/chat/sessions` 是 404（bundle 里那是 PawApp 客户端的相对路径，基址不同）；`host.getCurrentSessionId()` 返回的是 `session_id`（如 `1789268516028-mhqocyk`），**与 URL 里的 chat id 不是一个东西**，拿它做高亮会永远不亮。
- `src/ui/SessionDrawer.jsx`：`overlay.global` 里的 antd `Drawer(placement=left, width=min(320px,86vw), destroyOnClose, rootClassName="mo2-drawer mo2-sider")` + `Input` 搜索 + `List`（当前会话高亮、channel/相对时间、置顶标记）+ 底部「新建会话」「管理全部会话 → /sessions」；拉取失败显示错误条 + 重试按钮，**绝不白屏**。
- `src/env/gesture.js`：Pointer Events 右滑开 / 左滑关，驱动我们自己的 state。参数与判定沿用 v1 真机教训：固定 90px 阈值（不用 50% 屏宽）、起点限制左缘 24vw 内以避开 iOS 边缘返回手势、横向可滚动容器与输入区让位、滑动后 400ms 幽灵点击抑制（capture 阶段吞 click）。
- 顶栏新增第三个按钮「会话栏」（`aria-label="mo2-会话栏"`），与手势互为兜底入口。
- 功能面板新增「更多功能」二级视图：10 个官方页面入口，路径取自 bundle 静态提取的真实路由表（`/inbox` `/sessions` `/skills` `/mcp` `/agents` `/channels` `/cron-jobs` `/token-usage` `/security` `/files`），**全部 `navigate(path)`，零 DOM 耦合** —— 彻底取代 v1 的「采集图标条按钮 + 合成点击」。
- 自检面板 20 → **24 项**：㉑ 会话 API 可达 · ㉒ 会话栏已注册 · ㉓ 当前会话高亮正确 · ㉔ 手势监听已挂载。
- `scripts/g3-check.py`：按钮开栏 → 列表/高亮/底部入口 → 点会话切 `/chat/<id>` 并自动关栏 → 搜索过滤 → **合成 pointer 右滑开、左滑关** → 图标条已隐藏 → composer 有 transform → 自检 24 项无 FAIL → 无 pageerror。

### legacy.css 2 → 4 条（预算 6）

- 规则 3：`[class*="sender"] { transform: translateY(calc(-1 * var(--mo2-kbd))) }` —— Safari 不支持 `interactive-widget=resizes-content`，键盘弹起只缩 `visualViewport`，必须自己抬；用 transform 不改布局避免整页重排。
- 规则 4：`[class*="collapsedNav"] { display:none }` —— 56px 图标条让位给自绘会话栏。**这条在 v1 是事故源**（隐藏后官方展开按钮不可达 → 侧栏再也打不开，v0.1.81/82 两轮返工）；v2 之所以安全，是因为入口换成"顶栏按钮 + 手势"，与官方侧栏彻底解耦，且自检 ㉒/㉔ 会盯着我们的栏能不能开。

## 1.0.0（定稿发布）— 2026-09-13

按决策收尾：**版本号 1.0.0**、**v1 直接删除不保留**、**源码建 git 仓库**、**单独摘回键盘抬升 CSS**。

### 变更

- 版本 `0.2.0 → 1.0.0`（`src/version.js` / `plugin.json` 同步；`qwenpaw_version` 仍 `{min:2.2.0, max:2.4.0}`）。
- **G3 全部撤销**：自绘会话栏、右滑/左滑手势、面板「更多功能」二级视图、顶栏第三按钮、隐藏 56px 图标条 —— 源码内 `SessionDrawer / mo2-sider / MORE_PAGES / ㉑ / collapsedNav` 残留 0 命中，产物回到 15 个源文件。完整实现归档在 `workspaces/default/backups/mo2-v2-g3-20260913-180850/`（当时验收 15/15 PASS，含 `g3-check.py` 可原样恢复）。
- **摘回一条 G3 规则**：`legacy.css` 规则 3 = 键盘弹起时 `[class*="sender"] { transform: translateY(calc(-1 * var(--mo2-kbd))) }`。它与会话栏无关、独立有效，所以只留它（规则数 3/6）。
- **v1 已删除**：`plugins/qwenpaw-mobile-optimizer.disabled` 从磁盘移除。删除前先打包并校验 —— `backups/qwenpaw-mobile-optimizer-v1-final-20260913-182505.zip`（3 个文件，zip 内 `index.js` md5 = `fda2182ed9a6146569006653a7ca11d6`，与 v0.1.83 上线版逐字节一致）。
- **发布流水线** `scripts/release.sh`：守卫 → 构建 → `node --check` → 热加载并校验服务端返回版本 → 内网+公网隧道 md5 比对 → 交互验收；任一步失败即中止。
- **漂移巡检** `scripts/drift-check.py` + cron「移动端插件漂移巡检」（每周一 09:00，silent，telegram）：比对官方主 bundle 指纹并跑交互验收，退出码 0/2/3 分别对应 静默 / 上游变了但仍全绿(告知) / 验收失败(告警)。这是针对"2.2.1 升级连坏两轮"的结构性保险。
- **git 仓库**：插件目录 `git init`，37 个文件入库，提交信息含架构决策与"为什么不用 display:none"等关键约束，打 tag `v1.0.0`。
- **文档定稿**：README 重写为使用者视角（怎么用、怎么加主屏幕、出问题先开 `?mo_selftest=1`）+ 已知边界清单 + 回滚与恢复章节；把"不做的事"写明，避免日后被当 bug 报。

### 过程中修掉的两个自伤

1. **cron 文本被 shell 提前展开**：创建任务时 `--text "...echo EXIT=$?"` 用了双引号，`$?` 在创建那一刻就被展开成 `EXIT=0` 写进了任务里 —— 巡检会永远以为"退出码 0"。改用单引号重建并核对存库文本为字面 `$?`。
2. **验收脚本抖动**：`g2-check.py` 的 Loop 弹层判定用固定 `sleep 1.7s`，一次跑出了 FAIL 而同一脚本几分钟前 10/10 PASS。改成**轮询等待 + 失败重试一次**，并连跑两次验证稳定性 —— 验收脚本要进 cron，不消除抖动就是每周误报。

### 收尾后补：G3 彻底删除 + 验收脚本二次消抖（同日）

- **G3 按指示立刻删除**：归档 `backups/mo2-v2-g3-20260913-180850/`（47 个文件）已移除，磁盘无残留。设计要点保留在 `memory/2026-09-13-g3-sider-gesture.md`，需要时重写。
- **README/MEMORY 同步纠正**：原文写"G3 归档可一键恢复"，删除后若不改动，未来的我会以为还能拷回来 —— 已改为"已删除，重做请依据记录的设计要点"。
- **`g2-check.py` 的动画误判（我自己引入的回归，值得记住）**：
  1. 原实现固定 `sleep 1.7s` 恰好躲过官方抽屉上滑动画 → 10/10 PASS；
  2. 我为"消抖"改成"轮询到元素出现即取样" → 在动画起始帧取到 `y=714`（视口下沿）→ 3/3 稳定 FAIL；
  3. 再改成"连续两帧几何相同" → 仍偶发 FAIL，因为抽屉"**已挂载但还没开始动**"时两帧自然相同；
  4. 最终 = **先 500ms 沉降，再要求连续两帧 rect 相同**，连跑 3 次全 PASS 且无需重试。
  教训：给"等待动画完成"写判据时，"存在"和"两帧相同"都不足以证明动画已结束；而把断言条件（在屏内）直接写进等待条件会让测试失去意义。

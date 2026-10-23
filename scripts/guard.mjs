// 四条硬约束的静态守卫（G1 交付物之一）。命中即构建失败——把「口头纪律」变成机器闸门。
// ① 禁 removeChild / insertBefore / appendChild（白名单：src/boot/inject.js）
// ② 禁 import 'react' / 'react-dom'（React 必须走 window.QwenPaw.host，杜绝第二份 React）
// ③ 禁 new MutationObserver（G1 允许数量 = 0）
// ④ 禁劫持 console.error / console.warn（v0.1.79~82 埋点常驻、破坏 PC 零影响的根因）
// ⑤ 禁 qwenpaw- 字面量（白名单：src/styles/legacy.css，尚未创建 => 实际为 0）

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SRC = join(ROOT, 'src');

const APPEND_OK = new Set(['src/boot/inject.js']);
const MAX_OBSERVERS = 0;

const RULES = [
  { id: 'no-removeChild', re: /\.removeChild\(|\.insertBefore\(/g, allow: new Set(), msg: '禁删/插官方节点（React 管理，删则整树崩）' },
  { id: 'no-append-child', re: /\.appendChild\(/g, allow: APPEND_OK, msg: 'appendChild 只允许出现在 boot/inject.js' },
  { id: 'no-react-import', re: /from\s+['"]react(-dom)?['"]/g, allow: new Set(), msg: '禁 import react/react-dom，必须用 window.QwenPaw.host' },
  { id: 'no-console-hijack', re: /console\.(error|warn)\s*=/g, allow: new Set(), msg: '禁劫持 console（埋点常驻的来源）' },
];

// ⑤ 官方 DOM 类名只准待在 styles/legacy.css。
// 规则语义要精确：本插件自己的 id、以及探测 v1 用的 id（qwenpaw-mo-*）不算「官方类名」，
// 真正的耦合风险是 qwenpaw-popover / qwenpaw-dropdown / qwenpaw-tooltip / qwenpaw-layout-sider 这类。
const OWN_PREFIX = /^qwenpaw-(mo2|mo-|mobile-optimizer)/i;
const OFFICIAL_CLASS = ['src/styles/legacy.css'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

let violations = 0;
const files = walk(SRC);
let observerCount = 0;

for (const abs of files) {
  const rel = relative(ROOT, abs);
  const src = readFileSync(abs, 'utf8');
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(src))) {
      if (rule.allow.has(rel)) continue;
      // 允许注释里出现关键词（文档说明），排除行首为 * 或 // 的行
      const line = src.slice(0, m.index).split('\n').pop() || '';
      if (/^\s*(\*|\/\/|\/\*)/.test(line)) continue;
      violations++;
      console.log(`✗ [${rule.id}] ${rel}: ${rule.msg}\n    ${line.trim().slice(0, 120)}`);
    }
  }
  observerCount += (src.match(/new MutationObserver/g) || []).length;

  // ⑤ 官方类名字面量扫描（区别于本插件自有 id）
  const litRe = /['"`]([^'"`\n]*qwenpaw-[^'"`\n]*)['"`]/g;
  let mm;
  while ((mm = litRe.exec(src))) {
    const val = mm[1];
    if (OWN_PREFIX.test(val)) continue;
    if (OFFICIAL_CLASS.includes(rel)) continue;
    const line = src.slice(0, mm.index).split('\n').pop() || '';
    if (/^\s*(\*|\/\/|\/\*)/.test(line)) continue;
    violations++;
    console.log(`✗ [no-official-class] ${rel}: 官方类名只准待在 styles/legacy.css\n    "${val}"`);
  }
}

if (observerCount > MAX_OBSERVERS) {
  violations++;
  console.log(`✗ [observer-budget] src/ 内 new MutationObserver 共 ${observerCount} 个，上限 ${MAX_OBSERVERS}`);
}

// ⑥ legacy.css 规则数预算：官方类名耦合是"债"，必须可量化、只能减不能涨。
// 计数口径：缩进 2 空格的 `}` 视为一条规则块结束（本文件结构固定，够用）。
const MAX_LEGACY_RULES = 6;
try {
  const legacy = readFileSync(join(SRC, 'styles', 'legacy.css'), 'utf8');
  const n = (legacy.match(/^ {2}\}/gm) || []).length;
  if (n > MAX_LEGACY_RULES) {
    violations++;
    console.log(`✗ [legacy-budget] legacy.css 规则 ${n} 条，上限 ${MAX_LEGACY_RULES}`);
  } else {
    console.log(`· legacy.css 规则 ${n}/${MAX_LEGACY_RULES}`);
  }
} catch (e) {
  console.log('· legacy.css 尚未创建（0 条官方类名耦合）');
}

// ⑦ 插件目录内禁止存在 .git：该目录下任何文件都会被公开静态端点 serve，
//    包括 .git/HEAD、.git/config（实测曾被无鉴权抓到）→ 仓库数据必须放在插件目录之外。
if (existsSync(join(ROOT, '.git'))) {
  violations++;
  console.log('✗ [no-git-in-plugin] 插件目录内不得存在 .git（会被公开端点下载）；请用 scripts/mo2-git.sh');
}

if (violations) {
  console.log(`\n守卫失败：${violations} 处违规`);
  process.exit(1);
}
console.log(`✓ 守卫通过（扫描 ${files.length} 个源文件，Observer ${observerCount}/${MAX_OBSERVERS}）`);

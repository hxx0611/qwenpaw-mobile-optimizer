// v0.2 构建：源码 → 单文件 ESM（官方前端用 blob URL 动态 import，相对 import 会失效，
// 所以产物必须自包含）。React/antd 一律不打包，JSX 编译成 window.QwenPaw.host.React.createElement
// —— 即 React 只在渲染调用时解析，不存在「模块求值时 host 还没就绪」的时序问题。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const ESB = '/app/user-packages/node/bin/esbuild';
const OUT = join(ROOT, 'frontend', 'index.js');

function run(args) {
  return execFileSync(ESB, args, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

const jsxFlags = [
  '--jsx=transform',
  '--jsx-factory=window.QwenPaw.host.React.createElement',
  '--jsx-fragment=window.QwenPaw.host.React.Fragment',
];

let out;
try {
  // 注意：execFileSync 指定 encoding 时直接返回 stdout 字符串（不是 {stdout} 对象）
  out = run([
    'src/index.js',
    '--bundle',
    '--format=esm',
    '--target=safari17',
    '--loader:.css=text',
    '--loader:.js=jsx',
    ...jsxFlags,
    '--legal-comments=none',
  ]);
} catch (e) {
  console.error('esbuild 失败：\n' + (e.stderr || e.stdout || e.message));
  process.exit(1);
}
if (typeof out !== 'string' || out.length < 500) {
  console.error('✗ 产物异常（过短或非字符串），终止');
  process.exit(1);
}

const version = readFileSync(join(ROOT, 'src/version.js'), 'utf8').match(/'([\d.]+)'/)[1];
const body =
  `/* 浏览器插件 (Mobile Optimizer v2) v${version} — 构建产物，请勿直接编辑，源码见 src/\n` +
  `   由 scripts/build.mjs 生成；改代码后必须重新构建再热加载。 */\n` +
  out;

mkdirSync(join(ROOT, 'frontend'), { recursive: true });
writeFileSync(OUT, body, 'utf8');

execFileSync('node', ['--check', OUT], { stdio: 'inherit' });
const kb = (Buffer.byteLength(body, 'utf8') / 1024).toFixed(1);
console.log(`✓ 构建完成 frontend/index.js （${kb} KB, v${version}）`);
if (/from\s+["']react["']|SECRET_INTERNALS/.test(body)) {
  console.error('✗ 产物里混进了 React，终止');
  process.exit(1);
}

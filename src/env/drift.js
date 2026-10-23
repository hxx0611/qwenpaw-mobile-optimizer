// 漂移监测（C3-g / C3-h）：只读，不改官方任何东西，不用 Observer。
//   · bundle 指纹：官方前端每次构建都会换 index-<hash>.js。换成未知指纹 = 官方代码变了，
//     我们的信号/插槽假设需要复核 → 插件侧先告警（暴露到 __mo2.drift 与自检面板），
//     机器侧由 scripts/drift-check.py 每周比对并落基线。
//   · 平台版本区间：plugin.json 声明的 qwenpaw_version.max 只是元数据（官方不拦），
//     所以这里自己读 /api/version 跟「实测上界」比，越界就在自检面板标 FAIL。
//     v1.2.0 起 max 从 2.4.0 收紧为实测上界 2.2.2.post1（原来那个 2.4.0 是没验证过的乐观值）。

export var KNOWN_BUNDLES = ['index-8OrhnpZF.js', 'index-BpFaGbCq.js'];
export var TESTED_MAX = '2.2.2.post1';
export var TESTED_MIN = '2.2.0';

// 官方主 bundle 文件名：link/script 里带 assets/index-<hash>.js 的那个
export function fingerprint() {
  try {
    var els = document.querySelectorAll('link[href*="assets/index-"], script[src*="assets/index-"]');
    for (var i = 0; i < els.length; i++) {
      var h = els[i].getAttribute('href') || els[i].getAttribute('src') || '';
      var m = /index-[A-Za-z0-9_-]+\.js/.exec(h);
      if (m) return m[0];
    }
  } catch (e) {}
  return '未知';
}

export function bundleCheck() {
  var name = fingerprint();
  var known = KNOWN_BUNDLES.indexOf(name) >= 0;
  return {
    bundle: name,
    known: known,
    unknown: !known && name !== '未知',
    hint: known ? '' : '官方 bundle 指纹未知 → 插槽/信号假设需复核（跑 scripts/drift-check.py）',
  };
}

// 版本比较：容忍 "2.2.2.post1" 这种 PEP440 尾巴（官方 /api/version 就是它）。
function parts(v) {
  var m = /^(\d+)\.(\d+)\.(\d+)(?:\.?(?:post|rc|a|b)(\d+))?/.exec(String(v || ''));
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 0, /post/.test(String(v)) ? 1 : 0];
}

export function cmp(a, b) {
  var x = parts(a);
  var y = parts(b);
  if (!x || !y) return 0;
  for (var i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  }
  return 0;
}

// 平台版本：公开端点 /api/version（无需鉴权），失败返回 null 而不是抛错。
export async function platformVersion() {
  try {
    var r = await fetch('/api/version');
    if (!r.ok) return null;
    var j = await r.json();
    return (j && (j.version || j.qwenpaw_version || (j.data && j.data.version))) || null;
  } catch (e) {
    return null;
  }
}

export async function compat() {
  var v = await platformVersion();
  if (!v) return { version: null, min: TESTED_MIN, max: TESTED_MAX, ok: false, err: '/api/version 不可读' };
  var okMin = cmp(v, TESTED_MIN) >= 0;
  var okMax = cmp(v, TESTED_MAX) <= 0;
  return {
    version: v,
    min: TESTED_MIN,
    max: TESTED_MAX,
    ok: okMin && okMax,
    err: okMin && okMax ? '' : '平台版本超出实测区间（实测 ' + TESTED_MIN + ' ~ ' + TESTED_MAX + '）',
  };
}
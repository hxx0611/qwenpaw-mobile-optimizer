// ⚠️ 全仓唯一允许「与官方 DOM 交互」的文件。只做一件事：找到官方控件并 .click()。
// 铁律：绝不增删改官方节点（那是 v0.1.59→v0.1.80 整树崩溃的根因）。合成点击不改变 DOM 结构，
//      React 不会因此抛 NotFoundError；display:none 也不影响 .click() 派发（v0.1.82 已验证）。
//
// 定位信号优先级：CSS Modules 的【模块名片段】优先于 aria-label ——
//   模块名（modeTrigger / ApprovalToggle-module__trigger）跨构建稳定，只有 __哈希 后缀会变；
//   aria-label 是中文文案，官方换措辞或切英文就失效。两类信号都给，命中任一即用。
//
// C3-g 漂移韧性：每条信号链都是「多路回退」——首选有证据的原始信号，其次是无哈希的裸模块名，
// 最后才是文案类兜底。命中位置（depth）会被 signalsReport() 记录下来：depth>0 = 我们在吃兜底，
// 官方一旦真改结构，self-test ㉖ 会先把这件事喊出来，而不是等用户点不动了才发现。

export const SIGNALS = {
  newChat: [{ cls: 'newChat' }, { cls: 'newChat-module' }, { aria: '新建任务' }, { aria: 'New task' }, { aria: 'New chat' }],
  workspace: [
    { cls: 'SessionProjectDirectory-module__trigger' },
    { cls: 'ProjectDirectory' },
    { aria: '当前会话项目目录' },
    { aria: '项目目录' },
  ],
  loopMode: [{ cls: 'modeTrigger' }, { cls: 'loopTrigger' }, { aria: '选择 Loop 模式' }, { aria: 'Loop' }],
  approval: [{ cls: 'ApprovalToggle-module__trigger' }, { cls: 'ApprovalToggle' }, { aria: '工具审批模式' }, { aria: '审批模式' }],
};

function firstVisible(sel) {
  var els;
  try {
    els = document.querySelectorAll(sel);
  } catch (e) {
    return null;
  }
  for (var i = 0; i < els.length; i++) {
    var r = els[i].getBoundingClientRect();
    // 允许 0x0 的隐藏元素：合成点击对 display:none 依然有效，且官方把入口收进了图标条
    if (r.width > 0 && r.height > 0) return els[i];
  }
  return els.length ? els[0] : null;
}

export function findOfficial(key) {
  var sig = SIGNALS[key];
  if (!sig) return null;
  for (var i = 0; i < sig.length; i++) {
    var sel = sig[i].aria ? '[aria-label="' + sig[i].aria + '"]' : '[class*="' + sig[i].cls + '"]';
    var el = firstVisible(sel);
    if (el) return { el: el, via: sig[i].aria ? 'aria' : 'cls', sel: sel, depth: i, weak: i > 0 };
  }
  return null;
}

// 漂移视图（self-test ㉖ / probe-dom 用）：谁在用兜底信号，一眼可见。只读。
export function signalsReport() {
  var out = {};
  Object.keys(SIGNALS).forEach(function (k) {
    var hit = findOfficial(k);
    out[k] = hit
      ? { found: true, via: hit.via, depth: hit.depth, sel: hit.sel, weak: hit.weak }
      : { found: false, via: 'none', depth: -1, sel: '', weak: true };
  });
  return out;
}

// 返回 {ok, via} 或 {ok:false}；调用方据此决定"这条目不可用"还是执行成功
export function clickOfficial(key) {
  var hit = findOfficial(key);
  if (!hit) return { ok: false, via: 'none' };
  try {
    hit.el.click();
    return { ok: true, via: hit.via };
  } catch (e) {
    return { ok: false, via: 'error:' + ((e && e.message) || e) };
  }
}

export function availability() {
  var out = {};
  Object.keys(SIGNALS).forEach(function (k) {
    out[k] = !!findOfficial(k);
  });
  return out;
}

// 「先回聊天页再代点」用：轮询等官方信号挂载（composer 路由切换后才渲染），出现即合成点击。
// 返回 Promise<{ok, via}>；via='timeout' 表示超时仍未出现。绝不增删改官方节点，铁律同 clickOfficial。
export function waitOfficial(key, timeoutMs) {
  var limit = timeoutMs || 5000;
  return new Promise(function (resolve) {
    var t0 = Date.now();
    (function step() {
      var hit = findOfficial(key);
      if (hit) {
        try {
          hit.el.click();
          resolve({ ok: true, via: hit.via });
        } catch (e) {
          resolve({ ok: false, via: 'error:' + ((e && e.message) || e) });
        }
        return;
      }
      if (Date.now() - t0 > limit) {
        resolve({ ok: false, via: 'timeout' });
        return;
      }
      setTimeout(step, 200);
    })();
  });
}

// 自检面板：把「只能靠真机肉眼验收」变成「机器可读的 16 项 pass/fail」。
// 这是 v0.1.x 最大的方法论教训（Chromium 40+ 轮、WebKit 12 轮全假阴性）的结构性补偿。
// 只在 URL 带 ?mo_selftest=1 时渲染；只读本机，不外传任何数据。

import { VERSION } from '../version.js';
import { probe } from '../api/qw.js';
import { decide, legacyActive } from '../gate.js';
import { STYLE_ID, manifestHref } from '../boot/inject.js';
import { snapshot as vpSnap } from '../env/viewport.js';
import { availability } from '../legacy/click.js';
import { getActive } from '../api/models.js';

function bundleFingerprint() {
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

function cssVarMarker() {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--mo2-marker').trim();
  } catch (e) {
    return '';
  }
}

function manifestFetched() {
  try {
    var list = performance.getEntriesByType('resource') || [];
    for (var i = 0; i < list.length; i++) {
      if (/manifest\.json/.test(list[i].name)) return list[i].name;
    }
  } catch (e) {}
  return '';
}

function standalone() {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch (e) {}
  return !!(window.navigator && window.navigator.standalone === true);
}

function supports(prop, val) {
  try {
    return !!(window.CSS && CSS.supports && CSS.supports(prop, val));
  } catch (e) {
    return false;
  }
}

export function collect(safeProbeEl, extra) {
  var p = probe();
  var d = decide();
  var vp = vpSnap();
  var items = [];

  function push(name, ok, detail, warn) {
    items.push({ name: name, status: ok ? 'pass' : warn ? 'warn' : 'fail', detail: detail == null ? '' : String(detail) });
  }

  push(
    '① 环境指纹',
    true,
    'bundle ' + bundleFingerprint() + ' · v' + VERSION,
  );
  items[0].status = 'pass';

  push('② 视口 ≤768px', window.innerWidth <= 768, window.innerWidth + 'x' + window.innerHeight, true);
  push('③ CSS anchor-name (iOS26 基线)', supports('anchor-name', '--mo2-a'), supports('anchor-name', '--mo2-a') ? 'supported' : '不支持→v0.2 拒载');
  push('④ CSS dvh', supports('height', '100dvh'), supports('height', '100dvh') ? 'supported' : '不支持');
  push(
    '⑤ host.React / antd / api',
    p['host.React'] && p['host.antd'] && p['host.getApiUrl'] && p['host.getApiToken'],
    Object.keys(p)
      .filter(function (k) { return k.indexOf('host.') === 0; })
      .map(function (k) { return k.replace('host.', '') + '=' + (p[k] ? 'y' : 'n'); })
      .join(' '),
  );
  var via = ((window.__mo2 || {}).selftest || {}).via || '(未渲染)';
  push('⑥ slot.fill(overlay.global) 生效', via === 'slot', '本面板渲染方式=' + via);
  push('⑦ menu.snapshot 可枚举', !!p.menu, p.menu ? 'menu 在位' : 'menu 缺失');
  push('⑧ route API 在位', !!p.route, 'route.wrap=' + (p['route.wrap'] ? 'y' : 'n') + '（本轮决策：只叠加不包装）');
  push('⑨ chat API 在位', !!p.chat, 'sender=' + (p['chat.sender'] ? 'y' : 'n') + ' actions=' + (p['chat.actions'] ? 'y' : 'n') + ' card=' + (p['chat.card'] ? 'y' : 'n'));
  push('⑩ 自注入样式生效', cssVarMarker() === 'mo2-ok', cssVarMarker() || '(空)');
  var mf = manifestFetched();
  push('⑪ manifest 已被抓取', !!mf, mf ? mf.split('/').slice(-2).join('/') : '(未抓取) link=' + (manifestHref() ? 'y' : 'n'), !manifestHref());
  push('⑫ 与 v1 互斥（v1 应停）', !legacyActive(), legacyActive() ? 'v1 仍在运行 → v2 让位' : 'v1 未运行', legacyActive());
  push(
    '⑬ 键盘 delta（点下方输入框）',
    vp.kbdMax > 50,
    'max kbd=' + vp.kbdMax + 'px · vh=' + vp.vh + ' · inner=' + vp.inner,
    vp.kbdMax === 0,
  );
  var safe = [0, 0, 0, 0];
  try {
    if (safeProbeEl) {
      var cs = getComputedStyle(safeProbeEl);
      safe = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
    }
  } catch (e) {}
  var safeNonZero = safe.some(function (v) {
    return parseFloat(v || '0') > 0;
  });
  push('⑭ safe-area 非零（真机应有值）', safeNonZero, 'top/r/b/l=' + safe.join('/'), !safeNonZero);
  var fs = '';
  var ok16 = false;
  try {
    var el = document.querySelector('.mo2-probe-input');
    if (el) {
      fs = getComputedStyle(el).fontSize;
      ok16 = parseFloat(fs) >= 16;
    }
  } catch (e) {}
  push('⑮ 输入框 ≥16px（防 iOS 聚焦放大）', ok16, fs || '(未见测试输入框)');
  push('⑯ standalone（加主屏幕后为真）', standalone(), standalone() ? 'standalone' : 'browser（Safari 标签页内）', !standalone());

  // ---- G2 新增 ----
  var topBtn = null;
  try {
    topBtn = document.querySelector('[aria-label="mo2-功能面板"]');
  } catch (e) {}
  var rect = topBtn ? topBtn.getBoundingClientRect() : null;
  push(
    '⑰ 顶栏入口已渲染且可见',
    !!(rect && rect.width > 0 && rect.height > 0),
    rect ? Math.round(rect.x) + ',' + Math.round(rect.y) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height) : '未找到',
  );
  var ch = (window.__mo2 || {}).chrome || [];
  push(
    '⑱ 官方插槽注册全部成功',
    ch.length > 0 && ch.every(function (r) { return r.ok; }),
    ch.length ? ch.map(function (r) { return r.name + '=' + (r.ok ? 'y' : 'n'); }).join(' ') : '(未注册)',
  );
  var ex = extra || {};
  push('⑲ 模型 API 可达', !!ex.model, ex.model ? ex.provider_id + ' / ' + ex.model : ex.err || '读取中…');
  var av = {};
  try {
    av = availability();
  } catch (e) {}
  var avKeys = Object.keys(av);
  var avOk = avKeys.filter(function (k) { return av[k]; });
  push(
    '⑳ 官方合成点击入口在位',
    avKeys.length > 0 && avOk.length === avKeys.length,
    avOk.length + '/' + avKeys.length + (avOk.length === avKeys.length ? '' : ' 缺:' + avKeys.filter(function (k) { return !av[k]; }).join(',')),
    avOk.length > 0 && avOk.length < avKeys.length,
  );

  return items;
}

export function SelfTest(props) {
  var R = window.QwenPaw.host.React;
  var useState = R.useState;
  var useEffect = R.useEffect;
  var useRef = R.useRef;
  var ref = useRef(null);
  var st = useState(0);
  var tick = st[0];
  var setTick = st[1];
  var _m = useState(null);
  var minfo = _m[0];
  var setMInfo = _m[1];
  var items = collect(ref.current, minfo);
  // 拉当前 active 模型（自检项⑲）
  useEffect(function () {
    var stop = false;
    getActive()
      .then(function (j) {
        if (stop) return;
        var a = (j && j.active_llm) || {};
        setMInfo({ model: a.model || '', provider_id: a.provider_id || '' });
      })
      .catch(function (e) {
        if (!stop) setMInfo({ err: String((e && e.message) || e) });
      });
    return function () {
      stop = true;
    };
  }, [tick]);
  // 首帧后重算一次：computed style（safe-area / --mo2-marker / 字号）要等样式真正应用才读得准。
  useEffect(function () {
    var t = setTimeout(function () {
      setTick(tick + 1);
    }, 300);
    return function () {
      clearTimeout(t);
    };
  }, []);
  var passed = items.filter(function (i) {
    return i.status === 'pass';
  }).length;
  var warned = items.filter(function (i) {
    return i.status === 'warn';
  }).length;
  var Antd = null;
  try {
    Antd = window.QwenPaw.host.antd;
  } catch (e) {}
  var Tag = Antd && Antd.Tag;

  return (
    <div className="mo2-selftest" data-tick={tick}>
      <h3>
        浏览器插件 v{VERSION} 自检 · {passed}/{items.length} PASS
        {warned ? ' · ' + warned + ' WARN' : ''}
      </h3>
      {items.map(function (it, i) {
        return (
          <div className="mo2-row" key={i}>
            <span className={'mo2-tag mo2-' + it.status}>{it.status.toUpperCase()}</span>
            <span className="mo2-name">{it.name}</span>
            {Tag ? <Tag color={it.status === 'pass' ? 'success' : it.status === 'warn' ? 'warning' : 'error'}>{it.detail}</Tag> : <span className="mo2-detail">{it.detail}</span>}
          </div>
        );
      })}
      <input className="mo2-probe-input" placeholder="点我：测键盘 delta 与 16px 字号" />
      <div className="mo2-safe-probe" ref={ref} />
      <div className="mo2-actions">
        <button onClick={() => setTick(tick + 1)}>重新检测</button>
        <button onClick={() => window.location.reload()}>刷新页面</button>
      </div>
    </div>
  );
}

// 全仓【唯一】被允许操作 document.head / 建挂载点的文件（由 scripts/guard.mjs 强制）。
// 只做三件事：注入一个 <style>、注入 manifest 与图标链接、建一个自有挂载点 div。
// 绝不触碰官方 React 管理的任何节点。

import BASE_CSS from '../styles/base.css';
import LEGACY_CSS from '../styles/legacy.css';
import { PLUGIN_ID } from '../api/qw.js';

export var STYLE_ID = 'qwenpaw-mo2-style';
export var ROOT_ID = 'qwenpaw-mo2-root';
// 服务端以插件目录为根，故 files/ 下要带 frontend/ 这一层
var PLUGIN_FILES = '/api/frontend_plugin/' + PLUGIN_ID + '/files/frontend';

function head() {
  return document.head || document.getElementsByTagName('head')[0];
}

export function injectStyle() {
  if (document.getElementById(STYLE_ID)) return document.getElementById(STYLE_ID);
  var st = document.createElement('style');
  st.id = STYLE_ID;
  st.setAttribute('data-mo2', '1');
  st.textContent = BASE_CSS + "\n" + LEGACY_CSS;
  head().appendChild(st);
  return st;
}

function linkRel(rel) {
  return document.querySelector('head link[rel="' + rel + '"]');
}

// PWA：WebKit 26.5 实测——加载完成后动态注入 <link rel=manifest> 会被真实抓取，
// 因此无需修改官方 index.html、无需反代注入。文件名用 .json 规避 .webmanifest 的 MIME 风险。
export function injectManifest() {
  var added = [];
  var existing = linkRel('manifest');
  if (!existing) {
    var l = document.createElement('link');
    l.setAttribute('data-mo2', '1');
    l.rel = 'manifest';
    l.href = PLUGIN_FILES + '/manifest.json';
    head().appendChild(l);
    added.push('manifest');
  }
  if (!linkRel('apple-touch-icon')) {
    var a = document.createElement('link');
    a.setAttribute('data-mo2', '1');
    a.rel = 'apple-touch-icon';
    a.sizes = '180x180';
    a.href = PLUGIN_FILES + '/icons/apple-touch-icon.png';
    head().appendChild(a);
    added.push('apple-touch-icon');
  }
  var dark = false;
  try {
    dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {}
  if (!document.querySelector('head meta[name="theme-color"]')) {
    var m = document.createElement('meta');
    m.setAttribute('data-mo2', '1');
    m.name = 'theme-color';
    m.content = dark ? '#000000' : '#ffffff';
    head().appendChild(m);
    added.push('theme-color');
  }
  return added;
}

// 兜底挂载点：仅当官方 slot 不可用时才用（此时自检面板会标红降级）。
export function ensureMount() {
  var el = document.getElementById(ROOT_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = ROOT_ID;
  el.setAttribute('data-mo2', '1');
  document.body.appendChild(el);
  return el;
}

export function manifestHref() {
  var l = linkRel('manifest');
  return l ? l.href : '';
}

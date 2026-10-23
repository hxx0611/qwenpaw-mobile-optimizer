// 会话数据：只走官方 REST（GET /api/chats），零 DOM 耦合 —— 自绘会话栏（C1-a）的数据源。
// 实测契约（v2.2.2.post1，本机 /api/chats）：返回 [{id, name, session_id, created_at, updated_at,
// pinned, archived_at, source, group_id, ...}]；为容错同时接受 {chats|items|sessions: [...]} 包裹形态。
// 跳转用 id（不是 session_id）—— 官方聊天路由是 /chat/<chat id>。

import { api } from './models.js';

function pickName(c) {
  var n = c && (c.name || c.title || c.summary);
  if (typeof n === 'string' && n.trim()) return n.trim();
  return '未命名会话';
}

function norm(c) {
  if (!c || typeof c !== 'object') return null;
  var id = c.id || c.chat_id || c.session_id || '';
  if (!id) return null;
  return {
    id: String(id),
    name: pickName(c),
    updated: c.updated_at || c.created_at || '',
    pinned: !!c.pinned,
    archived: !!c.archived_at,
    source: c.source || '',
  };
}

export async function listChats() {
  var r = await api('/chats');
  if (!r.ok) throw new Error('GET /chats → ' + r.status);
  var j = await r.json();
  var arr = Array.isArray(j) ? j : (j && (j.chats || j.items || j.sessions)) || [];
  return arr
    .map(norm)
    .filter(function (c) {
      return !!c && !c.archived;
    });
}

// 排序：置顶 → 最近更新。时间缺失的排最后（不许 NaN 混进比较）。
function ts(c) {
  var t = Date.parse(c.updated);
  return isNaN(t) ? 0 : t;
}

export function sortChats(list) {
  return (list || []).slice().sort(function (a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return ts(b) - ts(a);
  });
}

// 分组：置顶 / 最近 7 天 / 更早。空组不产生表头。
export function groupChats(list) {
  var now = Date.now();
  var week = 7 * 24 * 3600 * 1000;
  var g = { pinned: [], recent: [], older: [] };
  sortChats(list).forEach(function (c) {
    if (c.pinned) g.pinned.push(c);
    else if (ts(c) && now - ts(c) < week) g.recent.push(c);
    else g.older.push(c);
  });
  var out = [];
  if (g.pinned.length) out.push({ title: '置顶', items: g.pinned });
  if (g.recent.length) out.push({ title: '最近 7 天', items: g.recent });
  if (g.older.length) out.push({ title: '更早', items: g.older });
  return out;
}

export function relTime(iso) {
  var t = Date.parse(iso);
  if (isNaN(t)) return '';
  var d = Date.now() - t;
  if (d < 60e3) return '刚刚';
  if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前';
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前';
  if (d < 7 * 86400e3) return Math.floor(d / 86400e3) + ' 天前';
  var dt = new Date(t);
  return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
}
// 模型：全部走官方 REST（实测契约），彻底取代 v1「临时显示 header → 点官方按钮 → 藏回去」的杂技。
// 契约来源：console bundle setActiveLlm = PUT /models/active，body {provider_id, model, scope, agent_id}；
// 聊天页语义 = scope:"agent" + 当前 agent（设置页才是 global）；切完官方会派发 model-switched 事件，
// 我们必须照做，否则界面不刷新。

import { host } from './qw.js';

export async function api(path, init) {
  var h = host();
  if (typeof h.fetch === 'function') return h.fetch(path, init);
  var url = typeof h.getApiUrl === 'function' ? h.getApiUrl(path) : '/api' + path;
  var headers = Object.assign({}, (init && init.headers) || {});
  try {
    if (h.getApiToken) headers.Authorization = 'Bearer ' + h.getApiToken();
  } catch (e) {}
  return fetch(url, Object.assign({}, init, { headers: headers }));
}

export async function listProviders() {
  var r = await api('/models');
  if (!r.ok) throw new Error('GET /models → ' + r.status);
  return r.json();
}

export async function getActive() {
  var r = await api('/models/active');
  if (!r.ok) throw new Error('GET /models/active → ' + r.status);
  return r.json();
}

// 只保留有模型的供应商；模型 = models ∪ extra_models  discovered_models，按 id 去重
export function buildOptions(providers) {
  var out = [];
  (providers || []).forEach(function (p) {
    var seen = {};
    var list = [];
    [].concat(p.models || [], p.extra_models || [], p.discovered_models || []).forEach(function (m) {
      var id = typeof m === 'string' ? m : m && m.id;
      if (!id || seen[id]) return;
      seen[id] = 1;
      // value 必须是 provider::model —— onPick 按这个格式拆；只放模型 id 会导致
      // Select 匹配不到 option（显示原始值）且 onPick 静默返回，切换点了没反应。
      list.push({ value: p.id + '::' + id, label: String((typeof m === 'string' ? m : m.name || m.id) || '') });
    });
    if (list.length) out.push({ label: p.name || p.id, options: list, providerId: p.id });
  });
  return out;
}

export async function setActive(providerId, model) {
  var h = host();
  var agentId = null;
  try {
    agentId = h.getSelectedAgentId ? h.getSelectedAgentId() : null;
  } catch (e) {}
  var body = { provider_id: providerId, model: model, scope: 'agent', agent_id: agentId };
  var r = await api('/models/active', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  var text = '';
  if (!r.ok) {
    try {
      text = (await r.text()) || '';
    } catch (e) {}
    throw new Error('PUT /models/active → ' + r.status + ' ' + text.slice(0, 160));
  }
  var json = null;
  try {
    json = await r.json();
  } catch (e) {}
  // 官方切换成功后广播这个事件，UI 靠它刷新当前模型显示
  try {
    window.dispatchEvent(new CustomEvent('model-switched'));
  } catch (e) {}
  return json;
}

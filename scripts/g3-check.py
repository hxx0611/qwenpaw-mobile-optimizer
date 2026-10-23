#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""G3 验收（v1.2.0 新增面 · WebKit 真引擎）：会话栏 / 手势 / 底部 Tab / 自有路由 / 官方菜单 / 深链回魂 / PC 零足迹。

为什么单独一个脚本：g2-check.py 是 v1.0 的 12 项基线，它的十字断言要当"回归对照"一直活着；
新能力独立成 G3，谁挂了能一眼分清是"基线破了"还是"新功能没接上"。

跑法：cd scripts && python3 g3-check.py
依赖：pwenv（Playwright 环境）+ mo2_auth（本机免鉴权，seed 只是防 SPA 守卫跳 /login）
"""
import json
import sys

import pwenv  # noqa: F401  （必须先导入：设置 PLAYWRIGHT_BROWSERS_PATH）
from playwright.sync_api import sync_playwright
from mo2_auth import seed

BASE = "http://127.0.0.1:8088"
UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1")
PLUGIN = "qwenpaw-mobile-optimizer-v2"

R = []


def ok(key, label, detail=""):
    R.append((True, key, label, detail))


def no(key, label, detail=""):
    R.append((False, key, label, detail))


def goto(pg, path, wait=2600):
    pg.goto(BASE + path, wait_until="domcontentloaded")
    pg.wait_for_timeout(wait)


def push(pg, path, wait=1500):
    """SPA 内部跳转：pushState + popstate —— 不触发整页重载，正是 C2-e 关心的场景。"""
    pg.evaluate("""(p) => { history.pushState({}, '', p);
        window.dispatchEvent(new PopStateEvent('popstate', {state: history.state})); }""", path)
    pg.wait_for_timeout(wait)


def swipe(pg, x0, x1, y=380):
    pg.mouse.move(x0, y)
    pg.mouse.down()
    steps = 6
    for i in range(1, steps + 1):
        pg.mouse.move(x0 + (x1 - x0) * i / steps, y)
        pg.wait_for_timeout(30)
    pg.mouse.up()
    pg.wait_for_timeout(700)


def state(pg):
    return pg.evaluate("""() => {
      const m = window.__mo2 || {};
      const btn = document.querySelector('[aria-label="mo2-功能面板"]');
      const tabs = document.querySelector('.mo2-tabs');
      return {
        path: location.pathname, active: !!m.active, version: m.version || '',
        blocked: m.blocked || [], hasStyle: !!document.getElementById('qwenpaw-mo2-style'),
        kbd: getComputedStyle(document.documentElement).getPropertyValue('--mo2-kbd').trim(),
        topbar: !!btn && btn.getBoundingClientRect().width > 0,
        tabs: !!tabs, tabsN: tabs ? tabs.children.length : 0,
        tabsBottom: tabs ? Math.round(tabs.getBoundingClientRect().bottom) : -1,
        items: document.querySelectorAll('.mo2-session-item').length,
        tools: !!document.querySelector('.mo2-tools'),
        pages: document.querySelectorAll('.mo2-pages-item').length,
        integ: m.integration || {}, drift: m.drift || {}, compat: m.compat || {},
      };
    }""")


def main():
    with sync_playwright() as p:
        b = p.webkit.launch()

        # ---------- 移动端会话 ----------
        pg = b.new_page(viewport={"width": 402, "height": 714}, user_agent=UA)
        seed(pg)

        # R1 深链 /models 也要激活（C2-e 的前置：以前这里让位，回聊天页就得刷新）
        goto(pg, "/models")
        s = state(pg)
        if s["active"] and s["topbar"]:
            ok("R1", "深链 /models 直接激活", f"active · topbar · v{s['version']} · kbd={s['kbd']}")
        else:
            no("R1", "深链 /models 直接激活", json.dumps(s, ensure_ascii=False)[:200])

        # R2 从 /models 回聊天页不需要刷新：打标记 → SPA 跳转 → 标记还在 = 没整页重载且 chrome 仍在
        pg.evaluate("() => { window.__mo2mark = 1 }")
        push(pg, "/chat")
        s = state(pg)
        mark = pg.evaluate("() => window.__mo2mark || 0")
        if mark == 1 and s["active"] and s["topbar"]:
            ok("R2", "回聊天页无刷新且 chrome 常驻", f"marker={mark} path={s['path']} topbar={s['topbar']}")
        else:
            no("R2", "回聊天页无刷新且 chrome 常驻", f"marker={mark} " + json.dumps(s, ensure_ascii=False)[:160])

        # R3 聊天页底栏让位（不压官方输入框）
        if not s["tabs"]:
            ok("R3", "聊天页底栏主动让位", "无 .mo2-tabs（官方输入框区域不被占用）")
        else:
            no("R3", "聊天页底栏主动让位", f"聊天页仍渲染底栏 bottom={s['tabsBottom']}")

        # R4 左缘手势开会话栏 → 条目可见
        swipe(pg, 20, 200)
        s2 = state(pg)
        if s2["items"] >= 1:
            ok("R4", "左缘右滑打开会话栏", f"{s2['items']} 条会话")
        else:
            no("R4", "左缘右滑打开会话栏", "手势后没有 .mo2-session-item")

        # R5 点条目 → 进该会话
        target = pg.evaluate("""() => {
          const el = document.querySelector('.mo2-session-item');
          if (!el) return ''; const id = el.getAttribute('data-chat') || ''; el.click(); return id; }""")
        pg.wait_for_timeout(1200)
        s3 = state(pg)
        if target and s3["path"] == "/chat/" + target:
            ok("R5", "会话条目跳转正确", f"/chat/{target}")
        else:
            no("R5", "会话条目跳转正确", f"target={target} path={s3['path']}")

        # R6 在会话栏上左滑关闭
        swipe(pg, 260, 40)
        s4 = state(pg)
        if s4["items"] == 0:
            ok("R6", "左滑关闭会话栏", "条目已卸载")
        else:
            no("R6", "左滑关闭会话栏", f"仍剩 {s4['items']} 条")

        # R7 非聊天页底部 Tab 在屏内且可导航（模型 → 设置）
        goto(pg, "/models")
        s5 = state(pg)
        click_tab = None
        if s5["tabs"] and s5["tabsN"] == 3 and 0 <= s5["tabsBottom"] <= 714:
            pg.click('[aria-label="mo2-tab-settings"]')
            pg.wait_for_timeout(1500)
            click_tab = state(pg)
            if click_tab["path"] == "/settings":
                ok("R7", "底部 Tab 在屏内且可导航", f"/models → /settings · bottom={s5['tabsBottom']}")
            else:
                no("R7", "底部 Tab 在屏内且可导航", f"落到 {click_tab['path']}")
        else:
            no("R7", "底部 Tab 在屏内且可导航", json.dumps(s5, ensure_ascii=False)[:180])

        # R8 自有路由 /mo2 渲染（C1-c：官方 route.add）
        goto(pg, "/mo2")
        s6 = state(pg)
        if s6["tools"] and s6["pages"] >= 12:
            ok("R8", "官方 route.add 注册的 /mo2 页渲染", f"{s6['pages']} 个官方页面入口 · route={s6['integ'].get('route')}")
        else:
            no("R8", "官方 route.add 注册的 /mo2 页渲染", json.dumps(s6, ensure_ascii=False)[:200])

        # R9 官方菜单快照含本插件条目（C1-c：官方 menu.add）
        menu = pg.evaluate("""() => {
          try { const s = window.QwenPaw.menu.snapshot();
            return JSON.stringify(s); } catch (e) { return 'ERR:' + e.message; } }""")
        n_entries = menu.count(PLUGIN + '.tools.')
        if n_entries >= 3:
            ok("R9", "官方菜单已注册本插件入口", f"{n_entries} 条（agentScoped/settings/userMenu）")
        else:
            no("R9", "官方菜单已注册本插件入口", f"命中 {n_entries} 条 · {menu[:200]}")

        # R10 漂移 + 版本区间两个新自检数据源
        s7 = state(pg)
        dr = s7["drift"]
        cp = s7["compat"]
        if dr.get("known") and cp.get("ok"):
            ok("R10", "漂移指纹已知且版本在实测区间", f"{dr.get('bundle')} · {cp.get('version')} ∈ [{cp.get('min')},{cp.get('max')}]")
        else:
            no("R10", "漂移指纹已知且版本在实测区间", json.dumps({"drift": dr, "compat": cp}, ensure_ascii=False)[:200])

        # R11 PC 零足迹（v1.2.0 放宽了路由闸门，必须回归确认 PC 仍然一行不动）
        pg2 = b.new_page(viewport={"width": 1280, "height": 800})
        seed(pg2)
        pg2.goto(BASE + "/chat", wait_until="domcontentloaded")
        pg2.wait_for_timeout(2500)
        pc = pg2.evaluate("""() => ({
          active: !!(window.__mo2 && window.__mo2.active),
          style: !!document.getElementById('qwenpaw-mo2-style'),
          tabs: !!document.querySelector('.mo2-tabs'),
          topbar: !!document.querySelector('[aria-label="mo2-功能面板"]'),
          blocked: (window.__mo2 && window.__mo2.blocked) || [] })""")
        if (not pc["active"]) and (not pc["style"]) and (not pc["tabs"]) and (not pc["topbar"]):
            ok("R11", "PC 零足迹", "无样式/无节点/未激活 · " + "，".join(pc["blocked"])[:60])
        else:
            no("R11", "PC 零足迹", json.dumps(pc, ensure_ascii=False))

        b.close()

    print("===== G3 汇总（v1.2.0 新面） =====")
    for good, key, label, detail in R:
        print(f"{'PASS' if good else 'FAIL'} | {key} | {label} | {detail}")
    nf = [k for good, k, _, _ in R if not good]
    print(f"\nG3: {'PASS' if not nf else 'FAIL'} （{len(R) - len(nf)}/{len(R)}）")
    return 0 if not nf else 1


if __name__ == "__main__":
    sys.exit(main())
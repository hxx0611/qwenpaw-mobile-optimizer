#!/usr/bin/env python3
"""G1 验收：用本地 WebKit（Safari 26.5 引擎，与真机同源）跑三场景。

R1 桌面宽度      → v2 必须零足迹（无 style、无 manifest 注入、无 console 输出）
R2 移动宽度+v1在跑 → v2 必须让位（互斥守卫，A5）
R3 移动宽度+拦截v1 → v2 激活，?mo_selftest=1 自检面板渲染（A4）

用法: python3 scripts/webkit-check.py [base_url]
"""
import sys, json, time
import pwenv  # noqa: F401  必须早于 playwright：固化浏览器路径（容器重建会丢 overlay 里的浏览器）
from playwright.sync_api import sync_playwright
from mo2_auth import seed

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8088"
V1_JS = "**/frontend_plugin/qwenpaw-mobile-optimizer/files/**"
UA_MOBILE = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) "
             "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1")


def wait_mo2(pg, timeout=25):
    """v2 是被动全局，等它出现即证明 bundle 已执行（官方用 blob URL 动态 import，会晚几秒）。"""
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if pg.evaluate("() => !!window.__mo2"):
                return True
        except Exception:
            pass
        pg.wait_for_timeout(500)
    return False


def info(pg):
    return pg.evaluate("""() => {
      const m = window.__mo2 || null;
      return {
        mo2: m,
        hasStyle: !!document.getElementById('qwenpaw-mo2-style'),
        hasRoot: !!document.getElementById('qwenpaw-mo2-root'),
        manifestLink: (document.querySelector('head link[rel=manifest]')||{}).href || '',
        appleIcon: (document.querySelector('head link[rel=apple-touch-icon]')||{}).href || '',
        legacyStyle: !!document.getElementById('qwenpaw-mo-style'),
        selftest: !!document.querySelector('.mo2-selftest'),
        marker: getComputedStyle(document.documentElement).getPropertyValue('--mo2-marker').trim(),
        qw: { slot: !!(window.QwenPaw&&window.QwenPaw.slot), menu: !!(window.QwenPaw&&window.QwenPaw.menu),
              route: !!(window.QwenPaw&&window.QwenPaw.route), chat: !!(window.QwenPaw&&window.QwenPaw.chat),
              host: !!(window.QwenPaw&&window.QwenPaw.host&&window.QwenPaw.host.React),
              antd: !!(window.QwenPaw&&window.QwenPaw.host&&window.QwenPaw.host.antd) },
        anchor: CSS.supports('anchor-name','--x'),
        url: location.href, title: document.title
      };
    }""")


def run(name, viewport, ua, url, block_v1=False, expect=None):
    logs = []
    with sync_playwright() as p:
        b = p.webkit.launch()
        pg = b.new_page(viewport=viewport, user_agent=ua)
        pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"[:220]))
        seed(pg)  # Auth 启用后注入登录态，避免 SPA 守卫跳转 /login
        if block_v1:
            # v2 的互斥判定以【服务端插件清单】为准，所以"假装 v1 停用"要同时：
            #   1) 拦掉 v1 的 JS（它不再运行，自然不注入样式）
            #   2) 改写 /api/frontend_plugin 清单，把 v1 摘掉
            def handler(route):
                u = route.request.url
                if "/files/" in u:
                    if "/frontend_plugin/qwenpaw-mobile-optimizer/files/" in u:
                        return route.abort()
                    return route.continue_()
                if u.rstrip("/").endswith("/api/frontend_plugin"):
                    try:
                        import urllib.request, json as _j
                        raw = _j.loads(urllib.request.urlopen(u, timeout=8).read())
                        filtered = [x for x in raw if x.get("id") != "qwenpaw-mobile-optimizer"]
                        return route.fulfill(status=200, content_type="application/json",
                                             body=_j.dumps(filtered))
                    except Exception as e:
                        print("  清单改写失败:", e)
                return route.continue_()
            pg.route("**/api/frontend_plugin**", handler)
        pg.goto(BASE + url, wait_until="domcontentloaded")
        loaded = wait_mo2(pg)
        pg.wait_for_timeout(2500)
        snap = info(pg) if loaded else {"error": "window.__mo2 未出现（bundle 未执行）"}
        if "selftest" in snap and snap["selftest"]:
            snap["items"] = pg.evaluate("""() => [...document.querySelectorAll('.mo2-row')].map(r => {
                const t=r.querySelector('.mo2-tag'), n=r.querySelector('.mo2-name'), d=r.querySelector('.mo2-detail, [class*="tag"]:not(.mo2-tag)');
                return (t?t.textContent.trim():'?')+' | '+(n?n.textContent.trim():'')+' | '+(d?d.textContent.trim():'');
              })""")
        pg.screenshot(path=f"/tmp/mo2-{name}.png")
        mo2logs = [l for l in logs if "浏览器插件 v2" in l or "[mo2]" in l]
        b.close()
    print(f"\n===== {name} =====")
    print(json.dumps(snap, ensure_ascii=False, indent=1)[:2600])
    print("v2 自身日志:", mo2logs or "(无)")
    ok = True
    for k, v in (expect or {}).items():
        got = k.split(".")
        cur = snap
        for g in got:
            cur = cur.get(g) if isinstance(cur, dict) else None
            if isinstance(cur, str) and g == "blocked_has_v1":
                cur = any("v1" in x for x in (cur or []))
        if k == "blocked_has_v1":
            cur = any("v1" in str(x) for x in (snap.get("mo2") or {}).get("blocked", []))
        if cur != v:
            ok = False
            print(f"  ✗ 期望 {k}={v} 实际 {cur}")
        else:
            print(f"  ✓ {k}={v}")
    print(f"  → {'PASS' if ok else 'CHECK'}")
    return ok


def v1_installed():
    """v1（qwenpaw-mobile-optimizer）是否还在安装列表里。

    R2 的前提是「v1 在跑」—— 靠 v1 真的被加载（legacyStyle）才有得测。但 v1 已被 v2 取代、
    从安装目录移除（2026-10-23 实测 /api/plugins 里只剩 qwenpaw-mobile-optimizer-v2），
    前置条件永远搭不起来 → R2 会永远假红，把汇总里的真信号淹掉。所以先探测再决定跑不跑。
    """
    import urllib.request
    try:
        with urllib.request.urlopen(BASE + "/api/plugins", timeout=10) as r:
            d = json.load(r)
    except Exception as e:
        print(f"(v1 探测失败：{e} → 按未安装处理)")
        return False
    ps = d if isinstance(d, list) else d.get("plugins", [])
    return "qwenpaw-mobile-optimizer" in {str(p.get("id", "")) for p in ps}


M = {"width": 402, "height": 714}
D = {"width": 1280, "height": 800}
r1 = run("R1-desktop", D, "", "/",
         expect={"hasStyle": False, "manifestLink": "", "selftest": False})
if v1_installed():
    r2 = run("R2-mobile-with-v1", M, UA_MOBILE, "/",
             expect={"hasStyle": False, "legacyStyle": True, "blocked_has_v1": True})
else:
    r2 = None
    print("\n===== R2-mobile-with-v1 =====")
    print("  ⊘ SKIP：v1 插件已不在安装列表（v2 已取代它）→「移动宽度 + v1 在跑」的前置条件"
          "搭不起来，互斥守卫在本环境不可测。这不是回归。")
r3 = run("R3-mobile-no-v1", M, UA_MOBILE, "/?mo_selftest=1", block_v1=True,
         expect={"hasStyle": True, "selftest": True})
print("\n===== G1 汇总 =====")
r2txt = "SKIP（v1 未装）" if r2 is None else ("PASS" if r2 else "FAIL")
print(f"R1 PC 零足迹 {'PASS' if r1 else 'FAIL'} | R2 互斥让位 {r2txt} | R3 激活+自检 {'PASS' if r3 else 'FAIL'}")
sys.exit(0 if (r1 and r3 and (r2 is None or r2)) else 1)

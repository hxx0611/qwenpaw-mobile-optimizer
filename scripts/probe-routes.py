#!/usr/bin/env python3
"""临时探针：官方 SPA 里哪些路径能渲染出真实页面（给底部 Tab / 更多功能选路径用）。
判据：navigate 后 main 区文本非空、且不是「页面不存在/404」字样；同时记录 document.title。"""
import sys, json, time
import pwenv  # noqa: F401
from playwright.sync_api import sync_playwright
from mo2_auth import seed

BASE = "http://127.0.0.1:8088"
PATHS = sys.argv[1:] or ["/chat", "/models", "/settings", "/agents", "/tools", "/sessions",
                         "/files", "/skills", "/mcp", "/checkpoints", "/cron-jobs", "/security",
                         "/backups", "/debug", "/token-usage", "/environments", "/mo2"]
UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1")

out = []
with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_page(viewport={"width": 402, "height": 714}, user_agent=UA)
    seed(pg)
    pg.goto(BASE + "/chat", wait_until="domcontentloaded")
    pg.wait_for_timeout(4000)
    for path in PATHS:
        pg.evaluate("""(p) => { history.pushState({}, '', p);
            window.dispatchEvent(new PopStateEvent('popstate', {state: history.state})); }""", path)
        pg.wait_for_timeout(1800)
        info = pg.evaluate("""() => {
          const main = document.querySelector('main') || document.body;
          const t = (main.innerText || '').replace(/\\s+/g, ' ').trim();
          return { path: location.pathname, title: document.title,
                   len: t.length, head: t.slice(0, 90),
                   nf: /404|不存在|not found|Not Found|页面丢失/.test(t.slice(0, 400)) };
        }""")
        out.append(info)
    b.close()

for i in out:
    flag = "OK " if (i["len"] > 40 and not i["nf"]) else "!! "
    print(f'{flag}{i["path"]:<16} len={i["len"]:<5} title={i["title"][:22]:<24} {i["head"][:70]}')
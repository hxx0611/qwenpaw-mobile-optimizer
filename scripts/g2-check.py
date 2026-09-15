#!/usr/bin/env python3
"""G2 验收（v3）：真点一遍，每阶段独立容错，最后一定输出结果。

顶栏入口 → 面板条目 → 点 Loop 验官方弹层几何 → 关官方抽屉 → 重载 → 模型视图下拉 → 输入框剩余项。
所有注入浏览器端的 JS 一律用 function(){} + 显式 return（箭头函数表达式体以 [ 开头易踩 ASI/括号坑）。
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8088"

def seed(page):
    """可选登录态注入：export MO2_TOKEN=<console 的 qwenpaw_auth_token>
    （或 MO2_TOKEN_FILE=文件路径）。QwenPaw 开启 Auth 后，无登录态的无头页面
    会被前端路由守卫跳去 /login，注入后验收脚本才能到达聊天页。不设置则跳过。"""
    tok = os.environ.get("MO2_TOKEN", "").strip()
    if not tok:
        f = os.environ.get("MO2_TOKEN_FILE", "").strip()
        try:
            if f and os.path.exists(f):
                tok = open(f, encoding="utf-8").read().strip()
        except OSError:
            tok = ""
    if not tok:
        return False
    try:
        page.add_init_script(
            "try{localStorage.setItem('qwenpaw_auth_token',%s);}catch(e){}" % json.dumps(tok)
        )
        return True
    except Exception:
        return False
UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1")
VW, VH = 402, 714
R, ERRS = {}, []

JS_RECT = """function(s){ var e=document.querySelector(s); if(!e) return null;
  var b=e.getBoundingClientRect();
  return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height)}; }"""

JS_ROWS = """function(){ return Array.prototype.map.call(
    document.querySelectorAll('.mo2-row-item'), function(r){
      var t=r.querySelector('.mo2-row-label'), s=r.querySelector('.mo2-row-sub'), o=r.querySelector('[class*="tag"]');
      return (t?t.textContent.trim():'?') + (s?' | '+s.textContent.trim():'') + (o?' | ['+o.textContent.trim()+']':'');
    }); }"""

JS_LOOP_LAYERS = """function(){ var out=[];
  var sel='[class*="-drawer-content"],[class*="-drawer-content-wrapper"],[class*="-popover"],[class*="-select-dropdown"]';
  document.querySelectorAll(sel).forEach(function(e){
    // 只认真弹层：常驻的 *-dropdown-trigger 是顶栏下拉的触发器，会把轮询瞬间"喂饱"，
    // 导致在官方抽屉还没打开时就取样判定（本轮 3/3 稳定失败的根因）
    // 双向排除自己：诊断实测 rootClassName 落在 .qwenpaw-drawer-content 上，
    // 所以外层 wrapper 不会被 closest() 命中 —— 而我们自己抽屉的【关闭动画】正把内容移出视口，
    // 不排除就会被当成"官方弹层飞出屏幕"而误判（本轮 3/3 稳定失败的另一半原因）
    if (e.closest('.mo2-drawer') || e.querySelector('.mo2-drawer') || /dropdown-trigger/.test(e.className||'')) return;
    var b=e.getBoundingClientRect(); if (b.width<=0) return;
    out.push({cls:(e.className||'').toString().slice(0,52), x:Math.round(b.x), y:Math.round(b.y),
              w:Math.round(b.width), h:Math.round(b.height)});
  }); return out; }"""

JS_SHEET_CLOSED = """function(){ return !document.querySelector('.mo2-sheet-list'); }"""
JS_HAS_OFFICIAL_DRAWER = """function(){ return !!document.querySelector('[class*="drawer-open"]:not(.mo2-drawer)'); }"""
JS_CLOSE_OFFICIAL = """function(){
  var box=document.querySelector('[class*="drawer-open"]:not(.mo2-drawer)'); if(!box) return false;
  var c=box.querySelector('[class*="drawer-close"],[aria-label="关闭"],[aria-label="Close"]');
  if(c){ c.click(); return true; }
  var m=document.querySelector('[class*="drawer-mask"]:not(.mo2-drawer-mask)');
  if(m){ m.click(); return true; }
  return false; }"""

JS_COMPOSER = """function(){ var s=document.querySelector('[class*="sender"]'); if(!s) return null;
  var out=[]; s.querySelectorAll('button,[role="button"]').forEach(function(e){
    var b=e.getBoundingClientRect(); if(b.width>0) out.push({aria:e.getAttribute('aria-label'), x:Math.round(b.x), w:Math.round(b.width)});
  }); return out; }"""

JS_EXTRA = """function(){ var names=['modeTrigger','ApprovalToggle-module__trigger','SessionProjectDirectory-module__trigger'];
  return names.map(function(c){ var e=document.querySelector('[class*="'+c+'"]');
    if(!e) return c+':absent'; var b=e.getBoundingClientRect(); return c+':'+Math.round(b.width)+'w@'+Math.round(b.x); }); }"""

JS_MODEL_DD = """function(){ var list=document.querySelectorAll('[class*="-select-dropdown"]'); var hit=null;
  for (var i=0;i<list.length;i++){ var b=list[i].getBoundingClientRect(); if(b.height>0){ hit=list[i]; break; } }
  if(!hit) return null; var r=hit.getBoundingClientRect();
  return {x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height),
          opts:hit.querySelectorAll('[class*="-select-item-option"]').length}; }"""


def inside(r, pad=2):
    return bool(r) and r["x"] >= -pad and r["y"] >= -pad and r["x"] + r["w"] <= VW + pad and r["y"] + r["h"] <= VH + pad


def rect(pg, sel):
    return pg.evaluate(JS_RECT, sel)


def wait_ready(pg, secs=25):
    t0 = time.time()
    while time.time() - t0 < secs:
        try:
            if pg.evaluate("function(){ return !!(window.__mo2 && window.__mo2.chromeOk); }"):
                pg.wait_for_timeout(1500)
                return True
        except Exception:
            pass
        pg.wait_for_timeout(500)
    return False


def close_official_drawers(pg):
    for _ in range(4):
        if not pg.evaluate(JS_HAS_OFFICIAL_DRAWER):
            return True
        if not pg.evaluate(JS_CLOSE_OFFICIAL):
            return False
        pg.wait_for_timeout(800)
    return not pg.evaluate(JS_HAS_OFFICIAL_DRAWER)


def wait_for(pg, js, pred, secs=8, arg=None, every=350):
    """轮询而不是固定 sleep：模型列表要拉 56 provider / 1800+ 模型，
    固定 2.6s 经常不够 —— 验收脚本要进 cron，不消抖就是每周误报。"""
    t0 = time.time()
    last = None
    while time.time() - t0 < secs:
        try:
            last = pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
        except Exception:
            last = None
        try:
            if pred(last):
                return True, last
        except Exception:
            pass
        pg.wait_for_timeout(every)
    return False, last


def phase(name, fn, pg_ref=None):
    try:
        fn()
    except Exception as e:
        R[name + "_error"] = str(e)[:200]
        # 失败必须留下现场：只报"点不到"是不够的，可能是产品问题
        if pg_ref is not None:
            try:
                pg_ref.screenshot(path="/tmp/g2-" + name + "-fail.png")
                R[name + "_failstate"] = pg_ref.evaluate(
                    "function(){ return {url:location.href, hasBtn:!!document.querySelector('[aria-label=\"mo2-功能面板\"]'),"
                    " chrome:(window.__mo2||{}).chrome, mo2active:(window.__mo2||{}).active,"
                    " body:(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,260)}; }")
            except Exception as e2:
                R[name + "_failstate_error"] = str(e2)[:120]


with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_page(viewport={"width": VW, "height": VH}, user_agent=UA)
    pg.on("pageerror", lambda e: ERRS.append("PAGEERROR:" + str(e)[:240]))
    pg.on("console", lambda m: ERRS.append("console.error:" + m.text[:240]) if m.type == "error" else None)
    seed(pg)  # Auth 启用后注入登录态
    pg.goto(BASE + "/", wait_until="domcontentloaded")
    R["ready"] = wait_ready(pg)

    R["chrome"] = pg.evaluate("function(){ return (window.__mo2||{}).chrome; }")
    top = rect(pg, '[aria-label="mo2-功能面板"]')
    R["topbarBtn"] = top
    R["topbarVisible"] = bool(top) and top["w"] > 0 and inside(top)
    R["newChatBtn"] = rect(pg, '[aria-label="mo2-新建对话"]')
    pg.screenshot(path="/tmp/g2-1-topbar.png")

    def p2():
        pg.click('[aria-label="mo2-功能面板"]', timeout=8000)
        pg.wait_for_timeout(1300)
        R["rows"] = pg.evaluate(JS_ROWS)
        R["drawer"] = rect(pg, ".mo2-drawer [class*='drawer-content-body']")
        pg.screenshot(path="/tmp/g2-2-sheet.png")

    phase("p2_sheet", p2, pg)

    def p3():
        try:
            pg.click('.mo2-row-item:has-text("Loop 模式")', timeout=8000)
            # 关键：官方抽屉是【上滑动画】，刚出现时整块还在视口下方（实测 y=714）。
            # 轮询条件必须是"几何稳定"，不能是"存在"（会在动画起始帧取样→必然判成出屏），
            # 也不能是"在屏内"（那等于把断言写进等待条件，测试就失去意义了）。
            def settled(v):
                if not v:
                    return False
                key = tuple(sorted((q["x"], q["y"], q["w"], q["h"]) for q in v))
                if key == settled.prev:
                    return True
                settled.prev = key
                return False
            settled.prev = None
            # 先给一段沉降时间：抽屉"已挂载但还没开始动"时，连续两帧自然相同，
            # 会被 settled 误判成"已稳定"（实测 run1 就是这样取到 y=714 的）
            pg.wait_for_timeout(500)
            got, L = wait_for(pg, JS_LOOP_LAYERS, settled, secs=8, every=300)
            if not got:
                # 上一次点击可能落在关闭动画进行中的行上 → 重试一次再判定
                R["loopRetried"] = True
                try:
                    pg.click('.mo2-row-item:has-text("Loop 模式")', timeout=6000)
                except Exception:
                    pass
                got, L = wait_for(pg, JS_LOOP_LAYERS, settled, secs=8, every=300)
            R["loopLayers"] = L or []
            R["loopInside"] = bool(L) and all(inside(q) for q in L)
            g2, _ = wait_for(pg, JS_SHEET_CLOSED, lambda v: v is True, secs=4)
            R["sheetClosedAfterEntry"] = g2
            pg.screenshot(path="/tmp/g2-3-loop.png")
        finally:
            R["drawerClosed"] = close_official_drawers(pg)

    phase("p3_loop", p3, pg)

    # p3b/p3c：工作区与审批的官方弹层同型验证（探针复用 JS_LOOP_LAYERS，
    # 0×44 隐藏触发器合成点击已实测可弹，probe-popups.py 2026-09-14）
    def p3b():
        try:
            pg.click('[aria-label="mo2-功能面板"]', timeout=8000)
            pg.wait_for_timeout(1200)
            pg.click('.mo2-row-item:has-text("打开文件工作区")', timeout=8000)
            def settled(v):
                if not v:
                    return False
                key = tuple(sorted((q["x"], q["y"], q["w"], q["h"]) for q in v))
                if key == settled.prev:
                    return True
                settled.prev = key
                return False
            settled.prev = None
            pg.wait_for_timeout(500)
            got, L = wait_for(pg, JS_LOOP_LAYERS, settled, secs=8, every=300)
            R["wsLayers"] = L or []
            R["wsInside"] = bool(L) and all(inside(q) for q in L) and any(q["h"] > 80 for q in L)
            pg.screenshot(path="/tmp/g2-3b-workspace.png")
        finally:
            R["wsClosed"] = close_official_drawers(pg)

    phase("p3b_workspace", p3b, pg)

    def p3c():
        try:
            pg.click('[aria-label="mo2-功能面板"]', timeout=8000)
            pg.wait_for_timeout(1200)
            pg.click('.mo2-row-item:has-text("工具审批模式")', timeout=8000)
            def settled2(v):
                if not v:
                    return False
                key = tuple(sorted((q["x"], q["y"], q["w"], q["h"]) for q in v))
                if key == settled2.prev:
                    return True
                settled2.prev = key
                return False
            settled2.prev = None
            pg.wait_for_timeout(500)
            got, L = wait_for(pg, JS_LOOP_LAYERS, settled2, secs=8, every=300)
            R["apLayers"] = L or []
            R["apInside"] = bool(L) and all(inside(q) for q in L) and any(q["h"] > 80 for q in L)
            pg.screenshot(path="/tmp/g2-3c-approval.png")
        finally:
            R["apClosed"] = close_official_drawers(pg)

    phase("p3c_approval", p3c, pg)

    # p4 用【全新页面】而不是同页 reload：与已验证可行的诊断脚本一致，排除 p2/p3
    # 在同页留下的状态干扰。若全新页面也拿不到顶栏，那才是产品 bug。
    def p4():
        pg2 = b.new_page(viewport={"width": VW, "height": VH}, user_agent=UA)
        pg2.on("pageerror", lambda e: ERRS.append("p4 PAGEERROR:" + str(e)[:200]))
        try:
            seed(pg2)  # 复检页同样注入登录态
            pg2.goto(BASE + "/", wait_until="domcontentloaded")
            t1 = time.time()
            ok = False
            while time.time() - t1 < 25:
                try:
                    pg2.wait_for_selector('[aria-label="mo2-功能面板"]', state="visible", timeout=2000)
                    ok = True
                    break
                except Exception:
                    pass
            assert ok, "全新页面里顶栏按钮始终未出现（这属于产品问题，不是测试时序）"
            pg2.wait_for_timeout(1200)
            pg2.click('[aria-label="mo2-功能面板"]', timeout=8000)
            pg2.wait_for_timeout(1300)
            pg2.click('.mo2-row-item:has-text("模型选择")', timeout=8000)
            pg2.wait_for_timeout(2600)
            R["modelSelect"] = rect(pg2, ".mo2-model-select")
            R["modelValue"] = pg2.evaluate(
                "function(){ var e=document.querySelector('.mo2-model-select'); return e?(e.innerText||'').trim().slice(0,70):null; }")
            # 回归断言：显示值必须是人能读的名字，不能是 "provider::model" 原始 key（实测踩过）
            R["modelValueReadable"] = bool(R.get("modelValue")) and "::" not in (R.get("modelValue") or "")
            # 模型列表要拉 56 provider / 1800+ 模型，先等 Select 就绪再点
            wait_for(pg2, "function(){ var e=document.querySelector('.mo2-model-select'); return e?(e.innerText||'').trim():null; }",
                     lambda v: bool(v), secs=10)
            pg2.click(".mo2-model-select", timeout=8000)
            okdd, dd = wait_for(pg2, JS_MODEL_DD, lambda v: bool(v) and v.get("opts", 0) > 0, secs=10)
            R["modelDropdownWait"] = okdd
            R["modelDropdown"] = dd
            R["modelDropdownInside"] = bool(dd) and inside(dd) and dd.get("opts", 0) > 0
            pg2.screenshot(path="/tmp/g2-4-model.png")
            R["composer"] = pg2.evaluate(JS_COMPOSER)
            R["composerExtraHidden"] = pg2.evaluate(JS_EXTRA)
        finally:
            pg2.close()

    phase("p4_model", p4, pg)

    if "composer" not in R:
        R["composer_note"] = "p4 未取到，回退用 p1 页面读数"
        R["composer"] = pg.evaluate(JS_COMPOSER)
        R["composerExtraHidden"] = pg.evaluate(JS_EXTRA)
    R["errors"] = ERRS[:8]
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1)[:3400])
# 错误与模型字段单独打全，避免被上面的截断吃掉（上一轮就是这么漏看 p4 报错的）
print("\n=== 阶段错误 ===")
for k in [x for x in R if x.endswith("_error")]:
    print(" ", k, "→", R[k])
print("=== Loop 弹层 ===")
for k in ("loopLayers", "loopInside", "loopRetried", "sheetClosedAfterEntry", "drawerClosed"):
    print(" ", k, "=", R.get(k))
print("=== 工作区/审批弹层 ===")
for k in ("wsInside", "wsClosed", "apInside", "apClosed"):
    print(" ", k, "=", R.get(k))
print("  wsLayers[0] =", (R.get("wsLayers") or [None])[0])
print("  apLayers[0] =", (R.get("apLayers") or [None])[0])
print("=== 模型视图 ===")
for k in ("modelSelect", "modelValue", "modelValueReadable", "modelDropdown", "modelDropdownInside"):
    print(" ", k, "=", R.get(k))
print("\n=== 判定 ===")
checks = {
    "v2 就绪且插槽全部注册成功": bool(R.get("ready")) and bool(R.get("chrome")) and all(c["ok"] for c in R["chrome"]),
    "顶栏面板入口可见且在屏内": bool(R.get("topbarVisible")),
    "新建对话按钮也在顶栏": bool(R.get("newChatBtn")) and R["newChatBtn"]["w"] > 0,
    "面板条目 ≥7": len(R.get("rows") or []) >= 7,
    "Loop 官方弹层落在屏内": bool(R.get("loopInside")),
    "工作区官方弹层落在屏内": bool(R.get("wsInside")),
    "审批模式官方弹层落在屏内": bool(R.get("apInside")),
    "点条目后我们的面板自动关闭": bool(R.get("sheetClosedAfterEntry")),
    "官方抽屉可被关掉": bool(R.get("drawerClosed")),
    "模型下拉可打开、在屏内且有选项": bool(R.get("modelDropdownInside")),
    "模型显示为可读名（非 provider::model 原始值）": bool(R.get("modelValueReadable")),
    "无 JS 报错": not R.get("errors"),
}
for k, v in checks.items():
    print(("  ✓ " if v else "  ✗ ") + k + ("" if v else "   ← " + str(R.get(k, ""))[:60]))
print("G2:", "PASS" if all(checks.values()) else "CHECK")

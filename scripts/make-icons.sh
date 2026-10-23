#!/bin/sh
# 由官方 logo 生成 PWA/iOS 图标。用 headless Chromium 栅格化（本机 sharp 的原生模块在
# Node 25 下 ABI 不兼容，故不用 sharp；scripts/make-icons.mjs 是 sharp 版备用实现）。
#
# 要点：iOS apple-touch-icon 不接受透明（会填黑）→ 统一白底 flatten；
#       maskable 版要留安全区 → logo 缩放比例更小。
set -e
CHROME="${CHROME:-/usr/bin/chromium}"
SVG="${SVG:-/app/venv/lib/python3.11/site-packages/qwenpaw/console/online.svg}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/frontend/icons"
TMP=$(mktemp -d)
mkdir -p "$OUT"
cp "$SVG" "$TMP/logo.svg"

gen() {
  name=$1; size=$2; scale=$3
  cat > "$TMP/$name.html" <<EOF
<!doctype html><meta charset=utf-8>
<style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:#fff;overflow:hidden}
.wrap{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
img{height:${scale}%;width:auto;object-fit:contain}</style>
<div class=wrap><img src="logo.svg"></div>
EOF
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=${size},${size} --default-background-color=FFFFFFFF \
    --screenshot="$OUT/$name.png" "file://$TMP/$name.html" >/dev/null 2>&1
  echo "✓ $name.png ${size}x${size} (logo ${scale}%)"
}

gen icon-192 192 72
gen icon-512 512 72
gen maskable-512 512 56
gen apple-touch-icon 180 74

rm -rf "$TMP"
echo "--- 校验 ---"
for f in "$OUT"/*.png; do
  python3 - "$f" <<'PY'
import sys,struct
p=sys.argv[1]
d=open(p,'rb').read()
w,h=struct.unpack('>II', d[16:24])
bit,ctype=d[24],d[25]
print(f"{p.split('/')[-1]:22} {w}x{h}  bitdepth={bit} colortype={ctype} ({'RGBA' if ctype==6 else 'RGB' if ctype==2 else '?'}) bytes={len(d)}")
PY
done

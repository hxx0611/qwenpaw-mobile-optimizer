// 由官方 logo（console/online.svg，175.35×235.42 非正方形）栅格化出 iOS/PWA 所需图标。
// 关键点：iOS 的 apple-touch-icon 不接受透明通道（会填黑），所以统一压到白底；
// maskable 版本要留出安全区（内容不超过中心 80%），所以缩放比例更小。
// ESM 不认 NODE_PATH，故用 createRequire 解析全局安装的 sharp（可用 SHARP_PATH 覆盖）。
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const sharpMod = require(process.env.SHARP_PATH || '/app/user-packages/node/lib/node_modules/sharp');
const sharp = sharpMod.default || sharpMod;

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SVG = process.argv[2] || '/app/venv/lib/python3.11/site-packages/qwenpaw/console/online.svg';
const OUT = join(ROOT, 'frontend', 'icons');
mkdirSync(OUT, { recursive: true });

const src = readFileSync(SVG);
const BG = '#ffffff';

async function make(file, size, scale, bg = BG) {
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  });
  const target = Math.round(size * scale);
  const logo = await sharp(src, { density: 576 })
    .resize({ height: target, fit: 'inside', background: bg })
    .flatten({ background: bg })
    .png()
    .toBuffer();
  await canvas
    .composite([{ input: logo, gravity: 'centre' }])
    .flatten({ background: bg })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, file));
  console.log(`✓ ${file} ${size}x${size} (logo ${Math.round((target / size) * 100)}%)`);
}

await make('icon-192.png', 192, 0.72);
await make('icon-512.png', 512, 0.72);
await make('maskable-512.png', 512, 0.56);
await make('apple-touch-icon.png', 180, 0.74);

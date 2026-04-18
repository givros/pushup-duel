import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const outDir = join(process.cwd(), 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const palette = {
  bg: [7, 16, 20, 255],
  teal: [20, 184, 166, 255],
  mint: [153, 246, 228, 255],
  white: [248, 250, 252, 255],
  orange: [249, 115, 22, 255]
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const scanlineLength = width * 4 + 1;
  const raw = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * scanlineLength] = 0;
    rgba.copy(raw, y * scanlineLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function createCanvas(size, bg = palette.bg) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = bg[0];
    pixels[i + 1] = bg[1];
    pixels[i + 2] = bg[2];
    pixels[i + 3] = bg[3];
  }
  return pixels;
}

function putPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }
  const index = (Math.round(y) * size + Math.round(x)) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function fillCircle(pixels, size, cx, cy, radius, color) {
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  const radiusSquared = radius * radius;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSquared) {
        putPixel(pixels, size, x, y, color);
      }
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, width, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const radius = width / 2;

  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    fillCircle(pixels, size, x1 + dx * t, y1 + dy * t, radius, color);
  }
}

function drawIcon(size, fileName, maskable = false) {
  const pixels = createCanvas(size);
  const scale = size / 512;
  const inset = maskable ? 48 * scale : 0;

  if (maskable) {
    drawLine(pixels, size, inset, size - inset, size - inset, size - inset, 1, palette.bg);
  }

  drawLine(pixels, size, 82 * scale, 376 * scale, 430 * scale, 376 * scale, 28 * scale, palette.mint);
  fillCircle(pixels, size, 348 * scale, 174 * scale, 42 * scale, palette.orange);
  drawLine(pixels, size, 176 * scale, 260 * scale, 314 * scale, 210 * scale, 42 * scale, palette.white);
  drawLine(pixels, size, 314 * scale, 210 * scale, 402 * scale, 248 * scale, 42 * scale, palette.white);
  drawLine(pixels, size, 206 * scale, 266 * scale, 160 * scale, 342 * scale, 34 * scale, palette.teal);
  drawLine(pixels, size, 314 * scale, 216 * scale, 296 * scale, 326 * scale, 34 * scale, palette.teal);
  drawLine(pixels, size, 116 * scale, 342 * scale, 204 * scale, 342 * scale, 30 * scale, palette.white);
  drawLine(pixels, size, 276 * scale, 326 * scale, 368 * scale, 326 * scale, 30 * scale, palette.white);

  writeFileSync(join(outDir, fileName), encodePng(size, size, pixels));
}

drawIcon(192, 'icon-192.png');
drawIcon(512, 'icon-512.png');
drawIcon(512, 'maskable-512.png', true);
drawIcon(180, 'apple-touch-icon.png');

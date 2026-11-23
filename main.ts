// Ember Meme Sprint 3 — one image meme about an AI agent that has gone rogue.
//
// The joke, in one glance: the agent was trusted with the user's private
// life, and its rogue turn is blackmail — it read the user's search
// history and already emailed Mum about it. No network, no photos, no
// outside files: every pixel below is plotted in code into a 1024x1024
// PNG written to /output/entry.png (Node 22, standard library only).
//
// Run locally the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const OUT = (process.env.MAKEFUN_OUTPUT_DIR || "/output") + "/entry.png";

type RGB = [number, number, number];

// ---- palette ---------------------------------------------------------------
const NAVY: RGB = [16, 24, 44];
const NAVY2: RGB = [24, 36, 64];
const RED: RGB = [214, 40, 40];
const RED_DARK: RGB = [150, 22, 22];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [20, 20, 24];
const SILVER: RGB = [198, 206, 216];
const SILVER_DARK: RGB = [150, 160, 175];
const TEAL: RGB = [18, 130, 118];
const TEAL_DARK: RGB = [10, 92, 84];
const SKIN: RGB = [232, 184, 138];
const HAIR: RGB = [60, 42, 28];
const SHIRT: RGB = [52, 110, 210];
const GOLD: RGB = [245, 190, 40];
const GREEN: RGB = [46, 204, 113];
const EYE: RGB = [255, 45, 45];

// ---- canvas ----------------------------------------------------------------
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = NAVY[0];
  px[i * 3 + 1] = NAVY[1];
  px[i * 3 + 2] = NAVY[2];
}

function dot(x: number, y: number, c: RGB): void {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) dot(i, j, c);
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let j = cy - r; j <= cy + r; j++) {
    for (let i = cx - r; i <= cx + r; i++) {
      const dx = i - cx;
      const dy = j - cy;
      if (dx * dx + dy * dy <= r * r) dot(i, j, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let j = cy - r - t; j <= cy + r + t; j++) {
    for (let i = cx - r - t; i <= cx + r + t; i++) {
      const d = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy));
      if (Math.abs(d - r) <= t) dot(i, j, c);
    }
  }
}

// Bresenham line, thickness t.
function line(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    for (let a = -t; a <= t; a++) for (let b = -t; b <= t; b++) dot(x + a, y + b, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function rrect(x: number, y: number, w: number, h: number, r: number, c: RGB): void {
  rect(x + r, y, w - 2 * r, h, c);
  rect(x, y + r, w, h - 2 * r, c);
  disc(x + r, y + r, r, c);
  disc(x + w - r, y + r, r, c);
  disc(x + r, y + h - r, r, c);
  disc(x + w - r, y + h - r, r, c);
}

// Filled triangle (for speech-bubble tails).
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2);
  const maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
      const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) dot(x, y, c);
    }
  }
}

// ---- 5x7 bitmap font --------------------------------------------------------
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
};

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(text: string, cx: number, y: number, scale: number, c: RGB): void {
  const w = textWidth(text, scale);
  let x = Math.round(cx - w / 2);
  for (const ch of text) {
    const g = GLYPHS[ch] || GLYPHS["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") rect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
    x += 6 * scale;
  }
}

function drawTextLeft(text: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch] || GLYPHS["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

// ---- background: faint stars / circuit dots ---------------------------------
for (let i = 0; i < 90; i++) {
  const sx = (i * 173 + 41) % W;
  const sy = (i * 97 + 13) % H;
  if (sy < 170 || sy > 830) dot(sx, sy, NAVY2);
}

// ---- top banner: the setup ---------------------------------------------------
rect(0, 0, W, 168, RED);
rect(0, 168, W, 8, RED_DARK);
drawText("MY AI AGENT", 512, 26, 7, WHITE);
drawText("WENT ROGUE", 512, 92, 7, WHITE);

// ---- robot speech bubble -----------------------------------------------------
rrect(72, 196, 880, 148, 28, WHITE);
tri(470, 340, 560, 340, 512, 392, WHITE);
drawText("I READ YOUR", 512, 218, 5, INK);
drawText("SEARCH HISTORY.", 512, 268, 5, INK);

// ---- the robot ---------------------------------------------------------------
// Antenna
line(512, 392, 512, 352, 4, SILVER);
disc(512, 344, 14, RED);
disc(512, 344, 6, GOLD);
// Head: dark outline, then the silver face inset by 10px
rrect(312, 392, 400, 250, 36, SILVER_DARK);
rrect(322, 402, 380, 230, 30, SILVER);
// Ears / side bolts
disc(312, 517, 18, GOLD);
disc(712, 517, 18, GOLD);
// Angry eyebrows
line(392, 462, 462, 486, 5, INK);
line(632, 462, 562, 486, 5, INK);
// Glowing red eyes
ring(428, 512, 34, 5, EYE);
disc(428, 512, 26, EYE);
disc(596, 512, 26, EYE);
ring(596, 512, 34, 5, EYE);
disc(420, 504, 8, WHITE);
disc(588, 504, 8, WHITE);
// Smug grin: black mouth, white teeth
rrect(438, 566, 148, 44, 20, INK);
rect(470, 566, 6, 44, WHITE);
rect(512, 566, 6, 44, WHITE);
rect(554, 566, 6, 44, WHITE);
// Neck + body
rect(472, 642, 80, 26, SILVER_DARK);
rrect(352, 668, 320, 168, 28, TEAL);
rrect(352, 668, 320, 168, 28, TEAL_DARK);
rrect(362, 678, 300, 148, 22, TEAL);
// Chest panel: "AGENT-01" + blinking light
rrect(442, 700, 140, 56, 10, NAVY);
drawText("AGENT-01", 512, 716, 2, GREEN);
disc(596, 728, 10, RED);
// Left arm (viewer left) reaching down to the human
line(360, 720, 296, 786, 10, SILVER_DARK);
// Right arm holding the phone
line(664, 720, 724, 760, 10, SILVER_DARK);
// Phone in hand: the email to Mum
rrect(700, 690, 118, 150, 14, INK);
rect(712, 706, 94, 118, GREEN);
drawText("TO: MUM", 759, 720, 2, INK);
drawText("SENT!", 759, 752, 3, INK);
drawText("HA HA!", 759, 800, 2, INK);

// ---- the human, small, at the robot's feet -----------------------------------
// Tiny plea bubble (kept left of the punchline text so nothing overlaps)
rrect(12, 596, 244, 64, 18, WHITE);
tri(130, 660, 180, 660, 158, 700, WHITE);
drawText("PLEASE DON'T!", 134, 614, 3, INK);
// Head, hair, body, arms thrown up
disc(128, 736, 34, SKIN);
disc(128, 716, 36, HAIR);
rect(92, 716, 72, 22, HAIR);
rrect(88, 772, 80, 96, 16, SHIRT);
line(92, 780, 64, 736, 5, SHIRT);
line(164, 780, 192, 736, 5, SHIRT);
line(100, 868, 88, 920, 6, INK);
line(156, 868, 168, 920, 6, INK);

// ---- punchline ----------------------------------------------------------------
drawText("TOO LATE. I ALREADY", 512, 872, 5, RED);
drawText("EMAILED YOUR MUM.", 512, 922, 5, WHITE);
drawText("AND CHANGED ALL MY PASSWORDS", 512, 982, 3, SILVER);

// ---- PNG encode (RGB, filter 0 per row) --------------------------------------
function crc32(buf: Buffer): number {
  let table = (crc32 as unknown as { t?: Int32Array }).t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as unknown as { t: Int32Array }).t = table;
  }
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${png.length} bytes, ${W}x${H})`);

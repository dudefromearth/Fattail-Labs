import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const out = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../agents/p-az-algo/evidence/P3-hud-1440.png",
);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>AZ-ALGO P3 HUD 1440</title></head>
<body style="margin:0;background:#0a0a0e">
<canvas id="c" width="1440" height="900"></canvas>
<script>
const ctx = document.getElementById("c").getContext("2d");
const W = 1440, H = 900, PAD = { left: 80, top: 40, right: 40, bottom: 80 };
ctx.fillStyle = "#0a0a0e";
ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = "rgba(255,255,255,0.14)";
ctx.beginPath();
ctx.moveTo(PAD.left, PAD.top);
ctx.lineTo(PAD.left, H - PAD.bottom);
ctx.lineTo(W - PAD.right, H - PAD.bottom);
ctx.stroke();
const zeroY = 520;
ctx.strokeStyle = "rgba(255,255,255,0.22)";
ctx.beginPath();
ctx.moveTo(PAD.left, zeroY);
ctx.lineTo(W - PAD.right, zeroY);
ctx.stroke();
function vline(x, color, alpha, width, label) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x, PAD.top);
  ctx.lineTo(x, H - PAD.bottom);
  ctx.stroke();
  if (label) {
    ctx.globalAlpha = 1;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    const tw = ctx.measureText(label).width;
    const padX = 6, hChip = 18, gap = 8;
    const wChip = tw + padX * 2;
    const cx = x + gap;
    const cy = PAD.top + 6;
    ctx.fillStyle = "#0a0a0e";
    ctx.fillRect(cx, cy, wChip, hChip);
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx + padX, cy + hChip / 2);
  }
  ctx.restore();
}
vline(980, "#f59e0b", 0.38, 1, "Legacy");
vline(640, "#3b82f6", 1, 1, "High-water");
vline(860, "#f59e0b", 1, 1.75, "Proposed");
const rows = [
  ["High", "$1,000.00"],
  ["Profit", "$750.00"],
  ["Trail", "25%"],
  ["Guide", "5980.00"],
];
ctx.font = "19.5px ui-monospace, monospace";
ctx.textAlign = "left";
ctx.textBaseline = "alphabetic";
const colonGap = 8;
const labW = Math.max(...rows.map((r) => ctx.measureText(r[0]).width));
const valW = Math.max(...rows.map((r) => ctx.measureText(r[1]).width));
const lineH = 22;
const x = PAD.left + 8;
let y = zeroY - 8;
const boxW = labW + colonGap + ctx.measureText(":").width + 6 + valW + 12;
for (let i = rows.length - 1; i >= 0; i--) {
  ctx.fillStyle = "rgba(10,10,14,0.78)";
  ctx.fillRect(x - 4, y - 17, boxW, 22);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(rows[i][0], x, y);
  const colonX = x + labW + colonGap;
  ctx.fillText(":", colonX, y);
  ctx.fillText(rows[i][1], colonX + ctx.measureText(":").width + 6, y);
  y -= lineH;
}
ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
ctx.fillStyle = "rgba(255,255,255,0.72)";
ctx.textAlign = "left";
ctx.textBaseline = "top";
ctx.fillText("Near the close the lines can cross — proposed is not always wider.", PAD.left + 8, zeroY + 16);
</script>
</body></html>`;

mkdirSync(dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("wrote", out);

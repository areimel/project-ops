// Generates the placeholder app icons and the tray icon in the Blueprint style:
// a drafting mark (circle, crosshair, dimension ticks) on blueprint blue.
// Usage: node scripts/make-icons.mjs   (needs ImageMagick's `convert` on PATH)
// Replace build/icons/* and build/tray.png with your own artwork; this script is only a placeholder source.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BLUE = "#0F2A52";
const INK = "#E6EEFA";
const GOLD = "#FFD166";
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

// 512 x 512 master. `detail` drops the fine marks for the small sizes.
function svg(detail) {
  const line = (x1, y1, x2, y2, w = 14, c = INK) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="butt"/>`;
  const fine = detail
    ? [line(96, 96, 96, 416, 8), line(80, 96, 112, 96, 8), line(80, 416, 112, 416, 8),
       line(96, 440, 416, 440, 8), line(96, 424, 96, 456, 8), line(416, 424, 416, 456, 8)].join("")
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="72" fill="${BLUE}"/>
${fine}
<circle cx="256" cy="256" r="${detail ? 116 : 140}" fill="none" stroke="${INK}" stroke-width="${detail ? 16 : 36}"/>
${detail ? line(256, 96, 256, 416, 12) + line(96, 256, 416, 256, 12) : ""}
<circle cx="256" cy="256" r="${detail ? 28 : 44}" fill="${GOLD}"/>
</svg>`;
}

function render(markup, size, out) {
  const dir = mkdtempSync(join(tmpdir(), "icons-"));
  const file = join(dir, "icon.svg");
  writeFileSync(file, markup);
  try {
    execFileSync("convert", ["-background", "none", "-density", String(Math.ceil((72 * size) / 512 * 4)), file,
      "-resize", `${size}x${size}`, `PNG32:${out}`]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

mkdirSync("build/icons", { recursive: true });
for (const size of SIZES) render(svg(size >= 64), size, `build/icons/${size}x${size}.png`);
copyFileSync("build/icons/512x512.png", "build/icon.png");
render(svg(false), 32, "build/tray.png");
console.log("wrote build/icons/*, build/icon.png, build/tray.png");

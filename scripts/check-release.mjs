// Fails when the renderer bundle for a release build still holds the dev-only styleguide.
//   node scripts/check-release.mjs   (run by `pnpm build:release` after the build)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "dist-renderer");
const NEEDLES = ["StyleguideApp", "styleguide-"];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let bad = 0;
for (const file of walk(root)) {
  if (/\.(woff2?|ttf|otf|png|ico|jpe?g|webp)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const needle of NEEDLES) {
    if (text.includes(needle)) {
      console.error(`check-release: ${file} contains "${needle}"`);
      bad++;
    }
  }
}
if (bad > 0) process.exit(1);
console.log("check-release: OK (no styleguide code in dist-renderer)");

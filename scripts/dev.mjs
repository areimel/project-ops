import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// The npm-installed chrome-sandbox is never setuid root, so Chromium's SUID sandbox aborts.
// In dev only, fall back to --no-sandbox when it is not (the packaged .deb installs it setuid).
function sandboxArgs() {
  try {
    const helper = join(dirname(createRequire(import.meta.url).resolve("electron")), "dist", "chrome-sandbox");
    const st = statSync(helper);
    if (st.uid === 0 && (st.mode & 0o4000) !== 0) return [];
  } catch {}
  console.warn("[dev] chrome-sandbox is not setuid root; launching Electron with --no-sandbox (dev only)");
  return ["--no-sandbox"];
}

const run = (cmd, args, env = {}) =>
  spawn(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });

const children = [];
const stop = () => children.forEach((c) => c.kill("SIGTERM"));
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });

// APP_DEV_PORT picks the Vite port (default 5173). Vite runs with strictPort, so if another project already
// holds the port Vite exits, and we stop here instead of pointing Electron at that other project's page.
const port = Number(process.env.APP_DEV_PORT) || 5173;
const url = `http://localhost:${port}`;
const vite = run("pnpm", ["exec", "vite", "--configLoader", "runner"], { APP_DEV_PORT: String(port) });
vite.on("exit", (code) => {
  console.error(`[dev] Vite stopped (exit ${code}). If port ${port} is in use, set APP_DEV_PORT to a free one.`);
  stop();
  process.exit(1);
});
children.push(vite);
children.push(run("node", ["scripts/build-electron.mjs", "--watch"]));
await new Promise((r) => run("pnpm", ["exec", "wait-on", url, "dist-electron/main.js"]).on("exit", r));
const app = run("pnpm", ["exec", "electron", ...sandboxArgs(), "."], { VITE_DEV_SERVER_URL: url });
children.push(app);
app.on("exit", () => { stop(); process.exit(0); });

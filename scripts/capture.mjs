#!/usr/bin/env node
// Run one screenshot capture (see electron/devCapture.ts) inside a nested X display, so test windows never
// open on the desktop itself: one Xephyr window holds them all and they cannot take keyboard focus.
//
//   node scripts/capture.mjs --out shot.png [--size 1280x800] [--seed | --seed-light | --empty | --profile <dir>]
//                            [--link project-ops://open/projects] [--eval '<js>'] [--delay 4000] [--keys /,Down]
//   node scripts/capture.mjs --stop        shut the nested display down
//
// Build first: pnpm exec vite build --configLoader runner && pnpm build:electron
// The nested display starts on the first run and stays up. Where it opens and how big it is:
//   APP_CAPTURE_SCREEN=1680x1000+110+1780   (WxH+X+Y in desktop coordinates; the default sits on monitor DP-1)
//   APP_CAPTURE_DISPLAY=77                  (X display number)
// Captures run one at a time (a lock makes concurrent callers wait); --size may not exceed the nested screen.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NUM = process.env.APP_CAPTURE_DISPLAY || "77";
const SCREEN = process.env.APP_CAPTURE_SCREEN || "1680x1000+110+1780";
const SOCKET = `/tmp/.X11-unix/X${NUM}`;
const LOCK = join(tmpdir(), `project-ops-capture-${NUM}.lock`);
const VALUE_FLAGS = new Set(["out", "size", "profile", "link", "eval", "delay", "keys"]);
const SWITCHES = new Set(["seed", "seed-light", "empty", "stop"]);   // --seed is the default, accepted for clarity

function fail(message) {
  console.error(`capture: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) fail(`unexpected argument ${a}`);
    const key = a.slice(2);
    if (VALUE_FLAGS.has(key)) {
      if (i + 1 >= argv.length) fail(`--${key} needs a value`);
      o[key] = argv[++i];
    } else if (SWITCHES.has(key)) o[key] = true;
    else fail(`unknown option ${a}`);
  }
  return o;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** True when an X server answers on the nested display (a socket file alone can be a crashed server's). */
function displayAlive() {
  return existsSync(SOCKET) && spawnSync("xdpyinfo", ["-display", `:${NUM}`], { stdio: "ignore" }).status === 0;
}

function clearDeadDisplay() {
  rmSync(SOCKET, { force: true });
  rmSync(`/tmp/.X${NUM}-lock`, { force: true });
}

async function ensureDisplay() {
  if (displayAlive()) return;
  clearDeadDisplay();
  const which = spawnSync("sh", ["-c", "command -v Xephyr"], { encoding: "utf8" });
  if (which.status !== 0) fail("Xephyr is not installed (Debian/Ubuntu: xserver-xephyr)");
  const child = spawn("Xephyr", [`:${NUM}`, "-screen", SCREEN, "-ac", "-br", "-no-host-grab", "-title", "Project Ops test windows"],
    { detached: true, stdio: "ignore" });
  child.unref();
  for (let i = 0; i < 50 && !displayAlive(); i++) await sleep(100);
  if (!displayAlive()) fail(`the nested display :${NUM} did not start`);
  await sleep(300);
}

function lockOwnerAlive() {
  try {
    process.kill(Number(readFileSync(join(LOCK, "pid"), "utf8")), 0);
    return true;
  } catch (e) {
    return e?.code === "EPERM";
  }
}

/** One capture at a time, whoever asks: wait for the lock. A lock whose owner process is gone is taken over. */
async function takeLock() {
  for (let i = 0; i < 1500; i++) {
    try {
      mkdirSync(LOCK);
      writeFileSync(join(LOCK, "pid"), String(process.pid));
      return;
    } catch {
      await sleep(200);   // also gives a new owner time to write its pid before anyone judges the lock dead
      if (existsSync(LOCK) && !lockOwnerAlive()) rmSync(LOCK, { recursive: true, force: true });
    }
  }
  fail("another capture held the lock for five minutes");
}

let locked = false;
function dropLock() {
  if (locked) rmSync(LOCK, { recursive: true, force: true });
  locked = false;
}
// Ctrl-C reaches Electron too; once it has gone the handler runs, so the lock never outlives the run.
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { dropLock(); process.exit(130); });

function stopDisplay() {
  const r = spawnSync("pkill", ["-f", `^Xephyr :${NUM} `]);
  clearDeadDisplay();
  console.log(r.status === 0 ? `capture: stopped display :${NUM}` : `capture: display :${NUM} was not running`);
}

function makeProfile(o) {
  if (o.profile) return resolve(o.profile);
  const dir = mkdtempSync(join(tmpdir(), "project-ops-capture-"));
  if (o.empty) return dir;
  const args = [join(ROOT, "scripts/capture-seed.mjs"), dir, ...(o["seed-light"] ? ["--light"] : [])];
  const r = spawnSync(process.execPath, args, { stdio: "ignore" });
  if (r.status !== 0) fail("seeding the profile failed");
  return dir;
}

const o = parseArgs(process.argv.slice(2));
if (o.stop) {
  stopDisplay();
  process.exit(0);
}
if (!o.out) fail("--out <png> is required");
const size = o.size || "1280x800";
const [w, h] = size.split("x").map(Number);
const [sw, sh] = SCREEN.split("+")[0].split("x").map(Number);
if (!(w > 0 && h > 0)) fail(`bad --size ${size}`);
if (w > sw || h > sh) fail(`--size ${size} is larger than the nested screen ${sw}x${sh}`);

await ensureDisplay();
const profile = makeProfile(o);

// Only the nested display is reachable: no Wayland socket, X11 forced.
const env = { ...process.env, DISPLAY: `:${NUM}`, APP_CAPTURE: resolve(o.out), APP_CAPTURE_SIZE: size, APP_CAPTURE_DELAY: o.delay || "4000" };
delete env.WAYLAND_DISPLAY;
if (o.eval) env.APP_CAPTURE_EVAL = o.eval;
if (o.keys) env.APP_CAPTURE_KEYS = o.keys;

const electron = join(ROOT, "node_modules/.bin/electron");
const args = ["--no-sandbox", "--ozone-platform=x11", `--user-data-dir=${profile}`, ROOT, ...(o.link ? [o.link] : [])];
await takeLock();
locked = true;
let run;
try {
  run = spawnSync(electron, args, { cwd: ROOT, env, encoding: "utf8", timeout: 120000 });
} finally {
  dropLock();
}
const lines = `${run.stdout ?? ""}${run.stderr ?? ""}`.split("\n").filter((l) => /^\[(eval|eval error|capture error)\]/.test(l));
for (const l of lines) console.log(l);
if (!existsSync(resolve(o.out))) fail(`no screenshot was written (exit ${run.status})`);
console.log(`capture: ${resolve(o.out)}`);

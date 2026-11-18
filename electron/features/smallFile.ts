// Bounded reads of small files a scanned folder controls (package.json, .git/HEAD, .git/config). A folder may hold
// a symlink to a device, a FIFO or a file that grows while we read it, so: lstat first and require a regular
// file (symlinks refused), open without following links and without blocking, check again on the open handle,
// and read at most `max + 1` bytes into a fixed buffer; anything longer is refused.
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";

const FLAGS = process.platform === "win32"
  ? constants.O_RDONLY
  : constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;

/** The file's text (utf8), or null when it is missing, not a regular file, a symlink, unreadable or over `max` bytes. */
export async function readSmallFile(path: string, max: number): Promise<string | null> {
  let handle;
  try {
    if (!(await lstat(path)).isFile()) return null;
    handle = await open(path, FLAGS);
    if (!(await handle.stat()).isFile()) return null;
    const buf = Buffer.alloc(max + 1);
    let used = 0;
    while (used < buf.length) {
      const { bytesRead } = await handle.read(buf, used, buf.length - used, used);
      if (bytesRead === 0) break;
      used += bytesRead;
    }
    return used > max ? null : buf.subarray(0, used).toString("utf8");
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

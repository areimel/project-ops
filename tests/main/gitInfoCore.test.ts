import { describe, expect, it } from "vitest";
import { healLink } from "../../shared/projects/record";
import { parseCommitTime, parseStatus, remoteToHttps } from "../../electron/features/gitInfoCore";

describe("parseStatus", () => {
  it("reads a clean branch", () => {
    const out = "# branch.oid abc\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +0 -0\n";
    expect(parseStatus(out)).toEqual({ branch: "main", dirty: false });
  });
  it("is dirty on any change line", () => {
    expect(parseStatus("# branch.head dev\n1 .M N... 100644 100644 100644 a b src/x.ts\n").dirty).toBe(true);
    expect(parseStatus("# branch.head dev\n? new.txt\n")).toEqual({ branch: "dev", dirty: true });
  });
  it("gives a null branch when detached", () => {
    expect(parseStatus("# branch.oid abc\n# branch.head (detached)\n")).toEqual({ branch: null, dirty: false });
  });
  it("handles a repo with no commits yet", () => {
    expect(parseStatus("# branch.oid (initial)\n# branch.head main\n")).toEqual({ branch: "main", dirty: false });
  });
  it("handles empty output and CRLF", () => {
    expect(parseStatus("")).toEqual({ branch: null, dirty: false });
    expect(parseStatus("# branch.head x\r\n")).toEqual({ branch: "x", dirty: false });
  });
});

describe("parseCommitTime", () => {
  it("converts seconds to ms", () => expect(parseCommitTime("1700000000\n")).toBe(1700000000000));
  it("is null for empty or junk", () => {
    expect(parseCommitTime("")).toBeNull();
    expect(parseCommitTime("fatal: no commits")).toBeNull();
    expect(parseCommitTime("-5")).toBeNull();
  });
});

describe("remoteToHttps", () => {
  it.each([
    ["git@github.com:user/repo.git", "https://github.com/user/repo"],
    ["github.com:user/repo", "https://github.com/user/repo"],
    ["ssh://git@host.example/user/repo.git", "https://host.example/user/repo"],
    ["ssh://git@host.example:2222/user/repo.git", "https://host.example/user/repo"],
    ["git://host.example/user/repo.git", "https://host.example/user/repo"],
    ["https://github.com/user/repo.git", "https://github.com/user/repo"],
    ["https://github.com/user/repo/", "https://github.com/user/repo"],
    ["  https://github.com/user/repo.git\n", "https://github.com/user/repo"],
    ["git@gitlab.com:group/sub/repo.git", "https://gitlab.com/group/sub/repo"],
  ])("%s", (input, want) => expect(remoteToHttps(input)).toBe(want));

  it("strips credentials", () => {
    const out = remoteToHttps("https://user:token@host.example/user/repo.git");
    expect(out).toBe("https://host.example/user/repo");
    expect(out).not.toContain("token");
  });

  it.each([
    "", "   ", "http://github.com/user/repo.git", "file:///home/me/repo", "/home/me/repo", "../repo", "./repo",
    "C:\\work\\repo", "C:/work/repo", "ftp://host/user/repo", "https://host/", "https://host", "git@host:",
    "git@host:a/../b", "not a url", "https://",
  ])("rejects %j", (input) => expect(remoteToHttps(input)).toBeNull());

  it("always returns something healLink accepts", () => {
    for (const r of ["git@github.com:a/b.git", "https://u:p@h.io/a/b.git", "ssh://git@h.io:22/a/b"]) {
      const out = remoteToHttps(r);
      expect(out).not.toBeNull();
      expect(healLink(out)).toBe(out);
    }
  });
});

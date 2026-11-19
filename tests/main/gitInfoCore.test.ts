import { describe, expect, it } from "vitest";
import { healLink } from "../../shared/projects/record";
import {
  configEntries, configKeys, disallowedKeys, isPlainConfigText, isPlainRepoConfig, parseCommitTime, parseHeadFile,
  parseOriginUrl, parseStatus, plainConfigValues, remoteToHttps,
} from "../../electron/features/gitInfoCore";

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

const FRESH_CLONE = `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
[remote "origin"]
	url = git@github.com:u/repo.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
`;

describe("configEntries and configKeys", () => {
  it("reads sections, quoted subsections (case kept) and keys (lower-cased)", () => {
    expect(configKeys("[Core]\n\tFileMode = true\n[remote \"Origin\"]\n  URL = x\n[branch \"we\\\"ird\"]\nremote = o\n"))
      .toEqual(["core.filemode", "remote.Origin.url", "branch.we\"ird.remote"]);
  });
  it("reads the deprecated dotted header, a key on the header line and a bare key", () => {
    expect(configKeys("[remote.ORIGIN]\nurl = x\n[core] bare\n")).toEqual(["remote.origin.url", "core.bare"]);
  });
  it("skips comments and strips trailing comments outside quotes", () => {
    expect(configEntries("# top\n; also\n[core]\n  eol = lf # note\n  autocrlf = \"in#put\" ; x\n")).toEqual([
      { key: "core.eol", value: "lf" }, { key: "core.autocrlf", value: "in#put" },
    ]);
  });
  it("refuses a continuation line, an unterminated quote, junk and keys before a section", () => {
    expect(configEntries("[core]\n  eol = l\\\nfsmonitor = x\n")).toBeNull();
    expect(configEntries("[core]\n  eol = \"lf\n")).toBeNull();
    expect(configEntries("[core]\n  = x\n")).toBeNull();
    expect(configEntries("[core\nbare = true\n")).toBeNull();
    expect(configEntries("bare = true\n")).toBeNull();
    expect(configKeys("[core]\n%%%\n")).toBeNull();
  });
});

describe("isPlainConfigText and isPlainRepoConfig", () => {
  it("accepts a fresh clone", () => {
    expect(isPlainConfigText(FRESH_CLONE)).toBe(true);
    expect(isPlainConfigText("")).toBe(true);
  });
  it("accepts branches, submodule urls and plain user settings", () => {
    const text = `${FRESH_CLONE}[branch "feature/x"]\n\trebase = true\n\tvscode-merge-base = origin/main\n`
      + "[submodule \"lib\"]\n\turl = https://github.com/u/lib.git\n\tactive = true\n\tupdate = rebase\n"
      + "[user]\n\tname = A\n\temail = a@b\n[pull]\n\tff = only\n[init]\n\tdefaultBranch = main\n"
      + "[lfs]\n\trepositoryformatversion = 0\n[lfs \"https://h.example/r.git/info/lfs\"]\n\taccess = basic\n";
    expect(isPlainConfigText(text)).toBe(true);
  });
  it("accepts the gh CLI's base-branch key and core.hooksPath (overridden by -c on every call)", () => {
    const text = `${FRESH_CLONE}[branch "fix"]\n\tgithub-pr-base-branch = main\n\tgithub-pr-owner-number = "u#r#1"\n`
      + "[core]\n\thooksPath = .githooks\n";
    expect(isPlainConfigText(text)).toBe(true);
    expect(isPlainConfigText(`${FRESH_CLONE}[core]\n\thooksPath\n`)).toBe(true);
  });
  it.each([
    ["filter", "[filter \"lfs\"]\n\tclean = git-lfs clean -- %f\n"],
    ["fsmonitor", "[core]\n\tfsmonitor = ./x.sh\n"],
    ["fsmonitor on the header line", "[core] fsmonitor = ./x.sh\n"],
    ["alias", "[alias]\n\tst = !sh -c x\n"],
    ["worktree config", "[extensions]\n\tworktreeConfig = true\n"],
    ["format version 1", "[core]\n\trepositoryformatversion = 1\n"],
    ["include", "[include]\n\tpath = ../evil\n"],
    ["includeIf", "[includeIf \"gitdir:/\"]\n\tpath = ../evil\n"],
    ["unknown key", "[core]\n\tsomethingnew = 1\n"],
    ["unknown section", "[future]\n\tx = 1\n"],
    ["signing key", "[user]\n\tsigningkey = abc\n"],
    ["submodule update command", "[submodule \"s\"]\n\tupdate = !rm -rf ~\n"],
    ["ext:: url", "[remote \"origin\"]\n\turl = ext::sh -c touch% /tmp/x\n"],
    ["helper:: submodule url", "[submodule \"s\"]\n\turl = fd::3\n"],
    ["allowlisted key without its subsection", "[remote]\n\turl = x\n"],
  ])("rejects %s", (_name, extra) => {
    expect(isPlainConfigText(FRESH_CLONE + extra)).toBe(false);
  });
  it("lists only the keys off the allowlist", () => {
    const keys = ["core.bare", "core.fsmonitor", "remote.o.url", "alias.co", "extensions.worktreeconfig"];
    expect(disallowedKeys(keys)).toEqual(["core.fsmonitor", "alias.co", "extensions.worktreeconfig"]);
    expect(isPlainRepoConfig(keys)).toBe(false);
    expect(isPlainRepoConfig(["core.bare", "branch.main.merge"])).toBe(true);
  });
  it("checks values only where they matter", () => {
    expect(plainConfigValues([{ key: "core.repositoryformatversion", value: "0" }])).toBe(true);
    expect(plainConfigValues([{ key: "core.repositoryformatversion", value: null }])).toBe(false);
    expect(plainConfigValues([{ key: "submodule.s.update", value: " !x" }])).toBe(false);
    expect(plainConfigValues([{ key: "remote.o.pushurl", value: "ext::x" }])).toBe(false);
    expect(plainConfigValues([{ key: "branch.main.description", value: "a::b" }])).toBe(true);
  });
});

describe("parseHeadFile", () => {
  it("reads a branch ref", () => {
    expect(parseHeadFile("ref: refs/heads/main\n")).toBe("main");
    expect(parseHeadFile("ref: refs/heads/feature/x\r\n")).toBe("feature/x");
  });
  it("is null for a detached hash or junk", () => {
    expect(parseHeadFile("0123456789abcdef0123456789abcdef01234567\n")).toBeNull();
    expect(parseHeadFile("ref: refs/tags/v1\n")).toBeNull();
    expect(parseHeadFile("")).toBeNull();
  });
});

describe("parseOriginUrl", () => {
  it("reads url from the origin section only", () => {
    const text = [
      "[core]", "\tbare = false", "[remote \"upstream\"]", "\turl = git@x.example:u/up.git",
      "[remote \"origin\"]", "\tfetch = +refs/heads/*:refs/remotes/origin/*", "\turl = git@github.com:u/repo.git",
    ].join("\n");
    expect(parseOriginUrl(text)).toBe("git@github.com:u/repo.git");
  });
  it("ignores case of section and key, strips quotes and comments", () => {
    expect(parseOriginUrl("[Remote \"origin\"]\n  URL = \"https://h.example/a\" ; note\n")).toBe("https://h.example/a");
  });
  it("is null without an origin url", () => {
    expect(parseOriginUrl("[remote \"Origin\"]\nurl = x\n")).toBeNull();
    expect(parseOriginUrl("[core]\nurl = https://h.example/a\n")).toBeNull();
    expect(parseOriginUrl("")).toBeNull();
  });
});

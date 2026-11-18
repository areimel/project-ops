import { describe, expect, it } from "vitest";
import { PLAYER_COMMANDS } from "../../renderer/apps/player/playerModel";
import { extensionOf, isAudioName, isMediaExtension, MEDIA_EXTENSIONS, mimeForName } from "../../shared/mediaTypes";
import { COMMAND_ID } from "../../shared/commands";

describe("playerModel", () => {
  it("reads the extension from the last dot, case-insensitively", () => {
    expect(extensionOf("/a/b/Clip.MP4")).toBe("mp4");
    expect(extensionOf("a.tar.webm")).toBe("webm");
    expect(extensionOf("noext")).toBe("");
    expect(extensionOf("dir.d/noext")).toBe("");
    expect(extensionOf("trailing.")).toBe("");
  });

  it("accepts what Chromium plays and refuses the rest", () => {
    for (const n of ["a.mp4", "a.M4V", "a.webm", "a.mov", "a.ogv", "a.mp3", "a.m4a", "a.ogg", "a.wav", "a.flac"]) {
      expect(isMediaExtension(n), n).toBe(true);
    }
    for (const n of ["a.mkv", "a.avi", "a.txt", "mp4", ".mp4x", "a.toString", "a.__proto__", ""]) {
      expect(isMediaExtension(n), n).toBe(false);
    }
  });

  it("tells audio from video and maps every extension to a MIME type", () => {
    expect(isAudioName("song.flac")).toBe(true);
    expect(isAudioName("clip.mp4")).toBe(false);
    for (const e of MEDIA_EXTENSIONS) expect(mimeForName(`x.${e}`)).toMatch(/^(video|audio)\//);
    expect(mimeForName("x.txt")).toBe("application/octet-stream");
  });

  it("declares valid, uniquely named commands", () => {
    const ids = PLAYER_COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(COMMAND_ID);
      expect(id.startsWith("player.")).toBe(true);
    }
  });
});

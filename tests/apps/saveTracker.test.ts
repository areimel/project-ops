import { describe, expect, it } from "vitest";
import { IDLE_TRACK, track, trackState, type SaveEvent } from "../../renderer/apps/notes/saveTracker";

const run = (...events: SaveEvent[]) => trackState(events.reduce(track, IDLE_TRACK));

describe("saveTracker", () => {
  it("is saved when idle", () => expect(run()).toBe("saved"));
  it("follows one save", () => {
    expect(run("edit")).toBe("unsaved");
    expect(run("edit", "start")).toBe("saving");
    expect(run("edit", "start", "ok")).toBe("saved");
  });
  it("does not say saved while newer edits wait", () => {
    expect(run("edit", "start", "edit", "ok")).toBe("unsaved");
    expect(run("edit", "start", "edit", "ok", "start", "ok")).toBe("saved");
  });
  it("does not say saved while another save is in flight", () => {
    expect(run("edit", "start", "edit", "start", "ok")).toBe("saving");
    expect(run("edit", "start", "edit", "start", "ok", "ok")).toBe("saved");
  });
  it("reports a failure only when nothing newer is waiting", () => {
    expect(run("edit", "start", "fail")).toBe("error");
    expect(run("edit", "start", "edit", "fail")).toBe("unsaved");
  });
  it("a new edit or save clears the failure", () => {
    expect(run("edit", "start", "fail", "edit")).toBe("unsaved");
    expect(run("edit", "start", "fail", "edit", "start", "ok")).toBe("saved");
  });
  it("is saved again when the draft is typed back to the note's text", () => {
    expect(run("edit", "clean")).toBe("saved");
  });
});

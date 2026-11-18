import { lazy } from "react";
import type { AppDefinition } from "../types";

export const notes: AppDefinition = {
  id: "notes",
  name: "Notes",
  icon: "notes",
  summary: "Records in a JSON collection: list, search, autosave",
  component: lazy(() => import("./NotesApp")),
  commands: [
    { id: "notes.new", label: "New note", group: "Notes", accelerator: "CmdOrCtrl+N" },
    { id: "notes.search", label: "Search notes", group: "Notes", keys: ["/"] },
    { id: "notes.pin", label: "Pin or unpin note", group: "Notes", keys: ["p"] },
    { id: "notes.delete", label: "Delete note", group: "Notes", keys: ["Delete"] },
  ],
};

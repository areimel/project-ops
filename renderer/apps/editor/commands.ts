import type { CommandSpec } from "../../../shared/commands";

export const EDITOR_COMMANDS: readonly CommandSpec[] = [
  { id: "editor.new", label: "New file", group: "Editor", accelerator: "CmdOrCtrl+N" },
  { id: "editor.open", label: "Open file", group: "Editor", accelerator: "CmdOrCtrl+O" },
  { id: "editor.save", label: "Save file", group: "Editor", accelerator: "CmdOrCtrl+S" },
  { id: "editor.saveAs", label: "Save file as", group: "Editor", accelerator: "CmdOrCtrl+Shift+S" },
  { id: "editor.preview", label: "Show or hide preview", group: "Editor", accelerator: "CmdOrCtrl+E" },
];

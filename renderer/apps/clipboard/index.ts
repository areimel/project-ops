import { lazy } from "react";
import type { AppDefinition } from "../types";

export const clipboard: AppDefinition = {
  id: "clipboard",
  name: "Clipboard",
  icon: "clipboard",
  summary: "System clipboard through main, and saved snippets",
  component: lazy(() => import("./ClipboardApp")),
  commands: [
    { id: "clipboard.read", label: "Read clipboard", group: "Clipboard", keys: ["r"] },
    { id: "clipboard.newSnippet", label: "New snippet", group: "Clipboard", accelerator: "CmdOrCtrl+N" },
  ],
};

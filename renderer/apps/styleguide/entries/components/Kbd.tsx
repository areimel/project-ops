import { Kbd } from "../../../../components/common/Kbd";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "kbd",
  title: "Kbd",
  family: "display",
  source: "renderer/components/common/Kbd.tsx",
  exports: ["Kbd"],
  purpose: "A key cap that shows a shortcut. It takes the accelerator spelling the code already uses (CmdOrCtrl+O) and writes it as the platform reads it: Ctrl on Linux and Windows, the symbols on macOS.",
  useFor: [
    "The shortcut beside a command in the command palette and the title bar's search button.",
    "A row of keys in the keyboard shortcuts help, one Kbd per key.",
  ],
  notFor: [
    "A key you type into a field: a text field is for the value, not a key cap.",
    "Describing a key in a sentence: write the name of the key in words, and use Kbd for the shortcut only.",
    "Showing a shortcut that the app does not handle: a hint must match a command in the shared command table.",
  ],
  snippet: "<Kbd k=\"CmdOrCtrl+O\" />\n<span className=\"help-keys\">{keys.map((k) => <Kbd key={k} k={k} />)}</span>",
  specimens: [
    {
      label: "Platform spelling",
      render: () => (
        <div className="styleguide-keys styleguide-small">
          <span>Linux and Windows</span><Kbd k="CmdOrCtrl+O" mac={false} />
          <span>macOS</span><Kbd k="CmdOrCtrl+O" mac />
          <span>This machine</span><Kbd k="CmdOrCtrl+O" />
        </div>
      ),
    },
    {
      label: "Beside a command",
      render: () => (
        <div className="styleguide-row">
          <span>Search commands</span>
          <Kbd k="CmdOrCtrl+K" mac={false} />
          <span>Go home</span>
          <Kbd k="CmdOrCtrl+Shift+H" mac={false} />
        </div>
      ),
    },
    {
      label: "Single keys",
      render: () => (
        <div className="styleguide-row">
          <Kbd k="/" mac={false} />
          <Kbd k="F5" mac={false} />
          <Kbd k="?" mac={false} />
          <Kbd k="Escape" mac={false} />
        </div>
      ),
    },
  ],
  notes: [
    "Shortcuts are listed in the shared command table, so the cap and the menu cannot disagree. The ? sheet shows every one.",
  ],
} satisfies CatalogueEntry;

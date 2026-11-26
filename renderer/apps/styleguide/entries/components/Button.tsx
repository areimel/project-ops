import { Button } from "../../../../components/common/Button";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "button",
  title: "Button",
  family: "actions",
  source: "renderer/components/common/Button.tsx",
  exports: ["Button", "ButtonVariant"],
  purpose: "The text button for a command on a screen or in a dialog. Primary is the one action a surface asks for; quiet is every other command; danger is for a destructive command; link is a text action inside a sentence or a line.",
  useFor: [
    "Commands with a visible label: Save changes, Add folder, Rescan, Export data.",
    "Leading icon on a command that has a well-known mark: plus, refresh, trash, code.",
    "Destructive commands in settings and dialogs, as variant danger (Reset all data).",
  ],
  notFor: [
    "A single-glyph control with no text: use IconButton, which carries a required label.",
    "A menu of choices or a mode switch: use Segmented or Dropdown.",
    "Navigation or a web link: Button variant link is for an in-text action that runs a command (About, the dashboard retry); a plain anchor is for a page.",
  ],
  snippet: "<Button variant=\"primary\" disabled={invalid || saving} onClick={save}>Save changes</Button>\n<Button variant=\"quiet\" icon=\"plus\" onClick={addRoot}>Add folder</Button>",
  specimens: [
    {
      label: "Primary",
      render: () => (
        <div className="styleguide-row">
          <Button variant="primary">Save changes</Button>
          <Button variant="primary" disabled>Save changes</Button>
        </div>
      ),
    },
    {
      label: "Quiet",
      render: () => (
        <div className="styleguide-row">
          <Button variant="quiet">Cancel</Button>
          <Button variant="quiet" disabled>Cancel</Button>
        </div>
      ),
    },
    {
      label: "With icon",
      render: () => (
        <div className="styleguide-row">
          <Button variant="primary" icon="plus">Add a scan folder</Button>
          <Button variant="quiet" icon="refresh">Rescan</Button>
          <Button variant="quiet" icon="refresh" disabled>Rescan</Button>
        </div>
      ),
    },
    {
      label: "Danger",
      render: () => (
        <div className="styleguide-row">
          <Button variant="danger" icon="trash">Reset all data</Button>
          <Button variant="danger" disabled>Reset all data</Button>
        </div>
      ),
    },
    {
      label: "Link",
      render: () => (
        <p>
          Your links could not be loaded. <Button variant="link">Try again</Button>.
        </p>
      ),
    },
    {
      label: "Clicked, live",
      render: () => (
        <Live initial={0}>
          {(n, set) => <Button variant="quiet" onClick={() => set(n + 1)}>Clicked {n} {n === 1 ? "time" : "times"}</Button>}
        </Live>
      ),
    },
    {
      label: "Pressed",
      notInUse: true,
      render: () => (
        <div className="styleguide-row">
          <Button variant="quiet" aria-pressed="false">Show hidden</Button>
          <Button variant="quiet" aria-pressed="true">Show hidden</Button>
        </div>
      ),
    },
  ],
  notes: [
    "Hover and focus are live: point at a button or press Tab. Primary plays a short glitch on hover and focus.",
    "Labels are one to four words and do not wrap; a button never shrinks its text.",
  ],
} satisfies CatalogueEntry;

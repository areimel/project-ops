import { Button } from "../../../../components/common/Button";
import { ConfirmDialog, Dialog } from "../../../../components/common/Dialog";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const footer = (
  <>
    <Button variant="quiet" onClick={noop}>Cancel</Button>
    <Button onClick={noop}>Save</Button>
  </>
);
const LONG = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of a long body. The dialog body scrolls when the dialog runs out of height.`);

export const entry = {
  id: "dialog",
  title: "Dialog",
  family: "overlays",
  source: "renderer/components/common/Dialog.tsx",
  exports: ["Dialog", "ConfirmDialog"],
  purpose: "The modal window for a form or a short list that needs the owner's full attention, plus ConfirmDialog for a yes or no question. Reach for Dialog when work should finish or be cancelled before returning to the screen.",
  useFor: [
    "Editing a project (size lg) and adding or editing a resource link (md), with Save and Cancel in the footer.",
    "The shortcut help (lg) and the command palette (md), which close with Escape.",
    "ConfirmDialog for destructive or irreversible questions such as removing a resource link, with danger on the confirm button.",
  ],
  notFor: [
    "Asking a yes or no question from a screen: call useShell().confirm(options). The shell renders the one ConfirmDialog.",
    "Feedback after an action, such as \"Project removed\" with Undo: use Toast.",
    "A choice from a short list: use Dropdown. Settings is its own screen, not a dialog.",
  ],
  snippet: "<Dialog\n  title=\"Add a link\"\n  size=\"md\"\n  onClose={onClose}\n  footer={<>\n    <Button variant=\"quiet\" onClick={onClose}>Cancel</Button>\n    <Button onClick={save}>Save</Button>\n  </>}\n>\n  <TextField label=\"Name\" value={name} onChange={setName} />\n</Dialog>",
  specimens: [
    { label: "Size sm", wide: true, render: () => <Dialog inline title="Small dialog" size="sm" onClose={noop} footer={footer}><p>Sm is 360px wide.</p></Dialog> },
    { label: "Size md (default)", wide: true, render: () => <Dialog inline title="Medium dialog" size="md" onClose={noop} footer={footer}><p>Md is 480px wide.</p></Dialog> },
    { label: "Size lg", wide: true, render: () => <Dialog inline title="Large dialog" size="lg" onClose={noop} footer={footer}><p>Lg is 680px wide, used for the project form.</p></Dialog> },
    { label: "No footer", wide: true, render: () => <Dialog inline title="Command palette" onClose={noop}><p>Without a footer the body ends at the bottom edge.</p></Dialog> },
    {
      label: "Long body (cropped)", wide: true,
      render: () => (
        <div style={{ maxHeight: 280, overflow: "hidden" }}>
          <Dialog inline title="Keyboard shortcuts" size="lg" onClose={noop} footer={footer}>
            {LONG.map((t) => <p key={t}>{t}</p>)}
          </Dialog>
        </div>
      ),
    },
    { label: "ConfirmDialog", wide: true, render: () => <ConfirmDialog inline title="Replace your data?" body="Importing replaces the projects and links stored here." confirmLabel="Import" onConfirm={noop} onCancel={noop} /> },
    { label: "ConfirmDialog, danger", wide: true, render: () => <ConfirmDialog inline danger title="Remove this link?" body="The link is deleted from the dashboard." confirmLabel="Remove" onConfirm={noop} onCancel={noop} /> },
  ],
  notes: [
    "Every specimen here is shown in place with the inline prop: no backdrop, no focus move, and nothing closes it. Never pass inline in a screen.",
    "A real Dialog is modal: it covers the window, moves focus to [data-autofocus] or the first control, keeps Tab inside, closes on Escape and on a click on the backdrop, and returns focus when it closes.",
    "Screens do not render ConfirmDialog. useShell().confirm(options) returns a promise of true or false and the shell shows one dialog at a time; a second call cancels the first.",
    "A real dialog caps at the window height and scrolls its body; inline dialogs size by content, so the long body specimen is only cropped here and the scroll cannot be shown.",
  ],
} satisfies CatalogueEntry;

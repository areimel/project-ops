import { IconButton } from "../../../../components/common/IconButton";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "icon-button",
  title: "IconButton",
  family: "actions",
  source: "renderer/components/common/IconButton.tsx",
  exports: ["IconButton"],
  purpose: "A square, ghost button that shows only an icon. The label is required: it becomes the tooltip and the accessible name. Use it where the icon is already understood, such as a card's footer or the title bar.",
  useFor: [
    "Secondary actions in a card footer: open folder, open terminal, copy path, edit (the project card).",
    "Close and dismiss controls on dialogs and toasts.",
    "Pin toggles, with aria-pressed to show the state.",
  ],
  notFor: [
    "A command that needs words to be understood: use Button with a label, icon optional.",
    "A two-state option set: use Segmented.",
    "An icon-only action with no label to give it: the component will not accept one, so write a Button instead.",
  ],
  snippet: "<IconButton icon=\"folder\" label=\"Open folder\" disabled={gone}\n  onClick={() => a.open(p.id, \"folder\")} />\n<IconButton icon=\"pin\" label=\"Pin to the top\" aria-pressed={p.pinned}\n  onClick={() => a.togglePin(p.id)} />",
  specimens: [
    {
      label: "Default",
      render: () => (
        <div className="styleguide-row">
          <IconButton icon="folder" label="Open folder" onClick={() => {}} />
          <IconButton icon="copy" label="Copy path" onClick={() => {}} />
          <IconButton icon="close" label="Dismiss" onClick={() => {}} />
        </div>
      ),
    },
    {
      label: "Disabled",
      render: () => (
        <div className="styleguide-row">
          <IconButton icon="folder" label="Open folder" disabled />
          <IconButton icon="terminal" label="Open terminal here" disabled />
        </div>
      ),
    },
    {
      label: "Pressed (aria-pressed)",
      render: () => (
        <div className="styleguide-row">
          <IconButton icon="pin" label="Pin to the top" aria-pressed={false} onClick={() => {}} />
          <IconButton icon="pin" label="Unpin" aria-pressed={true} onClick={() => {}} />
        </div>
      ),
    },
    {
      label: "Active (active prop)",
      render: () => (
        <div className="styleguide-row">
          <IconButton icon="settings" label="Settings" active={false} onClick={() => {}} />
          <IconButton icon="settings" label="Close settings" active onClick={() => {}} />
        </div>
      ),
    },
    {
      label: "Toggled, live",
      render: () => (
        <Live initial={false}>
          {(pinned, set) => (
            <IconButton icon="pin" label={pinned ? "Unpin" : "Pin to the top"} aria-pressed={pinned} onClick={() => set(!pinned)} />
          )}
        </Live>
      ),
    },
    {
      label: "In a card footer", wide: true,
      render: () => (
        <Live initial={false}>
          {(pinned, set) => (
            <div className="styleguide-row">
              <IconButton icon="folder" label="Open folder" onClick={() => {}} />
              <IconButton icon="terminal" label="Open terminal here" onClick={() => {}} />
              <IconButton icon="copy" label="Copy path" onClick={() => {}} />
              <IconButton icon="pin" label="Pin to the top" aria-pressed={pinned} onClick={() => set(!pinned)} />
              <IconButton icon="pencil" label="Edit project" onClick={() => {}} />
            </div>
          )}
        </Live>
      ),
    },
  ],
  notes: [
    "The label is the tooltip and the accessible name: it should say the command in full, as the cards do.",
  ],
} satisfies CatalogueEntry;

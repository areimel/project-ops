import { useId } from "react";
import { Badge } from "../../../../components/common/Badge";
import { Icon } from "../../../../components/common/Icon";
import { IconButton } from "../../../../components/common/IconButton";
import { Kbd } from "../../../../components/common/Kbd";
import { List, ListRow } from "../../../../components/common/List";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

const FOLDERS = ["~/code_projects", "~/client_sites", "~/experiments"];

function Options() {
  const id = useId();
  const items: Array<[string, string]> = [["Go to Projects", "Ctrl+2"], ["Rescan", "F5"], ["Add scan folder", "Ctrl+O"]];
  return (
    <Live initial={0}>
      {(at, set) => (
        <List id={id} role="listbox" label="Commands">
          {items.map(([label, key], i) => (
            <ListRow key={label} optionId={`${id}-${i}`} selected={i === at} onSelect={() => set(i)}
              title={label} meta="Go" trailing={<Kbd k={key} />} />
          ))}
        </List>
      )}
    </Live>
  );
}

export const entry = {
  id: "list",
  title: "List",
  family: "display",
  source: "renderer/components/common/List.tsx",
  exports: ["List", "ListRow"],
  purpose: "A hairline-ruled list of rows, each with a title, optional meta and a trailing control. Use it for short lists of things the owner manages or picks from.",
  useFor: [
    "The scan folders in Settings: a title, a project count and a remove button.",
    "The command palette's results, in option mode with the active row following the arrow keys.",
    "A short pick-one list where the row title is the select button.",
  ],
  notFor: [
    "Objects with several actions and facts, such as projects: use Card.",
    "Facts about one thing (label and value pairs): use KeyValue.",
    "Choosing between two to four modes: use Segmented.",
  ],
  snippet: "<List label=\"Scan folders\">\n  {roots.map((r) => (\n    <ListRow key={r.id} title={r.folder} meta={count(r)}\n      trailing={<IconButton icon=\"trash\"\n        label={`Remove ${r.folder}`} onClick={() => remove(r.id)} />} />\n  ))}\n</List>",
  specimens: [
    {
      label: "Plain rows with meta and action", wide: true,
      render: () => (
        <List label="Scan folders">
          {FOLDERS.map((f, i) => (
            <ListRow key={f} title={f} meta={`${12 - i * 4} projects`}
              trailing={<IconButton icon="trash" label={`Remove ${f}`} onClick={() => {}} />} />
          ))}
        </List>
      ),
    },
    {
      label: "Selectable (click a row)", wide: true,
      render: () => (
        <Live initial={0}>
          {(at, set) => (
            <List label="Editors">
              {["Visual Studio Code", "Zed", "Neovim"].map((n, i) => (
                <ListRow key={n} title={n} selected={i === at} onSelect={() => set(i)} />
              ))}
            </List>
          )}
        </Live>
      ),
      notInUse: true,
    },
    {
      label: "Secondary line and leading icon", wide: true, notInUse: true,
      render: () => (
        <List label="Projects">
          <ListRow leading={<Icon name="folder" size={16} />} title="project-ops" secondary="~/code_projects/desktop-app-projects" meta={<Badge>Active</Badge>} />
          <ListRow leading={<Icon name="folder" size={16} />} title="harbor-dental" secondary="~/client_sites/harbor-dental" />
        </List>
      ),
    },
    {
      label: "Wrapping title", width: 320, notInUse: true,
      render: () => (
        <List label="Notes">
          <ListRow wrap title="Move the staging site to the new hosting plan once the client has signed off on the redesign" meta="Mar 12" />
        </List>
      ),
    },
    { label: "Option mode (click to move the active row)", width: 360, render: () => <Options /> },
  ],
  notes: [
    "Option mode (optionId) applies only when the list is a listbox driven by a field that keeps focus, as in the command palette: give List role=\"listbox\", each row an id (the palette derives them from a list id, which the field's aria-activedescendant points at), and move selected with the arrow keys. The row itself is clicked, not a button inside it.",
    "Without onSelect the title is plain text, so use that when the row's own control does the work, as in Settings.",
    "In the app only Settings (plain rows with meta and a trailing IconButton) and the palette (option mode) use it. secondary, leading, wrap and selectable button rows are not used yet.",
  ],
} satisfies CatalogueEntry;

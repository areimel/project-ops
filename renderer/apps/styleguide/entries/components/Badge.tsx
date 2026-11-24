import { Badge } from "../../../../components/common/Badge";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "badge",
  title: "Badge",
  family: "display",
  source: "renderer/components/common/Badge.tsx",
  exports: ["Badge", "BadgeVariant"],
  purpose: "A small chip for a label: a plain fact, a count, a toggle filter, or a removable tag. Tags the owner typed use the text face (variant tag); a fixed vocabulary such as stack ids keeps the mono outline.",
  useFor: [
    "Tags on a project card and in the edit dialog, as variant tag, with Remove in the dialog and the filter rail's include and exclude toggles.",
    "Stack ids on a card, the dossier and the Stack filter: the default mono outline, with a count in the rail.",
    "Services the owner typed on a site (variant tag), and the chips of active filters that can be removed one by one.",
  ],
  notFor: [
    "A status with a light and a label, such as Active or Paused: use StatusDot.",
    "A button with a text label and no toggle state: use Button.",
    "A long sentence or a note: use a paragraph; a badge truncates its text with an ellipsis.",
  ],
  snippet: "<div className=\"chip-row\">\n  <Badge variant=\"tag\" onClick={() => filterTag(t)} pressed={selected}>{t}</Badge>\n  <Badge count={4} pressed={stack === \"vite\"}>vite</Badge>\n  <Badge variant=\"tag\" onRemove={() => remove(t)}>{t}</Badge>\n</div>",
  specimens: [
    {
      label: "Outline, the default (stack ids)",
      render: () => (
        <div className="styleguide-row">
          <Badge>node</Badge>
          <Badge>vite</Badge>
          <Badge>electron</Badge>
        </div>
      ),
    },
    {
      label: "Tag, the owner's words",
      render: () => (
        <div className="styleguide-row">
          <Badge variant="tag">client</Badge>
          <Badge variant="tag">side project</Badge>
          <Badge variant="tag">wordpress</Badge>
        </div>
      ),
    },
    {
      label: "With a count",
      render: () => (
        <div className="styleguide-row">
          <Badge count={4}>vite</Badge>
          <Badge variant="tag" count={2}>client</Badge>
        </div>
      ),
    },
    {
      label: "Toggle, live (off, include, exclude)",
      render: () => (
        <Live initial="off">
          {(state, set) => {
            const next = state === "off" ? "include" : state === "include" ? "exclude" : "off";
            return (
              <div className="styleguide-row">
                <Badge variant="tag" count={3} pressed={state === "include"} excluded={state === "exclude"}
                  title={`Tag: ${state}. Click to change`} onClick={() => set(next)}>client</Badge>
                <span className="hint">{state === "off" ? "Not filtered" : state === "include" ? "Only projects with this tag" : "Hides projects with this tag"}</span>
              </div>
            );
          }}
        </Live>
      ),
    },
    {
      label: "Pressed and excluded, static",
      render: () => (
        <div className="styleguide-row">
          <Badge variant="tag" pressed onClick={() => undefined}>side project</Badge>
          <Badge variant="tag" excluded onClick={() => undefined}>archive</Badge>
        </div>
      ),
    },
    {
      label: "Removable",
      render: () => (
        <Live initial={["client", "wordpress"]}>
          {(tags, set) => (
            <div className="chip-row">
              {tags.map((t) => (
                <Badge key={t} variant="tag" onRemove={() => set(tags.filter((x) => x !== t))}>{t}</Badge>
              ))}
            </div>
          )}
        </Live>
      ),
    },
    {
      label: "Solid", notInUse: true,
      render: () => <div className="styleguide-row"><Badge variant="solid">Primary</Badge><Badge variant="solid" count={2}>Selected</Badge></div>,
    },
    {
      label: "Quiet", notInUse: true,
      render: () => <div className="styleguide-row"><Badge variant="quiet">Optional</Badge><Badge variant="quiet" count={0}>None</Badge></div>,
    },
    {
      label: "A row of tags", wide: true,
      render: () => (
        <div className="chip-row">
          <Badge variant="tag">client</Badge>
          <Badge variant="tag">side project</Badge>
          <Badge variant="tag">wordpress</Badge>
          <Badge variant="tag">needs review</Badge>
          <Badge variant="tag">archive later</Badge>
          <Badge variant="tag">internal tools</Badge>
        </div>
      ),
    },
  ],
  notes: [
    "The rule: a tag the owner typed is variant tag (text face, sentence case). A fixed id such as a stack name is the default mono outline.",
    "A toggle is a button inside the badge: aria-pressed is true or false, or mixed for excluded. A removable badge has its own button labelled Remove <text>.",
    "solid and quiet exist in the component and its CSS, but no screen uses them yet.",
  ],
} satisfies CatalogueEntry;

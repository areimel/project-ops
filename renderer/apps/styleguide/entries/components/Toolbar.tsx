import { Button } from "../../../../components/common/Button";
import { IconButton } from "../../../../components/common/IconButton";
import { TextField } from "../../../../components/common/TextField";
import { Toolbar } from "../../../../components/common/Toolbar";
import { Live } from "../../Live";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "toolbar",
  title: "Toolbar",
  family: "layout",
  source: "renderer/components/common/Toolbar.tsx",
  exports: ["Toolbar"],
  purpose: "The bar of controls across the top of a screen or a page section, with a hairline under it. Its children sit on the left; end content is pushed to the right edge.",
  useFor: [
    "The top bar of the Projects grid: search, sort, the count and the Add folder and Rescan buttons, with inset=\"page\".",
    "The bar of a project page: All projects on the left and Refresh, Pin, Edit on the right, with inset=\"page\".",
    "Any row of controls that belongs to a screen rather than to one form or dialog.",
  ],
  notFor: [
    "A plain row of buttons inside a card, a dialog or a form: use a span with className btn-row (shown below).",
    "A set of choices that switch a mode: use Segmented.",
    "A title above a group of controls: use SectionHead.",
  ],
  snippet: "<Toolbar label=\"Project\" inset=\"page\" className=\"projects-dossier-bar\">\n  <Button variant=\"quiet\" onClick={onBack}>All projects</Button>\n  <span className=\"btn-row\">\n    <Button variant=\"quiet\" icon=\"refresh\" onClick={refresh}>Refresh</Button>\n    <Button variant=\"quiet\" icon=\"pencil\" onClick={edit}>Edit</Button>\n  </span>\n</Toolbar>",
  specimens: [
    {
      label: "Page bar: search, count and buttons", wide: true,
      render: () => (
        <Live initial="">
          {(query, set) => (
            <Toolbar label="Projects" inset="page" className="projects-toolbar">
              <TextField className="projects-search" type="search" label="Search projects" hideLabel placeholder="Search projects" value={query} onChange={set} />
              <span className="label projects-count">{query ? "1 / 6" : "6 / 6"}</span>
              <div className="projects-toolbar-end">
                <Button variant="quiet" icon="plus">Add folder</Button>
                <Button variant="quiet" icon="refresh">Rescan</Button>
              </div>
            </Toolbar>
          )}
        </Live>
      ),
    },
    {
      label: "Project page bar", wide: true,
      render: () => (
        <Toolbar label="Project" inset="page" className="projects-dossier-bar">
          <Button variant="quiet">All projects</Button>
          <span className="btn-row">
            <Button variant="quiet" icon="refresh">Refresh</Button>
            <IconButton icon="pin" label="Pin to the top" />
            <Button variant="quiet" icon="pencil">Edit</Button>
          </span>
        </Toolbar>
      ),
    },
    {
      label: "Plain bar, no page inset", wide: true, notInUse: true,
      render: () => (
        <Toolbar label="Demo">
          <Button variant="quiet">Filter</Button>
          <Button variant="quiet">Sort</Button>
        </Toolbar>
      ),
    },
    {
      label: "End content (the end prop)", wide: true, notInUse: true,
      render: () => (
        <Toolbar label="Demo" end={<Button variant="quiet" icon="plus">Add link</Button>}>
          <span className="label">3 links</span>
        </Toolbar>
      ),
    },
    {
      label: "Button row, outside a toolbar",
      render: () => (
        <div className="btn-row">
          <Button variant="primary">Save changes</Button>
          <Button variant="quiet">Cancel</Button>
        </div>
      ),
    },
  ],
  notes: [
    "inset=\"page\" is the only form in use: it adds the screen's side padding and a taller row. Without it the bar is not used by any screen yet.",
    "The end prop is not used by any screen. The Projects bar wraps its right-hand buttons in its own element instead, so a screen can group them.",
    "Toolbar is for a screen; btn-row (renderer/styles/layout.css) is the plain wrapping row of buttons anywhere, and it takes the gap from --sp-2.",
  ],
} satisfies CatalogueEntry;

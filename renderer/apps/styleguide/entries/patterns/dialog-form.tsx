import { LinkDialog } from "../../../dashboard/LinkDialog";
import { ProjectDialog } from "../../../projects/ProjectDialog";
import { PROJECTS, RESOURCE_LINKS } from "../../fixtures";
import type { CatalogueEntry } from "../../types";

const noop = () => {};
const saved = () => Promise.resolve(true);
const GROUPS = ["Hosting", "Analytics"];
const BAD_URL = { id: "a000000000000009", name: "Local tool", url: "http://localhost:3000/", group: "" };

export const entry = {
  id: "dialog-form",
  title: "Dialog form",
  family: "patterns",
  source: "renderer/apps/projects/ProjectDialog.tsx",
  exports: ["ProjectDialog", "LinkDialog", "FormDialog", "SiteFields"],
  purpose: "How a screen edits a record: a FormDialog around a form grid, with a draft held in the dialog and turned into a patch of changed fields only. The specimens are the real dialogs, shown in place with their inline prop.",
  useFor: [
    "Editing the project (size lg) and adding or editing a resource link (md).",
    "A new record dialog: copy LinkDialog, which is the smallest complete one.",
    "A new field: add it to the draft module and its patch, then one control in the grid.",
  ],
  notFor: [
    "A yes or no question: use ConfirmDialog through useShell().confirm.",
    "Settings: they apply at once in SettingsSection, with no Save button.",
    "A dialog with no form: use Dialog directly.",
  ],
  snippet: "<FormDialog title=\"Edit link\" saveLabel=\"Save changes\"\n  invalid={draftInvalid(draft)}\n  patch={() => draftPatch(draft, link)}\n  onSave={onSave} onRemove={onRemove} onClose={onClose}\n  formClassName=\"form-grid\">\n  <TextField label=\"Name\" data-autofocus value={draft.name} onChange={...} />\n  <Combobox label=\"Group\" value={draft.group} suggestions={groups} onChange={...} />\n  <TextField className=\"form-wide\" label=\"Address\" error={urlProblem(draft.url) ?? undefined} />\n</FormDialog>",
  specimens: [
    {
      label: "Edit project", wide: true, minHeight: 560,
      render: () => (
        <ProjectDialog inline project={PROJECTS.pinned} categories={["Clients", "Internal"]} tags={["web", "astro", "api"]}
          hosting={["Netlify", "Cloudflare"]} services={["Design", "Build"]} onSave={saved} onRemove={noop} onClose={noop} />
      ),
    },
    {
      label: "New link", minHeight: 300,
      render: () => <LinkDialog inline link={null} groups={GROUPS} onSave={saved} onRemove={noop} onClose={noop} />,
    },
    {
      label: "Edit link", minHeight: 300,
      render: () => <LinkDialog inline link={RESOURCE_LINKS[0]} groups={GROUPS} onSave={saved} onRemove={noop} onClose={noop} />,
    },
    {
      label: "Field error: the link is not https", minHeight: 300,
      render: () => <LinkDialog inline link={BAD_URL} groups={GROUPS} onSave={saved} onRemove={noop} onClose={noop} />,
    },
  ],
  notes: [
    "FormDialog owns the form element, the footer (Remove at the start, Cancel, the primary button), Enter to save and the saving state. It closes only when onSave resolves true.",
    "The dialog owns a draft built by a pure module: draftFromView, draftInvalid, draftPatch and linkProblem in projectDraft.ts; draftFrom, emptyDraft, draftPatch and urlProblem in dashboardModel.ts. draftPatch returns null when nothing changed, and the dialog then just closes.",
    "A problem shows through the field's own error prop, not a banner. Layout is a .form-grid of two columns; a field that needs the full row has .form-wide. A sub-section such as Site is its own .form-grid .form-wide with a level 3 SectionHead.",
    "Specimens are not wrapped in .projects or .dashboard; the dialog classes (projects-form-*) need no ancestor. inline drops the backdrop, the focus trap and the focus move.",
  ],
} satisfies CatalogueEntry;

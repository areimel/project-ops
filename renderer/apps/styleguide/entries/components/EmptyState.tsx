import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "empty-state",
  title: "EmptyState",
  family: "feedback",
  source: "renderer/components/common/EmptyState.tsx",
  exports: ["EmptyState"],
  purpose: "What a screen or region shows when there is nothing to list: it says what is missing and offers the first action. Also used for load failures and a crashed screen.",
  useFor: [
    "A list with no records yet: No projects yet, with Add a scan folder.",
    "A filter that matches nothing: No projects match, with Clear filters.",
    "A load failure: Projects could not be loaded, with Try again.",
  ],
  notFor: [
    "A short in-place hint inside a popup list, such as the palette's no-match line: use a plain status paragraph.",
    "Transient news about an action: use Toast.",
    "A field that has no value yet: leave it empty or use a placeholder.",
  ],
  snippet: "<EmptyState icon=\"folder\" title=\"No projects yet\"\n  body=\"Add a folder that holds your projects.\"\n  action={<Button variant=\"primary\" icon=\"plus\">Add a scan folder</Button>} />",
  specimens: [
    { label: "Title only", wide: true, render: () => <EmptyState title="This project is not in the list" /> },
    { label: "With icon", wide: true, render: () => <EmptyState icon="folder" title="This project is not in the list" /> },
    {
      label: "With body", wide: true,
      render: () => <EmptyState title="No scan folders yet" body="Add the folder that holds your projects and Project Ops will find them." />,
    },
    {
      label: "With action", wide: true,
      render: () => (
        <EmptyState icon="filter" title="No projects match" body="Nothing fits the search and filters you have set."
          action={<Button variant="quiet" icon="close">Clear filters</Button>} />
      ),
    },
    {
      label: "Long body", wide: true,
      render: () => (
        <EmptyState icon="warning" title="This screen stopped working"
          body="Something went wrong while drawing it: Cannot read properties of undefined (reading 'folder'). Your saved data is not affected."
          action={<Button variant="quiet" icon="refresh">Try again</Button>} />
      ),
    },
  ],
  notes: [
    "Copy convention: the title is a plain statement of what is missing (No projects yet, No projects match, Projects could not be loaded), not an apology. The body says what to do or what is unaffected, in full sentences. The action names the next step in sentence case: Add a scan folder, Clear filters, Try again, Go to Projects.",
    "Use a primary button when the action creates the first record, a quiet one for recovery (Try again, Clear filters, All projects).",
  ],
} satisfies CatalogueEntry;

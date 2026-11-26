import { Button } from "../../../../components/common/Button";
import { Spinner } from "../../../../components/common/Spinner";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "spinner",
  title: "Spinner",
  family: "feedback",
  source: "renderer/components/common/Spinner.tsx",
  exports: ["Spinner"],
  purpose: "A turning square that shows work is under way and the screen cannot show a result yet. It has a required label, which is read to screen readers. It is the only looping motion in the app.",
  useFor: [
    "Whole-screen loading: the projects grid, the dashboard and a lazy screen while it loads.",
    "A scan in progress beside its control, in the Rescan actions and the projects toolbar.",
  ],
  notFor: [
    "A load that has a known length or a percentage: a bar would say how far it has got, a spinner cannot.",
    "A save or a click that finishes at once: show the result or a toast.",
    "Decoration in an empty state: use an Icon.",
  ],
  snippet: "<Spinner label=\"Scanning\" />\n<Button variant=\"quiet\" disabled aria-busy>{scanning && <Spinner label=\"Scanning\" />}Scanning</Button>",
  specimens: [
    {
      label: "Default",
      render: () => (
        <div className="styleguide-row">
          <Spinner label="Loading projects" />
        </div>
      ),
    },
    {
      label: "Beside text",
      render: () => (
        <div className="styleguide-row">
          <Spinner label="Scanning" />
          <span className="styleguide-muted">Scanning the scan folders</span>
        </div>
      ),
    },
    {
      label: "In a button",
      render: () => (
        <div className="styleguide-row">
          <Button variant="quiet" disabled aria-busy>
            <Spinner label="Scanning" />
            Scanning
          </Button>
        </div>
      ),
    },
    {
      label: "Loading a screen", wide: true,
      render: () => (
        <div className="styleguide-row">
          <Spinner label="Loading the dashboard" />
          <Spinner label="Loading Settings" />
        </div>
      ),
    },
  ],
  notes: [
    "The size is fixed at 24 pixels. The projects toolbar shrinks it to 12 pixels in its own stylesheet; there is no size prop.",
  ],
} satisfies CatalogueEntry;

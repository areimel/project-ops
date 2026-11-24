import { Badge } from "../../../../components/common/Badge";
import { Button } from "../../../../components/common/Button";
import { Field } from "../../../../components/common/Field";
import { Kbd } from "../../../../components/common/Kbd";
import { Segmented } from "../../../../components/common/Segmented";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "label",
  title: "The mono label",
  family: "foundations",
  source: "renderer/styles/base.css",
  exports: [".label", ".kicker", ".bullet"],
  purpose: "Small upper-case mono text for anything that names or commands: buttons, badges, field labels, key caps. One rule drives them all through the --label-* tokens.",
  useFor: ["Names, tags and commands in short runs of one to three words.", "A kicker above a block, led by the accent square."],
  notFor: ["Sentences or anything longer than a line.", "Upper-case source copy: write sentence case, CSS does the rest."],
  snippet: "<p className=\"label\">Last commit</p>\n<p className=\"kicker\">Pinned</p>",
  specimens: [
    { label: ".label", render: () => <p className="label">Last commit</p> },
    { label: ".kicker", render: () => <p className="kicker">Pinned</p> },
    { label: ".bullet", render: () => <span className="bullet" /> },
    {
      label: "Where it applies", wide: true,
      render: () => (
        <div className="styleguide-row">
          <Button variant="quiet">Button</Button>
          <Badge>Badge</Badge>
          <Kbd k="Ctrl+K" />
          <Segmented label="Sample" options={[{ value: "a", label: "Segment" }, { value: "b", label: "Other" }]} value="a" onChange={() => {}} />
          <Field label="Field label"><span className="styleguide-muted">Field control</span></Field>
        </div>
      ),
    },
  ],
} satisfies CatalogueEntry;

import { Button } from "../../../../components/common/Button";
import { Card, CardBody, CardFooter, CardHeader } from "../../../../components/common/Card";
import { StatusDot } from "../../../../components/common/StatusDot";
import type { CatalogueEntry } from "../../types";

const body = <CardBody><p>Desktop organizer for the owner's coding projects.</p></CardBody>;

export const entry = {
  id: "card",
  title: "Card",
  family: "display",
  source: "renderer/components/common/Card.tsx",
  exports: ["Card", "CardHeader", "CardBody", "CardFooter"],
  purpose: "A flat, hairline-bordered square for one object that sits in a grid with gaps, such as a project. Compose it from a header strip, a body and a footer of actions.",
  useFor: [
    "A project on the Projects grid (as a list item) with its category, status light and open buttons.",
    "A pinned or recent project tile on the dashboard.",
    "Muting a card whose folder is missing and marking the one deep-linked card as selected.",
  ],
  notFor: [
    "Cells of one page divided by hairlines, such as the project page: use Mosaic.",
    "A boxed group of settings or form fields: use Panel.",
    "A single row in a short list: use ListRow.",
  ],
  snippet: "<Card as=\"li\" muted={p.missing} selected={revealed} aria-label={p.name}>\n  <CardHeader start={p.category}\n    end={<StatusDot tone=\"accent\">Active</StatusDot>} />\n  <CardBody><h3>{p.name}</h3></CardBody>\n  <CardFooter><Button variant=\"quiet\">Open</Button></CardFooter>\n</Card>",
  specimens: [
    {
      label: "Header, body and footer", width: 320,
      render: () => (
        <Card aria-label="project-ops">
          <CardHeader start="Desktop apps" end={<StatusDot tone="accent">Active</StatusDot>} />
          <CardBody><h3>project-ops</h3><p>Desktop organizer for the owner's coding projects.</p></CardBody>
          <CardFooter><Button variant="quiet" icon="code">Editor</Button><Button variant="quiet" icon="folder">Folder</Button></CardFooter>
        </Card>
      ),
    },
    { label: "Body only", width: 320, render: () => <Card aria-label="Body only">{body}</Card> },
    {
      label: "Header start only", width: 320,
      render: () => <Card aria-label="Header start only"><CardHeader start="01 / Personal" />{body}</Card>,
    },
    {
      label: "Muted (missing folder)", width: 320,
      render: () => (
        <Card muted aria-label="old-site">
          <CardHeader start="Client sites" end={<StatusDot tone="danger">Folder missing</StatusDot>} />
          <CardBody><h3>old-site</h3><p>The folder was moved or renamed.</p></CardBody>
        </Card>
      ),
    },
    {
      label: "Selected", width: 320,
      render: () => (
        <Card selected aria-label="project-ops">
          <CardHeader start="Desktop apps" end={<StatusDot tone="muted">Paused</StatusDot>} />
          {body}
        </Card>
      ),
    },
    {
      label: "As a list item", width: 320,
      render: () => (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <Card as="li" aria-label="website">{body}</Card>
        </ul>
      ),
    },
    { label: "As a section", width: 320, notInUse: true, render: () => <Card as="section" aria-label="Section card">{body}</Card> },
  ],
  notes: [
    "Only as=\"li\" is used (Projects grid and dashboard tiles); article is the default and section and div are unused.",
    "The card is not clickable itself: the name inside it is the button, so give the card an aria-label.",
  ],
} satisfies CatalogueEntry;

import { Badge } from "../../../../components/common/Badge";
import { Card, CardBody } from "../../../../components/common/Card";
import { KeyValue, KeyValueList } from "../../../../components/common/KeyValue";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "key-value",
  title: "KeyValue",
  family: "display",
  source: "renderer/components/common/KeyValue.tsx",
  exports: ["KeyValueList", "KeyValue"],
  purpose: "A definition list of facts about one thing: a mono label on the left and a value on the right that is cut with an ellipsis when too long. Use it to show read-only traits of a project.",
  useFor: [
    "Trait rows on a project card: Branch, Last commit, Stack, Folder.",
    "The Git and Site cells of the project page.",
    "Any read-only fact where the value may be a node, such as a link or a dirty marker.",
  ],
  notFor: [
    "Editable values: use a Field with a TextField, as in the edit dialog.",
    "Long text that must wrap, such as notes or a description: use a paragraph.",
    "A list of selectable things: use List.",
  ],
  snippet: "<KeyValueList>\n  <KeyValue label=\"Branch\">main</KeyValue>\n  <KeyValue label=\"Folder\" title={p.folder}>{p.folder}</KeyValue>\n</KeyValueList>",
  specimens: [
    {
      label: "Several rows", width: 320,
      render: () => (
        <KeyValueList>
          <KeyValue label="Branch">main</KeyValue>
          <KeyValue label="Last commit">3 days ago</KeyValue>
          <KeyValue label="Stack">TypeScript, React, Electron</KeyValue>
        </KeyValueList>
      ),
    },
    {
      label: "Long value truncates", width: 240,
      render: () => (
        <KeyValueList>
          <KeyValue label="Folder">~/code_projects/desktop-app-projects/project-ops/renderer</KeyValue>
          <KeyValue label="Hosting" title="Netlify, with a custom domain">Netlify, with a custom domain</KeyValue>
        </KeyValueList>
      ),
    },
    {
      label: "Value is a node", width: 320,
      render: () => (
        <KeyValueList>
          <KeyValue label="Status"><Badge>Dirty</Badge></KeyValue>
          <KeyValue label="Remote"><a href="https://example.com/project-ops">example.com/project-ops</a></KeyValue>
        </KeyValueList>
      ),
    },
    {
      label: "Inside a card body", width: 320,
      render: () => (
        <Card aria-label="Traits">
          <CardBody>
            <KeyValueList>
              <KeyValue label="Client">Harbor Dental</KeyValue>
              <KeyValue label="Hosting">Netlify</KeyValue>
              <KeyValue label="Launch">12 Mar 2026</KeyValue>
            </KeyValueList>
          </CardBody>
        </Card>
      ),
    },
  ],
  notes: [
    "title (the hover text) defaults to the value only when it is a string. Pass title when the value is a node or when the hover should say more, as the Branch row does for uncommitted changes.",
  ],
} satisfies CatalogueEntry;

import { SplitPane } from "../../../../components/common/SplitPane";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "split-pane",
  title: "SplitPane",
  family: "layout",
  source: "renderer/components/common/SplitPane.tsx",
  exports: ["SplitPane"],
  purpose: "Two side-by-side regions with a fixed-width start column and a flexible end column, each scrolling on its own. It fills its parent's height, so it is for a full-screen pane layout rather than a block inside a page.",
  useFor: [
    "A master list beside a detail view, where the list keeps its width while the detail changes.",
    "A list that scrolls on its own next to content that scrolls on its own.",
  ],
  notFor: [
    "Two columns of ordinary page content that should not fill the height: use a plain CSS grid.",
    "Three or more regions: nest SplitPane or lay them out with CSS grid.",
    "A resizable divider: the start width is fixed by startWidth, the pane does not drag.",
  ],
  snippet: "<SplitPane label=\"Projects and detail\" startWidth=\"240px\"\n  start={<ProjectList />} end={<ProjectDetail />} />",
  status: "not-in-use",
  specimens: [
    {
      label: "Default start width", wide: true,
      render: () => (
        <div style={{ height: 180 }}>
          <SplitPane
            label="Sample split"
            start={<p className="styleguide-muted">Start column, 280px by default</p>}
            end={<p>End column takes the rest of the width.</p>}
          />
        </div>
      ),
    },
    {
      label: "Narrow start", wide: true,
      render: () => (
        <div style={{ height: 180 }}>
          <SplitPane
            label="Narrow sample"
            startWidth="160px"
            start={<p className="styleguide-muted">A 160px start column</p>}
            end={<p>The end column keeps the rest.</p>}
          />
        </div>
      ),
    },
  ],
  notes: ["Both columns scroll on their own when their content is taller than the pane."],
} satisfies CatalogueEntry;

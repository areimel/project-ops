import { StatusDot } from "../../../../components/common/StatusDot";
import type { CatalogueEntry } from "../../types";

export const entry = {
  id: "status-dot",
  title: "StatusDot",
  family: "display",
  source: "renderer/components/common/StatusDot.tsx",
  exports: ["StatusDot", "StatusTone"],
  purpose: "A square light and a mono label that say the state of one object, such as a project's status. The tone colours the light; the label is the words that say it.",
  useFor: [
    "The status of a project on its card header: Active in accent, Paused or Archived in muted.",
    "A project whose folder has gone missing: Folder missing in danger, which outranks the stored status.",
    "A pinned tile on the dashboard, where the light alone shows and the name carries the label (hideLabel).",
  ],
  notFor: [
    "A tag or a filter chip the owner can click: use Badge.",
    "A result of an action (saved, failed): use Toast, which shows a message and can carry Undo.",
    "A count or a number: use a Badge with count, or plain text.",
  ],
  snippet: "{/* status = cardStatus(project): { tone, label } */}\n<StatusDot tone={status.tone}>{status.label}</StatusDot>\n<StatusDot tone=\"accent\" hideLabel>Active</StatusDot>",
  specimens: [
    {
      label: "Accent, Active",
      render: () => <StatusDot tone="accent">Active</StatusDot>,
    },
    {
      label: "Muted, Paused and Archived",
      render: () => (
        <div className="styleguide-row">
          <StatusDot tone="muted">Paused</StatusDot>
          <StatusDot tone="muted">Archived</StatusDot>
        </div>
      ),
    },
    {
      label: "Danger, folder missing",
      render: () => <StatusDot tone="danger">Folder missing</StatusDot>,
    },
    {
      label: "Light only, label hidden",
      render: () => (
        <div className="styleguide-row">
          <StatusDot tone="danger" hideLabel>Folder missing</StatusDot>
          <StatusDot tone="accent" hideLabel>Active</StatusDot>
          <span className="hint">The name of the project carries the words.</span>
        </div>
      ),
    },
    {
      label: "Success", notInUse: true,
      render: () => <StatusDot tone="success">Synced</StatusDot>,
    },
    {
      label: "A status beside a card header", wide: true,
      render: () => (
        <div className="styleguide-stack">
          <div className="styleguide-row">
            <span className="label">Client sites</span>
            <StatusDot tone="accent">Active</StatusDot>
          </div>
          <div className="styleguide-row">
            <span className="label">Desktop apps</span>
            <StatusDot tone="muted">Archived</StatusDot>
          </div>
        </div>
      ),
    },
  ],
  notes: [
    "The light and the label colour come from the shared tone classes (tone-accent, tone-success, tone-muted, tone-danger in renderer/styles/base.css), which toasts and the stamp use too.",
    "The project status rule is cardStatus in renderer/apps/projects/cardModel.ts: a missing folder is danger \"Folder missing\"; otherwise active is accent \"Active\", paused is muted \"Paused\" and archived is muted \"Archived\".",
    "success is not used by any status light yet; the success tone is used by toasts.",
  ],
} satisfies CatalogueEntry;

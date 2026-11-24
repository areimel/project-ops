import { useState } from "react";
import { PROJECT_LIMITS, PROJECT_LINK_KEYS, type ProjectLinkKey, type ProjectStatus } from "../../../shared/projects/record";
import type { ProjectPatch } from "../../../shared/projects/patch";
import type { ProjectView } from "../../../shared/projects/view";
import { Button } from "../../components/common/Button";
import { Combobox } from "../../components/common/Combobox";
import { Dialog } from "../../components/common/Dialog";
import { Field } from "../../components/common/Field";
import { Segmented } from "../../components/common/Segmented";
import { Switch } from "../../components/common/Switch";
import { TagInput } from "../../components/common/TagInput";
import { TextArea } from "../../components/common/TextArea";
import { TextField } from "../../components/common/TextField";
import { SiteFields } from "./SiteFields";
import { draftFromView, draftInvalid, draftPatch, linkProblem, type ProjectDraft } from "./projectDraft";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "archived", label: "Archived" },
];
const LINK_LABELS: Record<ProjectLinkKey, string> = { repo: "Repository", site: "Website", docs: "Docs" };

interface Props {
  project: ProjectView;
  categories: string[];
  tags: string[];
  /** Hosting and service names used elsewhere, offered as suggestions. */
  hosting?: string[];
  services?: string[];
  /** Resolves true when saved; the dialog then closes. */
  onSave(patch: ProjectPatch): Promise<boolean>;
  onRemove(): void;
  onClose(): void;
}

/** Edit what the user owns. Empty name, description or link means "use what was detected". */
export function ProjectDialog({ project: p, categories, tags, hosting = [], services = [], onSave, onRemove, onClose }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(() => draftFromView(p));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setLink = (key: ProjectLinkKey, value: string) => setDraft((d) => ({ ...d, links: { ...d.links, [key]: value } }));
  const invalid = draftInvalid(draft);

  const save = async () => {
    if (invalid || saving) return;
    const patch = draftPatch(p, draft);
    if (!patch) { onClose(); return; }
    setSaving(true);
    const ok = await onSave(patch);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog title="Edit project" size="lg" onClose={onClose}
      footer={<>
        <Button variant="quiet" icon="trash" className="projects-dialog-remove" onClick={onRemove}>Remove</Button>
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={invalid || saving} onClick={save}>Save changes</Button>
      </>}>
      <form className="form-grid projects-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <TextField label="Name" data-autofocus value={draft.name} onChange={(v) => set("name", v)}
          placeholder={p.detected.name} maxLength={PROJECT_LIMITS.name} />
        <Combobox label="Category" value={draft.category} onChange={(v) => set("category", v)}
          suggestions={categories} placeholder="Uncategorised" maxLength={PROJECT_LIMITS.category} />
        <TextArea label="Description" value={draft.description} rows={3}
          onChange={(v) => set("description", v)} placeholder={p.detected.description ?? "No description found"}
          maxLength={PROJECT_LIMITS.description} />
        <TagInput className="form-wide" label="Tags" value={draft.tags} onChange={(v) => set("tags", v)}
          suggestions={tags} max={PROJECT_LIMITS.tags} maxLength={PROJECT_LIMITS.tag} placeholder="Add a tag and press Enter" />
        <Field label="Status">
          <Segmented label="Status" options={STATUS_OPTIONS} value={draft.status} onChange={(v) => set("status", v)} />
        </Field>
        <Field label="Pinned">
          <Switch checked={draft.pinned} label="Pin to the top" onChange={(v) => set("pinned", v)} />
        </Field>

        <div className="projects-form-links form-wide">
          {PROJECT_LINK_KEYS.map((k) => {
            const problem = linkProblem(draft.links[k]);
            const placeholder = k === "repo" && p.detected.repo ? p.detected.repo : "https://";
            return (
              <TextField key={k} label={LINK_LABELS[k]} value={draft.links[k]} onChange={(v) => setLink(k, v)} error={problem ?? undefined}
                placeholder={placeholder} spellCheck={false} inputMode="url" />
            );
          })}
        </div>

        <SiteFields site={draft.site} onChange={(v) => set("site", v)}
          hostingSuggestions={hosting} serviceSuggestions={services} />

        <p className="projects-form-folder form-wide">
          <span className="label">Folder</span>
          <span className="projects-form-folder-path" title={p.folder}>{p.folder}</span>
        </p>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

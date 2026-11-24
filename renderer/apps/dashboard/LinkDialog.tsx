import { useState } from "react";
import { RESOURCE_LIMITS, type ResourceLinkPatch, type ResourceLinkView } from "../../../shared/resources/links";
import { Button } from "../../components/common/Button";
import { Combobox } from "../../components/common/Combobox";
import { Dialog } from "../../components/common/Dialog";
import { TextField } from "../../components/common/TextField";
import { draftFrom, draftInvalid, draftPatch, emptyDraft, urlProblem, type LinkDraft } from "./dashboardModel";

interface Props {
  /** The link being edited; null for a new one. */
  link: ResourceLinkView | null;
  groups: string[];
  /** Resolves true when saved; the dialog then closes. */
  onSave(patch: ResourceLinkPatch): Promise<boolean>;
  onRemove(): void;
  onClose(): void;
}

export function LinkDialog({ link, groups, onSave, onRemove, onClose }: Props) {
  const [draft, setDraft] = useState<LinkDraft>(() => (link ? draftFrom(link) : emptyDraft()));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof LinkDraft>(key: K, value: LinkDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const invalid = draftInvalid(draft);
  const problem = urlProblem(draft.url);

  const save = async () => {
    if (invalid || saving) return;
    const patch = draftPatch(draft, link ?? undefined);
    if (!patch) { onClose(); return; }
    setSaving(true);
    const ok = await onSave(patch);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog title={link ? "Edit link" : "Add a link"} onClose={onClose}
      footer={<>
        {link && <Button variant="quiet" icon="trash" className="dashboard-dialog-remove" onClick={onRemove}>Remove</Button>}
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={invalid || saving} onClick={save}>{link ? "Save changes" : "Add link"}</Button>
      </>}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <TextField label="Name" data-autofocus value={draft.name} onChange={(v) => set("name", v)}
          placeholder="Netlify" maxLength={RESOURCE_LIMITS.name} />
        <Combobox label="Group" value={draft.group} onChange={(v) => set("group", v)}
          suggestions={groups} placeholder="Optional, such as Hosting" maxLength={RESOURCE_LIMITS.group} />
        <TextField className="form-wide" label="Address" value={draft.url} onChange={(v) => set("url", v)} error={problem ?? undefined}
          placeholder="https://" spellCheck={false} inputMode="url" />
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

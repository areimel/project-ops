import { useState } from "react";
import { RESOURCE_LIMITS, type ResourceLinkPatch, type ResourceLinkView } from "../../../shared/resources/links";
import { Combobox } from "../../components/common/Combobox";
import { FormDialog } from "../../components/common/FormDialog";
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
  /** Show the dialog in place instead of over the page (the styleguide). */
  inline?: boolean;
}

export function LinkDialog({ link, groups, onSave, onRemove, onClose, inline }: Props) {
  const [draft, setDraft] = useState<LinkDraft>(() => (link ? draftFrom(link) : emptyDraft()));
  const set = <K extends keyof LinkDraft>(key: K, value: LinkDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const invalid = draftInvalid(draft);
  const problem = urlProblem(draft.url);

  return (
    <FormDialog title={link ? "Edit link" : "Add a link"} saveLabel={link ? "Save changes" : "Add link"} invalid={invalid}
      patch={() => draftPatch(draft, link ?? undefined)} onSave={onSave} onRemove={link ? onRemove : undefined}
      onClose={onClose} inline={inline} formClassName="form-grid">
      <TextField label="Name" data-autofocus value={draft.name} onChange={(v) => set("name", v)}
        placeholder="Netlify" maxLength={RESOURCE_LIMITS.name} />
      <Combobox label="Group" value={draft.group} onChange={(v) => set("group", v)}
        suggestions={groups} placeholder="Optional, such as Hosting" maxLength={RESOURCE_LIMITS.group} />
      <TextField className="form-wide" label="Address" value={draft.url} onChange={(v) => set("url", v)} error={problem ?? undefined}
        placeholder="https://" spellCheck={false} inputMode="url" />
    </FormDialog>
  );
}

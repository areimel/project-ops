import { useId } from "react";
import { PROJECT_LIMITS } from "../../../shared/projects/record";
import { Combobox } from "../../components/common/Combobox";
import { TagInput } from "../../components/common/TagInput";
import { TextArea } from "../../components/common/TextArea";
import { TextField } from "../../components/common/TextField";
import { dateProblem, type SiteDraft } from "./projectDraft";

interface Props {
  site: SiteDraft;
  onChange(site: SiteDraft): void;
  hostingSuggestions: string[];
  serviceSuggestions: string[];
}

/** The "Site" section of the edit form: who it is for, where it runs, when it launched. */
export function SiteFields({ site, onChange, hostingSuggestions, serviceSuggestions }: Props) {
  const baseId = useId();
  const set = <K extends keyof SiteDraft>(key: K, value: SiteDraft[K]) => onChange({ ...site, [key]: value });
  const problem = dateProblem(site.launchDate);
  return (
    <section className="projects-form-site" aria-label="Site">
      <h3 className="kicker projects-form-site-title">Site</h3>
      <TextField label="Client" value={site.client} onChange={(v) => set("client", v)} maxLength={PROJECT_LIMITS.client} />
      <Combobox label="Hosting" value={site.hosting} onChange={(v) => set("hosting", v)}
        suggestions={hostingSuggestions} maxLength={PROJECT_LIMITS.hosting} />
      <div>
        <TextField label="Launch date" type="date" value={site.launchDate} onChange={(v) => set("launchDate", v)}
          invalid={problem !== null} aria-describedby={problem ? `${baseId}-date` : undefined} />
        {problem && <p className="projects-form-error" id={`${baseId}-date`}>{problem}</p>}
      </div>
      <TagInput className="projects-form-site-wide" label="Services" value={site.services}
        onChange={(v) => set("services", v)} suggestions={serviceSuggestions} max={PROJECT_LIMITS.services}
        maxLength={PROJECT_LIMITS.service} placeholder="Add a service and press Enter" />
      <TextArea label="Notes" value={site.notes} rows={4} onChange={(v) => set("notes", v)}
        maxLength={PROJECT_LIMITS.notes} placeholder="Logins live in your password manager, not here." />
    </section>
  );
}

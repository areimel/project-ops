import { useState } from "react";
import { ROOT_LIMIT } from "../../shared/projects/roots";
import type { Settings } from "../../shared/settings";
import { installedFor, type LauncherKind } from "../../shared/launchers";
import { Button } from "../components/common/Button";
import { Dropdown } from "../components/common/Dropdown";
import { EmptyState } from "../components/common/EmptyState";
import { Field } from "../components/common/Field";
import { IconButton } from "../components/common/IconButton";
import { List, ListRow } from "../components/common/List";
import { Spinner } from "../components/common/Spinner";
import { useLaunchers, useRoots, useScanState, reloadLaunchers } from "../hooks/useProjectRoots";
import { useProjects } from "../hooks/useProjects";
import { useSetting } from "../hooks/useSettings";
import { useAttempt } from "../hooks/useAttempt";
import { useShell } from "../shell/ShellContext";
import { projectCount, scanMessage } from "../utils/projectText";
import { launcherChoices, settingFromValue } from "./projectsSettingsModel";

/** One picker for the program a project opens in: the same field for the editor and the terminal. */
function LauncherField(p: { kind: LauncherKind; settingKey: "editor" | "terminal"; label: string; hint: string }) {
  const [setting, setSetting] = useSetting(p.settingKey);
  const launchers = useLaunchers();
  const installed = launchers ? installedFor(p.kind, launchers) : null;
  const c = launcherChoices(p.kind, window.app.platform, installed, setting);
  return (
    <Field label={p.label} hint={p.hint}>
      <Dropdown label={p.label} options={c.options} selected={c.selected} buttonText={c.buttonText} className="settings-picker"
        onSelect={(v) => setSetting(settingFromValue(v) as Settings["editor" | "terminal"])} />
    </Field>
  );
}

function ScanFolders() {
  const { confirm } = useShell();
  const attempt = useAttempt();
  const { roots, add, remove: removeRoot } = useRoots();
  const { scan } = useProjects();
  const scanning = useScanState();
  const full = roots.length >= ROOT_LIMIT;

  const addRoot = () => void attempt(add, undefined, (m) => `Could not add that folder. ${m}`);
  const rescan = () => void attempt(scan, scanMessage, (m) => `Could not scan. ${m}`);
  const remove = async (id: string, folder: string) => {
    const ok = await confirm({
      title: "Remove scan folder", confirmLabel: "Remove folder",
      body: `Project Ops will stop looking inside ${folder}. Its projects stay in the list, and nothing on disk is changed.`,
    });
    if (!ok) return;
    await attempt(() => removeRoot(id), undefined, (m) => `Could not remove that folder. ${m}`);
  };

  return (
    <Field label="Scan folders" hint="Project Ops looks inside these folders for projects.">
      <div className="settings-roots">
        {roots.length === 0
          ? <EmptyState title="No scan folders yet" body="Add the folder that holds your projects and Project Ops will find them." />
          : (
            <List label="Scan folders">
              {roots.map((r) => (
                <ListRow key={r.id} title={r.folder} meta={projectCount(r.projectCount)}
                  trailing={<IconButton icon="trash" label={`Remove ${r.folder}`} onClick={() => remove(r.id, r.folder)} />} />
              ))}
            </List>
          )}
        <div className="settings-actions">
          <Button variant="quiet" icon="plus" disabled={full} onClick={addRoot}>Add folder</Button>
          <Button variant="quiet" icon="refresh" disabled={scanning || roots.length === 0} onClick={rescan}>Rescan</Button>
          {scanning && <Spinner label="Scanning" />}
          {full && <span className="settings-muted">You can add up to {ROOT_LIMIT} folders. Remove one to add another.</span>}
        </div>
      </div>
    </Field>
  );
}

export function ProjectsSection() {
  const [checking, setChecking] = useState(false);
  const check = () => {
    setChecking(true);
    reloadLaunchers().catch((e: unknown) => console.error("Could not check for programs:", e)).finally(() => setChecking(false));
  };
  return (
    <section className="settings-section" aria-labelledby="set-projects">
      <h2 id="set-projects">Projects</h2>
      <ScanFolders />
      <LauncherField kind="editor" settingKey="editor" label="Code editor" hint="Used by Open in editor." />
      <LauncherField kind="terminal" settingKey="terminal" label="Terminal" hint="Used by Open in terminal." />
      <Field label="Installed programs" hint="Looks for editors and terminals again, for example after you install one.">
        <Button variant="quiet" icon="refresh" disabled={checking} onClick={check}>Check again</Button>
      </Field>
    </section>
  );
}

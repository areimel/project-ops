import { useState } from "react";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { useAttempt } from "../hooks/useAttempt";
import { useShell } from "../shell/ShellContext";
import { SettingsSection } from "./SettingsSection";

/** Export, import, show folder and reset. Each action says what happened in a toast, with the same words as its button. */
export function DataSection() {
  const { confirm, toast } = useShell();
  const attempt = useAttempt();
  const [busy, setBusy] = useState(false);

  /** One action at a time; a failure shows `failure` (a fixed, instructive sentence) rather than the raw error. */
  async function run(task: () => Promise<void>, failure: string): Promise<void> {
    setBusy(true);
    try { await attempt(task, undefined, () => failure); } finally { setBusy(false); }
  }

  const exportData = () => run(async () => {
    const r = await window.app.invoke("data:export");
    if (r.saved) toast("success", "Data exported");
  }, "Could not export your data. Check that the destination can be written to, then try again.");

  const importData = () => run(async () => {
    const ok = await confirm({
      title: "Import data", confirmLabel: "Choose file",
      body: "Importing replaces the projects, scan folders, resource links and settings with what the file contains. Anything the file does not contain stays as it is. Export first if you want a copy of what you have now.",
    });
    if (!ok) return;
    const r = await window.app.invoke("data:import");
    if (r.imported) {
      const counts = Object.entries(r.counts ?? {}).filter(([, n]) => n > 0).map(([name, n]) => `${n} ${name}`);
      toast("success", counts.length ? `Data imported: ${counts.join(", ")}` : "Data imported");
    }
  }, "Could not import that file. Choose a file made with Export data and try again. Your current data was not changed.");

  const showFolder = () => run(() => window.app.invoke("data:show-folder"), "Could not open the data folder. Open it from your file manager instead.");

  const reset = () => run(async () => {
    const ok = await confirm({
      title: "Reset all data", confirmLabel: "Reset all data", danger: true,
      body: "This permanently deletes your projects, scan folders, resource links and settings. The folders of your projects on disk are not touched, and the window size and position and the log files are kept. It cannot be undone. Export your data first if you may want it back.",
    });
    if (!ok) return;
    await window.app.invoke("data:reset");
    toast("success", "Data reset");
  }, "Could not reset your data. Close the app and try again.");

  return (
    <SettingsSection id="set-data" title="Data">
      <Field label="Backup" hint="Projects, scan folders and settings go into one file you can move to another computer. The file contains folder paths from this computer.">
        <Button variant="quiet" icon="save" disabled={busy} onClick={exportData}>Export data</Button>
        <Button variant="quiet" icon="folder" disabled={busy} onClick={importData}>Import data</Button>
      </Field>
      <Field label="Data folder" hint="Where this app keeps its files on this computer.">
        <Button variant="quiet" icon="external" disabled={busy} onClick={showFolder}>Show data folder</Button>
      </Field>
      <Field label="Reset" hint="Deletes your projects, scan folders, resource links and settings. Folders on disk are not touched.">
        <Button variant="danger" icon="trash" disabled={busy} onClick={reset}>Reset all data</Button>
      </Field>
    </SettingsSection>
  );
}

import { useState } from "react";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { useShell } from "../shell/ShellContext";

/** Export, import, show folder and reset. Each action says what happened in a toast, with the same words as its button. */
export function DataSection() {
  const { confirm, toast } = useShell();
  const [busy, setBusy] = useState(false);

  async function run(task: () => Promise<void>, failure: string): Promise<void> {
    setBusy(true);
    try { await task(); } catch (e) {
      console.error(failure, e);
      toast("error", failure);
    } finally { setBusy(false); }
  }

  const exportData = () => run(async () => {
    const r = await window.app.invoke("data:export");
    if (r.saved) toast("success", "Data exported");
  }, "Could not export your data. Check that the destination can be written to, then try again.");

  const importData = () => run(async () => {
    const ok = await confirm({
      title: "Import data", confirmLabel: "Choose file",
      body: "Importing replaces the notes, tasks and snippets that are in the file you choose, and applies the settings in it. Anything the file does not contain stays as it is. Export first if you want a copy of what you have now.",
    });
    if (!ok) return;
    const r = await window.app.invoke("data:import");
    if (r.imported) toast("success", "Data imported");
  }, "Could not import that file. Choose a file made with Export data and try again. Your current data was not changed.");

  const showFolder = () => run(() => window.app.invoke("data:show-folder"), "Could not open the data folder. Open it from your file manager instead.");

  const reset = () => run(async () => {
    const ok = await confirm({
      title: "Reset all data", confirmLabel: "Reset all data", danger: true,
      body: "This permanently deletes every note, task and snippet, your settings, the list of recent files and the saved news. The window size and position and the log files are kept. It cannot be undone. Export your data first if you may want it back.",
    });
    if (!ok) return;
    await window.app.invoke("data:reset");
    toast("success", "Data reset");
  }, "Could not reset your data. Close the app and try again.");

  return (
    <section className="settings-section" aria-labelledby="set-data">
      <h2 id="set-data">Data</h2>
      <Field label="Backup" hint="Everything is kept in one file you can move to another computer.">
        <Button variant="quiet" icon="save" disabled={busy} onClick={exportData}>Export data</Button>
        <Button variant="quiet" icon="folder" disabled={busy} onClick={importData}>Import data</Button>
      </Field>
      <Field label="Data folder" hint="Where this app keeps its files on this computer.">
        <Button variant="quiet" icon="external" disabled={busy} onClick={showFolder}>Show data folder</Button>
      </Field>
      <Field label="Reset" hint="Deletes all your data and settings.">
        <Button variant="danger" icon="trash" disabled={busy} onClick={reset}>Reset all data</Button>
      </Field>
    </section>
  );
}

import { useMemo } from "react";
import type { CommandSpec } from "../../shared/commands";
import { Button } from "../components/common/Button";
import { Dialog } from "../components/common/Dialog";
import { Kbd } from "../components/common/Kbd";
import { helpGroups } from "./commandTable";

/** Every command that has a key, generated from the same table as the menu and the palette. */
export function ShortcutHelp({ commands, onClose }: { commands: readonly CommandSpec[]; onClose(): void }) {
  const groups = useMemo(() => helpGroups(commands), [commands]);
  return (
    <Dialog title="Keyboard shortcuts" size="lg" onClose={onClose} footer={<Button variant="quiet" onClick={onClose}>Close</Button>}>
      <div className="help-grid">
        {groups.map((g) => (
          <section key={g.name} className="help-group">
            <h3>{g.name}</h3>
            <ul>
              {g.rows.map((r) => (
                <li key={r.id}>
                  <span>{r.label}</span>
                  <span className="help-keys">{r.keys.map((k) => <Kbd key={k} k={k} />)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

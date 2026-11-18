import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { keysOf, type CommandSpec } from "../../shared/commands";
import { Dialog } from "../components/common/Dialog";
import { Kbd } from "../components/common/Kbd";
import { List, ListRow } from "../components/common/List";
import { TextField } from "../components/common/TextField";
import { filterCommands } from "./paletteFilter";

interface Props {
  /** Only commands that have a live handler right now. */
  commands: readonly CommandSpec[];
  onRun(id: string): void;
  onClose(): void;
}

export function CommandPalette({ commands, onRun, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [at, setAt] = useState(0);
  const listId = useId();
  const body = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => filterCommands(query, commands), [query, commands]);
  const active = Math.min(at, Math.max(hits.length - 1, 0));

  useEffect(() => { body.current?.querySelector(".is-selected")?.scrollIntoView({ block: "nearest" }); }, [active, hits]);

  const run = (c: CommandSpec | undefined) => { if (c) { onClose(); onRun(c.id); } };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAt(Math.min(active + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAt(Math.max(active - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(hits[active]); }
  };

  return (
    <Dialog title="Command palette" size="md" onClose={onClose}>
      <div className="palette" ref={body} onKeyDown={onKeyDown}>
        <TextField
          type="search" label="Search commands" hideLabel placeholder="Type a command" value={query}
          onChange={(v) => { setQuery(v); setAt(0); }} autoFocus
          role="combobox" aria-autocomplete="list" aria-expanded={hits.length > 0}
          aria-controls={hits.length ? listId : undefined}
          aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
        />
        {hits.length ? (
          <List id={listId} role="listbox" label="Commands" className="palette-list">
            {hits.map((c, i) => (
              <ListRow
                key={c.id} optionId={`${listId}-${i}`} selected={i === active} onSelect={() => run(c)}
                title={c.label} meta={c.group}
                trailing={keysOf(c)[0] ? <Kbd k={keysOf(c)[0]} /> : undefined}
              />
            ))}
          </List>
        ) : (
          <p className="palette-empty" role="status">No command matches "{query.trim()}".</p>
        )}
      </div>
    </Dialog>
  );
}

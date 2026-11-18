import type { Ref } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Icon } from "../../components/common/Icon";
import { List, ListRow } from "../../components/common/List";
import { TextField } from "../../components/common/TextField";
import type { Note } from "../../../shared/collections/notes";
import { displayTitle, shortDate } from "./notesModel";

/** The search box and the notes that match it. `notes` is already filtered and sorted. */
export function NoteList(p: {
  notes: Note[]; query: string; onQuery(q: string): void; selectedId: string | null; onSelect(id: string): void;
  searchRef?: Ref<HTMLInputElement>;
}) {
  const now = Date.now();
  return (
    <div className="notes-list-pane">
      <div className="notes-search">
        <TextField ref={p.searchRef} label="Search notes" hideLabel type="search" placeholder="Search notes" value={p.query} onChange={p.onQuery} />
      </div>
      {p.notes.length === 0 ? (
        <EmptyState title="No notes match" body={`Nothing contains "${p.query.trim()}". Try fewer words.`} />
      ) : (
        <List label="Notes">
          {p.notes.map((n) => (
            <ListRow
              key={n.id} selected={n.id === p.selectedId} onSelect={() => p.onSelect(n.id)}
              leading={n.pinned ? <Icon name="pin" size={16} /> : undefined}
              title={displayTitle(n)} meta={<span className="notes-date">{shortDate(n.updatedAt, now)}</span>}
            />
          ))}
        </List>
      )}
    </div>
  );
}

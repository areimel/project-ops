import type { TitleBlockModel } from "./shellModel";

/** The drawing title block: the one bold element, at the right end of the footer on every screen. */
export function TitleBlock({ model }: { model: TitleBlockModel }) {
  return (
    <aside className="title-block" aria-label="Sheet details">
      <span className="title-block-name">{model.name}</span>
      <span className="title-block-sheet">{model.sheet}</span>
      {model.count && <span className="title-block-count">{model.count}</span>}
      {model.state && (
        // Not a live region while saving: autosave would announce "Saving" and "Saved" on every pause in typing.
        // A failure is the one state worth interrupting for; the key remounts the element so the alert is read.
        <span key={model.state.tone === "error" ? "error" : "state"} className={`title-block-state is-${model.state.tone}`}
          role={model.state.tone === "error" ? "alert" : undefined}>{model.state.label}</span>
      )}
    </aside>
  );
}

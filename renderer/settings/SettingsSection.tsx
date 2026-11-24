import type { ReactNode } from "react";

/** One ruled block of the settings sheet: a heading with the accent square, then its fields. `id` names the heading. */
export function SettingsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="settings-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

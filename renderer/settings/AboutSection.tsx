import { useEffect, useState } from "react";
import { brand, type LinkKey } from "../../shared/brand";
import type { AppInfo } from "../../shared/ipc/app";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { CHANGELOG } from "../utils/changelog";
import { CREDITS } from "../utils/credits";

const LINKS: { key: LinkKey; label: string }[] = [
  { key: "website", label: "Website" }, { key: "issues", label: "Report an issue" }, { key: "source", label: "Source code" },
];

export function AboutSection() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  useEffect(() => {
    window.app.invoke("app:info").then(setInfo, (e: unknown) => console.warn("app:info failed:", e));
  }, []);
  const recent = CHANGELOG.slice(0, 3);

  return (
    <section className="settings-section" aria-labelledby="set-about">
      <h2 id="set-about">About</h2>
      <Field label={brand.name} hint={brand.tagline}>
        <dl className="about-facts">
          <dt>Version</dt><dd>{info?.version ?? CREDITS.version}</dd>
          <dt>Electron</dt><dd>{info?.electron ?? "Not available"}</dd>
          <dt>Chrome</dt><dd>{info?.chrome ?? "Not available"}</dd>
        </dl>
      </Field>
      <Field label="Links">
        {LINKS.map((l) => (
          <Button key={l.key} variant="link" onClick={() => { window.app.invoke("links:open", l.key).catch((e: unknown) => console.warn("links:open failed:", e)); }}>{l.label}</Button>
        ))}
      </Field>
      {recent.length > 0 && (
        <Field label="Recent changes">
          <ul className="about-list">
            {recent.map((c) => <li key={c.version}>{c.version}{c.date ? `, ${c.date}` : ""}</li>)}
          </ul>
        </Field>
      )}
      <Field label="Credits" hint={brand.copyright}>
        {CREDITS.thirdParty.length > 0
          ? <ul className="about-list">{CREDITS.thirdParty.map((t) => <li key={t}>{t}</li>)}</ul>
          : <span className="settings-muted">No third-party notices listed.</span>}
      </Field>
    </section>
  );
}

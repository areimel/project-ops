import { useEffect, useState } from "react";
import { resolveMode, type ThemeId } from "../../shared/theme";
import type { ModeSetting, Settings } from "../../shared/settings";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { Field } from "../components/common/Field";
import { Segmented } from "../components/common/Segmented";
import { TextField } from "../components/common/TextField";
import { useSettings } from "../hooks/useSettings";
import { useSystemDark } from "../theme/useTheme";
import { ThemePicker } from "./ThemePicker";
import { accentIsHardToRead, normalizeHex } from "./themeTokens";

const MODES: { value: ModeSetting; label: string }[] = [
  { value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" },
];

export function AppearanceSection() {
  const [settings, update] = useSettings();
  const dark = useSystemDark();
  const mode = resolveMode(settings.mode, dark);
  // The theme's own accent and surface, read from the page once the theme has been applied.
  const [themed, setThemed] = useState({ accent: "", surface: "" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setThemed({ accent: cs.getPropertyValue("--accent").trim(), surface: cs.getPropertyValue("--surface").trim() });
  }, [settings.theme, mode, settings.accent]);
  const shown = settings.accent ?? themed.accent;

  const save = (patch: Partial<Settings>) => { update(patch).catch((e: unknown) => console.error("Could not save settings:", e)); };

  // The hex field holds what the person is typing; it only saves once it is a full colour.
  const [draft, setDraft] = useState(shown);
  useEffect(() => { setDraft(shown); }, [shown]);
  const invalid = draft.trim() !== "" && normalizeHex(draft) === null;
  const onHex = (v: string) => {
    setDraft(v);
    const hex = /^#?[0-9a-f]{6}$/i.test(v.trim()) ? normalizeHex(v) : null;   // three-digit forms wait for blur
    if (hex && hex !== settings.accent) save({ accent: hex });
  };
  const onBlur = () => {
    const hex = normalizeHex(draft);
    if (hex && hex !== settings.accent) save({ accent: hex });
    else setDraft(shown);
  };

  return (
    <section className="settings-section" aria-labelledby="set-appearance">
      <h2 id="set-appearance">Appearance</h2>
      <Field label="Theme" hint="Applies as soon as you pick it.">
        <ThemePicker value={settings.theme} mode={mode} onChange={(id: ThemeId) => save({ theme: id })} />
      </Field>
      <Field label="Mode" hint="System follows your operating system.">
        <Segmented<ModeSetting> label="Mode" options={MODES} value={settings.mode} onChange={(m) => save({ mode: m })} />
      </Field>
      <Field label="Accent" hint="Replaces the theme's accent colour.">
        <div className="accent-control">
          <div className="accent-row">
            <input type="color" className="accent-swatch" aria-label="Accent colour" value={shown}
              onChange={(e) => save({ accent: e.target.value })} />
            <TextField label="Accent hex colour" hideLabel className="accent-hex" value={draft} maxLength={7} spellCheck={false}
              invalid={invalid} onChange={onHex} onBlur={onBlur} />
            <Button variant="quiet" disabled={settings.accent === null} onClick={() => save({ accent: null })}>Use theme accent</Button>
          </div>
          {invalid && <p className="settings-note is-error" role="alert">Enter a hex colour such as #3366cc.</p>}
          {!invalid && settings.accent && accentIsHardToRead(settings.accent, themed.surface) && (
            <p className="settings-note is-warning" role="status">
              <Icon name="warning" size={16} />
              This accent is hard to read on the current background.
            </p>
          )}
        </div>
      </Field>
    </section>
  );
}

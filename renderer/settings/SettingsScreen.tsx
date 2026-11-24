import { Field } from "../components/common/Field";
import { Switch } from "../components/common/Switch";
import { useSetting } from "../hooks/useSettings";
import { AboutSection } from "./AboutSection";
import { AppearanceSection } from "./AppearanceSection";
import { DataSection } from "./DataSection";
import { ProjectsSection } from "./ProjectsSection";
import { SettingsSection } from "./SettingsSection";
import "./settings.css";

function BehaviourSection() {
  const [closeToTray, setCloseToTray] = useSetting("closeToTray");
  return (
    <SettingsSection id="set-behaviour" title="Behaviour">
      <Field label="Close to tray" hint="Closing the window keeps the app running in the tray. Needs a visible tray icon.">
        <Switch label="Close to tray" checked={closeToTray} onChange={setCloseToTray} />
      </Field>
    </SettingsSection>
  );
}

/** The `settings` route: one column of ruled sections. Quiet, and the same on every theme. */
export function SettingsScreen() {
  return (
    <div className="app-root settings">
      <div className="settings-sheet">
        <h1>Settings</h1>
        <ProjectsSection />
        <AppearanceSection />
        <BehaviourSection />
        <DataSection />
        <AboutSection />
      </div>
    </div>
  );
}

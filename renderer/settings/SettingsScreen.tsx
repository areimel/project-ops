import { Field } from "../components/common/Field";
import { Switch } from "../components/common/Switch";
import { useSetting } from "../hooks/useSettings";
import { AboutSection } from "./AboutSection";
import { AppearanceSection } from "./AppearanceSection";
import { DataSection } from "./DataSection";
import "./settings.css";

function BehaviourSection() {
  const [closeToTray, setCloseToTray] = useSetting("closeToTray");
  const [notifications, setNotifications] = useSetting("notifications");
  return (
    <section className="settings-section" aria-labelledby="set-behaviour">
      <h2 id="set-behaviour">Behaviour</h2>
      <Field label="Close to tray" hint="Closing the window keeps the app running in the tray. Needs a visible tray icon.">
        <Switch label="Close to tray" checked={closeToTray} onChange={setCloseToTray} />
      </Field>
      <Field label="Notifications" hint="Show a system notification when something finishes, such as a timer.">
        <Switch label="Notifications" checked={notifications} onChange={setNotifications} />
      </Field>
    </section>
  );
}

/** The `settings` route: one column of ruled sections. Quiet, and the same on every theme. */
export function SettingsScreen() {
  return (
    <div className="app-root settings">
      <div className="settings-sheet">
        <h1>Settings</h1>
        <AppearanceSection />
        <BehaviourSection />
        <DataSection />
        <AboutSection />
      </div>
    </div>
  );
}

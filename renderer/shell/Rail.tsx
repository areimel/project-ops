import { IconButton } from "../components/common/IconButton";
import type { AppDefinition } from "../apps/types";
import type { Route, RouterAction } from "./router";

interface Props {
  apps: readonly AppDefinition[];
  route: Route;
  hintOf(id: string): string;
  navigate(action: RouterAction): void;
}

/** Slim icon rail shown inside a sheet: home, one button per app in registry order, settings at the bottom. */
export function Rail({ apps, route, hintOf, navigate }: Props) {
  const current = (on: boolean) => (on ? { "aria-current": "page" as const } : {});
  return (
    <nav className="rail" aria-label="Sheets">
      <IconButton icon="home" label={hintOf("shell.home")} onClick={() => navigate({ type: "home" })} />
      <span className="rail-rule" aria-hidden="true" />
      {apps.map((a) => {
        const on = route.view === "app" && route.appId === a.id;
        return (
          <IconButton
            key={a.id} icon={a.icon} label={hintOf(`go.${a.id}`)} active={on} {...current(on)}
            onClick={() => navigate({ type: "open", appId: a.id })}
          />
        );
      })}
      <span className="rail-spacer" />
      <IconButton
        icon="settings" label={hintOf("shell.settings")} active={route.view === "settings"} {...current(route.view === "settings")}
        onClick={() => navigate({ type: "settings" })}
      />
    </nav>
  );
}

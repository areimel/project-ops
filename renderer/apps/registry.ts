import { dashboard } from "./dashboard";
import { projects } from "./projects";
import type { AppDefinition } from "./types";

/** The apps every build has. The first app is the home screen. */
export const BASE_APPS: AppDefinition[] = [dashboard, projects];

/** Dev-only apps. They go last so Ctrl/Cmd+1..2 never move, and they are absent from release builds. */
export const DEV_APPS: AppDefinition[] = [];

export const APPS: AppDefinition[] = __STYLEGUIDE__ ? [...BASE_APPS, ...DEV_APPS] : BASE_APPS;

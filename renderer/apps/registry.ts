import { dashboard } from "./dashboard";
import { projects } from "./projects";
import type { AppDefinition } from "./types";

/** The first app is the home screen. */
export const APPS: AppDefinition[] = [dashboard, projects];

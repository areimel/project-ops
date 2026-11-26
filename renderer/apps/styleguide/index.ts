import { lazy } from "react";
import type { AppDefinition } from "../types";

/** Dev-only parts catalogue of the interface. The guard lets the bundler drop the chunk from release builds. */
export const styleguide: AppDefinition = {
  id: "styleguide",
  name: "Styleguide",
  icon: "notes",
  summary: "A catalogue of every token, component and pattern, in light and dark.",
  component: /* @__PURE__ */ lazy(() => (__STYLEGUIDE__ ? import("./StyleguideApp") : Promise.reject(new Error("Not in this build")))),
};

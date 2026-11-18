export const brand = {
  name: "Project Ops",                 // window title, About, tray tooltip, home heading
  tagline: "Find, filter and open your coding projects.",
  packageName: "project-ops", // package.json "name", .deb name, executable
  appId: "com.areimel.projectops",     // electron-builder appId, Windows AppUserModelId
  scheme: "project-ops",               // deep links: project-ops://open/notes
  envPrefix: "APP",                     // APP_CAPTURE, APP_LOG_LEVEL, APP_WINDOW_BOUNDS
  author: "Alec Reimel",
  copyright: "Copyright © Alec Reimel. MIT licence.",
  links: {
    website: "https://example.com/",
    issues: "https://github.com/areimel/project-ops/issues",
    source: "https://github.com/areimel/project-ops",
  },
  defaultTheme: "blueprint",
  defaultMode: "system",
} as const;

export type LinkKey = keyof typeof brand.links;

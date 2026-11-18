export const brand = {
  name: "App Template",                 // window title, About, tray tooltip, home heading
  tagline: "A starter for desktop apps, one sheet per skill",
  packageName: "electron-app-template", // package.json "name", .deb name, executable
  appId: "com.example.apptemplate",     // electron-builder appId, Windows AppUserModelId
  scheme: "app-template",               // deep links: app-template://open/notes
  mediaScheme: "app-template-media",    // Player's file protocol (privileged scheme)
  envPrefix: "APP",                     // APP_CAPTURE, APP_LOG_LEVEL, APP_WINDOW_BOUNDS
  author: "Alec Reimel",
  copyright: "Copyright © Alec Reimel. MIT licence.",
  links: {
    website: "https://example.com/",
    issues: "https://github.com/areimel/electron-app-template/issues",
    source: "https://github.com/areimel/electron-app-template",
  },
  defaultTheme: "blueprint",
  defaultMode: "system",
} as const;

export type LinkKey = keyof typeof brand.links;

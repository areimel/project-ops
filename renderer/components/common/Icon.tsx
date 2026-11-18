/**
 * The icon set: one line weight, square caps, 24x24 grid with a 3 px margin, one `d` string each.
 * Drawn for this template, no icon library. A dot is a zero-length segment ("h.01").
 */
const PATHS = {
  // Apps
  notes: "M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7",
  code: "M8 7l-5 5 5 5 M16 7l5 5-5 5 M13.5 5l-3 14",
  terminal: "M3 5h18v14H3z M7 10l3 2-3 2 M12 15h5",

  // Projects
  link: "M9 15l6-6 M11 7l1.5-1.5a4 4 0 0 1 5.7 5.7L16.5 13 M13 17l-1.5 1.5a4 4 0 0 1-5.7-5.7L7.5 11",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
  gitBranch: "M6 3v12 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9c0 6-12 3-12 6",
  pencil: "M4 20l1-5L16 4l4 4L9 19z M14 6l4 4",
  archive: "M3 4h18v4H3z M5 8v12h14V8 M10 12h4",
  pinOff: "M8 3h8 M9 3v6l-3 4h12 M12 13v8 M4 4l16 16",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  sort: "M7 4v16 M3 16l4 4 4-4 M17 20V4 M13 8l4-4 4 4",
  eyeOff: "M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M4 4l16 16",
  arrowUpRight: "M7 17L17 7 M8 7h9v9",

  // Shell
  home: "M3 11l9-8 9 8 M5 9.5V21h5v-6h4v6h5V9.5",
  settings: "M4 6h9 M17 6h3 M13 4h4v4h-4z M4 12h3 M11 12h9 M7 10h4v4H7z M4 18h11 M19 18h1 M15 16h4v4h-4z",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z M16 16l5 5",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
  monitor: "M3 4h18v12H3z M8 20h8 M12 16v4",
  close: "M5 5l14 14 M19 5L5 19",

  // Actions
  plus: "M12 4v16 M4 12h16",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  pin: "M8 3h8 M9 3v6l-3 4h12l-3-4V3 M12 13v8",
  check: "M4 12.5l5 5L20 6.5",
  copy: "M8 8h12v13H8z M16 8V3H4v13h4",
  save: "M4 4h13l3 3v13H4z M8 4v5h8V4 M8 20v-6h8v6",
  folder: "M3 6h7l2 2h9v12H3z",
  refresh: "M3 4v6h6 M21 20v-6h-6 M20.5 9A8.5 8.5 0 0 0 5.6 5.6L3 10 M3.5 15a8.5 8.5 0 0 0 14.9 3.4L21 14",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
  chevronUp: "M5 15l7-7 7 7",
  chevronDown: "M5 9l7 7 7-7",
  warning: "M12 3L2.5 20h19z M12 10v5 M12 17.5h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5h.01",

  // Player
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

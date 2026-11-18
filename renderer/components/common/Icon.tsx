/**
 * The icon set: one line weight, square caps, 24x24 grid with a 3 px margin, one `d` string each.
 * Drawn for this template, no icon library. A dot is a zero-length segment ("h.01").
 */
const PATHS = {
  // Apps
  notes: "M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7",
  tasks: "M3.5 6l1.7 1.7L8 4.5 M11 6h10 M3.5 12l1.7 1.7L8 10.5 M11 12h10 M4 16.5h3.5V20H4z M11 18h10",
  editor: "M8 7l-5 5 5 5 M16 7l5 5-5 5 M13.5 5l-3 14",
  clipboard: "M8 5H5v16h14V5h-3 M8 3h8v4H8z M9 12h6 M9 16h4",
  timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M10 2h4 M12 2v3 M12 9v4.5l2.5 2",
  system: "M7 7h10v10H7z M10 10h4v4h-4z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4",
  news: "M4 4h13v16H6a2 2 0 0 1-2-2z M17 8h3v10a2 2 0 0 1-2 2 M7 8h7 M7 12h7 M7 16h4",
  player: "M3 5h18v14H3z M10 9v6l5-3z",

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
  play: "M7 4.5v15l12-7.5z",
  pause: "M6 5h4v14H6z M14 5h4v14h-4z",
  fullscreen: "M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5",
  exitFullscreen: "M9 4v5H4 M20 9h-5V4 M15 20v-5h5 M4 15h5v5",
  volume: "M4 9.5h4l5-4.5v14l-5-4.5H4z M16.5 9a4 4 0 0 1 0 6 M19 6.5a8 8 0 0 1 0 11",
  mute: "M4 9.5h4l5-4.5v14l-5-4.5H4z M17 9.5l4 5 M21 9.5l-4 5",
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

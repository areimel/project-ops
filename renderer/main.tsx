import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./theme/index.css";
import "./styles/index.css";
import "./shell/shell.css";

// Set before the first paint so the window never flashes the wrong theme (main passes it to the preload).
const initial = window.app.initialTheme;
document.documentElement.dataset.theme = initial.theme;
document.documentElement.dataset.mode = initial.mode;

createRoot(document.getElementById("root")!).render(<App />);

import { collectEntries } from "./styleguideModel";
import type { CatalogueEntry } from "./types";

const mods = import.meta.glob<{ entry: CatalogueEntry }>("./entries/**/*.tsx", { eager: true });

/** Every catalogue entry, checked and in order. Adding a file under entries/ is all it takes. */
export const ENTRIES: CatalogueEntry[] = collectEntries(mods);

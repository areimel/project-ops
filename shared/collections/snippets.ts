import type { CollectionSpec, RecordBase } from "./base";
import { isObject, str } from "./heal";

export interface SnippetFields { label: string; text: string }  // label <= 100, text <= 20_000
export type Snippet = RecordBase & SnippetFields;
export const snippets: CollectionSpec<SnippetFields> = {
  name: "snippets", version: 1, max: 200,
  heal: (raw) => {
    if (!isObject(raw)) return null;
    const text = str(raw.text, 20_000);
    if (text === "") return null;   // a snippet without text is unusable
    return { label: str(raw.label, 100), text };
  },
};

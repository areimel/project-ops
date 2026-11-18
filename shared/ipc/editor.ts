import { drop, invoke } from "./define";

export interface OpenedFile { fileId: string; name: string; folder: string; text: string }
export interface SavedFile { fileId: string; name: string; folder: string }
export interface RecentView { id: string; name: string; folder: string }  // id = 16 hex of sha1(path)

export const editorIpc = {
  "editor:open-dialog": invoke<[], OpenedFile | null>(),
  "editor:open-recent": invoke<[recentId: string], OpenedFile>(),
  "editor:open-dropped": drop<OpenedFile | null>(),
  "editor:take-pending": invoke<[], OpenedFile | null>(),   // file named at launch or by a second instance; the shell announces it with app:deep-link
  "editor:save": invoke<[fileId: string, text: string], SavedFile>(),
  "editor:save-as": invoke<[fileId: string | null, text: string, suggestedName: string], SavedFile | null>(),
  "editor:recents": invoke<[], RecentView[]>(),
} as const;

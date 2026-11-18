import type { EditorId, TerminalId } from "../launchers";
import type { OpenTarget, ProjectLinkKey, ProjectPatch, ProjectView, RootView } from "../projects";
import { event, invoke } from "./define";

export interface ScanResult { added: number; missing: number; total: number }   // total = visible projects after the scan
export interface InstalledLaunchers { editors: EditorId[]; terminals: TerminalId[] }   // ids found on PATH, table order

// No channel takes a path, a URL or a command: projects and roots are addressed by record id, links by key,
// launch targets by a fixed name. Folders come only from directory dialogs in main.
export const projectsIpc = {
  "projects:list": invoke<[], ProjectView[]>(),                                   // hidden records left out
  "projects:update": invoke<[id: string, patch: ProjectPatch], ProjectView>(),     // main heals with healProjectPatch
  "projects:remove": invoke<[id: string], void>(),                                // sets hidden (tombstone)
  "projects:restore": invoke<[id: string], void>(),                               // clears hidden
  "projects:add-folder": invoke<[], { id: string } | null>(),                     // directory dialog; null on cancel
  "projects:roots-list": invoke<[], RootView[]>(),
  "projects:roots-add": invoke<[], RootView | null>(),                            // directory dialog, then scans it
  "projects:roots-remove": invoke<[id: string], void>(),                          // keeps its projects (rootId -> null)
  "projects:scan": invoke<[], ScanResult>(),                                      // every root; superseded by a newer scan
  "projects:refresh": invoke<[id: string], void>(),                               // re-reads one folder
  "projects:open": invoke<[id: string, target: OpenTarget], void>(),
  "projects:open-link": invoke<[id: string, key: ProjectLinkKey], void>(),        // URL looked up in the record
  "projects:copy-path": invoke<[id: string], void>(),                             // main writes the real path
  "projects:launchers": invoke<[], InstalledLaunchers>(),
  "projects:changed": event<ProjectView[]>(),                                     // after every write
  "projects:roots-changed": event<RootView[]>(),
  "projects:scan-state": event<{ scanning: boolean }>(),
} as const;

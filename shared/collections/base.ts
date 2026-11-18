export interface RecordBase { id: string; createdAt: number; updatedAt: number }   // ms since epoch
export const RECORD_ID = /^[0-9a-f]{16}$/;                                         // randomBytes(8).toString("hex")
export const isRecordId = (x: unknown): x is string => typeof x === "string" && RECORD_ID.test(x);
export interface CollectionSpec<F> {
  name: string;      // also the file: `${name}.json`, envelope { version, items }
  version: number;
  max: number;       // create beyond it throws "Limit reached: <max> <name>"
  /** Fields only. Fills defaults, trims to limits, drops unknown keys; null = unusable. Used for file reads,
   *  create (heal(input)), update (heal({...current, ...patch})) and restore. */
  heal(raw: unknown): F | null;
}
export type Removed<T> = { record: T; index: number };

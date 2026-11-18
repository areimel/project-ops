export interface InvokeSpec<A extends unknown[], R> { kind: "invoke"; _t?: (...a: A) => R }
/** Renderer passes File objects; the preload turns them into paths. Never callable through invoke(). */
export interface DropSpec<R> { kind: "drop"; _t?: () => R }
/** Main -> renderer push. */
export interface EventSpec<P> { kind: "event"; _t?: (p: P) => void }
export const invoke = <A extends unknown[], R>(): InvokeSpec<A, R> => ({ kind: "invoke" });
export const drop = <R>(): DropSpec<R> => ({ kind: "drop" });
export const event = <P = void>(): EventSpec<P> => ({ kind: "event" });

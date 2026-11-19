import { describe, expect, it, vi } from "vitest";
import { createPushStore } from "../renderer/hooks/pushStore";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function setup(loads: Array<() => Promise<number>>) {
  let push: (v: number) => void = () => {};
  let i = 0;
  const load = vi.fn(() => loads[i++]!());
  const subscribe = vi.fn((cb: (v: number) => void) => { push = cb; return () => {}; });
  const store = createPushStore<number>({ load, subscribe, initial: 0 });
  return { store, load, subscribe, push: (v: number) => push(v) };
}

describe("createPushStore", () => {
  it("does nothing before the first subscriber", () => {
    const { load, subscribe } = setup([() => Promise.resolve(1)]);
    expect(load).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("loads on first subscribe and becomes ready", async () => {
    const { store, load } = setup([() => Promise.resolve(5)]);
    expect(store.getSnapshot()).toEqual({ value: 0, status: "loading", error: null });
    store.subscribe(() => {});
    store.subscribe(() => {});
    await Promise.resolve();
    await Promise.resolve();
    expect(store.getSnapshot()).toEqual({ value: 5, status: "ready", error: null });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("a push during the load wins", async () => {
    const d = deferred<number>();
    const { store, push } = setup([() => d.promise]);
    store.subscribe(() => {});
    push(9);
    d.resolve(1);
    await d.promise;
    await Promise.resolve();
    expect(store.getSnapshot().value).toBe(9);
    expect(store.getSnapshot().status).toBe("ready");
  });

  it("shows an error, then recovers on reload", async () => {
    const d = deferred<number>();
    const { store } = setup([() => d.promise, () => Promise.resolve(3)]);
    store.subscribe(() => {});
    d.reject(new Error("boom"));
    await d.promise.catch(() => {});
    await Promise.resolve();
    expect(store.getSnapshot()).toEqual({ value: 0, status: "error", error: "boom" });
    await store.reload();
    expect(store.getSnapshot()).toEqual({ value: 3, status: "ready", error: null });
  });

  it("keeps snapshot identity until something changes", async () => {
    const { store, push } = setup([() => Promise.resolve(1)]);
    const seen = vi.fn();
    store.subscribe(seen);
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    await Promise.resolve();
    await Promise.resolve();
    const second = store.getSnapshot();
    expect(second).not.toBe(first);
    expect(store.getSnapshot()).toBe(second);
    push(2);
    expect(store.getSnapshot()).not.toBe(second);
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it("the later of two racing reloads wins", async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    const { store } = setup([() => first.promise, () => second.promise]);
    store.subscribe(() => {});
    const p2 = store.reload();
    second.resolve(2);
    await p2;
    first.resolve(1);
    await first.promise;
    await Promise.resolve();
    expect(store.getSnapshot().value).toBe(2);
  });
});

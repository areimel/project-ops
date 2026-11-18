export type Handlers = Record<string, () => void>;

/**
 * Live command handlers, from the shell and from whichever app is mounted. The newest registration for an id
 * wins. `table` is one object that is updated in place, so useShortcuts can hold on to it.
 */
export interface HandlerRegistry {
  register(handlers: Handlers): () => void;
  has(id: string): boolean;
  run(id: string): boolean;
  readonly table: Handlers;
}

export function createHandlerRegistry(): HandlerRegistry {
  const layers: Handlers[] = [];
  const table: Handlers = {};
  const rebuild = () => {
    for (const k of Object.keys(table)) delete table[k];
    for (const layer of layers) Object.assign(table, layer);
  };
  return {
    table,
    register(handlers) {
      const layer = { ...handlers };
      layers.push(layer);
      rebuild();
      return () => {
        const i = layers.indexOf(layer);
        if (i >= 0) layers.splice(i, 1);
        rebuild();
      };
    },
    has: (id) => Object.hasOwn(table, id),
    run(id) {
      const h = Object.hasOwn(table, id) ? table[id] : undefined;
      if (!h) return false;
      h();
      return true;
    },
  };
}

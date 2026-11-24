import { useEffect, useState, type RefObject } from "react";
import { activeEntry, anchorId } from "./styleguideModel";

/** The id of the sheet being read: a scroll listener on the scroll container feeds the pure `activeEntry`. */
export function useScrollSpy(container: RefObject<HTMLElement | null>, ids: readonly string[], offset = 48): [string | null, (id: string) => void] {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = root.getBoundingClientRect().top;
      const tops: { id: string; top: number }[] = [];
      for (const id of ids) {
        const el = document.getElementById(anchorId(id));
        if (el) tops.push({ id, top: el.getBoundingClientRect().top - top });
      }
      setActive(activeEntry(tops, offset));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [container, ids, offset]);
  return [active, setActive];
}

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { activeEntry, anchorId } from "./styleguideModel";

/** The id of the sheet being read: a scroll listener on the scroll container feeds the pure `activeEntry`. */
export function useScrollSpy(container: RefObject<HTMLElement | null>, ids: readonly string[], offset = 48): [string | null, (id: string) => void] {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  // A sheet picked in the rail stays current until the reader scrolls by hand: a short last sheet never reaches
  // the offset line, so measuring after the pick's own jump would hand the mark back to the sheet above it.
  const held = useRef(false);
  const pick = useCallback((id: string) => {
    held.current = true;
    setActive(id);
  }, []);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (held.current) return;
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
    const release = () => { held.current = false; };
    const INPUTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    for (const type of INPUTS) root.addEventListener(type, release, { passive: true });
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      for (const type of INPUTS) root.removeEventListener(type, release);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [container, ids, offset]);
  return [active, pick];
}

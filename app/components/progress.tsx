import type { ReactElement, MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import { useTransition } from "@remix-run/react";

export function useProgress(): MutableRefObject<HTMLDivElement> {
  const el = useRef<HTMLDivElement>();
  const timeout = useRef<NodeJS.Timeout>();
  const { location } = useTransition();

  useEffect(() => {
    const instance = el.current;

    if (!location || !instance) return;

    if (timeout.current) clearTimeout(timeout.current);

    instance.style.width = "0%";

    let updateWidth = (ms: number) => {
      timeout.current = setTimeout(() => {
        if (!instance) return;

        let width = parseFloat(instance.style.width);
        let percent = !isNaN(width) ? 10 + 0.9 * width : 0;

        instance.style.width = `${percent}%`;

        updateWidth(100);
      }, ms);
    };

    updateWidth(300);

    return () => {
      clearTimeout(timeout.current);
      if (!instance) return;
      if (instance.style.width === "0%") return;

      instance.style.width = "100%";
      timeout.current = setTimeout(() => {
        if (instance.style.width !== "100%") return;

        instance.style.width = "";
      }, 200);
    };
  }, [location]);

  return el as MutableRefObject<HTMLDivElement>;
}

export default function Progress(): ReactElement {
  const progress = useProgress();

  return (
    <div
      className="fixed top-0 left-0 right-0 flex h-1"
      style={{ zIndex: 999 }}
    >
      <div
        ref={progress}
        className="bg-gradient-to-r from-green-400 via-blue-500 to-pink-500 transition-all ease-out"
      />
    </div>
  );
}
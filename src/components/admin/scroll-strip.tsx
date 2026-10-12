"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A horizontal strip (nav, filters, model picker) that keeps the current item in view.
// Runs once per change of the active item: one measurement, no scroll listeners.
export function ScrollStrip({
  activeKey,
  className = "",
  children,
}: {
  activeKey: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = ref.current;
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]');

    if (!strip || !active) {
      return;
    }

    const stripBox = strip.getBoundingClientRect();
    const box = active.getBoundingClientRect();

    if (box.left < stripBox.left || box.right > stripBox.right) {
      strip.scrollLeft += box.left - stripBox.left - (stripBox.width - box.width) / 2;
    }
  }, [activeKey]);

  return (
    <div
      ref={ref}
      className={`snap-x snap-proximity overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}

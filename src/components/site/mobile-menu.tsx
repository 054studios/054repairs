"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

// The menu remembers the path it was opened on, so navigating closes it without an effect.
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPath(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="ml-2 inline-flex size-11 items-center justify-center rounded-full text-navy-950 transition-colors duration-150 hover:bg-navy-100 active:scale-[0.98]"
      >
        <span className="sr-only">{open ? "Menu sluiten" : "Menu openen"}</span>
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          <span
            className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-navy-950 transition-transform duration-200 ease-out ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-navy-950 transition-transform duration-200 ease-out ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        id={panelId}
        className={`absolute inset-x-0 top-16 border-b border-navy-100 bg-navy-50 px-4 pb-6 pt-2 shadow-[0_24px_48px_-28px_rgba(11,27,51,0.45)] transition-[opacity,transform,visibility] duration-200 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav aria-label="Mobiel menu">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl px-3 py-3.5 text-lg font-semibold text-navy-950 transition-colors duration-150 hover:bg-white active:bg-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

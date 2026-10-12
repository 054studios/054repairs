"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/styles";

type NavLink = { href: string; label: string };

// The small button, raised to a 44px tap target so it still fits next to the wordmark on a 360px phone.
const headerButton = (variant: "primary" | "secondary") => buttonClass(variant, "sm").replace("min-h-10", "min-h-11");

// Small client island: the active page marker, the booking button and the mobile menu.
// The menu remembers the path it was opened on, so navigating closes it without an effect.
export function HeaderNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // On the booking pages the button would point at the page you are on.
  const inBooking = pathname.startsWith("/boeken") || pathname.startsWith("/boeking");
  // On the home page the price check carries the cyan action, so the header button steps back.
  const ctaVariant = pathname === "/" ? "secondary" : "primary";

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const close = () => setOpenPath(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPath(null);
        toggleRef.current?.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpenPath(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <nav aria-label="Hoofdmenu" className="ml-auto hidden lg:block">
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className="group relative inline-flex min-h-11 items-center rounded-ui px-3.5 text-[0.95rem] font-medium text-steel-300 transition-colors duration-150 hover:text-steel-50 aria-[current=page]:text-steel-50"
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3.5 -bottom-[11px] h-0.5 origin-left scale-x-0 rounded-full bg-cyan-400 transition-transform duration-200 ease-out-strong group-aria-[current=page]:scale-x-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:ml-5">
        {inBooking ? null : (
          <Link
            href="/boeken"
            className={`${headerButton(ctaVariant)} max-[359px]:hidden`}
          >
            Boek een reparatie
          </Link>
        )}

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenPath(open ? null : pathname)}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-ui text-steel-100 transition-[transform,background-color] duration-150 ease-out-strong hover:bg-ink-800 active:scale-[0.96] lg:hidden"
        >
          <span className="sr-only">{open ? "Menu sluiten" : "Menu openen"}</span>
          {open ? <X aria-hidden="true" className="size-6" /> : <List aria-hidden="true" className="size-6" />}
        </button>
      </div>

      <div
        ref={panelRef}
        id={panelId}
        data-open={open}
        className="absolute inset-x-0 top-full border-b border-line bg-ink-950 shadow-panel transition-[opacity,transform,visibility] duration-200 ease-out-strong data-[open=false]:invisible data-[open=false]:-translate-y-2 data-[open=false]:opacity-0 lg:hidden"
      >
        <nav aria-label="Mobiel menu" className="mx-auto w-full max-w-[76rem] px-4 pb-6 pt-2 sm:px-6">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className="flex min-h-13 items-center gap-3 rounded-ui px-3 text-lg font-medium text-steel-100 transition-colors duration-150 hover:bg-ink-850 aria-[current=page]:text-cyan-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {inBooking ? null : (
            <Link href="/boeken" onClick={close} className={`${buttonClass("primary", "lg")} mt-4 w-full`}>
              Boek een reparatie
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}

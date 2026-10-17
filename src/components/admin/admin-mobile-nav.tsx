"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRightIcon,
  CaretRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Wordmark } from "@/components/ui/wordmark";
import { isActive, navItems } from "./admin-nav";

const primaryItems = navItems.slice(0, 3);
const groups = [...new Set(navItems.map((item) => item.group))];

export function AdminMobileNav({
  accountAction,
}: {
  accountAction: ReactNode;
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const moreActive = !primaryItems.some((item) =>
    isActive(pathname, item.href),
  );
  const current = navItems.find((item) => isActive(pathname, item.href));

  // Native modal behavior provides focus trapping, Escape and an inert background.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialog.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-3 border-b border-line bg-ink-950/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:px-6 lg:hidden">
        <Link
          href="/admin"
          aria-label="054repairs beheer — overzicht"
          className="flex min-h-14 min-w-0 flex-col justify-center gap-1 rounded-ui text-steel-300"
        >
          <Wordmark />
          <span className="text-xs text-steel-400">
            Beheer <span aria-hidden="true">/</span>{" "}
            {current?.label ?? "Overzicht"}
          </span>
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-ui border border-line-strong px-3 text-sm font-medium text-steel-300 hover:bg-ink-800"
        >
          Website <ArrowUpRightIcon aria-hidden="true" className="size-4" />
          <span className="sr-only"> (nieuw tabblad)</span>
        </Link>
      </header>

      <nav
        aria-label="Mobiele beheernavigatie"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-ink-900/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 py-2">
          {primaryItems.map(({ href, label, icon: ItemIcon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium text-steel-400 transition-colors hover:bg-ink-800 aria-[current=page]:bg-cyan-400/10 aria-[current=page]:text-cyan-300"
              >
                <ItemIcon
                  aria-hidden="true"
                  weight={isActive(pathname, href) ? "fill" : "regular"}
                  className="size-6"
                />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="admin-mobile-menu"
              onClick={() => {
                dialog.current?.showModal();
                setOpen(true);
              }}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors hover:bg-ink-800 ${moreActive || open ? "bg-cyan-400/10 text-cyan-300" : "text-steel-400"}`}
            >
              <ListIcon aria-hidden="true" className="size-6" />
              Meer
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialog}
        id="admin-mobile-menu"
        aria-labelledby="admin-mobile-menu-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        className="admin-menu fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-hidden rounded-t-[1.75rem] border border-line-strong bg-ink-900 p-0 text-steel-100 shadow-raised backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:mx-auto sm:max-w-lg"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 pb-4 pt-3">
            <div>
              <h2
                id="admin-mobile-menu-title"
                className="text-xl font-semibold text-steel-50"
              >
                Alle onderdelen
              </h2>
              <p className="mt-1 text-sm text-steel-400">
                Alles voor je reparatiebedrijf.
              </p>
            </div>
            <button
              type="button"
              autoFocus
              aria-label="Menu sluiten"
              onClick={() => dialog.current?.close()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-steel-300 hover:bg-ink-700"
            >
              <XIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <nav aria-label="Alle beheeronderdelen" className="space-y-5">
              {groups.map((group) => (
                <section key={group} aria-label={group}>
                  <h3 className="mb-2 px-1 font-sans text-xs font-semibold tracking-wide text-steel-400">
                    {group}
                  </h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {navItems
                      .filter((item) => item.group === group)
                      .map(({ href, label, icon: ItemIcon }) => (
                        <li key={href} className="min-w-0">
                          <Link
                            href={href}
                            prefetch={false}
                            aria-current={
                              isActive(pathname, href) ? "page" : undefined
                            }
                            onClick={() => dialog.current?.close()}
                            className="flex h-full min-h-16 items-center gap-2.5 rounded-xl bg-ink-850 px-3 py-3 text-sm font-medium text-steel-300 ring-1 ring-inset ring-line transition-colors hover:bg-ink-800 aria-[current=page]:bg-cyan-400/10 aria-[current=page]:text-cyan-300 aria-[current=page]:ring-cyan-400/35"
                          >
                            <ItemIcon
                              aria-hidden="true"
                              className="size-5 shrink-0"
                            />
                            <span className="min-w-0">
                              {href === "/admin/bedrijfsvoering"
                                ? "Bedrijf"
                                : label}
                            </span>
                            {isActive(pathname, href) && (
                              <CaretRightIcon
                                aria-hidden="true"
                                className="ml-auto size-3.5 shrink-0"
                              />
                            )}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </nav>
            <div className="mt-5 border-t border-line pt-3">
              {accountAction}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

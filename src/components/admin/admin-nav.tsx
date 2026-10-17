"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheckIcon,
  ClockIcon,
  CreditCardIcon,
  GearSixIcon,
  HouseIcon,
  PathIcon,
  TagIcon,
  type Icon,
} from "@phosphor-icons/react";
import { ScrollStrip } from "./scroll-strip";

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: "/admin", label: "Overzicht", icon: HouseIcon },
  { href: "/admin/werkdag", label: "Werkdag", icon: PathIcon },
  { href: "/admin/voorraad", label: "Voorraad", icon: TagIcon },
  { href: "/admin/publicatie", label: "Foto’s en reviews", icon: HouseIcon },
  {
    href: "/admin/bedrijfsvoering",
    label: "Bedrijfsvoering",
    icon: GearSixIcon,
  },
  { href: "/admin/afspraken", label: "Afspraken", icon: CalendarCheckIcon },
  { href: "/admin/catalogus", label: "Catalogus", icon: TagIcon },
  { href: "/admin/voorrijkosten", label: "Voorrijkosten", icon: PathIcon },
  { href: "/admin/planning", label: "Planning", icon: ClockIcon },
  { href: "/admin/betalingen", label: "Betalingen", icon: CreditCardIcon },
  { href: "/admin/inzichten", label: "Inzichten", icon: HouseIcon },
  { href: "/admin/instellingen", label: "Instellingen", icon: GearSixIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// Desktop rail. The nav is a route: a faint line along the left edge, and one cyan segment
// that travels to the current stop when the page changes (transform only, CSS transition).
// Items are 2.75rem high with a 0.25rem gap, so stop n sits at n * 3rem.
export function AdminRailNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) =>
    isActive(pathname, item.href),
  );

  return (
    <nav aria-label="Beheer">
      <div className="relative pl-3">
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-line"
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 h-5 w-0.5 rounded-full bg-cyan-400 transition-[transform,opacity] duration-300 ease-in-out-strong"
          style={{
            transform: `translateY(${Math.max(activeIndex, 0) * 3}rem)`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        />
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: ItemIcon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className="group flex h-11 items-center gap-3 rounded-ui px-3 text-[0.95rem] font-medium text-steel-400 transition-colors duration-150 hover:bg-ink-850 hover:text-steel-100 aria-[current=page]:text-steel-50"
              >
                <ItemIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-steel-500 transition-colors duration-150 group-hover:text-steel-300 group-aria-[current=page]:text-cyan-300"
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// Mobile strip under the top bar. Scrolls sideways with snap points and keeps the current
// page in view; the same cyan segment marks it at the left edge of the item.
export function AdminStripNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Beheer" className="relative">
      <ScrollStrip activeKey={pathname} className="scroll-px-4">
        <ul className="flex w-max gap-1 py-1.5 pl-4 pr-10">
          {navItems.map(({ href, label, icon: ItemIcon }) => (
            <li key={href} className="snap-start">
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className="group relative flex h-11 items-center gap-2 rounded-ui pl-3.5 pr-3 text-sm font-medium text-steel-400 transition-colors duration-150 hover:text-steel-100 aria-[current=page]:bg-ink-850 aria-[current=page]:text-steel-50"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 scale-y-0 rounded-full bg-cyan-400 transition-transform duration-200 ease-out-strong group-aria-[current=page]:scale-y-100"
                />
                <ItemIcon
                  aria-hidden="true"
                  className="size-[1.125rem] shrink-0 text-steel-500 group-aria-[current=page]:text-cyan-300"
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </ScrollStrip>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-ink-950 to-transparent"
      />
    </nav>
  );
}

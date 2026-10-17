"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheckIcon,
  ChartBarIcon,
  ImagesIcon,
  PackageIcon,
  ClockIcon,
  CreditCardIcon,
  GearSixIcon,
  HouseIcon,
  PathIcon,
  TagIcon,
  type Icon,
} from "@phosphor-icons/react";

export const navItems: {
  href: string;
  label: string;
  icon: Icon;
  group: string;
}[] = [
  { href: "/admin", label: "Overzicht", icon: HouseIcon, group: "Dagelijks" },
  {
    href: "/admin/werkdag",
    label: "Werkdag",
    icon: PathIcon,
    group: "Dagelijks",
  },
  {
    href: "/admin/afspraken",
    label: "Afspraken",
    icon: CalendarCheckIcon,
    group: "Dagelijks",
  },
  {
    href: "/admin/voorraad",
    label: "Voorraad",
    icon: PackageIcon,
    group: "Dagelijks",
  },
  {
    href: "/admin/catalogus",
    label: "Catalogus",
    icon: TagIcon,
    group: "Aanbod en zichtbaarheid",
  },
  {
    href: "/admin/publicatie",
    label: "Foto's en reviews",
    icon: ImagesIcon,
    group: "Aanbod en zichtbaarheid",
  },
  {
    href: "/admin/inzichten",
    label: "Inzichten",
    icon: ChartBarIcon,
    group: "Aanbod en zichtbaarheid",
  },
  {
    href: "/admin/planning",
    label: "Planning",
    icon: ClockIcon,
    group: "Instellingen",
  },
  {
    href: "/admin/voorrijkosten",
    label: "Voorrijkosten",
    icon: PathIcon,
    group: "Instellingen",
  },
  {
    href: "/admin/betalingen",
    label: "Betalingen",
    icon: CreditCardIcon,
    group: "Instellingen",
  },
  {
    href: "/admin/bedrijfsvoering",
    label: "Bedrijfsvoering",
    icon: GearSixIcon,
    group: "Instellingen",
  },
  {
    href: "/admin/instellingen",
    label: "Instellingen",
    icon: GearSixIcon,
    group: "Instellingen",
  },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
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

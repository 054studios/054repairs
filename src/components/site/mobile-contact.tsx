"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { phoneHref } from "./facts";
import { buttonClass } from "@/components/ui/styles";
export function MobileContact({ phone }: { phone: string | null }) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/boeken") ||
    pathname.startsWith("/boeking") ||
    pathname.startsWith("/admin")
  )
    return null;
  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <nav
        aria-label="Snel een reparatie regelen"
        className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-ink-950 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <a
          href={phone ? phoneHref(phone) : "/contact"}
          className={`${buttonClass("secondary", "md")} flex-1`}
        >
          {phone ? "Bellen" : "Contact"}
        </a>
        <Link
          href="/boeken"
          className={`${buttonClass("primary", "md")} flex-1`}
        >
          Boek reparatie
        </Link>
      </nav>
    </>
  );
}

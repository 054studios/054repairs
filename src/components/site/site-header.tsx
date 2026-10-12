import Link from "next/link";
import { buttonClass } from "./button";
import { MobileMenu } from "./mobile-menu";

export const siteLinks = [
  { href: "/prijzen", label: "Prijzen" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/faq", label: "Vragen" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-navy-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6 lg:px-8">
        <Link href="/" className="rounded-lg text-lg font-extrabold tracking-[-0.02em] text-navy-950">
          054repairs
        </Link>

        <nav aria-label="Hoofdmenu" className="ml-auto hidden items-center gap-7 lg:flex">
          {siteLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-navy-800 transition-colors duration-150 hover:text-navy-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/boeken" className={`${buttonClass("primary", "sm")} ml-auto lg:ml-8`}>
          Boek nu
        </Link>

        <MobileMenu links={siteLinks} />
      </div>
    </header>
  );
}

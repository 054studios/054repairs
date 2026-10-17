import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { HeaderNav } from "./header-nav";

export const siteLinks = [
  { href: "/reparaties", label: "Reparaties" },
  { href: "/werkgebied", label: "Werkgebied" },
  { href: "/prijzen", label: "Prijzen" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/faq", label: "Vragen" },
  { href: "/contact", label: "Contact" },
];

// Sticky and solid (no blur), so scrolling stays cheap on older phones.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/[0.94]">
      <div className="mx-auto flex h-16 w-full max-w-[76rem] items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="-ml-1 inline-flex min-h-11 items-center rounded-ui px-1 text-steel-300">
          <Wordmark />
        </Link>
        <HeaderNav links={siteLinks} />
      </div>
    </header>
  );
}

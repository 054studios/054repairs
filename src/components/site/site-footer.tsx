import Link from "next/link";
import { connection } from "next/server";
import type { PublicSettings } from "./data";
import { phoneHref } from "./facts";
import { textLinkClass } from "./button";
import { Container } from "./ui";

const pageLinks = [
  { href: "/prijzen", label: "Prijzen" },
  { href: "/hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/faq", label: "Veelgestelde vragen" },
  { href: "/contact", label: "Contact" },
  { href: "/boeken", label: "Boek een reparatie" },
];

export async function SiteFooter({ settings }: { settings: PublicSettings | null }) {
  // The year is read at request time, so it is never frozen into a prerendered page.
  await connection();
  const name = settings?.businessName ?? "054repairs";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-100 bg-white">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div>
          <p className="text-lg font-extrabold tracking-[-0.02em] text-navy-950">{name}</p>
          <p className="mt-2 max-w-[30ch] text-navy-800">
            Telefoonreparatie aan huis. Wij halen je toestel op en brengen het terug.
          </p>
        </div>

        <nav aria-label="Paginas in de voettekst">
          <p className="font-semibold text-navy-950">Pagina’s</p>
          <ul className="mt-4 space-y-2.5">
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={textLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-semibold text-navy-950">Contact</p>
          <ul className="mt-4 space-y-2.5 text-navy-800">
            {settings?.phone ? (
              <li>
                <a href={phoneHref(settings.phone)} className={textLinkClass}>
                  {settings.phone}
                </a>
              </li>
            ) : null}
            {settings?.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className={textLinkClass}>
                  {settings.email}
                </a>
              </li>
            ) : null}
            {!settings?.phone && !settings?.email ? <li>Contactgegevens volgen binnenkort.</li> : null}
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-4 border-t border-navy-100 py-6 text-sm text-navy-700 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {name}
        </p>
        <nav aria-label="Juridisch">
          <ul className="flex gap-6">
            <li>
              <Link href="/voorwaarden" className={textLinkClass}>
                Voorwaarden
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={textLinkClass}>
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}

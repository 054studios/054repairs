import Link from "next/link";
import { connection } from "next/server";
import { Wordmark } from "@/components/ui/wordmark";
import type { PublicSettings } from "./data";
import { phoneHref } from "./facts";
import { siteLinks } from "./site-header";
import { Container } from "./ui";

const footerLink =
  "inline-flex min-h-11 items-center text-steel-300 underline-offset-4 transition-colors duration-150 hover:text-steel-50 hover:underline";

export async function SiteFooter({ settings }: { settings: PublicSettings | null }) {
  // The year is read at request time, so it is never frozen into a prerendered page.
  await connection();
  const name = settings?.businessName ?? "054repairs";
  const year = new Date().getFullYear();
  const hasContact = Boolean(settings?.phone || settings?.email);

  return (
    <footer className="border-t border-line bg-ink-950">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:py-16">
        <div>
          <Link href="/" className="-ml-1 inline-flex min-h-11 items-center rounded-ui px-1 text-steel-300">
            <Wordmark />
          </Link>
          <p className="mt-3 max-w-[34ch] leading-relaxed text-steel-400">
            Wij repareren iPhones ter plekke, in onze bus bij jou voor de deur.
          </p>
        </div>

        <nav aria-labelledby="voet-paginas">
          <h2 id="voet-paginas" className="text-sm font-semibold text-steel-100">
            Pagina&apos;s
          </h2>
          <ul className="mt-2">
            {[...siteLinks, { href: "/over-ons", label: "Over ons" }].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/boeken" className={footerLink}>
                Boek een reparatie
              </Link>
            </li>
          </ul>
        </nav>

        {hasContact ? (
          <div>
            <h2 className="text-sm font-semibold text-steel-100">Contact</h2>
            <ul className="mt-2">
              {settings?.phone ? (
                <li>
                  <a href={phoneHref(settings.phone)} className={`${footerLink} figures`}>
                    {settings.phone}
                  </a>
                </li>
              ) : null}
              {settings?.email ? (
                <li>
                  <a href={`mailto:${settings.email}`} className={`${footerLink} break-all`}>
                    {settings.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-5 text-sm text-steel-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}
          </p>
          <ul className="flex gap-6">
            <li>
              <Link href="/voorwaarden" className={footerLink}>
                Voorwaarden
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={footerLink}>
                Privacy
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  );
}

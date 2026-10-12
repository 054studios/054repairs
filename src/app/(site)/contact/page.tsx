import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { getPublicSettings } from "@/components/site/data";
import { phoneHref } from "@/components/site/facts";
import { Container, Notice, PageHeader } from "@/components/site/ui";
import { buttonClass, h3Class } from "@/components/ui/styles";

// Contact details come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Contact",
  description: "Bel of mail ons met een vraag over je iPhone of je boeking. Een reparatie boeken gaat het snelst online.",
};

const rowClass =
  "group flex min-h-20 items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-ink-850 sm:px-6";

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const hasContact = Boolean(settings?.phone || settings?.email);

  return (
    <>
      <PageHeader
        title="Contact"
        lead="Een vraag over je iPhone of je boeking? Bel of mail ons. Een reparatie boeken gaat het snelst online."
      />

      <Container className="grid gap-8 pb-20 md:pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
        <section aria-labelledby="bereikbaar-titel">
          <h2 id="bereikbaar-titel" className="sr-only">
            Contactgegevens
          </h2>

          {settings === null ? (
            <Notice>We kunnen de contactgegevens nu niet laden. Probeer het later opnieuw.</Notice>
          ) : hasContact ? (
            <ul className="divide-y divide-line overflow-hidden rounded-panel bg-ink-900 shadow-panel ring-1 ring-line">
              {settings.phone ? (
                <li>
                  <a href={phoneHref(settings.phone)} className={rowClass}>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-ui bg-ink-800 text-cyan-300 ring-1 ring-line">
                      <Phone aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-steel-400">Bellen</span>
                      <span className="figures block font-display text-xl font-semibold tracking-[-0.01em] text-steel-50 transition-colors duration-150 group-hover:text-cyan-200 sm:text-2xl">
                        {settings.phone}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
              {settings.email ? (
                <li>
                  <a href={`mailto:${settings.email}`} className={rowClass}>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-ui bg-ink-800 text-cyan-300 ring-1 ring-line">
                      <EnvelopeSimple aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-steel-400">Mailen</span>
                      <span className="block break-all font-display text-xl font-semibold tracking-[-0.01em] text-steel-50 transition-colors duration-150 group-hover:text-cyan-200 sm:text-2xl">
                        {settings.email}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <Notice>Onze contactgegevens volgen binnenkort. Boeken kan al wel online.</Notice>
          )}

          <div className="mt-8 max-w-[56ch]">
            <h3 className={h3Class}>Deel je pincode niet</h3>
            <p className="mt-2 leading-relaxed text-steel-400">
              Deel je pincode of wachtwoord nooit per e-mail of telefoon, ook niet als iemand daar om vraagt.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="boeken-titel"
          className="self-start rounded-panel bg-ink-900 p-6 shadow-panel ring-1 ring-line sm:p-8"
        >
          <h2 id="boeken-titel" className="font-display text-2xl font-semibold tracking-[-0.02em] text-steel-50">
            Een reparatie boeken
          </h2>
          <p className="mt-3 leading-relaxed text-steel-400">
            Dat gaat het snelst online. Je ziet meteen de prijs voor jouw model, kiest zelf een tijdstip en legt het vast
            met een aanbetaling.
          </p>
          <Link href="/boeken" className={`${buttonClass("primary", "lg")} mt-6 w-full sm:w-auto`}>
            Boek een reparatie
          </Link>
        </section>
      </Container>
    </>
  );
}

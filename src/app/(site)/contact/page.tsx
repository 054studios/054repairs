import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, textLinkClass } from "@/components/site/button";
import { getPublicSettings } from "@/components/site/data";
import { phoneHref } from "@/components/site/facts";
import { Container, Notice, PageHeader } from "@/components/site/ui";

// Contact details come from the database on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Contact",
  description: "Bel of mail ons met een vraag over je toestel of je boeking.",
};

export default async function ContactPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <PageHeader
        title="Contact"
        lead="Heb je een vraag over je toestel of je boeking? Bel of mail ons. Voor een nieuwe reparatie boek je online."
      />

      <Container className="space-y-12 pb-24">
        {settings ? (
          <div className="grid gap-5 md:grid-cols-2">
            <section aria-labelledby="bellen-titel" className="rounded-2xl bg-white p-7 ring-1 ring-navy-100">
              <h2 id="bellen-titel" className="text-lg font-bold text-navy-950">
                Bellen
              </h2>
              {settings.phone ? (
                <>
                  <p className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-navy-950">
                    <a href={phoneHref(settings.phone)} className={textLinkClass}>
                      {settings.phone}
                    </a>
                  </p>
                </>
              ) : (
                <p className="mt-3 leading-relaxed text-navy-800">Ons telefoonnummer volgt binnenkort.</p>
              )}
            </section>

            <section aria-labelledby="mail-titel" className="rounded-2xl bg-white p-7 ring-1 ring-navy-100">
              <h2 id="mail-titel" className="text-lg font-bold text-navy-950">
                E-mail
              </h2>
              {settings.email ? (
                <p className="mt-3 break-all text-xl font-bold tracking-[-0.01em] text-navy-950">
                  <a href={`mailto:${settings.email}`} className={textLinkClass}>
                    {settings.email}
                  </a>
                </p>
              ) : (
                <p className="mt-3 leading-relaxed text-navy-800">Ons e-mailadres volgt binnenkort.</p>
              )}
            </section>
          </div>
        ) : (
          <Notice>We kunnen de contactgegevens nu niet laden. Probeer het later opnieuw.</Notice>
        )}

        <section aria-labelledby="privacy-tip-titel" className="max-w-[60ch]">
          <h2 id="privacy-tip-titel" className="text-2xl font-extrabold tracking-[-0.02em] text-navy-950">
            Deel je pincode niet
          </h2>
          <p className="mt-3 leading-relaxed text-navy-800">
            Deel je pincode of wachtwoord nooit per e-mail of telefoon, ook niet als iemand daar om vraagt.
          </p>
        </section>

        <section aria-labelledby="boek-titel" className="flex flex-col gap-5 rounded-3xl bg-white p-8 ring-1 ring-navy-100 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 id="boek-titel" className="text-xl font-bold text-navy-950">
              Een reparatie boeken?
            </h2>
            <p className="mt-2 leading-relaxed text-navy-800">Dat kan online, op een moment dat jou past.</p>
          </div>
          <Link href="/boeken" className={`${buttonClass("primary")} shrink-0`}>
            Boek een reparatie
          </Link>
        </section>
      </Container>
    </>
  );
}

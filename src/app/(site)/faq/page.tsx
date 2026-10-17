import { pageMetadata } from "@/components/site/seo";
import Link from "next/link";
import { getCatalogue, getPublicSettings } from "@/components/site/data";
import { buildFaq, faqGroups } from "@/components/site/faq-items";
import { FaqList } from "@/components/site/faq-list";
import { ClosingCta, Container, PageHeader } from "@/components/site/ui";
import { displayClass, textLinkClass } from "@/components/ui/styles";

// Answers use the live settings and catalogue, read on each request.
export const instant = false;

export const metadata = pageMetadata("Veelgestelde vragen over iPhone-reparatie", "Antwoorden over iPhone-reparatie op locatie, onderdelen, voorrijkosten, betalen en je afspraak.", "/faq");

export default async function FaqPage() {
  const [settings, catalogue] = await Promise.all([getPublicSettings(), getCatalogue()]);
  const items = buildFaq(settings, catalogue);

  return (
    <>
      <PageHeader title="Veelgestelde vragen" lead="Over de reparatie, de voorrijkosten, betalen en annuleren.">
        <p className="mt-4 text-steel-400">
          Staat je vraag er niet bij?{" "}
          <Link href="/contact" className={textLinkClass}>
            Neem contact op
          </Link>
          .
        </p>
      </PageHeader>

      <Container className="space-y-14 pb-20 pt-2 md:space-y-20 md:pb-28">
        {faqGroups.map((group) => {
          const groupItems = items.filter((item) => item.group === group.id);

          if (groupItems.length === 0) {
            return null;
          }

          return (
            <section
              key={group.id}
              aria-labelledby={`groep-${group.id}`}
              className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16"
            >
              <h2
                id={`groep-${group.id}`}
                className={`${displayClass} text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.12] lg:pt-4`}
              >
                {group.title}
              </h2>
              <div className="max-w-[48rem]">
                <FaqList items={groupItems} groupName={`faq-${group.id}`} />
              </div>
            </section>
          );
        })}
      </Container>

      <ClosingCta title="Alles duidelijk? Boek je reparatie." />
    </>
  );
}

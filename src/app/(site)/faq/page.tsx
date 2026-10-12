import type { Metadata } from "next";
import Link from "next/link";
import { textLinkClass } from "@/components/site/button";
import { getCatalogue, getPublicSettings } from "@/components/site/data";
import { buildFaq } from "@/components/site/faq-items";
import { FaqList } from "@/components/site/faq-list";
import { Container, PageHeader } from "@/components/site/ui";

// Answers use the live settings and catalogue, read on each request.
export const instant = false;

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description: "Antwoorden over het ophalen, de voorrijkosten, betalen, annuleren, de duur en de garantie.",
};

export default async function FaqPage() {
  const [settings, catalogue] = await Promise.all([getPublicSettings(), getCatalogue()]);
  const items = buildFaq(settings, catalogue);

  return (
    <>
      <PageHeader title="Veelgestelde vragen" lead="Staat je vraag er niet bij? Neem gerust contact op." />

      <Container className="pb-24">
        <div className="max-w-[72ch]">
          <FaqList items={items} groupName="faq" />
        </div>

        <p className="mt-12">
          Nog een vraag? Dat kan op de{" "}
          <Link href="/contact" className={textLinkClass}>
            contactpagina
          </Link>
          .
        </p>
      </Container>
    </>
  );
}

import Link from "next/link";
import { pageMetadata } from "@/components/site/seo";
import { repairPages } from "@/components/site/repair-content";
import { Container, PageHeader } from "@/components/site/ui";
export const metadata = pageMetadata(
  "iPhone-reparaties op locatie",
  "Bekijk onze iPhone-reparaties: scherm, batterij en laadpoort. Kies je reparatie, bekijk prijzen en boek online.",
  "/reparaties",
);
export default function RepairsPage() {
  return (
    <>
      <PageHeader
        title="Wat wil je laten repareren?"
        lead="Bekijk de mogelijkheden per reparatie. De beschikbare modellen en prijzen komen uit onze actuele catalogus."
      />
      <Container className="grid gap-5 pb-20 md:grid-cols-3">
        {repairPages.map((repair) => (
          <article
            key={repair.slug}
            className="hover-lift rounded-panel bg-ink-900 p-6 ring-1 ring-line"
          >
            <h2 className="text-2xl font-semibold">{repair.title}</h2>
            <p className="mt-4 leading-relaxed text-steel-400">
              {repair.intro}
            </p>
            <Link
              href={`/reparaties/${repair.slug}`}
              className="mt-5 inline-flex min-h-11 items-center text-cyan-300 underline underline-offset-4"
            >
              Bekijk prijzen en uitleg →
            </Link>
          </article>
        ))}
      </Container>
    </>
  );
}

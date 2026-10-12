import type { ReactNode } from "react";
import { Container, PageHeader } from "./ui";

// Read mode for the legal pages: a comfortable measure, clear headings, a contents list on wide screens,
// and every [placeholder] visibly marked as still to be filled in.

export type LegalArticle = { id: string; title: string; content: ReactNode };

// Turns "[KvK-nummer]" inside a sentence into a marked to-do, so the owner sees what is left.
export function todo(text: string): ReactNode {
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark
        key={index}
        title="Nog invullen"
        className="rounded-[5px] bg-warn/12 px-1 font-medium text-warn ring-1 ring-warn/30 [box-decoration-break:clone]"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-steel-500">
      {items.map((item) => (
        <li key={item} className="pl-1">
          {todo(item)}
        </li>
      ))}
    </ul>
  );
}

export function LegalPage({ title, lead, articles }: { title: string; lead: string; articles: LegalArticle[] }) {
  return (
    <>
      <PageHeader title={title} lead={lead} />

      <Container className="grid gap-10 pb-20 md:pb-28 lg:grid-cols-[minmax(0,15rem)_minmax(0,68ch)] lg:gap-16">
        <nav aria-labelledby="inhoud-titel" className="hidden lg:block">
          <div className="sticky top-24">
            <h2 id="inhoud-titel" className="text-sm font-semibold text-steel-100">
              Inhoud
            </h2>
            <ol className="mt-3 space-y-0.5 border-l border-line">
              {articles.map((article) => (
                <li key={article.id}>
                  <a
                    href={`#${article.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-steel-400 transition-colors duration-150 hover:border-cyan-400 hover:text-steel-50"
                  >
                    {article.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="max-w-[68ch]">
          <div className="rounded-panel bg-warn/[0.06] px-5 py-4 text-base leading-relaxed text-steel-100 ring-1 ring-warn/25">
            <p>
              <span className="font-semibold text-warn">Concept.</span> Laat deze tekst controleren door een jurist
              voordat de website live gaat. Vervang alle gemarkeerde tekst tussen {todo("[haakjes]")} door je eigen
              gegevens.
            </p>
          </div>

          <div className="mt-12 space-y-12">
            {articles.map((article) => (
              <section key={article.id} id={article.id} aria-labelledby={`${article.id}-titel`} className="scroll-mt-24">
                <h2
                  id={`${article.id}-titel`}
                  className="font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-steel-50"
                >
                  {article.title}
                </h2>
                <div className="mt-4 space-y-4 text-[1.0625rem] leading-[1.7] text-steel-300">
                  {article.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}

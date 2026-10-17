import type { PublicSettings } from "./data";
import { absoluteUrl } from "./seo";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function BusinessSchema({
  settings,
}: {
  settings: PublicSettings | null;
}) {
  // No storefront or private start address is advertised. No invented ratings or credentials.
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": absoluteUrl("/#bedrijf"),
        name: settings?.businessName || "054repairs",
        url: absoluteUrl("/"),
        description: "iPhone-reparatie op locatie, in onze bus bij de klant.",
        areaServed: { "@type": "AdministrativeArea", name: "Regio Amsterdam" },
        ...(settings?.phone ? { telephone: settings.phone } : {}),
        ...(settings?.email ? { email: settings.email } : {}),
      }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <>
      <nav
        aria-label="Broodkruimel"
        className="mb-6 flex flex-wrap gap-2 text-sm text-steel-400"
      >
        {items.map((item, i) => (
          <span key={item.path}>
            {i > 0 && (
              <span aria-hidden="true" className="mr-2">
                /
              </span>
            )}
            <a
              href={item.path}
              aria-current={i === items.length - 1 ? "page" : undefined}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {item.name}
            </a>
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
          })),
        }}
      />
    </>
  );
}

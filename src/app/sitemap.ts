import type { MetadataRoute } from "next";
import { siteUrl } from "@/components/site/site-url";
import { indexingEnabled } from "@/components/site/seo";
import { repairPages } from "@/components/site/repair-content";
import { getCatalogue } from "@/components/site/data";
import { pricedCatalogue } from "@/components/site/catalogue";
import { slugify } from "@/lib/slug";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingEnabled()) return [];
  const catalogue = await getCatalogue();
  const paths = ["/", "/prijzen", "/hoe-het-werkt", "/faq", "/contact", "/voorwaarden", "/privacy", "/werkgebied", "/over-ons", "/reparaties",
    ...repairPages.map(r => `/reparaties/${r.slug}`),
    ...(catalogue ? pricedCatalogue(catalogue).models.map(m => `/iphone/${slugify(m.name)}`) : [])];
  return paths.map(path => ({ url: `${siteUrl()}${path}` }));
}

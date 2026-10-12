import type { MetadataRoute } from "next";
import { siteUrl } from "@/components/site/site-url";

// Public pages only. Admin pages and the booking flow are left out.
const paths = ["/", "/prijzen", "/hoe-het-werkt", "/faq", "/contact", "/voorwaarden", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/prijzen" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

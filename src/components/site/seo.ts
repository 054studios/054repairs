import type { Metadata } from "next";
import { siteUrl } from "./site-url";

// Indexing is a deliberate launch setting. Vercel previews always stay out of search.
export function indexingEnabled(): boolean {
  return (
    process.env.SITE_INDEXING_ENABLED === "true" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  );
}
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | 054repairs`,
      description,
      url: path,
      locale: "nl_NL",
      siteName: "054repairs",
      type: "website",
    },
  };
}
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).href;
}

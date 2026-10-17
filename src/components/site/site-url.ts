// Public base URL of the site, used for metadata, the sitemap and robots.txt.
// Set NEXT_PUBLIC_SITE_URL in production, for example https://054repairs.nl.
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // An invalid value is ignored, so the fallback below is used.
    }
  }

  return process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
}

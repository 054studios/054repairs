import type { MetadataRoute } from "next";
import { indexingEnabled } from "@/components/site/seo";
import { siteUrl } from "@/components/site/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    ...(indexingEnabled() ? { sitemap: `${siteUrl()}/sitemap.xml` } : {}),
  };
}

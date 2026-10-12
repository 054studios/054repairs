import type { Metadata } from "next";
import { getPublicSettings } from "@/components/site/data";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Public settings are read on each request, so this segment may block on the server.
export const instant = false;

// The title template only applies to public pages, so admin titles keep their own suffix.
export const metadata: Metadata = {
  title: {
    default: "054repairs | Telefoonreparatie aan huis",
    template: "%s | 054repairs",
  },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Direct naar de inhoud
      </a>
      <SiteHeader />
      <main id="inhoud" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

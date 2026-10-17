import type { Metadata } from "next";
import { Suspense } from "react";
import { FooterSkeleton } from "@/components/site/loading-skeletons";
import { getPublicSettings } from "@/components/site/data";
import { SiteFooter } from "@/components/site/site-footer";
import { BusinessSchema } from "@/components/site/structured-data";
import { MobileContact } from "@/components/site/mobile-contact";
import { SiteHeader } from "@/components/site/site-header";

// Public settings use a short shared cache; booking rules are checked again in the booking flow.
export const instant = false;

// The title template only applies to public pages, so admin titles keep their own suffix.
export const metadata: Metadata = {
  title: {
    default: "054repairs | iPhone-reparatie aan huis",
    template: "%s | 054repairs",
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-950">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-ui focus:bg-cyan-400 focus:px-4 focus:py-2.5 focus:font-semibold focus:text-cyan-ink"
      >
        Direct naar de inhoud
      </a>
      <SiteHeader />
      <main id="inhoud" className="flex-1">
        {children}
      </main>
      <Suspense
        fallback={
          <>
            <FooterSkeleton />
            <MobileContact phone={null} />
          </>
        }
      >
        <SiteDetails />
      </Suspense>
    </div>
  );
}

async function SiteDetails() {
  const settings = await getPublicSettings();
  return (
    <>
      <BusinessSchema settings={settings} />
      <SiteFooter settings={settings} />
      <MobileContact phone={settings?.phone ?? null} />
    </>
  );
}

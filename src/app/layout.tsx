import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter_Tight } from "next/font/google";
import { siteUrl } from "@/components/site/site-url";
import "./globals.css";

// Headlines. Variable font, so one file covers every weight we use.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

// Running text and interface.
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "054repairs | iPhone-reparatie aan huis",
  description:
    "Boek online een iPhone-reparatie. Wij rijden naar je toe, repareren ter plekke in de bus en je hebt je telefoon terug zodra de reparatie klaar is.",
  openGraph: {
    siteName: "054repairs",
    locale: "nl_NL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060c18",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${bricolage.variable} ${interTight.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-ink-950 font-sans text-steel-100">{children}</body>
    </html>
  );
}

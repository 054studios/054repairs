import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { siteUrl } from "@/components/site/site-url";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "054repairs | Telefoonreparatie aan huis",
  description: "Boek online een telefoonreparatie. Wij halen je toestel op en brengen het terug.",
  openGraph: {
    siteName: "054repairs",
    locale: "nl_NL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b33",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}

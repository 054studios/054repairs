import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "054repairs | Telefoonreparatie aan huis",
  description: "Boek online een telefoonreparatie. Wij halen je toestel op en brengen het terug.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}

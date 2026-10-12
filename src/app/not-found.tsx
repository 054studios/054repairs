import Link from "next/link";
import { buttonClass } from "@/components/site/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-navy-950 md:text-4xl">
          Pagina niet gevonden
        </h1>
        <p className="mt-4 leading-relaxed text-navy-800">
          Het adres klopt misschien niet, of de pagina is verplaatst. Ga terug naar de homepage.
        </p>
        <Link href="/" className={`${buttonClass("primary")} mt-8`}>
          Naar de homepage
        </Link>
      </div>
    </main>
  );
}

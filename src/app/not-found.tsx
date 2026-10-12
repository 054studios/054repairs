import Link from "next/link";
import { buttonClass, displayClass } from "@/components/ui/styles";
import { Wordmark } from "@/components/ui/wordmark";

export default function NotFound() {
  return (
    <div className="night-sky flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[76rem] items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="-ml-1 inline-flex min-h-11 items-center rounded-ui px-1 text-steel-300">
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[76rem] flex-1 items-center px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="max-w-[34rem]">
          <h1 className={`${displayClass} text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04]`}>
            Deze pagina bestaat niet.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-steel-400">
            Het adres klopt misschien niet, of de pagina is verplaatst. Een reparatie boeken kan altijd.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/boeken" className={buttonClass("primary", "lg")}>
              Boek een reparatie
            </Link>
            <Link href="/" className={buttonClass("secondary", "lg")}>
              Naar de homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

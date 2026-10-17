import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, displayClass, h2Class, leadClass } from "@/components/ui/styles";

// Layout pieces for the public pages. One container width, so every section shares the same left edge.

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

// Inner page title on the night-sky ground. The home page has its own hero.
export function PageHeader({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="night-sky">
      <Container className="pb-12 pt-12 md:pb-16 md:pt-20">
        <h1 className={`${displayClass} max-w-[18ch] text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04]`}>{title}</h1>
        {lead ? <p className={`content-arrive mt-5 max-w-[56ch] ${leadClass}`}>{lead}</p> : null}
        {children}
      </Container>
    </div>
  );
}

// Calm message for fallbacks. The note tone marks something the visitor should not miss.
export function Notice({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "note" }) {
  const style = tone === "note" ? "bg-cyan-400/[0.06] ring-cyan-400/25 text-steel-100" : "bg-ink-900 ring-line text-steel-300";

  return <div className={`rounded-panel px-5 py-4 text-base leading-relaxed ring-1 ${style}`}>{children}</div>;
}

// The last word on a marketing page: one line and the booking button.
export function ClosingCta({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section aria-labelledby="afsluiting-titel" className="pb-20 md:pb-28">
      <Container>
        <div className="reveal-on-scroll relative overflow-hidden rounded-hero bg-ink-900 px-6 py-12 shadow-panel ring-1 ring-line sm:px-10 md:px-14 md:py-16">
          <RouteEnd />
          <div className="relative max-w-[34rem]">
            <h2 id="afsluiting-titel" className={h2Class}>
              {title}
            </h2>
            {children ? <div className="mt-4 text-lg leading-relaxed text-steel-400">{children}</div> : null}
            <Link href="/boeken" className={`${buttonClass("primary", "lg")} mt-8`}>
              Boek een reparatie
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

// The route arrives: a static line that ends at a stop, only where there is room for it.
function RouteEnd() {
  return (
    <svg
      viewBox="0 0 420 240"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute bottom-0 right-0 hidden aspect-[7/4] w-[26rem] lg:block"
    >
      <path
        d="M0 214H170c40 0 56-28 72-62s34-62 74-62h44"
        fill="none"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M170 214c40 0 56-28 72-62s34-62 74-62h44"
        fill="none"
        stroke="var(--color-cyan-400)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="360" cy="90" r="9" fill="var(--color-ink-950)" stroke="var(--color-cyan-400)" strokeWidth="2" />
    </svg>
  );
}

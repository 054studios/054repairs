import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="pb-10 pt-14 md:pb-14 md:pt-20">
      <Container>
        <h1 className="max-w-[18ch] text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-navy-950 md:text-6xl">
          {title}
        </h1>
        {lead && <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-navy-800 md:text-xl">{lead}</p>}
      </Container>
    </div>
  );
}

// Fallback and note text. The note tone is used for concept warnings and important rules.
export function Notice({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "note" }) {
  const style =
    tone === "note"
      ? "bg-accent-soft ring-accent/60"
      : "bg-white ring-navy-100";

  return (
    <p className={`rounded-2xl px-5 py-4 text-base leading-relaxed text-navy-950 ring-1 ${style}`}>{children}</p>
  );
}

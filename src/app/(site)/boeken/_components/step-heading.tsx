import type { ReactNode } from "react";

// The one h1 of the booking page. The wizard focuses it after each step change,
// so screen readers and keyboard users land on the new question.
export function StepHeading({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <header className="mb-5 sm:mb-6">
      <h1
        data-step-heading
        tabIndex={-1}
        className="font-display text-[clamp(1.75rem,6.4vw,2.375rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-steel-50"
      >
        {title}
      </h1>
      {text && <p className="mt-2.5 max-w-[34rem] text-base leading-relaxed text-steel-400">{text}</p>}
      {children}
    </header>
  );
}

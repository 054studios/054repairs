import type { ReactNode } from "react";

// Signature: the route rail. A vertical line that draws itself while scrolling,
// with a stop for each moment of the service. Styles live in globals.css.
export function RouteRail({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ol className={`route-rail space-y-14 md:space-y-20 ${className}`}>{children}</ol>;
}

export function RouteStop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <li className={`route-stop pl-12 md:pl-16 ${className}`}>
      <span className="route-stop-dot" aria-hidden="true" />
      {children}
    </li>
  );
}

// The same route, horizontal: a progress bar for step-by-step flows.
export function RouteProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const ratio = total <= 1 ? 1 : Math.min(1, Math.max(0, (current - 1) / (total - 1)));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className="relative h-6"
    >
      <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-line-strong" />
      <div
        className="route-progress-fill absolute inset-x-2 top-1/2 h-0.5 rounded-full bg-cyan-400"
        style={{ transform: `translateY(-50%) scaleX(${ratio})` }}
      />
      <ol className="absolute inset-0 flex items-center justify-between">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li
              key={step}
              className={`size-3.5 rounded-full border-2 transition-colors duration-200 ${
                active
                  ? "border-cyan-400 bg-ink-950 ring-4 ring-cyan-400/20"
                  : done
                    ? "border-cyan-400 bg-cyan-400"
                    : "border-ink-600 bg-ink-950"
              }`}
            />
          );
        })}
      </ol>
    </div>
  );
}

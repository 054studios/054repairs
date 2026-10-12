import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { APPOINTMENT_STATUS_LABELS, STATUS_ROUTE, STATUS_ROUTE_TEXT } from "@/lib/booking/labels";

// The booking's journey as the signature route: a vertical cyan line with a stop per status.
// Completed stops are filled, the current stop carries a ring, later stops are muted.
// The completed part of the line draws itself once on load (CSS @starting-style, no JS).
export function StatusRoute({ status }: { status: string }) {
  const index = STATUS_ROUTE.indexOf(status as (typeof STATUS_ROUTE)[number]);
  // "returned" is the end of the route: every stop is done.
  const current = status === "returned" ? STATUS_ROUTE.length : Math.max(0, index);

  return (
    <ol className="relative">
      {STATUS_ROUTE.map((key, stop) => {
        const done = stop < current;
        const active = stop === current;
        const last = stop === STATUS_ROUTE.length - 1;
        const label = APPOINTMENT_STATUS_LABELS[key] ?? key;

        return (
          <li key={key} className={`relative pl-9 ${last ? "" : "pb-6"}`} aria-current={active ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute -bottom-1 left-[7px] top-5 w-0.5 origin-top rounded-full ${
                  done
                    ? "bg-cyan-400 transition-[scale] duration-300 ease-out-strong motion-safe:starting:scale-y-0"
                    : "bg-line-strong"
                }`}
                style={done ? { transitionDelay: `${stop * 110}ms` } : undefined}
              />
            )}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1 flex size-4 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-cyan-400 bg-cyan-400 text-cyan-ink"
                  : active
                    ? "border-cyan-400 bg-ink-900 ring-4 ring-cyan-400/20"
                    : "border-ink-600 bg-ink-900"
              }`}
            >
              {done && <CheckIcon size={10} weight="bold" />}
            </span>

            <p className={`leading-6 ${active ? "font-semibold text-steel-50" : done ? "text-steel-300" : "text-steel-500"}`}>
              {label}
              <span className="sr-only">{done ? ", afgerond" : active ? ", huidige stap" : ", nog niet"}</span>
            </p>
            {active && STATUS_ROUTE_TEXT[key] && (
              <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-steel-400">{STATUS_ROUTE_TEXT[key]}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

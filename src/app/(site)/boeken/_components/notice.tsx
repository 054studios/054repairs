import type { ReactNode } from "react";
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";

// A short message on an inset surface. Colour sits in the icon, the text stays readable steel.
// Works in Server and Client Components (the ssr icon build has no context).
export type NoticeTone = "info" | "ok" | "warn" | "bad";

const tones: Record<NoticeTone, { surface: string; icon: string; Icon: typeof InfoIcon }> = {
  info: { surface: "bg-cyan-400/[0.06] ring-cyan-400/25", icon: "text-cyan-300", Icon: InfoIcon },
  ok: { surface: "bg-ok/[0.07] ring-ok/25", icon: "text-ok", Icon: CheckCircleIcon },
  warn: { surface: "bg-warn/[0.07] ring-warn/30", icon: "text-warn", Icon: WarningCircleIcon },
  bad: { surface: "bg-bad/[0.07] ring-bad/30", icon: "text-bad", Icon: XCircleIcon },
};

export function Notice({
  tone = "info",
  title,
  children,
  role,
  className = "",
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  const { surface, icon, Icon } = tones[tone];

  return (
    <div role={role} className={`flex gap-3 rounded-ui px-4 py-3.5 ring-1 ${surface} ${className}`}>
      <Icon size={20} aria-hidden="true" className={`mt-px shrink-0 ${icon}`} />
      <div className="min-w-0 text-[0.9375rem] leading-relaxed text-steel-100">
        {title && <p className="font-semibold text-steel-50">{title}</p>}
        {children && <div className={title ? "mt-1 text-steel-300" : ""}>{children}</div>}
      </div>
    </div>
  );
}

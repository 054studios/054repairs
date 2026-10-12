import type { ReactNode } from "react";
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

const tones = {
  info: { box: "bg-cyan-400/[0.07] ring-cyan-400/25", icon: "text-cyan-300", Icon: InfoIcon },
  ok: { box: "bg-ok/10 ring-ok/30", icon: "text-ok", Icon: CheckCircleIcon },
  warn: { box: "bg-warn/10 ring-warn/30", icon: "text-warn", Icon: WarningIcon },
  bad: { box: "bg-bad/10 ring-bad/30", icon: "text-bad", Icon: WarningCircleIcon },
} as const;

// A tinted box for states that need attention. The tone carries the meaning, the icon repeats it.
export function Notice({
  tone,
  title,
  role,
  className = "",
  children,
}: {
  tone: keyof typeof tones;
  title?: string;
  role?: "alert" | "status";
  className?: string;
  children?: ReactNode;
}) {
  const { box, icon, Icon } = tones[tone];

  return (
    <div role={role} className={`flex gap-3 rounded-ui p-4 text-sm leading-relaxed text-steel-100 ring-1 ${box} ${className}`}>
      <Icon aria-hidden="true" className={`mt-px size-5 shrink-0 ${icon}`} />
      <div className="min-w-0">
        {title && <p className="font-medium text-steel-50">{title}</p>}
        {children && <div className={title ? "mt-0.5 text-steel-300" : undefined}>{children}</div>}
      </div>
    </div>
  );
}

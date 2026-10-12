// Class strings for the booking flow and the status page.
// Everything maps onto the shared design system in src/components/ui/styles.ts,
// so the wizard uses the same buttons, fields and option cards as the rest of the site.
import {
  buttonClass,
  chipClass,
  hintClass,
  inputClass,
  insetClass,
  labelClass,
  optionClass,
  panelClass,
  selectClass,
} from "@/components/ui/styles";

export { buttonClass, chipClass, hintClass, inputClass, insetClass, labelClass, optionClass, panelClass, selectClass };

// The surface every step and status block sits on.
export const stepPanelClass = `${panelClass} p-4 sm:p-6`;

// Older names, kept so any remaining import renders in the new world.
export const cardClass = stepPanelClass;
export const primaryButton = `${buttonClass("primary", "lg")} w-full`;
export const secondaryButton = `${buttonClass("secondary", "lg")} w-full`;

// Section title inside a panel.
export const panelTitleClass = "font-display text-lg font-semibold tracking-[-0.02em] text-steel-50";

// Buttons that toggle a choice without a native input (days, times).
// Selected: the same cyan ring as a checked option card.
export function choiceClass(selected: boolean) {
  return (
    "select-none rounded-ui transition-[background-color,box-shadow,color,transform] duration-150 ease-out-strong active:scale-[0.97] " +
    (selected
      ? "bg-ink-700 text-steel-50 ring-2 ring-cyan-400"
      : "bg-ink-850 text-steel-100 ring-1 ring-line-strong hover:bg-ink-800")
  );
}

// Loading placeholder. animate-pulse only changes opacity; reduced motion stops it globally.
export const skeletonClass = "animate-pulse rounded-ui bg-ink-800";

// Inline field error under an input.
export const fieldErrorClass = "mt-2 flex items-start gap-1.5 text-sm leading-snug text-bad";

// Label and value rows in summaries and receipts.
export const rowLabelClass = "text-sm text-steel-400";
export const rowValueClass = "text-base text-steel-100";

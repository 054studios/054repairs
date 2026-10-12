// Shape rule for the site: buttons are pills, cards are rounded-2xl or rounded-3xl, nothing else.
// Presses scale down a little for instant feedback. Hover colour only applies to pointer devices.

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition-[transform,background-color,box-shadow,color] duration-150 ease-out active:scale-[0.98]";

const sizes = {
  md: "min-h-12 px-6 text-base",
  sm: "min-h-10 px-5 text-sm",
} as const;

const variants = {
  primary: "bg-navy-900 text-white hover:bg-navy-800",
  secondary: "bg-white text-navy-950 ring-1 ring-navy-200 hover:ring-navy-400",
  accent: "bg-accent text-navy-950 hover:bg-accent-strong",
} as const;

export function buttonClass(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md") {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

// Text links inside running copy.
export const textLinkClass =
  "font-semibold text-navy-800 underline decoration-navy-300 underline-offset-4 transition-colors duration-150 hover:text-navy-950 hover:decoration-navy-950";

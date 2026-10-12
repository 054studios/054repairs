// Shared class strings for the whole site, booking flow and admin.
// Tailwind v4 only applies hover: on devices that can hover, so touch never sticks.

const buttonBase =
  "inline-flex select-none items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "transition-[transform,background-color,color,box-shadow] duration-150 ease-out-strong " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

const buttonSizes = {
  sm: "min-h-10 rounded-ui px-4 text-sm",
  md: "min-h-12 rounded-ui px-5 text-[0.95rem]",
  lg: "min-h-14 rounded-[14px] px-7 text-base",
} as const;

const buttonVariants = {
  // The one cyan action per view
  primary: "bg-cyan-400 text-cyan-ink shadow-cta hover:bg-cyan-300",
  // Everything else
  secondary: "bg-ink-800 text-steel-100 shadow-raised ring-1 ring-line-strong hover:bg-ink-700",
  ghost: "text-steel-300 hover:bg-ink-800 hover:text-steel-50",
  danger: "bg-ink-800 text-bad ring-1 ring-bad/35 hover:bg-bad/10",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]}`;
}

// Links inside running text
export const textLinkClass =
  "font-medium text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition-colors duration-150 hover:text-cyan-200 hover:decoration-cyan-300";

// Surfaces. Radius follows hierarchy: panel 18px, hero panel 28px.
export const panelClass = "rounded-panel bg-ink-900 shadow-panel ring-1 ring-line";
export const insetClass = "rounded-ui bg-ink-850 ring-1 ring-line";

// Form controls
export const labelClass = "block text-sm font-medium text-steel-300";
export const hintClass = "text-[0.8125rem] leading-snug text-steel-500";
export const inputClass =
  "w-full min-h-12 rounded-ui bg-ink-850 px-3.5 text-base text-steel-50 ring-1 ring-line-strong " +
  "placeholder:text-steel-500 outline-none transition-[box-shadow,background-color] duration-150 " +
  "hover:ring-steel-500/40 focus:bg-ink-800 focus:ring-2 focus:ring-cyan-400 " +
  "aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-bad disabled:opacity-50";
// Pair with a CaretDown icon positioned at the right inside a relative wrapper.
export const selectClass = `${inputClass} appearance-none pr-10`;

// Selectable option (radio or checkbox card). Put the sr-only input with class "peer" right before it.
export const optionClass =
  "block cursor-pointer rounded-ui bg-ink-850 p-4 ring-1 ring-line-strong transition-[box-shadow,background-color] duration-150 " +
  "hover:bg-ink-800 peer-checked:bg-ink-800 peer-checked:ring-2 peer-checked:ring-cyan-400 " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400 " +
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-45";

// Small status chip. Colour only when it carries meaning.
const chipTones = {
  neutral: "bg-ink-800 text-steel-300 ring-line-strong",
  info: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30",
  ok: "bg-ok/10 text-ok ring-ok/30",
  warn: "bg-warn/10 text-warn ring-warn/30",
  bad: "bg-bad/10 text-bad ring-bad/30",
} as const;

export type ChipTone = keyof typeof chipTones;

export function chipClass(tone: ChipTone = "neutral") {
  return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${chipTones[tone]}`;
}

// Headline sizes. Display face, tight but above the -0.04em floor.
export const displayClass = "font-display font-semibold tracking-[-0.03em] text-steel-50";
export const h1Class = `${displayClass} text-[clamp(2.4rem,6vw,4.75rem)] leading-[1.02]`;
export const h2Class = `${displayClass} text-[clamp(1.85rem,3.6vw,3rem)] leading-[1.08]`;
export const h3Class = "font-display text-xl font-semibold tracking-[-0.02em] text-steel-50";
export const leadClass = "text-lg leading-relaxed text-steel-400 md:text-xl";
export const bodyClass = "text-base leading-relaxed text-steel-400";

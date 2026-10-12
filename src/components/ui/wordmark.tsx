// Wordmark until the owner supplies a logo: a phone outline with the route stop, then the name.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 24 32" aria-hidden="true" className="h-7 w-auto shrink-0">
        <rect x="1.5" y="1.5" width="21" height="29" rx="5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <circle cx="12" cy="20" r="4" fill="var(--color-cyan-400)" />
        <path d="M12 8v7" stroke="var(--color-cyan-400)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">054repairs</span>
    </span>
  );
}

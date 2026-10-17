import type { ReactNode } from "react";
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`skeleton rounded-ui ${className}`} />
  );
}
export function LoadingState({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-loading>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true" aria-busy="true">
        {children}
      </div>
    </div>
  );
}
export function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="loading-spinner size-4 shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity=".25"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

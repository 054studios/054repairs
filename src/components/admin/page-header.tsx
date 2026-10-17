import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

// Every admin page opens the same way: optional back link, the one h1, one line of context.
export function PageHeader({
  title,
  description,
  back,
  aside,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 lg:mb-8">
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1.5 rounded-ui px-2 text-sm font-medium text-steel-400 transition-colors duration-150 hover:text-steel-50"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="font-display text-[1.625rem] font-semibold sm:text-[1.75rem] leading-tight tracking-[-0.025em] text-steel-50 lg:text-[2rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-[60ch] text-[0.95rem] leading-relaxed text-steel-400">
              {description}
            </p>
          )}
        </div>
        {aside && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {aside}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}

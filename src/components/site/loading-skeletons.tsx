import { Container } from "./ui";
import { LoadingState, Skeleton } from "@/components/ui/skeleton";
function HeadingPlaceholder() {
  return (
    <div className="night-sky">
      <Container className="pb-12 pt-12 md:pb-16 md:pt-20">
        <Skeleton className="h-12 w-4/5 max-w-xl sm:h-16" />
        <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-5 w-2/3 max-w-lg" />
      </Container>
    </div>
  );
}
function Cards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-panel bg-ink-900 p-6 ring-1 ring-line">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
export function PriceTableSkeleton() {
  return (
    <LoadingState label="Reparatieprijzen laden">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-2 h-12 w-full max-w-xs" />
      <div className="mt-6 overflow-hidden rounded-panel bg-ink-900 ring-1 ring-line">
        <div className="flex gap-8 border-b border-line p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-5 border-b border-line p-5 last:border-0"
          >
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="ml-auto h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </LoadingState>
  );
}
export function PublicPageSkeleton({ prices = false }: { prices?: boolean }) {
  return (
    <LoadingState label={prices ? "Prijspagina laden" : "Pagina laden"}>
      <HeadingPlaceholder />
      <Container className="pb-20">
        {prices ? <PriceTableSkeleton /> : <Cards />}
      </Container>
    </LoadingState>
  );
}
export function RepairCardsSkeleton() {
  return (
    <LoadingState label="Modellen en reparatieprijzen laden">
      <Cards />
    </LoadingState>
  );
}
export function PriceCheckSkeleton() {
  return (
    <LoadingState
      label="Prijscheck laden"
      className="rounded-hero bg-ink-900 p-5 shadow-raised ring-1 ring-line-strong sm:p-7"
    >
      <Skeleton className="h-7 w-4/5" />
      {[0, 1].map((i) => (
        <div key={i} className="mt-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-12 w-full" />
        </div>
      ))}
      <Skeleton className="mt-5 h-4 w-20" />
      <Skeleton className="mt-2 h-12 w-full" />
      <div className="mt-5 border-t border-line pt-5">
        <Skeleton className="h-14 w-36" />
        <Skeleton className="mt-3 h-4 w-4/5" />
      </div>
      <Skeleton className="mt-5 h-14 w-full" />
    </LoadingState>
  );
}
export function HomeSectionsSkeleton() {
  return (
    <LoadingState label="Reparaties en voorrijkosten laden">
      <Container className="py-12">
        <Skeleton className="mb-10 h-10 w-3/4 max-w-lg" />
        <Cards count={3} />
      </Container>
    </LoadingState>
  );
}
export function BookingSkeleton() {
  return (
    <LoadingState label="Boeken laden">
      <div className="mb-9 flex items-center gap-4">
        <Skeleton className="h-1 flex-1" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <div className="mt-6 grid grid-cols-2 gap-3 rounded-panel bg-ink-900 p-4 ring-1 ring-line sm:grid-cols-3 sm:p-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </LoadingState>
  );
}
export function FooterSkeleton() {
  return (
    <LoadingState
      label="Contactgegevens laden"
      className="border-t border-line"
    >
      <Container className="grid gap-8 py-14 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-5 h-4 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
          </div>
        ))}
      </Container>
    </LoadingState>
  );
}
export function DashboardSkeleton() {
  return (
    <LoadingState label="Overzicht laden">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-panel bg-ink-900 p-5 ring-1 ring-line"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-5 h-9 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-panel bg-ink-900 p-5 ring-1 ring-line">
        <Skeleton className="mb-6 h-6 w-44" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="mb-4 h-14 w-full last:mb-0" />
        ))}
      </div>
    </LoadingState>
  );
}

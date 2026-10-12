import Link from "next/link";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { ScrollStrip } from "@/components/admin/scroll-strip";
import { panelClass, textLinkClass } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { formatEuro } from "@/lib/money";
import { formatShopDateTime } from "@/lib/time";
import {
  outstandingCents,
  STATUS_FILTERS,
  STATUS_LABEL,
  statusBadgeClass,
  isInactive,
} from "./shared";

export const metadata = {
  title: "Afspraken | 054repairs admin",
  robots: { index: false, follow: false },
};

type AppointmentRow = {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  model_label: string;
  city: string;
  starts_at: string;
  total_cents: number;
  paid_cents: number;
};

function payment(row: AppointmentRow): { text: string; className: string } {
  if (isInactive(row.status)) {
    return { text: "n.v.t.", className: "text-steel-500" };
  }

  const open = outstandingCents(row.total_cents, row.paid_cents);
  return open > 0
    ? { text: `Openstaand ${formatEuro(open)}`, className: "text-steel-100" }
    : { text: "Volledig betaald", className: "text-ok" };
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status } = await searchParams;
  const filter = STATUS_FILTERS.find((item) => item.key === status) ?? STATUS_FILTERS[0];

  let query = supabase
    .from("appointments")
    .select("id, reference, status, customer_name, model_label, city, starts_at, total_cents, paid_cents")
    .order("starts_at", { ascending: false })
    .limit(200);

  if (filter.statuses) {
    query = query.in("status", [...filter.statuses]);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div>
        <PageHeader title="Afspraken" />
        <Notice tone="bad" role="alert">
          De afspraken konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      </div>
    );
  }

  const appointments: AppointmentRow[] = data ?? [];

  return (
    <div>
      <PageHeader title="Afspraken" description="Nieuwste eerst. Tik op een afspraak voor de details en acties." />

      {/* Segmented control. On a phone it scrolls sideways and keeps the current filter in view. */}
      <ScrollStrip activeKey={filter.key} className="-mx-4 mb-4 px-4 py-1 sm:mx-0 sm:px-0">
        <nav
          aria-label="Filter op status"
          className="inline-flex gap-1 rounded-[14px] bg-ink-900 p-1 ring-1 ring-inset ring-line"
        >
          {STATUS_FILTERS.map((item) => (
            <Link
              key={item.key}
              href={item.key === "all" ? "/admin/afspraken" : `/admin/afspraken?status=${item.key}`}
              aria-current={item.key === filter.key ? "page" : undefined}
              className="inline-flex h-11 shrink-0 snap-start items-center rounded-ui px-3.5 text-sm font-medium text-steel-400 transition-[background-color,color] duration-150 hover:text-steel-100 aria-[current=page]:bg-ink-700 aria-[current=page]:text-steel-50 aria-[current=page]:shadow-raised"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollStrip>

      {appointments.length === 0 ? (
        <div className={`${panelClass} flex items-start gap-3 p-5`}>
          <CalendarBlankIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-steel-500" />
          <div>
            <p className="text-[0.95rem] text-steel-300">Geen afspraken in deze lijst.</p>
            {filter.key !== "all" && (
              <Link href="/admin/afspraken" className={`${textLinkClass} mt-1 inline-flex min-h-11 items-center text-sm`}>
                Toon alle afspraken
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Phone: one card per appointment. Off-screen cards skip rendering work until scrolled to. */}
          <ul className="space-y-2 md:hidden">
            {appointments.map((row) => {
              const pay = payment(row);
              return (
                <li key={row.id} className="[contain-intrinsic-size:auto_9.5rem] [content-visibility:auto]">
                  <Link
                    href={`/admin/afspraken/${row.id}`}
                    className="block rounded-panel bg-ink-900 p-4 ring-1 ring-line transition-[background-color,transform] duration-150 ease-out-strong hover:bg-ink-850 active:scale-[0.985]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="figures font-medium text-steel-50">{formatShopDateTime(row.starts_at)}</p>
                      <span className={statusBadgeClass(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</span>
                    </div>
                    <p className="mt-1.5 truncate text-steel-100">{row.customer_name}</p>
                    <p className="truncate text-sm text-steel-400">
                      {row.model_label}, {row.city}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                      <span className="figures text-steel-500">{row.reference}</span>
                      <span className={`figures ${pay.className}`}>{pay.text}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Tablet and desktop: a dense table */}
          <div className={`${panelClass} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.8125rem] text-steel-400">
                  <th scope="col" className="py-3 pl-5 pr-3 font-medium">
                    Tijd
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Klant
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Betaling
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-5 font-medium">
                    Referentie
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {appointments.map((row) => {
                  const pay = payment(row);
                  return (
                    <tr key={row.id} className="transition-colors duration-150 hover:bg-ink-850">
                      <td className="whitespace-nowrap py-2.5 pl-5 pr-3">
                        <Link
                          href={`/admin/afspraken/${row.id}`}
                          className="figures inline-flex min-h-11 items-center font-medium text-steel-50 underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-cyan-300 hover:decoration-cyan-400/50"
                        >
                          {formatShopDateTime(row.starts_at)}
                        </Link>
                      </td>
                      <td className="max-w-[18rem] px-3 py-2.5">
                        <span className="block truncate text-steel-100">{row.customer_name}</span>
                        <span className="block truncate text-steel-400">
                          {row.model_label}, {row.city}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={statusBadgeClass(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</span>
                      </td>
                      <td className={`figures whitespace-nowrap px-3 py-2.5 text-right ${pay.className}`}>{pay.text}</td>
                      <td className="figures whitespace-nowrap py-2.5 pl-3 pr-5 text-[0.8125rem] text-steel-400">
                        {row.reference}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {appointments.length >= 200 && (
            <p className="mt-4 text-sm text-steel-400">
              Je ziet de eerste 200 afspraken. Gebruik een filter om verder te zoeken.
            </p>
          )}
        </>
      )}
    </div>
  );
}

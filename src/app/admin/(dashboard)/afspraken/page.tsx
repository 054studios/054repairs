import Link from "next/link";
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

function paymentText(row: AppointmentRow): string {
  if (isInactive(row.status)) {
    return "—";
  }

  const open = outstandingCents(row.total_cents, row.paid_cents);
  return open > 0 ? `Openstaand ${formatEuro(open)}` : "Volledig betaald";
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
      <p className="rounded-2xl bg-white p-5 text-sm text-red-700 shadow-sm ring-1 ring-navy-100">
        De afspraken konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
      </p>
    );
  }

  const appointments: AppointmentRow[] = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Afspraken</h1>
        <p className="mt-1 text-sm text-navy-600">Nieuwste eerst. Tik op een afspraak om de details te zien.</p>
      </header>

      <nav aria-label="Filter op status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {STATUS_FILTERS.map((item) => {
          const active = item.key === filter.key;

          return (
            <Link
              key={item.key}
              href={item.key === "all" ? "/admin/afspraken" : `/admin/afspraken?status=${item.key}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-navy-900 text-white"
                  : "bg-white text-navy-700 ring-1 ring-navy-200 hover:ring-navy-400"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {appointments.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-navy-600 shadow-sm ring-1 ring-navy-100">
          Geen afspraken in deze lijst.
        </p>
      ) : (
        <>
          {/* Mobile: one card per appointment */}
          <ul className="space-y-3 md:hidden">
            {appointments.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/afspraken/${row.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 transition hover:ring-navy-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-950">{formatShopDateTime(row.starts_at)}</p>
                      <p className="mt-0.5 truncate text-sm text-navy-800">{row.customer_name}</p>
                    </div>
                    <span className={statusBadgeClass(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</span>
                  </div>
                  <p className="mt-2 truncate text-sm text-navy-600">
                    {row.model_label} · {row.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs text-navy-500">{row.reference}</span>
                    <span className="text-navy-800">{paymentText(row)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-100 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-xs uppercase tracking-wide text-navy-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tijd</th>
                  <th className="px-4 py-3 font-semibold">Referentie</th>
                  <th className="px-4 py-3 font-semibold">Klant</th>
                  <th className="px-4 py-3 font-semibold">Toestel</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Betaling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {appointments.map((row) => (
                  <tr key={row.id} className="transition hover:bg-navy-50/60">
                    <td className="px-4 py-3 text-navy-950">
                      <Link href={`/admin/afspraken/${row.id}`} className="font-medium hover:underline">
                        {formatShopDateTime(row.starts_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-navy-700">{row.reference}</td>
                    <td className="px-4 py-3 text-navy-900">{row.customer_name}</td>
                    <td className="px-4 py-3 text-navy-700">{row.model_label}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{paymentText(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {appointments.length >= 200 && (
            <p className="text-sm text-navy-600">Je ziet de eerste 200 afspraken. Gebruik een filter om verder te zoeken.</p>
          )}
        </>
      )}
    </div>
  );
}

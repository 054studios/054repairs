import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { addDays, amsterdamDay, formatDuration } from "@/lib/booking/format";
import { formatEuro } from "@/lib/money";
import { amsterdamLocalToIso, formatShopDateTime } from "@/lib/time";
import { outstandingCents, STATUS_LABEL, statusBadgeClass } from "./afspraken/shared";

export const metadata = {
  title: "Overzicht | 054repairs admin",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function StatCard({ label, value, hint, href }: { label: string; value: string; hint: string; href?: string }) {
  const body = (
    <div className="h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 md:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-950 md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-navy-500">{hint}</p>
    </div>
  );

  if (!href) {
    return body;
  }

  return (
    <Link href={href} className="block rounded-2xl transition hover:-translate-y-px hover:shadow-md">
      {body}
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  // Times are computed in Amsterdam time, the shop's time zone.
  const now = new Date();
  const nowIso = now.toISOString();
  const today = amsterdamDay(now);
  const tomorrow = addDays(today, 1);
  const monthPrefix = today.slice(0, 7);
  const [year, month] = today.split("-").map(Number);
  const nextMonthDay = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  const dayStart = amsterdamLocalToIso(`${today}T00:00`);
  const dayEnd = amsterdamLocalToIso(`${tomorrow}T00:00`);
  const monthStart = amsterdamLocalToIso(`${monthPrefix}-01T00:00`);
  const monthEnd = amsterdamLocalToIso(`${nextMonthDay}T00:00`);
  const weekEnd = new Date(now.getTime() + 7 * DAY_MS).toISOString();

  const [todayResult, weekResult, newResult, paidResult, openResult, upcomingResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(cancelled,expired)")
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(cancelled,expired)")
      .gte("starts_at", nowIso)
      .lt("starts_at", weekEnd),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("status", "paid")
      .gte("paid_at", monthStart)
      .lt("paid_at", monthEnd),
    supabase
      .from("appointments")
      .select("total_cents, paid_cents")
      .not("status", "in", "(cancelled,expired)"),
    supabase
      .from("appointments")
      .select("id, reference, starts_at, duration_minutes, customer_name, model_label, status")
      .not("status", "in", "(cancelled,expired)")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(10),
  ]);

  const failed = [todayResult, weekResult, newResult, paidResult, openResult, upcomingResult].some(
    (result) => result.error,
  );

  const paidThisMonth = (paidResult.data ?? []).reduce(
    (sum: number, payment: { amount_cents: number }) => sum + payment.amount_cents,
    0,
  );
  const openBalance = (openResult.data ?? []).reduce(
    (sum: number, appointment: { total_cents: number; paid_cents: number }) =>
      sum + outstandingCents(appointment.total_cents, appointment.paid_cents),
    0,
  );
  const upcoming: {
    id: string;
    reference: string;
    starts_at: string;
    duration_minutes: number;
    customer_name: string;
    model_label: string;
    status: string;
  }[] = upcomingResult.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Overzicht</h1>
        <p className="mt-1 text-sm text-navy-600">Afspraken, betalingen en wat nog open staat.</p>
      </header>

      {failed && (
        <p className="rounded-2xl bg-white p-4 text-sm text-red-700 shadow-sm ring-1 ring-navy-100">
          Een deel van het overzicht kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          label="Vandaag"
          value={String(todayResult.count ?? 0)}
          hint="afspraken"
          href="/admin/afspraken"
        />
        <StatCard
          label="Komende 7 dagen"
          value={String(weekResult.count ?? 0)}
          hint="afspraken"
          href="/admin/afspraken"
        />
        <StatCard
          label="Nog te bevestigen"
          value={String(newResult.count ?? 0)}
          hint="nieuwe afspraken"
          href="/admin/afspraken?status=new"
        />
        <StatCard
          label="Betaald deze maand"
          value={formatEuro(paidThisMonth)}
          hint="ontvangen bedragen"
        />
        <StatCard
          label="Openstaand"
          value={formatEuro(openBalance)}
          hint="nog te ontvangen"
        />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy-100 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-navy-950">Eerstvolgende afspraken</h2>
            <p className="mt-1 text-sm text-navy-600">De volgende tien afspraken vanaf nu.</p>
          </div>
          <Link href="/admin/afspraken" className="text-sm font-medium text-navy-800 underline underline-offset-4">
            Alle afspraken
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-5 text-sm text-navy-600">Geen komende afspraken.</p>
        ) : (
          <ul className="mt-5 divide-y divide-navy-100">
            {upcoming.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  href={`/admin/afspraken/${appointment.id}`}
                  className="flex flex-col gap-1.5 py-3 transition hover:bg-navy-50/60 md:flex-row md:items-center md:gap-6 md:px-2"
                >
                  <div className="flex items-center justify-between gap-3 md:w-56 md:shrink-0">
                    <span className="text-sm font-semibold text-navy-950">
                      {formatShopDateTime(appointment.starts_at)}
                    </span>
                    <span className={statusBadgeClass(appointment.status)}>
                      {STATUS_LABEL[appointment.status] ?? appointment.status}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-navy-900">{appointment.customer_name}</p>
                    <p className="truncate text-sm text-navy-600">
                      {appointment.model_label} · {formatDuration(appointment.duration_minutes)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-navy-500 md:shrink-0">{appointment.reference}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

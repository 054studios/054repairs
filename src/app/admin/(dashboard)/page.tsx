import Link from "next/link";
import { CalendarBlankIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { panelClass, textLinkClass } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { addDays, amsterdamDay, formatClock, formatDayLong, formatDuration } from "@/lib/booking/format";
import { formatEuro } from "@/lib/money";
import { amsterdamLocalToIso } from "@/lib/time";
import { outstandingCents, STATUS_LABEL, statusBadgeClass } from "./afspraken/shared";

export const metadata = {
  title: "Overzicht | 054repairs admin",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

type Upcoming = {
  id: string;
  reference: string;
  starts_at: string;
  duration_minutes: number;
  customer_name: string;
  model_label: string;
  status: string;
};

// Compact tile: label, the figure, one line of context. Tiles that lead somewhere are links.
function Tile({
  label,
  value,
  hint,
  href,
  attention = false,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  attention?: boolean;
}) {
  const inner = (
    <>
      <span className="flex items-center justify-between gap-2 text-sm text-steel-400">
        {label}
        {href && (
          <CaretRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-steel-500 transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5"
          />
        )}
      </span>
      <span className="figures mt-3 block font-display text-[1.25rem] font-semibold leading-none tracking-[-0.02em] text-steel-50 min-[400px]:text-[1.5rem] sm:text-[1.75rem] lg:text-[2rem]">
        {value}
      </span>
      <span className="mt-2 block text-[0.8125rem] leading-snug text-steel-400">{hint}</span>
    </>
  );

  const surface = `block rounded-panel bg-ink-900 p-3.5 shadow-panel ring-1 sm:p-5 ${
    attention ? "ring-cyan-400/40" : "ring-line"
  }`;

  if (!href) {
    return <div className={surface}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={`${surface} group transition-[background-color,transform] duration-150 ease-out-strong hover:bg-ink-850 active:scale-[0.98]`}
    >
      {inner}
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
  const upcoming: Upcoming[] = upcomingResult.data ?? [];
  const todayCount = todayResult.count ?? 0;
  const weekCount = weekResult.count ?? 0;
  const newCount = newResult.count ?? 0;

  // Group the next appointments per calendar day, so the list reads like a day planner.
  const days: { day: string; items: Upcoming[] }[] = [];
  for (const appointment of upcoming) {
    const day = amsterdamDay(new Date(appointment.starts_at));
    const last = days.at(-1);
    if (last && last.day === day) {
      last.items.push(appointment);
    } else {
      days.push({ day, items: [appointment] });
    }
  }

  const dayLabel = (day: string) => (day === today ? "Vandaag" : day === tomorrow ? "Morgen" : formatDayLong(day));

  return (
    <div>
      <PageHeader title="Overzicht" description={formatDayLong(today)} />

      {failed && (
        <Notice tone="bad" role="alert" className="mb-6">
          Een deel van het overzicht kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Tile
          label="Vandaag"
          value={String(todayCount)}
          hint={`${todayCount === 1 ? "afspraak" : "afspraken"}, ${weekCount} in de komende 7 dagen`}
          href="/admin/afspraken"
        />
        <Tile
          label="Nog te bevestigen"
          value={String(newCount)}
          hint={newCount > 0 ? "Nieuwe boekingen bekijken" : "Alles is bevestigd"}
          href="/admin/afspraken?status=new"
          attention={newCount > 0}
        />
        <Tile label="Betaald deze maand" value={formatEuro(paidThisMonth)} hint="Ontvangen bedragen" />
        <Tile label="Openstaand" value={formatEuro(openBalance)} hint="Nog te ontvangen" />
      </div>

      <section className={`${panelClass} mt-6 overflow-hidden lg:mt-8`}>
        <div className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-steel-50">Eerstvolgende afspraken</h2>
          <Link href="/admin/afspraken" className={`${textLinkClass} inline-flex min-h-11 shrink-0 items-center text-sm`}>
            Alle afspraken
          </Link>
        </div>

        {days.length === 0 ? (
          <div className="flex items-start gap-3 px-4 pb-6 pt-3 sm:px-6">
            <CalendarBlankIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-steel-500" />
            <p className="text-[0.95rem] text-steel-400">
              Geen komende afspraken. Nieuwe boekingen verschijnen hier zodra ze binnenkomen.
            </p>
          </div>
        ) : (
          <div className="pb-2">
            {days.map((group) => (
              <div key={group.day} className="mt-2">
                <h3 className="px-4 pb-1.5 pt-2 sm:px-6">
                  <span className="font-sans text-[0.8125rem] font-medium tracking-normal text-steel-400">
                    {dayLabel(group.day)}
                  </span>
                </h3>
                <ul className="divide-y divide-line border-t border-line">
                  {group.items.map((appointment) => (
                    <li key={appointment.id}>
                      <Link
                        href={`/admin/afspraken/${appointment.id}`}
                        className="grid min-h-16 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors duration-150 hover:bg-ink-850 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] sm:gap-x-5 sm:px-6"
                      >
                        <span>
                          <span className="figures block font-display text-base font-semibold text-steel-50">
                            {formatClock(appointment.starts_at)}
                          </span>
                          <span className="block text-xs text-steel-400">{formatDuration(appointment.duration_minutes)}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-steel-100">{appointment.customer_name}</span>
                          <span className="block truncate text-sm text-steel-400">{appointment.model_label}</span>
                        </span>
                        <span className="figures hidden text-xs text-steel-500 sm:block">{appointment.reference}</span>
                        <span className={statusBadgeClass(appointment.status)}>
                          {STATUS_LABEL[appointment.status] ?? appointment.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

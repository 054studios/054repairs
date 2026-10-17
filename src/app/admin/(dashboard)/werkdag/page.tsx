import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Card, inputClass } from "@/components/admin/fields";
import { OperationsNotice } from "@/components/admin/operations-notice";
import { buttonClass, textLinkClass } from "@/components/ui/styles";
import { estimatedMinutes } from "@/lib/operations";
import { amsterdamDay, formatClock } from "@/lib/booking/format";
import { amsterdamLocalToIso } from "@/lib/time";
import { STATUS_LABEL } from "../afspraken/shared";
export const metadata = { title: "Werkdag | 054repairs admin" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ dag?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const q = await searchParams;
  const day =
    q.dag &&
    /^\d{4}-\d{2}-\d{2}$/.test(q.dag) &&
    !Number.isNaN(Date.parse(q.dag))
      ? q.dag
      : amsterdamDay(new Date());
  const from = amsterdamLocalToIso(day + "T00:00"),
    to = amsterdamLocalToIso(day + "T23:59");
  const [ops, settings, appointments] = await Promise.all([
    supabase
      .from("operations_settings")
      .select("average_kmh,arrival_margin_minutes,route_planning")
      .eq("id", 1)
      .single(),
    supabase
      .from("settings")
      .select("start_lat,start_lng")
      .eq("id", 1)
      .single(),
    supabase
      .from("appointments")
      .select(
        "id,reference,status,customer_name,customer_phone,street,house_number,postcode,city,lat,lng,starts_at,ends_at,model_label,paid_cents,total_cents",
      )
      .gte("starts_at", from)
      .lte("starts_at", to)
      .not("status", "in", "(cancelled,expired)")
      .order("starts_at"),
  ]);
  const o = ops.data,
    s = settings.data,
    rows = appointments.data ?? [];
  return (
    <div>
      <PageHeader
        title="Je werkdag"
        description="Afspraken op volgorde, bereikbaarheid en de geschatte reistijd ertussen."
      />
      <form className="mb-5 flex flex-wrap items-end gap-3">
        <label>
          Datum
          <input
            className={inputClass}
            type="date"
            name="dag"
            defaultValue={day}
            required
          />
        </label>
        <button className={buttonClass("secondary")}>Bekijken</button>
      </form>
      {!o ? (
        <OperationsNotice />
      ) : (
        <p className="mb-5 text-sm text-steel-400">
          Reistijdcontrole {o.route_planning ? "aan" : "uit"} · {o.average_kmh}{" "}
          km/u met {o.arrival_margin_minutes} minuten marge. Schatting;
          controleer verkeer en parkeren.
        </p>
      )}
      {appointments.error ? (
        <p>De afspraken konden niet worden geladen.</p>
      ) : rows.length === 0 ? (
        <Card title="Geen afspraken op deze dag">
          <p>Je planning is vrij.</p>
        </Card>
      ) : (
        <ol className="space-y-4">
          {rows.map((a, i) => {
            const prev = rows[i - 1];
            const minutes = o
              ? estimatedMinutes(
                  prev?.lat ?? s?.start_lat ?? null,
                  prev?.lng ?? s?.start_lng ?? null,
                  a.lat,
                  a.lng,
                  o.average_kmh,
                  o.arrival_margin_minutes,
                )
              : null;
            const gap = prev
              ? (Date.parse(a.starts_at) - Date.parse(prev.ends_at)) / 60000
              : null;
            const address = [
              a.street + " " + a.house_number,
              a.postcode + " " + a.city,
            ].join(", ");
            return (
              <li key={a.id}>
                <p
                  className={
                    "mb-2 text-sm " +
                    (minutes !== null && gap !== null && minutes > gap
                      ? "text-warn"
                      : "text-steel-400")
                  }
                >
                  {minutes === null
                    ? "Reistijd onbekend"
                    : minutes +
                      " minuten reistijd vanaf " +
                      (prev ? "vorige afspraak" : "vertrekpunt")}
                  {minutes !== null && gap !== null && minutes > gap
                    ? " · Krap gepland"
                    : ""}
                </p>
                <Card
                  title={
                    formatClock(a.starts_at) +
                    " – " +
                    formatClock(a.ends_at) +
                    " · " +
                    a.customer_name
                  }
                  description={
                    a.model_label + " · " + (STATUS_LABEL[a.status] ?? a.status)
                  }
                >
                  <p>{address}</p>
                  <p className="mt-1 text-sm text-steel-400">
                    {a.paid_cents >= a.total_cents
                      ? "Betaald"
                      : "Er staat nog een bedrag open"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      className={textLinkClass}
                      href={"/admin/afspraken/" + a.id}
                    >
                      {a.reference}
                    </Link>
                    <a
                      className={textLinkClass}
                      href={"tel:" + a.customer_phone.replace(/[^+\d]/g, "")}
                    >
                      Bel klant
                    </a>
                    <a
                      className={textLinkClass}
                      href={
                        "https://www.google.com/maps/search/?api=1&query=" +
                        encodeURIComponent(address)
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Navigeren
                    </a>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

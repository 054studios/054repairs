import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Field, inputClass } from "@/components/admin/fields";
import { formatDuration, formatKm, formatPostcode } from "@/lib/booking/format";
import { requireAdmin } from "@/lib/auth";
import { centsToEuroInput, formatEuro } from "@/lib/money";
import { isMollieConfigured } from "@/lib/payments/mollie";
import { formatShopDateTime } from "@/lib/time";
import {
  cancelAppointment,
  createBalancePaymentLink,
  recordBalancePayment,
  updateAppointmentStatus,
} from "../actions";
import {
  ADMIN_STATUSES,
  isInactive,
  KIND_LABEL,
  mapsSearchHref,
  outstandingCents,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_RECORD_LABEL,
  PROVIDER_LABEL,
  STATUS_LABEL,
  statusBadgeClass,
  telHref,
} from "../shared";
import { ConfirmActionForm } from "./confirm-action-form";
import { MollieLinkForm } from "./mollie-link-form";

export const metadata = {
  title: "Afspraak | 054repairs admin",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const APPOINTMENT_COLUMNS =
  "id, reference, status, payment_status, payment_choice, balance_method, customer_name, customer_phone, customer_email, customer_note, street, house_number, postcode, city, travel_km, travel_fee_cents, model_label, items, duration_minutes, repair_total_cents, total_cents, deposit_cents, paid_cents, starts_at, ends_at, cancelled_at, cancel_reason";

type Item = {
  name?: string;
  qualityName?: string;
  priceCents?: number;
  durationMinutes?: number;
};

type PaymentRow = {
  id: string;
  kind: string;
  amount_cents: number;
  method: string | null;
  provider: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-navy-600">{label}</dt>
      <dd className="text-right font-medium text-navy-950">{children}</dd>
    </div>
  );
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  if (!UUID.test(id)) {
    notFound();
  }

  const [{ data: appointment, error }, { data: payments }, mollieReady] = await Promise.all([
    supabase.from("appointments").select(APPOINTMENT_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("payments")
      .select("id, kind, amount_cents, method, provider, status, paid_at, created_at")
      .eq("appointment_id", id)
      .order("created_at", { ascending: true }),
    isMollieConfigured(),
  ]);

  if (error) {
    return (
      <p className="rounded-2xl bg-white p-5 text-sm text-red-700 shadow-sm ring-1 ring-navy-100">
        De afspraak kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
      </p>
    );
  }

  if (!appointment) {
    notFound();
  }

  const items: Item[] = Array.isArray(appointment.items) ? appointment.items : [];
  const history: PaymentRow[] = payments ?? [];
  const inactive = isInactive(appointment.status);
  const outstanding = outstandingCents(appointment.total_cents, appointment.paid_cents);
  const fullyPaid = outstanding <= 0;
  const address = `${appointment.street} ${appointment.house_number}, ${formatPostcode(appointment.postcode)} ${appointment.city}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/afspraken" className="text-sm text-navy-600 hover:text-navy-950">
            ← Alle afspraken
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">
            <span className="font-mono">{appointment.reference}</span>
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {appointment.customer_name} · {appointment.model_label}
          </p>
        </div>
        <span className={statusBadgeClass(appointment.status)}>
          {STATUS_LABEL[appointment.status] ?? appointment.status}
        </span>
      </header>

      {appointment.cancelled_at && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
          Geannuleerd op {formatShopDateTime(appointment.cancelled_at)}
          {appointment.cancel_reason ? ` · ${appointment.cancel_reason}` : ""}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Klant">
          <dl className="divide-y divide-navy-100">
            <Detail label="Naam">{appointment.customer_name}</Detail>
            <Detail label="Telefoon">
              <a href={telHref(appointment.customer_phone)} className="text-navy-900 underline underline-offset-4">
                {appointment.customer_phone}
              </a>
            </Detail>
            <Detail label="E-mail">
              <a href={`mailto:${appointment.customer_email}`} className="break-all text-navy-900 underline underline-offset-4">
                {appointment.customer_email}
              </a>
            </Detail>
          </dl>
          {appointment.customer_note && (
            <div className="mt-4 rounded-xl bg-navy-50 p-3 text-sm text-navy-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">Opmerking van de klant</p>
              <p className="mt-1 whitespace-pre-line">{appointment.customer_note}</p>
            </div>
          )}
        </Card>

        <Card title="Adres en tijd">
          <dl className="divide-y divide-navy-100">
            <Detail label="Start">{formatShopDateTime(appointment.starts_at)}</Detail>
            <Detail label="Klaar">{formatShopDateTime(appointment.ends_at)}</Detail>
            <Detail label="Duur">{formatDuration(appointment.duration_minutes)}</Detail>
            <Detail label="Adres">
              <a
                href={mapsSearchHref(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-900 underline underline-offset-4"
              >
                {appointment.street} {appointment.house_number}
                <br />
                {formatPostcode(appointment.postcode)} {appointment.city}
              </a>
            </Detail>
            <Detail label="Afstand">{formatKm(Number(appointment.travel_km))}</Detail>
          </dl>
        </Card>
      </div>

      <Card title="Reparaties" description={appointment.model_label}>
        {items.length === 0 ? (
          <p className="text-sm text-navy-600">Geen reparaties vastgelegd.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-navy-600">
                <tr>
                  <th className="pb-2 font-semibold">Reparatie</th>
                  <th className="pb-2 font-semibold">Kwaliteit</th>
                  <th className="pb-2 font-semibold">Duur</th>
                  <th className="pb-2 text-right font-semibold">Prijs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2.5 text-navy-950">{item.name ?? "Reparatie"}</td>
                    <td className="py-2.5 text-navy-700">{item.qualityName ?? "—"}</td>
                    <td className="py-2.5 text-navy-700">
                      {typeof item.durationMinutes === "number" ? formatDuration(item.durationMinutes) : "—"}
                    </td>
                    <td className="py-2.5 text-right text-navy-950">
                      {typeof item.priceCents === "number" ? formatEuro(item.priceCents) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Bedragen" description={appointment.payment_choice === "full" ? "De klant betaalt alles vooraf." : "De klant betaalt een aanbetaling. De rest betaal je bij het terugbrengen."}>
          <dl className="divide-y divide-navy-100">
            <Detail label="Reparaties">{formatEuro(appointment.repair_total_cents)}</Detail>
            <Detail label="Voorrijkosten">{formatEuro(appointment.travel_fee_cents)}</Detail>
            <Detail label="Totaal">{formatEuro(appointment.total_cents)}</Detail>
            <Detail label="Aanbetaling bij boeken">{formatEuro(appointment.deposit_cents)}</Detail>
            <Detail label="Betaald">{formatEuro(appointment.paid_cents)}</Detail>
            <Detail label="Openstaand">
              <span className={fullyPaid ? "text-emerald-700" : "text-navy-950"}>
                {fullyPaid ? "Niets" : formatEuro(outstanding)}
              </span>
            </Detail>
            <Detail label="Betaalstatus">{PAYMENT_STATUS_LABEL[appointment.payment_status] ?? appointment.payment_status}</Detail>
          </dl>
        </Card>

        <Card title="Betalingen" description="Alle betalingen voor deze afspraak.">
          {history.length === 0 ? (
            <p className="text-sm text-navy-600">Nog geen betalingen.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {history.map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-navy-950">
                      {KIND_LABEL[payment.kind] ?? payment.kind} · {PROVIDER_LABEL[payment.provider] ?? payment.provider}
                    </p>
                    <p className="text-navy-600">
                      {formatShopDateTime(payment.paid_at ?? payment.created_at)} ·{" "}
                      {PAYMENT_STATUS_RECORD_LABEL[payment.status] ?? payment.status}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-navy-950">{formatEuro(payment.amount_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Betaling registreren" description="Pin of contant bij het terugbrengen. Je kunt niet meer invullen dan er openstaat.">
          {inactive ? (
            <p className="text-sm text-navy-600">Op een geannuleerde of verlopen afspraak registreer je geen betaling.</p>
          ) : fullyPaid ? (
            <p className="text-sm text-emerald-700">Deze afspraak is volledig betaald.</p>
          ) : (
            <ActionForm action={recordBalancePayment.bind(null, appointment.id)} submitLabel="Betaling registreren">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bedrag (€)" hint={`Openstaand: ${formatEuro(outstanding)}`}>
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    defaultValue={centsToEuroInput(outstanding)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Betaald met">
                  <select name="method" defaultValue="pin" className={inputClass}>
                    <option value="pin">Pin</option>
                    <option value="cash">Contant</option>
                  </select>
                </Field>
              </div>
            </ActionForm>
          )}

          {!inactive && !fullyPaid && (
            <div className="mt-6 border-t border-navy-100 pt-6">
              <h3 className="text-sm font-semibold text-navy-900">Betaallink (Mollie)</h3>
              <div className="mt-3">
                {mollieReady ? (
                  <MollieLinkForm action={createBalancePaymentLink.bind(null, appointment.id)} />
                ) : (
                  <p className="text-sm text-navy-600">Mollie is nog niet ingesteld</p>
                )}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Status">
            <ActionForm action={updateAppointmentStatus.bind(null, appointment.id)} submitLabel="Status opslaan">
              <Field label="Nieuwe status">
                <select name="status" defaultValue={appointment.status} className={inputClass}>
                  {appointment.status === "expired" && (
                    <option value="expired" disabled>
                      Verlopen
                    </option>
                  )}
                  {ADMIN_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </Field>
            </ActionForm>
          </Card>

          {!inactive && (
            <Card title="Annuleren" description="Het tijdslot komt dan weer vrij. Een terugbetaling regel je zelf.">
              <ConfirmActionForm
                action={cancelAppointment.bind(null, appointment.id)}
                label="Afspraak annuleren"
                question="Weet je zeker dat je deze afspraak wilt annuleren? Het tijdslot komt dan weer vrij."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

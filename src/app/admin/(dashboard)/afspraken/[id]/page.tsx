import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCardIcon, MapPinIcon, MoneyIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { ActionForm } from "@/components/admin/action-form";
import { AffixInput, Card, CardSection, Field, Select } from "@/components/admin/fields";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass, insetClass, labelClass, textLinkClass } from "@/components/ui/styles";
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
  paymentRecordBadgeClass,
  paymentStatusBadgeClass,
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

const PAYMENT_METHODS = [
  { value: "pin", label: "Pin", Icon: CreditCardIcon },
  { value: "cash", label: "Contant", Icon: MoneyIcon },
] as const;

function Detail({ label, strong = false, children }: { label: string; strong?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2.5 ${strong ? "border-t border-line-strong" : ""}`}>
      <dt className={`shrink-0 text-sm ${strong ? "font-medium text-steel-100" : "text-steel-400"}`}>{label}</dt>
      <dd className={`min-w-0 text-right text-[0.95rem] text-steel-50 ${strong ? "font-semibold" : "font-medium"}`}>
        {children}
      </dd>
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
      <div>
        <PageHeader title="Afspraak" back={{ href: "/admin/afspraken", label: "Alle afspraken" }} />
        <Notice tone="bad" role="alert">
          De afspraak kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      </div>
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
  const mapsHref = mapsSearchHref(address);

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/afspraken", label: "Alle afspraken" }}
        title={<span className="figures">{appointment.reference}</span>}
        description={`${appointment.customer_name}, ${appointment.model_label}, ${formatShopDateTime(appointment.starts_at)}`}
        aside={
          <span className={statusBadgeClass(appointment.status)}>
            {STATUS_LABEL[appointment.status] ?? appointment.status}
          </span>
        }
      >
        {/* On the road: call and navigate in one tap. The rail layout shows these in the client card. */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex xl:hidden">
          <a href={telHref(appointment.customer_phone)} className={buttonClass("secondary")}>
            <PhoneIcon aria-hidden="true" className="size-5" />
            Bel klant
          </a>
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
            <MapPinIcon aria-hidden="true" className="size-5" />
            Route
          </a>
        </div>
      </PageHeader>

      {appointment.cancelled_at && (
        <Notice tone="bad" title={`Geannuleerd op ${formatShopDateTime(appointment.cancelled_at)}`} className="mb-6">
          {appointment.cancel_reason || undefined}
        </Notice>
      )}

      {/*
        One column on a phone, in the order the work happens: actions first, then the details.
        From xl: details on the left, actions on the right. Rows "auto auto 1fr" let the cancel
        card sit right under the actions while the details run on down the left.
      */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:grid-rows-[auto_auto_1fr] xl:items-start xl:gap-6">
        <div className="space-y-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:space-y-6">
          <Card title="Status">
            <ActionForm
              action={updateAppointmentStatus.bind(null, appointment.id)}
              submitLabel="Opslaan"
              layout="inline"
            >
              <Field label="Nieuwe status">
                <Select name="status" defaultValue={appointment.status}>
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
                </Select>
              </Field>
            </ActionForm>
          </Card>

          <Card
            title="Betaling registreren"
            description="Pin of contant bij het terugbrengen. Je kunt niet meer invullen dan er openstaat."
          >
            {inactive ? (
              <p className="text-[0.95rem] text-steel-400">
                Op een geannuleerde of verlopen afspraak registreer je geen betaling.
              </p>
            ) : fullyPaid ? (
              <Notice tone="ok">Deze afspraak is volledig betaald.</Notice>
            ) : (
              <ActionForm
                action={recordBalancePayment.bind(null, appointment.id)}
                submitLabel="Betaling registreren"
                variant="secondary"
              >
                <div className="space-y-4">
                  <Field label="Bedrag" hint={`Openstaand: ${formatEuro(outstanding)}`}>
                    <AffixInput
                      name="amount"
                      prefix="€"
                      inputMode="decimal"
                      required
                      defaultValue={centsToEuroInput(outstanding)}
                    />
                  </Field>
                  <fieldset>
                    <legend className={labelClass}>Betaald met</legend>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(({ value, label, Icon }) => (
                        <label key={value} className="relative">
                          <input
                            type="radio"
                            name="method"
                            value={value}
                            defaultChecked={value === "pin"}
                            className="peer sr-only"
                          />
                          <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-ui bg-ink-850 text-[0.95rem] font-medium text-steel-300 ring-1 ring-line-strong transition-[background-color,box-shadow,color] duration-150 hover:bg-ink-800 peer-checked:bg-ink-800 peer-checked:text-steel-50 peer-checked:ring-2 peer-checked:ring-cyan-400 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400">
                            <Icon aria-hidden="true" className="size-5" />
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </ActionForm>
            )}

            {!inactive && !fullyPaid && (
              <CardSection title="Betaallink via Mollie">
                {mollieReady ? (
                  <MollieLinkForm action={createBalancePaymentLink.bind(null, appointment.id)} />
                ) : (
                  <p className="text-sm text-steel-400">
                    Mollie is nog niet ingesteld.{" "}
                    <Link href="/admin/instellingen" className={textLinkClass}>
                      Naar instellingen
                    </Link>
                  </p>
                )}
              </CardSection>
            )}
          </Card>
        </div>

        <div className="@container space-y-4 xl:col-start-1 xl:row-start-1 xl:space-y-6">
          <div className="grid gap-4 @2xl:grid-cols-2 xl:gap-6">
            <Card title="Klant">
              <dl className="-my-2.5 divide-y divide-line">
                <Detail label="Naam">{appointment.customer_name}</Detail>
                <Detail label="Telefoon">
                  <a href={telHref(appointment.customer_phone)} className={`${textLinkClass} figures`}>
                    {appointment.customer_phone}
                  </a>
                </Detail>
                <Detail label="E-mail">
                  <a href={`mailto:${appointment.customer_email}`} className={`${textLinkClass} break-all`}>
                    {appointment.customer_email}
                  </a>
                </Detail>
              </dl>
              {appointment.customer_note && (
                <div className={`${insetClass} mt-4 p-3`}>
                  <p className="text-sm font-medium text-steel-300">Opmerking van de klant</p>
                  <p className="mt-1 whitespace-pre-line text-[0.95rem] leading-relaxed text-steel-100">
                    {appointment.customer_note}
                  </p>
                </div>
              )}
            </Card>

            <Card title="Tijd en adres">
              <dl className="-my-2.5 divide-y divide-line">
                <Detail label="Start">
                  <span className="figures">{formatShopDateTime(appointment.starts_at)}</span>
                </Detail>
                <Detail label="Klaar">
                  <span className="figures">{formatShopDateTime(appointment.ends_at)}</span>
                </Detail>
                <Detail label="Duur">{formatDuration(appointment.duration_minutes)}</Detail>
                <Detail label="Adres">
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={textLinkClass}>
                    {appointment.street} {appointment.house_number}
                    <br />
                    {formatPostcode(appointment.postcode)} {appointment.city}
                  </a>
                </Detail>
                <Detail label="Afstand">
                  <span className="figures">{formatKm(Number(appointment.travel_km))}</span>
                </Detail>
              </dl>
            </Card>
          </div>
        </div>

        <div className="@container space-y-4 xl:col-start-1 xl:row-span-2 xl:row-start-2 xl:space-y-6">
          <Card title="Reparaties" description={appointment.model_label}>
            {items.length === 0 ? (
              <p className="text-[0.95rem] text-steel-400">Geen reparaties vastgelegd.</p>
            ) : (
              <ul className="-my-3 divide-y divide-line">
                {items.map((item, index) => {
                  const meta = [
                    item.qualityName,
                    typeof item.durationMinutes === "number" ? formatDuration(item.durationMinutes) : undefined,
                  ].filter(Boolean);

                  return (
                    <li key={index} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-steel-50">{item.name ?? "Reparatie"}</p>
                        {meta.length > 0 && <p className="text-sm text-steel-400">{meta.join(", ")}</p>}
                      </div>
                      <p className="figures shrink-0 font-medium text-steel-50">
                        {typeof item.priceCents === "number" ? formatEuro(item.priceCents) : "Onbekend"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className="grid gap-4 @2xl:grid-cols-2 xl:gap-6">
            <Card
              title="Bedragen"
              description={
                appointment.payment_choice === "full"
                  ? "De klant betaalt alles vooraf."
                  : "De klant betaalt een aanbetaling. De rest betaal je bij het terugbrengen."
              }
            >
              <dl className="-my-2.5 figures">
                <Detail label="Reparaties">{formatEuro(appointment.repair_total_cents)}</Detail>
                <Detail label="Voorrijkosten">{formatEuro(appointment.travel_fee_cents)}</Detail>
                <Detail label="Totaal" strong>
                  {formatEuro(appointment.total_cents)}
                </Detail>
                <Detail label="Aanbetaling bij boeken">{formatEuro(appointment.deposit_cents)}</Detail>
                <Detail label="Betaald">{formatEuro(appointment.paid_cents)}</Detail>
                <Detail label="Openstaand">
                  <span className={fullyPaid ? "text-ok" : undefined}>{fullyPaid ? "Niets" : formatEuro(outstanding)}</span>
                </Detail>
                <Detail label="Betaalstatus">
                  <span className={paymentStatusBadgeClass(appointment.payment_status)}>
                    {PAYMENT_STATUS_LABEL[appointment.payment_status] ?? appointment.payment_status}
                  </span>
                </Detail>
              </dl>
            </Card>

            <Card title="Betalingen" description="Alle betalingen voor deze afspraak.">
              {history.length === 0 ? (
                <p className="text-[0.95rem] text-steel-400">Nog geen betalingen.</p>
              ) : (
                <ul className="-my-3 divide-y divide-line">
                  {history.map((payment) => (
                    <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-steel-50">
                          {KIND_LABEL[payment.kind] ?? payment.kind} via {PROVIDER_LABEL[payment.provider] ?? payment.provider}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-steel-400">
                          <span className="figures">{formatShopDateTime(payment.paid_at ?? payment.created_at)}</span>
                          <span className={paymentRecordBadgeClass(payment.status)}>
                            {PAYMENT_STATUS_RECORD_LABEL[payment.status] ?? payment.status}
                          </span>
                        </p>
                      </div>
                      <span className="figures shrink-0 font-medium text-steel-50">{formatEuro(payment.amount_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {!inactive && (
          <div className="xl:col-start-2 xl:row-start-3">
            <Card title="Annuleren" description="Het tijdslot komt dan weer vrij. Een terugbetaling regel je zelf.">
              <ConfirmActionForm
                action={cancelAppointment.bind(null, appointment.id)}
                label="Annuleer afspraak"
                question="Weet je zeker dat je deze afspraak wilt annuleren? Het tijdslot komt dan weer vrij."
                confirmLabel="Ja, annuleer afspraak"
                backLabel="Niet annuleren"
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Card, Field, Select, inputClass } from "./fields";
import { ActionForm } from "./action-form";
import { CHECK_LABELS, CHECK_RESULTS, checksSchema } from "@/lib/operations";
import {
  saveReport,
  issueInvoice,
} from "@/app/admin/(dashboard)/bedrijfsvoering/actions";
import { Reschedule } from "@/components/booking/reschedule";
import { OperationsNotice } from "./operations-notice";
export async function AppointmentOperations({
  id,
  reference,
}: {
  id: string;
  reference: string;
}) {
  const { supabase } = await requireAdmin();
  const [settings, report, invoice, events, reservations] = await Promise.all([
    supabase.from("operations_settings").select("id").eq("id", 1).single(),
    supabase
      .from("repair_reports")
      .select("*")
      .eq("appointment_id", id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("number")
      .eq("appointment_id", id)
      .maybeSingle(),
    supabase
      .from("appointment_events")
      .select("id,kind,happened_at,details")
      .eq("appointment_id", id)
      .order("happened_at", { ascending: false })
      .limit(20),
    supabase
      .from("stock_reservations")
      .select("state")
      .eq("appointment_id", id),
  ]);
  if (settings.error) return <OperationsNotice />;
  const checks = checksSchema.safeParse(report.data?.checks);
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card
        title="Afspraak verzetten"
        description="Zelfde adres en reparatie, met behoud van de bestaande betalingen."
      >
        <Reschedule reference={reference} token="admin-session-only" />
      </Card>
      <Card
        title="Reparatierapport"
        description="Leg het uitgevoerde werk en de controles vast. Publiceren maakt het rapport beschikbaar via de privélink van de klant."
      >
        <ActionForm action={saveReport.bind(null, id)}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(CHECK_LABELS).map(([k, label]) => (
              <Field label={label} key={k}>
                <Select
                  name={k}
                  defaultValue={
                    checks.success
                      ? checks.data[k as keyof typeof CHECK_LABELS]
                      : "not_tested"
                  }
                >
                  {Object.entries(CHECK_RESULTS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Uitgevoerd werk en bijzonderheden">
              <textarea
                className={inputClass}
                name="work_notes"
                rows={5}
                maxLength={4000}
                defaultValue={report.data?.work_notes ?? ""}
              />
            </Field>
          </div>
          <label className="mt-3 flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="published"
              defaultChecked={report.data?.published ?? false}
            />
            Delen met klant
          </label>
        </ActionForm>
      </Card>
      <Card
        title="Factuur"
        description="Na afronding vastleggen met een uniek volgnummer. Uitgegeven facturen worden niet overschreven."
      >
        {invoice.data ? (
          <p>Factuur {invoice.data.number}</p>
        ) : (
          <ActionForm
            action={issueInvoice.bind(null, id)}
            submitLabel="Factuur definitief uitgeven"
          />
        )}
        {(invoice.data || report.data) && (
          <Link
            href={"/documenten/" + reference}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Documenten bekijken / opslaan als PDF
          </Link>
        )}
      </Card>
      <Card title="Onderdelen en historie">
        <p className="mb-4 text-sm text-steel-400">
          {reservations.data?.length
            ? reservations.data
                .map((r) =>
                  r.state === "held"
                    ? "Gereserveerd"
                    : r.state === "consumed"
                      ? "Verbruikt"
                      : "Vrijgegeven",
                )
                .join(" · ")
            : "Geen automatische onderdeelreserveringen voor deze afspraak."}
        </p>
        <ul className="space-y-3 text-sm">
          {events.data?.map((e) => (
            <li key={e.id}>
              <time>
                {new Date(e.happened_at).toLocaleString("nl-NL", {
                  timeZone: "Europe/Amsterdam",
                })}
              </time>{" "}
              · {e.kind}
              <br />
              <span className="text-steel-400">
                {String(e.details.van ?? "")} → {String(e.details.naar ?? "")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

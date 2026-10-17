import { createHash } from "node:crypto";
import { authorizedCron } from "@/lib/cron-auth";
import {
  createAdminClient,
  serverSecretsConfigured,
} from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { formatDateTime } from "@/lib/booking/format";
export const maxDuration = 60;
export async function GET(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (
    !authorizedCron(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  )
    return new Response(null, { status: 401, headers });
  if (process.env.REMINDERS_ENABLED !== "true")
    return Response.json({ enabled: false }, { headers });
  if (
    !serverSecretsConfigured() ||
    !process.env.RESEND_API_KEY ||
    !process.env.MAIL_FROM
  )
    return Response.json(
      { error: "Herinneringen zijn niet volledig ingesteld." },
      { status: 503, headers },
    );
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("claim_appointment_reminders");
    if (error) throw new Error("Herinneringen claimen mislukt.");
    const claims = (data ?? []) as {
      appointment_id: string;
      starts_at: string;
    }[];
    let sent = 0,
      failed = 0,
      skipped = 0;
    // Small batches bound provider concurrency and fit a 60-second invocation.
    for (let i = 0; i < claims.length; i += 5) {
      await Promise.all(
        claims.slice(i, i + 5).map(async (claim) => {
          const { data: appointment, error: readError } = await admin
            .from("appointments")
            .select(
              "reference,customer_email,starts_at,status,paid_cents,deposit_cents,hold_expires_at",
            )
            .eq("id", claim.appointment_id)
            .eq("starts_at", claim.starts_at)
            .maybeSingle();
          if (readError) {
            failed++;
            return;
          }
          if (
            !appointment ||
            !["new", "confirmed"].includes(appointment.status) ||
            Date.parse(appointment.starts_at) <= Date.now() ||
            (appointment.paid_cents < appointment.deposit_cents &&
              appointment.status !== "confirmed") ||
            (appointment.hold_expires_at &&
              Date.parse(appointment.hold_expires_at) <= Date.now())
          ) {
            skipped++;
            return;
          }
          const when = formatDateTime(appointment.starts_at);
          const text = `Je iPhone-reparatie bij 054repairs staat gepland op ${when}.\nReferentie: ${appointment.reference}.\n\nZorg dat je op het afgesproken adres bent. Maak vooraf een back-up.\nWil je je afspraak bekijken of annuleren? Gebruik de persoonlijke link uit je boekingsbevestiging.`;
          const key = createHash("sha256")
            .update(claim.appointment_id + claim.starts_at)
            .digest("hex");
          const result = await sendEmail({
            to: appointment.customer_email,
            subject: "Herinnering aan je iPhone-reparatie",
            text,
            html: text
              .split("\n")
              .map(
                (line) =>
                  `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
              )
              .join(""),
            idempotencyKey: `reminder-${key}`,
          });
          if (!result.sent) {
            failed++;
            console.error("Herinneringsmail niet verstuurd", result.reason);
            return;
          }
          const { error: saveError } = await admin
            .from("appointment_reminders")
            .update({ sent_at: new Date().toISOString() })
            .eq("appointment_id", claim.appointment_id)
            .eq("starts_at", claim.starts_at);
          if (saveError) {
            failed++;
            return;
          }
          sent++;
        }),
      );
    }
    console.info("Herinneringsronde", { sent, failed, skipped });
    return Response.json(
      { sent, failed, skipped },
      { status: failed ? 502 : 200, headers },
    );
  } catch {
    console.error("Herinneringsronde mislukt");
    return Response.json(
      { error: "Herinneringen tijdelijk niet beschikbaar." },
      { status: 503, headers },
    );
  }
}

import "server-only";

// Sends mail through the Resend HTTP API. Never throws: without a key the shop keeps working,
// and the caller gets a Dutch reason it can show or log.

export type SendEmailResult = { sent: true; id: string | null } | { sent: false; reason: string };

const RESEND_URL = "https://api.resend.com/emails";
const NOT_CONFIGURED = "E-mail is nog niet ingesteld";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { sent: false, reason: NOT_CONFIGURED };
  }

  const from = process.env.MAIL_FROM?.trim();

  if (!from) {
    return { sent: false, reason: "Het afzenderadres (MAIL_FROM) ontbreekt." };
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Resend weigerde de e-mail", response.status);
      return { sent: false, reason: "De e-mail kon niet worden verstuurd." };
    }

    const body: unknown = await response.json().catch(() => null);
    const id = body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : null;

    return { sent: true, id };
  } catch (cause) {
    console.error("E-mail versturen mislukt", cause);
    return { sent: false, reason: "De e-mail kon niet worden verstuurd." };
  }
}

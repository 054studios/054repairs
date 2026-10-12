import { ActionForm } from "@/components/admin/action-form";
import { Card, Field, inputClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, serverSecretsConfigured } from "@/lib/supabase/admin";
import { saveBusinessSettings, saveMollieKey, testMollieKey } from "./actions";

export const metadata = {
  title: "Instellingen | 054repairs admin",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("settings")
    .select("business_name, phone, email, mollie_mode")
    .eq("id", 1)
    .single();

  const secretsReady = serverSecretsConfigured();

  let keyHint: string | null = null;
  if (secretsReady) {
    const { data } = await createAdminClient()
      .from("payment_secrets")
      .select("mollie_api_key_hint, mollie_api_key_ciphertext")
      .eq("id", 1)
      .single();
    keyHint = data?.mollie_api_key_ciphertext ? (data.mollie_api_key_hint ?? "") : null;
  }

  if (!settings) {
    return <p className="text-navy-600">Instellingen konden niet worden geladen.</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Instellingen</h1>
        <p className="mt-1 text-sm text-navy-600">Bedrijfsgegevens en de betaalkoppeling.</p>
      </header>

      <Card title="Bedrijfsgegevens" description="Deze gegevens staan op de website en in e-mails aan klanten.">
        <ActionForm action={saveBusinessSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bedrijfsnaam">
              <input name="business_name" defaultValue={settings.business_name} required className={inputClass} />
            </Field>
            <Field label="Telefoonnummer">
              <input name="phone" type="tel" defaultValue={settings.phone ?? ""} className={inputClass} />
            </Field>
            <Field label="E-mailadres">
              <input name="email" type="email" defaultValue={settings.email ?? ""} className={inputClass} />
            </Field>
          </div>
        </ActionForm>
      </Card>

      <Card
        title="Mollie"
        description="Je API-key voor betalingen. De key wordt versleuteld opgeslagen en daarna nooit meer getoond."
      >
        {!secretsReady && (
          <div role="alert" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Het opslaan van de key kan pas als de serverinstellingen zijn ingevuld:{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> en <code>APP_ENCRYPTION_KEY</code>. Zie de README.
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-navy-600">Huidige key:</span>
          {keyHint ? (
            <span className="font-medium text-navy-950">
              ••••{keyHint} ({settings.mollie_mode === "live" ? "live" : "test"}-modus)
            </span>
          ) : (
            <span className="font-medium text-navy-950">Nog niet ingesteld</span>
          )}
        </div>

        <ActionForm action={saveMollieKey} submitLabel="Key opslaan">
          <Field label="Nieuwe API-key" hint="Begint met test_ (oefenen) of live_ (echte betalingen). Laat leeg om de huidige key te houden.">
            <input
              name="mollie_api_key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              disabled={!secretsReady}
              placeholder="test_…"
              className={inputClass}
            />
          </Field>
        </ActionForm>

        {keyHint && (
          <div className="mt-6 border-t border-navy-100 pt-6">
            <ActionForm action={testMollieKey} submitLabel="Verbinding testen" />
          </div>
        )}
      </Card>
    </div>
  );
}

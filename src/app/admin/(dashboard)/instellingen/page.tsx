import { ActionForm } from "@/components/admin/action-form";
import { Card, CardSection, Field, inputClass } from "@/components/admin/fields";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { chipClass } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, serverSecretsConfigured } from "@/lib/supabase/admin";
import { saveBusinessSettings, saveMollieKey, testMollieKey } from "./actions";

export const metadata = {
  title: "Instellingen | 054repairs admin",
  robots: { index: false, follow: false },
};

const codeClass = "rounded-[6px] bg-ink-800 px-1.5 py-0.5 font-mono text-[0.8125rem] text-steel-50";

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
    return (
      <div>
        <PageHeader title="Instellingen" />
        <Notice tone="bad" role="alert">
          Instellingen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </Notice>
      </div>
    );
  }

  const live = settings.mollie_mode === "live";

  return (
    <div>
      <PageHeader title="Instellingen" description="Bedrijfsgegevens en de betaalkoppeling." />

      <Notice tone="info" className="mb-6">De website staat {process.env.SITE_INDEXING_ENABLED === "true" ? "ingesteld voor indexering na publicatie" : "in teststand voor zoekmachines"}. E-mail is {process.env.RESEND_API_KEY && process.env.MAIL_FROM ? "geconfigureerd" : "nog niet geconfigureerd"}; herinneringen staan {process.env.REMINDERS_ENABLED === "true" ? "aan" : "uit"}. Controleer vóór de lancering ook prijzen, bedrijfsgegevens en voorwaarden.</Notice>
      <div className="grid max-w-3xl gap-4 lg:gap-6">
        <Card title="Bedrijfsgegevens" description="Deze gegevens staan op de website en in e-mails aan klanten.">
          <ActionForm action={saveBusinessSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bedrijfsnaam" className="sm:col-span-2">
                <input name="business_name" defaultValue={settings.business_name} required className={inputClass} />
              </Field>
              <Field label="Telefoonnummer">
                <input name="phone" type="tel" defaultValue={settings.phone ?? ""} className={`${inputClass} figures`} />
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
          aside={
            keyHint ? (
              <span className={chipClass("ok")}>{live ? "Ingesteld, live" : "Ingesteld, test"}</span>
            ) : (
              <span className={chipClass("neutral")}>Niet ingesteld</span>
            )
          }
        >
          {!secretsReady && (
            <Notice tone="warn" role="alert" title="Serverinstellingen ontbreken" className="mb-5">
              Het opslaan van de key kan pas als <code className={codeClass}>SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
              <code className={codeClass}>APP_ENCRYPTION_KEY</code> zijn ingevuld. Zie de README.
            </Notice>
          )}

          <dl className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <dt className="text-steel-400">Huidige key</dt>
            <dd className="font-medium text-steel-50">
              {keyHint ? (
                <>
                  Eindigt op <span className="font-mono">{keyHint}</span>,{" "}
                  {live ? "live-modus (echte betalingen)" : "testmodus"}
                </>
              ) : (
                "Nog niet ingesteld"
              )}
            </dd>
          </dl>

          <ActionForm action={saveMollieKey} submitLabel="Key opslaan" variant="secondary">
            <Field
              label="Nieuwe API-key"
              hint="Begint met test_ (oefenen) of live_ (echte betalingen). Laat leeg om de huidige key te houden."
            >
              <input
                name="mollie_api_key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                disabled={!secretsReady}
                placeholder="test_"
                className={`${inputClass} font-mono`}
              />
            </Field>
          </ActionForm>

          {keyHint && (
            <CardSection title="Verbinding">
              <p className="mb-4 text-sm text-steel-400">Controleer of Mollie de opgeslagen key accepteert.</p>
              <ActionForm action={testMollieKey} submitLabel="Verbinding testen" variant="secondary" />
            </CardSection>
          )}
        </Card>
      </div>
    </div>
  );
}

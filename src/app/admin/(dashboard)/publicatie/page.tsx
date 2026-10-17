import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Card, Field, inputClass } from "@/components/admin/fields";
import { ActionForm } from "@/components/admin/action-form";
import { OperationsNotice } from "@/components/admin/operations-notice";
import {
  savePhoto,
  deletePhoto,
  togglePhoto,
} from "../bedrijfsvoering/actions";
export const metadata = { title: "Foto's en reviews | 054repairs admin" };
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("site_photos")
    .select("*")
    .order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader
        title="Foto’s en reviews"
        description="Laat je echte werk zien. De reviewlink stel je in bij Bedrijfsvoering."
      />
      {error ? (
        <OperationsNotice />
      ) : (
        <div className="space-y-5">
          <Card
            title="Eigen foto toevoegen"
            description="Gebruik een directe https-link naar een foto die je zelf host. Gebruik geen klantgegevens of herkenbare personen zonder toestemming."
          >
            <ActionForm action={savePhoto}>
              <div className="space-y-4">
                <Field label="Fotolink">
                  <input
                    className={inputClass}
                    name="image_url"
                    type="url"
                    required
                    maxLength={1500}
                  />
                </Field>
                <Field label="Beschrijving voor schermlezers">
                  <input
                    className={inputClass}
                    name="alt"
                    minLength={5}
                    maxLength={200}
                    required
                  />
                </Field>
                <Field label="Bijschrift">
                  <input
                    className={inputClass}
                    name="caption"
                    maxLength={300}
                  />
                </Field>
                <label className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" name="consent" />
                  Ik heb het recht en de benodigde toestemming om deze foto te
                  publiceren
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" name="published" />
                  Tonen op de website
                </label>
              </div>
            </ActionForm>
          </Card>
          {data?.map((p) => (
            <Card
              key={p.id}
              title={p.alt}
              description={p.published ? "Zichtbaar op de website" : "Concept"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.alt}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="mb-4 aspect-video w-full max-w-md rounded-ui object-cover"
              />
              <p className="mb-4 text-steel-400">{p.caption}</p>
              <div className="flex flex-wrap gap-4">
                {p.consent_confirmed && (
                  <ActionForm
                    action={togglePhoto.bind(null, p.id, !p.published)}
                    submitLabel={p.published ? "Verbergen" : "Publiceren"}
                    variant="secondary"
                  />
                )}
                <ActionForm
                  action={deletePhoto.bind(null, p.id)}
                  submitLabel="Verwijderen"
                  variant="secondary"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";

export const metadata = {
  title: "Overzicht | 054repairs admin",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Overzicht</h1>
      <p className="mt-2 text-navy-600">
        Het dashboard wordt in de volgende fase gevuld met afspraken en omzet.
      </p>
    </section>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { documentsSchema } from "@/lib/operations";
import { DocumentView } from "@/components/booking/document-view";
export const metadata = {
  title: "Reparatiedocumenten | 054repairs",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page(p: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  return (
    <Suspense fallback={<p>Documenten laden…</p>}>
      <View {...p} />
    </Suspense>
  );
}
async function View({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await connection();
  const { reference } = await params,
    { t } = await searchParams;
  if (
    !/^054-[A-F0-9]{8}$/.test(reference) ||
    (t !== undefined &&
      (typeof t !== "string" || t.length < 16 || t.length > 200))
  )
    notFound();
  const db = t ? await createClient() : (await requireAdmin()).supabase;
  const { data, error } = await db.rpc("booking_documents", {
    p_reference: reference,
    p_token: t ?? "",
  });
  const parsed = documentsSchema.safeParse(data);
  if (error || !parsed.success || (!parsed.data.report && !parsed.data.invoice))
    notFound();
  return <DocumentView d={parsed.data} />;
}

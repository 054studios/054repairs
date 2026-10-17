import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { OperationsNotice } from "./operations-notice";
import { textLinkClass } from "@/components/ui/styles";
export async function OperationsSummary() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("stock_items")
    .select("on_hand,reserved,minimum");
  if (error)
    return (
      <div className="mb-6">
        <OperationsNotice />
      </div>
    );
  const low = (data ?? []).filter(
    (r) => r.on_hand - r.reserved <= r.minimum,
  ).length;
  return (
    <aside
      className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-panel bg-ink-900 px-4 py-3 ring-1 ring-line"
      aria-label="Dagelijks beheer"
    >
      <Link
        href="/admin/werkdag"
        className={textLinkClass + " inline-flex min-h-11 items-center"}
      >
        Open je werkdag
      </Link>
      <Link
        href="/admin/voorraad"
        className={textLinkClass + " inline-flex min-h-11 items-center"}
      >
        {low > 0 ? low + " voorraadregels bijbestellen" : "Voorraad bekijken"}
      </Link>
      <Link
        href="/admin/publicatie"
        className={textLinkClass + " inline-flex min-h-11 items-center"}
      >
        Foto’s beheren
      </Link>
    </aside>
  );
}

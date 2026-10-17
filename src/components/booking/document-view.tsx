import type { z } from "zod";
import { documentsSchema, CHECK_LABELS, CHECK_RESULTS } from "@/lib/operations";
import { formatEuro } from "@/lib/money";
import { formatShopDateTime } from "@/lib/time";
import { PrintButton } from "./print-button";
export function DocumentView({ d }: { d: z.infer<typeof documentsSchema> }) {
  const i = d.invoice,
    s = i?.snapshot;
  return (
    <main className="document-page mx-auto min-h-dvh max-w-4xl bg-white p-5 text-slate-900 sm:p-12">
      <div className="document-controls mb-10">
        <PrintButton />
        <p className="mt-3 text-sm">
          Kies in het afdrukvenster ‘Opslaan als PDF’. Houd deze documenten
          privé.
        </p>
      </div>
      {s && i && (
        <article className="invoice">
          <header className="mb-8 flex flex-wrap justify-between gap-6">
            <div>
              <p className="text-2xl font-bold">{s.legalName}</p>
              <p className="whitespace-pre-line">{s.businessAddress}</p>
              <p>
                KvK {s.kvk} · Btw {s.vatNumber}
              </p>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Factuur</h1>
              <p>{i.number}</p>
              <p>{formatShopDateTime(i.issuedAt)}</p>
            </div>
          </header>
          <p className="font-semibold">{s.customerName}</p>
          <p>{s.customerAddress}</p>
          <p className="my-6">
            {s.reference} · {s.model}
            <br />
            Uitgevoerd: {formatShopDateTime(s.serviceDate)}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3">Omschrijving</th>
                  <th>Aantal</th>
                  <th className="text-right">Excl. btw</th>
                  <th className="text-right">Btw</th>
                  <th className="text-right">Incl. btw</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...s.items.map((r) => ({
                    name: r.name + " · " + r.qualityName,
                    cents: r.priceCents,
                  })),
                  ...(s.travelCents > 0
                    ? [{ name: "Voorrijkosten", cents: s.travelCents }]
                    : []),
                ].map((r, n) => (
                  <tr key={n} className="border-b border-slate-200">
                    <td className="py-3 pr-3">{r.name}</td>
                    <td>1</td>
                    <td className="whitespace-nowrap text-right">
                      {formatEuro(
                        Math.round(r.cents / (1 + s.vatPercent / 100)),
                      )}
                    </td>
                    <td className="text-right">{s.vatPercent}%</td>
                    <td className="whitespace-nowrap text-right">
                      {formatEuro(r.cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto mt-6 max-w-xs space-y-2">
            <div className="flex justify-between gap-8">
              <dt>Exclusief btw</dt>
              <dd>{formatEuro(s.netCents)}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>Btw {s.vatPercent}%</dt>
              <dd>{formatEuro(s.vatCents)}</dd>
            </div>
            <div className="flex justify-between gap-8 border-t border-slate-400 pt-3 font-bold">
              <dt>Totaal</dt>
              <dd>{formatEuro(s.totalCents)}</dd>
            </div>
          </dl>
          {s.taxNote && <p className="mt-6">{s.taxNote}</p>}
          <p className="mt-8 text-sm">
            De actuele betaalstatus vind je via je privé-afspraaklink.
          </p>
        </article>
      )}
      {d.report && (
        <article className={"repair-report " + (s ? "mt-16" : "")}>
          <h2 className="text-2xl font-bold">Reparatierapport</h2>
          <p className="mt-2">
            {d.reference} · {d.model} · {d.customerName}
          </p>
          <p className="text-sm">
            Bijgewerkt: {formatShopDateTime(d.report.updatedAt)}
          </p>
          <h3 className="mb-3 mt-8 font-bold">Uitgevoerd werk</h3>
          <p className="whitespace-pre-line">{d.report.notes}</p>
          <h3 className="mb-3 mt-8 font-bold">Functiecontrole</h3>
          <dl>
            {Object.entries(d.report.checks).map(([k, v]) => (
              <div
                className="flex justify-between gap-6 border-b border-slate-200 py-3"
                key={k}
              >
                <dt>{CHECK_LABELS[k as keyof typeof CHECK_LABELS]}</dt>
                <dd>{CHECK_RESULTS[v]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm">
            De resultaten betreffen de controles die hierboven zijn vastgelegd.
          </p>
        </article>
      )}
    </main>
  );
}

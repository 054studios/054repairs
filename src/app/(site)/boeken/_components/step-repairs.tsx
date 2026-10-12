import { cardClass } from "@/lib/booking/styles";
import { formatDuration } from "@/lib/booking/format";
import { formatEuro } from "@/lib/money";
import type { RepairOption, RepairQuality, RepairType } from "@/lib/booking/types";
import { StepHeading } from "./step-heading";

export function StepRepairs({
  repairTypes,
  options,
  qualities,
  selections,
  totalCents,
  durationMinutes,
  onToggle,
  onQuality,
}: {
  repairTypes: RepairType[];
  options: RepairOption[];
  qualities: RepairQuality[];
  selections: Record<string, string>;
  totalCents: number;
  durationMinutes: number;
  onToggle: (repairTypeId: string) => void;
  onQuality: (repairTypeId: string, qualityId: string) => void;
}) {
  const qualityRank = new Map(qualities.map((quality, index) => [quality.id, index]));
  const qualityName = new Map(qualities.map((quality) => [quality.id, quality.name]));
  const qualityDescription = new Map(qualities.map((quality) => [quality.id, quality.description]));

  return (
    <>
      <StepHeading title="Wat moet er gebeuren?" text="Je kunt meerdere reparaties kiezen. Kies daarna de kwaliteit." />

      {repairTypes.length === 0 ? (
        <p className={`${cardClass} text-base text-navy-700`}>
          Voor dit model zijn nog geen reparaties beschikbaar. Kies een ander model of neem contact met ons op.
        </p>
      ) : (
        <div className="space-y-3">
          {repairTypes.map((repair) => {
            const choices = options
              .filter((option) => option.repairTypeId === repair.id)
              .sort((a, b) => (qualityRank.get(a.qualityId) ?? 0) - (qualityRank.get(b.qualityId) ?? 0));
            const selected = selections[repair.id];
            const fromCents = Math.min(...choices.map((choice) => choice.priceCents));

            return (
              <div
                key={repair.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-100 focus-within:ring-2 focus-within:ring-navy-600"
              >
                <label className="flex cursor-pointer gap-4 p-4">
                  <input
                    type="checkbox"
                    checked={selected !== undefined}
                    onChange={() => onToggle(repair.id)}
                    className="peer sr-only"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-navy-950">{repair.name}</span>
                    {repair.description && (
                      <span className="mt-1 block text-sm text-navy-600">{repair.description}</span>
                    )}
                    <span className="mt-2 block text-sm text-navy-700">
                      Vanaf {formatEuro(fromCents)} · {formatDuration(repair.durationMinutes)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ring-2 transition ${
                      selected !== undefined ? "bg-navy-900 ring-navy-900" : "ring-navy-300"
                    }`}
                  >
                    {selected !== undefined && <span className="size-2.5 rounded-sm bg-white" />}
                  </span>
                </label>

                {selected !== undefined && (
                  <fieldset className="border-t border-navy-100 px-4 pb-4 pt-3">
                    <legend className="text-sm font-medium text-navy-900">Kwaliteit</legend>
                    <div className="mt-2 grid gap-2">
                      {choices.map((choice) => (
                        <label key={choice.qualityId} className="cursor-pointer">
                          <input
                            type="radio"
                            name={`quality-${repair.id}`}
                            value={choice.qualityId}
                            checked={selected === choice.qualityId}
                            onChange={() => onQuality(repair.id, choice.qualityId)}
                            className="peer sr-only"
                          />
                          <span className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ring-1 ring-navy-200 transition peer-checked:bg-navy-50 peer-checked:ring-2 peer-checked:ring-navy-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy-600">
                            <span className="min-w-0">
                              <span className="block font-medium text-navy-950">{qualityName.get(choice.qualityId)}</span>
                              {qualityDescription.get(choice.qualityId) && (
                                <span className="block text-xs text-navy-600">
                                  {qualityDescription.get(choice.qualityId)}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-semibold text-navy-950">{formatEuro(choice.priceCents)}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            );
          })}
        </div>
      )}

      {durationMinutes > 0 && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-navy-900 px-5 py-4 text-white">
          <div>
            <p className="text-sm text-navy-100">Totaal reparatie</p>
            <p className="text-xl font-semibold">{formatEuro(totalCents)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-navy-100">Reparatietijd</p>
            <p className="font-semibold">{formatDuration(durationMinutes)}</p>
          </div>
        </div>
      )}
    </>
  );
}

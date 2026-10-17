import { RepairHelper } from "./repair-helper";
import { CheckIcon, ClockIcon } from "@phosphor-icons/react";
import { formatDuration } from "@/lib/booking/format";
import { buttonClass, stepPanelClass } from "@/lib/booking/styles";
import type {
  RepairOption,
  RepairQuality,
  RepairType,
} from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
import { StepHeading } from "./step-heading";

export function StepRepairs({
  modelName,
  repairTypes,
  options,
  qualities,
  selections,
  onToggle,
  onQuality,
  onChangeModel,
}: {
  modelName: string;
  repairTypes: RepairType[];
  options: RepairOption[];
  qualities: RepairQuality[];
  selections: Record<string, string>;
  onToggle: (repairTypeId: string) => void;
  onQuality: (repairTypeId: string, qualityId: string) => void;
  onChangeModel: () => void;
}) {
  const qualityRank = new Map(
    qualities.map((quality, index) => [quality.id, index]),
  );
  const qualityById = new Map(
    qualities.map((quality) => [quality.id, quality]),
  );

  return (
    <>
      <StepHeading
        title="Wat moet er gemaakt worden?"
        text={`Prijzen voor je ${modelName}. Kies een of meer reparaties en daarna de kwaliteit.`}
      />

      <RepairHelper
        repairs={repairTypes}
        onChoose={(id) => {
          if (!selections[id]) onToggle(id);
        }}
      />
      {repairTypes.length === 0 ? (
        <div className={stepPanelClass}>
          <p className="font-medium text-steel-100">
            Voor de {modelName} kun je nog geen reparatie online boeken.
          </p>
          <p className="mt-1 text-[0.9375rem] text-steel-400">
            De reparatie of het benodigde onderdeel is mogelijk niet
            beschikbaar. Kies een ander model, of neem contact met ons op.
          </p>
          <button
            type="button"
            onClick={onChangeModel}
            className={`${buttonClass("secondary", "md")} mt-4`}
          >
            Kies een ander model
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {repairTypes.map((repair) => {
            const choices = options
              .filter((option) => option.repairTypeId === repair.id)
              .sort(
                (a, b) =>
                  (qualityRank.get(a.qualityId) ?? 0) -
                  (qualityRank.get(b.qualityId) ?? 0),
              );
            const selectedId = selections[repair.id];
            const current = selectedId
              ? choices.find((choice) => choice.qualityId === selectedId)
              : undefined;
            const isOn = current !== undefined;
            const fromCents = Math.min(
              ...choices.map((choice) => choice.priceCents),
            );
            const duration = current?.durationMinutes ?? repair.durationMinutes;
            const groupId = `quality-${repair.id}`;
            const currentQuality = current
              ? qualityById.get(current.qualityId)
              : undefined;

            return (
              <li
                key={repair.id}
                className={`rounded-panel shadow-panel transition-[box-shadow,background-color] duration-150 ${
                  isOn
                    ? "bg-ink-850 ring-2 ring-cyan-400"
                    : "bg-ink-900 ring-1 ring-line-strong"
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3.5 p-4 sm:p-5">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => onToggle(repair.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400 ${
                      isOn
                        ? "bg-cyan-400 text-cyan-ink"
                        : "bg-ink-950 ring-2 ring-inset ring-ink-600"
                    }`}
                  >
                    {isOn && <CheckIcon size={16} weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-steel-50">
                        {repair.name}
                      </span>
                      <span
                        key={
                          current
                            ? `${current.qualityId}-${current.priceCents}`
                            : "from"
                        }
                        className={`figures shrink-0 font-semibold ${isOn ? "figure-swap text-steel-50" : "text-steel-300"}`}
                      >
                        {isOn
                          ? formatEuro(current.priceCents)
                          : `vanaf ${formatEuro(fromCents)}`}
                      </span>
                    </span>
                    {repair.description && (
                      <span className="mt-1 block text-sm leading-relaxed text-steel-400">
                        {repair.description}
                      </span>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-steel-400">
                      <ClockIcon size={16} aria-hidden="true" />
                      <span className="figures">
                        {formatDuration(duration)}
                      </span>
                    </span>
                  </span>
                </label>

                {isOn && choices.length > 1 && (
                  <div className="border-t border-line px-4 pb-4 pt-3.5 transition-[opacity,translate] duration-200 ease-out-strong motion-safe:starting:-translate-y-1 starting:opacity-0 sm:px-5 sm:pb-5">
                    <p
                      id={`${groupId}-label`}
                      className="text-sm font-medium text-steel-300"
                    >
                      Kwaliteit
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby={`${groupId}-label`}
                      className="mt-2 grid auto-cols-fr grid-flow-col gap-1 rounded-ui bg-ink-950 p-1 ring-1 ring-line"
                    >
                      {choices.map((choice) => {
                        const checked = selectedId === choice.qualityId;

                        return (
                          <label
                            key={choice.qualityId}
                            className="block cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={groupId}
                              value={choice.qualityId}
                              checked={checked}
                              onChange={() =>
                                onQuality(repair.id, choice.qualityId)
                              }
                              className="peer sr-only"
                            />
                            <span className="flex min-h-12 flex-col items-center justify-center rounded-[7px] px-2 py-1.5 text-center transition-[background-color,box-shadow] duration-150 hover:bg-ink-800 peer-checked:bg-ink-700 peer-checked:shadow-raised peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-cyan-400">
                              <span
                                className={`text-sm font-medium ${checked ? "text-steel-50" : "text-steel-300"}`}
                              >
                                {qualityById.get(choice.qualityId)?.name ??
                                  "Kwaliteit"}
                              </span>
                              <span
                                className={`figures text-xs ${checked ? "text-cyan-300" : "text-steel-400"}`}
                              >
                                {formatEuro(choice.priceCents)}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {currentQuality?.description && (
                      <p className="mt-2.5 text-sm leading-relaxed text-steel-400">
                        {currentQuality.description}
                      </p>
                    )}
                  </div>
                )}

                {isOn && choices.length === 1 && currentQuality && (
                  <p className="border-t border-line px-4 py-3 text-sm text-steel-400 sm:px-5">
                    Kwaliteit:{" "}
                    <span className="text-steel-100">
                      {currentQuality.name}
                    </span>
                    {currentQuality.description
                      ? `. ${currentQuality.description}`
                      : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

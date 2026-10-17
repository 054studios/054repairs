"use client";
import { useState } from "react";
import type { RepairType } from "@/lib/booking/types";
import { buttonClass } from "@/components/ui/styles";
const symptoms = [
  { label: "Scherm kapot of geen beeld", match: /scherm/i },
  { label: "Batterij snel leeg", match: /batterij|accu/i },
  { label: "Laadt niet op", match: /laadpoort/i },
  { label: "Ik weet het niet zeker", match: /diagnos/i },
];
export function RepairHelper({
  repairs,
  onChoose,
}: {
  repairs: RepairType[];
  onChoose: (id: string) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const suggested =
    choice === null
      ? undefined
      : (repairs.find((r) => symptoms[choice].match.test(r.name)) ??
        repairs.find((r) => /diagnos/i.test(r.name)));
  return (
    <details className="mb-5 rounded-panel border border-line bg-ink-900 p-4">
      <summary className="min-h-11 cursor-pointer font-semibold text-steel-100">
        Hulp nodig bij je keuze?
      </summary>
      <div className="mt-4">
        <p className="mb-3 text-sm text-steel-400">
          Wat merk je aan je toestel?
        </p>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={buttonClass(
                choice === i ? "primary" : "secondary",
                "sm",
              )}
              aria-pressed={choice === i}
              onClick={() => setChoice(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {choice !== null && (
          <div className="mt-4" role="status">
            {suggested ? (
              <>
                <p className="text-steel-200">
                  Mogelijke keuze: {suggested.name}.
                </p>
                <p className="mt-1 text-sm text-steel-400">
                  Dit is een keuzehulp. Vergelijkbare klachten kunnen
                  verschillende oorzaken hebben. Kies bij twijfel een diagnose
                  of neem contact op.
                </p>
                <button
                  type="button"
                  className={buttonClass("secondary", "sm") + " mt-3"}
                  onClick={() => onChoose(suggested.id)}
                >
                  Deze reparatie kiezen
                </button>
              </>
            ) : (
              <p>
                Deze reparatie is voor jouw model momenteel niet online
                beschikbaar. Neem contact op voor advies.
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

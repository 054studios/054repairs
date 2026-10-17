"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getRescheduleSlots,
  reschedule,
} from "@/app/(site)/boeking/reschedule-actions";
import { formatClock, amsterdamDay, addDays } from "@/lib/booking/format";
import { buttonClass } from "@/components/ui/styles";
import { inputClass } from "@/components/admin/fields";
export function Reschedule({
  reference,
  token,
}: {
  reference: string;
  token: string;
}) {
  const router = useRouter(),
    [day, setDay] = useState(""),
    [slots, setSlots] = useState<string[]>([]),
    [slot, setSlot] = useState(""),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  function load(value: string) {
    setDay(value);
    setSlot("");
    setSlots([]);
    setMessage("");
    if (!value) return;
    start(async () => {
      const r = await getRescheduleSlots(reference, token, value);
      if (r.ok) {
        setSlots(r.slots);
        if (!r.slots.length)
          setMessage(
            "Geen beschikbare tijden. Kies een andere dag of neem contact op.",
          );
      } else setMessage(r.message);
    });
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-steel-400">
        Kies een nieuwe tijd voor hetzelfde adres en dezelfde reparatie.
        Bedragen en betalingen blijven behouden. Verzetten kan vóór de
        ingestelde termijn; standaard 24 uur van tevoren. Een open
        betaalreservering kun je niet verzetten.
      </p>
      <label className="block">
        Nieuwe datum
        <input
          className={inputClass}
          type="date"
          value={day}
          min={amsterdamDay(new Date())}
          max={addDays(amsterdamDay(new Date()), 59)}
          disabled={pending}
          onChange={(e) => load(e.target.value)}
        />
      </label>
      {pending && <p role="status">Beschikbaarheid controleren…</p>}
      {slots.length > 0 && (
        <label className="block">
          Tijd
          <select
            className={inputClass}
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={pending}
          >
            <option value="">Kies een tijd</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {formatClock(s)}
              </option>
            ))}
          </select>
        </label>
      )}
      {message && (
        <p role="status" className="text-sm text-steel-300">
          {message}
        </p>
      )}
      <button
        type="button"
        className={buttonClass("secondary")}
        disabled={!slot || pending}
        onClick={() => {
          start(async () => {
            const r = await reschedule(reference, token, slot);
            setMessage(r.message);
            if (r.ok) {
              setSlot("");
              setSlots([]);
              router.refresh();
            }
          });
        }}
      >
        Afspraak verzetten
      </button>
    </div>
  );
}

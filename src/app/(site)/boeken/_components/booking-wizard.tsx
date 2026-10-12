"use client";

import { MotionConfig, motion } from "motion/react";
import { useState, useTransition } from "react";
import { depositCentsFor } from "@/lib/booking/pricing";
import { WIZARD_STEPS } from "@/lib/booking/routing";
import { customerSchema, type BookingPayload } from "@/lib/booking/schema";
import { primaryButton } from "@/lib/booking/styles";
import type {
  AddressSuggestion,
  BookingCatalog,
  DayAvailability,
  PaymentChoice,
  RepairOption,
  TravelQuote,
} from "@/lib/booking/types";
import {
  calculateTravel,
  createBookingAction,
  getAvailableDays,
  getModelRepairOptions,
  getSlots,
} from "../actions";
import { StepAddress } from "./step-address";
import { StepDetails } from "./step-details";
import { StepDevice } from "./step-device";
import { StepRepairs } from "./step-repairs";
import { StepReview, type ReviewLine } from "./step-review";
import { StepTime } from "./step-time";

type Customer = { name: string; phone: string; email: string; note: string };
type CustomerField = keyof Customer;

type WizardState = {
  step: number;
  brandId: string | null;
  modelId: string | null;
  options: RepairOption[];
  optionsFor: string | null;
  selections: Record<string, string>;
  address: AddressSuggestion | null;
  travel: TravelQuote | null;
  days: DayAvailability[];
  daysFor: number | null;
  day: string | null;
  slots: string[];
  startsAt: string | null;
  customer: Customer;
  paymentChoice: PaymentChoice;
};

// Choices that depend on the repair duration. Cleared whenever the duration changes.
const SLOT_RESET: Partial<WizardState> = { day: null, slots: [], startsAt: null };

const LAST_STEP = WIZARD_STEPS.length - 1;

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Partial<Record<CustomerField, string>> {
  const errors: Partial<Record<CustomerField, string>> = {};

  for (const issue of issues) {
    const key = String(issue.path[0]) as CustomerField;

    if (errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }

  return errors;
}

export function BookingWizard({ catalog }: { catalog: BookingCatalog }) {
  const { brands, models, repairTypes, qualities, settings, mollieReady } = catalog;

  const [state, setState] = useState<WizardState>(() => ({
    step: 0,
    brandId: brands.length === 1 ? brands[0].id : null,
    modelId: null,
    options: [],
    optionsFor: null,
    selections: {},
    address: null,
    travel: null,
    days: [],
    daysFor: null,
    day: null,
    slots: [],
    startsAt: null,
    customer: { name: "", phone: "", email: "", note: "" },
    paymentChoice: "deposit",
  }));
  const [error, setError] = useState<string | null>(null);
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<CustomerField, string>>>({});
  const [pending, startTransition] = useTransition();

  const { step } = state;
  const optionsNow = state.modelId !== null && state.optionsFor === state.modelId ? state.options : [];
  const offeredRepairs = repairTypes.filter((repair) => optionsNow.some((option) => option.repairTypeId === repair.id));
  const qualityRank = new Map(qualities.map((quality, index) => [quality.id, index]));

  const chosen: RepairOption[] = offeredRepairs.flatMap((repair) => {
    const qualityId = state.selections[repair.id];
    const option = qualityId
      ? optionsNow.find((item) => item.repairTypeId === repair.id && item.qualityId === qualityId)
      : undefined;
    return option ? [option] : [];
  });

  const repairTotalCents = chosen.reduce((sum, option) => sum + option.priceCents, 0);
  const durationMinutes = chosen.reduce((sum, option) => sum + option.durationMinutes, 0);
  const feeCents = state.travel?.feeCents ?? 0;
  const totalCents = repairTotalCents + feeCents;
  const paymentChoice: PaymentChoice = settings.allowFullPrepay ? state.paymentChoice : "deposit";
  const depositCents = depositCentsFor(totalCents, settings, paymentChoice);

  const repairNames = new Map(repairTypes.map((repair) => [repair.id, repair.name]));
  const qualityNames = new Map(qualities.map((quality) => [quality.id, quality.name]));
  const reviewLines: ReviewLine[] = chosen.map((option) => ({
    key: `${option.repairTypeId}-${option.qualityId}`,
    name: repairNames.get(option.repairTypeId) ?? "Reparatie",
    quality: qualityNames.get(option.qualityId) ?? "",
    priceCents: option.priceCents,
    durationMinutes: option.durationMinutes,
  }));

  const canContinue = [
    state.modelId !== null,
    chosen.length > 0,
    state.address !== null && state.travel !== null && state.travel.withinArea,
    state.startsAt !== null,
    true,
    true,
  ][step];

  function update(changes: Partial<WizardState>) {
    setState((previous) => ({ ...previous, ...changes }));
  }

  function chooseBrand(brandId: string) {
    if (brandId === state.brandId) {
      return;
    }

    setError(null);
    update({ brandId, modelId: null, selections: {}, ...SLOT_RESET });
  }

  function chooseModel(modelId: string) {
    if (modelId === state.modelId) {
      return;
    }

    setError(null);
    update({ modelId, selections: {}, ...SLOT_RESET });
  }

  function toggleRepair(repairTypeId: string) {
    const selections = { ...state.selections };

    if (selections[repairTypeId]) {
      delete selections[repairTypeId];
    } else {
      const first = optionsNow
        .filter((option) => option.repairTypeId === repairTypeId)
        .sort((a, b) => (qualityRank.get(a.qualityId) ?? 0) - (qualityRank.get(b.qualityId) ?? 0))[0];

      if (!first) {
        return;
      }

      selections[repairTypeId] = first.qualityId;
    }

    setError(null);
    update({ selections, ...SLOT_RESET });
  }

  function chooseQuality(repairTypeId: string, qualityId: string) {
    setError(null);
    update({ selections: { ...state.selections, [repairTypeId]: qualityId }, ...SLOT_RESET });
  }

  function pickAddress(address: AddressSuggestion) {
    setError(null);
    update({ address, travel: null });

    startTransition(async () => {
      const result = await calculateTravel(address.lat, address.lng);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const quote = result.quote;
      setState((previous) => (previous.address === address ? { ...previous, travel: quote } : previous));
    });
  }

  function resetAddress() {
    setError(null);
    update({ address: null, travel: null });
  }

  function loadDays(duration: number, nextStep: number) {
    startTransition(async () => {
      const result = await getAvailableDays(duration);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const days = result.days;
      setState((previous) => ({ ...previous, days, daysFor: duration, step: nextStep }));
    });
  }

  function pickDay(day: string) {
    setError(null);
    update({ day, slots: [], startsAt: null });
    const duration = durationMinutes;

    startTransition(async () => {
      const result = await getSlots(day, duration);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const slots = result.slots;
      setState((previous) => (previous.day === day ? { ...previous, slots } : previous));
    });
  }

  function pickTime(startsAt: string) {
    setError(null);
    update({ startsAt });
  }

  function updateCustomer(field: CustomerField, value: string) {
    setState((previous) => ({ ...previous, customer: { ...previous.customer, [field]: value } }));
    setCustomerErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function goTo(target: number) {
    setError(null);
    update({ step: target });
  }

  function goNext() {
    setError(null);

    if (step === 0) {
      const modelId = state.modelId;

      if (!modelId) {
        return;
      }

      if (state.optionsFor === modelId) {
        goTo(1);
        return;
      }

      startTransition(async () => {
        const result = await getModelRepairOptions(modelId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        const options = result.options;
        setState((previous) => ({ ...previous, options, optionsFor: modelId, step: 1 }));
      });
      return;
    }

    if (step === 1) {
      if (chosen.length > 0) {
        goTo(2);
      }
      return;
    }

    if (step === 2) {
      if (!state.address || !state.travel?.withinArea) {
        return;
      }

      if (state.daysFor === durationMinutes) {
        goTo(3);
      } else {
        loadDays(durationMinutes, 3);
      }
      return;
    }

    if (step === 3) {
      if (state.startsAt) {
        goTo(4);
      }
      return;
    }

    if (step === 4) {
      const check = customerSchema.safeParse(state.customer);

      if (!check.success) {
        setCustomerErrors(toFieldErrors(check.error.issues));
        return;
      }

      setCustomerErrors({});
      goTo(5);
    }
  }

  function goBack() {
    setError(null);
    update({ step: Math.max(0, step - 1) });
  }

  function submit() {
    const { modelId, address, travel, startsAt, customer } = state;

    if (!modelId || !address || !travel || !startsAt || chosen.length === 0) {
      return;
    }

    setError(null);

    const payload: BookingPayload = {
      modelId,
      items: chosen.map((option) => ({ repairTypeId: option.repairTypeId, qualityId: option.qualityId })),
      address: {
        street: address.street,
        houseNumber: address.houseNumber,
        postcode: address.postcode,
        city: address.city,
        lat: address.lat,
        lng: address.lng,
      },
      startsAt,
      customer,
      paymentChoice,
    };

    startTransition(async () => {
      const result = await createBookingAction(payload);

      if (result.ok) {
        return;
      }

      setError(result.message);

      if (result.code === "slot_taken") {
        setState((previous) => ({ ...previous, day: null, slots: [], startsAt: null, daysFor: null }));
        loadDays(durationMinutes, 3);
      }
    });
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepDevice
            brands={brands}
            models={models}
            brandId={state.brandId}
            modelId={state.modelId}
            onBrand={chooseBrand}
            onModel={chooseModel}
          />
        );
      case 1:
        return (
          <StepRepairs
            repairTypes={offeredRepairs}
            options={optionsNow}
            qualities={qualities}
            selections={state.selections}
            totalCents={repairTotalCents}
            durationMinutes={durationMinutes}
            onToggle={toggleRepair}
            onQuality={chooseQuality}
          />
        );
      case 2:
        return (
          <StepAddress
            address={state.address}
            travel={state.travel}
            busy={pending}
            onPick={pickAddress}
            onReset={resetAddress}
          />
        );
      case 3:
        return (
          <StepTime
            settings={settings}
            durationMinutes={durationMinutes}
            days={state.days}
            day={state.day}
            slots={state.slots}
            startsAt={state.startsAt}
            busy={pending}
            onPickDay={pickDay}
            onPickTime={pickTime}
          />
        );
      case 4:
        return <StepDetails customer={state.customer} errors={customerErrors} onChange={updateCustomer} />;
      default:
        return (
          <StepReview
            settings={settings}
            modelName={models.find((model) => model.id === state.modelId)?.name ?? ""}
            lines={reviewLines}
            address={state.address}
            day={state.day}
            startsAt={state.startsAt}
            durationMinutes={durationMinutes}
            repairTotalCents={repairTotalCents}
            feeCents={feeCents}
            totalCents={totalCents}
            depositCents={depositCents}
            paymentChoice={paymentChoice}
            mollieReady={mollieReady}
            customer={state.customer}
            onPaymentChoice={(choice) => update({ paymentChoice: choice })}
            onEdit={goTo}
          />
        );
    }
  }

  const nextLabel = step === LAST_STEP ? (mollieReady ? "Naar betalen" : "Afspraak boeken") : "Volgende";

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4 text-sm text-navy-600">
            <span>
              Stap {step + 1} van {WIZARD_STEPS.length}
            </span>
            <span className="font-medium text-navy-900">{WIZARD_STEPS[step]}</span>
          </div>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {WIZARD_STEPS.map((label, index) => (
              <span
                key={label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? "bg-navy-900" : "bg-navy-200"}`}
              />
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {renderStep()}
        </motion.div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={pending}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3.5 text-base font-semibold text-navy-900 ring-1 ring-navy-200 transition hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:opacity-50"
            >
              Terug
            </button>
          )}
          <div className="flex-1">
            <button
              type="button"
              onClick={step === LAST_STEP ? submit : goNext}
              disabled={!canContinue || pending}
              className={primaryButton}
            >
              {pending ? "Even geduld…" : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

"use client";

import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { trackBookingStep } from "@/lib/funnel-client";
import { RouteProgress } from "@/components/ui/route";
import { formatDuration } from "@/lib/booking/format";
import { depositCentsFor } from "@/lib/booking/pricing";
import { WIZARD_STEPS } from "@/lib/booking/routing";
import { customerSchema, type BookingPayload } from "@/lib/booking/schema";
import { buttonClass } from "@/lib/booking/styles";
import type {
  AddressSuggestion,
  BookingCatalog,
  DayAvailability,
  PaymentChoice,
  RepairOption,
  TravelQuote,
} from "@/lib/booking/types";
import { formatEuro } from "@/lib/money";
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

// Start state from the home price check (/boeken?model=&repair=&quality=), already checked on the server.
// options is null when the model is valid but its prices could not be loaded.
export type WizardPreset = {
  modelId: string;
  options: RepairOption[] | null;
  selections: Record<string, string>;
};

type WizardState = {
  step: number;
  // 1 = forward, -1 = back. Steers the step transition.
  direction: 1 | -1;
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
  // The day the slots belong to. Differs from day while loading or after a failed load.
  slotsFor: string | null;
  startsAt: string | null;
  customer: Customer;
  paymentChoice: PaymentChoice;
};

// Choices that depend on the repair duration. Cleared whenever the duration changes.
const SLOT_RESET: Partial<WizardState> = {
  day: null,
  slots: [],
  slotsFor: null,
  startsAt: null,
};

const LAST_STEP = WIZARD_STEPS.length - 1;

// Step transition: enter from the travel direction, leave faster to the other side.
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SHIFT_PX = 16;

function stepVariants(reduced: boolean): Variants {
  // Full transform strings keep the animation on the compositor (WAAPI), unlike the x shorthand.
  const shift = (px: number) => (reduced ? "none" : `translateX(${px}px)`);

  return {
    enter: (direction: number) => ({
      opacity: 0,
      transform: shift(direction * SHIFT_PX),
    }),
    center: {
      opacity: 1,
      transform: "none",
      transition: { duration: 0.22, ease: EASE_OUT },
    },
    exit: (direction: number) => ({
      opacity: 0,
      transform: shift(direction * -SHIFT_PX),
      transition: { duration: 0.15, ease: EASE_OUT },
    }),
  };
}

function moveTo(previous: WizardState, target: number): WizardState {
  return {
    ...previous,
    step: target,
    direction: target >= previous.step ? 1 : -1,
  };
}

function toFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Partial<Record<CustomerField, string>> {
  const errors: Partial<Record<CustomerField, string>> = {};

  for (const issue of issues) {
    const key = String(issue.path[0]) as CustomerField;

    if (errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }

  return errors;
}

const CUSTOMER_ORDER: CustomerField[] = ["name", "phone", "email", "note"];

export function BookingWizard({
  catalog,
  preset = null,
}: {
  catalog: BookingCatalog;
  preset?: WizardPreset | null;
}) {
  const { brands, models, repairTypes, qualities, settings, mollieReady } =
    catalog;
  const reduceMotion = useReducedMotion() ?? false;

  const [state, setState] = useState<WizardState>(() => {
    const presetModel = preset
      ? models.find((model) => model.id === preset.modelId)
      : undefined;
    const presetOptions =
      presetModel && preset?.options ? preset.options : null;

    return {
      step: presetOptions ? 1 : 0,
      direction: 1,
      brandId: presetModel
        ? presetModel.brandId
        : brands.length === 1
          ? brands[0].id
          : null,
      modelId: presetModel ? presetModel.id : null,
      options: presetOptions ?? [],
      optionsFor: presetOptions && presetModel ? presetModel.id : null,
      selections: presetOptions && preset ? preset.selections : {},
      address: null,
      travel: null,
      days: [],
      daysFor: null,
      day: null,
      slots: [],
      slotsFor: null,
      startsAt: null,
      customer: { name: "", phone: "", email: "", note: "" },
      paymentChoice: "deposit",
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [customerErrors, setCustomerErrors] = useState<
    Partial<Record<CustomerField, string>>
  >({});
  const [travelFailed, setTravelFailed] = useState(false);
  // Navigation (Volgende, booking) and background data (travel fee, times) load separately,
  // so the main button only shows a busy label for its own work.
  const [navPending, startNav] = useTransition();
  const [dataPending, startData] = useTransition();
  const pending = navPending || dataPending;

  const topRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  // Set by user navigation, so the first render never steals focus.
  const navigated = useRef(false);

  const { step } = state;
  const [website, setWebsite] = useState("");
  const seenSteps = useRef(new Set<number>());
  useEffect(() => {
    if (!seenSteps.current.has(step)) {
      seenSteps.current.add(step);
      trackBookingStep(step);
    }
  }, [step]);
  const optionsNow =
    state.modelId !== null && state.optionsFor === state.modelId
      ? state.options
      : [];
  const offeredRepairs = repairTypes.filter((repair) =>
    optionsNow.some((option) => option.repairTypeId === repair.id),
  );
  const qualityRank = new Map(
    qualities.map((quality, index) => [quality.id, index]),
  );

  const chosen: RepairOption[] = offeredRepairs.flatMap((repair) => {
    const qualityId = state.selections[repair.id];
    const option = qualityId
      ? optionsNow.find(
          (item) =>
            item.repairTypeId === repair.id && item.qualityId === qualityId,
        )
      : undefined;
    return option ? [option] : [];
  });

  const repairTotalCents = chosen.reduce(
    (sum, option) => sum + option.priceCents,
    0,
  );
  const durationMinutes = chosen.reduce(
    (sum, option) => sum + option.durationMinutes,
    0,
  );
  const feeCents = state.travel?.feeCents ?? 0;
  const totalCents = repairTotalCents + feeCents;
  const paymentChoice: PaymentChoice = settings.allowFullPrepay
    ? state.paymentChoice
    : "deposit";
  const depositCents = depositCentsFor(totalCents, settings, paymentChoice);
  const modelName =
    models.find((model) => model.id === state.modelId)?.name ?? "";

  const repairNames = new Map(
    repairTypes.map((repair) => [repair.id, repair.name]),
  );
  const qualityNames = new Map(
    qualities.map((quality) => [quality.id, quality.name]),
  );
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
        .sort(
          (a, b) =>
            (qualityRank.get(a.qualityId) ?? 0) -
            (qualityRank.get(b.qualityId) ?? 0),
        )[0];

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
    update({
      selections: { ...state.selections, [repairTypeId]: qualityId },
      ...SLOT_RESET,
    });
  }

  function pickAddress(address: AddressSuggestion) {
    setError(null);
    setTravelFailed(false);
    update({ address, travel: null, daysFor: null, ...SLOT_RESET });

    startData(async () => {
      const result = await calculateTravel(address.lat, address.lng);

      if (!result.ok) {
        setError(result.message);
        setTravelFailed(true);
        return;
      }

      const quote = result.quote;
      setState((previous) =>
        previous.address === address
          ? { ...previous, travel: quote }
          : previous,
      );
    });
  }

  function resetAddress() {
    setError(null);
    setTravelFailed(false);
    update({ address: null, travel: null, daysFor: null, ...SLOT_RESET });
  }

  function loadDays(duration: number, nextStep: number) {
    startNav(async () => {
      const result = await getAvailableDays(
        duration,
        state.address ?? undefined,
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const days = result.days;
      setState((previous) => ({
        ...moveTo(previous, nextStep),
        days,
        daysFor: duration,
      }));
    });
  }

  function pickDay(day: string) {
    setError(null);
    update({ day, slots: [], slotsFor: null, startsAt: null });
    const duration = durationMinutes;

    startData(async () => {
      const result = await getSlots(day, duration, state.address ?? undefined);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const slots = result.slots;
      setState((previous) =>
        previous.day === day ? { ...previous, slots, slotsFor: day } : previous,
      );
    });
  }

  function pickTime(startsAt: string) {
    setError(null);
    update({ startsAt });
  }

  function updateCustomer(field: CustomerField, value: string) {
    setState((previous) => ({
      ...previous,
      customer: { ...previous.customer, [field]: value },
    }));
    setCustomerErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  // Inline check when leaving a field. Empty required fields wait for Volgende, so nobody is scolded early.
  function validateField(field: CustomerField) {
    const value = state.customer[field];

    if (value.trim() === "") {
      return;
    }

    const check = customerSchema.shape[field].safeParse(value);
    setCustomerErrors((previous) => ({
      ...previous,
      [field]: check.success ? undefined : check.error.issues[0]?.message,
    }));
  }

  function goTo(target: number) {
    setError(null);
    navigated.current = true;
    setState((previous) => moveTo(previous, target));
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

      navigated.current = true;
      startNav(async () => {
        const result = await getModelRepairOptions(modelId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        const options = result.options;
        setState((previous) => ({
          ...moveTo(previous, 1),
          options,
          optionsFor: modelId,
        }));
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
        navigated.current = true;
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
        const errors = toFieldErrors(check.error.issues);
        setCustomerErrors(errors);
        // Take the visitor straight to the first field that needs attention.
        const first = CUSTOMER_ORDER.find(
          (field) => errors[field] !== undefined,
        );
        if (first) {
          document.getElementById(first)?.focus();
        }
        return;
      }

      setCustomerErrors({});
      goTo(5);
    }
  }

  function goBack() {
    goTo(Math.max(0, step - 1));
  }

  function submit() {
    const { modelId, address, travel, startsAt, customer } = state;

    if (!modelId || !address || !travel || !startsAt || chosen.length === 0) {
      return;
    }

    setError(null);

    const payload: BookingPayload = {
      website,
      modelId,
      items: chosen.map((option) => ({
        repairTypeId: option.repairTypeId,
        qualityId: option.qualityId,
      })),
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

    startNav(async () => {
      const result = await createBookingAction(payload);

      if (result.ok) {
        return;
      }

      setError(result.message);

      if (result.code === "slot_taken") {
        navigated.current = true;
        setState((previous) => ({
          ...previous,
          day: null,
          slots: [],
          slotsFor: null,
          startsAt: null,
          daysFor: null,
        }));
        loadDays(durationMinutes, 3);
      }
    });
  }

  // After the old step has left: bring the top of the wizard back into view when it scrolled away.
  function handleExitComplete() {
    const top = topRef.current;

    if (top && top.getBoundingClientRect().top < 80) {
      top.scrollIntoView({ block: "start" });
    }
  }

  // After the new step has arrived: move focus to its heading.
  function handleEntered(definition: unknown) {
    if (definition !== "center" || !navigated.current) {
      return;
    }

    navigated.current = false;
    stepRef.current
      ?.querySelector<HTMLElement>("[data-step-heading]")
      ?.focus({ preventScroll: true });
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
            phone={settings.phone}
            onBrand={chooseBrand}
            onModel={chooseModel}
          />
        );
      case 1:
        return (
          <StepRepairs
            modelName={modelName}
            repairTypes={offeredRepairs}
            options={optionsNow}
            qualities={qualities}
            selections={state.selections}
            onToggle={toggleRepair}
            onQuality={chooseQuality}
            onChangeModel={() => goTo(0)}
          />
        );
      case 2:
        return (
          <StepAddress
            address={state.address}
            travel={state.travel}
            busy={dataPending}
            travelFailed={travelFailed}
            onPick={pickAddress}
            onRetry={() => state.address && pickAddress(state.address)}
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
            slotsLoaded={state.day !== null && state.slotsFor === state.day}
            startsAt={state.startsAt}
            busy={dataPending}
            onPickDay={pickDay}
            onPickTime={pickTime}
          />
        );
      case 4:
        return (
          <StepDetails
            customer={state.customer}
            errors={customerErrors}
            onChange={updateCustomer}
            onBlur={validateField}
          />
        );
      default:
        return (
          <StepReview
            settings={settings}
            modelName={modelName}
            lines={reviewLines}
            address={state.address}
            travel={state.travel}
            day={state.day}
            startsAt={state.startsAt}
            durationMinutes={durationMinutes}
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

  // What the action bar shows next to the button: the running amount, or what is still missing.
  const summary: { label: string; cents: number; detail?: string } | null =
    (() => {
      if (step === 1 && chosen.length > 0) {
        return {
          label: "Reparatie",
          cents: repairTotalCents,
          detail: formatDuration(durationMinutes),
        };
      }
      if (step === 2 && chosen.length > 0) {
        return state.travel
          ? { label: "Totaal", cents: totalCents, detail: "met voorrijkosten" }
          : {
              label: "Reparatie",
              cents: repairTotalCents,
              detail: "zonder voorrijkosten",
            };
      }
      if (step === 3 || step === 4) {
        return {
          label: "Totaal",
          cents: totalCents,
          detail: formatDuration(durationMinutes),
        };
      }
      if (step === LAST_STEP) {
        return mollieReady
          ? {
              label: "Nu betalen",
              cents: depositCents,
              detail: `van ${formatEuro(totalCents)}`,
            }
          : { label: "Totaal", cents: totalCents };
      }
      return null;
    })();

  // Shown in place of the amount while the step's question is still open.
  const missing =
    step === 0 ? "Kies je model" : step === 1 ? "Kies een reparatie" : null;

  const nextLabel =
    step === LAST_STEP
      ? mollieReady
        ? "Bevestig en betaal"
        : "Bevestig boeking"
      : "Volgende";
  const busyLabel =
    step === 0
      ? "Prijzen laden"
      : step === 2
        ? "Agenda laden"
        : step === LAST_STEP
          ? "Boeking vastleggen"
          : "Even geduld";

  return (
    <MotionConfig reducedMotion="user">
      <div ref={topRef} className="flex flex-col">
        <div aria-hidden="true" className="absolute -left-[10000px] top-0">
          <label htmlFor="booking-website">
            Website
            <input
              id="booking-website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="mb-7 flex items-center gap-4 sm:mb-9">
          <div className="min-w-0 flex-1">
            <RouteProgress
              current={step + 1}
              total={WIZARD_STEPS.length}
              label={`Stap ${step + 1} van ${WIZARD_STEPS.length}: ${WIZARD_STEPS[step]}`}
            />
          </div>
          <p
            className="figures shrink-0 text-sm text-steel-400"
            aria-hidden="true"
          >
            {step + 1} van {WIZARD_STEPS.length}
          </p>
        </div>

        <AnimatePresence
          mode="wait"
          initial={false}
          custom={state.direction}
          onExitComplete={handleExitComplete}
        >
          <motion.div
            key={step}
            ref={stepRef}
            // On phones the sticky action bar covers the bottom of the screen. Leave room above it,
            // so a field the browser scrolls into view (or focuses after validation) is never hidden.
            className="max-md:[&_:is(input,select,textarea,button,[role=radio],[role=checkbox],[role=option])]:scroll-mb-40"
            custom={state.direction}
            variants={stepVariants(reduceMotion)}
            initial="enter"
            animate="center"
            exit="exit"
            onAnimationComplete={handleEntered}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-ink-900 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:static md:mx-0 md:mt-8 md:border-t-0 md:bg-transparent md:p-0">
          {error && (
            <p
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-ui bg-bad/[0.08] px-3 py-2.5 text-[0.9375rem] leading-snug text-steel-50 ring-1 ring-bad/30"
            >
              <WarningCircleIcon
                size={20}
                aria-hidden="true"
                className="mt-px shrink-0 text-bad"
              />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={navPending}
                aria-label="Terug"
                className="inline-flex min-h-12 w-12 shrink-0 select-none items-center justify-center gap-2 rounded-ui bg-ink-800 font-semibold text-steel-100 shadow-raised ring-1 ring-line-strong transition-[transform,background-color] duration-150 ease-out-strong hover:bg-ink-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 sm:min-h-14 sm:w-auto sm:rounded-[14px] sm:px-6"
              >
                <ArrowLeftIcon size={20} aria-hidden="true" />
                <span className="hidden sm:inline">Terug</span>
              </button>
            )}

            <div className="min-w-0 flex-1" aria-live="polite">
              {summary ? (
                <div className="min-w-0">
                  <p className="truncate text-xs text-steel-400 sm:text-sm">
                    {summary.label}
                    {summary.detail && (
                      <span className="hidden min-[400px]:inline">
                        , {summary.detail}
                      </span>
                    )}
                  </p>
                  <p
                    key={summary.cents}
                    className="figure-swap figures truncate font-display text-xl font-semibold leading-tight tracking-[-0.02em] text-steel-50"
                  >
                    {formatEuro(summary.cents)}
                  </p>
                </div>
              ) : step === 0 && modelName ? (
                <div className="min-w-0">
                  <p className="text-xs text-steel-400 sm:text-sm">Toestel</p>
                  <p className="truncate font-semibold text-steel-50">
                    {modelName}
                  </p>
                </div>
              ) : (
                !canContinue &&
                missing && (
                  <p className="truncate text-sm text-steel-400">{missing}</p>
                )
              )}
            </div>

            <button
              type="button"
              onClick={step === LAST_STEP ? submit : goNext}
              disabled={!canContinue || pending}
              className={`${buttonClass("primary", "md")} shrink-0 sm:min-h-14 sm:rounded-[14px] sm:px-7 sm:text-base`}
            >
              {navPending ? busyLabel : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

"use client";
export function trackBookingStep(step: number) {
  if (
    process.env.NEXT_PUBLIC_FUNNEL_ENABLED !== "true" ||
    !Number.isInteger(step) ||
    step < 0 ||
    step > 5
  )
    return;
  // Fixed event labels only. Never add customer fields, query strings or status-link tokens.
  void fetch("/api/metingen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: `step_${step + 1}` }),
    keepalive: true,
  }).catch(() => {});
}

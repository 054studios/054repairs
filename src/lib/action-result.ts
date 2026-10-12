export type ActionResult = { ok: boolean; message: string };

export const savedResult: ActionResult = { ok: true, message: "Opgeslagen." };

// Wraps a server action so errors show up in the form instead of crashing the page.
export async function safely(action: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await action();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Er ging iets mis. Probeer het opnieuw.",
    };
  }
}

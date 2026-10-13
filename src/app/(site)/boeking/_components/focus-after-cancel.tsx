"use client";

import { useEffect } from "react";

export const CANCELLED_FLAG = "boeking-geannuleerd";

// After cancelling, the page is rendered again and the cancel button disappears.
// Move focus to the page heading, so keyboard and screen reader users keep their place.
export function FocusHeadingAfterCancel({ reference }: { reference: string }) {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CANCELLED_FLAG) !== reference) {
        return;
      }

      window.sessionStorage.removeItem(CANCELLED_FLAG);
      document.querySelector<HTMLElement>("[data-status-heading]")?.focus();
    } catch {
      // Storage can be blocked (private mode). The page still works without the focus move.
    }
  }, [reference]);

  return null;
}

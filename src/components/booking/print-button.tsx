"use client";
import { buttonClass } from "@/components/ui/styles";
export function PrintButton() {
  return (
    <button
      type="button"
      className={buttonClass("primary")}
      onClick={() => window.print()}
    >
      Afdrukken / opslaan als PDF
    </button>
  );
}

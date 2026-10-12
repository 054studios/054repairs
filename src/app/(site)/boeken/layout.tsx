import type { ReactNode } from "react";

// The booking flow reads live availability and prices, so the navigation check is turned off here.
export const instant = false;

export default function BoekenLayout({ children }: { children: ReactNode }) {
  return children;
}

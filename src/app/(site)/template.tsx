import type { ReactNode } from "react";
// Opacity only, so sticky booking controls keep their original containing block.
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

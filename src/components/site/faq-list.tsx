import type { FaqItem } from "./faq-items";

// Native details elements in one panel. The shared name opens them one at a time where supported.
// The plus turns into a minus and the answer fades in (styles in globals.css).
export function FaqList({ items, groupName = "faq" }: { items: FaqItem[]; groupName?: string }) {
  return (
    <div className="divide-y divide-line rounded-panel bg-ink-900 shadow-panel ring-1 ring-line">
      {items.map((item) => (
        <details key={item.id} name={groupName} className="group">
          <summary className="faq-summary flex min-h-16 cursor-pointer items-center justify-between gap-6 px-5 py-4 md:px-6">
            <span className="text-[1.0625rem] font-medium leading-snug text-steel-100 transition-colors duration-150 group-open:text-steel-50 group-hover:text-steel-50">{item.question}</span>
            <span aria-hidden="true" className="relative block size-3.5 shrink-0">
              <span className="faq-plus-h" />
              <span className="faq-plus-v" />
            </span>
          </summary>
          <div className="faq-answer max-w-[64ch] px-5 pb-6 text-base leading-relaxed text-steel-300 md:px-6">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

import type { FaqItem } from "./faq-items";

// Native details elements. The shared name makes them open one at a time where the browser supports it.
export function FaqList({ items, groupName = "faq" }: { items: FaqItem[]; groupName?: string }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.id}
          name={groupName}
          className="rounded-2xl bg-white ring-1 ring-navy-100 transition-shadow duration-200 open:shadow-[0_16px_36px_-22px_rgba(11,27,51,0.4)]"
        >
          <summary className="faq-summary flex cursor-pointer items-center justify-between gap-6 rounded-2xl px-5 py-5 md:px-6">
            <span className="text-lg font-bold leading-snug text-navy-950">{item.question}</span>
            <span aria-hidden="true" className="relative block size-4 shrink-0">
              <span className="faq-plus-h" />
              <span className="faq-plus-v" />
            </span>
          </summary>
          <div className="faq-answer px-5 pb-6 text-base leading-relaxed text-navy-800 md:px-6">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

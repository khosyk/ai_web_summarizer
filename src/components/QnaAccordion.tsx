import { ChevronDown } from 'lucide-react';
import type { QnaItem } from '../qnaContent';

interface Props {
  items: QnaItem[];
}

/** Q&A 드롭다운(accordion) 목록 */
export function QnaAccordion({ items }: Props) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <details className="group rounded-xl border border-slate-200 bg-white open:border-indigo-200 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-left text-[11px] font-black text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                size={14}
                className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="border-t border-slate-100 px-3 py-2.5 text-[10px] font-medium leading-relaxed text-slate-600">
              {item.answer}
              {item.email ? (
                <>
                  {' '}
                  <a
                    href={`mailto:${item.email}`}
                    className="font-bold text-indigo-600 underline hover:text-indigo-700"
                  >
                    {item.email}
                  </a>
                </>
              ) : null}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}

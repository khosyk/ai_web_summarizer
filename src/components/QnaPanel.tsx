import { ArrowLeft, HelpCircle } from 'lucide-react';
import { getQnaCopy } from '../qnaContent';
import { QnaAccordion } from './QnaAccordion';

interface Props {
  language: string;
  backLabel: string;
  onBack: () => void;
}

/** 사이드패널 Q&A 전체 화면 */
export function QnaPanel({ language, backLabel, onBack }: Props) {
  const copy = getQnaCopy(language);

  return (
    <div className="space-y-4 pb-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
      >
        <ArrowLeft size={12} aria-hidden />
        {backLabel}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <HelpCircle size={16} aria-hidden />
        </div>
        <h2 className="text-sm font-black text-slate-900">{copy.title}</h2>
      </div>

      <QnaAccordion items={copy.items} />
    </div>
  );
}

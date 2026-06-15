import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  closeLabel: string;
  onClose: () => void;
}

/** 사용자에게 에러 메시지를 모달로 표시 */
export function ErrorDialog({
  isOpen,
  title,
  message,
  closeLabel,
  onClose,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="error-dialog-title"
          aria-describedby="error-dialog-message"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-red-100 bg-white p-5 shadow-2xl shadow-red-900/10"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={closeLabel}
            >
              <X size={16} />
            </button>
            <motion.div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.5 }}
            >
              <AlertCircle size={22} />
            </motion.div>
            <h2
              id="error-dialog-title"
              className="pr-6 text-sm font-black text-slate-900"
            >
              {title}
            </h2>
            <p
              id="error-dialog-message"
              className="mt-2 max-h-48 overflow-y-auto text-[11px] font-medium leading-relaxed text-slate-600 whitespace-pre-wrap"
            >
              {message}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white transition-colors hover:bg-slate-800"
            >
              {closeLabel}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

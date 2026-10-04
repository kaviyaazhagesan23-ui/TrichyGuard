import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import InfoTip from './InfoTip';
import { cn } from '../lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  tip?: string;
  className?: string;
  children: ReactNode;
}

export default function FormField({ id, label, hint, error, required, tip, className, children }: FormFieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-700">
          {label}
          {required && (
            <span className="text-coral-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
        {tip && <InfoTip text={tip} />}
      </div>
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-coral-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

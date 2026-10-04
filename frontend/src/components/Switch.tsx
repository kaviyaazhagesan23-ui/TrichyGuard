import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Switch({ id, checked, onChange, label }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        checked ? 'bg-gradient-to-r from-brand-500 to-violet-500' : 'bg-ink-200',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-1' : 'left-1')}
      />
    </button>
  );
}

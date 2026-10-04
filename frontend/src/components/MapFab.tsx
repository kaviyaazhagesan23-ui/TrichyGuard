import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MapFabProps {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  active?: boolean;
  className?: string;
}

/** Floating, elevated map button. */
export default function MapFab({ label, onClick, icon, active = false, className }: MapFabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-2xl text-ink-700 shadow-[0_2px_4px_rgba(13,21,54,0.08),0_16px_28px_-10px_rgba(80,60,220,0.5)] ring-1 ring-white/90 backdrop-blur',
        active ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white' : 'bg-white/95 hover:text-brand-600',
        className,
      )}
    >
      {icon}
    </motion.button>
  );
}

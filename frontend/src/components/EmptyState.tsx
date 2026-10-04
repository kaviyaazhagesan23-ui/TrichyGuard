import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-3xl',
          tone === 'error' ? 'bg-coral-50 text-coral-500' : 'bg-brand-50 text-brand-500',
        )}
      >
        <Icon className="h-8 w-8" aria-hidden="true" />
      </motion.div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

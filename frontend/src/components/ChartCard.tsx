import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '../lib/motion';
import InfoTip from './InfoTip';
import LoadingSkeleton from './LoadingSkeleton';
import { cn } from '../lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  tip?: string;
  actions?: ReactNode;
  loading?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  tip,
  actions,
  loading = false,
  className,
  bodyClassName,
  children,
}: ChartCardProps) {
  return (
    <motion.section variants={itemVariants} className={cn('surface flex flex-col p-5 sm:p-6', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {tip && <InfoTip text={tip} />}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={cn('relative min-h-0 flex-1', bodyClassName)}>
        {loading ? <LoadingSkeleton variant="chart" className="absolute inset-0" /> : children}
      </div>
    </motion.section>
  );
}

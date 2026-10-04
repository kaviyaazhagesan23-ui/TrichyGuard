import type { RiskLevel } from '../types';
import { RISK_META, cn } from '../lib/utils';

const STYLES: Record<RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-coral-50 text-coral-700 ring-coral-200',
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export default function RiskBadge({ level, size = 'sm', className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm',
        STYLES[level],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RISK_META[level].color }} aria-hidden="true" />
      {RISK_META[level].label}
    </span>
  );
}

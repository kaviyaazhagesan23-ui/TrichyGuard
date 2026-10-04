import { Clock, HeartPulse, Building2 } from 'lucide-react';
import type { Hospital } from '../types';
import { cn } from '../lib/utils';

export default function HospitalBadges({ hospital, className }: { hospital: Hospital; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
          hospital.emergency ? 'bg-coral-50 text-coral-700 ring-coral-200' : 'bg-ink-50 text-ink-500 ring-ink-200',
        )}
      >
        <HeartPulse className="h-3 w-3" aria-hidden="true" />
        {hospital.emergency ? 'Emergency available' : 'No emergency unit'}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
          hospital.kind === 'Public' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-violet-50 text-violet-700 ring-violet-200',
        )}
      >
        <Building2 className="h-3 w-3" aria-hidden="true" />
        {hospital.kind === 'Public' ? 'Government' : 'Private'}
      </span>
      {hospital.open24x7 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan2-50 px-2.5 py-0.5 text-xs font-semibold text-cyan2-600 ring-1 ring-inset ring-cyan2-200">
          <Clock className="h-3 w-3" aria-hidden="true" />
          24/7
        </span>
      )}
    </div>
  );
}

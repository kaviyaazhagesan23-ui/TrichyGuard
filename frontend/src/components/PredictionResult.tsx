import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import RiskBadge from './RiskBadge';
import RiskGauge from './RiskGauge';
import type { RiskPredictionResult } from '../types';
import { RISK_META, levelFromScore } from '../lib/utils';

interface PredictionResultProps {
  result: RiskPredictionResult;
  zoneName: string;
}

const ADVICE = {
  low: 'Routine monitoring is enough. Keep ambulances on their normal stations.',
  medium: 'Increase patrol visibility and keep the nearest ambulance on standby for this zone.',
  high: 'Pre-position an ambulance near this zone, alert nearby hospitals and consider traffic control measures.',
} as const;

const HEADLINE = {
  low: 'Conditions look relatively calm.',
  medium: 'Conditions call for extra attention.',
  high: 'Conditions point to elevated risk.',
} as const;

export default function PredictionResult({ result, zoneName }: PredictionResultProps) {
  const top = [...result.factors].sort((a, b) => b.impact - a.impact).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <RiskGauge value={result.probability} level={result.level} />
        <div className="mt-4 flex flex-col items-center gap-2">
          <RiskBadge level={result.level} size="md" />
          <h3 className="text-xl font-semibold">{HEADLINE[result.level]}</h3>
          <p className="text-sm text-ink-500">Assessment for {zoneName}.</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-ink-700">Key condition indicators</h4>
        <ul className="flex flex-wrap gap-2">
          {top.map((f) => (
            <li key={f.key} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-100">
              {f.label}: <span className="text-ink-900">{f.valueLabel}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-ink-700">Selected condition indicators</h4>
        <ul className="space-y-3">
          {result.factors.map((f, i) => {
            const level = levelFromScore(f.level);
            return (
              <li key={f.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-semibold text-ink-700">{f.label}</span>
                  <span className="truncate text-ink-500">{f.valueLabel}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100" role="img" aria-label={`${f.label}: severity ${f.level} out of 100`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: RISK_META[level].color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, f.level)}%` }}
                    transition={{ duration: 0.7, delay: 0.05 * i, ease: 'easeOut' }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-4 text-sm text-ink-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-ink-900">Suggested response</p>
          <p className="leading-relaxed">{ADVICE[result.level]}</p>
        </div>
      </div>
    </div>
  );
}

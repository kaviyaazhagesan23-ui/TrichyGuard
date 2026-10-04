import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import InfoTip from './InfoTip';
import TiltCard from './TiltCard';
import { itemVariants } from '../lib/motion';
import { cn } from '../lib/utils';

type Accent = 'blue' | 'teal' | 'violet' | 'coral' | 'emerald';

const TILE: Record<Accent, string> = {
  blue: 'from-cyan2-400 to-brand-600',
  teal: 'from-emerald-400 to-cyan2-500',
  violet: 'from-violet-500 to-fuchsia-500',
  coral: 'from-coral-500 to-orange-400',
  emerald: 'from-emerald-500 to-teal-400',
};
const PLATE: Record<Accent, string> = {
  blue: 'from-cyan2-300/60 to-brand-300/60',
  teal: 'from-emerald-300/60 to-cyan2-300/60',
  violet: 'from-violet-300/60 to-fuchsia-300/60',
  coral: 'from-coral-300/60 to-orange-300/60',
  emerald: 'from-emerald-300/60 to-teal-300/60',
};
const STROKE: Record<Accent, string> = {
  blue: '#2F5BFF',
  teal: '#14B8A6',
  violet: '#7C4DFF',
  coral: '#FF5A4D',
  emerald: '#10B981',
};

interface StatCardProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  accent: Accent;
  tip?: string;
  footnote?: string;
  sparkline?: number[];
  /** Percent or absolute change. `goodWhen` says which direction is positive. */
  delta?: { value: number; unit?: string; goodWhen: 'up' | 'down' };
  loading?: boolean;
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 10)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  decimals = 0,
  suffix,
  icon: Icon,
  accent,
  tip,
  footnote,
  sparkline,
  delta,
  loading = false,
}: StatCardProps) {
  const good = delta ? (delta.goodWhen === 'up' ? delta.value >= 0 : delta.value <= 0) : true;
  const DeltaIcon = delta && delta.value < 0 ? TrendingDown : TrendingUp;
  const gradientId = `spark-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div variants={itemVariants} className="relative h-full pb-2">
      <div className={cn('absolute inset-x-4 bottom-0 top-6 rounded-3xl bg-gradient-to-r', PLATE[accent])} aria-hidden="true" />
      <TiltCard className="surface group relative z-10 h-full overflow-hidden p-5 transition-shadow hover:shadow-lift">
        <div
          className={cn('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-15 blur-2xl', TILE[accent])}
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-ink-500">{label}</p>
              {tip && <InfoTip text={tip} />}
            </div>
            <p className="mt-2 font-display text-4xl font-extrabold text-ink-900 drop-shadow-[0_2px_0_rgba(255,255,255,0.9)]">
              {loading ? <span className="skeleton inline-block h-9 w-20 align-middle" /> : <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />}
            </p>
          </div>
          <motion.div
            whileHover={{ rotate: -8, scale: 1.08 }}
            className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-tile', TILE[accent])}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </motion.div>
        </div>
        <div className="relative mt-3 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold',
                good ? 'bg-emerald-50 text-emerald-700' : 'bg-coral-50 text-coral-700',
              )}
            >
              <DeltaIcon className="h-3 w-3" aria-hidden="true" />
              {Math.abs(delta.value)}
              {delta.unit ?? '%'}
            </span>
          )}
          {footnote && <span className="text-ink-400">{footnote}</span>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="relative mt-3">
            <Sparkline values={sparkline} color={STROKE[accent]} id={gradientId} />
          </div>
        )}
      </TiltCard>
    </motion.div>
  );
}

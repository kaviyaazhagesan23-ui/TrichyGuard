import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import type { RiskLevel } from '../types';
import { RISK_META } from '../lib/utils';

interface RiskGaugeProps {
  value: number;
  level: RiskLevel;
  size?: number;
}

const END_COLOR: Record<RiskLevel, string> = { low: '#06B6D4', medium: '#F97316', high: '#C026D3' };

export default function RiskGauge({ value, level, size = 220 }: RiskGaugeProps) {
  const color = RISK_META[level].color;
  const stroke = 16;
  const r = 100 - stroke / 2 - 6;
  const id = `gauge-${level}`;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible" role="img" aria-label={`Risk score ${value} out of 100, ${RISK_META[level].label}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={END_COLOR[level]} />
          </linearGradient>
          <radialGradient id={`${id}-disc`} cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEF2FF" />
          </radialGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={color} floodOpacity="0.38" />
          </filter>
          <filter id={`${id}-disc-shadow`} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#16204A" floodOpacity="0.18" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r={r - stroke / 2 - 4} fill={`url(#${id}-disc)`} filter={`url(#${id}-disc-shadow)`} />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#E3E8F5" strokeWidth={stroke} />
        <g transform="rotate(-90 100 100)" filter={`url(#${id}-shadow)`}>
          <motion.circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: value / 100 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
        <path d="M44 70a64 64 0 0 1 56-34" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={value} suffix="%" className="font-display text-5xl font-extrabold text-ink-900" />
        <span className="mt-1 text-xs font-semibold text-ink-400">chance of an accident</span>
      </div>
    </div>
  );
}

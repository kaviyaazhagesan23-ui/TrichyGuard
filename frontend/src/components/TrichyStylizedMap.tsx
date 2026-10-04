import { useMemo, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { Zone } from '../types';
import { RISK_META } from '../lib/utils';

const W = 640;
const H = 440;
const BOUNDS = { minLat: 10.775, maxLat: 10.885, minLng: 78.66, maxLng: 78.75 };

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
    y: ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
  };
}

interface TrichyStylizedMapProps {
  zones: Zone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Hand-drawn style overview map. Rivers and roads are decorative, not survey-accurate. */
export default function TrichyStylizedMap({ zones, selectedId, onSelect }: TrichyStylizedMapProps) {
  const projected = useMemo(
    () => zones.map((z) => ({ zone: z, ...project(z.position[0], z.position[1]) })),
    [zones],
  );

  const onKey = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full rounded-2xl"
      role="group"
      aria-label="Map of Tiruchirappalli with risk markers for the five zones"
    >
      <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2F8FF" />
          <stop offset="55%" stopColor="#EAF1FF" />
          <stop offset="100%" stopColor="#F5EBFF" />
        </linearGradient>
        <linearGradient id="map-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#5A82FF" />
        </linearGradient>
        <pattern id="map-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#BACDFF" opacity="0.7" />
        </pattern>
        <path id="cauvery-path" d="M-10 150 C110 170 220 128 330 152 S520 182 650 160" />
        <path id="kollidam-path" d="M-10 40 C150 28 260 62 380 44 S560 30 650 52" />
      </defs>

      <rect width={W} height={H} rx="24" fill="url(#map-bg)" />
      <rect width={W} height={H} rx="24" fill="url(#map-dots)" />

      {/* decorative road network */}
      <g stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.95">
        <path d="M60 420 C160 330 250 300 330 250 S520 150 610 40" />
        <path d="M20 300 C180 290 320 330 620 300" />
        <path d="M330 430 C335 340 320 280 330 210" />
        <path d="M200 430 C230 360 250 300 300 250" />
        <path d="M430 400 C450 330 480 290 560 250" />
      </g>
      <g stroke="#DCE6FF" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M60 420 C160 330 250 300 330 250 S520 150 610 40" strokeDasharray="2 10" />
        <path d="M20 300 C180 290 320 330 620 300" strokeDasharray="2 10" />
      </g>

      {/* rivers */}
      <use href="#cauvery-path" fill="none" stroke="url(#map-river)" strokeWidth="20" strokeLinecap="round" opacity="0.55" />
      <use href="#cauvery-path" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 10" opacity="0.8" />
      <use href="#kollidam-path" fill="none" stroke="url(#map-river)" strokeWidth="16" strokeLinecap="round" opacity="0.45" />
      <use href="#kollidam-path" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 10" opacity="0.8" />
      <text fontSize="11" fontWeight="700" fill="#1E43E0" opacity="0.7">
        <textPath href="#cauvery-path" startOffset="12%">
          Cauvery
        </textPath>
      </text>
      <text fontSize="11" fontWeight="700" fill="#1E43E0" opacity="0.7">
        <textPath href="#kollidam-path" startOffset="62%">
          Kollidam
        </textPath>
      </text>

      {/* zones */}
      {projected.map(({ zone, x, y }) => {
        const color = RISK_META[zone.riskLevel].color;
        const selected = zone.id === selectedId;
        return (
          <g
            key={zone.id}
            role="button"
            tabIndex={0}
            aria-label={`${zone.name}, ${RISK_META[zone.riskLevel].label}, score ${zone.baseRisk}`}
            aria-pressed={selected}
            onClick={() => onSelect(zone.id)}
            onKeyDown={(e) => onKey(e, zone.id)}
            className="cursor-pointer outline-none focus-visible:[&>circle:last-of-type]:stroke-brand-600"
          >
            <circle cx={x} cy={y} r={zone.radiusM * 0.045} fill={color} opacity={selected ? 0.28 : 0.16} />
            {zone.riskLevel === 'high' && <circle cx={x} cy={y} r="10" fill="none" stroke={color} strokeWidth="2" className="pulse-ring" />}
            <motion.circle
              cx={x}
              cy={y}
              r={selected ? 12 : 8.5}
              fill={color}
              stroke="#fff"
              strokeWidth="3"
              animate={{ r: selected ? 12 : 8.5 }}
              whileHover={{ r: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            />
            <text
              x={x}
              y={y - 17}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#16204A"
              stroke="#fff"
              strokeWidth="3.5"
              paintOrder="stroke"
              opacity={selected ? 1 : 0.85}
            >
              {zone.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

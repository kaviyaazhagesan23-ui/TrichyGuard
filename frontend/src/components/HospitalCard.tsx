import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Info, MapPin, Navigation, Route as RouteIcon } from 'lucide-react';
import HospitalBadges from './HospitalBadges';
import type { HospitalWithDistance, LatLngTuple } from '../types';
import { cn, formatMinutes } from '../lib/utils';

interface HospitalCardProps {
  hospital: HospitalWithDistance;
  rank: number;
  origin: LatLngTuple;
  selected: boolean;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}

export function navigateUrl(hospitalId: string, origin: LatLngTuple): string {
  return `/ambulance-routing?hospital=${hospitalId}&lat=${origin[0].toFixed(5)}&lng=${origin[1].toFixed(5)}`;
}

export default function HospitalCard({ hospital, rank, origin, selected, onSelect, onDetails }: HospitalCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(rank, 8) * 0.05 }}
      whileHover={{ y: -3 }}
      id={`hospital-card-${hospital.id}`}
      onClick={() => onSelect(hospital.id)}
      className={cn('surface cursor-pointer overflow-hidden p-5 transition-shadow', selected ? 'shadow-lift ring-2 ring-violet-400' : 'hover:shadow-lift')}
      aria-current={selected || undefined}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan2-400 via-brand-500 to-violet-500 font-display text-lg font-bold text-white shadow-tile">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug">{hospital.name}</h3>
            <button
              type="button"
              aria-label={`Show ${hospital.name} on the map`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hospital.id);
              }}
              className="shrink-0 rounded-xl p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-ink-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{hospital.address}</span>
          </p>
        </div>
      </div>

      <HospitalBadges hospital={hospital} className="mt-3" />

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-cyan2-50 p-3">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <RouteIcon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            Distance
          </dt>
          <dd className="mt-0.5 font-display text-xl font-bold text-ink-900">{hospital.distanceKm.toFixed(1)} km</dd>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <Clock className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
            Travel time
          </dt>
          <dd className="mt-0.5 font-display text-xl font-bold text-ink-900">{formatMinutes(hospital.etaMin)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDetails(hospital.id);
          }}
          className="btn-secondary !px-3.5 !py-2 !text-xs"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          View Details
        </button>
        <Link to={navigateUrl(hospital.id, origin)} onClick={(e) => e.stopPropagation()} className="btn-primary !px-3.5 !py-2 !text-xs">
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
          Navigate
        </Link>
      </div>
    </motion.article>
  );
}

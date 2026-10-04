import { Link } from 'react-router-dom';
import { Clock, Info, MapPin, Navigation, Phone } from 'lucide-react';
import HospitalBadges from './HospitalBadges';
import { navigateUrl } from './HospitalCard';
import type { HospitalWithDistance, LatLngTuple } from '../types';
import { formatMinutes } from '../lib/utils';

interface HospitalInfoCardProps {
  hospital: HospitalWithDistance;
  origin: LatLngTuple;
  onDetails: (id: string) => void;
}

/** Content of the map popup for a hospital marker. */
export default function HospitalInfoCard({ hospital, origin, onDetails }: HospitalInfoCardProps) {
  return (
    <div className="w-[260px] sm:w-[290px]">
      <div className="bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-white">
        <p className="text-[11px] font-semibold opacity-90">Nearby hospital</p>
        <h3 className="!text-white text-base font-bold leading-snug">{hospital.name}</h3>
      </div>
      <div className="space-y-3 px-4 py-3">
        <HospitalBadges hospital={hospital} />
        <p className="flex items-start gap-1.5 text-xs text-ink-600">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
          {hospital.address}
        </p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-brand-50 py-2">
            <p className="font-display text-lg font-bold text-ink-900">{hospital.distanceKm.toFixed(1)} km</p>
            <p className="text-[11px] text-ink-500">Distance</p>
          </div>
          <div className="rounded-xl bg-violet-50 py-2">
            <p className="flex items-center justify-center gap-1 font-display text-lg font-bold text-ink-900">
              <Clock className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
              {formatMinutes(hospital.etaMin)}
            </p>
            <p className="text-[11px] text-ink-500">Travel time</p>
          </div>
        </div>
        {hospital.phone && (
          <a href={`tel:${hospital.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {hospital.phone}
          </a>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => onDetails(hospital.id)} className="btn-secondary !flex-1 !px-3 !py-2 !text-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            View Details
          </button>
          <Link to={navigateUrl(hospital.id, origin)} className="btn-primary !flex-1 !px-3 !py-2 !text-xs !text-white">
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            Navigate
          </Link>
        </div>
      </div>
    </div>
  );
}

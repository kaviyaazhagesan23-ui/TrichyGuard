import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MapPin, Navigation, Phone, Route as RouteIcon, X } from 'lucide-react';
import HospitalBadges from './HospitalBadges';
import { navigateUrl } from './HospitalCard';
import type { HospitalWithDistance, LatLngTuple } from '../types';
import { formatMinutes } from '../lib/utils';

interface HospitalDetailsDialogProps {
  hospital: HospitalWithDistance | null;
  origin: LatLngTuple;
  onClose: () => void;
}

export default function HospitalDetailsDialog({ hospital, origin, onClose }: HospitalDetailsDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hospital) return undefined;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hospital, onClose]);

  return (
    <AnimatePresence>
      {hospital && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-900/45 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hospital-dialog-title"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-lift"
          >
            <div className="relative bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 px-6 pb-5 pt-6 text-white">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="absolute right-4 top-4 rounded-xl bg-white/20 p-2 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-xs font-semibold opacity-90">Hospital details</p>
              <h2 id="hospital-dialog-title" className="mt-1 pr-10 text-2xl font-bold !text-white">
                {hospital.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm opacity-95">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {hospital.address}
              </p>
            </div>
            <div className="space-y-5 p-6">
              <HospitalBadges hospital={hospital} />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-cyan2-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <RouteIcon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                    Distance
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{hospital.distanceKm.toFixed(1)} km</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <Clock className="h-4 w-4 text-violet-500" aria-hidden="true" />
                    Travel time
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{formatMinutes(hospital.etaMin)}</p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink-700">Departments and services</h3>
                <ul className="flex flex-wrap gap-2">
                  {hospital.services.map((s) => (
                    <li key={s} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {hospital.phone ? (
                  <a href={`tel:${hospital.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {hospital.phone}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-ink-400">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Phone number not listed
                  </span>
                )}
                <Link to={navigateUrl(hospital.id, origin)} className="btn-primary">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Navigate
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

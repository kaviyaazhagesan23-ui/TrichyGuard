import { HOSPITALS } from '../../data/hospitals';
import type { HospitalWithDistance, NearbySearchRequest } from '../../types';
import { haversineKm } from '../../lib/utils';

/** Hospitals inside the radius, sorted by distance. */
export function computeNearbyHospitals({ center, radiusKm }: NearbySearchRequest): HospitalWithDistance[] {
  return HOSPITALS.map((h) => {
    const distanceKm = haversineKm(center, h.position);
    // Road distance is roughly 1.3x the straight line; average urban speed about 28 km/h.
    const etaMin = Math.max(2, Math.round(((distanceKm * 1.3) / 28) * 60 + 1.5));
    return { ...h, distanceKm: Math.round(distanceKm * 10) / 10, etaMin };
  })
    .filter((h) => h.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

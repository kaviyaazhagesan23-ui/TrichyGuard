import { HOSPITALS } from '../../data/hospitals';
import type {
  Hospital,
  LatLngTuple,
  RouteAlternative,
  RoutePriority,
  RouteRequest,
  RouteResult,
  RouteStep,
} from '../../types';
import { haversineKm } from '../../lib/utils';

function estimate(origin: LatLngTuple, hospital: Hospital, priority: RoutePriority) {
  const straight = haversineKm(origin, hospital.position);
  const distanceKm = Math.round(straight * 1.32 * 10) / 10;
  const speedKmh = priority === 'critical' ? 38 : 30;
  const etaMin = Math.max(2, Math.round((distanceKm / speedKmh) * 60 + 1.5));
  return { distanceKm, etaMin };
}

/** Curved polyline between two points. Replace with the routing service geometry. */
function buildPath(from: LatLngTuple, to: LatLngTuple, points = 48): LatLngTuple[] {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const control: LatLngTuple = [from[0] + dLat / 2 - dLng * 0.22, from[1] + dLng / 2 + dLat * 0.22];
  const path: LatLngTuple[] = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    path.push([a * from[0] + b * control[0] + c * to[0], a * from[1] + b * control[1] + c * to[1]]);
  }
  return path;
}

export function computeMockRoute(request: RouteRequest): RouteResult {
  const { origin, priority } = request;

  const byDistance = [...HOSPITALS].sort(
    (a, b) => haversineKm(origin.position, a.position) - haversineKm(origin.position, b.position),
  );
  const hospital =
    request.hospitalId === 'nearest'
      ? byDistance[0]
      : HOSPITALS.find((h) => h.id === request.hospitalId) ?? byDistance[0];

  const { distanceKm, etaMin } = estimate(origin.position, hospital, priority);

  const steps: RouteStep[] = [
    { id: 's1', title: 'Leave the accident location', detail: origin.label, distanceKm: 0 },
    {
      id: 's2',
      title: 'Join the nearest main corridor',
      detail: 'Follow the main road toward the hospital area',
      distanceKm: Math.round(distanceKm * 0.35 * 10) / 10,
    },
    {
      id: 's3',
      title: 'Continue toward the hospital zone',
      detail: hospital.address,
      distanceKm: Math.round(distanceKm * 0.5 * 10) / 10,
    },
    {
      id: 's4',
      title: 'Arrive at the hospital',
      detail: hospital.name,
      distanceKm: Math.round(distanceKm * 0.15 * 10) / 10,
    },
  ];

  const alternatives: RouteAlternative[] = byDistance
    .filter((h) => h.id !== hospital.id)
    .slice(0, 3)
    .map((h) => {
      const est = estimate(origin.position, h, priority);
      return { hospitalId: h.id, name: h.name, distanceKm: est.distanceKm, etaMin: est.etaMin };
    });

  return {
    id: `${hospital.id}-${origin.position[0].toFixed(4)}-${origin.position[1].toFixed(4)}-${priority}`,
    origin,
    hospital,
    priority,
    path: buildPath(origin.position, hospital.position),
    distanceKm,
    etaMin,
    steps,
    alternatives,
    isMock: true,
    source: 'Route estimate',
  };
}

import type { Incident } from '../types';
import { ZONES } from './zones';
import { clamp, hashString, levelFromScore, mulberry32 } from '../lib/utils';

const CAUSES = [
  'Junction conflict',
  'Overspeeding stretch',
  'Wet-road skid risk',
  'Pedestrian crossing hotspot',
  'Night-time visibility gap',
  'Lane-merge conflict',
];
const TIME_BANDS = ['Morning peak', 'Midday', 'Evening peak', 'Night'];

function buildIncidents(): Incident[] {
  const items: Incident[] = [];
  ZONES.forEach((zone) => {
    const rand = mulberry32(hashString(zone.id));
    const count = 6 + Math.round((zone.baseRisk / 100) * 6);
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * zone.radiusM * 0.85;
      const dLat = (Math.cos(angle) * dist) / 111_000;
      const dLng = (Math.sin(angle) * dist) / (111_000 * Math.cos((zone.position[0] * Math.PI) / 180));
      const score = Math.round(clamp(zone.baseRisk + (rand() - 0.5) * 36, 8, 96));
      const cause = CAUSES[Math.floor(rand() * CAUSES.length)];
      items.push({
        id: `${zone.id}-${i + 1}`,
        zoneId: zone.id,
        title: `${cause} near ${zone.name}`,
        position: [zone.position[0] + dLat, zone.position[1] + dLng],
        risk: levelFromScore(score),
        score,
        daysAgo: Math.floor(Math.pow(rand(), 1.4) * 120),
        cause,
        timeBand: TIME_BANDS[Math.floor(rand() * TIME_BANDS.length)],
      });
    }
  });
  return items;
}

/** Illustrative map markers. Replace with real incident / hotspot data from your backend. */
export const INCIDENTS: Incident[] = buildIncidents();

import type { Zone } from '../types';
import { levelFromScore } from '../lib/utils';

type ZoneSeed = Omit<Zone, 'riskLevel'>;

/** The five monitored zones. Positions are approximate. */
const seeds: ZoneSeed[] = [
  {
    id: 'srirangam',
    name: 'Srirangam',
    position: [10.8626, 78.6937],
    radiusM: 1100,
    baseRisk: 49,
    sampleAccidents12m: 74,
    summary: 'River island zone with heavy pilgrim and local traffic around the temple area and its bridge approaches.',
    characteristics: ['Seasonal crowd surges', 'Mixed pedestrian and vehicle flow', 'Limited bridge access points'],
  },
  {
    id: 'cantonment',
    name: 'Cantonment',
    position: [10.805, 78.6856],
    radiusM: 1000,
    baseRisk: 71,
    sampleAccidents12m: 133,
    summary: 'Central corridor linking the railway junction, offices and city bus routes.',
    characteristics: ['Multi-arm junctions', 'Peak-hour queueing', 'Mixed heavy and light vehicles'],
  },
  {
    id: 'thillai-nagar',
    name: 'Thillai Nagar',
    position: [10.819, 78.687],
    radiusM: 850,
    baseRisk: 47,
    sampleAccidents12m: 69,
    summary: 'Retail and dining district with steady evening traffic and heavy on-street parking.',
    characteristics: ['Evening peak congestion', 'On-street parking friction', 'Frequent turning movements'],
  },
  {
    id: 'rockfort',
    name: 'Rockfort',
    position: [10.8283, 78.6978],
    radiusM: 900,
    baseRisk: 82,
    sampleAccidents12m: 168,
    summary: 'Dense market and temple area where buses, autos and two-wheelers share narrow roads.',
    characteristics: ['Dense bus and auto movement', 'Frequent junction conflicts', 'Heavy pedestrian crossings'],
  },
  {
    id: 'ariyamangalam',
    name: 'Ariyamangalam',
    position: [10.8005, 78.724],
    radiusM: 1100,
    baseRisk: 36,
    sampleAccidents12m: 44,
    summary: 'Eastern industrial and residential belt with freight movement and quieter inner streets.',
    characteristics: ['Heavy vehicle presence', 'Shift-change surges', 'Calmer residential streets'],
  },
];

export const ZONES: Zone[] = seeds.map((z) => ({ ...z, riskLevel: levelFromScore(z.baseRisk) }));

export function getZone(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id);
}

import type { DistributionSlice, OverviewData, TrendPoint, TrendRange } from '../types';
import { HOSPITALS } from './hospitals';
import { ZONES } from './zones';
import { hashString, mulberry32 } from '../lib/utils';

function buildTrend(range: TrendRange): TrendPoint[] {
  const rand = mulberry32(hashString(`trend-${range}`));
  const points: TrendPoint[] = [];
  const today = new Date();

  if (range === '12m') {
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const accidents = Math.round(230 + rand() * 120 + (d.getMonth() === 5 || d.getMonth() === 10 ? 40 : 0));
      points.push({
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        accidents,
        highRisk: Math.round(accidents * (0.26 + rand() * 0.1)),
      });
    }
    return points;
  }

  const days = range === '7d' ? 7 : 30;
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const accidents = Math.round(9 + rand() * 9 + (weekend ? 3 : 0));
    points.push({
      label:
        range === '7d'
          ? d.toLocaleDateString('en-IN', { weekday: 'short' })
          : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      accidents,
      highRisk: Math.round(accidents * (0.25 + rand() * 0.12)),
    });
  }
  return points;
}

function buildDistribution(range: TrendRange): DistributionSlice[] {
  const shares: Record<TrendRange, [number, number, number]> = {
    '7d': [38, 37, 25],
    '30d': [41, 35, 24],
    '12m': [44, 34, 22],
  };
  const [low, medium, high] = shares[range];
  return [
    { level: 'low', label: 'Low risk', value: low },
    { level: 'medium', label: 'Medium risk', value: medium },
    { level: 'high', label: 'High risk', value: high },
  ];
}

export function buildOverview(range: TrendRange): OverviewData {
  const trend = buildTrend(range);
  const avgRisk = Math.round(ZONES.reduce((sum, z) => sum + z.baseRisk, 0) / ZONES.length);
  return {
    trend,
    distribution: buildDistribution(range),
    totalAccidents: trend.reduce((sum, p) => sum + p.accidents, 0),
    stats: {
      riskIndex: avgRisk,
      riskIndexDelta: 3.2,
      monitoredZones: ZONES.length,
      hospitals: HOSPITALS.length,
      avgEtaMin: 7.4,
      etaDelta: -0.6,
      riskSpark: [52, 55, 53, 58, 57, 60, 59, avgRisk],
      zoneSpark: [3, 3, 4, 4, 4, 5, 5, ZONES.length],
      hospitalSpark: [8, 9, 9, 10, 10, 11, 11, HOSPITALS.length],
      etaSpark: [9.1, 8.8, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4],
    },
  };
}

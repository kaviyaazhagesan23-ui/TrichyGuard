import type {
  ClassConfidence,
  RiskLevel,
  ZoneClassificationInput,
  ZoneClassificationResult,
} from '../../types';
import { RISK_META, clamp } from '../../lib/utils';

const CLASS_CENTRES: Record<RiskLevel, number> = { low: 20, medium: 50, high: 80 };

/** Rule-based stand-in used to drive the demo UI. Not a trained classifier. */
export function computeMockClassification(input: ZoneClassificationInput): ZoneClassificationResult {
  const accidents = clamp(input.accidentsLast12m / 200, 0, 1) * 100;
  const junctions = clamp(input.junctionCount / 25, 0, 1) * 100;
  const speed = clamp((input.speedLimit - 20) / 60, 0, 1) * 100;

  const score = clamp(
    accidents * 0.34 +
      input.trafficDensity * 0.24 +
      junctions * 0.14 +
      input.nightShare * 0.12 +
      speed * 0.1 -
      (input.hospitalWithin5km ? 4 : 0) +
      10,
    0,
    100,
  );

  const levels: RiskLevel[] = ['low', 'medium', 'high'];
  const raw = levels.map((level) => Math.exp(-0.5 * ((score - CLASS_CENTRES[level]) / 18) ** 2));
  const total = raw.reduce((a, b) => a + b, 0);
  const values = raw.map((r) => Math.round((r / total) * 100));
  const diff = 100 - values.reduce((a, b) => a + b, 0);
  const maxIndex = values.indexOf(Math.max(...values));
  values[maxIndex] += diff;

  const confidence: ClassConfidence[] = levels.map((level, i) => ({
    level,
    label: RISK_META[level].label,
    value: values[i],
  }));
  const predicted = confidence.reduce((best, c) => (c.value > best.value ? c : best)).level;

  const drivers: string[] = [];
  if (input.accidentsLast12m >= 100) drivers.push(`${input.accidentsLast12m} accidents in the last 12 months`);
  if (input.trafficDensity >= 65) drivers.push(`High traffic density (${input.trafficDensity}%)`);
  if (input.junctionCount >= 12) drivers.push(`${input.junctionCount} junctions in the zone`);
  if (input.nightShare >= 35) drivers.push(`${input.nightShare}% of incidents at night`);
  if (input.speedLimit >= 60) drivers.push(`Higher speed limit (${input.speedLimit} km/h)`);
  if (input.hospitalWithin5km) drivers.push('A hospital within 5 km slightly lowers the score');
  if (drivers.length === 0) drivers.push('No single input stands out; the score is driven by a mix of moderate values');

  return {
    zoneId: input.zoneId,
    predicted,
    confidence,
    drivers,
    isMock: true,
    source: 'Zone analysis',
  };
}

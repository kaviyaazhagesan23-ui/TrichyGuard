import { getZone } from '../../data/zones';
import type {
  FactorContribution,
  RiskPredictionInput,
  RiskPredictionResult,
  RoadCondition,
  RoadType,
  WeatherCondition,
  Weekday,
} from '../../types';
import { clamp, formatHour, levelFromScore } from '../../lib/utils';

const ROAD_TYPE_LEVEL: Record<RoadType, number> = {
  'National highway': 70,
  'State highway': 60,
  'Arterial road': 50,
  'Urban street': 55,
  'Junction or roundabout': 82,
};
const ROAD_CONDITION_LEVEL: Record<RoadCondition, number> = { Good: 10, Fair: 35, Poor: 65, Damaged: 90 };
const WEATHER_LEVEL: Record<WeatherCondition, number> = {
  Clear: 5,
  Cloudy: 15,
  'Light rain': 50,
  'Heavy rain': 85,
  Fog: 80,
};
const WEEKDAY_LEVEL: Record<Weekday, number> = { Mon: 45, Tue: 38, Wed: 38, Thu: 42, Fri: 58, Sat: 62, Sun: 48 };

function factor(
  key: string,
  label: string,
  valueLabel: string,
  level: number,
  weight: number,
): FactorContribution {
  const safe = clamp(Math.round(level), 0, 100);
  return { key, label, valueLabel, level: safe, weight, impact: Math.round(safe * weight * 10) / 10 };
}

/**
 * Transparent, rule-based scoring used ONLY to drive the demo UI.
 * It is not a trained model and must not be presented as an AI prediction.
 */
export function computeMockPrediction(input: RiskPredictionInput): RiskPredictionResult {
  const zone = getZone(input.zoneId);
  const h = input.hour;
  const hourLevel = (h >= 8 && h <= 10) || (h >= 17 && h <= 20) ? 82 : h >= 22 || h <= 4 ? 70 : h >= 11 && h <= 16 ? 40 : 30;

  const factors: FactorContribution[] = [
    factor('zone', 'Zone baseline', zone?.name ?? 'Unknown zone', zone?.baseRisk ?? 50, 0.14),
    factor('hour', 'Time of day', formatHour(h), hourLevel, 0.1),
    factor('weekday', 'Day of week', input.weekday, WEEKDAY_LEVEL[input.weekday], 0.04),
    factor('traffic', 'Traffic density', `${input.trafficDensity}%`, input.trafficDensity, 0.15),
    factor('speed', 'Average speed', `${input.avgSpeed} km/h`, ((input.avgSpeed - 20) / 80) * 100, 0.12),
    factor('roadType', 'Road type', input.roadType, ROAD_TYPE_LEVEL[input.roadType], 0.08),
    factor('roadCondition', 'Road condition', input.roadCondition, ROAD_CONDITION_LEVEL[input.roadCondition], 0.09),
    factor('rainfall', 'Rainfall', `${input.rainfall} mm/h`, (input.rainfall / 50) * 100, 0.08),
    factor('weather', 'Weather', input.weather, WEATHER_LEVEL[input.weather], 0.08),
    factor('history', 'Historical accidents', `${input.historicalAccidents} recorded`, (input.historicalAccidents / 60) * 100, 0.12),
  ];

  const probability = clamp(Math.round(factors.reduce((sum, f) => sum + f.impact, 0)), 3, 97);

  return {
    probability,
    level: levelFromScore(probability),
    factors,
    generatedAt: new Date().toISOString(),
    isMock: true,
    source: 'Risk analysis',
  };
}

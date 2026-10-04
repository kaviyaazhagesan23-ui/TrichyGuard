/**
 * Single integration point between the UI and your FastAPI backend.
 *
 * While `USE_MOCK` is true every function returns sample data from `src/data` and `src/services/mock`.
 * To connect the real backend:
 *   1. Set VITE_USE_MOCK=false and VITE_API_BASE_URL in `.env`.
 *   2. Adjust the endpoint paths below to match your FastAPI routes.
 *   3. If your response shapes differ, map them to the types in `src/types` inside each function.
 */
import { API_BASE_URL, USE_MOCK } from '../config';
import { HOSPITALS } from '../data/hospitals';
import { INCIDENTS } from '../data/incidents';
import { buildOverview } from '../data/overview';
import { buildWeather } from '../data/weather';
import { delay } from '../lib/utils';
import type {
  Hospital,
  HospitalWithDistance,
  NearbySearchRequest,
  Incident,
  OverviewData,
  RiskPredictionInput,
  RiskPredictionResult,
  RouteRequest,
  RouteResult,
  TrendRange,
  WeatherSnapshot,
  ZoneClassificationInput,
  ZoneClassificationResult,
  BatchRiskPredictionInput,
  BatchRiskPredictionResult,
  FutureRiskPredictionInput,
  FutureRiskPredictionResult,
} from '../types';
import { computeNearbyHospitals } from './mock/hospitalEngine';
import { computeMockClassification } from './mock/zoneEngine';
import { computeMockPrediction } from './mock/riskEngine';
import { computeMockRoute } from './mock/routeEngine';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error(`Could not reach the TrichyGuard backend at ${API_BASE_URL}. Make sure FastAPI is running.`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail ? ` ${body.detail}` : '';
    } catch {
      // Keep the generic status message when the server does not return JSON.
    }
    throw new Error(`The server responded with ${response.status}.${detail}`);
  }

  return (await response.json()) as T;
}

const BACKEND_ZONE_IDS: Record<string, string> = {
  srirangam: 'Zone_1_Srirangam',
  cantonment: 'Zone_2_Cantonment',
  'thillai-nagar': 'Zone_3_ThillaiNagar',
  rockfort: 'Zone_4_Rockfort',
  ariyamangalam: 'Zone_5_Ariyamangalam',
};

const BACKEND_WEEKDAYS: Record<RiskPredictionInput['weekday'], string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

function backendTrafficDensity(value: number): string {
  if (value < 34) return 'Low';
  if (value < 67) return 'Medium';
  return 'High';
}

function backendRoadType(value: RiskPredictionInput['roadType']): string {
  if (value === 'National highway' || value === 'State highway') return 'Highway';
  if (value === 'Urban street') return 'Local';
  return 'Arterial';
}

function backendRoadCondition(value: RiskPredictionInput['roadCondition']): string {
  return value === 'Damaged' ? 'Poor' : value;
}

function backendWeather(value: RiskPredictionInput['weather']): string {
  if (value === 'Fog') return 'Foggy';
  if (value === 'Light rain' || value === 'Heavy rain') return 'Rainy';
  return 'Clear';
}

function conditionFactors(input: RiskPredictionInput): RiskPredictionResult['factors'] {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const hourLevel = (input.hour >= 8 && input.hour <= 10) || (input.hour >= 17 && input.hour <= 20)
    ? 82
    : input.hour >= 22 || input.hour <= 4
      ? 70
      : input.hour >= 11 && input.hour <= 16
        ? 40
        : 30;
  const trafficLevel = input.trafficDensity;
  const speedLevel = clamp(((input.avgSpeed - 20) / 80) * 100);
  const roadConditionLevel = { Good: 10, Fair: 35, Poor: 65, Damaged: 90 }[input.roadCondition];
  const weatherLevel = { Clear: 5, Cloudy: 15, 'Light rain': 50, 'Heavy rain': 85, Fog: 80 }[input.weather];
  const rainfallLevel = clamp((input.rainfall / 50) * 100);
  const historyLevel = clamp((input.historicalAccidents / 60) * 100);

  return [
    { key: 'hour', label: 'Time of day', valueLabel: `${input.hour}:00`, level: hourLevel, weight: 0, impact: hourLevel },
    { key: 'traffic', label: 'Traffic density', valueLabel: `${input.trafficDensity}%`, level: trafficLevel, weight: 0, impact: trafficLevel },
    { key: 'speed', label: 'Average speed', valueLabel: `${input.avgSpeed} km/h`, level: speedLevel, weight: 0, impact: speedLevel },
    { key: 'roadType', label: 'Road type', valueLabel: input.roadType, level: input.roadType === 'Junction or roundabout' ? 82 : input.roadType === 'National highway' ? 70 : input.roadType === 'State highway' ? 60 : 55, weight: 0, impact: 0 },
    { key: 'roadCondition', label: 'Road condition', valueLabel: input.roadCondition, level: roadConditionLevel, weight: 0, impact: roadConditionLevel },
    { key: 'rainfall', label: 'Rainfall', valueLabel: `${input.rainfall} mm/h`, level: rainfallLevel, weight: 0, impact: rainfallLevel },
    { key: 'weather', label: 'Weather', valueLabel: input.weather, level: weatherLevel, weight: 0, impact: weatherLevel },
    { key: 'history', label: 'Historical accidents', valueLabel: `${input.historicalAccidents} recorded`, level: historyLevel, weight: 0, impact: historyLevel },
  ];
}

interface BackendRiskResponse {
  prediction: number;
  accident_probability: number;
  risk_percentage: number;
  risk_level: 'Low' | 'Moderate' | 'High';
}

export async function predictRisk(input: RiskPredictionInput): Promise<RiskPredictionResult> {
  if (USE_MOCK) {
    await delay(1400);
    return computeMockPrediction(input);
  }

  const zone = BACKEND_ZONE_IDS[input.zoneId];
  if (!zone) throw new Error('The selected zone is not mapped to a trained TrichyGuard model zone.');

  const payload = {
    zone,
    hour: input.hour,
    weekday: BACKEND_WEEKDAYS[input.weekday],
    traffic_density: backendTrafficDensity(input.trafficDensity),
    average_speed: input.avgSpeed,
    road_type: backendRoadType(input.roadType),
    road_condition: backendRoadCondition(input.roadCondition),
    rainfall_mm: input.rainfall,
    weather: backendWeather(input.weather),
    historical_accident_count: input.historicalAccidents,
  };

  const backend = await http<BackendRiskResponse>('/api/risk/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const probability = Number(backend.risk_percentage);
  const level = backend.risk_level === 'Moderate' ? 'medium' : backend.risk_level.toLowerCase() as RiskPredictionResult['level'];

  return {
    probability,
    level,
    factors: conditionFactors(input),
    generatedAt: new Date().toISOString(),
    isMock: false,
    source: 'FastAPI · accident_risk_model.joblib',
  };
}





export async function predictFutureRisk(
  input: FutureRiskPredictionInput,
): Promise<FutureRiskPredictionResult> {
  const zone = BACKEND_ZONE_IDS[input.zoneId];

  if (!zone) {
    throw new Error(
      'The selected zone is not mapped to a trained TrichyGuard model zone.',
    );
  }

  return http<FutureRiskPredictionResult>('/api/risk/future', {
    method: 'POST',
    body: JSON.stringify({
      zone,
      date: input.date,
      hour: input.hour,
    }),
  });
}

export async function predictBatchRisk(
  input: BatchRiskPredictionInput,
): Promise<BatchRiskPredictionResult> {
  return http<BatchRiskPredictionResult>('/api/risk/batch', {
    method: 'POST',
    body: JSON.stringify({
      date: input.date,
      hour: input.hour,
    }),
  });
}



export async function classifyZone(
  input: ZoneClassificationInput,
): Promise<ZoneClassificationResult> {
  if (USE_MOCK) {
    await delay(1100);
    return computeMockClassification(input);
  }

  const backendZone = BACKEND_ZONE_IDS[input.zoneId];

  if (!backendZone) {
    throw new Error(
      'The selected zone is not mapped to a trained TrichyGuard model zone.',
    );
  }

  return http<ZoneClassificationResult>('/api/classify-zone', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      zoneId: backendZone,
    }),
  });
}




export async function fetchIncidents(): Promise<Incident[]> {
  if (USE_MOCK) {
    await delay(500);
    return INCIDENTS;
  }
  // TODO: replace with your risk-map / hotspot endpoint.
  return http<Incident[]>('/api/incidents');
}

export async function fetchHospitals(): Promise<Hospital[]> {
  if (USE_MOCK) {
    await delay(700);
    return HOSPITALS;
  }
  // TODO: replace with your hospital search endpoint.
  return http<Hospital[]>('/api/hospitals');
}

export async function searchNearbyHospitals(request: NearbySearchRequest, quick = false): Promise<HospitalWithDistance[]> {
  if (USE_MOCK) {
    await delay(quick ? 220 : 1000);
    return computeNearbyHospitals(request);
  }
  // TODO: match this path and payload to your hospital search endpoint.
  return http<HospitalWithDistance[]>('/api/hospitals/nearby', { method: 'POST', body: JSON.stringify(request) });
}

export async function findRoute(request: RouteRequest): Promise<RouteResult> {
  if (USE_MOCK) {
    await delay(1300);
    return computeMockRoute(request);
  }
  // TODO: match this path and payload to your ambulance routing endpoint.
  return http<RouteResult>('/api/ambulance-route', { method: 'POST', body: JSON.stringify(request) });
}



const BACKEND_WEATHER_ZONE_IDS: Record<string, string> = {
  srirangam: "Zone_1_Srirangam",
  cantonment: "Zone_2_Cantonment",
  "thillai-nagar": "Zone_3_ThillaiNagar",
  rockfort: "Zone_4_Rockfort",
  ariyamangalam: "Zone_5_Ariyamangalam",
};

export async function fetchWeather(zoneId: string): Promise<WeatherSnapshot> {
  if (USE_MOCK) {
    await delay(650);
    return buildWeather(zoneId);
  }

  const backendZone = BACKEND_WEATHER_ZONE_IDS[zoneId];

  if (!backendZone) {
    throw new Error(`Unknown frontend weather zone: ${zoneId}`);
  }

  return http<WeatherSnapshot>(
    `/api/weather?zone=${encodeURIComponent(backendZone)}`
  );
}





export async function fetchOverview(range: TrendRange): Promise<OverviewData> {
  if (USE_MOCK) {
    await delay(450);
    return buildOverview(range);
  }

  return http<OverviewData>(
    `/api/overview?range=${encodeURIComponent(range)}`
  );
}


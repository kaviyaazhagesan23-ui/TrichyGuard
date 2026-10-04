export type LatLngTuple = [number, number];
export type RiskLevel = 'low' | 'medium' | 'high';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

/* ----------------------------- Zones & incidents ---------------------------- */

export interface Zone {
  id: string;
  name: string;
  position: LatLngTuple;
  radiusM: number;
  /** Illustrative baseline risk score, 0-100. */
  baseRisk: number;
  riskLevel: RiskLevel;
  summary: string;
  characteristics: string[];
  sampleAccidents12m: number;
}

export interface Incident {
  id: string;
  zoneId: string;
  title: string;
  position: LatLngTuple;
  risk: RiskLevel;
  score: number;
  daysAgo: number;
  cause: string;
  timeBand: string;
}

/* ------------------------------ Risk prediction ----------------------------- */

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type RoadType =
  | 'National highway'
  | 'State highway'
  | 'Arterial road'
  | 'Urban street'
  | 'Junction or roundabout';
export type RoadCondition = 'Good' | 'Fair' | 'Poor' | 'Damaged';
export type WeatherCondition = 'Clear' | 'Cloudy' | 'Light rain' | 'Heavy rain' | 'Fog';

export interface RiskPredictionInput {
  zoneId: string;
  hour: number;
  weekday: Weekday;
  trafficDensity: number;
  avgSpeed: number;
  roadType: RoadType;
  roadCondition: RoadCondition;
  rainfall: number;
  weather: WeatherCondition;
  historicalAccidents: number;
}

export interface FactorContribution {
  key: string;
  label: string;
  valueLabel: string;
  /** How severe the selected condition is, 0-100. */
  level: number;
  weight: number;
  /** Points this condition adds to the final score. */
  impact: number;
}

export interface RiskPredictionResult {
  probability: number;
  level: RiskLevel;
  factors: FactorContribution[];
  generatedAt: string;
  /** True when the frontend is using local sample data; false for the FastAPI model. */
  isMock: boolean;
  source: string;
}

/* --------------------------- Zone classification --------------------------- */

export interface ZoneClassificationInput {
  zoneId: string;
  accidentsLast12m: number;
  trafficDensity: number;
  junctionCount: number;
  nightShare: number;
  speedLimit: number;
  hospitalWithin5km: boolean;
}

export interface ClassConfidence {
  level: RiskLevel;
  label: string;
  value: number;
}

export interface ZoneClassificationResult {
  zoneId: string;
  predicted: RiskLevel;
  confidence: ClassConfidence[];
  drivers: string[];
  isMock: boolean;
  source: string;
}

/* -------------------------------- Hospitals -------------------------------- */

export interface Hospital {
  id: string;
  name: string;
  address: string;
  position: LatLngTuple;
  phone: string | null;
  kind: 'Public' | 'Private';
  services: string[];
  /** Has an emergency department. */
  emergency: boolean;
  /** Open around the clock. */
  open24x7: boolean;
}

export interface HospitalWithDistance extends Hospital {
  distanceKm: number;
  /** Estimated travel time in minutes. */
  etaMin: number;
}

export interface NearbySearchRequest {
  center: LatLngTuple;
  radiusKm: number;
}

/* --------------------------------- Routing --------------------------------- */

export type RoutePriority = 'standard' | 'critical';

export interface RouteRequest {
  origin: { label: string; position: LatLngTuple };
  hospitalId: string;
  priority: RoutePriority;
}

export interface RouteStep {
  id: string;
  title: string;
  detail: string;
  distanceKm: number;
}

export interface RouteAlternative {
  hospitalId: string;
  name: string;
  distanceKm: number;
  etaMin: number;
}

export interface RouteResult {
  id: string;
  origin: { label: string; position: LatLngTuple };
  hospital: Hospital;
  priority: RoutePriority;
  path: LatLngTuple[];
  distanceKm: number;
  etaMin: number;
  steps: RouteStep[];
  alternatives: RouteAlternative[];
  isMock: boolean;
  source: string;
}

/* --------------------------------- Weather --------------------------------- */

export interface HourlyPoint {
  hour: string;
  temperature: number;
  rainfall: number;
  wind: number;
  humidity: number;
}

export interface DailyPoint {
  day: string;
  high: number;
  low: number;
  rainChance: number;
  condition: WeatherCondition;
}

export interface WeatherSnapshot {
  zoneId: string;
  updatedAt: string;
  condition: WeatherCondition;
  temperatureC: number;
  feelsLikeC: number;
  rainfallMm: number;
  windKmh: number;
  humidity: number;
  visibilityKm: number;
  pressureHpa: number;
  uvIndex: number;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  isMock: boolean;
}

/* -------------------------------- Overview --------------------------------- */

export type TrendRange = '7d' | '30d' | '12m';

export interface TrendPoint {
  label: string;
  accidents: number;
  highRisk: number;
}

export interface DistributionSlice {
  level: RiskLevel;
  label: string;
  value: number;
}

export interface OverviewStats {
  riskIndex: number;
  riskIndexDelta: number;
  monitoredZones: number;
  hospitals: number;
  avgEtaMin: number;
  etaDelta: number;
  riskSpark: number[];
  zoneSpark: number[];
  hospitalSpark: number[];
  etaSpark: number[];
}

export interface OverviewData {
  trend: TrendPoint[];
  distribution: DistributionSlice[];
  totalAccidents: number;
  stats: OverviewStats;
}

export interface ActivityItem {
  id: string;
  kind: 'prediction' | 'alert' | 'route' | 'weather' | 'zone';
  title: string;
  detail: string;
  minutesAgo: number;
  level?: RiskLevel;
  to: string;
}





export interface FutureRiskPredictionInput {
  zoneId: string;
  date: string;
  hour: number;
}

export interface EstimatedFutureFeatures {
  traffic_density: string;
  average_speed: number;
  traffic_match_type: string;
  traffic_records_used: number;
  road_type: string;
  road_condition: string;
  weather: string;
  rainfall_mm: number;
  weather_source: string;
  historical_accident_count: number;
}

export interface FutureRiskPredictionResult {
  zone: string;
  date: string;
  hour: number;
  weekday: string;
  prediction: number;
  accident_probability: number;
  risk_percentage: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  estimated_features: EstimatedFutureFeatures;
}

export interface BatchRiskPredictionInput {
  date: string;
  hour: number;
}

export interface BatchRiskPredictionResult {
  date: string;
  hour: number;
  results: FutureRiskPredictionResult[];
}
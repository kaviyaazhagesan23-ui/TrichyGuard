import type { RoadCondition, RoadType, SelectOption, Weekday, WeatherCondition } from '../types';

export const WEEKDAY_OPTIONS: SelectOption<Weekday>[] = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

export const ROAD_TYPE_OPTIONS: SelectOption<RoadType>[] = [
  { value: 'National highway', label: 'National highway', description: 'High-speed through traffic' },
  { value: 'State highway', label: 'State highway', description: 'Regional connector' },
  { value: 'Arterial road', label: 'Arterial road', description: 'Main city corridor' },
  { value: 'Urban street', label: 'Urban street', description: 'Local, mixed traffic' },
  { value: 'Junction or roundabout', label: 'Junction or roundabout', description: 'Conflict point' },
];

export const ROAD_CONDITION_OPTIONS: SelectOption<RoadCondition>[] = [
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Damaged', label: 'Damaged' },
];

export const WEATHER_OPTIONS: SelectOption<WeatherCondition>[] = [
  { value: 'Clear', label: 'Clear' },
  { value: 'Cloudy', label: 'Cloudy' },
  { value: 'Light rain', label: 'Light rain' },
  { value: 'Heavy rain', label: 'Heavy rain' },
  { value: 'Fog', label: 'Fog or haze' },
];

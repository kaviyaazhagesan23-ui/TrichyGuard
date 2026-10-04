import type { DailyPoint, HourlyPoint, WeatherCondition, WeatherSnapshot } from '../types';
import { clamp, hashString, mulberry32 } from '../lib/utils';

const round1 = (n: number): number => Math.round(n * 10) / 10;

function conditionFromRain(rain: number, humidity: number, roll: number): WeatherCondition {
  if (rain >= 3) return 'Heavy rain';
  if (rain > 0) return 'Light rain';
  if (humidity > 88) return 'Fog';
  return roll > 0.5 ? 'Cloudy' : 'Clear';
}

/** Generates a plausible-looking sample forecast. It is not real weather data. */
export function buildWeather(zoneId: string): WeatherSnapshot {
  const now = new Date();
  const startHour = now.getHours();
  const rand = mulberry32(hashString(`${zoneId}-${now.toDateString()}`));
  const zoneOffset = ((hashString(zoneId) % 7) - 3) * 0.3;
  const rainyDay = rand() > 0.45;

  const hourly: HourlyPoint[] = [];
  for (let i = 0; i < 24; i += 1) {
    const h = (startHour + i) % 24;
    const temperature = round1(29 + 5.5 * Math.sin(((h - 9) / 24) * Math.PI * 2) + zoneOffset + (rand() - 0.5));
    const rainfall = rainyDay && h >= 14 && h <= 20 ? round1(rand() * 6) : 0;
    const wind = round1(10 + 6 * Math.sin(((h - 13) / 24) * Math.PI * 2) + rand() * 3);
    const humidity = Math.round(clamp(88 - (temperature - 24) * 3.5 + (rainfall > 0 ? 8 : 0), 35, 98));
    hourly.push({
      hour: `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? 'PM' : 'AM'}`,
      temperature,
      rainfall,
      wind,
      humidity,
    });
  }

  const current = hourly[0];
  const daily: DailyPoint[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const chance = Math.round(rand() * 85);
    daily.push({
      day: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      high: Math.round(33 + rand() * 4 + zoneOffset),
      low: Math.round(24 + rand() * 3 + zoneOffset),
      rainChance: chance,
      condition: chance > 65 ? 'Heavy rain' : chance > 40 ? 'Light rain' : rand() > 0.5 ? 'Cloudy' : 'Clear',
    });
  }

  return {
    zoneId,
    updatedAt: now.toISOString(),
    condition: conditionFromRain(current.rainfall, current.humidity, rand()),
    temperatureC: current.temperature,
    feelsLikeC: round1(current.temperature + (current.humidity - 50) / 12),
    rainfallMm: current.rainfall,
    windKmh: current.wind,
    humidity: current.humidity,
    visibilityKm: current.rainfall > 3 ? 3.5 : current.rainfall > 0 ? 6 : 10,
    pressureHpa: Math.round(1008 + zoneOffset * 2),
    uvIndex: Math.round(clamp(9 * Math.sin(((startHour - 6) / 12) * Math.PI), 0, 10)),
    hourly,
    daily,
    isMock: true,
  };
}

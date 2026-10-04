import type { LatLngTuple, RiskLevel } from '../types';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Small deterministic PRNG so sample data stays stable between renders. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineKm(a: LatLngTuple, b: LatLngTuple): number {
  const earthRadiusKm = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(s));
}

export const RISK_META: Record<RiskLevel, { label: string; color: string; soft: string }> = {
  low: { label: 'Low risk', color: '#10B981', soft: '#D1FAE5' },
  medium: { label: 'Medium risk', color: '#F59E0B', soft: '#FEF3C7' },
  high: { label: 'High risk', color: '#FF5A4D', soft: '#FFE0DC' },
};

export function levelFromScore(score: number): RiskLevel {
  if (score >= 66) return 'high';
  if (score >= 36) return 'medium';
  return 'low';
}

export function formatMinutes(min: number): string {
  if (min < 1) return 'under 1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${suffix}`;
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function formatDateShort(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

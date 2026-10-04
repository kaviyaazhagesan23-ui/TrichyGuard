import type { LatLngTuple } from './types';

/** Flip to `false` (VITE_USE_MOCK=false) to call the FastAPI backend instead of the sample data. */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== 'false';

/** Base URL of the existing FastAPI backend. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/** Approximate centre of Tiruchirappalli. */
export const TRICHY_CENTER: LatLngTuple = [10.8, 78.7];

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Building2, Clock, HeartPulse, Hospital, LocateFixed, MapPin, Radar, Search, SearchX, Target } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import AnimatedNumber from '../components/AnimatedNumber';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import HospitalCard from '../components/HospitalCard';
import HospitalDetailsDialog from '../components/HospitalDetailsDialog';
import HospitalInfoCard from '../components/HospitalInfoCard';
import InteractiveMap, { type MapPoint, type MapRadius } from '../components/InteractiveMap';
import MapFab from '../components/MapFab';
import MapLegend from '../components/MapLegend';
import PageHeader from '../components/PageHeader';
import SegmentedControl from '../components/SegmentedControl';
import { Skeleton } from '../components/LoadingSkeleton';
import { ZONES, getZone } from '../data/zones';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../lib/utils';
import * as api from '../services/api';
import type { HospitalWithDistance, LatLngTuple, SelectOption } from '../types';

type SortKey = 'distance' | 'time';
type Status = 'loading' | 'done' | 'error';

interface AppliedSearch {
  center: LatLngTuple;
  radiusKm: number;
  label: string;
  runKey: number;
}

interface Filters {
  emergency: boolean;
  government: boolean;
  private: boolean;
  open24x7: boolean;
}

const NO_FILTERS: Filters = { emergency: false, government: false, private: false, open24x7: false };
const PRESETS = [2, 5, 10, 15];
const MIN_RADIUS = 0.5;
const MAX_RADIUS = 25;

const FILTER_CHIPS: { key: keyof Filters; label: string; icon: typeof HeartPulse; on: string }[] = [
  { key: 'emergency', label: 'Emergency Available', icon: HeartPulse, on: 'from-coral-500 to-orange-400' },
  { key: 'government', label: 'Government', icon: Building2, on: 'from-emerald-500 to-teal-400' },
  { key: 'private', label: 'Private', icon: Building2, on: 'from-violet-500 to-fuchsia-500' },
  { key: 'open24x7', label: '24/7', icon: Clock, on: 'from-cyan2-500 to-brand-500' },
];

function circleBounds(center: LatLngTuple, radiusKm: number): LatLngTuple[] {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((center[0] * Math.PI) / 180));
  return [
    [center[0] + dLat, center[1]],
    [center[0] - dLat, center[1]],
    [center[0], center[1] + dLng],
    [center[0], center[1] - dLng],
  ];
}

export default function HospitalSearch() {
  const mapRef = useRef<LeafletMap | null>(null);
  const requestId = useRef(0);
  const runCounter = useRef(0);
  const mounted = useRef(false);

  const [locationId, setLocationId] = useState<string>('srirangam');
  const [custom, setCustom] = useState<{ position: LatLngTuple; label: string } | null>(null);
  const [radiusText, setRadiusText] = useState('5');
  const [radiusError, setRadiusError] = useState<string | undefined>();
  const [geoError, setGeoError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>('distance');
  const [status, setStatus] = useState<Status>('loading');
  const [results, setResults] = useState<HospitalWithDistance[]>([]);
  const [applied, setApplied] = useState<AppliedSearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [fitNonce, setFitNonce] = useState(0);

  const debouncedRadius = useDebounce(radiusText, 450);

  const locationOptions: SelectOption[] = useMemo(() => {
    const base: SelectOption[] = ZONES.map((z) => ({ value: z.id, label: z.name }));
    return custom ? [...base, { value: 'custom', label: custom.label }] : base;
  }, [custom]);

  const currentCenter = (): { position: LatLngTuple; label: string } | null => {
    if (locationId === 'custom' && custom) return custom;
    const zone = getZone(locationId);
    return zone ? { position: zone.position, label: zone.name } : null;
  };

  const parseRadius = (text: string): number | null => {
    const value = Number(text);
    if (text.trim() === '' || Number.isNaN(value) || value < MIN_RADIUS || value > MAX_RADIUS) return null;
    return value;
  };

  /** `full` plays the loading state and radius expansion; otherwise the circle and results update in place. */
  const runSearch = async (full: boolean, radiusOverride?: string) => {
    const text = radiusOverride ?? radiusText;
    const radiusKm = parseRadius(text);
    if (radiusKm === null) {
      setRadiusError(`Enter a radius between ${MIN_RADIUS} and ${MAX_RADIUS} km.`);
      if (full) document.getElementById('hs-radius')?.focus();
      return;
    }
    const where = currentCenter();
    if (!where) return;
    setRadiusError(undefined);

    const id = ++requestId.current;
    if (full) {
      setStatus('loading');
      setApplied(null);
      setSelectedId(null);
    }
    try {
      const list = await api.searchNearbyHospitals({ center: where.position, radiusKm }, !full);
      if (id !== requestId.current) return;
      if (full) runCounter.current += 1;
      setResults(list);
      setApplied({ center: where.position, radiusKm, label: where.label, runKey: runCounter.current });
      setStatus('done');
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'The search could not be completed.');
      setStatus('error');
    }
  };

  // First search on arrival.
  useEffect(() => {
    void runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new location restarts the animated search.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    void runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, custom]);

  // A changed radius updates the search area and results in place.
  useEffect(() => {
    if (!applied) return;
    const value = parseRadius(debouncedRadius);
    if (value === null) {
      setRadiusError(`Enter a radius between ${MIN_RADIUS} and ${MAX_RADIUS} km.`);
      return;
    }
    if (value === applied.radiusKm) return;
    void runSearch(false, debouncedRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRadius]);

  const shown = useMemo(() => {
    const typeFilterOn = filters.government || filters.private;
    const list = results.filter((h) => {
      if (filters.emergency && !h.emergency) return false;
      if (filters.open24x7 && !h.open24x7) return false;
      if (typeFilterOn) {
        const okGov = filters.government && h.kind === 'Public';
        const okPriv = filters.private && h.kind === 'Private';
        if (!okGov && !okPriv) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => (sort === 'distance' ? a.distanceKm - b.distanceKm : a.etaMin - b.etaMin || a.distanceKm - b.distanceKm));
  }, [results, filters, sort]);

  const filtersActive = Object.values(filters).some(Boolean);
  const selected = shown.find((h) => h.id === selectedId) ?? null;
  const detailsHospital = results.find((h) => h.id === detailsId) ?? null;

  useEffect(() => {
    if (selectedId) document.getElementById(`hospital-card-${selectedId}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const radius: MapRadius | null = applied ? { center: applied.center, radiusKm: applied.radiusKm, runKey: applied.runKey } : null;

  const points: MapPoint[] = useMemo(() => {
    if (!applied) return [];
    const origin: MapPoint = {
      id: 'search-location',
      position: applied.center,
      color: '#7C4DFF',
      label: applied.label,
      kind: 'location',
      emphasis: true,
    };
    const hospitals: MapPoint[] = shown.map((h) => ({
      id: h.id,
      position: h.position,
      color: h.emergency ? '#FF5A4D' : '#06B6D4',
      label: h.name,
      kind: 'hospital',
      popup: <HospitalInfoCard hospital={h} origin={applied.center} onDetails={setDetailsId} />,
    }));
    return [origin, ...hospitals];
  }, [applied, shown]);

  const fit = applied
    ? { key: `${applied.runKey}-${applied.radiusKm}-${fitNonce}`, positions: circleBounds(applied.center, applied.radiusKm) }
    : undefined;
  const focus = selected ? { key: selected.id, position: selected.position } : null;

  const toggleFilter = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);
        setCustom({ position: [pos.coords.latitude, pos.coords.longitude], label: 'Your location' });
        setLocationId('custom');
      },
      () => setGeoError('We could not read your location. Check your browser permissions.'),
      { timeout: 8000 },
    );
  };

  const nextPreset = PRESETS.find((p) => applied && p > applied.radiusKm);

  return (
    <div>
      <PageHeader
        title="Hospital Search"
        description="Choose a location and a radius to find hospitals within reach, sorted by distance, with travel times and emergency availability."
        icon={Hospital}
      />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(true);
        }}
        className="surface mb-6 p-5 sm:p-6"
        aria-label="Nearby hospital search"
      >
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_auto] md:items-start">
          <FormField id="hs-location" label="Location" hint="Pick a zone, drop a pin on the map, or use your own location.">
            <CustomSelect id="hs-location" value={locationId} options={locationOptions} onChange={setLocationId} />
          </FormField>

          <FormField id="hs-radius" label="Search radius" error={radiusError}>
            <div className="flex gap-2">
              <input
                id="hs-radius"
                type="number"
                inputMode="decimal"
                min={MIN_RADIUS}
                max={MAX_RADIUS}
                step={0.5}
                value={radiusText}
                onChange={(e) => setRadiusText(e.target.value)}
                aria-invalid={Boolean(radiusError) || undefined}
                aria-describedby={radiusError ? 'hs-radius-error' : undefined}
                className={cn('input', radiusError && 'input-error')}
              />
              <SegmentedControl id="hs-unit" ariaLabel="Distance unit" value="km" options={[{ value: 'km', label: 'km' }]} onChange={() => undefined} />
            </div>
          </FormField>

          <div className="md:pt-[1.7rem]">
            <Button type="submit" loading={status === 'loading'} icon={<Radar className="h-4 w-4" aria-hidden="true" />} className="w-full !py-2.5 md:w-auto">
              {status === 'loading' ? 'Searching' : 'Find Nearby Hospitals'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-500">Quick radius</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRadiusText(String(p))}
              aria-pressed={radiusText === String(p)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset transition-all',
                radiusText === String(p) ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white ring-transparent shadow-tile' : 'bg-white text-ink-600 ring-ink-200 hover:ring-brand-300',
              )}
            >
              {p} km
            </button>
          ))}
          <button type="button" onClick={useMyLocation} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50">
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            Use my location
          </button>
        </div>
        {geoError && (
          <p role="alert" className="mt-2 text-xs font-medium text-coral-600">
            {geoError}
          </p>
        )}
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {FILTER_CHIPS.map((chip) => {
          const on = filters[chip.key];
          return (
            <motion.button
              key={chip.key}
              type="button"
              whileTap={{ scale: 0.95 }}
              aria-pressed={on}
              onClick={() => toggleFilter(chip.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ring-inset transition-all',
                on ? `bg-gradient-to-r ${chip.on} text-white ring-transparent shadow-tile` : 'bg-white/90 text-ink-600 ring-ink-200 hover:ring-brand-300',
              )}
            >
              <chip.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {chip.label}
            </motion.button>
          );
        })}
        {filtersActive && (
          <button type="button" onClick={() => setFilters(NO_FILTERS)} className="px-2 text-xs font-semibold text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline">
            Clear filters
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-500">Sort by</span>
          <SegmentedControl
            id="hs-sort"
            ariaLabel="Sort results"
            size="sm"
            value={sort}
            options={[
              { value: 'distance', label: 'Distance' },
              { value: 'time', label: 'Travel time' },
            ]}
            onChange={setSort}
          />
        </div>
      </div>

      <div className="mb-4 min-h-[2rem]" aria-live="polite">
        {status === 'done' && applied && (
          <motion.p key={`${applied.runKey}-${applied.radiusKm}-${shown.length}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
            <span className="text-gradient">
              <AnimatedNumber value={shown.length} />
            </span>{' '}
            {shown.length === 1 ? 'hospital' : 'hospitals'} found within {applied.radiusKm} km
            <span className="text-base font-semibold text-ink-500"> of {applied.label}</span>
            {filtersActive && results.length !== shown.length && <span className="ml-2 text-sm font-medium text-ink-400">({results.length} before filters)</span>}
          </motion.p>
        )}
        {status === 'loading' && (
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-500" role="status">
            <Radar className="h-4 w-4 animate-spin text-violet-500" aria-hidden="true" />
            Scanning for hospitals near {currentCenter()?.label ?? 'your location'}…
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="order-2 space-y-4 xl:order-1">
          {status === 'loading' && (
            <div className="space-y-4" role="status" aria-label="Searching">
              {[0, 1, 2].map((i) => (
                <div key={i} className="surface space-y-3 p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-2/3" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-16 rounded-2xl" />
                    <Skeleton className="h-16 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="surface">
              <EmptyState
                tone="error"
                icon={AlertTriangle}
                title="The search didn't finish"
                description={error ?? 'Something went wrong while looking for hospitals.'}
                action={<Button onClick={() => void runSearch(true)}>Try again</Button>}
              />
            </div>
          )}

          {status === 'done' && applied && shown.length === 0 && (
            <div className="surface">
              {results.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title={`No hospitals within ${applied.radiusKm} km`}
                  description={`Nothing was found near ${applied.label}. Try a wider radius or a different location.`}
                  action={
                    nextPreset ? (
                      <Button
                        onClick={() => {
                          setRadiusText(String(nextPreset));
                        }}
                        icon={<Target className="h-4 w-4" aria-hidden="true" />}
                      >
                        Search within {nextPreset} km
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="No hospitals match these filters"
                  description={`${results.length} ${results.length === 1 ? 'hospital is' : 'hospitals are'} inside the radius, but none meet every filter you chose.`}
                  action={<Button onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>}
                />
              )}
            </div>
          )}

          {status === 'done' && applied && shown.length > 0 && (
            <div key={applied.runKey} className="grid gap-4">
              <AnimatePresence>
                {shown.map((h, i) => (
                  <HospitalCard key={h.id} hospital={h} rank={i + 1} origin={applied.center} selected={h.id === selectedId} onSelect={setSelectedId} onDetails={setDetailsId} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="order-1 xl:order-2">
          <div className="xl:sticky xl:top-24">
            <InteractiveMap
              ariaLabel="Map of the search area with hospital markers"
              height="min(680px, 78vh)"
              ref={mapRef}
              zoom={13}
              points={points}
              radius={radius}
              selectedPointId={selectedId}
              animateKey={applied?.runKey ?? 0}
              onPointSelect={setSelectedId}
              onMapClick={(pos) => {
                setCustom({ position: pos, label: 'Pinned location' });
                setLocationId('custom');
              }}
              fit={fit}
              focus={focus}
              scrollWheelZoom
            >
              <MapLegend
                title="Legend"
                items={[
                  { label: 'Search location', color: '#7C4DFF' },
                  { label: 'Emergency hospital', color: '#FF5A4D', shape: 'square' },
                  { label: 'Other hospital', color: '#06B6D4', shape: 'square' },
                  { label: 'Search radius', color: '#C4B5FD' },
                ]}
              />
              <div className="absolute right-3 top-40 z-10 flex flex-col gap-2 sm:top-44">
                <MapFab label="Fit the search area" icon={<Target className="h-5 w-5" aria-hidden="true" />} onClick={() => setFitNonce((n) => n + 1)} />
                <MapFab label="Use my location" icon={<LocateFixed className="h-5 w-5" aria-hidden="true" />} onClick={useMyLocation} />
              </div>
              <AnimatePresence>
                {status === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[2px]"
                    role="status"
                  >
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-700 shadow-lift">
                      <Radar className="h-5 w-5 animate-spin text-violet-500" aria-hidden="true" />
                      Searching nearby hospitals
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-ink-600 shadow-soft">
                  <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
                  Click the map to search from another point
                </span>
              </div>
            </InteractiveMap>
          </div>
        </div>
      </div>

      <HospitalDetailsDialog hospital={detailsHospital} origin={applied?.center ?? ZONES[0].position} onClose={() => setDetailsId(null)} />
    </div>
  );
}

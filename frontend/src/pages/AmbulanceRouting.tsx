import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Ambulance, MapPin, Navigation, Phone, Route as RouteIcon, Siren, Target } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import HospitalBadges from '../components/HospitalBadges';
import InteractiveMap, { type MapPoint } from '../components/InteractiveMap';
import MapFab from '../components/MapFab';
import MapLegend from '../components/MapLegend';
import PageHeader from '../components/PageHeader';
import RouteSummary from '../components/RouteSummary';
import SegmentedControl from '../components/SegmentedControl';
import { Skeleton } from '../components/LoadingSkeleton';
import { ZONES, getZone } from '../data/zones';
import { useAsync } from '../hooks/useAsync';
import { formatMinutes } from '../lib/utils';
import * as api from '../services/api';
import type { LatLngTuple, RoutePriority, RouteResult, SelectOption } from '../types';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PRIORITY_OPTIONS: { value: RoutePriority; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'critical', label: 'Critical' },
];

function parseParam(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function AmbulanceRouting() {
  const [params] = useSearchParams();
  const mapRef = useRef<LeafletMap | null>(null);
  const requestId = useRef(0);
  const hospitals = useAsync(() => api.fetchHospitals(), []);

  const startLat = parseParam(params.get('lat'));
  const startLng = parseParam(params.get('lng'));
  const startZone = params.get('zone');
  const hasCustomStart = startLat !== null && startLng !== null;

  const [originId, setOriginId] = useState<string>(hasCustomStart ? 'custom' : startZone && getZone(startZone) ? startZone : '');
  const [custom, setCustom] = useState<LatLngTuple | null>(hasCustomStart ? [startLat as number, startLng as number] : null);
  const [hospitalId, setHospitalId] = useState<string>(params.get('hospital') ?? 'nearest');
  const [priority, setPriority] = useState<RoutePriority>('standard');
  const [status, setStatus] = useState<Status>('idle');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [fitNonce, setFitNonce] = useState(0);

  const originOptions: SelectOption[] = useMemo(() => {
    const base: SelectOption[] = ZONES.map((z) => ({ value: z.id, label: z.name }));
    return custom ? [...base, { value: 'custom', label: 'Pinned location' }] : base;
  }, [custom]);

  const hospitalOptions: SelectOption[] = useMemo(
    () => [{ value: 'nearest', label: 'Nearest hospital (automatic)' }, ...(hospitals.data ?? []).map((h) => ({ value: h.id, label: h.name }))],
    [hospitals.data],
  );

  const origin = (): { label: string; position: LatLngTuple } | null => {
    if (originId === 'custom' && custom) return { label: 'Pinned location', position: custom };
    const zone = getZone(originId);
    return zone ? { label: zone.name, position: zone.position } : null;
  };
  const currentOrigin = origin();

  const run = async (overrideHospital?: string) => {
    const where = origin();
    if (!where) {
      setFormError('Choose the accident location, or click the map to drop a pin.');
      document.getElementById('ar-origin')?.focus();
      return;
    }
    setFormError(undefined);
    const targetHospital = overrideHospital ?? hospitalId;
    if (overrideHospital) setHospitalId(overrideHospital);
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    try {
      const result = await api.findRoute({ origin: where, hospitalId: targetHospital, priority });
      if (id !== requestId.current) return;
      setRoute(result);
      setStatus('success');
      setFitNonce((n) => n + 1);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'The route could not be calculated.');
      setStatus('error');
    }
  };

  // Arriving from a hospital card or the risk map with a start point: calculate straight away.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (originId && (params.get('hospital') || hasCustomStart)) {
      autoRan.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points: MapPoint[] = useMemo(() => {
    const list: MapPoint[] = (hospitals.data ?? []).map((h) => ({
      id: h.id,
      position: h.position,
      color: route && route.hospital.id === h.id ? '#10B981' : h.emergency ? '#FF5A4D' : '#06B6D4',
      label: h.name,
      kind: 'hospital',
      emphasis: Boolean(route && route.hospital.id === h.id),
    }));
    if (currentOrigin) list.push({ id: 'origin', position: currentOrigin.position, color: '#7C4DFF', label: `Accident location: ${currentOrigin.label}`, kind: 'origin', emphasis: true });
    return list;
  }, [hospitals.data, route, currentOrigin]);

  const fit = route
    ? { key: `${route.id}-${fitNonce}`, positions: [route.origin.position, route.hospital.position] }
    : currentOrigin
      ? { key: `origin-${currentOrigin.position[0]}-${currentOrigin.position[1]}`, positions: [currentOrigin.position] }
      : { key: 'zones', positions: ZONES.map((z) => z.position) };

  const selectHospitalOnMap = (id: string) => {
    setHospitalId(id);
    setRoute(null);
    setStatus('idle');
  };

  return (
    <div>
      <PageHeader
        title="Ambulance Routing"
        description="Choose where the accident happened and which hospital to reach. TrichyGuard calculates the distance, travel time and path."
        icon={Ambulance}
      />

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
            className="surface space-y-5 p-5 sm:p-6"
            aria-label="Route request"
          >
            <h2 className="text-lg font-semibold">Route details</h2>
            <FormField id="ar-origin" label="Accident location" required error={formError} hint="Or click anywhere on the map to drop a pin.">
              <CustomSelect
                id="ar-origin"
                value={originId}
                options={originOptions}
                placeholder="Choose a zone"
                onChange={(v) => {
                  setOriginId(v);
                  setFormError(undefined);
                }}
                invalid={Boolean(formError)}
                describedBy={formError ? 'ar-origin-error' : undefined}
              />
            </FormField>
            <FormField id="ar-hospital" label="Destination hospital">
              <CustomSelect id="ar-hospital" value={hospitalId} options={hospitalOptions} onChange={setHospitalId} disabled={hospitals.loading} placeholder="Loading hospitals" />
            </FormField>
            <FormField id="ar-priority-0" label="Priority" tip="Critical priority assumes faster travel with emergency clearance.">
              <SegmentedControl id="ar-priority" ariaLabel="Route priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
            </FormField>
            <Button type="submit" loading={status === 'loading'} icon={<Navigation className="h-4 w-4" aria-hidden="true" />} className="w-full !py-3">
              {status === 'loading' ? 'Finding route' : 'Find Route'}
            </Button>
          </motion.form>

          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface space-y-3 p-5" role="status">
                  <Skeleton className="h-6 w-40" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface">
                  <EmptyState tone="error" icon={AlertTriangle} title="No route yet" description={error ?? 'The route could not be calculated.'} action={<Button onClick={() => void run()}>Try again</Button>} />
                </motion.div>
              )}
              {status === 'success' && route && (
                <motion.div key={route.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <RouteSummary route={route} />
                </motion.div>
              )}
              {status === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface">
                  <EmptyState icon={RouteIcon} title="Plan a route" description="Pick the accident location and press Find Route to see the path, distance and travel time." className="py-10" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <InteractiveMap
            ref={mapRef}
            ariaLabel="Map showing the accident location, hospitals and the planned route"
            height="min(560px, 70vh)"
            zoom={13}
            points={points}
            paths={route ? [{ id: route.id, positions: route.path, color: priority === 'critical' ? '#FF5A4D' : '#2F5BFF', animated: true }] : []}
            movingPath={route ? route.path : undefined}
            selectedPointId={route?.hospital.id ?? null}
            animateKey={route?.id ?? 'idle'}
            onPointSelect={(id) => {
              if (id !== 'origin') selectHospitalOnMap(id);
            }}
            onMapClick={(pos) => {
              setCustom(pos);
              setOriginId('custom');
              setFormError(undefined);
              setRoute(null);
              setStatus('idle');
            }}
            fit={fit}
            scrollWheelZoom
          >
            <MapLegend
              title="Legend"
              items={[
                { label: 'Accident location', color: '#7C4DFF', shape: 'square' },
                { label: 'Emergency hospital', color: '#FF5A4D', shape: 'square' },
                { label: 'Other hospital', color: '#06B6D4', shape: 'square' },
                { label: 'Destination', color: '#10B981', shape: 'square' },
              ]}
            />
            <div className="absolute right-3 top-44 z-10 flex flex-col gap-2">
              <MapFab label="Fit the route" icon={<Target className="h-5 w-5" aria-hidden="true" />} onClick={() => setFitNonce((n) => n + 1)} />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-ink-600 shadow-soft">
                <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Click the map to set the accident location
              </span>
            </div>
          </InteractiveMap>

          <AnimatePresence>
            {status === 'success' && route && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6 lg:grid-cols-2">
                <section className="surface p-5 sm:p-6" aria-labelledby="ar-hospital-title">
                  <h2 id="ar-hospital-title" className="text-lg font-semibold">
                    Destination hospital
                  </h2>
                  <h3 className="mt-3 text-base font-bold">{route.hospital.name}</h3>
                  <p className="mt-0.5 flex items-start gap-1.5 text-sm text-ink-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {route.hospital.address}
                  </p>
                  <HospitalBadges hospital={route.hospital} className="mt-3" />
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {route.hospital.services.map((s) => (
                      <li key={s} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {route.hospital.phone ? (
                      <a href={`tel:${route.hospital.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        {route.hospital.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-ink-400">Phone number not listed</span>
                    )}
                    <Link to="/hospital-search" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Search other hospitals
                    </Link>
                  </div>
                </section>

                <section className="surface p-5 sm:p-6" aria-labelledby="ar-alt-title">
                  <h2 id="ar-alt-title" className="flex items-center gap-2 text-lg font-semibold">
                    <Siren className="h-4 w-4 text-coral-500" aria-hidden="true" />
                    Other options
                  </h2>
                  <p className="text-sm text-ink-500">Choose another hospital to update the route.</p>
                  <ul className="mt-3 space-y-2">
                    {route.alternatives.map((alt) => (
                      <li key={alt.hospitalId}>
                        <button
                          type="button"
                          onClick={() => void run(alt.hospitalId)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/80 p-3 text-left ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink-800">{alt.name}</span>
                            <span className="block text-xs text-ink-500">{alt.distanceKm.toFixed(1)} km</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{formatMinutes(alt.etaMin)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

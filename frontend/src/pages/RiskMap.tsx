import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ambulance,
  CalendarDays,
  Filter,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  SearchX,
  Target,
  X,
} from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';

import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import InteractiveMap, {
  type MapArea,
  type MapPoint,
} from '../components/InteractiveMap';
import MapFab from '../components/MapFab';
import MapLegend from '../components/MapLegend';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import { Skeleton } from '../components/LoadingSkeleton';
import { ZONES, getZone } from '../data/zones';
import { useAsync } from '../hooks/useAsync';
import { RISK_META, formatDateShort } from '../lib/utils';
import * as api from '../services/api';
import type { Incident, RiskLevel, SelectOption } from '../types';

type RangeKey = 'all';

const RANGE_OPTIONS: SelectOption<RangeKey>[] = [
  { value: 'all', label: 'All time' },
];

const ZONE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All zones' },
];

const LEVELS: RiskLevel[] = ['high', 'medium', 'low'];

export default function RiskMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const incidents = useAsync(() => api.fetchIncidents(), []);

  const [range, setRange] = useState<RangeKey>('all');
  const [zoneId, setZoneId] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitNonce, setFitNonce] = useState(0);

  const all: Incident[] = incidents.data ?? [];

  const filtered = useMemo(
    () =>
      all.filter(
        (i) => zoneId === 'all' || i.zoneId === zoneId,
      ),
    [all, zoneId],
  );

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    filtered.forEach((i) => {
      c[i.risk] += 1;
    });

    return c;
  }, [filtered]);

  const selected =
    filtered.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    if (
      selectedId &&
      !filtered.some((i) => i.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (
      selected &&
      window.innerWidth < 1280
    ) {
      panelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selected]);

  const areas: MapArea[] = useMemo(
    () =>
      ZONES.filter(
        (z) => zoneId === 'all' || z.id === zoneId,
      ).map((z) => ({
        id: z.id,
        center: z.position,
        radiusM: z.radiusM,
        color: RISK_META[z.riskLevel].color,
        label: `${z.name}: ${RISK_META[z.riskLevel].label}`,
        selected: z.id === zoneId,
      })),
    [zoneId],
  );

  const points: MapPoint[] = useMemo(
    () =>
      filtered.map((i) => ({
        id: i.id,
        position: i.position,
        color: RISK_META[i.risk].color,
        label: i.title,
        popup: (
          <div className="space-y-2 p-4">
            <RiskBadge level={i.risk} />

            <h3 className="text-sm font-semibold leading-snug">
              {i.title}
            </h3>

            <p className="text-xs text-ink-500">
              {i.cause} · {i.timeBand}
            </p>

            <button
              type="button"
              onClick={() => setSelectedId(i.id)}
              className="btn-primary !px-3 !py-1.5 !text-xs"
            >
              View details
            </button>
          </div>
        ),
      })),
    [filtered],
  );

  const fitPositions =
    filtered.length > 0
      ? filtered.map((i) => i.position)
      : ZONES.map((z) => z.position);

  const fitKey = `${zoneId}-${range}-${fitNonce}-${incidents.loading ? 'l' : 'r'}`;

  const resetFilters = () => {
    setRange('all');
    setZoneId('all');
    setSelectedId(null);
  };

  const topIncidents = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [filtered],
  );

  return (
    <div>
      <PageHeader
        title="Risk Map"
        description="Explore recorded risk points and zone risk levels across Srirangam, Cantonment, Thillai Nagar, Rockfort and Ariyamangalam."
        icon={MapIcon}
      />

      <section
        className="surface relative z-[1000] mb-6 overflow-visible p-5 sm:p-6"
        aria-label="Map filters"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Filter
              className="h-4 w-4 text-brand-500"
              aria-hidden="true"
            />
            Filters
          </h2>

          <Button
            variant="ghost"
            onClick={resetFilters}
            icon={
              <RotateCcw
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
            className="!py-2 !text-xs"
          >
            Reset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="rm-zone" label="Zone">
            <CustomSelect
              id="rm-zone"
              value={zoneId}
              options={ZONE_FILTER_OPTIONS}
              onChange={setZoneId}
            />
          </FormField>

          <FormField id="rm-range" label="Date range">
            <CustomSelect
              id="rm-range"
              value={range}
              options={RANGE_OPTIONS}
              onChange={setRange}
            />
          </FormField>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <InteractiveMap
          ref={mapRef}
          ariaLabel="Accident risk map with markers and zones"
          height="min(640px, 74vh)"
          zoom={13}
          areas={areas}
          points={points}
          selectedPointId={selectedId}
          animateKey={`${zoneId}-${range}`}
          onPointSelect={setSelectedId}
          onAreaSelect={(id) =>
            setZoneId((cur) =>
              cur === id ? 'all' : id,
            )
          }
          fit={{
            key: fitKey,
            positions: fitPositions,
          }}
          focus={
            selected
              ? {
                  key: selected.id,
                  position: selected.position,
                }
              : null
          }
          scrollWheelZoom
        >
          <MapLegend
            title="Risk level"
            items={[
              {
                label: 'High risk',
                color: RISK_META.high.color,
              },
              {
                label: 'Medium risk',
                color: RISK_META.medium.color,
              },
              {
                label: 'Low risk',
                color: RISK_META.low.color,
              },
              {
                label: 'Zone area (dashed)',
                color: '#A5B4FC',
                shape: 'square',
              },
            ]}
          />

          <div className="absolute right-3 top-44 z-10 flex flex-col gap-2">
            <MapFab
              label="Fit the visible markers"
              icon={
                <Target
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              }
              onClick={() =>
                setFitNonce((n) => n + 1)
              }
            />
          </div>

          {incidents.loading && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
              role="status"
            >
              <div className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink-700 shadow-lift">
                Loading risk points…
              </div>
            </div>
          )}

          <AnimatePresence>
            {!incidents.loading &&
              filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center p-4"
                >
                  <div className="surface max-w-sm">
                    <EmptyState
                      icon={SearchX}
                      title="No risk points match"
                      description="No recorded accident points are available for the selected zone."
                      action={
                        <Button onClick={resetFilters}>
                          Reset filters
                        </Button>
                      }
                    />
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </InteractiveMap>

        <aside
          ref={panelRef}
          className="surface p-5 sm:p-6"
          aria-label="Marker details"
          aria-live="polite"
        >
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{
                  opacity: 0,
                  x: 16,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -16,
                }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <RiskBadge
                    level={selected.risk}
                    size="md"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId(null)
                    }
                    aria-label="Close details"
                    className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  >
                    <X
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <h2 className="text-xl font-bold leading-snug">
                  {selected.title}
                </h2>

                <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-violet-50 to-fuchsia-50 p-4 text-center">
                  <p className="font-display text-4xl font-extrabold text-ink-900">
                    {selected.score}
                  </p>

                  <p className="text-xs font-semibold text-ink-500">
                    Risk score out of 100
                  </p>
                </div>

                <dl className="space-y-2.5 text-sm">
                  {[
                    {
                      icon: MapPin,
                      label: 'Zone',
                      value:
                        getZone(selected.zoneId)
                          ?.name ?? '',
                    },
                    {
                      icon: CalendarDays,
                      label: 'Recorded',
                      value: `${formatDateShort(
                        selected.daysAgo,
                      )} (${
                        selected.daysAgo === 0
                          ? 'today'
                          : `${selected.daysAgo} days ago`
                      })`,
                    },
                    {
                      icon: LocateFixed,
                      label: 'Coordinates',
                      value: `${selected.position[0].toFixed(
                        4,
                      )}, ${selected.position[1].toFixed(
                        4,
                      )}`,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-start gap-3"
                    >
                      <row.icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-ink-400"
                        aria-hidden="true"
                      />

                      <div>
                        <dt className="text-xs text-ink-400">
                          {row.label}
                        </dt>

                        <dd className="font-semibold text-ink-800">
                          {row.value}
                        </dd>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
                      {selected.cause}
                    </span>

                    <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
                      {selected.timeBand}
                    </span>
                  </div>
                </dl>

                <Link
                  to={`/ambulance-routing?lat=${selected.position[0].toFixed(
                    5,
                  )}&lng=${selected.position[1].toFixed(
                    5,
                  )}`}
                  className="btn-primary w-full"
                >
                  <Ambulance
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Plan an ambulance route
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold">
                    Visible risk points
                  </h2>

                  <p className="text-sm text-ink-500">
                    Select a marker or an item below to
                    see its details.
                  </p>
                </div>

                {incidents.loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {LEVELS.map((l) => (
                        <div
                          key={l}
                          className="rounded-2xl p-3 text-white shadow-tile"
                          style={{
                            backgroundColor:
                              RISK_META[l].color,
                          }}
                        >
                          <p className="font-display text-2xl font-extrabold">
                            {counts[l]}
                          </p>

                          <p className="text-[11px] font-semibold opacity-95">
                            {RISK_META[l].label.replace(
                              ' risk',
                              '',
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    {topIncidents.length > 0 ? (
                      <ul className="space-y-1.5">
                        {topIncidents.map((i) => (
                          <li key={i.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedId(i.id)
                              }
                              className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-ink-50"
                            >
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    RISK_META[i.risk]
                                      .color,
                                }}
                                aria-hidden="true"
                              />

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-ink-800">
                                  {i.title}
                                </span>

                                <span className="block text-xs text-ink-400">
                                  Score {i.score}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-500">
                        No recorded accident points
                        are available for the selected
                        zone.
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
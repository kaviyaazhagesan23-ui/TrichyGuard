import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, LayoutGrid, RotateCcw, ScanSearch } from 'lucide-react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import InteractiveMap, { type MapArea } from '../components/InteractiveMap';
import MapLegend from '../components/MapLegend';
import PageHeader from '../components/PageHeader';
import RangeField from '../components/RangeField';
import RiskBadge from '../components/RiskBadge';
import Switch from '../components/Switch';
import { Skeleton } from '../components/LoadingSkeleton';
import { ZONES, getZone } from '../data/zones';
import { RISK_META } from '../lib/utils';
import * as api from '../services/api';
import type { RiskLevel, SelectOption, ZoneClassificationInput, ZoneClassificationResult } from '../types';

interface FormState {
  zoneId: string;
  accidents: string;
  trafficDensity: number;
  junctionCount: string;
  nightShare: number;
  speedLimit: number;
  hospitalWithin5km: boolean;
}

const ZONE_OPTIONS: SelectOption[] = ZONES.map((z) => ({ value: z.id, label: z.name }));

function defaultsFor(zoneId: string): FormState {
  const zone = getZone(zoneId);
  return {
    zoneId,
    accidents: String(zone?.sampleAccidents12m ?? 60),
    trafficDensity: zone ? Math.round(zone.baseRisk * 0.9) : 50,
    junctionCount: '10',
    nightShare: 30,
    speedLimit: 50,
    hospitalWithin5km: true,
  };
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ZoneClassification() {
  const reduced = useReducedMotion();
  const [form, setForm] = useState<FormState>(() => defaultsFor('rockfort'));
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ZoneClassificationResult | null>(null);
  const [overrides, setOverrides] = useState<Record<string, RiskLevel>>({});
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ accidents?: string; junctionCount?: string }>({});

  const zone = getZone(form.zoneId);

  const areas: MapArea[] = useMemo(
    () =>
      ZONES.map((z) => ({
        id: z.id,
        center: z.position,
        radiusM: z.radiusM,
        color: RISK_META[overrides[z.id] ?? z.riskLevel].color,
        label: `${z.name}: ${RISK_META[overrides[z.id] ?? z.riskLevel].label}`,
        selected: z.id === form.zoneId,
      })),
    [overrides, form.zoneId],
  );

  const selectZone = (id: string) => {
    setForm(defaultsFor(id));
    setResult(null);
    setStatus('idle');
    setErrors({});
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    const acc = Number(form.accidents);
    if (form.accidents.trim() === '' || !Number.isInteger(acc) || acc < 0 || acc > 1000) next.accidents = 'Enter a whole number from 0 to 1000.';
    const jn = Number(form.junctionCount);
    if (form.junctionCount.trim() === '' || !Number.isInteger(jn) || jn < 0 || jn > 100) next.junctionCount = 'Enter a whole number from 0 to 100.';
    setErrors(next);
    if (next.accidents) document.getElementById('zc-accidents')?.focus();
    else if (next.junctionCount) document.getElementById('zc-junctionCount')?.focus();
    return Object.keys(next).length === 0;
  };

  const classify = async () => {
    if (!validate()) return;
    const payload: ZoneClassificationInput = {
      zoneId: form.zoneId,
      accidentsLast12m: Number(form.accidents),
      trafficDensity: form.trafficDensity,
      junctionCount: Number(form.junctionCount),
      nightShare: form.nightShare,
      speedLimit: form.speedLimit,
      hospitalWithin5km: form.hospitalWithin5km,
    };
    setStatus('loading');
    setError(null);
    try {
      const response = await api.classifyZone(payload);
      setResult(response);
      setOverrides((prev) => ({ ...prev, [response.zoneId]: response.predicted }));
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed.');
      setStatus('error');
    }
  };

  const reset = () => {
    setOverrides({});
    setForm(defaultsFor(form.zoneId));
    setResult(null);
    setStatus('idle');
    setErrors({});
  };

  const chartData = (result?.confidence ?? []).map((c) => ({ name: c.label, value: c.value, color: RISK_META[c.level].color }));

  return (
    <div>
      <PageHeader
        title="Zone Classification"
        description="Pick a zone on the map, adjust its characteristics and see which risk class it falls into, with a confidence breakdown."
        icon={LayoutGrid}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <InteractiveMap
            ariaLabel="Map of Tiruchirappalli zones. Select a zone to classify it."
            height="440px"
            zoom={12}
            areas={areas}
            onAreaSelect={selectZone}
            fit={{ key: 'zones', positions: ZONES.map((z) => z.position) }}
            focus={{ key: form.zoneId, position: zone?.position ?? ZONES[0].position }}
          >
            <MapLegend
              title="Zone class"
              items={[
                { label: 'Low risk', color: RISK_META.low.color },
                { label: 'Medium risk', color: RISK_META.medium.color },
                { label: 'High risk', color: RISK_META.high.color },
              ]}
            />
          </InteractiveMap>

          <motion.section layout className="surface p-5 sm:p-6" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {zone && (
                <motion.div key={`${zone.id}-${result?.predicted ?? 'base'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{zone.name}</h2>
                      <p className="mt-0.5 text-sm text-ink-500">About this zone</p>
                    </div>
                    <RiskBadge level={result && result.zoneId === zone.id ? result.predicted : zone.riskLevel} size="md" />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{zone.summary}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {zone.characteristics.map((c) => (
                      <li key={c} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
                        {c}
                      </li>
                    ))}
                  </ul>
                  {result && result.zoneId === zone.id && (
                    <div className="mt-4 rounded-2xl bg-brand-50/70 p-4">
                      <h3 className="text-sm font-semibold text-ink-800">Why this class</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
                        {result.drivers.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        <div className="space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void classify();
            }}
            className="surface p-5 sm:p-7"
            aria-label="Zone classification inputs"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Zone characteristics</h2>
              <Button variant="ghost" onClick={reset} icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} className="!py-2 !text-xs">
                Reset
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="zc-zoneId" label="Zone" className="sm:col-span-2" hint="You can also click a zone on the map.">
                <CustomSelect id="zc-zoneId" value={form.zoneId} options={ZONE_OPTIONS} onChange={selectZone} />
              </FormField>
              <FormField id="zc-accidents" label="Accidents in last 12 months" error={errors.accidents} required>
                <input
                  id="zc-accidents"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.accidents}
                  onChange={(e) => setForm((f) => ({ ...f, accidents: e.target.value }))}
                  aria-invalid={Boolean(errors.accidents) || undefined}
                  aria-describedby={errors.accidents ? 'zc-accidents-error' : undefined}
                  className={`input ${errors.accidents ? 'input-error' : ''}`}
                />
              </FormField>
              <FormField id="zc-junctionCount" label="Junctions in the zone" error={errors.junctionCount} required>
                <input
                  id="zc-junctionCount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.junctionCount}
                  onChange={(e) => setForm((f) => ({ ...f, junctionCount: e.target.value }))}
                  aria-invalid={Boolean(errors.junctionCount) || undefined}
                  aria-describedby={errors.junctionCount ? 'zc-junctionCount-error' : undefined}
                  className={`input ${errors.junctionCount ? 'input-error' : ''}`}
                />
              </FormField>
              <FormField id="zc-trafficDensity" label="Average traffic density">
                <RangeField
                  id="zc-trafficDensity"
                  value={form.trafficDensity}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => setForm((f) => ({ ...f, trafficDensity: v }))}
                  format={(v) => `${v}%`}
                  accent="#7C4DFF"
                />
              </FormField>
              <FormField id="zc-nightShare" label="Incidents at night" tip="Share of the zone's incidents that happen between 10 PM and 5 AM.">
                <RangeField
                  id="zc-nightShare"
                  value={form.nightShare}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => setForm((f) => ({ ...f, nightShare: v }))}
                  format={(v) => `${v}%`}
                  accent="#14B8A6"
                />
              </FormField>
              <FormField id="zc-speedLimit" label="Posted speed limit">
                <RangeField
                  id="zc-speedLimit"
                  value={form.speedLimit}
                  min={20}
                  max={100}
                  step={5}
                  onChange={(v) => setForm((f) => ({ ...f, speedLimit: v }))}
                  format={(v) => `${v} km/h`}
                  accent="#FF5A4D"
                />
              </FormField>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-ink-50/80 px-4 py-3">
                <label htmlFor="zc-hospital" className="text-sm font-semibold text-ink-700">
                  Hospital within 5 km
                </label>
                <Switch id="zc-hospital" label="Hospital within 5 km" checked={form.hospitalWithin5km} onChange={(v) => setForm((f) => ({ ...f, hospitalWithin5km: v }))} />
              </div>
            </div>
            <div className="mt-7">
              <Button type="submit" loading={status === 'loading'} icon={<ScanSearch className="h-4 w-4" aria-hidden="true" />} className="!px-6 !py-3 !text-base">
                {status === 'loading' ? 'Classifying' : 'Classify zone'}
              </Button>
            </div>
          </motion.form>

          <section className="surface p-5 sm:p-7" aria-live="polite" aria-labelledby="zc-result-title">
            <h2 id="zc-result-title" className="mb-4 text-lg font-semibold">
              Classification result
            </h2>
            <AnimatePresence mode="wait" initial={false}>
              {status === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState icon={LayoutGrid} title="No result yet" description="Choose a zone, review its characteristics and press Classify zone." className="py-8" />
                </motion.div>
              )}
              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3" role="status">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-5/6" />
                  <Skeleton className="h-10 w-2/3" />
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState
                    tone="error"
                    icon={AlertTriangle}
                    title="The classification didn't finish"
                    description={error ?? 'Something went wrong. Try again.'}
                    action={<Button onClick={() => void classify()}>Try again</Button>}
                    className="py-8"
                  />
                </motion.div>
              )}
              {status === 'success' && result && (
                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <RiskBadge level={result.predicted} size="md" />
                    <p className="text-sm text-ink-600">
                      Predicted class for <span className="font-semibold text-ink-900">{getZone(result.zoneId)?.name}</span>
                    </p>
                  </div>
                  <div className="mt-4 h-[190px]" role="img" aria-label={`Confidence by class: ${result.confidence.map((c) => `${c.label} ${c.value} percent`).join(', ')}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={92} tick={{ fill: '#35426A', fontSize: 13, fontWeight: 600 }} />
                        <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={26} isAnimationActive={!reduced} animationDuration={800}>
                          {chartData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                          <LabelList dataKey="value" position="right" formatter={(v: unknown) => `${String(v)}%`} style={{ fill: '#16204A', fontWeight: 700, fontSize: 13 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}

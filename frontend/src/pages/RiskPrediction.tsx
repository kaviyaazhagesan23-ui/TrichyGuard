import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import PredictionResult from '../components/PredictionResult';
import RangeField from '../components/RangeField';
import SegmentedControl from '../components/SegmentedControl';
import { Skeleton } from '../components/LoadingSkeleton';
import { ROAD_CONDITION_OPTIONS, ROAD_TYPE_OPTIONS, WEATHER_OPTIONS, WEEKDAY_OPTIONS } from '../data/options';
import { ZONES, getZone } from '../data/zones';
import { formatHour } from '../lib/utils';
import * as api from '../services/api';
import type { RiskPredictionInput, RiskPredictionResult, RoadCondition, RoadType, SelectOption, WeatherCondition, Weekday } from '../types';

interface FormState {
  zoneId: string;
  hour: number;
  weekday: Weekday;
  trafficDensity: number;
  avgSpeed: string;
  roadType: RoadType | '';
  roadCondition: RoadCondition;
  rainfall: number;
  weather: WeatherCondition | '';
  historicalAccidents: string;
}
type FieldKey = keyof FormState;
type Errors = Partial<Record<FieldKey, string>>;

const INITIAL: FormState = {
  zoneId: '',
  hour: 18,
  weekday: 'Fri',
  trafficDensity: 60,
  avgSpeed: '34',
  roadType: '',
  roadCondition: 'Fair',
  rainfall: 0,
  weather: 'Clear',
  historicalAccidents: '12',
};

const SAMPLE: FormState = {
  zoneId: 'rockfort',
  hour: 18,
  weekday: 'Fri',
  trafficDensity: 82,
  avgSpeed: '41',
  roadType: 'Junction or roundabout',
  roadCondition: 'Poor',
  rainfall: 14,
  weather: 'Heavy rain',
  historicalAccidents: '38',
};

const FIELD_ORDER: FieldKey[] = ['zoneId', 'roadType', 'avgSpeed', 'weather', 'historicalAccidents'];

const ZONE_SELECT_OPTIONS: SelectOption[] = ZONES.map((z) => ({ value: z.id, label: z.name }));

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.zoneId) e.zoneId = 'Choose a zone to analyse.';
  if (!f.roadType) e.roadType = 'Choose the road type.';
  if (!f.weather) e.weather = 'Choose the current weather.';

  const speed = Number(f.avgSpeed);
  if (f.avgSpeed.trim() === '' || Number.isNaN(speed)) e.avgSpeed = 'Enter the average speed in km/h.';
  else if (speed < 0 || speed > 140) e.avgSpeed = 'Speed must be between 0 and 140 km/h.';

  const history = Number(f.historicalAccidents);
  if (f.historicalAccidents.trim() === '' || !Number.isInteger(history)) e.historicalAccidents = 'Enter a whole number.';
  else if (history < 0 || history > 500) e.historicalAccidents = 'Use a value between 0 and 500.';
  return e;
}

function toInput(f: FormState): RiskPredictionInput {
  return {
    zoneId: f.zoneId,
    hour: f.hour,
    weekday: f.weekday,
    trafficDensity: f.trafficDensity,
    avgSpeed: Number(f.avgSpeed),
    roadType: f.roadType as RoadType,
    roadCondition: f.roadCondition,
    rainfall: f.rainfall,
    weather: f.weather as WeatherCondition,
    historicalAccidents: Number(f.historicalAccidents),
  };
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function RiskPrediction() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<RiskPredictionResult | null>(null);
  const [resultZone, setResultZone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const errors = useMemo(() => validate(form), [form]);
  const visibleError = (key: FieldKey): string | undefined => (submitted || touched[key] ? errors[key] : undefined);
  const errorCount = Object.keys(errors).length;

  const set = <K extends FieldKey>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const touch = (key: FieldKey) => setTouched((prev) => ({ ...prev, [key]: true }));
  const describe = (key: FieldKey): string | undefined => (visibleError(key) ? `rp-${key}-error` : undefined);

  const run = async () => {
    setSubmitted(true);
    const current = validate(form);
    const firstInvalid = FIELD_ORDER.find((k) => current[k]);
    if (firstInvalid) {
      document.getElementById(`rp-${firstInvalid}`)?.focus();
      return;
    }
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    try {
      const response = await api.predictRisk(toInput(form));
      if (id !== requestId.current) return;
      setResult(response);
      setResultZone(getZone(form.zoneId)?.name ?? 'the selected zone');
      setStatus('success');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while assessing risk.');
      setStatus('error');
    }
  };

  const reset = () => {
    requestId.current += 1;
    setForm(INITIAL);
    setTouched({});
    setSubmitted(false);
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  const loadSample = () => {
    setForm(SAMPLE);
    setTouched({});
    setSubmitted(false);
  };

  return (
    <div>
      <PageHeader
        title="Accident Risk Prediction"
        description="Describe the road, traffic and weather conditions for a zone and get an accident risk assessment with the factors behind it."
        icon={ShieldAlert}
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
          className="surface p-5 sm:p-7"
          aria-label="Risk assessment inputs"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Road conditions</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={loadSample} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} className="!py-2 !text-xs">
                Load example scenario
              </Button>
              <Button variant="ghost" onClick={reset} icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} className="!py-2 !text-xs">
                Reset
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {submitted && errorCount > 0 && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {errorCount === 1 ? 'One field needs attention before you can run the assessment.' : `${errorCount} fields need attention before you can run the assessment.`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="rp-zoneId" label="Zone" required error={visibleError('zoneId')} hint="The area you want to assess.">
              <CustomSelect
                id="rp-zoneId"
                value={form.zoneId}
                options={ZONE_SELECT_OPTIONS}
                placeholder="Choose a zone"
                onChange={(v) => {
                  set('zoneId', v);
                  touch('zoneId');
                }}
                invalid={Boolean(visibleError('zoneId'))}
                describedBy={describe('zoneId')}
                onBlur={() => touch('zoneId')}
              />
            </FormField>

            <FormField id="rp-roadType" label="Road type" required error={visibleError('roadType')} hint="Junctions and roundabouts carry the most conflict.">
              <CustomSelect
                id="rp-roadType"
                value={form.roadType}
                options={ROAD_TYPE_OPTIONS}
                placeholder="Choose a road type"
                onChange={(v) => {
                  set('roadType', v);
                  touch('roadType');
                }}
                invalid={Boolean(visibleError('roadType'))}
                describedBy={describe('roadType')}
                onBlur={() => touch('roadType')}
              />
            </FormField>

            <FormField id="rp-hour" label="Hour of day" hint="Peak hours are usually 8 to 10 AM and 5 to 8 PM.">
              <RangeField id="rp-hour" value={form.hour} min={0} max={23} onChange={(v) => set('hour', v)} format={formatHour} minLabel="12 AM" maxLabel="11 PM" />
            </FormField>

            <FormField id="rp-trafficDensity" label="Traffic density" tip="Share of the road's usual peak capacity that is in use.">
              <RangeField
                id="rp-trafficDensity"
                value={form.trafficDensity}
                min={0}
                max={100}
                step={5}
                onChange={(v) => set('trafficDensity', v)}
                format={(v) => `${v}%`}
                minLabel="Empty"
                maxLabel="Gridlock"
                accent="#7C4DFF"
              />
            </FormField>

            <FormField id="rp-weekday-0" label="Day of week" className="sm:col-span-2">
              <SegmentedControl id="rp-weekday" ariaLabel="Day of week" value={form.weekday} options={WEEKDAY_OPTIONS} onChange={(v) => set('weekday', v)} />
            </FormField>

            <FormField id="rp-avgSpeed" label="Average speed (km/h)" required error={visibleError('avgSpeed')} hint="Typical vehicle speed on this stretch.">
              <input
                id="rp-avgSpeed"
                type="number"
                inputMode="decimal"
                min={0}
                max={140}
                value={form.avgSpeed}
                onChange={(e) => set('avgSpeed', e.target.value)}
                onBlur={() => touch('avgSpeed')}
                aria-invalid={Boolean(visibleError('avgSpeed')) || undefined}
                aria-describedby={describe('avgSpeed')}
                className={`input ${visibleError('avgSpeed') ? 'input-error' : ''}`}
                placeholder="e.g. 34"
              />
            </FormField>

            <FormField
              id="rp-historicalAccidents"
              label="Historical accident count"
              required
              error={visibleError('historicalAccidents')}
              hint="Recorded accidents in this zone over the past year."
            >
              <input
                id="rp-historicalAccidents"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                step={1}
                value={form.historicalAccidents}
                onChange={(e) => set('historicalAccidents', e.target.value)}
                onBlur={() => touch('historicalAccidents')}
                aria-invalid={Boolean(visibleError('historicalAccidents')) || undefined}
                aria-describedby={describe('historicalAccidents')}
                className={`input ${visibleError('historicalAccidents') ? 'input-error' : ''}`}
                placeholder="e.g. 12"
              />
            </FormField>

            <FormField id="rp-roadCondition-0" label="Road condition" className="sm:col-span-2">
              <SegmentedControl
                id="rp-roadCondition"
                ariaLabel="Road condition"
                value={form.roadCondition}
                options={ROAD_CONDITION_OPTIONS}
                onChange={(v) => set('roadCondition', v)}
              />
            </FormField>

            <FormField id="rp-weather" label="Weather" required error={visibleError('weather')}>
              <CustomSelect
                id="rp-weather"
                value={form.weather}
                options={WEATHER_OPTIONS}
                placeholder="Choose the weather"
                onChange={(v) => {
                  set('weather', v);
                  touch('weather');
                }}
                invalid={Boolean(visibleError('weather'))}
                describedBy={describe('weather')}
                onBlur={() => touch('weather')}
              />
            </FormField>

            <FormField id="rp-rainfall" label="Rainfall" hint="Current rain intensity.">
              <RangeField
                id="rp-rainfall"
                value={form.rainfall}
                min={0}
                max={50}
                onChange={(v) => set('rainfall', v)}
                format={(v) => `${v} mm/h`}
                minLabel="Dry"
                maxLabel="Downpour"
                accent="#14B8A6"
              />
            </FormField>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button type="submit" loading={status === 'loading'} icon={<Zap className="h-4 w-4" aria-hidden="true" />} className="!px-6 !py-3 !text-base">
              {status === 'loading' ? 'Analysing conditions' : 'Assess risk'}
            </Button>
            <p className="text-xs text-ink-400">Fields marked * are required.</p>
          </div>
        </motion.form>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <section className="surface min-h-[420px] p-5 sm:p-7" aria-live="polite" aria-labelledby="rp-result-title">
            <h2 id="rp-result-title" className="mb-4 text-lg font-semibold">
              Risk analysis
            </h2>
            <AnimatePresence mode="wait" initial={false}>
              {status === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState
                    icon={ShieldAlert}
                    title="Your result will appear here"
                    description="Fill in the conditions and press Assess risk, or load an example scenario to see a result right away."
                    action={
                      <Button variant="secondary" onClick={loadSample} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
                        Load example scenario
                      </Button>
                    }
                  />
                </motion.div>
              )}
              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5" role="status">
                  <Skeleton className="mx-auto h-52 w-52 !rounded-full" />
                  <Skeleton className="mx-auto h-6 w-40" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                  <p className="text-center text-sm text-ink-500">Scoring your conditions…</p>
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState
                    tone="error"
                    icon={AlertTriangle}
                    title="The assessment didn't finish"
                    description={error ?? 'Something went wrong. Check your connection and try again.'}
                    action={<Button onClick={() => void run()}>Try again</Button>}
                  />
                </motion.div>
              )}
              {status === 'success' && result && (
                <motion.div key={`result-${result.generatedAt}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PredictionResult result={result} zoneName={resultZone} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}

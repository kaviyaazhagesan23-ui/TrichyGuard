import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Button from '../components/Button';
import ChartCard from '../components/ChartCard';
import ChartTooltip from '../components/ChartTooltip';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import SegmentedControl from '../components/SegmentedControl';
import { Skeleton } from '../components/LoadingSkeleton';
import { ZONES, getZone } from '../data/zones';
import { useAsync } from '../hooks/useAsync';
import { containerVariants, itemVariants } from '../lib/motion';
import { cn } from '../lib/utils';
import * as api from '../services/api';
import type { SelectOption, WeatherCondition, WeatherSnapshot } from '../types';

type Metric = 'temperature' | 'rainfall' | 'wind' | 'humidity';

const ZONE_OPTIONS: SelectOption[] = ZONES.map((z) => ({ value: z.id, label: z.name }));

const CONDITION_ICON: Record<WeatherCondition, LucideIcon> = {
  Clear: Sun,
  Cloudy: Cloud,
  'Light rain': CloudDrizzle,
  'Heavy rain': CloudRain,
  Fog: CloudFog,
};

const CONDITION_GRADIENT: Record<WeatherCondition, string> = {
  Clear: 'from-orange-400 via-amber-400 to-yellow-300',
  Cloudy: 'from-brand-400 via-cyan2-400 to-cyan2-300',
  'Light rain': 'from-brand-500 via-cyan2-500 to-cyan2-300',
  'Heavy rain': 'from-violet-600 via-brand-500 to-cyan2-400',
  Fog: 'from-ink-400 via-brand-300 to-cyan2-200',
};

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'rainfall', label: 'Rainfall' },
  { value: 'wind', label: 'Wind' },
  { value: 'humidity', label: 'Humidity' },
];

const METRIC_META: Record<Metric, { unit: string; color: string; end: string; name: string }> = {
  temperature: { unit: '°C', color: '#F97316', end: '#FDBA74', name: 'Temperature' },
  rainfall: { unit: ' mm', color: '#2F5BFF', end: '#22D3EE', name: 'Rainfall' },
  wind: { unit: ' km/h', color: '#7C4DFF', end: '#C026D3', name: 'Wind speed' },
  humidity: { unit: '%', color: '#06B6D4', end: '#10B981', name: 'Humidity' },
};

function roadAdvice(w: WeatherSnapshot): { level: 'low' | 'medium' | 'high'; text: string } {
  if (w.rainfallMm >= 3 || w.visibilityKm < 4) return { level: 'high', text: 'Heavy rain or poor visibility. Expect slippery roads and slower response times.' };
  if (w.rainfallMm > 0 || w.condition === 'Fog') return { level: 'medium', text: 'Light rain or haze. Roads may be slick near junctions.' };
  return { level: 'low', text: 'Dry roads and good visibility. Normal driving conditions.' };
}

const ADVICE_STYLE = {
  low: 'from-emerald-50 to-cyan2-50 ring-emerald-200 text-emerald-800',
  medium: 'from-amber-50 to-orange-50 ring-amber-200 text-amber-800',
  high: 'from-coral-50 to-fuchsia-50 ring-coral-200 text-coral-800',
} as const;

export default function Weather() {
  const reduced = useReducedMotion();
  const [zoneId, setZoneId] = useState<string>('rockfort');
  const [metric, setMetric] = useState<Metric>('temperature');

  const weather = useAsync<WeatherSnapshot | null>(() => api.fetchWeather(zoneId), [zoneId]);

  const loading = weather.loading;
  const data = weather.data;
  const zone = getZone(zoneId);
  const meta = METRIC_META[metric];
  const hourly = (data?.hourly ?? []).map((h) => ({ hour: h.hour, value: h[metric] }));

  const metrics: { label: string; value: string; icon: LucideIcon; tile: string }[] = data
    ? [
        { label: 'Temperature', value: `${data.temperatureC.toFixed(1)}°C`, icon: Thermometer, tile: 'from-orange-500 to-amber-400' },
        { label: 'Rainfall', value: `${data.rainfallMm.toFixed(1)} mm`, icon: CloudRain, tile: 'from-brand-500 to-cyan2-400' },
        { label: 'Wind speed', value: `${data.windKmh.toFixed(0)} km/h`, icon: Wind, tile: 'from-violet-500 to-fuchsia-500' },
        { label: 'Humidity', value: `${data.humidity}%`, icon: Droplets, tile: 'from-cyan2-500 to-emerald-400' },
        { label: 'Visibility', value: `${data.visibilityKm} km`, icon: Eye, tile: 'from-emerald-500 to-teal-400' },
        { label: 'Pressure', value: `${data.pressureHpa} hPa`, icon: Gauge, tile: 'from-brand-600 to-violet-500' },
      ]
    : [];

  const Icon = data ? CONDITION_ICON[data.condition] : CloudSun;
  const advice = data ? roadAdvice(data) : null;

  return (
    <div>
      <PageHeader
        title="Weather"
        description="Weather monitoring for each zone, with the conditions that matter most for road safety and ambulance response."
        icon={CloudSun}
        actions={
          <Button variant="secondary" onClick={() => weather.reload()} icon={<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <section className="surface mb-6 p-5 sm:p-6" aria-label="Weather controls">
        <FormField id="wx-zone" label="Zone">
          <CustomSelect id="wx-zone" value={zoneId} options={ZONE_OPTIONS} onChange={setZoneId} />
        </FormField>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" role="status" aria-label="Loading weather">
            <Skeleton className="h-52 rounded-[2rem]" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-3xl" />
          </motion.div>
        )}

        {!loading && weather.error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface">
            <EmptyState
              tone="error"
              icon={AlertTriangle}
              title="Weather isn't available right now"
              description={weather.error.message}
              action={
                <Button onClick={() => weather.reload()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
                  Try again
                </Button>
              }
            />
          </motion.div>
        )}

        {!loading && !weather.error && !data && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface">
            <EmptyState
              icon={CloudSun}
              title="No weather readings for this zone"
              description="Readings for the selected zone haven't arrived yet. Switch zones or check again shortly."
              action={<Button onClick={() => weather.reload()}>Check again</Button>}
            />
          </motion.div>
        )}

        {!loading && !weather.error && data && advice && (
          <motion.div key={`live-${zoneId}`} variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.section variants={itemVariants} className={cn('relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-lift sm:p-8', CONDITION_GRADIENT[data.condition])}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/25 blur-2xl" aria-hidden="true" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold opacity-95">{zone?.name}, Tiruchirappalli</p>
                  <p className="mt-2 font-display text-6xl font-extrabold drop-shadow-[0_4px_10px_rgba(13,21,54,0.25)] sm:text-7xl">{data.temperatureC.toFixed(0)}°C</p>
                  <p className="mt-1 text-lg font-semibold">{data.condition}</p>
                  <p className="mt-1 text-sm opacity-90">
                    Feels like {data.feelsLikeC.toFixed(0)}°C · Updated{' '}
                    {new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <motion.div animate={reduced ? undefined : { y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="rounded-[2rem] bg-white/25 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_24px_40px_-16px_rgba(13,21,54,0.4)] backdrop-blur">
                  <Icon className="h-20 w-20 drop-shadow-[0_8px_12px_rgba(13,21,54,0.3)]" aria-hidden="true" />
                </motion.div>
              </div>
            </motion.section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((m) => (
                <motion.div key={m.label} variants={itemVariants} whileHover={{ y: -4 }} className="surface flex items-center gap-4 p-5">
                  <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-tile', m.tile)}>
                    <m.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-500">{m.label}</p>
                    <p className="font-display text-2xl font-extrabold text-ink-900">{m.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <ChartCard
                className="xl:col-span-2"
                title="Next 24 hours"
                subtitle={`${meta.name} in ${zone?.name}`}
                actions={<SegmentedControl id="wx-metric" ariaLabel="Chart metric" size="sm" value={metric} options={METRIC_OPTIONS} onChange={setMetric} />}
              >
                <div className="h-[300px]" role="img" aria-label={`${meta.name} over the next 24 hours`}>
                  <ResponsiveContainer width="100%" height="100%">
                    {metric === 'rainfall' ? (
                      <BarChart key={metric} data={hourly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wxBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={meta.color} />
                            <stop offset="100%" stopColor={meta.end} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 6" stroke="#E3E8F5" vertical={false} />
                        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 11 }} interval={2} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip unit={meta.unit} />} cursor={{ fill: 'rgba(47,91,255,0.06)' }} />
                        <Bar dataKey="value" name={meta.name} fill="url(#wxBar)" radius={[8, 8, 0, 0]} isAnimationActive={!reduced} animationDuration={800} />
                      </BarChart>
                    ) : (
                      <AreaChart key={metric} data={hourly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wxArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={meta.color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={meta.end} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 6" stroke="#E3E8F5" vertical={false} />
                        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 11 }} interval={2} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip content={<ChartTooltip unit={meta.unit} />} cursor={{ stroke: '#BACDFF', strokeWidth: 1.5 }} />
                        <Area type="monotone" dataKey="value" name={meta.name} stroke={meta.color} strokeWidth={3} fill="url(#wxArea)" isAnimationActive={!reduced} animationDuration={900} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <motion.section variants={itemVariants} className={cn('surface flex flex-col justify-between bg-gradient-to-br p-6 ring-1', ADVICE_STYLE[advice.level])}>
                <div>
                  <h2 className="text-lg font-semibold !text-current">Road safety impact</h2>
                  <p className="mt-2 text-sm leading-relaxed">{advice.text}</p>
                </div>
                <Link to="/risk-prediction" className="btn-primary mt-5 w-full">
                  Assess risk for {zone?.name}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </motion.section>
            </div>

            <motion.section variants={itemVariants} className="surface p-5 sm:p-6" aria-labelledby="wx-week">
              <h2 id="wx-week" className="mb-4 text-lg font-semibold">
                7-day outlook
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {data.daily.map((d) => {
                  const DayIcon = CONDITION_ICON[d.condition] ?? CloudRain;
                  return (
                    <li key={d.day} className="rounded-2xl bg-gradient-to-b from-white to-brand-50/60 p-3 text-center ring-1 ring-ink-100">
                      <p className="text-xs font-bold text-ink-600">{d.day}</p>
                      <DayIcon className="mx-auto my-2 h-7 w-7 text-brand-500" aria-hidden="true" />
                      <p className="text-sm font-bold text-ink-900">
                        {d.high}° <span className="font-medium text-ink-400">{d.low}°</span>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-brand-600">{d.rainChance}% rain</p>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

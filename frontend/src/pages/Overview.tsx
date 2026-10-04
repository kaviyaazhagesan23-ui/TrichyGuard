import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  Clock,
  CloudSun,
  Hospital,
  LayoutGrid,
  LayoutDashboard,
  MapPinned,
  Route as RouteIcon,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/ChartCard';
import ChartTooltip from '../components/ChartTooltip';
import EmptyState from '../components/EmptyState';
import HeroIllustration from '../components/HeroIllustration';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import SegmentedControl from '../components/SegmentedControl';
import StatCard from '../components/StatCard';
import TrichyStylizedMap from '../components/TrichyStylizedMap';
import { ACTIVITY } from '../data/activity';
import { ZONES } from '../data/zones';
import { useAsync } from '../hooks/useAsync';
import { containerVariants, itemVariants } from '../lib/motion';
import { RISK_META, cn, timeAgo } from '../lib/utils';
import * as api from '../services/api';
import type { ActivityItem, TrendRange } from '../types';

const RANGE_OPTIONS: { value: TrendRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '12m', label: '12 months' },
];

const ACTIVITY_ICON: Record<ActivityItem['kind'], LucideIcon> = {
  alert: AlertTriangle,
  route: RouteIcon,
  prediction: ShieldAlert,
  weather: CloudSun,
  zone: LayoutGrid,
};

const QUICK_ACTIONS = [
  { to: '/risk-prediction', title: 'Assess risk', text: 'Test road conditions for a zone.', icon: ShieldAlert, tile: 'from-cyan2-400 to-brand-600' },
  { to: '/zone-classification', title: 'Classify a zone', text: 'See where a zone sits on the risk scale.', icon: LayoutGrid, tile: 'from-violet-500 to-fuchsia-500' },
  { to: '/hospital-search', title: 'Find nearby hospitals', text: 'Search within a radius of any zone.', icon: Hospital, tile: 'from-emerald-400 to-cyan2-500' },
  { to: '/ambulance-routing', title: 'Plan a route', text: 'Send an ambulance from an accident location.', icon: Ambulance, tile: 'from-coral-500 to-orange-400' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Overview() {
  const reduced = useReducedMotion();
  const [range, setRange] = useState<TrendRange>('7d');
  const [show, setShow] = useState({ accidents: true, highRisk: true });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('rockfort');
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const overview = useAsync(() => api.fetchOverview(range), [range]);
  const data = overview.data;
  const selectedZone = useMemo(() => ZONES.find((z) => z.id === selectedZoneId) ?? null, [selectedZoneId]);
  const noSeries = !show.accidents && !show.highRisk;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Accident risk, trends and emergency readiness across Srirangam, Cantonment, Thillai Nagar, Rockfort and Ariyamangalam."
        icon={LayoutDashboard}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* Welcome */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-cyan2-50 to-fuchsia-50 p-6 shadow-lift sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {greeting()}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">Safer roads and faster ambulances for <span className="text-gradient">Tiruchirappalli</span></h2>
              <p className="mt-3 max-w-xl text-ink-500">
                See which zones need attention, assess road conditions, find nearby hospitals and plan an ambulance route from one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/risk-prediction" className="btn-primary">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  Assess accident risk
                </Link>
                <Link to="/ambulance-routing" className="btn-secondary">
                  <Ambulance className="h-4 w-4" aria-hidden="true" />
                  Plan an ambulance route
                </Link>
              </div>
            </div>
            <div className={cn('mx-auto w-full max-w-md', !reduced && 'animate-float-slow')}>
              <HeroIllustration className="h-auto w-full drop-shadow-[0_24px_30px_rgba(30,67,224,0.18)]" />
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Citywide risk index"
            value={data?.stats.riskIndex ?? 0}
            loading={!data}
            icon={Activity}
            accent="coral"
            tip="Average risk score across the five monitored zones, from 0 to 100."
            delta={data ? { value: data.stats.riskIndexDelta, goodWhen: 'down' } : undefined}
            footnote="vs last week"
            sparkline={data?.stats.riskSpark}
          />
          <StatCard
            label="Monitored zones"
            value={data?.stats.monitoredZones ?? 0}
            loading={!data}
            icon={MapPinned}
            accent="blue"
            tip="Zones under continuous risk monitoring."
            footnote="Srirangam to Ariyamangalam"
            sparkline={data?.stats.zoneSpark}
          />
          <StatCard
            label="Hospitals in network"
            value={data?.stats.hospitals ?? 0}
            loading={!data}
            icon={Hospital}
            accent="teal"
            tip="Hospitals available for search and ambulance routing."
            footnote="with emergency care listed"
            sparkline={data?.stats.hospitalSpark}
          />
          <StatCard
            label="Avg. ambulance ETA"
            value={data?.stats.avgEtaMin ?? 0}
            decimals={1}
            suffix=" min"
            loading={!data}
            icon={Clock}
            accent="violet"
            tip="Average estimated travel time for planned ambulance routes."
            delta={data ? { value: data.stats.etaDelta, unit: ' min', goodWhen: 'down' } : undefined}
            footnote="vs last week"
            sparkline={data?.stats.etaSpark}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Accident trend"
            subtitle="Recorded accidents across all five zones"
            tip="Switch the time range or hide a series to focus the chart."
            loading={!data}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1.5" role="group" aria-label="Chart series">
                  {(
                    [
                      { key: 'accidents', label: 'All accidents', color: '#2F5BFF' },
                      { key: 'highRisk', label: 'High-risk events', color: '#FF5A4D' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={show[s.key]}
                      onClick={() => setShow((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors',
                        show[s.key] ? 'bg-white text-ink-800 ring-ink-200' : 'bg-ink-50 text-ink-400 ring-ink-100',
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: show[s.key] ? s.color : '#C9D1E6' }} aria-hidden="true" />
                      {s.label}
                    </button>
                  ))}
                </div>
                <SegmentedControl id="trend-range" ariaLabel="Time range" size="sm" value={range} options={RANGE_OPTIONS} onChange={setRange} />
              </div>
            }
          >
            {noSeries ? (
              <EmptyState icon={Activity} title="No series selected" description="Turn on at least one series to draw the chart." />
            ) : (
              <div className="h-[280px]" role="img" aria-label="Area chart of accidents over the selected time range">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trend ?? []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradAccidents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2F5BFF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2F5BFF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5A4D" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#FF5A4D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="#E3E8F5" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 12 }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6D7BA3', fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#BACDFF', strokeWidth: 1.5 }} />
                    {show.accidents && (
                      <Area type="monotone" dataKey="accidents" name="All accidents" stroke="#2F5BFF" strokeWidth={2.5} fill="url(#gradAccidents)" isAnimationActive={!reduced} animationDuration={900} />
                    )}
                    {show.highRisk && (
                      <Area type="monotone" dataKey="highRisk" name="High-risk events" stroke="#FF5A4D" strokeWidth={2.5} fill="url(#gradHigh)" isAnimationActive={!reduced} animationDuration={900} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Risk distribution" subtitle={`Share of events by risk level, ${RANGE_OPTIONS.find((r) => r.value === range)?.label.toLowerCase()}`} loading={!data}>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-[200px] w-[200px]" role="img" aria-label="Donut chart of events by risk level">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribution ?? []}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={90}
                      paddingAngle={3}
                      cornerRadius={8}
                      stroke="none"
                      isAnimationActive={!reduced}
                      animationDuration={900}
                      onMouseEnter={(_, index) => setActiveSlice(index)}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {(data?.distribution ?? []).map((slice, i) => (
                        <Cell key={slice.level} fill={RISK_META[slice.level].color} opacity={activeSlice === null || activeSlice === i ? 1 : 0.35} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-ink-900">{data?.totalAccidents ?? 0}</span>
                  <span className="text-xs text-ink-400">events</span>
                </div>
              </div>
              <ul className="w-full space-y-2">
                {(data?.distribution ?? []).map((slice, i) => (
                  <li
                    key={slice.level}
                    onMouseEnter={() => setActiveSlice(i)}
                    onMouseLeave={() => setActiveSlice(null)}
                    className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-ink-50"
                  >
                    <RiskBadge level={slice.level} />
                    <span className="text-sm font-bold tabular-nums text-ink-800">{slice.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </ChartCard>
        </div>

        {/* Map + activity */}
        <div className="grid gap-6 xl:grid-cols-3">
          <motion.section variants={itemVariants} className="surface p-5 sm:p-6 xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Trichy risk map</h2>
                <p className="text-sm text-ink-500">An overview of the five zones. Select one to see its profile.</p>
              </div>
              <Link to="/risk-map" className="btn-secondary !py-2 !text-xs">
                Open full map
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_15rem]">
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-ink-100">
                <TrichyStylizedMap zones={ZONES} selectedId={selectedZoneId} onSelect={setSelectedZoneId} />
                <div className="absolute bottom-3 left-3 flex gap-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-ink-600 shadow-soft">
                  {(['low', 'medium', 'high'] as const).map((l) => (
                    <span key={l} className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_META[l].color }} aria-hidden="true" />
                      {RISK_META[l].label.replace(' risk', '')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-ink-50/70 p-4" aria-live="polite">
                {selectedZone ? (
                  <motion.div key={selectedZone.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold">{selectedZone.name}</h3>
                      <RiskBadge level={selectedZone.riskLevel} className="mt-1.5" />
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-ink-400">Risk score</dt>
                        <dd className="font-display text-2xl font-bold">{selectedZone.baseRisk}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">Accidents, 12 mo</dt>
                        <dd className="font-display text-2xl font-bold">{selectedZone.sampleAccidents12m}</dd>
                      </div>
                    </dl>
                    <p className="text-xs leading-relaxed text-ink-500">{selectedZone.summary}</p>
                    <Link to="/zone-classification" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Classify this zone
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </motion.div>
                ) : (
                  <EmptyState icon={MapPinned} title="Pick a zone" description="Select a marker on the map to see its details." className="py-6" />
                )}
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="surface p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <p className="text-sm text-ink-500">Latest events across the zones</p>
            </div>
            <ul className="space-y-1">
              {ACTIVITY.map((item) => {
                const Icon = ACTIVITY_ICON[item.kind];
                return (
                  <li key={item.id}>
                    <Link to={item.to} className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-ink-50">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: item.level ? RISK_META[item.level].color : '#5A82FF' }}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-800 group-hover:text-brand-700">{item.title}</span>
                        <span className="block text-xs text-ink-500">{item.detail}</span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-400">{timeAgo(item.minutesAgo)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        </div>

        {/* Quick actions */}
        <motion.section variants={itemVariants} aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="mb-3 text-lg font-semibold">
            Quick actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <motion.div key={a.to} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Link to={a.to} className="surface group flex h-full items-center gap-4 p-5 transition-shadow hover:shadow-lift">
                  <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-tile', a.tile)}>
                    <a.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{a.title}</span>
                    <span className="block text-xs text-ink-500">{a.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden="true" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

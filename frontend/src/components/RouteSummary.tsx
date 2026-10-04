import { motion } from 'framer-motion';
import { Clock, Flag, MapPin, Route as RouteIcon, Siren } from 'lucide-react';
import type { RouteResult } from '../types';
import { formatMinutes } from '../lib/utils';

export default function RouteSummary({ route }: { route: RouteResult }) {
  const arrival = new Date(Date.now() + route.etaMin * 60_000).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="route-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="route-summary-title" className="text-lg font-semibold">
          Route summary
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            route.priority === 'critical' ? 'bg-coral-50 text-coral-700' : 'bg-brand-50 text-brand-700'
          }`}
        >
          <Siren className="h-3.5 w-3.5" aria-hidden="true" />
          {route.priority === 'critical' ? 'Critical priority' : 'Standard priority'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Distance', value: `${route.distanceKm.toFixed(1)} km`, icon: RouteIcon },
          { label: 'Travel time', value: formatMinutes(route.etaMin), icon: Clock },
          { label: 'Arrival', value: arrival, icon: Flag },
        ].map((m, i) => (
          <motion.div
            key={`${route.id}-${m.label}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 p-3.5"
          >
            <m.icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <p className="mt-2 font-display text-xl font-bold leading-tight text-ink-900">{m.value}</p>
            <p className="text-xs text-ink-500">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <ol className="mt-5 space-y-0">
        {route.steps.map((step, i) => (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < route.steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-ink-200" aria-hidden="true" />}
            <span
              className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                i === route.steps.length - 1 ? 'bg-emerald-500' : i === 0 ? 'bg-coral-500' : 'bg-brand-500'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-800">{step.title}</p>
              <p className="text-xs text-ink-500">{step.detail}</p>
              {step.distanceKm > 0 && <p className="mt-0.5 text-xs font-semibold text-brand-600">{step.distanceKm.toFixed(1)} km</p>}
            </div>
          </li>
        ))}
      </ol>

    </section>
  );
}

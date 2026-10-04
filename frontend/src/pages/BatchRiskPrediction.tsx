import { useState } from 'react';
import {
  CalendarRange,
  CloudRain,
  Gauge,
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';

import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import RangeField from '../components/RangeField';
import RiskBadge from '../components/RiskBadge';

import FormField from '../components/FormField';


import { predictBatchRisk } from '../services/api';

import type { BatchRiskPredictionResult } from '../types';

function formatZoneName(zone: string): string {
  return zone
    .replace(/^Zone_\d+_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function getRiskLevel(level: 'Low' | 'Moderate' | 'High') {
  if (level === 'High') return 'high' as const;
  if (level === 'Moderate') return 'medium' as const;
  return 'low' as const;
}

function getRiskTextClass(level: 'Low' | 'Moderate' | 'High') {
  if (level === 'High') return 'text-rose-600';
  if (level === 'Moderate') return 'text-amber-600';
  return 'text-emerald-600';
}

function getRiskBarClass(level: 'Low' | 'Moderate' | 'High') {
  if (level === 'High') return 'bg-rose-500';
  if (level === 'Moderate') return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function BatchRiskPrediction() {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(18);

  const [result, setResult] =
    useState<BatchRiskPredictionResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePredict() {
    if (!date) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await predictBatchRisk({
        date,
        hour,
      });

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate batch risk predictions.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

    <PageHeader
  title="Batch Risk Prediction"
  description="Generate accident-risk predictions for all five trained TrichyGuard zones for the selected date and hour."
  icon={CalendarRange}
/>





      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="surface p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <label
              htmlFor="batch-risk-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Prediction Date
            </label>

            <input
              id="batch-risk-date"
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input w-full"
            />
          </div>

          <FormField
  id="batch-hour"
  label="Hour of day"
  hint="Select the hour for which all five zones will be evaluated."
>
  <RangeField
    id="batch-hour"
    value={hour}
    min={0}
    max={23}
    step={1}
    onChange={setHour}
    format={(value) => `${value}:00`}
    minLabel="12 AM"
    maxLabel="11 PM"
  />
</FormField>

          <Button
            onClick={handlePredict}
            loading={loading}
            className="w-full lg:w-auto"
          >
            {loading ? 'Generating...' : 'Predict All Zones'}
          </Button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}
      </motion.section>

      {!result ? (
        <section className="surface flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CalendarRange size={26} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Five-Zone Prediction
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Select a date and hour to generate predictions for Srirangam,
            Cantonment, Thillai Nagar, Rockfort and Ariyamangalam.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {result.results.map((zoneResult, index) => (
            <motion.article
              key={zoneResult.zone}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.05,
              }}
              className="surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Zone {index + 1}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {formatZoneName(zoneResult.zone)}
                  </h2>
                </div>

                <RiskBadge level={getRiskLevel(zoneResult.risk_level)} />
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Accident Probability
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${getRiskTextClass(
                      zoneResult.risk_level,
                    )}`}
                  >
                    {zoneResult.risk_percentage.toFixed(1)}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Model Prediction</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {zoneResult.prediction === 1
                      ? 'Accident'
                      : 'No Accident'}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      Math.max(zoneResult.risk_percentage, 0),
                      100,
                    )}%`,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: 'easeOut',
                    delay: index * 0.05,
                  }}
                  className={`h-full rounded-full ${getRiskBarClass(
                    zoneResult.risk_level,
                  )}`}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Gauge size={15} className="text-blue-500" />
                    <span className="text-xs text-slate-500">
                      Traffic
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {zoneResult.estimated_features.traffic_density}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-xs text-slate-500">
                    Average Speed
                  </span>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {zoneResult.estimated_features.average_speed} km/h
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <CloudRain size={15} className="text-cyan-500" />
                    <span className="text-xs text-slate-500">
                      Weather
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {zoneResult.estimated_features.weather}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {zoneResult.estimated_features.rainfall_mm} mm rainfall
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <History size={15} className="text-violet-500" />
                    <span className="text-xs text-slate-500">
                      Historical Accidents
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {zoneResult.estimated_features.historical_accident_count}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      )}
    </div>
  );
}
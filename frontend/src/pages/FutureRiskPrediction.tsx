import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';



import {
  CalendarClock,
  CloudRain,
  Gauge,
  History,
  MapPin,
} from 'lucide-react';





import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import RangeField from '../components/RangeField';
import RiskBadge from '../components/RiskBadge';
import { predictFutureRisk } from '../services/api';

import { ZONES } from '../data/zones';

import type {
  FutureRiskPredictionInput,
  FutureRiskPredictionResult,
} from '../types';

function formatZoneName(zone: string): string {
  return zone
    .replace(/^Zone_\d+_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function riskClass(level: string): string {
  if (level === 'High') return 'text-rose-600';
  if (level === 'Moderate') return 'text-amber-600';
  return 'text-emerald-600';
}

function riskBarClass(level: string): string {
  if (level === 'High') return 'bg-rose-500';
  if (level === 'Moderate') return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function FutureRiskPrediction() {
  const today = new Date().toISOString().split('T')[0];

  const [zoneId, setZoneId] = useState(ZONES[0]?.id ?? '');
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(18);

  const [result, setResult] =
    useState<FutureRiskPredictionResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const zoneOptions = useMemo(
    () =>
      ZONES.map((zone) => ({
        value: zone.id,
        label: zone.name,
      })),
    [],
  );

  async function handlePredict() {
    if (!date) {
      setError('Please select a future date.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const input: FutureRiskPredictionInput = {
        zoneId,
        date,
        hour,
      };

      const response = await predictFutureRisk(input);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate the future risk prediction.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
  title="Future Risk Prediction"
  description="Predict accident risk for a selected Trichy zone, future date and hour using the trained TrichyGuard risk model."
  icon={CalendarClock}
/>




      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        {/* Prediction form */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="surface p-6"
        >
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarClock size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Prediction Inputs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose where and when you want to estimate accident risk.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
  <label
    htmlFor="future-risk-zone"
    className="mb-2 block text-sm font-medium text-slate-700"
  >
    Zone
  </label>

  <FormField id="future-zone" label="Zone">
  <CustomSelect
    id="future-zone"
    value={zoneId}
    options={zoneOptions}
    onChange={setZoneId}
  />
</FormField>
</div>

            <div>
              <label
                htmlFor="future-risk-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Future Date
              </label>

              <input
                id="future-risk-date"
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input w-full"
              />
            </div>
            <FormField
  id="future-hour"
  label="Hour of day"
  hint="Select the hour for which you want to estimate accident risk."
>
  <RangeField
    id="future-hour"
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

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {zoneOptions.find((zone) => zone.value === zoneId)?.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The backend estimates traffic, road condition, historical
                    accidents and weather-related features from the existing
                    accident dataset before running the trained model.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            <Button
              onClick={handlePredict}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Generating Prediction...' : 'Predict Future Risk'}
            </Button>
          </div>
        </motion.section>

        {/* Result */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="surface p-6"
        >
          {!result ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Gauge size={26} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Prediction Result
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Select a zone, future date and hour, then generate a prediction
                to see the model output here.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Predicted Risk
                  </p>

                  <h2
                    className={`mt-1 text-4xl font-bold ${riskClass(
                      result.risk_level,
                    )}`}
                  >
                    {result.risk_percentage.toFixed(1)}%
                  </h2>
                </div>

                <RiskBadge
                  level={
                    result.risk_level === 'High'
                      ? 'high'
                      : result.risk_level === 'Moderate'
                        ? 'medium'
                        : 'low'
                  }
                />
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      Math.max(result.risk_percentage, 0),
                      100,
                    )}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${riskBarClass(
                    result.risk_level,
                  )}`}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Zone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatZoneName(result.zone)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {result.date}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {result.hour}:00
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Estimated Model Features
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">
                      Traffic Density
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {result.estimated_features.traffic_density}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">
                      Average Speed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {result.estimated_features.average_speed} km/h
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-2">
                      <CloudRain size={15} className="text-blue-500" />
                      <p className="text-xs text-slate-500">Weather</p>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {result.estimated_features.weather}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {result.estimated_features.rainfall_mm} mm rainfall
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-2">
                      <History size={15} className="text-violet-500" />
                      <p className="text-xs text-slate-500">
                        Historical Accidents
                      </p>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {result.estimated_features.historical_accident_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Feature matching
                  </span>

                  <span className="text-xs font-medium text-slate-700">
                    {result.estimated_features.traffic_match_type}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Records used
                  </span>

                  <span className="text-xs font-semibold text-slate-700">
                    {result.estimated_features.traffic_records_used}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Weather source
                  </span>

                  <span className="text-right text-xs font-medium text-slate-700">
                    {result.estimated_features.weather_source}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
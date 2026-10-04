interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  unit?: string;
}

export default function ChartTooltip({ active, payload, label, unit = '' }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-2xl border border-ink-100 bg-white/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur">
      {label !== undefined && <p className="mb-1.5 font-semibold text-ink-800">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry, i) => (
          <li key={`${entry.dataKey ?? entry.name ?? i}`} className="flex items-center gap-2 text-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? '#2F5BFF' }} aria-hidden="true" />
            <span>{entry.name}</span>
            <span className="ml-auto pl-4 font-bold tabular-nums text-ink-900">
              {entry.value}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

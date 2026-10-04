import type { CSSProperties } from 'react';

interface RangeFieldProps {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
  accent?: string;
}

export default function RangeField({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  minLabel,
  maxLabel,
  accent = '#2F5BFF',
}: RangeFieldProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const style = { '--pct': `${pct}%`, '--accent': accent } as CSSProperties;
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <output htmlFor={id} className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-700">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="tg-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={style}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(minLabel || maxLabel) && (
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

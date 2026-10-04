import { cn } from '../lib/utils';

export interface LegendItem {
  label: string;
  color: string;
  shape?: 'dot' | 'square';
}

export default function MapLegend({ title = 'Legend', items, className }: { title?: string; items: LegendItem[]; className?: string }) {
  return (
    <div className={cn('absolute right-3 top-3 z-10 rounded-2xl bg-white/90 px-3.5 py-2.5 text-xs shadow-soft ring-1 ring-ink-100 backdrop-blur', className)}>
      <p className="mb-1.5 font-semibold text-ink-700">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-ink-600">
            <span
              className={cn('h-3 w-3', item.shape === 'square' ? 'rounded-[4px]' : 'rounded-full')}
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

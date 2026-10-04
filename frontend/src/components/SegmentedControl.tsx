import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SegmentedControlProps<T extends string> {
  id: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function SegmentedControl<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = options.findIndex((o) => o.value === value);
    let next = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
    else return;
    e.preventDefault();
    onChange(options[next].value);
    document.getElementById(`${id}-${next}`)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('inline-flex max-w-full overflow-x-auto rounded-2xl bg-ink-100/80 p-1', className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            id={`${id}-${index}`}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative whitespace-nowrap rounded-xl font-semibold transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
              active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-xl bg-white shadow-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import type { SelectOption } from '../types';
import { cn } from '../lib/utils';

interface CustomSelectProps<T extends string> {
  id: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  onBlur?: () => void;
  className?: string;
}

export default function CustomSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  invalid = false,
  disabled = false,
  describedBy,
  onBlur,
  className,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);

  const openList = () => {
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    document.getElementById(id)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', open && 'z-[1000]', className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          'input flex items-center justify-between gap-2 text-left',
          invalid && 'input-error',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className={cn('truncate', !selected && 'text-ink-300')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            tabIndex={-1}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-auto rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm',
                    index === active ? 'bg-brand-50 text-brand-700' : 'text-ink-700',
                    isSelected && 'font-semibold',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description && <span className="block truncate text-xs font-normal text-ink-400">{option.description}</span>}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

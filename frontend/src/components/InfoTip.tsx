import { useId } from 'react';
import { Info } from 'lucide-react';

export default function InfoTip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        aria-label="More information"
        className="rounded-full text-ink-300 transition-colors hover:text-brand-500 focus-visible:text-brand-500"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-56 rounded-xl bg-ink-900 px-3 py-2 text-xs font-medium leading-snug text-white opacity-0 shadow-lift transition-opacity group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

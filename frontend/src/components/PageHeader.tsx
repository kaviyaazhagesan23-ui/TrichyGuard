import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  useDocumentTitle(title);
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-[0_10px_22px_-8px_rgba(47,91,255,0.7)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

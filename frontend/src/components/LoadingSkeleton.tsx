import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

type Variant = 'card' | 'chart' | 'list' | 'map' | 'page';

interface LoadingSkeletonProps {
  variant?: Variant;
  className?: string;
  rows?: number;
}

export default function LoadingSkeleton({ variant = 'card', className, rows = 4 }: LoadingSkeletonProps) {
  let content;
  switch (variant) {
    case 'chart':
      content = (
        <div className="flex h-full min-h-[220px] items-end gap-3 p-2">
          {[40, 65, 50, 80, 60, 90, 55].map((h, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div className="skeleton w-full rounded-lg" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      );
      break;
    case 'list':
      content = (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case 'map':
      content = <Skeleton className="h-full min-h-[320px] w-full rounded-3xl" />;
      break;
    case 'page':
      content = (
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      );
      break;
    default:
      content = (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      );
  }
  return (
    <div className={cn(className)} role="status" aria-live="polite" aria-label="Loading">
      {content}
      <span className="sr-only">Loading content</span>
    </div>
  );
}

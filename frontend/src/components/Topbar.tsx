import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_ITEMS } from '../data/navigation';
import { ACTIVITY } from '../data/activity';
import { RISK_META, cn, timeAgo } from '../lib/utils';

interface TopbarProps {
  collapsed: boolean;
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
}

export default function Topbar({ collapsed, onOpenMobile, onToggleCollapse }: TopbarProps) {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const popRef = useRef<HTMLDivElement>(null);
  const unread = ACTIVITY.filter((a) => a.kind === 'alert' || a.kind === 'weather').filter((a) => !read.includes(a.id));
  const alerts = ACTIVITY.filter((a) => a.kind === 'alert' || a.kind === 'weather');

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: globalThis.PointerEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="glass sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMobile} className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link to="/" className="font-semibold text-ink-400 hover:text-ink-700">
            TrichyGuard
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />
          <span className="truncate font-semibold text-ink-800" aria-current="page">
            {current?.label ?? 'Overview'}
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            System status: operational
          </span>
          <span className="hidden items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-inset ring-ink-100 md:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {today}
          </span>

          <div ref={popRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative rounded-xl p-2.5 text-ink-600 hover:bg-ink-100"
              aria-label={`Notifications, ${unread.length} unread`}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unread.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
                  {unread.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  role="dialog"
                  aria-label="Notifications"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-ink-100 bg-white p-3 shadow-lift"
                >
                  <div className="flex items-center justify-between px-2 pb-2">
                    <h2 className="text-sm font-semibold">Notifications</h2>
                    <button
                      type="button"
                      onClick={() => setRead(alerts.map((a) => a.id))}
                      disabled={unread.length === 0}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-ink-300"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {alerts.map((a) => {
                      const isUnread = !read.includes(a.id);
                      return (
                        <li key={a.id}>
                          <Link
                            to={a.to}
                            onClick={() => {
                              setRead((r) => (r.includes(a.id) ? r : [...r, a.id]));
                              setOpen(false);
                            }}
                            className="flex items-start gap-3 rounded-2xl px-2 py-2.5 hover:bg-ink-50"
                          >
                            <span
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: isUnread ? RISK_META[a.level ?? 'medium'].color : '#C9D1E6' }}
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className={cn('block text-sm', isUnread ? 'font-semibold text-ink-900' : 'text-ink-600')}>{a.title}</span>
                              <span className="block text-xs text-ink-400">
                                {a.detail} · {timeAgo(a.minutesAgo)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

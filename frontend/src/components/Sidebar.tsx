import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio, ShieldCheck, X } from 'lucide-react';
import { NAV_ITEMS } from '../data/navigation';
import { cn } from '../lib/utils';

interface SidebarContentProps {
  collapsed: boolean;
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
  onClose?: () => void;
}

function SidebarContent({ collapsed, variant, onNavigate, onClose }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3 px-5 pb-4 pt-5', collapsed && 'justify-center px-0')}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan2-400 via-brand-500 to-violet-500 text-white shadow-tile">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold leading-none text-ink-900">TrichyGuard</p>
            <p className="mt-1 text-xs text-ink-400">Tiruchirappalli road safety</p>
          </div>
        )}
        {variant === 'mobile' && onClose && (
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100" aria-label="Close navigation">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                collapsed && 'justify-center',
                isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`nav-active-${variant}`}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan2-50 via-brand-50 to-violet-50 shadow-soft ring-1 ring-brand-100"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId={`nav-bar-${variant}`}
                    className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-gradient-to-b from-brand-500 to-violet-500"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <motion.span whileHover={{ scale: 1.15, rotate: -6 }} whileTap={{ scale: 0.92 }} className="relative flex shrink-0">
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-brand-500')} aria-hidden="true" />
                </motion.span>
                {!collapsed && <span className="relative truncate">{item.label}</span>}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lift transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    {item.label}
                  </span>
                )}
                {collapsed && <span className="sr-only">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        {collapsed ? (
          <div className="flex justify-center py-2 text-emerald-500" title="System status: operational">
            <Radio className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">System status: operational</span>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-cyan2-50 to-brand-50 p-4 shadow-soft ring-1 ring-emerald-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              System status
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">All monitoring services are operational across the five zones.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 84 : 272 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        className="glass fixed inset-y-0 left-0 z-40 hidden border-y-0 border-l-0 lg:block"
        aria-label="Sidebar"
      >
        <SidebarContent collapsed={collapsed} variant="desktop" />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[286px] max-w-[86vw] bg-white shadow-lift lg:hidden"
              aria-label="Navigation drawer"
            >
              <SidebarContent collapsed={false} variant="mobile" onNavigate={onCloseMobile} onClose={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

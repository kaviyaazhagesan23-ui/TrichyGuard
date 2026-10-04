import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useMediaQuery } from '../hooks/useMediaQuery';

const STORAGE_KEY = 'trichyguard-sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* storage unavailable: ignore */
    }
  }, [collapsed]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="animate-blob absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl" />
        <div className="animate-blob absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-300/25 blur-3xl [animation-delay:-6s]" />
        <div className="animate-blob absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-teal-300/25 blur-3xl [animation-delay:-12s]" />
      </div>

      <a
        href="#main"
        className="sr-only z-[60] rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <motion.div
        initial={false}
        animate={{ paddingLeft: isDesktop ? (collapsed ? 84 : 272) : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        className="min-h-screen"
      >
        <Topbar collapsed={collapsed} onOpenMobile={() => setMobileOpen(true)} onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 pb-16 pt-6 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </motion.div>
    </div>
  );
}

import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import AppShell from './components/AppShell';
import LoadingSkeleton from './components/LoadingSkeleton';

const Overview = lazy(() => import('./pages/Overview'));
const RiskPrediction = lazy(() => import('./pages/RiskPrediction'));





const FutureRiskPrediction = lazy(
  () => import('./pages/FutureRiskPrediction'),
);

const BatchRiskPrediction = lazy(
  () => import('./pages/BatchRiskPrediction'),
);

const ZoneClassification = lazy(() => import('./pages/ZoneClassification'));
const RiskMap = lazy(() => import('./pages/RiskMap'));
const HospitalSearch = lazy(() => import('./pages/HospitalSearch'));
const AmbulanceRouting = lazy(() => import('./pages/AmbulanceRouting'));
const Weather = lazy(() => import('./pages/Weather'));

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Routes location={location}>
                <Route path="/" element={<Overview />} />
                <Route path="/risk-prediction" element={<RiskPrediction />} />
                <Route
  path="/future-risk-prediction"
  element={<FutureRiskPrediction />}
/>

<Route
  path="/batch-risk-prediction"
  element={<BatchRiskPrediction />}
/>
                <Route path="/zone-classification" element={<ZoneClassification />} />
                <Route path="/risk-map" element={<RiskMap />} />
                <Route path="/hospital-search" element={<HospitalSearch />} />
                <Route path="/ambulance-routing" element={<AmbulanceRouting />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}

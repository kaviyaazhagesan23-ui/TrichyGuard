import {
  Ambulance,
  CalendarClock,
  CloudSun,
  Hospital,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Citywide risk, trends and quick actions.',
  },
  {
    to: '/risk-prediction',
    label: 'Accident Risk Prediction',
    icon: ShieldAlert,
    description: 'Assess accident risk for the conditions you choose.',
  },
  {
    to: '/future-risk-prediction',
    label: 'Future Risk Prediction',
    icon: CalendarClock,
    description: 'Predict accident risk for a future date and time.',
  },
  {
    to: '/batch-risk-prediction',
    label: 'Batch Risk Prediction',
    icon: LayoutGrid,
    description: 'Compare predicted risk across all five Trichy zones.',
  },
  {
    to: '/zone-classification',
    label: 'Zone Classification',
    icon: LayoutGrid,
    description: 'Classify a zone as low, medium or high risk.',
  },
  {
    to: '/risk-map',
    label: 'Risk Map',
    icon: MapIcon,
    description: 'Explore risk markers and zones across Tiruchirappalli.',
  },
  {
    to: '/hospital-search',
    label: 'Hospital Search',
    icon: Hospital,
    description: 'Find hospitals within a radius of any zone.',
  },
  {
    to: '/ambulance-routing',
    label: 'Ambulance Routing',
    icon: Ambulance,
    description: 'Plan a route from an accident location to a hospital.',
  },
  {
    to: '/weather',
    label: 'Weather',
    icon: CloudSun,
    description: 'Weather monitoring for road safety, by zone.',
  },
];
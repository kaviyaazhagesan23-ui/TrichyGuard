import type { ActivityItem } from '../types';

export const ACTIVITY: ActivityItem[] = [
  { id: 'a1', kind: 'alert', title: 'High risk flagged in Rockfort', detail: 'Evening peak combined with rain', minutesAgo: 6, level: 'high', to: '/risk-map' },
  { id: 'a2', kind: 'route', title: 'Route planned to Cantonment General Hospital', detail: '3.4 km from Thillai Nagar', minutesAgo: 21, to: '/ambulance-routing' },
  { id: 'a3', kind: 'prediction', title: 'Risk assessed for Cantonment', detail: 'Result: high risk', minutesAgo: 48, level: 'high', to: '/risk-prediction' },
  { id: 'a4', kind: 'weather', title: 'Rain expected this afternoon', detail: 'Wet-road risk rises after 2 PM', minutesAgo: 95, to: '/weather' },
  { id: 'a5', kind: 'zone', title: 'Ariyamangalam reviewed', detail: 'Remains medium risk', minutesAgo: 180, level: 'medium', to: '/zone-classification' },
];

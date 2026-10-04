import { Fragment, forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, latLngBounds, type DivIcon, type Layer, type Map as LeafletMap } from 'leaflet';
import { useReducedMotion } from 'framer-motion';
import { TRICHY_CENTER } from '../config';
import type { LatLngTuple } from '../types';
import { cn } from '../lib/utils';

export type PinKind = 'dot' | 'hospital' | 'origin' | 'location' | 'ambulance';

export interface MapPoint {
  id: string;
  position: LatLngTuple;
  color: string;
  label: string;
  kind?: PinKind;
  emphasis?: boolean;
  popup?: ReactNode;
}

export interface MapArea {
  id: string;
  center: LatLngTuple;
  radiusM: number;
  color: string;
  label: string;
  selected?: boolean;
}

export interface MapPath {
  id: string;
  positions: LatLngTuple[];
  color: string;
  animated?: boolean;
}

export interface MapRadius {
  center: LatLngTuple;
  radiusKm: number;
  /** Change this value to replay the expansion from the centre. */
  runKey: string | number;
  color?: string;
}

interface InteractiveMapProps {
  center?: LatLngTuple;
  zoom?: number;
  points?: MapPoint[];
  areas?: MapArea[];
  paths?: MapPath[];
  radius?: MapRadius | null;
  movingPath?: LatLngTuple[];
  selectedPointId?: string | null;
  /** Change to replay the marker entrance animation. */
  animateKey?: string | number;
  onPointSelect?: (id: string) => void;
  onAreaSelect?: (id: string) => void;
  onMapClick?: (position: LatLngTuple) => void;
  fit?: { key: string | number; positions: LatLngTuple[] };
  focus?: { key: string; position: LatLngTuple } | null;
  scrollWheelZoom?: boolean;
  height?: string;
  className?: string;
  ariaLabel: string;
  /** Overlay content (legend, floating buttons) rendered above the map. */
  children?: ReactNode;
}

const GLYPHS: Record<Exclude<PinKind, 'dot'>, string> = {
  hospital:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  origin:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="3.5" fill="currentColor"/><circle cx="12" cy="12" r="9"/></svg>',
  location:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>',
  ambulance:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6M8 8v4M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
};

const iconCache = new Map<string, DivIcon>();

function pinIcon(kind: Exclude<PinKind, 'dot'>, color: string, emphasis: boolean, delayMs: number): DivIcon {
  const key = `${kind}-${color}-${emphasis}-${delayMs}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const size = emphasis ? 46 : 38;
  const ring = emphasis ? 4 : 2;
  const pulse =
    kind === 'location'
      ? `<span style="position:absolute;inset:-10px;border-radius:50%;border:2px solid ${color};opacity:.5;animation:tg-pulse-ring 2s ease-out infinite"></span>`
      : '';
  const html = `<div class="tg-pop" style="animation-delay:${delayMs}ms"><div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:${kind === 'location' ? '50%' : '14px'};background:linear-gradient(145deg, ${color}, ${color}cc);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 12px 22px -6px ${color}bb,0 0 0 ${ring}px #fff;">${pulse}${GLYPHS[kind]}</div></div>`;
  const icon = divIcon({
    html,
    className: 'tg-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  iconCache.set(key, icon);
  return icon;
}

function FitBounds({ fit }: { fit?: { key: string | number; positions: LatLngTuple[] } }) {
  const map = useMap();
  const key = fit?.key;
  useEffect(() => {
    if (!fit || fit.positions.length === 0) return;
    if (fit.positions.length === 1) {
      map.setView(fit.positions[0], Math.max(map.getZoom(), 14));
      return;
    }
    map.fitBounds(latLngBounds(fit.positions), { padding: [56, 56], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function FlyToFocus({ focus }: { focus?: { key: string; position: LatLngTuple } | null }) {
  const map = useMap();
  const reduced = useReducedMotion();
  const key = focus?.key;
  useEffect(() => {
    if (!focus) return;
    const zoom = Math.max(map.getZoom(), 14);
    if (reduced) map.setView(focus.position, zoom);
    else map.flyTo(focus.position, zoom, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map, reduced]);
  return null;
}

function MapClicks({ onClick }: { onClick?: (position: LatLngTuple) => void }) {
  useMapEvents({
    click(e) {
      onClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function RadiusCircle({ center, radiusKm, runKey, color = '#7C4DFF' }: MapRadius) {
  const reduced = useReducedMotion();
  const [meters, setMeters] = useState<number>(reduced ? radiusKm * 1000 : 0);
  const previous = useRef<number>(reduced ? radiusKm * 1000 : 0);
  const lastKey = useRef<string | number>(runKey);

  useEffect(() => {
    const target = radiusKm * 1000;
    if (reduced) {
      setMeters(target);
      previous.current = target;
      return undefined;
    }
    const from = lastKey.current !== runKey ? 0 : previous.current;
    lastKey.current = runKey;
    const start = performance.now();
    const duration = 950;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      previous.current = value;
      setMeters(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [radiusKm, runKey, reduced]);

  if (meters <= 0) return null;
  return (
    <>
      <Circle
        center={center}
        radius={meters}
        interactive={false}
        pathOptions={{ color, weight: 2.5, fillColor: color, fillOpacity: 0.12, dashArray: '8 8', className: 'tg-radius' }}
      />
      <Circle center={center} radius={meters * 0.55} interactive={false} pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: 0.06, opacity: 0.35 }} />
    </>
  );
}

function MovingMarker({ path }: { path: LatLngTuple[] }) {
  const reduced = useReducedMotion();
  const [position, setPosition] = useState<LatLngTuple>(path[0]);

  useEffect(() => {
    if (reduced || path.length < 2) {
      setPosition(path[0]);
      return undefined;
    }
    const travelMs = 9000;
    const pauseMs = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, ((now - start) % (travelMs + pauseMs)) / travelMs);
      const exact = t * (path.length - 1);
      const i = Math.floor(exact);
      const f = exact - i;
      const a = path[i];
      const b = path[Math.min(i + 1, path.length - 1)];
      setPosition([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [path, reduced]);

  return <Marker position={position} icon={pinIcon('ambulance', '#FF5A4D', true, 0)} interactive={false} keyboard={false} zIndexOffset={1000} />;
}

const InteractiveMap = forwardRef<LeafletMap, InteractiveMapProps>(function InteractiveMap(
  {
    center = TRICHY_CENTER,
    zoom = 12,
    points = [],
    areas = [],
    paths = [],
    radius,
    movingPath,
    selectedPointId,
    animateKey = 'static',
    onPointSelect,
    onAreaSelect,
    onMapClick,
    fit,
    focus,
    scrollWheelZoom = false,
    height = '420px',
    className,
    ariaLabel,
    children,
  },
  ref,
) {
  const layerRefs = useRef(new Map<string, Layer>());

  useEffect(() => {
    if (!selectedPointId) return undefined;
    const id = window.setTimeout(() => layerRefs.current.get(selectedPointId)?.openPopup(), 380);
    return () => window.clearTimeout(id);
  }, [selectedPointId, animateKey]);

  const register = (id: string) => (layer: Layer | null) => {
    if (layer) layerRefs.current.set(id, layer);
    else layerRefs.current.delete(id);
  };

  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-3xl border border-white/90 bg-ink-50 shadow-lift', className)}
      style={{ height }}
      role="region"
      aria-label={ariaLabel}
    >
      <MapContainer ref={ref} center={center} zoom={zoom} zoomControl={false} scrollWheelZoom={scrollWheelZoom} className="z-0 h-full w-full">
        <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  maxZoom={19}
/>
        <ZoomControl position="topleft" />
        <ResizeWatcher />
        <FitBounds fit={fit} />
        <FlyToFocus focus={focus} />
        <MapClicks onClick={onMapClick} />

        {areas.map((a) => (
          <Circle
            key={a.id}
            center={a.center}
            radius={a.radiusM}
            pathOptions={{
              color: a.color,
              weight: a.selected ? 3 : 1.5,
              fillColor: a.color,
              fillOpacity: a.selected ? 0.3 : 0.14,
              dashArray: a.selected ? undefined : '4 6',
              bubblingMouseEvents: false,
            }}
            eventHandlers={{ click: () => onAreaSelect?.(a.id) }}
          >
            <Tooltip sticky>{a.label}</Tooltip>
          </Circle>
        ))}

        {radius && <RadiusCircle {...radius} />}

        {paths.map((p) => (
          <Fragment key={p.id}>
            <Polyline positions={p.positions} pathOptions={{ color: p.color, weight: 10, opacity: 0.22, lineCap: 'round' }} />
            <Polyline positions={p.positions} pathOptions={{ color: p.color, weight: 4.5, opacity: 0.95, lineCap: 'round' }} />
            {p.animated && <Polyline positions={p.positions} pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.9, className: 'route-flow' }} />}
          </Fragment>
        ))}

        {points.map((p, index) => {
          const selected = p.id === selectedPointId || Boolean(p.emphasis);
          const delay = Math.min(index, 14) * 70 + 120;
          const handlers = { click: () => onPointSelect?.(p.id) };
          if (p.kind && p.kind !== 'dot') {
            return (
              <Marker
                key={`${animateKey}-${p.id}`}
                ref={register(p.id)}
                position={p.position}
                icon={pinIcon(p.kind, p.color, selected, delay)}
                eventHandlers={handlers}
                title={p.label}
              >
                <Tooltip direction="top" offset={[0, -20]}>
                  {p.label}
                </Tooltip>
                {p.popup && (
                  <Popup closeButton={false} className="tg-popup" minWidth={250} maxWidth={320}>
                    {p.popup}
                  </Popup>
                )}
              </Marker>
            );
          }
          return (
            <CircleMarker
              key={`${animateKey}-${p.id}`}
              ref={register(p.id)}
              center={p.position}
              radius={selected ? 13 : 9}
              pathOptions={{
                color: '#ffffff',
                weight: selected ? 4 : 2.5,
                fillColor: p.color,
                fillOpacity: 0.95,
                bubblingMouseEvents: false,
                className: 'tg-dot',
              }}
              eventHandlers={{
                ...handlers,
                mouseover: (e) => e.target.setRadius(14),
                mouseout: (e) => e.target.setRadius(selected ? 13 : 9),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {p.label}
              </Tooltip>
              {p.popup && (
                <Popup closeButton={false} className="tg-popup" minWidth={250} maxWidth={320}>
                  {p.popup}
                </Popup>
              )}
            </CircleMarker>
          );
        })}

        {movingPath && movingPath.length > 1 && <MovingMarker path={movingPath} />}
      </MapContainer>
      {children}
    </div>
  );
});

export default InteractiveMap;

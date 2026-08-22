import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeApi } from '../../api/route';
import { TripRoute } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { MapPin } from 'lucide-react';

// Default Leaflet marker icons break under Vite bundling
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface TripRouteMapProps {
  tripId: number | string;
  className?: string;
}

export const TripRouteMap: React.FC<TripRouteMapProps> = ({ tripId, className = '' }) => {
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    routeApi
      .getTripRoute(tripId)
      .then(setRoute)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tripId]);

  const positions = useMemo(
    () => route?.stops.map((s) => [s.latitude, s.longitude] as [number, number]) ?? [],
    [route]
  );

  const center = useMemo((): [number, number] => {
    if (positions.length === 0) return [20, 0];
    const lat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
    const lng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
    return [lat, lng];
  }, [positions]);

  if (loading) {
    return <Skeleton className={`h-64 w-full rounded-2xl ${className}`} />;
  }

  if (error || !route || positions.length === 0) {
    return (
      <div
        className={`h-48 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-sm text-slate-500 ${className}`}
      >
        <MapPin className="h-8 w-8 text-slate-300" />
        Route map unavailable for this trip.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft ${className}`}>
      <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center gap-2">
        <MapPin className="h-4 w-4 text-brand-400" />
        <span className="text-xs font-bold uppercase tracking-wider">Route map</span>
        <span className="text-xs text-slate-400 ml-auto">{route.stops.length} stops</span>
      </div>
      <MapContainer
        center={center}
        zoom={positions.length === 1 ? 8 : 5}
        scrollWheelZoom={false}
        className="h-64 w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: '#0d9488', weight: 3, dashArray: '8 6' }} />
        )}
        {route.stops.map((stop) => (
          <Marker key={stop.city_id} position={[stop.latitude, stop.longitude]}>
            <Popup>
              <span className="text-xs font-bold">
                {stop.order_index}. {stop.city_name}
              </span>
              <br />
              <span className="text-[10px] text-slate-500">{stop.country}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

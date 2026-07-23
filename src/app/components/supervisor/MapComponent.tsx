import { useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ServiceOrder, Structure } from '../../data/types';
import { isUtmCoord, utmToLatLng } from '../../../utils/coordinateUtils';
import {
  computeStructureStatus,
  STRUCTURE_STATUS_COLORS as STATUS_COLORS,
  STRUCTURE_STATUS_LABELS as STATUS_LABELS,
} from '../../data/structureStatus';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:20px;height:20px;border-radius:50% 50% 50% 0;
          background:${color};
          transform:rotate(-45deg);
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 22],
    popupAnchor: [0, -24],
  });
}

function makeAddIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:#AA8933;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:20px;line-height:1;
        cursor:pointer;
      ">+</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface MapComponentProps {
  structures: Structure[];
  orders?: ServiceOrder[];
  onMapClick?: (lat: number, lng: number) => void;
  pendingPin?: { lat: number; lng: number } | null;
  onStructureClick?: (structure: Structure) => void;
  isAddingMode?: boolean;
}

export function MapComponent({
  structures,
  orders = [],
  onMapClick,
  pendingPin,
  onStructureClick,
  isAddingMode = false,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pendingMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onStructureClickRef = useRef(onStructureClick);
  const structuresRef = useRef(structures);
  const ordersRef = useRef(orders);

  const CENTER: [number, number] = [-9.4419, -36.7673];

  // Keep refs in sync without re-running effects
  useEffect(() => { onStructureClickRef.current = onStructureClick; }, [onStructureClick]);
  useEffect(() => { structuresRef.current = structures; }, [structures]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Render markers — can be called from map-init OR structures effect
  const renderMarkers = useCallback((map: L.Map, structs: Structure[], ords: ServiceOrder[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validPoints: L.LatLngTuple[] = [];

    structs.forEach((s) => {
      const coordX = Number(s.coordX);
      const coordY = Number(s.coordY);
      const fallbackLat = Number(s.lat ?? s.coordY ?? 0);
      const fallbackLng = Number(s.lng ?? s.coordX ?? 0);
      const progressiva = Number.isFinite(Number(s.progressiva)) ? Number(s.progressiva) : 0;

      const hasUtm = Number.isFinite(coordX) && Number.isFinite(coordY) && isUtmCoord(coordX, coordY);
      const geo = hasUtm
        ? utmToLatLng(coordX, coordY)
        : { lat: Number.isFinite(fallbackLat) ? fallbackLat : 0, lng: Number.isFinite(fallbackLng) ? fallbackLng : 0 };

      const lat = Number(geo.lat);
      const lng = Number(geo.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
      if (lat === 0 && lng === 0) return;

      validPoints.push([lat, lng]);

      const displayStatus = computeStructureStatus(s, ords);
      const color = STATUS_COLORS[displayStatus] || '#6b7280';
      const marker = L.marker([lat, lng], { icon: makeIcon(color) });

      const popupContent = `
        <div style="font-family:sans-serif;min-width:160px;">
          <div style="font-weight:600;color:#193A2A;font-size:13px;margin-bottom:4px;">${s.name || 'Estrutura sem nome'}</div>
          <div style="font-size:11px;color:#555;margin-bottom:2px;">Tipo: ${s.type || '—'}</div>
          <div style="font-size:11px;color:#555;margin-bottom:2px;">Progressiva: ${progressiva.toLocaleString('pt-BR')} m</div>
          <div style="font-size:11px;color:#555;margin-bottom:6px;">${s.lt || '—'}</div>
          <div style="display:inline-block;font-size:10px;padding:2px 8px;border-radius:12px;background:${color};color:white;">
            ${STATUS_LABELS[displayStatus] || 'Sem status'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 220 });
      marker.on('click', () => onStructureClickRef.current?.(s));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Auto-fit map to show all structure markers
    if (validPoints.length > 0) {
      if (validPoints.length === 1) {
        map.setView(validPoints[0], 14);
      } else {
        map.fitBounds(L.latLngBounds(validPoints), { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CENTER,
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    circleRef.current = L.circle(CENTER, {
      radius: 40000,
      color: '#AA8933',
      fillColor: '#AA8933',
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '6,4',
    }).addTo(map);

    L.marker(CENTER, {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          background:#193A2A;color:white;
          font-size:8px;padding:3px 6px;border-radius:4px;
          white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);
          font-family:sans-serif;
        ">⛏ Vale Verde</div>`,
        iconAnchor: [40, 14],
      }),
    }).addTo(map);

    mapRef.current = map;

    // Force Leaflet to recalculate container size (needed after lazy load / conditional render)
    setTimeout(() => {
      map.invalidateSize();
      // Render markers that may have arrived before the map was ready
      if (structuresRef.current.length > 0) {
        renderMarkers(map, structuresRef.current, ordersRef.current);
      }
    }, 50);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers whenever structures or orders change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    renderMarkers(map, structures, orders);
  }, [structures, orders, renderMarkers]);

  // Click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function onClick(e: L.LeafletMouseEvent) {
      if (isAddingMode && onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, [isAddingMode, onMapClick]);

  // Cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().style.cursor = isAddingMode ? 'crosshair' : '';
  }, [isAddingMode]);

  // Pending pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (pendingPin && Number.isFinite(pendingPin.lat) && Number.isFinite(pendingPin.lng)) {
      pendingMarkerRef.current = L.marker([pendingPin.lat, pendingPin.lng], {
        icon: makeAddIcon(),
      }).addTo(map);
    }
  }, [pendingPin]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3 z-[1000]">
        <div className="text-xs font-medium mb-2" style={{ color: '#193A2A' }}>Legenda</div>
        <div className="space-y-1">
          {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
              <span className="text-xs text-gray-600">{STATUS_LABELS[key]}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
          <div className="w-12 h-0.5" style={{ borderTop: '1.5px dashed #AA8933' }} />
          <span className="text-xs text-gray-400">Raio 40km</span>
        </div>
      </div>

      {isAddingMode && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-lg z-[1000] text-xs"
          style={{ color: '#AA8933' }}
        >
          Toque no mapa para posicionar a estrutura
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

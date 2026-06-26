'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Cat, EmergencyReport, HealthStatus } from '@/lib/types';

const healthColors: Record<HealthStatus, string> = {
  healthy: '#10b981',
  needs_attention: '#f59e0b',
  injured: '#ef4444',
  unknown: '#6b7280',
};

/**
 * Convert an SVG string to a data-URI that is safe for Leaflet icon URLs.
 * IMPORTANT: Do NOT use btoa() here — it only handles Latin1 characters and
 * will crash on emoji or other Unicode (e.g. the cat emoji 🐱 in the SVG).
 * Instead we use encodeURIComponent which handles all of Unicode correctly.
 */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Custom cat icon with health status color
function createCatIcon(healthStatus: HealthStatus): L.Icon {
  const color = healthColors[healthStatus];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="28" height="35">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 24 12 24s12-15 12-24C28 5.4 22.6 0 16 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <text x="16" y="16" text-anchor="middle" font-size="14" fill="#fff">\u{1F431}</text>
  </svg>`;
  return L.icon({
    iconUrl: svgToDataUri(svg),
    iconSize: [28, 35],
    iconAnchor: [14, 35],
    popupAnchor: [0, -30],
  });
}

// Custom colored building icons
function createBuildingIcon(color: string): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: svgToDataUri(svg),
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -30],
  });
}

// Emergency icon (red pulsing-style pin)
function createEmergencyIcon(): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
    <text x="12" y="15" text-anchor="middle" font-size="12" fill="#fff">!</text>
  </svg>`;
  return L.icon({
    iconUrl: svgToDataUri(svg),
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -30],
  });
}

// UTM Campus landmarks and buildings
export const utmBuildings = [
  { name: 'Main Gate (Pintu Utama)', lat: 1.5581, lng: 103.6360, type: 'gate', desc: 'Main entrance to UTM campus' },
  { name: 'Chancellery (Canseleri)', lat: 1.5590, lng: 103.6370, type: 'admin', desc: 'University administration building' },
  { name: 'Perpustakaan Sultan Ismail', lat: 1.5588, lng: 103.6390, type: 'library', desc: 'Main campus library' },
  { name: 'Faculty of Computing (FC)', lat: 1.5593, lng: 103.6395, type: 'faculty', desc: 'School of Computing, home to CS & SE programs' },
  { name: 'Faculty of Electrical Engineering (FKE)', lat: 1.5605, lng: 103.6385, type: 'faculty', desc: 'Electrical & Electronic Engineering' },
  { name: 'Faculty of Mechanical Engineering (FKM)', lat: 1.5608, lng: 103.6398, type: 'faculty', desc: 'Mechanical Engineering faculty' },
  { name: 'Faculty of Civil Engineering (FKA)', lat: 1.5600, lng: 103.6405, type: 'faculty', desc: 'Civil Engineering faculty' },
  { name: 'Faculty of Science (FS)', lat: 1.5585, lng: 103.6410, type: 'faculty', desc: 'Physics, Chemistry, Mathematics & Bioscience' },
  { name: 'Faculty of Built Environment (FAB)', lat: 1.5578, lng: 103.6400, type: 'faculty', desc: 'Architecture & Surveying' },
  { name: 'Razak Faculty (FR)', lat: 1.5572, lng: 103.6378, type: 'faculty', desc: 'Razak Faculty of Technology and Informatics' },
  { name: 'School of Graduate Studies', lat: 1.5595, lng: 103.6380, type: 'admin', desc: 'Postgraduate administration' },
  { name: 'Student Affairs (HEP)', lat: 1.5583, lng: 103.6382, type: 'admin', desc: 'Hal Ehwal Pelajar — student services' },
  { name: 'Kolej Kediaman Tun Razak (KTR)', lat: 1.5570, lng: 103.6365, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Kolej Kediaman Tuanku Canselor (KTC)', lat: 1.5565, lng: 103.6380, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Kolej Kediaman 9th College (K9)', lat: 1.5560, lng: 103.6395, type: 'residential', desc: 'On-campus student residence' },
  { name: 'Masjid Sultan Ismail', lat: 1.5588, lng: 103.6378, type: 'mosque', desc: 'Main campus mosque' },
  { name: 'UTM Stadium', lat: 1.5565, lng: 103.6355, type: 'sports', desc: 'Main sports stadium' },
  { name: 'Sports Complex (Kompleks Sukan)', lat: 1.5570, lng: 103.6345, type: 'sports', desc: 'Swimming pool, courts, gym' },
  { name: 'Cafeteria / Food Court', lat: 1.5590, lng: 103.6388, type: 'food', desc: 'Campus food court and dining area' },
  { name: 'UTM Bus Terminal', lat: 1.5585, lng: 103.6372, type: 'transport', desc: 'Campus bus terminal & shuttle stop' },
  { name: 'Innovation Centre', lat: 1.5598, lng: 103.6375, type: 'admin', desc: 'Research & innovation hub' },
];

const buildingTypeColors: Record<string, string> = {
  gate: '#3b82f6',
  admin: '#6366f1',
  library: '#8b5cf6',
  faculty: '#0ea5e9',
  residential: '#f59e0b',
  mosque: '#10b981',
  sports: '#ef4444',
  food: '#f97316',
  transport: '#64748b',
};

interface UTMMapProps {
  center: [number, number];
  cats: Cat[];
  emergencies: EmergencyReport[];
  selectedBuilding?: string | null;
  /** Optional: if provided, the map becomes "pickable" — clicking drops a pin. */
  pickMode?: boolean;
  pickedPosition?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
}

function MapResizer() {
  const map = useMap();
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
  return null;
}

function FlyToBuilding({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 18, { duration: 0.8 });
  return null;
}

// Handles map clicks in pick mode
function PickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Pin icon for pick mode
function createPickPinIcon(): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 24 12 24s12-15 12-24C28 5.4 22.6 0 16 0z" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

export function UTMMap({ center, cats, emergencies, selectedBuilding, pickMode, pickedPosition, onPick }: UTMMapProps) {
  const selected = selectedBuilding ? utmBuildings.find(b => b.name === selectedBuilding) : null;
  const pickPinIcon = createPickPinIcon();

  // Pre-create building icons (these don't change, so create once per render)
  const buildingIconCache = new Map<string, L.Icon>();
  function getBuildingIcon(type: string): L.Icon {
    if (!buildingIconCache.has(type)) {
      const color = buildingTypeColors[type] || '#3b82f6';
      buildingIconCache.set(type, createBuildingIcon(color));
    }
    return buildingIconCache.get(type)!;
  }

  // Pre-create cat icons by health status
  const catIconCache = new Map<HealthStatus, L.Icon>();
  function getCatIcon(status: HealthStatus): L.Icon {
    if (!catIconCache.has(status)) {
      catIconCache.set(status, createCatIcon(status));
    }
    return catIconCache.get(status)!;
  }

  // Create emergency icon once
  const emergencyIcon = createEmergencyIcon();

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <MapResizer />
      {pickMode && <PickHandler onPick={onPick} />}
      {selected && <FlyToBuilding lat={selected.lat} lng={selected.lng} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Picked position marker (in pick mode) */}
      {pickMode && pickedPosition && (
        <Marker
          position={pickedPosition}
          icon={pickPinIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker;
              const ll = m.getLatLng();
              onPick?.(ll.lat, ll.lng);
            },
          }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="text-xs font-medium">Pinned location</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">
                {pickedPosition[0].toFixed(5)}, {pickedPosition[1].toFixed(5)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Drag to adjust</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* UTM Campus Building Markers */}
      {utmBuildings.map((building, idx) => {
        const color = buildingTypeColors[building.type] || '#3b82f6';
        return (
          <Marker
            key={`building-${idx}`}
            position={[building.lat, building.lng]}
            icon={getBuildingIcon(building.type)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm" style={{ color }}>{building.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{building.desc}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {building.lat.toFixed(4)}, {building.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Cat markers — render registered cats from the database */}
      {cats.map((cat) => {
        // Defensive: ensure coordinates are valid numbers
        const lat = Number(cat.latitude);
        const lng = Number(cat.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker
            key={`cat-${cat.id}`}
            position={[lat, lng]}
            icon={getCatIcon(cat.healthStatus)}
          >
            <Popup>
              <div className="min-w-[200px]">
                {cat.photoUrl && (
                  <img
                    src={cat.photoUrl}
                    alt={cat.nickname}
                    className="w-full h-28 object-cover rounded-lg mb-2"
                  />
                )}
                <h3 className="font-bold text-sm flex items-center gap-1">
                  {cat.nickname}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  {cat.locationName}
                </p>
                <p className="text-xs mt-1">
                  Status: <span style={{ color: healthColors[cat.healthStatus] }} className="font-medium capitalize">
                    {cat.healthStatus.replace('_', ' ')}
                  </span>
                </p>
                <a
                  href={`/cats/${cat.id}`}
                  className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Emergency markers — render active emergencies from the database */}
      {emergencies.map((emerg) => {
        // Defensive: ensure coordinates are valid numbers
        const lat = Number(emerg.latitude);
        const lng = Number(emerg.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker
            key={`emerg-${emerg.id}`}
            position={[lat, lng]}
            icon={emergencyIcon}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-bold text-sm text-red-600">{emerg.title}</h3>
                <p className="text-xs text-gray-600">{emerg.locationName}</p>
                <p className="text-xs mt-1">
                  Priority: <span className="font-medium capitalize">{emerg.priority}</span>
                </p>
                <p className="text-xs">{emerg.description}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

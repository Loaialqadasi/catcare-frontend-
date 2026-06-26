'use client';

// LocationPicker — interactive Leaflet map for picking a location.
// Supports:
//   • Click anywhere on the map to drop a pin
//   • Search for a real place in/near UTM via the backend /api/map/geocode endpoint
//   • Quick-pick from predefined UTM buildings
//   • Drag the pin to fine-tune the position
//
// Used inside the Create Cat form (and reusable for emergencies, donations, etc.)

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, X, Crosshair } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { geocodeAddress, type GeocodeResult } from '@/lib/api-client';
import { utmBuildings } from '@/app/(main)/map/utm-map';

// UTM Campus center
const UTM_CENTER: [number, number] = [1.5595, 103.6388];

interface LocationPickerProps {
  latitude?: string;
  longitude?: string;
  locationName?: string;
  onLocationChange: (lat: string, lng: string, name?: string) => void;
  height?: string;
}

// Build a draggable cat-style pin icon
function createPinIcon(color = '#f59e0b'): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 24 12 24s12-15 12-24C28 5.4 22.6 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

// Click+drag handler — must be a child of MapContainer
function MapEventHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Re-center the map when an external position is set
function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const lastPos = useRef<string>('');
  useEffect(() => {
    if (position) {
      const key = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
      if (key !== lastPos.current) {
        map.flyTo(position, Math.max(map.getZoom(), 17), { duration: 0.6 });
        lastPos.current = key;
      }
    }
  }, [position, map]);
  return null;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  locationName,
  onLocationChange,
  height = '350px',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pinPos, setPinPos] = useState<[number, number] | null>(
    latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep pin position in sync with external prop changes
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPinPos([lat, lng]);
      }
    } else {
      setPinPos(null);
    }
  }, [latitude, longitude]);

  const pickLocation = useCallback(
    (lat: number, lng: number, name?: string) => {
      setPinPos([lat, lng]);
      onLocationChange(lat.toFixed(7), lng.toFixed(7), name);
    },
    [onLocationChange]
  );

  // Debounced search — fires 500ms after the user stops typing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim() || value.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Bias the search with "UTM" / "Johor Bahru" context if the user
        // didn't already include a region keyword.
        const q = /utm|johor|skudai/i.test(value)
          ? value
          : `${value} UTM Johor Bahru`;
        const results = await geocodeAddress(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleResultClick = (result: GeocodeResult) => {
    pickLocation(result.lat, result.lon, result.displayName);
    setSearchQuery(result.displayName.split(',')[0]);
    setShowResults(false);
  };

  const handleBuildingClick = (building: { name: string; lat: number; lng: number }) => {
    pickLocation(building.lat, building.lng, building.name);
    setSearchQuery(building.name);
    setShowResults(false);
  };

  // Use my current location (browser geolocation)
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickLocation(pos.coords.latitude, pos.coords.longitude, 'My current location');
        setSearchQuery('');
      },
      (err) => {
        alert(`Could not get your location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setPinPos(null);
    setSearchQuery('');
    onLocationChange('', '', '');
  };

  const pinIcon = createPinIcon();

  return (
    <div className="space-y-3">
      {/* Search bar with autocomplete dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a place in UTM (e.g., Library, Faculty of Computing, KTR)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searching && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showResults && (searchResults.length > 0 || searchQuery.trim().length >= 3) && (
          <div className="absolute z-[1000] mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            {searchResults.length === 0 && !searching && (
              <div className="p-3 text-sm text-muted-foreground">
                No places found. Try a different search term.
              </div>
            )}
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-2.5 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.displayName.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.displayName}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        className="relative rounded-lg overflow-hidden border border-border"
        style={{ height }}
      >
        <MapContainer
          center={pinPos ?? UTM_CENTER}
          zoom={pinPos ? 17 : 16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <ResizeFix />
          <MapEventHandler onPick={(lat, lng) => pickLocation(lat, lng)} />
          <Recenter position={pinPos} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pinPos && (
            <Marker
              position={pinPos}
              icon={pinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const ll = m.getLatLng();
                  pickLocation(ll.lat, ll.lng);
                },
              }}
            />
          )}
        </MapContainer>

        {/* Overlay hint */}
        {!pinPos && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[500] bg-background/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium shadow-md border border-border pointer-events-none">
            👆 Click on the map to drop a pin
          </div>
        )}

        {/* Coords readout */}
        {pinPos && (
          <div className="absolute bottom-2 left-2 z-[500] bg-background/95 backdrop-blur px-2.5 py-1.5 rounded-md text-xs font-mono shadow-md border border-border">
            {pinPos[0].toFixed(5)}, {pinPos[1].toFixed(5)}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          className="text-xs"
        >
          <Crosshair className="h-3.5 w-3.5 mr-1.5" />
          Use my location
        </Button>
        {pinPos && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearLocation}
            className="text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear pin
          </Button>
        )}
        {pinPos && (
          <span className="text-xs text-muted-foreground ml-auto">
            📍 Pin placed{locationName ? ` at ${locationName.split(',')[0]}` : ''}
          </span>
        )}
      </div>

      {/* Quick-pick UTM buildings */}
      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
          Quick-pick a UTM building ({utmBuildings.length} available)
        </summary>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1">
          {utmBuildings.map((b, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleBuildingClick(b)}
              className="text-left text-xs px-2 py-1.5 rounded border border-border hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors truncate"
              title={b.name}
            >
              {b.name}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

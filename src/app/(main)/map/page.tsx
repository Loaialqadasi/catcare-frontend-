'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchCats, fetchEmergencies, geocodeAddress } from '@/lib/api-client';
import { Search, Building2, X, AlertTriangle, MapPin, Loader2, Crosshair, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Cat, EmergencyReport, HealthStatus } from '@/lib/types';

// UTM Campus center
const UTM_CENTER: [number, number] = [1.5595, 103.6388];

const healthColors: Record<HealthStatus, string> = {
  healthy: '#10b981',
  needs_attention: '#f59e0b',
  injured: '#ef4444',
  unknown: '#6b7280',
};

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

const buildingTypeLabels: Record<string, string> = {
  gate: 'Gate',
  admin: 'Admin',
  library: 'Library',
  faculty: 'Faculty',
  residential: 'Residential',
  mosque: 'Mosque',
  sports: 'Sports',
  food: 'Food',
  transport: 'Transport',
};

const buildingTypeEmojis: Record<string, string> = {
  gate: '\u{1F6AA}',
  admin: '\u{1F3DB}\uFE0F',
  library: '\u{1F4DA}',
  faculty: '\u{1F393}',
  residential: '\u{1F3E0}',
  mosque: '\u{1F54C}',
  sports: '\u26BD',
  food: '\u{1F37D}\uFE0F',
  transport: '\u{1F68C}',
};

interface UTMBuilding {
  name: string;
  lat: number;
  lng: number;
  type: string;
  desc: string;
}

// Use next/dynamic with ssr:false to completely skip SSR for the Leaflet map.
// This prevents "window is not defined" errors because Leaflet requires the browser DOM.
// A loading placeholder is shown while the map component loads on the client.
const UTMMap = dynamic(
  () => import('./utm-map').then((mod) => mod.UTMMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

// Also dynamically import just the building data (no Leaflet dependency)
const buildingDataPromise = import('./utm-map').then((mod) => mod.utmBuildings);

// Error boundary for the map — catches render crashes (e.g. Leaflet errors)
// and shows a friendly message instead of killing the entire page.
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/30 gap-3 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h3 className="font-semibold text-lg">Map failed to load</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The interactive map encountered an error. This can happen if the map
            service is temporarily unavailable. Please try refreshing the page.
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MapPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<UTMBuilding[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Pick mode — lets the user click the map to drop a pin, then navigate
  // to the "Create Cat" form with those coordinates pre-filled.
  const [pickMode, setPickMode] = useState(false);
  const [pickedPos, setPickedPos] = useState<[number, number] | null>(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState<Array<{ lat: number; lon: number; displayName: string }>>([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [showPlaceResults, setShowPlaceResults] = useState(false);
  const router = useRouter();

  // Load buildings data on client only
  useEffect(() => {
    buildingDataPromise.then(setBuildings);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, emergRes] = await Promise.allSettled([
          fetchCats({ pageSize: 100 }),
          fetchEmergencies({ pageSize: 100 }),
        ]);
        if (catsRes.status === 'fulfilled') setCats(catsRes.value.items);
        if (emergRes.status === 'fulfilled') setEmergencies(emergRes.value.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const catsWithCoords = cats.filter((c) => c.latitude != null && c.longitude != null);
  const emergWithCoords = emergencies.filter(
    (e) => e.latitude != null && e.longitude != null && (e.status === 'open' || e.status === 'in_progress')
  );

  const filteredBuildings = useMemo(() => {
    let result = buildings;
    if (activeFilter) {
      result = result.filter(b => b.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [buildings, searchQuery, activeFilter]);

  const buildingTypes = useMemo(() => {
    const types = new Set(buildings.map(b => b.type));
    return Array.from(types);
  }, [buildings]);

  // Place search (debounced) — uses backend /api/map/geocode
  useEffect(() => {
    if (!placeSearch.trim() || placeSearch.trim().length < 3) {
      setPlaceResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setPlaceSearching(true);
      try {
        const q = /utm|johor|skudai/i.test(placeSearch)
          ? placeSearch
          : `${placeSearch} UTM Johor Bahru`;
        const results = await geocodeAddress(q);
        setPlaceResults(results);
        setShowPlaceResults(true);
      } catch {
        setPlaceResults([]);
      } finally {
        setPlaceSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [placeSearch]);

  const handlePlaceSelect = (lat: number, lon: number, name: string) => {
    setPickedPos([lat, lon]);
    setPickMode(true);
    setShowPlaceResults(false);
    setPlaceSearch(name.split(',')[0]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickedPos([pos.coords.latitude, pos.coords.longitude]);
        setPickMode(true);
      },
      (err) => alert(`Could not get your location: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddCatFromPin = () => {
    if (!pickedPos) return;
    // Pass coordinates via query params; the create form can read them
    const [lat, lng] = pickedPos;
    router.push(`/cats/new?lat=${lat.toFixed(7)}&lng=${lng.toFixed(7)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">UTM Campus Map</h1>
        <p className="text-muted-foreground">Interactive map showing cat locations, active emergencies, and campus landmarks at Universiti Teknologi Malaysia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Pick Mode toolbar */}
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={pickMode ? 'default' : 'outline'}
                  onClick={() => setPickMode(!pickMode)}
                  className={pickMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  {pickMode ? 'Pick mode ON — click map to drop pin' : 'Enable pick mode'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseMyLocation}
                >
                  <Crosshair className="h-3.5 w-3.5 mr-1.5" />
                  My location
                </Button>
                {pickedPos && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={handleAddCatFromPin}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add cat at this pin
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPickedPos(null)}
                      className="text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Clear pin
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono ml-auto">
                      {pickedPos[0].toFixed(5)}, {pickedPos[1].toFixed(5)}
                    </span>
                  </>
                )}
              </div>
              {/* Place search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search for a real place in UTM (e.g., Library, Cafeteria, KTR)..."
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  onFocus={() => setShowPlaceResults(true)}
                  className="pl-9 pr-9 h-8 text-sm"
                />
                {placeSearching && (
                  <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {placeSearch && (
                  <button
                    onClick={() => { setPlaceSearch(''); setPlaceResults([]); setShowPlaceResults(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {showPlaceResults && placeResults.length > 0 && (
                  <div className="absolute z-[1000] mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                    {placeResults.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlaceSelect(r.lat, r.lon, r.displayName)}
                        className="w-full text-left p-2.5 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.displayName.split(',')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.displayName}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50 overflow-hidden">
            <div className="h-[550px] w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full bg-muted/30">
                  <p className="text-muted-foreground">Loading map data...</p>
                </div>
              ) : (
                <MapErrorBoundary>
                  <UTMMap
                    center={UTM_CENTER}
                    cats={catsWithCoords}
                    emergencies={emergWithCoords}
                    selectedBuilding={selectedBuilding}
                    pickMode={pickMode}
                    pickedPosition={pickedPos}
                    onPick={(lat, lng) => {
                      setPickedPos([lat, lng]);
                      setPickMode(true);
                    }}
                  />
                </MapErrorBoundary>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Search Buildings */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Building
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search buildings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Type filter pills */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={activeFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-6 text-[10px] px-2 ${activeFilter === '' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                  onClick={() => setActiveFilter('')}
                >
                  All
                </Button>
                {buildingTypes.map(type => (
                  <Button
                    key={type}
                    variant={activeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    className={`h-6 text-[10px] px-2 ${activeFilter === type ? 'text-white' : ''}`}
                    style={activeFilter === type ? { backgroundColor: buildingTypeColors[type] } : {}}
                    onClick={() => setActiveFilter(activeFilter === type ? '' : type)}
                  >
                    {buildingTypeEmojis[type]} {buildingTypeLabels[type]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Building List */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Campus Buildings
                <span className="text-xs text-muted-foreground font-normal">({filteredBuildings.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {filteredBuildings.map((building, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedBuilding(selectedBuilding === building.name ? null : building.name)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors hover:bg-muted/50 ${
                      selectedBuilding === building.name ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: buildingTypeColors[building.type] || '#3b82f6' }}
                      />
                      <span className="font-medium truncate">{building.name}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 ml-[18px] line-clamp-1">{building.desc}</p>
                  </button>
                ))}
                {filteredBuildings.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No buildings found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Map Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Cats on map
                </span>
                <span className="font-semibold">{catsWithCoords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Active emergencies
                </span>
                <span className="font-semibold">{emergWithCoords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Campus buildings
                </span>
                <span className="font-semibold">{buildings.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Health Legend */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cat Health Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              {Object.entries(healthColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

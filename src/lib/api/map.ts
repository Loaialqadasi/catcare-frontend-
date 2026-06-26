// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Map / Geocoding API — proxies to Nominatim (OpenStreetMap) via the backend
// with rate limiting and a UTM-campus viewbox bias.

import { apiFetch, API_BASE, readEnvelope } from './client';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface PlaceResult {
  placeId: string;
  lat: number;
  lon: number;
  displayName: string;
  type: string;
  category: string;
}

interface RawGeocodeResult {
  lat: number | string;
  lon: number | string;
  displayName: string;
}

interface RawPlaceResult {
  placeId: number | string;
  lat: number | string;
  lon: number | string;
  displayName: string;
  type: string;
  category: string;
}

/**
 * Forward geocode: convert a place name / address to coordinates.
 * Biased toward the UTM campus area (Johor Bahru, Malaysia).
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const url = `${API_BASE}/map/geocode?q=${encodeURIComponent(query)}`;
  const res = await apiFetch(url);
  const data = await readEnvelope<RawGeocodeResult[] | null>(res, 'Geocoding failed');
  return (data ?? []).map((item) => ({
    lat: Number(item.lat),
    lon: Number(item.lon),
    displayName: item.displayName,
  }));
}

/**
 * Search for points of interest near UTM campus.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = `${API_BASE}/map/places?q=${encodeURIComponent(query)}`;
  const res = await apiFetch(url);
  const data = await readEnvelope<RawPlaceResult[] | null>(res, 'Places search failed');
  return (data ?? []).map((item) => ({
    placeId: String(item.placeId),
    lat: Number(item.lat),
    lon: Number(item.lon),
    displayName: item.displayName,
    type: item.type,
    category: item.category,
  }));
}

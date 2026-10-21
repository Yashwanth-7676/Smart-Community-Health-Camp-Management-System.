// src/services/routingService.ts
import apiClient from '@/api/client';

export interface RouteData {
  start: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  roadDistanceKm: number;
  straightLineDistanceKm: number;
  estimatedDurationMinutes: number;
  coordinates: Array<[number, number]>; // Array of [lat, lng]
  isFallback: boolean;
  provider: string;
  disclaimer: string;
}

export async function fetchCampRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RouteData> {
  try {
    const res = await apiClient.get('/camps/route', {
      params: { startLat, startLng, destLat, destLng },
    });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to fetch route');
  } catch (err) {
    // Client-side fallback if backend route endpoint is temporarily unreachable
    const straightKm = calculateDirectDistance(startLat, startLng, destLat, destLng);
    return {
      start: [startLat, startLng],
      destination: [destLat, destLng],
      roadDistanceKm: straightKm,
      straightLineDistanceKm: straightKm,
      estimatedDurationMinutes: Math.round((straightKm / 45) * 60),
      coordinates: [
        [startLat, startLng],
        [(startLat + destLat) / 2, (startLng + destLng) / 2],
        [destLat, destLng],
      ],
      isFallback: true,
      provider: 'Direct Geodesic Vector (Offline Fallback)',
      disclaimer: 'Live road routing engine unreachable. Displaying straight-line geodesic distance as fallback.',
    };
  }
}

export function calculateDirectDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}


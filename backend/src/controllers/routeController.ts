// backend/src/controllers/routeController.ts
import { Request, Response, NextFunction } from 'express';
import { calculateStraightLineDistance } from './campController';

export interface RouteResult {
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

// In-memory route cache to minimize external network requests
const ROUTE_CACHE = new Map<string, RouteResult>();

/**
 * GET /api/v1/camps/route
 * Calculate authentic road route between origin and destination camp
 * Falls back safely to straight-line geodesic distance if routing service unavailable
 */
export const getCampRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startLat, startLng, destLat, destLng } = req.query;

    const sLat = parseFloat(String(startLat));
    const sLng = parseFloat(String(startLng));
    const dLat = parseFloat(String(destLat));
    const dLng = parseFloat(String(destLng));

    if (isNaN(sLat) || isNaN(sLng) || isNaN(dLat) || isNaN(dLng)) {
      res.status(400).json({
        success: false,
        message: 'Valid startLat, startLng, destLat, and destLng query parameters are required.',
      });
      return;
    }

    const cacheKey = `${sLat.toFixed(4)},${sLng.toFixed(4)}_${dLat.toFixed(4)},${dLng.toFixed(4)}`;
    if (ROUTE_CACHE.has(cacheKey)) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      res.json({
        success: true,
        data: ROUTE_CACHE.get(cacheKey),
      });
      return;
    }

    const straightDist = calculateStraightLineDistance(sLat, sLng, dLat, dLng);

    let routeResult: RouteResult;

    try {
      // Call public OSRM car routing service (lng,lat order)
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'SmartHealthCamp/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json: any = await response.json();
        if (json.code === 'Ok' && json.routes && json.routes[0]) {
          const route = json.routes[0];
          const roadDistKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMins = Math.round(route.duration / 60);

          // Convert OSRM GeoJSON [lng, lat] to [lat, lng]
          const coords: Array<[number, number]> = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          routeResult = {
            start: [sLat, sLng],
            destination: [dLat, dLng],
            roadDistanceKm: roadDistKm,
            straightLineDistanceKm: straightDist,
            estimatedDurationMinutes: durationMins,
            coordinates: coords,
            isFallback: false,
            provider: 'OSRM Driving Engine (OpenStreetMap data)',
            disclaimer:
              'Road distance and travel times represent estimated vehicular navigation without live traffic congestion or roadblocks.',
          };
        } else {
          throw new Error('OSRM did not return valid routes');
        }
      } else {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }
    } catch (osrmErr) {
      // Graceful fallback to verified straight-line vector
      routeResult = {
        start: [sLat, sLng],
        destination: [dLat, dLng],
        roadDistanceKm: straightDist,
        straightLineDistanceKm: straightDist,
        estimatedDurationMinutes: Math.round((straightDist / 45) * 60), // Estimate at 45km/h regional transit
        coordinates: [
          [sLat, sLng],
          [(sLat + dLat) / 2, (sLng + dLng) / 2],
          [dLat, dLng],
        ],
        isFallback: true,
        provider: 'Geodesic Vector Fallback (Direct Straight-Line)',
        disclaimer:
          'Live road routing service is temporarily unreachable. Displaying direct geodesic vector as fallback.',
      };
    }

    ROUTE_CACHE.set(cacheKey, routeResult);

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({
      success: true,
      data: routeResult,
    });
  } catch (error) {
    next(error);
  }
};

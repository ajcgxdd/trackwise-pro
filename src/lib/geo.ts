import type { LatLng } from "@/types/shipment";

const R = 6371; // km

export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Sample a straight-line route into N waypoints. */
export function buildRoute(origin: LatLng, destination: LatLng, n = 40): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= n; i++) pts.push(interpolate(origin, destination, i / n));
  return pts;
}

export function pointAtProgress(route: LatLng[], progress: number): LatLng {
  const p = Math.max(0, Math.min(1, progress));
  const idx = p * (route.length - 1);
  const i = Math.floor(idx);
  const frac = idx - i;
  if (i >= route.length - 1) return route[route.length - 1];
  return interpolate(route[i], route[i + 1], frac);
}

export function totalDistance(route: LatLng[]): number {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversine(route[i - 1], route[i]);
  return d;
}

export function remainingDistance(route: LatLng[], progress: number): number {
  return totalDistance(route) * (1 - progress);
}

/** Distance from a point to the nearest point along the planned route (km). */
export function distanceToRoute(route: LatLng[], p: LatLng): number {
  let min = Infinity;
  for (const w of route) {
    const d = haversine(w, p);
    if (d < min) min = d;
  }
  return min;
}

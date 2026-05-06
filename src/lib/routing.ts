import type { LatLng } from "@/types/shipment";
import { haversine } from "./geo";

/** Nearest-neighbor TSP heuristic returning ordered indices starting at 0. */
export function optimizeStops(stops: LatLng[]): number[] {
  if (stops.length <= 2) return stops.map((_, i) => i);
  const visited = new Set<number>([0]);
  const order = [0];
  let current = 0;
  while (visited.size < stops.length) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < stops.length; i++) {
      if (visited.has(i)) continue;
      const d = haversine(stops[current], stops[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    order.push(best);
    visited.add(best);
    current = best;
  }
  return order;
}

export function routeDistance(stops: LatLng[], order: number[]): number {
  let d = 0;
  for (let i = 1; i < order.length; i++) d += haversine(stops[order[i - 1]], stops[order[i]]);
  return d;
}

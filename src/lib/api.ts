/**
 * API layer — currently in-memory using seeded data.
 *
 * To migrate to MongoDB: replace the bodies of these functions with `fetch`
 * calls to your Express+MongoDB backend. The TypeScript signatures map
 * directly to your REST endpoints (see MIGRATING_TO_MONGODB.md).
 */
import { SHIPMENTS, CARRIERS, GEOFENCES } from "@/data/seed";
import type {
  Shipment,
  ShipmentStatus,
  Carrier,
  Geofence,
  ProofOfDelivery,
  AuditEntry,
} from "@/types/shipment";
import { pointAtProgress } from "@/lib/geo";

let shipments: Shipment[] = SHIPMENTS;

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export async function getShipments(): Promise<Shipment[]> {
  await delay();
  return shipments;
}

export async function getShipmentById(id: string): Promise<Shipment | undefined> {
  await delay();
  return shipments.find((s) => s.id === id || s.trackingId === id);
}

export async function getCarriers(): Promise<Carrier[]> {
  await delay();
  return CARRIERS;
}

export async function getGeofences(): Promise<Geofence[]> {
  await delay();
  return GEOFENCES;
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  actor = "operator@lx"
): Promise<Shipment | undefined> {
  const s = shipments.find((x) => x.id === id);
  if (!s) return undefined;
  const before = s.status;
  s.status = status;
  s.timeline.push({ status, at: new Date().toISOString() });
  s.audit.push({
    id: `a-${Date.now()}`,
    at: new Date().toISOString(),
    actor,
    action: `status → ${status}`,
    before,
    after: status,
  });
  return s;
}

export async function addProofOfDelivery(
  id: string,
  pod: ProofOfDelivery,
  actor = "driver@lx"
): Promise<Shipment | undefined> {
  const s = shipments.find((x) => x.id === id);
  if (!s) return undefined;
  s.pod = { ...pod, at: new Date().toISOString() };
  s.status = "delivered";
  s.progress = 1;
  s.timeline.push({ status: "delivered", at: new Date().toISOString(), location: s.destination.name });
  s.audit.push({
    id: `a-${Date.now()}`,
    at: new Date().toISOString(),
    actor,
    action: "Proof of delivery uploaded",
    after: "delivered",
  });
  return s;
}

/** Used by the live simulation tick to bump progress in-transit. */
export function tickPositions(stepKmPerTick = 6): Shipment[] {
  shipments = shipments.map((s) => {
    if (!["in_transit", "out_for_delivery", "picked_up"].includes(s.status)) return s;
    const stepFrac = stepKmPerTick / Math.max(1, s.distanceKm);
    const newProgress = Math.min(1, s.progress + stepFrac);
    const next: Shipment = {
      ...s,
      progress: newProgress,
      current: pointAtProgress(s.routePolyline, newProgress),
    };
    if (newProgress >= 0.92 && s.status === "in_transit") next.status = "out_for_delivery";
    return next;
  });
  return shipments;
}

export function appendAudit(id: string, entry: Omit<AuditEntry, "id" | "at">) {
  const s = shipments.find((x) => x.id === id);
  if (!s) return;
  s.audit.push({
    id: `a-${Date.now()}`,
    at: new Date().toISOString(),
    ...entry,
  });
}

export function getAllAudit(): (AuditEntry & { trackingId: string })[] {
  return shipments
    .flatMap((s) => s.audit.map((a) => ({ ...a, trackingId: s.trackingId })))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

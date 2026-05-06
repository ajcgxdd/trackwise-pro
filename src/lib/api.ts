/**
 * API layer — connecting to Express+MongoDB backend.
 */
import type {
  Shipment,
  ShipmentStatus,
  Carrier,
  Geofence,
  ProofOfDelivery,
  AuditEntry,
} from "@/types/shipment";
import { pointAtProgress } from "@/lib/geo";
import { SHIPMENTS, CARRIERS, GEOFENCES, generateRandomShipments } from "@/data/seed"; // Imported for seeding the database

// Configure via your VITE_API_URL environment variable, falling back to local fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function seedDatabase(count?: number) {
  const shipmentsToUse = count ? generateRandomShipments(count) : SHIPMENTS;
  
  const res = await fetch(`${API_URL}/api/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shipments: shipmentsToUse,
      carriers: CARRIERS,
      geofences: GEOFENCES,
      append: !!count // If we pass a count, we append instead of wiping out the DB
    }),
  });
  if (!res.ok) throw new Error("Failed to seed database");
  return res.json();
}

export async function clearDatabase() {
  const res = await fetch(`${API_URL}/api/clear`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to clear database");
  return res.json();
}

// ---
// Helper: Only for client-side local coordinate ticking to avoid DB spam
let inMemoryShipmentsForTick: Shipment[] = [];
// ---

export async function getShipments(): Promise<Shipment[]> {
  const res = await fetch(`${API_URL}/api/shipments`);
  if (!res.ok) throw new Error("Failed to load shipments");
  const data = await res.json();
  inMemoryShipmentsForTick = data;
  return data;
}

export async function getShipmentById(id: string): Promise<Shipment | undefined> {
  const res = await fetch(`${API_URL}/api/shipments/${id}`);
  if (!res.ok) {
    if (res.status === 404) return undefined;
    throw new Error("Failed to load shipment");
  }
  return res.json();
}

export async function getCarriers(): Promise<Carrier[]> {
  const res = await fetch(`${API_URL}/api/carriers`);
  if (!res.ok) throw new Error("Failed to load carriers");
  return res.json();
}

export async function getGeofences(): Promise<Geofence[]> {
  const res = await fetch(`${API_URL}/api/geofences`);
  if (!res.ok) throw new Error("Failed to load geofences");
  return res.json();
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  actor = "operator@lx",
): Promise<Shipment | undefined> {
  const res = await fetch(`${API_URL}/api/shipments/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, actor }),
  });
  if (!res.ok) {
    if (res.status === 404) return undefined;
    throw new Error("Failed to update status");
  }
  return res.json();
}

export async function addProofOfDelivery(
  id: string,
  pod: ProofOfDelivery,
  actor = "driver@lx",
): Promise<Shipment | undefined> {
  const res = await fetch(`${API_URL}/api/shipments/${id}/pod`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pod, actor }),
  });
  if (!res.ok) {
    if (res.status === 404) return undefined;
    throw new Error("Failed to update proof of delivery");
  }
  return res.json();
}

/** Used by the live simulation tick to bump progress in-transit. */
export function tickPositions(stepKmPerTick = 6): Shipment[] {
  // In a full system, you would push location data to the backend periodically.
  // For the UI simulation, we keep this client-side for smooth 60fps local animation
  inMemoryShipmentsForTick = inMemoryShipmentsForTick.map((s) => {
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
  return inMemoryShipmentsForTick;
}

export async function appendAudit(id: string, entry: Omit<AuditEntry, "id" | "at">) {
  await fetch(`${API_URL}/api/shipments/${id}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry }),
  });
}

export async function getAllAudit(): Promise<(AuditEntry & { trackingId: string })[]> {
  const res = await fetch(`${API_URL}/api/audit`);
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json();
}

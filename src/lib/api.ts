/**
 * API layer — demo mode (browser-only, persisted via localStorage).
 *
 * To wire up the Express+MongoDB backend later, swap these functions with
 * fetch() calls (see MIGRATING_TO_MONGODB.md).
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
import { SHIPMENTS, CARRIERS, GEOFENCES, generateRandomShipments } from "@/data/seed";

const LS_KEY = "logitrace.demo.v1";
const isBrowser = typeof window !== "undefined";

interface Store {
  shipments: Shipment[];
  carriers: Carrier[];
  geofences: Geofence[];
}

function load(): Store {
  if (!isBrowser) return { shipments: [], carriers: CARRIERS, geofences: GEOFENCES };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  // First-run: seed automatically so the dashboard isn't empty.
  const initial: Store = {
    shipments: SHIPMENTS,
    carriers: CARRIERS,
    geofences: GEOFENCES,
  };
  save(initial);
  return initial;
}

function save(s: Store) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

export async function seedDatabase(count?: number) {
  const store = load();
  if (count) {
    store.shipments = [...store.shipments, ...generateRandomShipments(count)];
  } else {
    store.shipments = SHIPMENTS;
    store.carriers = CARRIERS;
    store.geofences = GEOFENCES;
  }
  save(store);
  return { ok: true, count: store.shipments.length };
}

export async function clearDatabase() {
  save({ shipments: [], carriers: CARRIERS, geofences: GEOFENCES });
  return { ok: true };
}

let inMemoryShipmentsForTick: Shipment[] = [];

export async function getShipments(): Promise<Shipment[]> {
  const data = load().shipments;
  inMemoryShipmentsForTick = data;
  return data;
}

export async function getShipmentById(id: string): Promise<Shipment | undefined> {
  return load().shipments.find((s) => s.id === id);
}

export async function getCarriers(): Promise<Carrier[]> {
  return load().carriers;
}

export async function getGeofences(): Promise<Geofence[]> {
  return load().geofences;
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  actor = "operator@lx",
): Promise<Shipment | undefined> {
  const store = load();
  const idx = store.shipments.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  const before = store.shipments[idx].status;
  store.shipments[idx] = {
    ...store.shipments[idx],
    status,
    timeline: [
      ...store.shipments[idx].timeline,
      { status, at: new Date().toISOString() },
    ],
    audit: [
      ...store.shipments[idx].audit,
      {
        id: `a_${Date.now()}`,
        at: new Date().toISOString(),
        actor,
        action: "status_change",
        before,
        after: status,
      },
    ],
  };
  save(store);
  return store.shipments[idx];
}

export async function addProofOfDelivery(
  id: string,
  pod: ProofOfDelivery,
  actor = "driver@lx",
): Promise<Shipment | undefined> {
  const store = load();
  const idx = store.shipments.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  store.shipments[idx] = {
    ...store.shipments[idx],
    pod: { ...pod, at: new Date().toISOString() },
    audit: [
      ...store.shipments[idx].audit,
      {
        id: `a_${Date.now()}`,
        at: new Date().toISOString(),
        actor,
        action: "pod_uploaded",
      },
    ],
  };
  save(store);
  return store.shipments[idx];
}

/** Used by the live simulation tick to bump progress in-transit. */
export function tickPositions(stepKmPerTick = 6): Shipment[] {
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
  const store = load();
  const idx = store.shipments.findIndex((s) => s.id === id);
  if (idx < 0) return;
  store.shipments[idx] = {
    ...store.shipments[idx],
    audit: [
      ...store.shipments[idx].audit,
      { id: `a_${Date.now()}`, at: new Date().toISOString(), ...entry },
    ],
  };
  save(store);
}

export async function getAllAudit(): Promise<(AuditEntry & { trackingId: string })[]> {
  const store = load();
  const all: (AuditEntry & { trackingId: string })[] = [];
  for (const s of store.shipments) {
    for (const a of s.audit) all.push({ ...a, trackingId: s.trackingId });
  }
  return all.sort((a, b) => (a.at < b.at ? 1 : -1));
}

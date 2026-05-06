export type ShipmentStatus =
  | "ordered"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export const STATUS_FLOW: ShipmentStatus[] = [
  "ordered",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SKU {
  id: string;
  name: string;
  qty: number;
  weightKg: number;
  value: number;
}

export interface TimelineEvent {
  status: ShipmentStatus;
  at: string; // ISO
  location?: string;
  note?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  before?: string;
  after?: string;
}

export interface ProofOfDelivery {
  photoDataUrl?: string;
  signatureDataUrl?: string;
  receivedBy?: string;
  at?: string;
}

export interface Geofence {
  id: string;
  name: string;
  center: LatLng;
  radiusKm: number;
}

export interface Shipment {
  id: string;
  trackingId: string;
  carrier: string;
  status: ShipmentStatus;
  origin: { name: string; coords: LatLng };
  destination: { name: string; coords: LatLng };
  current: LatLng;
  routePolyline: LatLng[]; // sampled waypoints from origin -> destination
  progress: number; // 0..1 along polyline
  speedKmh: number;
  perishable: boolean;
  temperatureC?: number;
  tempThresholdC?: number;
  createdAt: string;
  promisedAt: string;
  etaAt: string;
  customer: { name: string; phone: string; email: string };
  skus: SKU[];
  timeline: TimelineEvent[];
  audit: AuditEntry[];
  pod?: ProofOfDelivery;
  costUsd: number;
  distanceKm: number;
}

export interface Carrier {
  id: string;
  name: string;
  onTimePct: number;
  avgDelayHrs: number;
  costPerKm: number;
  totalShipments: number;
}

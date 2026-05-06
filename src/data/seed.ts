import type { Shipment, Carrier, Geofence, LatLng } from "@/types/shipment";
import { buildRoute, totalDistance, pointAtProgress } from "@/lib/geo";

const now = Date.now();
const hours = (h: number) => new Date(now + h * 3600_000).toISOString();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

export const CARRIERS: Carrier[] = [
  { id: "swft", name: "SwiftLine Logistics", onTimePct: 94.2, avgDelayHrs: 0.8, costPerKm: 0.42, totalShipments: 1284 },
  { id: "blz", name: "Blaze Freight Co.", onTimePct: 88.7, avgDelayHrs: 1.6, costPerKm: 0.31, totalShipments: 967 },
  { id: "nrt", name: "NorthStar Cargo", onTimePct: 91.3, avgDelayHrs: 1.1, costPerKm: 0.38, totalShipments: 1532 },
  { id: "atl", name: "Atlas Express", onTimePct: 82.5, avgDelayHrs: 2.4, costPerKm: 0.27, totalShipments: 612 },
];

export const GEOFENCES: Geofence[] = [
  { id: "wh-mum", name: "Mumbai Hub", center: { lat: 19.076, lng: 72.8777 }, radiusKm: 8 },
  { id: "wh-blr", name: "Bengaluru DC", center: { lat: 12.9716, lng: 77.5946 }, radiusKm: 8 },
  { id: "wh-del", name: "Delhi Hub", center: { lat: 28.6139, lng: 77.209 }, radiusKm: 10 },
  { id: "wh-hyd", name: "Hyderabad DC", center: { lat: 17.385, lng: 78.4867 }, radiusKm: 8 },
];

interface SeedRow {
  trackingId: string;
  carrier: string;
  origin: [string, LatLng];
  dest: [string, LatLng];
  status: Shipment["status"];
  progress: number;
  perishable?: boolean;
  speed: number;
  customer: { name: string; phone: string; email: string };
  skus: { name: string; qty: number; weightKg: number; value: number }[];
  promisedInH: number;
  createdAgoH: number;
  costUsd: number;
}

const rows: SeedRow[] = [
  {
    trackingId: "LX-8841-MB-DL",
    carrier: "swft",
    origin: ["Mumbai Hub", { lat: 19.076, lng: 72.8777 }],
    dest: ["Delhi Hub", { lat: 28.6139, lng: 77.209 }],
    status: "in_transit",
    progress: 0.62,
    speed: 78,
    customer: { name: "Aarav Sharma", phone: "+91 98200 11223", email: "aarav@example.com" },
    skus: [
      { name: "Industrial Bearings (Pack/24)", qty: 4, weightKg: 12.4, value: 880 },
      { name: "Precision Calipers", qty: 12, weightKg: 3.2, value: 1440 },
    ],
    promisedInH: 14,
    createdAgoH: 28,
    costUsd: 612,
  },
  {
    trackingId: "LX-8842-BG-HY",
    carrier: "nrt",
    origin: ["Bengaluru DC", { lat: 12.9716, lng: 77.5946 }],
    dest: ["Hyderabad DC", { lat: 17.385, lng: 78.4867 }],
    status: "out_for_delivery",
    progress: 0.94,
    perishable: true,
    speed: 54,
    customer: { name: "Meera Iyer", phone: "+91 98101 33445", email: "meera@example.com" },
    skus: [
      { name: "Cold-chain Vaccines (Vial/100)", qty: 8, weightKg: 6.8, value: 4200 },
    ],
    promisedInH: 2,
    createdAgoH: 18,
    costUsd: 380,
  },
  {
    trackingId: "LX-8843-DL-MB",
    carrier: "blz",
    origin: ["Delhi Hub", { lat: 28.6139, lng: 77.209 }],
    dest: ["Mumbai Hub", { lat: 19.076, lng: 72.8777 }],
    status: "in_transit",
    progress: 0.31,
    speed: 64,
    customer: { name: "Rohit Verma", phone: "+91 99887 77665", email: "rohit@example.com" },
    skus: [
      { name: "Server Racks 42U", qty: 2, weightKg: 88, value: 5600 },
      { name: "Network Switches", qty: 6, weightKg: 14.2, value: 3200 },
    ],
    promisedInH: 22,
    createdAgoH: 12,
    costUsd: 1240,
  },
  {
    trackingId: "LX-8844-HY-BG",
    carrier: "atl",
    origin: ["Hyderabad DC", { lat: 17.385, lng: 78.4867 }],
    dest: ["Bengaluru DC", { lat: 12.9716, lng: 77.5946 }],
    status: "picked_up",
    progress: 0.08,
    speed: 42,
    customer: { name: "Priya Nair", phone: "+91 90011 22334", email: "priya@example.com" },
    skus: [{ name: "Apparel Cartons", qty: 24, weightKg: 96, value: 2100 }],
    promisedInH: 19,
    createdAgoH: 4,
    costUsd: 290,
  },
  {
    trackingId: "LX-8845-MB-BG",
    carrier: "swft",
    origin: ["Mumbai Hub", { lat: 19.076, lng: 72.8777 }],
    dest: ["Bengaluru DC", { lat: 12.9716, lng: 77.5946 }],
    status: "delivered",
    progress: 1,
    speed: 0,
    customer: { name: "Karthik R.", phone: "+91 98765 44332", email: "karthik@example.com" },
    skus: [{ name: "Pharma Reagents", qty: 18, weightKg: 22, value: 7400 }],
    promisedInH: -2,
    createdAgoH: 26,
    costUsd: 540,
  },
  {
    trackingId: "LX-8846-DL-HY",
    carrier: "nrt",
    origin: ["Delhi Hub", { lat: 28.6139, lng: 77.209 }],
    dest: ["Hyderabad DC", { lat: 17.385, lng: 78.4867 }],
    status: "in_transit",
    progress: 0.48,
    perishable: true,
    speed: 71,
    customer: { name: "Anjali Gupta", phone: "+91 91234 55667", email: "anjali@example.com" },
    skus: [{ name: "Frozen Seafood Pack", qty: 30, weightKg: 180, value: 3300 }],
    promisedInH: 11,
    createdAgoH: 15,
    costUsd: 920,
  },
  {
    trackingId: "LX-8847-BG-DL",
    carrier: "blz",
    origin: ["Bengaluru DC", { lat: 12.9716, lng: 77.5946 }],
    dest: ["Delhi Hub", { lat: 28.6139, lng: 77.209 }],
    status: "exception",
    progress: 0.41,
    speed: 0,
    customer: { name: "Vikram Singh", phone: "+91 99001 22335", email: "vikram@example.com" },
    skus: [{ name: "Auto Spare Parts", qty: 12, weightKg: 64, value: 2800 }],
    promisedInH: -3,
    createdAgoH: 30,
    costUsd: 780,
  },
  {
    trackingId: "LX-8848-MB-HY",
    carrier: "swft",
    origin: ["Mumbai Hub", { lat: 19.076, lng: 72.8777 }],
    dest: ["Hyderabad DC", { lat: 17.385, lng: 78.4867 }],
    status: "ordered",
    progress: 0,
    speed: 0,
    customer: { name: "Sana Khan", phone: "+91 98989 77665", email: "sana@example.com" },
    skus: [{ name: "Solar Panels 400W", qty: 10, weightKg: 220, value: 4800 }],
    promisedInH: 36,
    createdAgoH: 1,
    costUsd: 1100,
  },
];

function buildShipment(r: SeedRow, idx: number): Shipment {
  const route = buildRoute(r.origin[1], r.dest[1], 60);
  const dist = totalDistance(route);
  const current = pointAtProgress(route, r.progress);
  const skus = r.skus.map((s, i) => ({ id: `sku-${idx}-${i}`, ...s }));

  const timeline: Shipment["timeline"] = [
    { status: "ordered", at: ago(r.createdAgoH), location: r.origin[0], note: "Order placed" },
  ];
  if (["picked_up", "in_transit", "out_for_delivery", "delivered", "exception"].includes(r.status))
    timeline.push({ status: "picked_up", at: ago(r.createdAgoH - 2), location: r.origin[0] });
  if (["in_transit", "out_for_delivery", "delivered", "exception"].includes(r.status))
    timeline.push({ status: "in_transit", at: ago(r.createdAgoH - 4), location: "On route" });
  if (["out_for_delivery", "delivered"].includes(r.status))
    timeline.push({ status: "out_for_delivery", at: ago(2), location: r.dest[0] });
  if (r.status === "delivered")
    timeline.push({ status: "delivered", at: ago(1), location: r.dest[0] });
  if (r.status === "exception")
    timeline.push({ status: "exception", at: ago(1), location: "On route", note: "Vehicle breakdown reported" });

  const audit: Shipment["audit"] = timeline.map((t, i) => ({
    id: `a-${idx}-${i}`,
    at: t.at,
    actor: i === 0 ? "system" : ["dispatcher@lx", "driver@lx", "ops@lx"][i % 3],
    action: `status → ${t.status}`,
    before: i === 0 ? undefined : timeline[i - 1].status,
    after: t.status,
  }));

  return {
    id: `ship-${idx}`,
    trackingId: r.trackingId,
    carrier: r.carrier,
    status: r.status,
    origin: { name: r.origin[0], coords: r.origin[1] },
    destination: { name: r.dest[0], coords: r.dest[1] },
    current,
    routePolyline: route,
    progress: r.progress,
    speedKmh: r.speed,
    perishable: !!r.perishable,
    temperatureC: r.perishable ? 3.2 : undefined,
    tempThresholdC: r.perishable ? 8 : undefined,
    createdAt: ago(r.createdAgoH),
    promisedAt: hours(r.promisedInH),
    etaAt: hours(r.status === "delivered" ? -1 : r.status === "exception" ? 6 : Math.max(0.5, r.promisedInH - 1)),
    customer: r.customer,
    skus,
    timeline,
    audit,
    pod:
      r.status === "delivered"
        ? { receivedBy: r.customer.name, at: ago(1) }
        : undefined,
    costUsd: r.costUsd,
    distanceKm: dist,
  };
}

export const SHIPMENTS: Shipment[] = rows.map(buildShipment);

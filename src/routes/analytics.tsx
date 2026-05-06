import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCarriers, getShipments } from "@/lib/api";
import type { Carrier, Shipment, LatLng } from "@/types/shipment";
import { ShipmentMap } from "@/components/map/ShipmentMap";
import { optimizeStops, routeDistance } from "@/lib/routing";
import { GEOFENCES } from "@/data/seed";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LogiTrace" }] }),
  component: AnalyticsPage,
});

const STOPS: { name: string; coords: LatLng }[] = [
  { name: "Mumbai Hub", coords: { lat: 19.076, lng: 72.8777 } },
  { name: "Pune", coords: { lat: 18.5204, lng: 73.8567 } },
  { name: "Bengaluru DC", coords: { lat: 12.9716, lng: 77.5946 } },
  { name: "Hyderabad DC", coords: { lat: 17.385, lng: 78.4867 } },
  { name: "Chennai", coords: { lat: 13.0827, lng: 80.2707 } },
  { name: "Delhi Hub", coords: { lat: 28.6139, lng: 77.209 } },
];

function AnalyticsPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [optimized, setOptimized] = useState(false);

  useEffect(() => {
    getCarriers().then(setCarriers);
    getShipments().then(setShipments);
  }, []);

  const original = STOPS.map((_, i) => i);
  const optimal = useMemo(() => optimizeStops(STOPS.map((s) => s.coords)), []);
  const order = optimized ? optimal : original;
  const dist = routeDistance(STOPS.map((s) => s.coords), order);
  const dOriginal = routeDistance(STOPS.map((s) => s.coords), original);
  const savings = ((dOriginal - routeDistance(STOPS.map((s) => s.coords), optimal)) / dOriginal) * 100;

  // Build a fake "shipment" to draw the chosen stop sequence as a route on the map
  const previewShipment: Shipment = {
    id: "preview", trackingId: "ROUTE", carrier: "swft", status: "in_transit",
    origin: { name: STOPS[order[0]].name, coords: STOPS[order[0]].coords },
    destination: { name: STOPS[order[order.length - 1]].name, coords: STOPS[order[order.length - 1]].coords },
    current: STOPS[order[Math.floor(order.length / 2)]].coords,
    routePolyline: order.map((i) => STOPS[i].coords),
    progress: 0.5, speedKmh: 0, perishable: false,
    createdAt: new Date().toISOString(), promisedAt: new Date().toISOString(), etaAt: new Date().toISOString(),
    customer: { name: "", phone: "", email: "" }, skus: [], timeline: [], audit: [],
    costUsd: 0, distanceKm: dist,
  };

  const exceptions = shipments.filter((s) => s.status === "exception" || new Date(s.etaAt).getTime() > new Date(s.promisedAt).getTime());

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Carrier benchmarks, route optimization, and exception reporting.</p>
      </div>

      <Card className="p-4 bg-card/60">
        <h2 className="text-sm font-semibold mb-3">Carrier performance</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground mono">
                <tr>
                  <th className="text-left font-medium pb-2">Carrier</th>
                  <th className="text-right font-medium pb-2">On-time %</th>
                  <th className="text-right font-medium pb-2">Avg delay</th>
                  <th className="text-right font-medium pb-2">$/km</th>
                  <th className="text-right font-medium pb-2">Loads</th>
                </tr>
              </thead>
              <tbody>
                {[...carriers].sort((a, b) => b.onTimePct - a.onTimePct).map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-2.5">{c.name}</td>
                    <td className="py-2.5 text-right mono text-success">{c.onTimePct}%</td>
                    <td className="py-2.5 text-right mono">{c.avgDelayHrs}h</td>
                    <td className="py-2.5 text-right mono">${c.costPerKm}</td>
                    <td className="py-2.5 text-right mono">{c.totalShipments.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carriers.map((c) => ({ name: c.name.split(" ")[0], onTime: c.onTimePct, cost: c.costPerKm * 100 }))}>
                <CartesianGrid stroke="oklch(0.3 0.02 250)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.68 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.018 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.96 0.005 250)" }}
                />
                <Bar dataKey="onTime" fill="oklch(0.78 0.16 195)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/60">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold">Route optimization · {STOPS.length} stops</h2>
            <p className="text-xs text-muted-foreground">Nearest-neighbor heuristic for last-mile sequencing</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs mono">
              {optimized ? "optimized" : "original"}: <b>{dist.toFixed(0)} km</b>
              <span className="text-success ml-2">−{savings.toFixed(1)}% potential</span>
            </span>
            <Button size="sm" variant={optimized ? "default" : "secondary"} onClick={() => setOptimized((v) => !v)}>
              <Sparkles className="size-3.5" /> {optimized ? "Show original" : "Optimize route"}
            </Button>
          </div>
        </div>
        <div className="h-[400px]">
          <ShipmentMap shipments={[previewShipment]} geofences={GEOFENCES} highlightId="preview" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs mono">
          {order.map((i, n) => (
            <span key={n} className="px-2 py-1 rounded border border-border bg-background/40">
              {n + 1}. {STOPS[i].name}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-card/60">
        <h2 className="text-sm font-semibold mb-3">Exception report</h2>
        {exceptions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No exceptions detected.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {exceptions.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-2.5 rounded-md border border-destructive/20 bg-destructive/5">
                <div>
                  <div className="mono text-xs">{s.trackingId}</div>
                  <div className="text-xs text-muted-foreground">{s.origin.name} → {s.destination.name}</div>
                </div>
                <div className="text-xs text-destructive mono">
                  {s.status === "exception" ? "exception reported" : "ETA past promised window"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

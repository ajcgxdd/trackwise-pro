import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShipmentMap } from "@/components/map/ShipmentMap";
import { StatusBadge } from "@/components/shipment/StatusBadge";
import { Card } from "@/components/ui/card";
import { getShipments, getGeofences, tickPositions, seedDatabase, clearDatabase } from "@/lib/api";
import type { Shipment, Geofence } from "@/types/shipment";
import { Link } from "@tanstack/react-router";
import { Package, Truck, AlertTriangle, CheckCircle2, ArrowRight, Database, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LogiTrace" },
      { name: "description", content: "Live operational view of all in-flight shipments." },
    ],
  }),
  component: Dashboard,
});

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="p-4 bg-card/60 border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mono">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold mono">{value}</div>
        </div>
        <div className={`size-9 rounded-md grid place-items-center ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [geos, setGeos] = useState<Geofence[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    getShipments().then(setShipments);
    getGeofences().then(setGeos);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const next = tickPositions(8);
      setShipments([...next]);
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const inTransit = shipments.filter((s) =>
    ["in_transit", "out_for_delivery", "picked_up"].includes(s.status),
  );
  const delivered = shipments.filter((s) => s.status === "delivered");
  const exceptions = shipments.filter((s) => s.status === "exception");
  const recent = [...shipments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time visibility across all active lanes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              await seedDatabase(10); // Generates and appends 10 new shipments
              window.location.reload();
            }}
            className="text-[11px] mono flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded"
          >
            <Database className="size-3" />
            ADD 10 SHIPMENTS
          </button>
          
          {shipments.length > 0 && (
            <button 
              onClick={async () => {
                if (confirm("Are you sure you want to clear all database data?")) {
                  await clearDatabase();
                  window.location.reload();
                }
              }}
              className="text-[11px] mono flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded"
            >
              <Trash2 className="size-3" />
              CLEAR DATA
            </button>
          )}

          {shipments.length === 0 && (
            <button 
              onClick={async () => {
                await seedDatabase();
                window.location.reload();
              }}
              className="text-[11px] mono flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded"
            >
              <Database className="size-3" />
              SEED INITIAL DATABASE
            </button>
          )}
          <div className="text-[11px] mono text-muted-foreground flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> live · refresh 3s
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={Package}
          label="Total shipments"
          value={shipments.length}
          accent="bg-primary/15 text-primary"
        />
        <Kpi
          icon={Truck}
          label="In transit"
          value={inTransit.length}
          accent="bg-info/15 text-info"
        />
        <Kpi
          icon={CheckCircle2}
          label="Delivered"
          value={delivered.length}
          accent="bg-success/15 text-success"
        />
        <Kpi
          icon={AlertTriangle}
          label="Exceptions"
          value={exceptions.length}
          accent="bg-destructive/15 text-destructive"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-card/60">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Live network map</h2>
              <p className="text-xs text-muted-foreground">
                {shipments.length} assets · {geos.length} geofences
              </p>
            </div>
          </div>
          <div className="h-[480px]">
            <ShipmentMap shipments={shipments} geofences={geos} />
          </div>
        </Card>

        <Card className="p-4 bg-card/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link
              to="/shipments"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="space-y-2.5">
            {recent.map((s) => (
              <li key={s.id}>
                <Link
                  to="/shipments/$id"
                  params={{ id: s.id }}
                  className="block p-3 rounded-md border border-border bg-background/40 hover:border-primary/40 hover:bg-background/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs mono font-medium">{s.trackingId}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {s.origin.name} → {s.destination.name}
                  </div>
                  <div className="mt-1 text-[10px] mono text-muted-foreground">
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })} ·{" "}
                    {Math.round(s.progress * 100)}%
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

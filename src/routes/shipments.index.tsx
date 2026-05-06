import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shipment/StatusBadge";
import { getShipments, getCarriers, tickPositions } from "@/lib/api";
import type { Shipment, Carrier, ShipmentStatus } from "@/types/shipment";
import { Search } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/shipments/")({
  head: () => ({ meta: [{ title: "Shipments — LogiTrace" }] }),
  component: ShipmentsPage,
});

const STATUSES: (ShipmentStatus | "all")[] = ["all", "ordered", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception"];

function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "all">("all");

  useEffect(() => {
    getShipments().then(setShipments);
    getCarriers().then(setCarriers);
    const id = setInterval(() => setShipments([...tickPositions(8)]), 3000);
    return () => clearInterval(id);
  }, []);

  const carrierMap = useMemo(() => Object.fromEntries(carriers.map((c) => [c.id, c.name])), [carriers]);
  const filtered = useMemo(
    () =>
      shipments.filter(
        (s) =>
          (status === "all" || s.status === status) &&
          (q === "" ||
            s.trackingId.toLowerCase().includes(q.toLowerCase()) ||
            s.customer.name.toLowerCase().includes(q.toLowerCase()) ||
            s.origin.name.toLowerCase().includes(q.toLowerCase()) ||
            s.destination.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [shipments, status, q]
  );

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} of {shipments.length} active records</p>
      </div>

      <Card className="p-3 bg-card/60 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking ID, customer, lane…" className="pl-8 mono text-sm" />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider mono rounded-md border transition-colors ${
                status === s ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden bg-card/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground mono bg-background/40">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Tracking</th>
                <th className="text-left font-medium px-4 py-2.5">Lane</th>
                <th className="text-left font-medium px-4 py-2.5">Carrier</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-right font-medium px-4 py-2.5">Progress</th>
                <th className="text-right font-medium px-4 py-2.5">ETA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-background/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link to="/shipments/$id" params={{ id: s.id }} className="mono text-primary hover:underline">
                      {s.trackingId}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">{s.customer.name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{s.origin.name}</div>
                    <div className="text-muted-foreground">→ {s.destination.name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{carrierMap[s.carrier] ?? s.carrier}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${s.progress * 100}%` }} />
                      </div>
                      <span className="mono text-xs w-9 text-right">{Math.round(s.progress * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right mono text-xs">{format(new Date(s.etaAt), "MMM d HH:mm")}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No shipments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

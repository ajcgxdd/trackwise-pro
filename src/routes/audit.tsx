import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllAudit, getShipments } from "@/lib/api";
import type { AuditEntry } from "@/types/shipment";
import { format } from "date-fns";
import { Search } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit log — LogiTrace" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [rows, setRows] = useState<(AuditEntry & { trackingId: string })[]>([]);
  const [shipMap, setShipMap] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    getShipments().then((ss) =>
      setShipMap(Object.fromEntries(ss.map((s) => [s.trackingId, s.id]))),
    );
    
    // Initial fetch
    getAllAudit().then(setRows).catch(console.error);
    
    // Auto-refresh
    const t = setInterval(() => {
      getAllAudit().then(setRows).catch(console.error);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = rows.filter(
    (r) =>
      q === "" ||
      r.trackingId.toLowerCase().includes(q.toLowerCase()) ||
      r.actor.toLowerCase().includes(q.toLowerCase()) ||
      r.action.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every modification across all shipments — accountability trail.
        </p>
      </div>
      <Card className="p-3 bg-card/60">
        <div className="relative">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by tracking, actor, or action…"
            className="pl-8 mono text-sm"
          />
        </div>
      </Card>
      <Card className="overflow-hidden bg-card/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground mono bg-background/40">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Time</th>
                <th className="text-left font-medium px-4 py-2.5">Tracking</th>
                <th className="text-left font-medium px-4 py-2.5">Actor</th>
                <th className="text-left font-medium px-4 py-2.5">Action</th>
                <th className="text-left font-medium px-4 py-2.5">Change</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-background/40">
                  <td className="px-4 py-2.5 mono text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(r.at), "MMM d HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2.5">
                    {shipMap[r.trackingId] ? (
                      <Link
                        to="/shipments/$id"
                        params={{ id: shipMap[r.trackingId] }}
                        className="mono text-primary text-xs hover:underline"
                      >
                        {r.trackingId}
                      </Link>
                    ) : (
                      <span className="mono text-xs">{r.trackingId}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 mono text-xs">{r.actor}</td>
                  <td className="px-4 py-2.5 text-xs">{r.action}</td>
                  <td className="px-4 py-2.5 mono text-[11px] text-muted-foreground">
                    {r.before ? `${r.before} → ${r.after}` : (r.after ?? "—")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    No audit entries match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

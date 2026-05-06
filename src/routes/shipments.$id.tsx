import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShipmentMap } from "@/components/map/ShipmentMap";
import { StatusBadge } from "@/components/shipment/StatusBadge";
import { Timeline } from "@/components/shipment/Timeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getShipmentById, getGeofences, getCarriers, addProofOfDelivery, updateShipmentStatus, tickPositions } from "@/lib/api";
import type { Shipment, Geofence, Carrier } from "@/types/shipment";
import { remainingDistance } from "@/lib/geo";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, MapPin, Thermometer, Gauge, Clock, DollarSign, Camera, PenLine, Send } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";

export const Route = createFileRoute("/shipments/$id")({
  head: ({ params }) => ({ meta: [{ title: `Shipment ${params.id} — LogiTrace` }] }),
  component: ShipmentDetail,
});

function ShipmentDetail() {
  const { id } = Route.useParams();
  const [shipment, setShipment] = useState<Shipment | null | undefined>(undefined);
  const [geos, setGeos] = useState<Geofence[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [receivedBy, setReceivedBy] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const sigRef = useState<SignatureCanvas | null>(null);

  useEffect(() => {
    getShipmentById(id).then((s) => setShipment(s ?? null));
    getGeofences().then(setGeos);
    getCarriers().then(setCarriers);
    const t = setInterval(() => {
      tickPositions(8);
      getShipmentById(id).then((s) => setShipment(s ?? null));
    }, 3000);
    return () => clearInterval(t);
  }, [id]);

  if (shipment === undefined) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  if (shipment === null) return <div className="p-8 text-muted-foreground text-sm">Shipment not found. <Link to="/shipments" className="text-primary">Back</Link></div>;

  const carrier = carriers.find((c) => c.id === shipment.carrier);
  const remaining = remainingDistance(shipment.routePolyline, shipment.progress);
  const etaHours = shipment.speedKmh > 0 ? remaining / shipment.speedKmh : null;
  const etaDate = etaHours !== null ? new Date(Date.now() + etaHours * 3600_000) : new Date(shipment.etaAt);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitPod = async () => {
    if (!receivedBy.trim()) {
      toast.error("Receiver name required");
      return;
    }
    const sig = sigRef[0]?.isEmpty?.() ? undefined : sigRef[0]?.toDataURL();
    await addProofOfDelivery(shipment.id, { receivedBy, photoDataUrl: photo, signatureDataUrl: sig });
    toast.success("Proof of delivery recorded");
    getShipmentById(id).then((s) => setShipment(s ?? null));
  };

  const advance = async (status: any) => {
    await updateShipmentStatus(shipment.id, status);
    toast.success(`Status advanced to ${status.replace(/_/g, " ")}`);
    getShipmentById(id).then((s) => setShipment(s ?? null));
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/shipments" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold mono">{shipment.trackingId}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="text-sm text-muted-foreground">{shipment.origin.name} → {shipment.destination.name} · {carrier?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Gauge} label="Speed" value={`${shipment.speedKmh.toFixed(0)} km/h`} />
        <Stat icon={MapPin} label="Remaining" value={`${remaining.toFixed(0)} km`} />
        <Stat icon={Clock} label="Dynamic ETA" value={format(etaDate, "MMM d · HH:mm")} sub={formatDistanceToNow(etaDate, { addSuffix: true })} />
        <Stat icon={DollarSign} label="Cost" value={`$${shipment.costUsd.toFixed(0)}`} sub={`${shipment.distanceKm.toFixed(0)} km`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-card/60">
          <div className="h-[420px]">
            <ShipmentMap shipments={[shipment]} geofences={geos} highlightId={shipment.id} />
          </div>
        </Card>

        <Card className="p-4 bg-card/60">
          <h2 className="text-sm font-semibold mb-4">Status timeline</h2>
          <Timeline shipment={shipment} />
          {shipment.status !== "delivered" && shipment.status !== "exception" && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mono mb-2">Quick actions</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => advance("in_transit")}>Mark in transit</Button>
                <Button size="sm" variant="secondary" onClick={() => advance("out_for_delivery")}>Out for delivery</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 bg-card/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">SKUs ({shipment.skus.length})</h2>
            <span className="text-[11px] mono text-muted-foreground">
              total: {shipment.skus.reduce((a, s) => a + s.weightKg, 0).toFixed(1)} kg · ${shipment.skus.reduce((a, s) => a + s.value, 0).toLocaleString()}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground mono">
              <tr><th className="text-left font-medium pb-2">Item</th><th className="text-right font-medium pb-2">Qty</th><th className="text-right font-medium pb-2">Weight</th><th className="text-right font-medium pb-2">Value</th></tr>
            </thead>
            <tbody>
              {shipment.skus.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2.5">{s.name}<div className="text-[11px] text-muted-foreground mono">{s.id}</div></td>
                  <td className="py-2.5 text-right mono">{s.qty}</td>
                  <td className="py-2.5 text-right mono">{s.weightKg.toFixed(1)} kg</td>
                  <td className="py-2.5 text-right mono">${s.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shipment.perishable && (
            <div className="mt-4 p-3 rounded-md border border-info/30 bg-info/5 flex items-center gap-3 text-sm">
              <Thermometer className="size-4 text-info" />
              <div>
                <div className="font-medium">Cold-chain · current {shipment.temperatureC}°C</div>
                <div className="text-xs text-muted-foreground">Threshold {shipment.tempThresholdC}°C — within tolerance</div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60">
          <h2 className="text-sm font-semibold mb-3">Customer</h2>
          <div className="space-y-1.5 text-sm">
            <div>{shipment.customer.name}</div>
            <div className="text-xs text-muted-foreground mono">{shipment.customer.email}</div>
            <div className="text-xs text-muted-foreground mono">{shipment.customer.phone}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => toast.success(`Notification queued to ${shipment.customer.email}`, { description: "Twilio/Resend webhook stub" })}
          >
            <Send className="size-3.5" /> Notify customer
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-card/60">
          <h2 className="text-sm font-semibold mb-3">Proof of delivery</h2>
          {shipment.pod?.at ? (
            <div className="space-y-2 text-sm">
              <div>Received by <b>{shipment.pod.receivedBy}</b></div>
              <div className="text-xs text-muted-foreground mono">{format(new Date(shipment.pod.at), "PPpp")}</div>
              {shipment.pod.photoDataUrl && <img src={shipment.pod.photoDataUrl} alt="pod" className="rounded-md border border-border max-h-48" />}
              {shipment.pod.signatureDataUrl && (
                <div>
                  <div className="text-[11px] uppercase mono text-muted-foreground mb-1">Signature</div>
                  <img src={shipment.pod.signatureDataUrl} alt="sig" className="rounded-md border border-border bg-white max-h-32" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Received by (full name)" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
              <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/40 text-sm">
                <Camera className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">{photo ? "Photo attached" : "Attach delivery photo"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
              </label>
              {photo && <img src={photo} alt="preview" className="rounded-md border border-border max-h-32" />}
              <div>
                <div className="text-[11px] uppercase mono text-muted-foreground mb-1 flex items-center gap-1"><PenLine className="size-3" /> Signature</div>
                <div className="rounded-md border border-border bg-white">
                  <SignatureCanvas
                    ref={(r) => { sigRef[1](r); }}
                    canvasProps={{ className: "w-full h-28 rounded-md" }}
                    penColor="#0f172a"
                  />
                </div>
                <button onClick={() => sigRef[0]?.clear()} className="text-[11px] mono text-muted-foreground hover:text-foreground mt-1">clear</button>
              </div>
              <Button onClick={submitPod} className="w-full">Confirm delivery</Button>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card/60">
          <h2 className="text-sm font-semibold mb-3">Audit log</h2>
          <ul className="space-y-2 max-h-72 overflow-auto pr-2">
            {[...shipment.audit].reverse().map((a) => (
              <li key={a.id} className="text-xs border-l-2 border-border pl-3 py-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-muted-foreground">{a.actor}</span>
                  <span className="mono text-muted-foreground">{format(new Date(a.at), "MMM d HH:mm:ss")}</span>
                </div>
                <div className="text-foreground">{a.action}</div>
                {a.before && <div className="text-[10px] text-muted-foreground mono">{a.before} → {a.after}</div>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3 bg-card/60">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mono">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold mono">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mono">{sub}</div>}
    </Card>
  );
}

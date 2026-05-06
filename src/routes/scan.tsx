import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getShipments, appendAudit } from "@/lib/api";
import type { Shipment } from "@/types/shipment";
import { ScanLine, Camera, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan — LogiTrace" }] }),
  component: ScanPage,
});

function ScanPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [history, setHistory] = useState<{ id: string; ok: boolean; trackingId: string; ts: number }[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getShipments().then(setShipments);
  }, []);

  const findShipment = (code: string) =>
    shipments.find((s) => s.trackingId === code.trim() || s.id === code.trim());

  const handleCode = (code: string) => {
    const s = findShipment(code);
    if (s) {
      appendAudit(s.id, { actor: "scanner@lx", action: `Scanned at ${new Date().toLocaleTimeString()}` });
      toast.success(`Scanned ${s.trackingId}`);
      setHistory((h) => [{ id: s.id, ok: true, trackingId: s.trackingId, ts: Date.now() }, ...h].slice(0, 8));
      stopScan();
      navigate({ to: "/shipments/$id", params: { id: s.id } });
    } else {
      toast.error(`Unknown code: ${code}`);
      setHistory((h) => [{ id: "?", ok: false, trackingId: code, ts: Date.now() }, ...h].slice(0, 8));
    }
  };

  const startScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const el = document.getElementById("qr-reader");
        if (!el) return;
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handleCode(decoded),
          () => {}
        );
      } catch (e: any) {
        toast.error("Camera unavailable", { description: e?.message });
        setScanning(false);
      }
    }, 50);
  };

  const stopScan = async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => { stopScan(); }, []);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scan & check-in</h1>
        <p className="text-sm text-muted-foreground">Scan a QR or barcode label, or enter a tracking ID.</p>
      </div>

      <Card className="p-4 bg-card/60 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="LX-####-XX-XX"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="mono"
            onKeyDown={(e) => e.key === "Enter" && manual && (handleCode(manual), setManual(""))}
          />
          <Button onClick={() => { handleCode(manual); setManual(""); }} disabled={!manual}>Look up</Button>
        </div>

        {!scanning ? (
          <Button onClick={startScan} variant="secondary" className="w-full">
            <Camera className="size-4" /> Start camera scan
          </Button>
        ) : (
          <div className="space-y-2">
            <div id="qr-reader" className="rounded-md overflow-hidden border border-border bg-black [&_video]:w-full" />
            <Button onClick={stopScan} variant="outline" className="w-full">
              <X className="size-4" /> Stop
            </Button>
          </div>
        )}

        <div className="text-[11px] mono text-muted-foreground border-t border-border pt-3">
          tip: try one of these tracking IDs · {shipments.slice(0, 3).map((s) => s.trackingId).join(" · ")}
        </div>
      </Card>

      {history.length > 0 && (
        <Card className="p-4 bg-card/60">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mono mb-2 flex items-center gap-2">
            <ScanLine className="size-3" /> Recent scans
          </div>
          <ul className="space-y-1.5 text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between mono text-xs">
                <span className={h.ok ? "text-success" : "text-destructive"}>{h.ok ? "✓" : "✕"} {h.trackingId}</span>
                <span className="text-muted-foreground">{new Date(h.ts).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

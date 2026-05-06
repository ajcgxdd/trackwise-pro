import { cn } from "@/lib/utils";
import type { ShipmentStatus } from "@/types/shipment";

const LABELS: Record<ShipmentStatus, string> = {
  ordered: "Ordered",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
};

const STYLES: Record<ShipmentStatus, string> = {
  ordered: "bg-muted text-muted-foreground border-border",
  picked_up: "bg-info/15 text-info border-info/30",
  in_transit: "bg-primary/15 text-primary border-primary/30",
  out_for_delivery: "bg-accent/15 text-accent border-accent/30",
  delivered: "bg-success/15 text-success border-success/30",
  exception: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium uppercase tracking-wider mono",
        STYLES[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}

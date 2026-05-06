import { STATUS_FLOW, type Shipment, type ShipmentStatus } from "@/types/shipment";
import { format } from "date-fns";
import { Check, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Timeline({ shipment }: { shipment: Shipment }) {
  const isException = shipment.status === "exception";
  const lastNonException = [...shipment.timeline].reverse().find((t) => t.status !== "exception");
  const reachedIdx = isException
    ? STATUS_FLOW.indexOf((lastNonException?.status ?? "in_transit") as ShipmentStatus)
    : STATUS_FLOW.indexOf(shipment.status);

  return (
    <ol className="relative space-y-5 pl-7">
      {STATUS_FLOW.map((step, i) => {
        const event = shipment.timeline.find((t) => t.status === step);
        const reached = i <= reachedIdx;
        const current = i === reachedIdx && !isException;
        return (
          <li key={step} className="relative">
            <span
              className={cn(
                "absolute -left-7 top-0.5 size-5 rounded-full border-2 grid place-items-center bg-card",
                reached ? "border-primary text-primary" : "border-border text-muted-foreground",
                current && "ring-4 ring-primary/20",
              )}
            >
              {reached ? <Check className="size-3" /> : <Circle className="size-2 fill-current" />}
            </span>
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={cn(
                  "absolute -left-[18px] top-5 w-px h-9",
                  i < reachedIdx ? "bg-primary/60" : "bg-border",
                )}
              />
            )}
            <div className="flex items-baseline justify-between gap-2">
              <div
                className={cn("font-medium", reached ? "text-foreground" : "text-muted-foreground")}
              >
                {step.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              {event && (
                <span className="text-[11px] mono text-muted-foreground">
                  {format(new Date(event.at), "MMM d · HH:mm")}
                </span>
              )}
            </div>
            {event?.location && (
              <div className="text-xs text-muted-foreground">{event.location}</div>
            )}
          </li>
        );
      })}
      {isException && (
        <li className="relative">
          <span className="absolute -left-7 top-0.5 size-5 rounded-full border-2 border-destructive text-destructive grid place-items-center bg-card">
            <AlertTriangle className="size-3" />
          </span>
          <div className="font-medium text-destructive">Exception</div>
          <div className="text-xs text-muted-foreground">
            {shipment.timeline.find((t) => t.status === "exception")?.note ?? "Issue reported"}
          </div>
        </li>
      )}
    </ol>
  );
}

import { useEffect, useRef, useState } from "react";
import { tickPositions } from "@/lib/api";
import type { Shipment } from "@/types/shipment";

/** Drives the live simulation. Returns shipments and forces re-renders. */
export function useLiveShipments(initial: Shipment[], intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  const ref = useRef(initial);
  ref.current = initial;
  useEffect(() => {
    const id = setInterval(() => {
      tickPositions(8);
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return { shipments: ref.current, tick };
}

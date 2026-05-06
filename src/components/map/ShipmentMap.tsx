import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Shipment, Geofence } from "@/types/shipment";

interface Props {
  shipments: Shipment[];
  geofences?: Geofence[];
  highlightId?: string;
  showRoutes?: boolean;
  height?: string;
  onSelect?: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  ordered: "#9aa4b2",
  picked_up: "#6dd0ff",
  in_transit: "#22d3ee",
  out_for_delivery: "#f59e0b",
  delivered: "#34d399",
  exception: "#f87171",
};

export function ShipmentMap({
  shipments,
  geofences = [],
  highlightId,
  showRoutes = true,
  height = "100%",
  onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView(
      [20.5, 78.9],
      5,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    geofences.forEach((g) => {
      L.circle([g.center.lat, g.center.lng], {
        radius: g.radiusKm * 1000,
        color: "#22d3ee",
        weight: 1,
        fillColor: "#22d3ee",
        fillOpacity: 0.06,
      })
        .bindTooltip(`<b>${g.name}</b><br/>geofence ${g.radiusKm}km`, { className: "lx-tip" })
        .addTo(layer);
    });

    const bounds: L.LatLngExpression[] = [];

    shipments.forEach((s) => {
      const color = STATUS_COLOR[s.status] ?? "#22d3ee";
      const isHi = highlightId && s.id === highlightId;

      if (showRoutes) {
        L.polyline(
          s.routePolyline.map((p) => [p.lat, p.lng] as [number, number]),
          {
            color,
            weight: isHi ? 3 : 1.5,
            opacity: isHi ? 0.9 : 0.45,
            dashArray: "6 6",
          },
        ).addTo(layer);
      }

      L.circleMarker([s.origin.coords.lat, s.origin.coords.lng], {
        radius: 4,
        color: "#94a3b8",
        fillColor: "#1f2937",
        fillOpacity: 1,
        weight: 1.5,
      })
        .bindTooltip(`Origin · ${s.origin.name}`)
        .addTo(layer);
      L.circleMarker([s.destination.coords.lat, s.destination.coords.lng], {
        radius: 4,
        color: color,
        fillColor: color,
        fillOpacity: 1,
        weight: 1.5,
      })
        .bindTooltip(`Destination · ${s.destination.name}`)
        .addTo(layer);

      const icon = L.divIcon({
        className: "",
        iconSize: [22, 22],
        html: `<div style="position:relative;width:22px;height:22px;">
          <div style="position:absolute;inset:0;border-radius:9999px;background:${color}33;"></div>
          <div style="position:absolute;inset:4px;border-radius:9999px;background:${color};box-shadow:0 0 0 2px #0f1419, 0 0 12px ${color}aa;"></div>
        </div>`,
      });
      const m = L.marker([s.current.lat, s.current.lng], { icon }).addTo(layer);
      m.bindTooltip(
        `<div style="font-family:JetBrains Mono,monospace;font-size:11px;line-height:1.5;">
          <b style="font-size:12px;">${s.trackingId}</b><br/>
          ${s.origin.name} → ${s.destination.name}<br/>
          <span style="color:${color};">● ${s.status.replace(/_/g, " ")}</span> · ${Math.round(s.progress * 100)}%
        </div>`,
        { className: "lx-tip" },
      );
      if (onSelect) m.on("click", () => onSelect(s.id));
      bounds.push([s.current.lat, s.current.lng]);
      bounds.push([s.origin.coords.lat, s.origin.coords.lng]);
      bounds.push([s.destination.coords.lat, s.destination.coords.lng]);
    });

    if (bounds.length && !highlightId) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 7 });
    } else if (highlightId) {
      const s = shipments.find((x) => x.id === highlightId);
      if (s)
        map.fitBounds(
          [
            [s.origin.coords.lat, s.origin.coords.lng],
            [s.destination.coords.lat, s.destination.coords.lng],
          ],
          { padding: [60, 60] },
        );
    }
  }, [shipments, geofences, highlightId, showRoutes, onSelect]);

  return (
    <div
      ref={ref}
      style={{ height, width: "100%" }}
      className="rounded-lg overflow-hidden border border-border"
    />
  );
}

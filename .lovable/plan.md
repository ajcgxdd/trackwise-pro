## Logistics Tracker — MVP Plan

A polished, demo-ready logistics dashboard. Since this is a college project requiring **MongoDB**, and Lovable's frontend can't talk to MongoDB directly without a backend host, we'll structure the app so it works as a complete demo *now* (with seeded data) and is wired to plug into your MongoDB backend later.

### Architecture

- **Frontend (this project):** TanStack Start + React + Tailwind + shadcn/ui
- **Data layer:** A single `src/lib/api.ts` module with typed functions (`getShipments`, `getShipmentById`, `updateStatus`, `addPod`, etc.). For the demo it returns seeded JSON from `src/data/seed.ts`. For your final submission, swap the bodies to `fetch('/api/...')` calls against your Express+MongoDB backend — UI stays unchanged.
- **State:** TanStack Query for caching + optimistic updates (already in stack).
- **No auth** for the demo, as requested.

### Pages & routes

```
/                    Dashboard — KPIs, live map of all shipments, recent activity
/shipments           List + filters (status, carrier, search by tracking ID)
/shipments/$id       Detail: map, timeline stepper, SKUs, PoD, audit log, ETA
/scan                QR/Barcode scanner (camera) → check-in/check-out
/analytics           Carrier performance, route optimization, exception report
/admin/audit         Global audit log table
```

### Feature breakdown

**Core tracking & visibility**
- Leaflet + OpenStreetMap. Custom truck/package markers, route polyline (origin → current → destination), animated current-location pulse.
- Vertical status stepper: Ordered → Picked Up → In Transit → Out for Delivery → Delivered (with timestamps + actor).
- Dynamic ETA: `remainingDistance / avgSpeed` recomputed from live position; haversine util in `src/lib/geo.ts`.
- Live simulation: a small interval ticks shipment positions along their route so the demo feels real-time.

**Orders & inventory**
- SKU table inside shipment detail (item, qty, weight, value).
- QR/Barcode scanner using `html5-qrcode` (camera). Scanning a tracking ID jumps to that shipment and logs a check-in/out event.
- Proof of Delivery: photo upload (stored as base64/object URL in demo; swap to S3/GridFS later) + signature pad (`react-signature-canvas`).

**Alerts & notifications**
- Geofence definitions per warehouse (lat/lng + radius). Client-side check on each tick → toast + alert row when entering/leaving.
- Exception detection: delays vs ETA, route deviation (distance from planned polyline), temperature breaches for perishable shipments.
- "Notify customer" button — stub that records a notification event (real Twilio/Resend wiring documented but out of MVP scope per your selection).

**Analytics & admin**
- Carrier performance table: on-time %, avg delay, cost/km, total shipments. Sortable.
- Route optimization: nearest-neighbor TSP heuristic in `src/lib/routing.ts` for a list of stops; visualize optimized vs original on map.
- Audit log: every status change, edit, scan, PoD upload recorded with `{actor, action, before, after, timestamp}`.

### Design direction

Technical, efficient, reliability-focused. Dark-first dashboard aesthetic:
- Deep slate/near-black background, single confident accent (electric cyan/amber for "in transit"), semantic status colors (success/warn/danger).
- Mono-style numerics for IDs, ETAs, coords. Inter for UI, JetBrains Mono for data.
- Dense but breathable: card grid, subtle dividers, micro-animations on status changes (framer-motion).
- Tokens defined in `src/styles.css` (oklch); all components use semantic tokens.

### Seed data

10–15 shipments across statuses, 4 carriers, 3 warehouses (with geofences), realistic India/US routes, mixed perishable/standard, sample SKUs and audit history.

### Technical details

- Packages to add: `leaflet`, `react-leaflet`, `@types/leaflet`, `html5-qrcode`, `react-signature-canvas`, `framer-motion`, `date-fns`, `recharts`.
- New folders: `src/components/map/`, `src/components/shipment/`, `src/lib/{api,geo,routing,simulation}.ts`, `src/data/seed.ts`, `src/types/shipment.ts`.
- Routes added under `src/routes/` following TanStack file-based conventions.
- A `MIGRATING_TO_MONGODB.md` doc explaining how to point `src/lib/api.ts` at your Express/Mongo backend (endpoints, schemas matching the TS types).

### Out of scope for this MVP (can add later)
- Real auth & roles
- Live Twilio/Resend sending (UI stub only)
- Real backend MongoDB server (you'll host that separately for submission)

### Build order
1. Types, seed data, API stub, design tokens
2. Leaflet map component + dashboard page
3. Shipment list + detail (timeline, SKUs, ETA, audit)
4. Live simulation + geofence/exception alerts
5. QR scanner + PoD (photo + signature)
6. Analytics page (carrier perf, route optimization)
7. Polish, empty states, responsive pass
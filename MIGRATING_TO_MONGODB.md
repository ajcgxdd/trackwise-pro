# Migrating from seed data to your MongoDB backend

The frontend reads/writes through `src/lib/api.ts`. Swap the function bodies
to `fetch()` calls against your Express + MongoDB backend. The UI does not
need any changes.

## Suggested REST endpoints

| Function                   | Method | Path                                  |
| -------------------------- | ------ | ------------------------------------- |
| `getShipments`             | GET    | `/api/shipments`                      |
| `getShipmentById`          | GET    | `/api/shipments/:id`                  |
| `updateShipmentStatus`     | PATCH  | `/api/shipments/:id/status`           |
| `addProofOfDelivery`       | POST   | `/api/shipments/:id/pod`              |
| `getCarriers`              | GET    | `/api/carriers`                       |
| `getGeofences`             | GET    | `/api/geofences`                      |
| `getAllAudit`              | GET    | `/api/audit`                          |

## MongoDB collections

- `shipments` — one document per shipment matching `Shipment` in `src/types/shipment.ts`
- `carriers` — `Carrier`
- `geofences` — `Geofence`
- `audit` (optional) — embedded inside shipments OR its own collection

Keep field names identical to the TypeScript types so JSON parses 1:1.

## Example swap

```ts
// Before
export async function getShipments() {
  return SHIPMENTS;
}

// After
export async function getShipments() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shipments`);
  if (!res.ok) throw new Error("Failed to load shipments");
  return res.json();
}
```

Set `VITE_API_URL` to the URL of your Express server.

const mongoose = require("mongoose");

const latLngSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const skuSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    qty: Number,
    weightKg: Number,
    value: Number,
  },
  { _id: false },
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: String,
    at: String,
    location: String,
    note: String,
  },
  { _id: false },
);

const auditEntrySchema = new mongoose.Schema(
  {
    id: String,
    at: String,
    actor: String,
    action: String,
    before: String,
    after: String,
  },
  { _id: false },
);

const proofOfDeliverySchema = new mongoose.Schema(
  {
    photoDataUrl: String,
    signatureDataUrl: String,
    receivedBy: String,
    at: String,
  },
  { _id: false },
);

const shipmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  trackingId: { type: String, required: true },
  carrier: String,
  status: String,
  origin: { name: String, coords: latLngSchema },
  destination: { name: String, coords: latLngSchema },
  current: latLngSchema,
  routePolyline: [latLngSchema],
  progress: Number,
  speedKmh: Number,
  perishable: Boolean,
  temperatureC: Number,
  tempThresholdC: Number,
  createdAt: String,
  promisedAt: String,
  etaAt: String,
  customer: { name: String, phone: String, email: String },
  skus: [skuSchema],
  timeline: [timelineEventSchema],
  audit: [auditEntrySchema],
  pod: proofOfDeliverySchema,
  costUsd: Number,
  distanceKm: Number,
});

module.exports = mongoose.model("Shipment", shipmentSchema);

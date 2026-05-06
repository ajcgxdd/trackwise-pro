const mongoose = require("mongoose");

const carrierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  onTimePct: Number,
  avgDelayHrs: Number,
  costPerKm: Number,
  totalShipments: Number,
});

module.exports = mongoose.model("Carrier", carrierSchema);

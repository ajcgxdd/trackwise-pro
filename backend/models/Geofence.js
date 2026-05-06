const mongoose = require("mongoose");

const geofenceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  center: {
    lat: Number,
    lng: Number,
  },
  radiusKm: Number,
});

module.exports = mongoose.model("Geofence", geofenceSchema);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Shipment = require("./models/Shipment");
const Carrier = require("./models/Carrier");
const Geofence = require("./models/Geofence");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // for image payloads

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Root route so the url doesn't show "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Trackwise Backend API is running! Access the frontend at http://localhost:5173");
});

// Routes
// ----------------------------------------------------

app.get("/api/shipments", async (req, res) => {
  try {
    const shipments = await Shipment.find({});
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/shipments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ $or: [{ id }, { trackingId: id }] });
    if (!shipment) return res.status(404).json({ error: "Not found" });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/shipments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actor = "operator@lx" } = req.body;

    const shipment = await Shipment.findOne({ id });
    if (!shipment) return res.status(404).json({ error: "Not found" });

    const before = shipment.status;
    shipment.status = status;
    shipment.timeline.push({ status, at: new Date().toISOString() });
    shipment.audit.push({
      id: `a-${Date.now()}`,
      at: new Date().toISOString(),
      actor,
      action: `status → ${status}`,
      before,
      after: status,
    });

    await shipment.save();
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/shipments/:id/pod", async (req, res) => {
  try {
    const { id } = req.params;
    const { pod, actor = "driver@lx" } = req.body;

    const shipment = await Shipment.findOne({ id });
    if (!shipment) return res.status(404).json({ error: "Not found" });

    shipment.pod = { ...pod, at: new Date().toISOString() };
    shipment.status = "delivered";
    shipment.progress = 1;
    shipment.timeline.push({
      status: "delivered",
      at: new Date().toISOString(),
      location: shipment.destination.name,
    });

    shipment.audit.push({
      id: `a-${Date.now()}`,
      at: new Date().toISOString(),
      actor,
      action: "Proof of delivery uploaded",
      after: "delivered",
    });

    await shipment.save();
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/shipments/:id/audit", async (req, res) => {
  try {
    const { id } = req.params;
    const { entry } = req.body;

    const shipment = await Shipment.findOne({ id });
    if (!shipment) return res.status(404).json({ error: "Not found" });

    shipment.audit.push({
      id: `a-${Date.now()}`,
      at: new Date().toISOString(),
      ...entry,
    });

    await shipment.save();
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/carriers", async (req, res) => {
  try {
    const carriers = await Carrier.find({});
    res.json(carriers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/geofences", async (req, res) => {
  try {
    const geofences = await Geofence.find({});
    res.json(geofences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/audit", async (req, res) => {
  try {
    // Collect all audit entries from all shipments
    const shipments = await Shipment.find({}, { audit: 1, trackingId: 1 }).lean();
    const allAudit = shipments
      .flatMap((s) => (s.audit || []).map((a) => ({ ...a, trackingId: s.trackingId })))
      .sort((a, b) => (a.at < b.at ? 1 : -1));

    res.json(allAudit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Used by simulate tick (for dev/simulation)
app.post("/api/tick", async (req, res) => {
  try {
    res.json({ message: "Tick" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Used to reset and seed the database initially from the frontend mock data
app.post("/api/seed", async (req, res) => {
  try {
    const { shipments, carriers, geofences } = req.body;
    
    if (shipments && shipments.length > 0) {
      await Shipment.deleteMany({});
      await Shipment.insertMany(shipments);
    }
    if (carriers && carriers.length > 0) {
      await Carrier.deleteMany({});
      await Carrier.insertMany(carriers);
    }
    if (geofences && geofences.length > 0) {
      await Geofence.deleteMany({});
      await Geofence.insertMany(geofences);
    }

    res.json({ message: "Database successfully seeded!" });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));

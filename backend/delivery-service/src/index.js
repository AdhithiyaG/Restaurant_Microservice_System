const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory deliveries with lightweight simulation.
const deliveries = new Map();
const listeners = new Map();
const STATES = ["ASSIGNED", "PICKED", "EN_ROUTE", "DELIVERED"];

const generateId = () => crypto.randomUUID();

const broadcast = (deliveryId, payload) => {
  const set = listeners.get(deliveryId);
  if (!set) return;
  set.forEach((res) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });
};

const simulateProgress = (delivery) => {
  let idx = STATES.indexOf(delivery.status);
  const interval = setInterval(() => {
    idx += 1;
    if (idx >= STATES.length) {
      clearInterval(interval);
      return;
    }
    const nextStatus = STATES[idx];
    const updated = {
      ...delivery,
      status: nextStatus,
      lastUpdate: new Date().toISOString(),
    };
    deliveries.set(updated.id, updated);
    broadcast(updated.id, updated);
    delivery = updated;
    if (nextStatus === "DELIVERED") clearInterval(interval);
  }, 3000);
};

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "delivery" });
});

app.post("/deliveries/assign", (req, res) => {
  const { orderId, partnerId = "mock-partner", address = {} } = req.body || {};
  if (!orderId) return res.status(400).json({ message: "orderId is required" });
  const id = generateId();
  const now = new Date().toISOString();
  const delivery = {
    id,
    orderId,
    partnerId,
    address,
    status: "ASSIGNED",
    lastUpdate: now,
  };
  deliveries.set(id, delivery);
  simulateProgress(delivery);
  res.status(201).json(delivery);
});

app.get("/deliveries/:id", (req, res) => {
  const delivery = deliveries.get(req.params.id);
  if (!delivery) return res.status(404).json({ message: "not found" });
  res.json(delivery);
});

app.get("/deliveries/:id/stream", (req, res) => {
  const deliveryId = req.params.id;
  const delivery = deliveries.get(deliveryId);
  if (!delivery) return res.status(404).json({ message: "not found" });

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const current = JSON.stringify(delivery);
  res.write(`data: ${current}\n\n`);

  const set = listeners.get(deliveryId) || new Set();
  set.add(res);
  listeners.set(deliveryId, set);

  req.on("close", () => {
    set.delete(res);
  });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`delivery service listening on ${port}`);
});

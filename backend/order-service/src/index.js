const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory stores for demo purposes.
const orders = new Map();
const idempotencyKeys = new Map();
const STATES = [
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const generateId = () => crypto.randomUUID();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order" });
});

app.post("/orders", (req, res) => {
  const idemKey = req.headers["idempotency-key"];
  if (idemKey && idempotencyKeys.has(idemKey)) {
    const existingId = idempotencyKeys.get(idemKey);
    return res.status(200).json(orders.get(existingId));
  }

  const {
    restaurantId,
    items = [],
    customer = {},
    deliveryAddress = {},
  } = req.body || {};
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "restaurantId and at least one item are required" });
  }

  const now = new Date().toISOString();
  const id = generateId();
  const total = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0
  );
  const order = {
    id,
    restaurantId,
    items,
    total,
    state: "CREATED",
    customer,
    deliveryAddress,
    createdAt: now,
    updatedAt: now,
  };
  orders.set(id, order);
  if (idemKey) idempotencyKeys.set(idemKey, id);
  return res.status(201).json(order);
});

app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "not found" });
  res.json(order);
});

app.patch("/orders/:id/state", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ message: "not found" });
  const { state } = req.body || {};
  if (!state || !STATES.includes(state)) {
    return res.status(400).json({ message: "invalid state" });
  }
  const updated = { ...order, state, updatedAt: new Date().toISOString() };
  orders.set(order.id, updated);
  res.json(updated);
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`order service listening on ${port}`);
});

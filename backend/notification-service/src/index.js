const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const notifications = new Map();

const generateId = () => crypto.randomUUID();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification" });
});

app.get("/notifications/:id", (req, res) => {
  const note = notifications.get(req.params.id);
  if (!note) return res.status(404).json({ message: "not found" });
  res.json(note);
});

app.post("/notifications/test", (req, res) => {
  const {
    channel = "email",
    to = "demo@example.com",
    payload = {},
  } = req.body || {};
  const id = generateId();
  const now = new Date().toISOString();
  const note = {
    id,
    channel,
    to,
    payload,
    status: "SENT",
    attempts: 1,
    createdAt: now,
    sentAt: now,
  };
  notifications.set(id, note);
  res.status(201).json(note);
});

const port = process.env.PORT || 3004;
app.listen(port, () => {
  console.log(`notification service listening on ${port}`);
});

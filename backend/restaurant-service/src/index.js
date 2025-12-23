const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory stores for the demo implementation.
const restaurants = new Map();
const menus = new Map();
const menuItems = new Map();

const generateId = () => crypto.randomUUID();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "restaurant" });
});

app.post("/restaurants", (req, res) => {
  const { name, address, tags = [], status = "OPEN" } = req.body || {};
  if (!name || !address) {
    return res.status(400).json({ message: "name and address are required" });
  }
  const id = generateId();
  const now = new Date().toISOString();
  const restaurant = {
    id,
    name,
    address,
    tags,
    status,
    rating: 4.5,
    createdAt: now,
    updatedAt: now,
  };
  restaurants.set(id, restaurant);
  return res.status(201).json(restaurant);
});

app.get("/restaurants", (req, res) => {
  const list = Array.from(restaurants.values());
  const { q } = req.query;
  const filtered = q
    ? list.filter((r) => r.name.toLowerCase().includes(String(q).toLowerCase()))
    : list;
  res.json(filtered);
});

app.get("/restaurants/:id", (req, res) => {
  const restaurant = restaurants.get(req.params.id);
  if (!restaurant) return res.status(404).json({ message: "not found" });
  const restaurantMenus = Array.from(menus.values()).filter(
    (m) => m.restaurantId === restaurant.id
  );
  const itemsByMenu = restaurantMenus.map((m) => ({
    ...m,
    items: Array.from(menuItems.values()).filter((i) => i.menuId === m.id),
  }));
  res.json({ ...restaurant, menus: itemsByMenu });
});

app.post("/restaurants/:id/menus", (req, res) => {
  const restaurant = restaurants.get(req.params.id);
  if (!restaurant)
    return res.status(404).json({ message: "restaurant not found" });
  const { name, description = "" } = req.body || {};
  if (!name) return res.status(400).json({ message: "name is required" });
  const id = generateId();
  const now = new Date().toISOString();
  const menu = {
    id,
    restaurantId: restaurant.id,
    name,
    description,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  menus.set(id, menu);
  res.status(201).json(menu);
});

app.post("/menus/:menuId/items", (req, res) => {
  const menu = menus.get(req.params.menuId);
  if (!menu) return res.status(404).json({ message: "menu not found" });
  const {
    name,
    description = "",
    price,
    currency = "USD",
    isAvailable = true,
    tags = [],
    prepTimeSeconds = 600,
  } = req.body || {};
  if (!name || typeof price !== "number") {
    return res
      .status(400)
      .json({ message: "name and numeric price are required" });
  }
  const id = generateId();
  const now = new Date().toISOString();
  const item = {
    id,
    menuId: menu.id,
    name,
    description,
    price,
    currency,
    isAvailable,
    tags,
    prepTimeSeconds,
    createdAt: now,
    updatedAt: now,
  };
  menuItems.set(id, item);
  res.status(201).json(item);
});

app.patch("/menus/:menuId/items/:itemId", (req, res) => {
  const menu = menus.get(req.params.menuId);
  if (!menu) return res.status(404).json({ message: "menu not found" });
  const item = menuItems.get(req.params.itemId);
  if (!item || item.menuId !== menu.id)
    return res.status(404).json({ message: "item not found" });
  const updates = req.body || {};
  const updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
  menuItems.set(item.id, updated);
  res.json(updated);
});

app.patch("/restaurants/:id/status", (req, res) => {
  const restaurant = restaurants.get(req.params.id);
  if (!restaurant)
    return res.status(404).json({ message: "restaurant not found" });
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ message: "status is required" });
  const updated = {
    ...restaurant,
    status,
    updatedAt: new Date().toISOString(),
  };
  restaurants.set(restaurant.id, updated);
  res.json(updated);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`restaurant service listening on ${port}`);
});

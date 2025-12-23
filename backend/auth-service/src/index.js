const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 3600);

const app = express();
app.use(cors());
app.use(express.json());

// In-memory user store for demo; replace with Mongo/Postgres in production.
const users = new Map();

const issueToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role || "user",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
};

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth" });
});

app.post("/auth/register", async (req, res) => {
  const { email, password, role = "user" } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "email and password required" });
  if (users.has(email))
    return res.status(409).json({ message: "email already registered" });
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.set(email, user);
  const token = issueToken(user);
  res
    .status(201)
    .json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "email and password required" });
  const user = users.get(email);
  if (!user) return res.status(401).json({ message: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });
  const token = issueToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

app.get("/auth/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) return res.status(401).json({ message: "missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: payload });
  } catch (e) {
    res.status(401).json({ message: "invalid token" });
  }
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`auth service listening on ${port}`);
});

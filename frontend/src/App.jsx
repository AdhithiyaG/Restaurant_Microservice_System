import React, { useEffect, useMemo, useState } from "react";
import {
  authApi,
  deliveryApi,
  notificationApi,
  orderApi,
  restaurantApi,
} from "./api";

const Card = ({ title, children, actions }) => (
  <div className="card">
    <div className="card-header">
      <h3>{title}</h3>
      {actions}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const Tag = ({ children }) => <span className="tag">{children}</span>;

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    address: "",
    tags: "fusion, casual",
  });
  const [orderResult, setOrderResult] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [notificationResult, setNotificationResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState("");

  const requireAuth = () => {
    if (!authUser) {
      alert("Please log in first.");
      return null;
    }
    return localStorage.getItem("auth_token") || "";
  };

  const loadRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const data = await restaurantApi.list();
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
    const stored = localStorage.getItem("auth_token");
    if (stored) {
      authApi
        .me(stored)
        .then((res) => setAuthUser(res.user || res))
        .catch(() => {
          localStorage.removeItem("auth_token");
        });
    }
  }, []);

  const createRestaurant = async () => {
    if (!requireAuth()) return;
    setCreating(true);
    try {
      await restaurantApi.create({
        name: newRestaurant.name || "Demo Bistro",
        address: newRestaurant.address || "123 Demo Street",
        tags: newRestaurant.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      await loadRestaurants();
      setNewRestaurant({ name: "", address: "", tags: "fusion, casual" });
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError("");
    try {
      const action = authMode === "login" ? authApi.login : authApi.register;
      const res = await action(authForm);
      const token = res.token;
      if (token) localStorage.setItem("auth_token", token);
      setAuthUser(res.user || null);
      setAuthForm({ email: "", password: "" });
    } catch (e) {
      setAuthError(e.message || "Auth failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setAuthUser(null);
  };

  const featured = useMemo(() => restaurants.slice(0, 3), [restaurants]);

  const createOrderFlow = async () => {
    if (!requireAuth()) return;
    try {
      const targetRestaurant = restaurants[0];
      if (!targetRestaurant) {
        alert("Add a restaurant first");
        return;
      }
      const order = await orderApi.create({
        restaurantId: targetRestaurant.id,
        items: [{ name: "Chef Special", price: 19.0, qty: 1 }],
        customer: { name: "Guest", phone: "+1 555" },
        deliveryAddress: { line1: "123 Demo Street" },
      });
      setOrderResult(order);
      const delivery = await deliveryApi.assign({
        orderId: order.id,
        address: order.deliveryAddress,
      });
      setDeliveryStatus(delivery);
      const unsubscribe = deliveryApi.stream(delivery.id, (payload) =>
        setDeliveryStatus(payload)
      );
      setTimeout(unsubscribe, 15000);
    } catch (e) {
      alert(e.message);
    }
  };

  const sendTestNotification = async () => {
    if (!requireAuth()) return;
    try {
      const note = await notificationApi.test({
        channel: "email",
        to: "demo@example.com",
        payload: { message: "Hello" },
      });
      setNotificationResult(note);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Modern food orchestration</p>
          <h1>Restaurant platform HLD brought to life</h1>
          <p className="lede">
            Manage restaurants, menus, orders, delivery simulation, and
            notifications through a lightweight Node.js backend and a polished
            React UI.
          </p>
          <div className="actions">
            <button
              className="primary"
              onClick={createOrderFlow}
              disabled={!authUser}
            >
              Try a full order run
            </button>
            <button
              className="ghost"
              onClick={loadRestaurants}
              disabled={loadingRestaurants}
            >
              Refresh data
            </button>
          </div>
        </div>
        <div className="pillars">
          <div className="pillar">High availability</div>
          <div className="pillar">Low-latency reads</div>
          <div className="pillar">Event-driven</div>
        </div>
      </header>

      <section className="grid">
        <Card
          title="Authentication"
          actions={
            <div className="tags">
              <button
                className="ghost"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
              >
                {authMode === "login" ? "Switch to Sign up" : "Switch to Login"}
              </button>
            </div>
          }
        >
          {authUser ? (
            <div className="panel">
              <div className="row">
                <span>User</span>
                <strong>{authUser.email}</strong>
              </div>
              <div className="row">
                <span>Role</span>
                <Tag>{authUser.role || "user"}</Tag>
              </div>
              <button className="ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="panel">
              <div className="form-inline">
                <input
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, password: e.target.value })
                  }
                />
              </div>
              {authError && <p className="muted">{authError}</p>}
              <button className="primary" onClick={handleAuthSubmit}>
                {authMode === "login" ? "Login" : "Sign up"}
              </button>
            </div>
          )}
        </Card>

        <Card
          title="Restaurants"
          actions={
            <button
              className="ghost"
              onClick={loadRestaurants}
              disabled={loadingRestaurants}
            >
              {loadingRestaurants ? "Loading" : "Reload"}
            </button>
          }
        >
          {restaurants.length === 0 && (
            <p className="muted">No restaurants yet. Add one below.</p>
          )}
          <div className="restaurant-list">
            {restaurants.map((r) => (
              <div key={r.id} className="restaurant">
                <div>
                  <h4>{r.name}</h4>
                  <p className="muted">{r.address}</p>
                  <div className="tags">
                    {(r.tags || []).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <span className={`status ${r.status?.toLowerCase()}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <div className="form-inline">
            <input
              placeholder="Name"
              value={newRestaurant.name}
              onChange={(e) =>
                setNewRestaurant({ ...newRestaurant, name: e.target.value })
              }
            />
            <input
              placeholder="Address"
              value={newRestaurant.address}
              onChange={(e) =>
                setNewRestaurant({ ...newRestaurant, address: e.target.value })
              }
            />
            <input
              placeholder="Tags (comma separated)"
              value={newRestaurant.tags}
              onChange={(e) =>
                setNewRestaurant({ ...newRestaurant, tags: e.target.value })
              }
            />
            <button
              className="primary"
              onClick={createRestaurant}
              disabled={creating || !authUser}
            >
              {creating ? "Saving..." : "Add restaurant"}
            </button>
          </div>
        </Card>

        <Card
          title="Order + Delivery simulation"
          actions={orderResult && <Tag>{orderResult.state}</Tag>}
        >
          <p className="muted">
            Creates an order, assigns a mock delivery partner, and streams live
            status updates.
          </p>
          <button
            className="primary"
            onClick={createOrderFlow}
            disabled={!authUser}
          >
            Run simulation
          </button>
          {orderResult && (
            <div className="panel">
              <div className="row">
                <span>Order ID</span>
                <code>{orderResult.id}</code>
              </div>
              <div className="row">
                <span>Total</span>
                <strong>${orderResult.total?.toFixed(2)}</strong>
              </div>
              <div className="row">
                <span>State</span>
                <Tag>{orderResult.state}</Tag>
              </div>
            </div>
          )}
          {deliveryStatus && (
            <div className="panel">
              <div className="row">
                <span>Delivery ID</span>
                <code>{deliveryStatus.id}</code>
              </div>
              <div className="row">
                <span>Status</span>
                <Tag>{deliveryStatus.status}</Tag>
              </div>
              <div className="row">
                <span>Partner</span>
                <span>{deliveryStatus.partnerId}</span>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Notifications"
          actions={notificationResult && <Tag>{notificationResult.status}</Tag>}
        >
          <p className="muted">
            Trigger a mock notification send. The backend stores a simple audit
            trail.
          </p>
          <button
            className="primary"
            onClick={sendTestNotification}
            disabled={!authUser}
          >
            Send test notification
          </button>
          {notificationResult && (
            <div className="panel">
              <div className="row">
                <span>Notification ID</span>
                <code>{notificationResult.id}</code>
              </div>
              <div className="row">
                <span>Channel</span>
                <Tag>{notificationResult.channel}</Tag>
              </div>
              <div className="row">
                <span>Recipient</span>
                <span>{notificationResult.to}</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="featured">
        <h3>Featured picks</h3>
        <div className="cards">
          {featured.map((r) => (
            <div key={r.id} className="spotlight">
              <div>
                <p className="muted">{r.address}</p>
                <h4>{r.name}</h4>
                <div className="tags">
                  {(r.tags || []).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
              <span className="rating">★ 4.5</span>
            </div>
          ))}
          {featured.length === 0 && (
            <p className="muted">Add restaurants to see curated highlights.</p>
          )}
        </div>
      </section>
    </div>
  );
}

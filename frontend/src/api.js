const API_BASE = import.meta.env.VITE_API_BASE || "";
const RESTAURANT_BASE =
  import.meta.env.VITE_RESTAURANT_API || `${API_BASE}/api/restaurant`;
const ORDER_BASE = import.meta.env.VITE_ORDER_API || `${API_BASE}/api/order`;
const DELIVERY_BASE =
  import.meta.env.VITE_DELIVERY_API || `${API_BASE}/api/delivery`;
const NOTIFICATION_BASE =
  import.meta.env.VITE_NOTIFICATION_API || `${API_BASE}/api/notification`;
const AUTH_BASE = import.meta.env.VITE_AUTH_API || `${API_BASE}/api/auth`;

const handle = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const restaurantApi = {
  list: () => handle(`${RESTAURANT_BASE}/restaurants`),
  create: (payload) =>
    handle(`${RESTAURANT_BASE}/restaurants`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const orderApi = {
  create: (payload) =>
    handle(`${ORDER_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: (id) => handle(`${ORDER_BASE}/orders/${id}`),
};

export const deliveryApi = {
  assign: (payload) =>
    handle(`${DELIVERY_BASE}/deliveries/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  stream: (id, onMessage) => {
    const source = new EventSource(`${DELIVERY_BASE}/deliveries/${id}/stream`);
    source.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch (e) {
        console.error("stream parse", e);
      }
    };
    return () => source.close();
  },
};

export const notificationApi = {
  test: (payload) =>
    handle(`${NOTIFICATION_BASE}/notifications/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const authApi = {
  register: (payload) =>
    handle(`${AUTH_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    handle(`${AUTH_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (token) =>
    handle(`${AUTH_BASE}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

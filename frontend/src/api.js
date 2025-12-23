const API_BASE = import.meta.env.VITE_API_BASE || "";

const handle = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
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
  list: () => handle("/api/restaurant/restaurants"),
  create: (payload) =>
    handle("/api/restaurant/restaurants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const orderApi = {
  create: (payload) =>
    handle("/api/order/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: (id) => handle(`/api/order/orders/${id}`),
};

export const deliveryApi = {
  assign: (payload) =>
    handle("/api/delivery/deliveries/assign", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  stream: (id, onMessage) => {
    const source = new EventSource(`/api/delivery/deliveries/${id}/stream`);
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
    handle("/api/notification/notifications/test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

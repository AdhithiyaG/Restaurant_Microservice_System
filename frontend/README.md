# Frontend (React) Outline

This is a placeholder for a React SPA that consumes the microservices via the Nginx API gateway.

## Suggested Structure

- `src/api/` API client wrappers for Restaurant, Order, Delivery, Notification endpoints.
- `src/pages/RestaurantList.tsx` read-heavy listing with SWR/stale-while-revalidate.
- `src/pages/RestaurantAdmin.tsx` CRUD for menus and status.
- `src/pages/OrderTracker.tsx` SSE/WebSocket hook for delivery updates; fallback polling.
- `src/components/OrderFlow/` components for cart, checkout, and status.
- `src/state/` shared state (e.g., Zustand/Redux) if needed.
- `src/hooks/useLiveDelivery.ts` manage SSE/WebSocket connection to `/api/delivery/:id/stream`.

## Build

Use Vite or CRA. Example:

```bash
npm create vite@latest frontend -- --template react-ts
```

Then wire gateway base URL via env vars (e.g., `VITE_API_BASE=https://api.example.com`).

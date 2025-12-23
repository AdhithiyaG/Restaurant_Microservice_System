# Delivery Service (Mock / Simulated)

Responsibilities: assign delivery partners, simulate live status updates, and publish delivery events. Can operate as a mocked service with synthetic data.

## Run (stub)

```bash
npm install
npm start
```

## Env (suggested)

- PORT (default 3003)
- KAFKA_BROKER or NATS_URL

## API (paths behind gateway prefix `/api/delivery`)

- POST /deliveries/assign
- GET /deliveries/:id
- GET /deliveries/:id/stream (SSE/WebSocket for mocked live updates)

## Notes

- Simulate status changes (ASSIGNED -> PICKED -> EN_ROUTE -> DELIVERED).
- Publish `delivery.assigned` and `delivery.status.updated` events.
- Optionally persist delivery state in Postgres/Redis; mock mode can be in-memory.

# Order Service (Node.js)

Responsibilities: order creation, lifecycle management, persistence, and event publication. States: CREATED, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED.

## Run (stub)

```bash
npm install
npm start
```

## Env (suggested)

- PORT (default 3002)
- DATABASE_URL
- REDIS_URL (optional cache for reads)
- KAFKA_BROKER or NATS_URL

## API (paths behind gateway prefix `/api/order`)

- POST /orders (idempotency key header)
- GET /orders/:id
- PATCH /orders/:id/state

## Notes

- Publish `order.created` and `order.status.updated` events.
- Validate transitions server-side; enforce idempotency on create.
- For high read traffic on status, use cache and SSE/WebSocket for live updates.

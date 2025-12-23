# Notification Service (Node.js)

Responsibilities: consume events asynchronously and dispatch notifications (Email/SMS/Push; mock permitted). Provide history and retry with DLQ.

## Run (stub)

```bash
npm install
npm start
```

## Env (suggested)

- PORT (default 3004)
- PROVIDER_KEY (mock ok)
- KAFKA_BROKER or NATS_URL
- REDIS_URL (optional rate limiting)

## API (paths behind gateway prefix `/api/notification`)

- GET /notifications/:id
- POST /notifications/test

## Notes

- Consume `order.*`, `delivery.*`, `restaurant.*` events and send notifications.
- Use DLQ for failed sends; configurable retry/backoff.
- Mock providers allowed; maintain structured logs for audits.

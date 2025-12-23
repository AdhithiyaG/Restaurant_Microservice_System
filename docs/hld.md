# Restaurant Ordering Platform — High-Level Design

## Goals

- Serve high read traffic for restaurant listing with low latency.
- Enable independent scaling for Restaurant, Order, Delivery (mock), and Notification services.
- Maintain availability; accept eventual consistency across domains.
- Provide asynchronous notifications; simulate delivery tracking.

## Architecture (textual)

- **Clients**: React web app
- **Edge**: Nginx (API gateway, TLS termination, routing, rate limiting)
- **Services (Node.js)**: Restaurant Service, Order Service, Delivery Service (mock), Notification Service
- **Data**: PostgreSQL (primary), Redis (cache), Object Storage (images), Message Broker (Kafka/NATS), Optional Elasticsearch (search)
- **Observability**: Prometheus/Grafana (metrics), OpenTelemetry (traces), Loki/ELK (logs)

Request path example:
`Client -> Nginx -> Restaurant Service (reads from Redis; falls back to Postgres or read replica)`

Event path example:
`Order Service -> Kafka topic order.created -> Restaurant Service (decrement availability) -> Notification Service (fan-out)`

## Service Responsibilities

### Restaurant Service

- Register restaurants and menus; manage availability status.
- Provide read-heavy listings with caching and read replicas.
- Emit `restaurant.menu.updated` and `restaurant.availability.updated` events.

### Order Service

- Create orders; manage lifecycle states: CREATED, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED.
- Persist order state; publish order lifecycle events.
- Enforce idempotent order creation (idempotency key).

### Delivery Service (mock/sim)

- Assign delivery partner (mocked pool or rule-based assignment).
- Simulate live delivery status updates via scheduled jobs or WebSocket/SSE bridge.
- Publish delivery status events.

### Notification Service

- Consume events asynchronously; dispatch Email/SMS/Push (mock providers allowed).
- Provide notification history and DLQ for failures.

## Data Model (logical)

- **Restaurant**: id, name, address, geo, contact, status (OPEN/CLOSED), rating, tags, assets (image URLs), createdAt, updatedAt.
- **Menu**: id, restaurantId, name, description, isActive.
- **MenuItem**: id, menuId, name, description, price, currency, isAvailable, tags, prepTimeSeconds.
- **Order**: id, restaurantId, items [{menuItemId, qty, priceSnapshot}], total, state, customerInfo, deliveryAddress, eta, createdAt, updatedAt.
- **Delivery**: id, orderId, partnerId (mock), status (ASSIGNED, PICKED, EN_ROUTE, DELIVERED, FAILED), location (lat/lng), lastUpdate.
- **Notification**: id, type, channel, payload, status (QUEUED, SENT, FAILED), attempts, error, createdAt, sentAt.

## API Contracts (REST, gateway prefixes)

- **Restaurant Service** (prefixed `/api/restaurant`)
  - `POST /restaurants` register
  - `GET /restaurants` list (query by geo/tags; cached)
  - `GET /restaurants/:id` details
  - `POST /restaurants/:id/menus` add menu
  - `POST /menus/:menuId/items` add menu item
  - `PATCH /menus/:menuId/items/:itemId` update item
  - `PATCH /restaurants/:id/status` open/close
- **Order Service** (prefixed `/api/order`)
  - `POST /orders` create (idempotency-key header)
  - `GET /orders/:id` get status
  - `PATCH /orders/:id/state` transition
- **Delivery Service** (prefixed `/api/delivery`)
  - `POST /deliveries/assign` assign partner to order
  - `GET /deliveries/:id` status
  - `GET /deliveries/:id/stream` SSE/WebSocket for live updates (mocked)
- **Notification Service** (prefixed `/api/notification`)
  - `GET /notifications/:id` detail
  - `POST /notifications/test` trigger test notification (mock)

## Caching and Read Path

- Restaurant listing hits Redis cache; TTL + cache invalidation on menu/availability update events.
- Warm cache via background job and precomputed listing pages (by geo buckets).
- Read replicas for Postgres to offload read-heavy endpoints; write to primary.

## Consistency and Workflow

- Order creation flow: Restaurant availability check (cached), persist order (Order Service), publish `order.created`. Restaurant Service decrements available capacity asynchronously. Delivery assignment happens asynchronously; eventual consistency accepted.
- State transitions validated by Order Service; Delivery events update Order state to OUT_FOR_DELIVERY/DELIVERED.
- Notifications are event-driven with retries and DLQ.

## Scaling Strategy

- Stateless Node.js services; horizontal pod autoscaling on CPU/RPS.
- Separate autoscaling policies per service (listing is read-heavy; delivery simulation is CPU-timed; notifications scale by queue depth).
- Nginx scales independently; use health checks and circuit breakers.

## Failure Handling

- Retries with backoff for cross-service calls; use idempotency keys for order creation.
- Circuit breakers around downstreams (DB, cache, broker).
- DLQ for failed notifications and delivery assignment errors (even if mocked).

## Storage Choices

- **PostgreSQL**: relational integrity for orders/restaurants/menus.
- **Redis**: cache for listings, session tokens if needed, ephemeral delivery locations.
- **Kafka/NATS**: events (`order.*`, `restaurant.*`, `delivery.*`, `notification.*`).
- **Object Storage**: menu images; serve via CDN.

## Deployment Sketch

- Containerize each service; deploy to K8s or ECS.
- Nginx Ingress or standalone Nginx for routing and load balancing across service pods.
- Config via env vars/ConfigMaps/Secrets.
- CI/CD: lint/test -> build -> image push -> deploy.

## Observability

- Metrics: per-endpoint latency, error rates, queue lag, cache hit rate.
- Logs: structured JSON with trace/span ids.
- Traces: OpenTelemetry SDK in each Node.js service; sampled traces through Nginx headers.

## Security

- TLS termination at Nginx; mTLS between services optional.
- AuthN/Z via JWT at gateway (not fully specified here).
- Rate limit and WAF rules at edge.

## Example Sequences

1. **Create Order**

   - Client -> `POST /api/order/orders` (Nginx -> Order Service)
   - Order Service validates, persists, emits `order.created`.
   - Restaurant Service consumes event, updates availability, invalidates cache.
   - Delivery Service consumes, assigns partner (mock), emits `delivery.assigned`.
   - Notification Service consumes, sends confirmation.

2. **Update Preparation Status**

   - Restaurant dashboard -> `PATCH /api/order/orders/:id/state` to PREPARING.
   - Order Service persists and emits `order.status.updated`.
   - Notification Service sends customer update; Delivery Service may recalc ETA (mock).

3. **Delivery Live Updates (mock)**
   - Delivery Service schedules simulated location changes; emits `delivery.status.updated`.
   - Order Service updates state to OUT_FOR_DELIVERY/DELIVERED as applicable.
   - Frontend subscribes via SSE/WebSocket for near-real-time updates.

## Frontend Notes (React)

- Use a gateway base URL; implement API layer with fetch/axios and retry for GET listings.
- Listing page: cached responses and client-side pagination; stale-while-revalidate pattern.
- Order tracking page: SSE/WebSocket hook for delivery status; fallback to polling.
- Admin dashboard: restaurant registration, menu CRUD, order state transitions.

## Nginx Routing

- `/api/restaurant/` -> upstream restaurant_service
- `/api/order/` -> upstream order_service
- `/api/delivery/` -> upstream delivery_service
- `/api/notification/` -> upstream notification_service
- Static frontend can be served by CDN or Nginx `location /` pointing to built React assets.

## Risks and Mitigations

- Cache stampede on hot listings: use request coalescing and staggered TTL.
- Event consumer lag: autoscale by queue depth; DLQ with replay tooling.
- Mock delivery realism: configurable tick interval and deterministic seeds for tests.

## Testing Strategy

- Contract tests for REST APIs; schema validation.
- Component tests for state transitions in Order Service.
- E2E happy-path flows (order create -> assign -> deliver).
- Load tests for restaurant listing endpoint with cache enabled/disabled.

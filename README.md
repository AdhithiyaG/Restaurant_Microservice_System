# Microservice HLD: Restaurant Ordering Platform

This repository contains a high-level design (HLD) for a restaurant ordering platform with a React frontend, Node.js microservices backend, and Nginx for load balancing. It includes service responsibilities, API contracts, data models, scaling approaches, and an example folder layout to guide implementation.

## Quick Overview

- **Services**: Restaurant Service, Order Service, Delivery Service (mocked simulation allowed), Notification Service.
- **Infra**: API Gateway (Nginx)
- **Qualities**: High availability, read-heavy performance for restaurant listing (cache + read replicas), eventual consistency for cross-service updates, horizontal scalability per service.

## Files

- [docs/hld.md](docs/hld.md): Detailed architecture, flows, APIs, and ops guidance.
- [infra/nginx.conf](infra/nginx.conf): Sample Nginx config for load balancing and routing.
- [backend/restaurant-service/README.md](backend/restaurant-service/README.md): Service notes and minimal bootstrap stub.
- [backend/order-service/README.md](backend/order-service/README.md): Service notes and minimal bootstrap stub.
- [backend/delivery-service/README.md](backend/delivery-service/README.md): Service notes and minimal bootstrap stub.
- [backend/notification-service/README.md](backend/notification-service/README.md): Service notes and minimal bootstrap stub.
- [frontend/README.md](frontend/README.md): React app structure notes for consuming backend APIs.

## Run/Develop (outline)

- Each service runs independently via `npm install` then `npm start` (see service READMEs for commands).
- Nginx proxies `/api/restaurant`, `/api/order`, `/api/delivery`, `/api/notification` to respective services.
- Use a message broker (Kafka/NATS) for production events; demo uses in-memory mocks.
- Frontend: `cd frontend && npm install && npm run dev` (Vite). Set `VITE_API_BASE` if the backend runs on a different host.

## Next Steps

1. Flesh out each service implementation using the provided stubs as starting points.
2. Add schemas/migrations for PostgreSQL and Redis models as described in the HLD.
3. Connect the React frontend to the gateway endpoints; implement polling or SSE for live updates.
4. Add CI/CD, containerization, and infrastructure-as-code (e.g., Terraform or Helm charts).

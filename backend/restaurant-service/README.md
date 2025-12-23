# Restaurant Service (Node.js)

Responsibilities: restaurant registration, menu management, listing (read-heavy), availability updates. Backed by Postgres (primary) and Redis (cache). Emits events `restaurant.menu.updated` and `restaurant.availability.updated`.

## Run (stub)

```bash
npm install
npm start
```

## Env (suggested)

- PORT (default 3001)
- DATABASE_URL
- REDIS_URL
- KAFKA_BROKER or NATS_URL

## API (paths are behind gateway prefix `/api/restaurant`)

- POST /restaurants
- GET /restaurants
- GET /restaurants/:id
- POST /restaurants/:id/menus
- POST /menus/:menuId/items
- PATCH /menus/:menuId/items/:itemId
- PATCH /restaurants/:id/status

## Notes

- Cache restaurant listings with Redis; invalidate on menu/availability updates.
- Use read replicas for listing; write-through cache for hot items.
- Keep controllers thin; move business logic into services.

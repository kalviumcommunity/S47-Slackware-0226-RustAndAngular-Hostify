PR Summary
===========

This PR implements PostgreSQL-backed CRUD for `products` using Actix Web + SQLx and includes embedded SQL migrations, typed request/response models, error handling, and documentation. An AI review was executed and suggested improvements were applied.

Files of interest
- Migration: rust-backend/migrations/0001_create_products.sql
- Startup + pool: rust-backend/src/main.rs
- Models: rust-backend/src/models/product.rs
- Handlers: rust-backend/src/handlers/products.rs
- Routes: rust-backend/src/routes/products.rs
- Docs: conceptKlarity/documentation.md

Implemented CRUD operations
- Create: `POST /api/products` — inserts a record using parameterized SQL and returns `201 Created` with the created `ProductResponse`.
- Read (list): `GET /api/products` — returns all products.
- Read (single): `GET /api/products/{id}` — returns a single product or `404` if not found.
- Update: `PUT /api/products/{id}` — updates a product via `RETURNING` and returns the updated object or `404` if missing.
- Delete: `DELETE /api/products/{id}` — deletes a product and returns `204 No Content` or `404` if missing.

SQLx usage
- All SQL uses `.bind(...)` placeholders to prevent SQL injection.
- Embedded migrations are run at startup with `sqlx::migrate!()` (see `main.rs`).

Typed models
- `CreateProductRequest` — request payload for creating products.
- `UpdateProductRequest` — request payload for updating products.
- `ProductResponse` — API response model mirroring the DB fields, with `status` modeled as the `ProductStatus` enum.

Error handling
- `GET`/`PUT`/`DELETE` for a missing id return `404 Not Found`.
- DB errors are logged (`log::error!`) and return `500 Internal Server Error`.
- Invalid DB data for `status` values is detected (parsing returns `None`) and surfaced as `500` to avoid silent defaults.

Security / Middleware / CORS
- **AuthMiddleware** (`rust-backend/src/middleware/auth.rs`) protects write routes and checks `Authorization: Bearer <token>` against `AUTH_TOKEN` (default `devtoken123`). Missing/invalid credentials return `401` with a small JSON error.
- **CORS** is configured in `main.rs` to allow `http://localhost:4200`, methods `GET,POST,PUT,DELETE,OPTIONS`, and headers `Content-Type` and `Authorization` so the Angular frontend can call protected endpoints with Bearer tokens.


How to run locally
1. Start Postgres and create database/user:

```sql
CREATE DATABASE conceptclarity;
CREATE USER demo WITH PASSWORD 'demo';
GRANT ALL PRIVILEGES ON DATABASE conceptclarity TO demo;
```

2. Export `DATABASE_URL` and run the server:

```bash
export DATABASE_URL="postgres://demo:demo@localhost:5432/conceptclarity"
cd conceptKlarity/rust-backend
cargo run
```

3. Test endpoints (examples):

Create:

```bash
curl -i -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"New","price":9.99,"description":"demo"}'
```

List:

```bash
curl http://localhost:8080/api/products
```

Get one:

```bash
curl http://localhost:8080/api/products/1
```

Update:

```bash
curl -i -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated","price":15.0,"description":"updated","status":"available"}'
```

Delete:

```bash
curl -i -X DELETE http://localhost:8080/api/products/1
```

AI review
- An AI review was run and suggestions were applied: replaced `eprintln!` with `log::error!`, switched to `fetch_optional` for missing rows handling, removed `sqlx::FromRow` from `ProductResponse` and added explicit tuple->struct conversion and validation.

Notes / Next steps
- If you want compile-time SQL checking (`query!`/`query_as!`) add `sqlx-cli` and run `cargo sqlx prepare` in developer environments (see documentation.md).
- Consider adding integration tests against a test DB and CI steps to validate migrations and API behavior.

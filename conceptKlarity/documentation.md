# Database Integration — PostgreSQL + SQLx (this commit)

This commit adds PostgreSQL integration using `sqlx`, implements a connection pool, runs a simple startup migration, and provides a typed POST/GET API for `products` that maps database rows to typed Rust structs.

Summary of changes

- Added `sqlx` and `anyhow` to `rust-backend/Cargo.toml`.
- Created a connection pool from the `DATABASE_URL` environment variable in `src/main.rs`.
- Added embedded SQLx migrations and run them at startup using `sqlx::migrate!()`.
- Implemented `POST /api/products` (create) and `GET /api/products` (list) backed by the database in `handlers/products.rs` and `routes/products.rs`.
- Added typed request/response DTOs (`CreateProductRequest`, `ProductResponse`) and derived `serde` and `sqlx::FromRow` where appropriate.

Why PostgreSQL + SQLx

- PostgreSQL is an reliable relational database suitable for structured data.
- `sqlx` is an async first Rust library for talking with SQL databases. It provides safe bindings, support for connection pools, and works well with Actix Web.

Configuration & environment

- The database connection is read from the `DATABASE_URL` environment variable. It is NOT hard-coded.
- Example `DATABASE_URL` (Postgres):

```bash
export DATABASE_URL="postgres://dbuser:dbpass@localhost:5432/conceptklarity"
```

- The server reads this variable on startup and fails early if not set.

Connection pool & startup

- `src/main.rs` creates a pool with `sqlx::postgres::PgPoolOptions::new().max_connections(5).connect(&database_url).await`.
After obtaining the pool we run the embedded migrations (from `rust-backend/migrations/`) using `sqlx::migrate!()` which applies the checked SQL migration files included in the repository.

The checked migration used in this commit is `rust-backend/migrations/0001_create_products.sql` which creates the `products` table:

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

- If the pool cannot be established or the migration fails the server logs the error and exits cleanly (no panics or unwraps).

Implemented queries

- `POST /api/products` — accepts JSON request body matching `CreateProductRequest` and executes a parameterized `INSERT ... RETURNING ...` query, safely binding parameters to avoid SQL injection. The handler returns `201 Created` with the inserted row as `ProductResponse`.
- `GET /api/products` — executes `SELECT id, name, price, description, status FROM products` and returns an array of `ProductResponse`.

Example Rust types used

```rust
#[derive(Deserialize)]
pub struct CreateProductRequest {
        pub name: String,
        pub price: f64,
        pub description: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ProductResponse {
        pub id: i32,
        pub name: String,
        pub price: f64,
        pub description: Option<String>,
        pub status: ProductStatus,
}
```

Error handling

- The handlers use `match` on the `sqlx` futures; on database errors they log the error and return `500 Internal Server Error`.
- The `web::Json<T>` extractor automatically rejects invalid JSON and returns `400 Bad Request` for invalid request payloads, so handler code does not need manual JSON parsing.
- Startup errors (DB connection or migration failures) are logged and cause the app to exit with a clear error message.

Testing the endpoints locally

1. Create a PostgreSQL database and a user (example using `psql`):

```sql
CREATE DATABASE conceptklarity;
CREATE USER demo WITH PASSWORD 'demo';
GRANT ALL PRIVILEGES ON DATABASE conceptklarity TO demo;
```

2. Export `DATABASE_URL`:

```bash
export DATABASE_URL="postgres://demo:demo@localhost:5432/conceptklarity"
```

3. Run the backend:

```bash
cd conceptKlarity/rust-backend
cargo run
```

4. Create a product (valid request):

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"New Product","price":12.5,"description":"demo"}'
```

5. Fetch products:

```bash
curl http://localhost:8080/api/products
```

7. Fetch a single product by id:

```bash
curl http://localhost:8080/api/products/1
```

8. Update a product (PUT, full update):

```bash
curl -i -X PUT http://localhost:8080/api/products/1 \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated","price":15.0,"description":"updated","status":"available"}'
```

Expected: `200 OK` with the updated `ProductResponse`.

9. Delete a product:

```bash
curl -i -X DELETE http://localhost:8080/api/products/1
```

Expected: `204 No Content` on success, `404 Not Found` if the id does not exist.

6. Invalid payload (example):

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"MissingPrice"}'
```

This will result in `400 Bad Request` because `price` is missing and `web::Json<CreateProductRequest>` fails to deserialize.

Notes on security and SQL injection

- All queries use parameter binding (via `.bind()`), preventing SQL injection.

Why SQLx was chosen

- `sqlx` is async, integrates with tokio/Actix, supports connection pools, and provides both runtime and compile-time checked queries. It is a pragmatic choice for Rust web backends.

Next steps (recommended)

- Add a migration tool (e.g., `sqlx migrate` or `refinery`) and check-in migration files under `rust-backend/migrations/`.
- Add more robust error responses and structured error types for the API.
- Add unit/integration tests for handlers using a test database.

Security: Middleware, CORS, and Authentication
--------------------------------------------

Middleware implemented

- **AuthMiddleware** (`rust-backend/src/middleware/auth.rs`): enforces header-based auth for protected routes. It checks `Authorization: Bearer <token>` against the `AUTH_TOKEN` environment variable (defaults to `devtoken123` for local dev). Missing or invalid credentials return `401 Unauthorized` with a JSON body `{ "error": "Unauthorized" }`. The middleware runs before handlers and prevents handlers from containing auth logic.
- **Logger**: `env_logger` + `actix_web::middleware::Logger` logs requests centrally (initialized in `main.rs`).

CORS configuration

- CORS is configured in `main.rs` using `actix-cors::Cors`. The allowed origin for development is explicitly set to `http://localhost:4200` (Angular dev server).
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`.
- Allowed headers: `Content-Type` and `Authorization` (so the browser can send the Bearer token).
- Credentials (cookies/authorization headers) are supported (`supports_credentials()`), and preflight requests are permitted.

Protected vs Public routes

- Public (no auth required): `GET /api/products` (list) and `GET /api/products/{id}` (read single).
- Protected (auth required via `AuthMiddleware`): `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`.

How authentication is checked

- The middleware extracts the `Authorization` header and expects the format `Bearer <token>`.
- The token is compared against `AUTH_TOKEN` environment variable (set it locally or in CI). If the header is missing or the token does not match, the middleware responds with `401` and a small JSON error — no internal details are leaked.

How to test authorized vs unauthorized (curl)

Set the token for local testing (optional - default is `devtoken123`):

```bash
export AUTH_TOKEN="devtoken123"
```

Unauthenticated (should return 401):

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"X","price":1.0}'
```

Authenticated (succeeds):

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer devtoken123" \
    -d '{"name":"X","price":1.0}'
```

Response formats and safety

- Unauthorized requests: `401 Unauthorized` with JSON `{ "error": "Unauthorized" }`.
- Not found: `404 Not Found` with a short message (e.g. `Product not found`).
- Internal errors: logged on the server (`log::error!`) and return `500` with no internal stack traces in the response.

Case study: CORS, middleware, and authentication (for the video)

Scenario: your Angular frontend is deployed on a different domain than the Rust backend (cross-origin). By default browsers block cross-origin requests unless the server explicitly allows them. This is enforced by the browser, not the server — the server must opt-in by returning appropriate CORS headers.

How CORS blocks requests by default

- Browsers implement the Same-Origin Policy. When a script on `https://frontend.example` attempts to call `https://api.example`, the browser checks the response's CORS headers; if the server does not include the proper `Access-Control-Allow-Origin` header, the browser blocks the response.

How the configured CORS allows safe cross-origin access

- Our server sets `Access-Control-Allow-Origin: http://localhost:4200` (or the configured frontend origin), allows the required methods, and permits the `Authorization` header. For requests that include credentials or special headers, browsers perform a preflight `OPTIONS` request; the server's CORS policy must accept it (we allow `OPTIONS`). This enables the browser to send the actual request and the Authorization header safely.

How middleware verifies authentication and prevents unauthorized access

- The `AuthMiddleware` executes before any protected handler. It blocks requests lacking a valid `Authorization: Bearer <token>` header and returns `401`, so the handler never runs and cannot accidentally process unauthorized requests.
- This pattern centralizes auth checks, keeps handlers focused on business logic, and makes auditing/changes easier.


AI review & applied improvements

- Replaced ad-hoc error printing with `log::error!` and ensured `env_logger` is initialized.
- Switched `fetch_one` where appropriate to `fetch_optional` and handled `None` -> `404 Not Found`.
- Removed `sqlx::FromRow` derive on `ProductResponse` and perform explicit tuple -> struct conversion with validation of the `status` field.
- Made `ProductStatus::from_str` return `Option<ProductStatus>` so invalid DB values are surfaced instead of silently defaulting.

These changes were applied after an AI review step to improve error handling, SQLx usage, and robustness of the CRUD handlers.


---

## Typed Request/Response Models & Endpoint

We added a typed request and response model and a working POST endpoint to demonstrate Serde-based (de)serialization and typed APIs.

Models added (Rust)

```rust
// request
#[derive(Deserialize, Debug)]
pub struct CreateProductRequest {
        pub name: String,
        pub price: f64,
        pub description: Option<String>,
}

// response
#[derive(Serialize, Debug)]
pub struct ProductResponse {
        pub id: i32,
        pub name: String,
        pub price: f64,
        pub description: Option<String>,
        pub status: ProductStatus,
}
```

Endpoint implemented

- POST `/api/products` — accepts JSON matching `CreateProductRequest` and returns `201 Created` with JSON `ProductResponse`.
- The handler uses `web::Json<CreateProductRequest>` extractor; Actix + Serde automatically deserializes the request body into the typed struct. Invalid JSON or missing required fields result in a `400 Bad Request` automatically.

Example handler (simplified):

```rust
pub async fn create_product(req: web::Json<CreateProductRequest>) -> impl Responder {
        let payload = req.into_inner();
        let response = ProductResponse { id: 100, name: payload.name, price: payload.price, description: payload.description, status: ProductStatus::Available };
        HttpResponse::Created().json(response)
}
```

Testing with curl

Send a valid request:

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"New Product","price":12.5,"description":"demo"}'
```

Expected result: HTTP/1.1 201 Created and JSON body matching `ProductResponse`.

Send invalid JSON (will produce 400):

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name":"MissingPrice"}'
```

Why Serde

- `serde` provides safe, performant, and flexible (de)serialization between Rust types and JSON. Using typed structs avoids manual parsing and ensures compile-time guarantees about field types.

Notes on error handling

- The `web::Json` extractor rejects invalid JSON or mismatched types with a 400 response by default. For additional validation (e.g., non-negative price) you can add explicit checks in the handler and return `HttpResponse::BadRequest()` when needed.


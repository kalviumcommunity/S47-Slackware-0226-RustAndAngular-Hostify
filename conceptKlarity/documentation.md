# Database Integration — PostgreSQL + SQLx (this commit)

This commit adds PostgreSQL integration using `sqlx`, implements a connection pool, runs a simple startup migration, and provides a typed POST/GET API for `products` that maps database rows to typed Rust structs.

Summary of changes

- Added `sqlx` and `anyhow` to `rust-backend/Cargo.toml`.
- Created a connection pool from the `DATABASE_URL` environment variable in `src/main.rs`.
- Executed a simple `CREATE TABLE IF NOT EXISTS products (...)` migration at startup.
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
- After obtaining the pool we run a simple SQL statement to ensure the `products` table exists:

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description TEXT,
    status TEXT NOT NULL
)
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


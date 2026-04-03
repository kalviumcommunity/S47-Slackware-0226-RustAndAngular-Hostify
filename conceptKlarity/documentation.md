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

JWT Login flow

1. Obtain JWT token (login):

```bash
curl -i -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password"}'
```

The response body will be JSON `{ "token": "<jwt>" }`.

2. Use the returned token in `Authorization: Bearer <jwt>` header for protected calls (POST/PUT/DELETE).

Angular notes

- `AuthService` (`conceptKlarity/angular/services/auth.service.ts`) performs login against `/api/auth/login`, stores the JWT in `localStorage` under `auth_token`, and exposes `login()`, `logout()` and `isLoggedIn()` helpers.
- An `AuthInterceptor` (`conceptKlarity/angular/src/app/interceptors/auth.interceptor.ts`) attaches the stored JWT automatically to outgoing requests (except the login endpoint).


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

Frontend: Loading & Error Handling
---------------------------------

Files updated:

- `conceptKlarity/angular/product-list.component.ts` — manages two loading flags: `loadingList` for the initial GET and `submitting` for POST requests. Both flags are set before the request and cleared on success or error. The component maps `HttpErrorResponse` status codes to friendly messages.
- `conceptKlarity/angular/product-list.component.html` — displays a loading indicator for list fetches, shows friendly error messages, and disables input fields and the `Add` button while a create request is in progress.
- `conceptKlarity/angular/product.service.ts` — attaches `Authorization: Bearer <token>` header from `AuthService.getToken()` when performing protected write requests (POST).

How loading states are managed

- `loadingList` is set to `true` right before calling `getProducts()` and set to `false` in both the `next` and `error` callbacks.
- `submitting` is set to `true` right before calling `createProduct()` and set to `false` in both the `next` and `error` callbacks.
- The template disables inputs and buttons during `submitting` and shows a simple `Loading...` message when `loadingList` is true. This prevents duplicate submissions and keeps the UI consistent.

Success handling

- On successful `GET /api/products` the component calls `StateService.setItems()` so the shared state updates and the UI reflects the new data automatically.
- On successful `POST /api/products` the created `Product` returned by the backend is appended to the shared state and the input fields are cleared.

Error handling

- Errors are caught from `HttpClient` and mapped to friendly messages using status codes.
    - `0` -> Network error (server unreachable).
    - `401`/`403` -> `Unauthorized — please login`.
    - `400` -> `Invalid request (bad input)`.
    - `5xx` -> `Server error — try again later`.
- The UI shows the friendly message in a reserved `.error` area; raw backend error bodies or stack traces are not shown.

Which endpoints are used

- `GET /api/products` — fetch list (public)
- `POST /api/products` — create product (protected: requires `Authorization: Bearer <token>` header)

Tested error scenarios & how to reproduce locally

1. Network/server down

 - Stop the backend or point `DATABASE_URL` incorrectly and click refresh in the app. The UI displays `Network error — cannot reach server`.

2. Unauthorized

 - Leave `AUTH_TOKEN` unset on the server (or use a different token) and attempt to create a product. The backend returns `401`; the UI shows `Unauthorized — please login`.

3. Validation / Bad request

 - Send a create request with missing fields (try `-d '{"name":"MissingPrice"}'` in curl). The backend will respond `400` and the UI shows `Invalid request (bad input)`.

Local reproduction steps (Angular + Backend)

1. Start the backend (ensure `DATABASE_URL` is set):

```bash
cd conceptKlarity/rust-backend
export DATABASE_URL="postgres://demo:demo@localhost:5432/conceptclarity"
export AUTH_TOKEN="devtoken123" # set token for protected routes
cargo run
```

2. Start the Angular dev server:

```bash
cd conceptKlarity/angular
npm install
npm start
```

3. In the browser app, open DevTools Console and optionally set a test token (so the frontend sends a valid token) if you want to test protected routes from the UI:

```js
localStorage.setItem('auth_token', 'devtoken123');
```

4. Use the app UI to fetch and create products. Try the error scenarios above to observe friendly messages and loading states.


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

Type-safe Contracts: Angular ↔ Rust
----------------------------------

This project includes end-to-end typed request and response models to ensure the frontend and backend agree on data shapes.

- Rust request model: `CreateProductRequest` in `rust-backend/src/models/product.rs`:

```rust
#[derive(Deserialize, Debug)]
pub struct CreateProductRequest {
        pub name: String,
        pub price: f64,
        pub description: Option<String>,
}
```

- Angular request model: `CreateProductRequest` in `conceptKlarity/angular/src/app/models/product.model.ts`:

```ts
export interface CreateProductRequest {
    name: string;
    price: number;
    description?: string;
}
```

These models match exactly: `name` (string), `price` (number / f64), and `description` (optional string / `Option<String>`). The Angular `createProduct()` method accepts `CreateProductRequest` and sends it as JSON; the Rust handler uses `web::Json<CreateProductRequest>` to deserialize it.

Typed responses

- Rust returns `ProductResponse` (Rust struct) with `Option<String>` for `description` and `ProductStatus` for `status`.
- Angular defines `Product` with `description?: string` and a union type for `status`:

```ts
export interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    status: 'available' | 'out_of_stock' | 'discontinued';
}
```

How optional fields are handled

- Rust: `Option<T>` represents nullable/optional fields and Serde will omit or set JSON `null` for missing values.
- Angular: optional fields are modeled with `?` (e.g., `description?: string`), and `HttpClient` generics handle `null`/`undefined` appropriately when mapping JSON to the TS interface.

Why type-safe contracts matter

- Mismatches are caught early: Rust will reject malformed payloads during deserialization; TypeScript enforces usage of the defined interfaces at compile time in the frontend, preventing accidental use of `any` in API calls.
- Using typed generics with `HttpClient` (`this.http.post<Product>(...)`) ensures the received JSON is treated as a `Product` at compile time and helps you surface inconsistencies quickly.

How to test locally

1. Start backend (ensure `DATABASE_URL` is set):

```bash
export DATABASE_URL="postgres://demo:demo@localhost:5432/conceptclarity"
export JWT_SECRET="your-secret"
export ADMIN_USER="admin"
export ADMIN_PASSWORD="password"
cd conceptKlarity/rust-backend
cargo run
```

2. Start Angular dev server:

```bash
cd conceptKlarity/angular
npm install
npm start
```

3. Perform an end-to-end create from the app UI or via curl using the typed request shape (see earlier curl examples). The backend will return a typed JSON `ProductResponse`. Verify the UI shows the created product and no runtime type errors occur in the console.

Observable-Based API Handling
--------------------------------

- **Services return Observables:** `ProductService.getProducts()` and `ProductService.createProduct()` return `Observable<T>` from `HttpClient`. `AuthService.login()` now returns `Observable<boolean>` (no Promises or `firstValueFrom`). See [conceptKlarity/angular/product.service.ts](conceptKlarity/angular/product.service.ts) and [conceptKlarity/angular/services/auth.service.ts](conceptKlarity/angular/services/auth.service.ts).
- **Components consume via async pipe and single subscriptions:** `ProductListComponent` exposes `items$` from `StateService.items$` and the template uses the `async` pipe to render the list (see [conceptKlarity/angular/product-list.component.html](conceptKlarity/angular/product-list.component.html)). User-initiated actions (login, create) are handled via single subscriptions that complete; manual subscriptions are tracked and unsubscribed in `ngOnDestroy` to avoid leaks.
- **RxJS operators used:**
    - `map` in `ProductService.getProducts()` to apply a lightweight transformation (trim names).
    - `tap` for logging and side-effects (storing token in `AuthService`, clearing errors in components).
    - `switchMap` in `ProductListComponent.add()` to chain `createProduct()` -> `getProducts()` without nested subscriptions.
    - `catchError` in component pipelines to catch backend errors and return a safe fallback (`of([])`) while setting a friendly UI error message.

Why these operators:

- `map` is used to transform incoming data shapes (a pure transformation).
- `tap` is used for side-effects (logging, UI state changes) and does not alter the stream.
- `switchMap` replaces nested subscribes and ensures the inner request cancels if a new outer emission occurs (useful for user-triggered refreshes).
- `catchError` centralizes error handling inside the stream, allowing the UI to show a safe fallback without crashing.

Safe subscription patterns

- Use `async` pipe in templates when possible — it subscribes and unsubscribes automatically.
- For imperative flows (e.g., submit handlers), use `pipe(take(1))` or track subscriptions in a `Subscription` array and unsubscribe in `ngOnDestroy`.

How to test the async behavior locally

1. Start the backend and frontend as described earlier.
2. Open the app and observe the product list renders via the async pipe.
3. Trigger intermittent failures (stop the backend) and confirm the UI shows a friendly error (`Network error — cannot reach server`) and does not crash.
4. Test the login flow — `AuthService.login()` uses `tap` to persist the token and returns `Observable<boolean>`; ensure successful login navigates and failed login shows `Login failed`.


**Performance & Async**

- **All handlers are asynchronous:** The product handlers are implemented as async functions so database I/O never blocks the Actix worker threads. See the implementation in [conceptKlarity/rust-backend/src/handlers/products.rs](conceptKlarity/rust-backend/src/handlers/products.rs).
- **Shared application state:** A single `PgPool` is created once at startup and kept in a shared `AppState` injected via `web::Data` (see [conceptKlarity/rust-backend/src/state.rs](conceptKlarity/rust-backend/src/state.rs) and [conceptKlarity/rust-backend/src/main.rs](conceptKlarity/rust-backend/src/main.rs)). This avoids creating heavy resources per request.
- **Async-safe cache to reduce redundant work:** We added a small in-memory TTL cache (async `tokio::sync::RwLock`) for the product list to avoid repeated `SELECT` queries on hot endpoints. The cache TTL is short (default 5s) and is invalidated on writes (POST/PUT/DELETE). This is implemented in `AppState` in [conceptKlarity/rust-backend/src/state.rs](conceptKlarity/rust-backend/src/state.rs) and used by the list handler in [conceptKlarity/rust-backend/src/handlers/products.rs](conceptKlarity/rust-backend/src/handlers/products.rs).
- **Early returns on errors:** Handlers return `actix_web::Result<HttpResponse>` and use `?` to return early on DB or mapping errors; those are mapped to appropriate `5xx` or `4xx` responses with logged errors.
- **Why async is critical for `list_products` / `create_product`:** both handlers perform network I/O (database queries). Running those operations asynchronously prevents worker threads from blocking and drastically increases throughput under concurrent load. `list_products` benefits especially when many clients poll the list, which is why the in-memory cache reduces DB pressure.
- **Lightweight middleware & scoped application:** Authentication middleware is kept small (only header validation) and applied only to write routes; it does not perform heavy CPU or I/O work so it has negligible impact on request latency.

How to validate the performance changes locally

1. Start backend with the environment configured (example):

```bash
export DATABASE_URL="postgres://demo:demo@localhost:5432/conceptclarity"
export AUTH_TOKEN="devtoken123"
cargo run --manifest-path conceptKlarity/rust-backend/Cargo.toml
```

2. Warm the cache: call the list endpoint a first time (this populates the in-memory cache):

```bash
curl http://localhost:8080/api/products
```

3. Immediately call the list endpoint again; the second call should be served from the in-memory cache (observe reduced DB activity in the backend logs):

```bash
curl http://localhost:8080/api/products
```

4. Perform a write (create a product); this invalidates the cache and forces subsequent reads to hit the DB again:

```bash
curl -i -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer devtoken123" \
    -d '{"name":"Cache Bust","price":3.14}'
```

5. Re-run the list call; it will reflect the new product and repopulate the cache.

Notes on design trade-offs

- The in-memory cache reduces redundant DB queries for read-heavy endpoints at the cost of potential short-lived staleness (TTL). Invalidating on writes keeps consistency for most flows.
- Using `tokio::sync::RwLock` avoids blocking executor threads; avoid `std::sync::RwLock` which can block and hurt async performance.
- For production or multi-instance deployments, replace the in-memory cache with a centralized cache (Redis) so all instances share cached data.


Docker image & multi-stage build
-------------------------------

I added a multi-stage `Dockerfile` at [conceptKlarity/rust-backend/Dockerfile](conceptKlarity/rust-backend/Dockerfile) to produce a minimal, production-focused image. Key points:

- **Why multi-stage builds:** multi-stage builds let us compile the Rust binary using the full Rust toolchain in a build stage and then copy only the compiled artifact into a small runtime image. This keeps the final image free of the Rust compiler, Cargo, or source code and minimizes attack surface and image size.

- **What each stage does:**
    - **builder:** `rust:1.71` image used to compile the application in release mode. The stage caches dependencies by copying `Cargo.toml` first, installs native build dependencies (OpenSSL, pkg-config, binutils) only in the builder, builds `target/release/rust_backend_mvp`, and strips debugging symbols.
    - **runtime:** `debian:bullseye-slim` image containing only CA certs and a non-root user; the compiled binary is copied from the builder. No cargo or Rust toolchain is present in this stage.

- **Optimizations applied:**
    - Layer caching for Cargo dependencies (copy `Cargo.toml` first) speeds rebuilds.
    - `strip` reduces binary size.
    - Final image contains only the runtime binary and CA certs; no source or build tools remain.

How to build and run locally

From the repository root (build context is the `rust-backend` folder):

```bash
# build the docker image (context is the rust-backend folder)
docker build -t conceptklarity/rust-backend:latest ./conceptKlarity/rust-backend

# run the container (set DB and secret env vars at runtime; do NOT hardcode secrets in the Dockerfile)
docker run --rm -p 8080:8080 \
    -e DATABASE_URL="postgres://demo:demo@host.docker.internal:5432/conceptclarity" \
    -e AUTH_TOKEN="devtoken123" \
    -e JWT_SECRET="replace-with-secure-secret" \
    conceptklarity/rust-backend:latest
```

Notes on runtime configuration

- The server reads configuration from environment variables at startup (see `config::get_*` helpers). The `PORT` environment variable controls which port the server binds to (default `8080`).
- **Do not** bake secrets (JWT secret, DB passwords) into the image. Provide them via `docker run -e ...`, Docker Compose, or your orchestration layer.

AI review & improvements applied
--------------------------------

I ran an internal AI review focused on Docker build ergonomics and applied the following improvements:

- Added dependency-caching pattern (copy `Cargo.toml` first) so rebuilds reuse previously downloaded crates.
- Installed native build dependencies only in the builder stage (not in final image) so final image remains minimal.
- Stripped the release binary to reduce size.

These changes are visible in the `Dockerfile` and reduce rebuild time and final image footprint while keeping the build reproducible.




# Klarity backend (minimal)

This is a minimal Rust backend using Axum that exposes a health check endpoint.

Run locally:

```bash
cd conceptKlarity/backend
cargo run
# or set port
PORT=4000 cargo run
```

Database migration (Postgres)
-----------------------------

This folder includes a SQL migration that creates a `products` table used by the backend.

Files:

- `migrations/20260403_create_products_table.up.sql` — creates `products` table
- `migrations/20260403_create_products_table.down.sql` — drops `products` table

Run migration using `psql` (example):

```bash
# create database (if needed)
createdb klarity_dev

# run migration up
psql klarity_dev -f migrations/20260403_create_products_table.up.sql

# verify
psql klarity_dev -c "\d products"
```

Or use `sqlx-cli` (recommended for scripted migrations):

```bash
# install sqlx-cli if needed
cargo install sqlx-cli --no-default-features --features postgres

# set DATABASE_URL and run a raw SQL migration (sqlx expects a migrations folder structure for `sqlx migrate`)
export DATABASE_URL=postgres://localhost/klarity_dev
# apply using psql as shown above or use your migration tooling of choice
```

Rollback (down):

```bash
psql klarity_dev -f migrations/20260403_create_products_table.down.sql
```

Notes
-----
- Migration is written for PostgreSQL. Adjust types/SQL if you use another DB.
- The backend currently provides in-memory data by default. To fully switch to DB-backed storage, update the Rust backend to open a `PgPool` and query the `products` table (see `sqlx::query_as!` or `sqlx::query` patterns).

Products DB-backed endpoint
---------------------------

The backend exposes a DB-backed endpoint that supports pagination and filtering:

- `GET /products-db`

Query parameters:
- `page` (default 1)
- `limit` (default 10, max 100)
- `name` (optional text filter, case-insensitive contains)

Example:

```bash
curl "http://localhost:8080/products-db?page=2&limit=5&name=mouse"
```

Implementation notes:
- Uses `sqlx::PgPool` and a parameterized query with `LIMIT`/`OFFSET` to implement pagination.
- Uses an `ILIKE '%name%'` filter when `name` is provided.
- If `DATABASE_URL` is not set the endpoint will respond with a 500-style error (database not configured).



Health endpoint:

- GET /health
- Response: JSON { "status": "ok" }

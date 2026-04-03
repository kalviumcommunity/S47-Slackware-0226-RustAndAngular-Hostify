# Klarity backend (minimal)

This is a minimal Rust backend using Axum that exposes a health check endpoint.

Run locally:

```bash
cd conceptKlarity/backend
cargo run
# or set port
PORT=4000 cargo run
```

Health endpoint:

- GET /health
- Response: JSON { "status": "ok" }

Product API examples:

- GET /products  — returns list of products
- POST /products — create product (JSON payload)

Example curl:

```bash
# list
curl http://localhost:8080/products

# create
curl -X POST http://localhost:8080/products -H 'Content-Type: application/json' -d '{"name":"New Item","price":1234,"description":"sample"}'
```

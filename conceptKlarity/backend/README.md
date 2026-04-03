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

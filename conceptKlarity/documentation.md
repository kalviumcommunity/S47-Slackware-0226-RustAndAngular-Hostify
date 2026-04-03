# Rust Data Models — Structs, Enums, and Integration

This document explains how we defined Rust data models (structs and enums) and integrated them into the backend scaffold for the project.

Overview

- Rust structs model domain entities (like `Product`).
- Enums model discrete state or typed variants (like `ProductStatus`).
- We use `serde` to serialize/deserialize models to/from JSON for HTTP handlers.

Files changed / created

- `conceptKlarity/rust-backend/src/models/product.rs` — contains the `Product` struct and `ProductStatus` enum, with `serde` derives.
- `conceptKlarity/rust-backend/src/handlers/items.rs` — constructs and returns `Product` JSON via Actix handlers.

Example: `Product` struct and `ProductStatus` enum

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ProductStatus {
    Available,
    OutOfStock,
    Discontinued,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub status: ProductStatus,
}
```

Why these derives and attributes

- `Serialize` / `Deserialize` (from `serde`) allow automatic JSON encoding and decoding in handlers.
- `Debug` and `Clone` are useful for development and testing.
- `#[serde(rename_all = "snake_case")]` makes enum variant names map to predictable JSON strings (e.g., `available`).

Integrating into Actix handlers

In `src/handlers/items.rs` we import the model types and return JSON responses directly:

```rust
use crate::models::product::{Product, ProductStatus};
use actix_web::{web, HttpResponse, Responder};

pub async fn get_items() -> impl Responder {
    let items = vec![Product { id: 1, name: "Example".into(), price: 9.99, description: Some("Sample".into()), status: ProductStatus::Available }];
    HttpResponse::Ok().json(items)
}
```

Mapping to the frontend (TypeScript)

Frontend TypeScript interfaces should mirror the Rust model shape so serialised JSON maps cleanly.
Example TypeScript model:

```ts
export type ProductStatus = 'available' | 'out_of_stock' | 'discontinued';

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  status: ProductStatus;
}
```

When we return `Product` JSON from Actix, the Angular `HttpClient` can deserialize into `Product` objects if the TypeScript interface matches the JSON shape.

Database & persistence notes

- If using SQLx or another ORM, annotate Rust models for DB mapping (example):

```rust
#[derive(sqlx::FromRow, Serialize, Deserialize, Debug, Clone)]
pub struct ProductRow { /* fields matching DB columns */ }
```

- Convert between DB rows and API DTOs (separate `models::db` vs `models::api` modules) to avoid leaking DB-specific types into API contracts.

Testing and verification

- Start the backend and query the endpoint to verify JSON output:

```bash
cd conceptKlarity/rust-backend
cargo run

curl http://localhost:8080/api/items
```

- Expect JSON where `status` is a string like `"available"` and the structure matches the TypeScript `Product` interface.

Best practices and tips

- Keep API DTOs (what you send over HTTP) separate from internal DB models where useful.
- Use `serde` attributes to control JSON field names and enum representation.
- When updating models, update both the Rust DTO and the TypeScript interface so the front-end and back-end remain in sync.

Next steps (optional)

- Add `sqlx::FromRow` derives and implement DB migrations in `rust-backend/migrations/` when moving from in-memory examples to a persistent store.
- Add unit tests for (de)serialization to ensure enum variants and optional fields behave as expected.

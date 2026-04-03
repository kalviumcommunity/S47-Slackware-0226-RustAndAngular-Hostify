# ConceptKlarity — MVP scaffolds (Angular + Rust)

This repository contains minimal, focused scaffolds to demonstrate the default structure and request/response flow between an Angular frontend and a Rust (Actix Web) backend.

What I added (MVP):

- Angular: small example under `conceptKlarity/angular`
  - `app.module.ts`, `product-list.component.ts/.html`, `product.service.ts` (already present)
  - Use `npm start` / `ng serve` to run the Angular dev server (see `package.json`).

- Rust backend: lightweight Actix Web scaffold under `conceptKlarity/rust-backend`
  - `Cargo.toml` — dependencies
  - `src/main.rs` — server entry point
  - `src/routes/items.rs` — route config for `/api/items`
  - `src/handlers/items.rs` — handlers (GET/POST) returning/consuming `Product` JSON
  - `src/models/product.rs` — `Product` DTO (serde)
  - `src/config/mod.rs` — small helper for port configuration

How they communicate

- Angular `ProductService` (in `conceptKlarity/angular/product.service.ts`) calls `/api/items` endpoints using `HttpClient`.
- Rust backend exposes the endpoints at `/api/items` (GET returns a sample list; POST echoes the created object).
- In a deployed setup you'd configure CORS and a reverse proxy or API base URL. For local dev keep Angular and Rust servers running on different ports (Angular default `4200`, backend `8080`) and configure proxying if needed.

Quick run & test

1. Start the Rust backend (from this folder):

```powershell
cd conceptKlarity/rust-backend
cargo run
```

2. Start the Angular dev server (from `conceptKlarity/angular`):

```bash
cd conceptKlarity/angular
npm install    # if dependencies not installed
npm start
```

3. Quick API checks

```bash
curl http://localhost:8080/api/items
curl -X POST http://localhost:8080/api/items -H "Content-Type: application/json" -d '{"id":0,"name":"New","qty":3}'
```

Notes on screenshots and submission

- I can't create screenshots automatically here. To capture the required trees, run one of these commands and take a screenshot of the terminal output or file explorer view:

  - Windows PowerShell: `Get-ChildItem -Recurse -Depth 2` (or `ls -Recurse`)
  - Portable: `tree /F` (may require enabling) or `ls -R` in Git Bash

- Required artifacts for PR:
  - Angular scaffold (files under `conceptKlarity/angular`)
  - Rust scaffold (files under `conceptKlarity/rust-backend`)
  - This README explaining structure and how they communicate
  - Screenshots showing the folder trees and `Cargo.toml` dependencies

If you want, I can:

- Commit these changes and create a branch for the PR
- Add a small Angular proxy config to forward `/api` calls to the backend during `ng serve`
- Add CORS config to the Rust server

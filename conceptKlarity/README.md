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
nothing changes

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

**PR: Angular CLI demo component & build/test tasks**

- **What I added (component):**
  - A demo CLI component was created at `conceptKlarity/angular/demo-cli.component.*` to simulate the output of `ng generate component demo-cli`.
  - The component is declared in `app.module.ts` and inserted into the `product-list` template so it renders on the main page.

- **Commands you must run locally for PR evidence:**

  1. Generate component via CLI (optional if already included):

  ```bash
  # run in conceptKlarity/angular
  ng generate component demo-cli
  ```

  2. Serve the app and capture terminal output (paste into PR):

  ```bash
  npm start       # or ng serve
  ```

  - Note the URL `http://localhost:4200` and include the terminal lines showing compilation succeeded.
  - Hot-reload: when editing component HTML/TS/CSS files, `ng serve` recompiles and updates the browser automatically.

  3. Build the app and capture the `ng build` output:

  ```bash
  ng build
  ```

  - The `dist/` folder contains production-ready static files (HTML, JS bundles, assets) that you can deploy to a static server.
  - Include the final build lines in the PR showing the build completed without errors.
  - Difference: `ng serve` runs a dev server with in-memory compilation and hot reload; `ng build` produces static files in `dist/` for deployment.

  4. Run tests and capture output (Karma + Jasmine by default):

  ```bash
  ng test
  ```

  - Include the test runner output or screenshot in the PR. Angular defaults to Karma + Jasmine; `ng test` typically runs in watch mode and opens a browser to run specs.

- **About this environment:**
  I created the demo component files and a basic unit spec in this repo so you can open and run the exact commands above locally. I could not run `ng`/`npm` commands in this environment (no Node/Angular CLI available here), so please run the listed commands locally and paste terminal outputs/screenshots into the PR description.

- **AI feedback step:**
  - Before final submission run a CodiumAI review on your PR by commenting: `@CodiumAI-Agent /review` on the PR page.
  - Apply relevant suggestions and commit the changes so the PR diff shows the improvements.


**PR: TypeScript Model & Typed Service**

- **What I added:**
  - `src/app/models/product.model.ts` — `Product` interface defining typed fields and an optional `description`.
  - Updated `product.service.ts` to import the `Product` interface and to provide typed methods: `getProducts(): Observable<Product[]>` and `createProduct(...) : Observable<Product>`.
  - Updated `product-list.component.ts` to consume the typed service, assign `items: Product[]`, and `console.log` the strongly-typed response.

- **TypeScript features used:**
  - **Types & primitives:** `number`, `string`.
  - **Interfaces:** `export interface Product { ... }` for a clear domain model.
  - **Optional fields:** `description?: string` demonstrates optional properties.
  - **Classes:** Angular `ProductService` and `ProductListComponent` are typed classes.
  - **Typed functions:** method signatures explicitly declare return types.
  - **Generics:** `Observable<Product[]>` shows `Observable<T>` and how generics enforce types across async boundaries.

- **Why TypeScript improves Angular development (short):**
  TypeScript adds static types and interfaces that catch many bugs at compile time, make refactors safer, and improve IDE support (autocomplete, jump-to-definition, quick signature help). In Angular, types make component inputs/outputs, service contracts, and HTTP payloads explicit, reducing runtime surprises and improving collaboration.

- **How to verify locally:**

  1. Start the backend (if you want to see runtime responses):

  ```powershell
  cd conceptKlarity/rust-backend
  cargo run
  ```

  2. Start the Angular app and see typed logs in the browser console:

  ```bash
  cd conceptKlarity/angular
  npm install
  npm start
  ```

  The `product-list.component` will `console.log('Typed products:', products)` showing the strongly-typed `Product[]` returned by the service.

- **Screenshot:**
  Add a screenshot to the PR showing the model file and the service usage (e.g. open `src/app/models/product.model.ts` and `product.service.ts` in your editor and attach an image).  


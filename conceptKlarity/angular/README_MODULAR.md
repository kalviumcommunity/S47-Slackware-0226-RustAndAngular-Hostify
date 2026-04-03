Modular architecture overview

Feature modules created:

- AuthModule
  - Location: `angular/auth`
  - Responsibility: authentication UI and routes (login). Declares `LoginComponent` and defines feature routes in `auth-routing.module.ts`.

- ProductsModule
  - Location: `angular/products`
  - Responsibility: product listing and feature-level routes. Declares `ProductListComponent` and imports `SharedModule` for UI components.

Core and Shared modules:

- CoreModule (`angular/core/core.module.ts`)
  - Responsibility: global singletons and app-wide providers.
  - Provides `AuthService`, `StateService`, and registers the `AuthInterceptor` once.
  - Import `CoreModule` only in `AppModule` to avoid duplicate singleton providers.

- SharedModule (`angular/shared/shared.module.ts`)
  - Responsibility: reusable presentational components like `ButtonComponent` and `CardComponent`.
  - Imported by feature modules to keep `AppModule` lightweight.

Routing & lazy loading

- `AppRoutingModule` now lazy-loads `ProductsModule` and `AuthModule` using `loadChildren` dynamic imports.
- `DashboardComponent` remains in `AppModule` and is protected by `AuthGuard` (singleton provided by services).
- Lazy loading keeps `AppModule` small and loads feature code only when needed.

Why these changes

- Feature modules group related components/services and make code ownership clearer.
- CoreModule centralizes singletons and providers to avoid accidental multiple instances.
- SharedModule prevents duplication of UI building blocks.
- Lazy-loading improves initial load performance and scales with the app.

Next steps / improvements

- Move remaining feature code (e.g., product-card) into the `products` folder for clearer file locality.
- Add unit tests for feature modules (module loading, providers, guards).
- Consider a `SharedStateModule` or ngrx for larger state management needs.

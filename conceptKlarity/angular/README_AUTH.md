This document explains how JWT authentication is implemented for the demo app.

- Token storage
  - JWT token is stored only via the `AuthService` (service located at `services/auth.service.ts`).
  - Storage backend: `localStorage` under key `auth_token` for simplicity (the service centralizes access).
  - Components must use `AuthService.isLoggedIn()` / `AuthService.getToken()` and do not touch localStorage directly.

- HTTP interceptor
  - `src/app/interceptors/auth.interceptor.ts` automatically attaches `Authorization: Bearer <token>` to outgoing requests unless the request URL ends with `/api/auth/login`.
  - The interceptor also handles `401` responses: it calls `AuthService.logout()` and redirects to `/login`.

- Route guards
  - `guards/auth.guard.ts` protects routes by consulting `AuthService.isLoggedIn()`.
  - Example: the `dashboard` route in `app-routing.module.ts` uses `canActivate: [AuthGuard]`.

- Backend validation
  - The Rust backend exposes a demo login endpoint at `/api/auth/login`.
  - Login accepts `username` / `password` and returns `{ token: "..." }` when credentials match demo values (admin/password).
  - The backend signs JWTs with an HMAC secret read from the `AUTH_SECRET` environment variable (defaults to `dev-secret-change-me`).
  - The backend protects the `GET /products-db` endpoint: it expects `Authorization: Bearer <token>` and returns `401` for missing/invalid tokens.

- How token lifecycle is handled
  - On successful login, `AuthService.login()` stores token in `localStorage` and updates an internal `BehaviorSubject` tracking authentication state.
  - If any request returns `401`, the interceptor clears the token and navigates to `/login`.
  - `AuthService.logout()` also clears the token and sets authentication state to false.

- How to test locally
  1. Start the Rust backend (from `conceptKlarity/backend`) and set optional `AUTH_SECRET` if desired.
     - Example (Linux/WSL / Powershell):

```bash
export AUTH_SECRET=some-secret
cargo run --manifest-path backend/Cargo.toml
```

  2. Start the Angular app (in a Node/LTS environment). Ensure the frontend points to `http://localhost:8080`.
  3. Open the app and attempt to navigate to `/dashboard` — unauthenticated users will be redirected to `/login`.
  4. Login with demo credentials `admin` / `password` — the app will store the token and navigate to the protected route.
  5. To simulate token expiry, you can alter the token or set an incorrect `AUTH_SECRET` on the backend; the frontend will log out and redirect on `401`.

- Notes about security and next steps
  - For production, do not store tokens in `localStorage` if XSS is a concern; prefer httpOnly cookies with proper CSRF protections.
  - Replace the demo credential check with a real user store and password hashing.
  - Use a stronger secret and rotate it securely; consider `exp` short lifetimes and refresh tokens.

- AI review improvements applied
  - Interceptor now clears tokens and redirects on `401` responses.
  - Backend implements JWT issuance and validation with `jsonwebtoken` and enforces `Authorization` on protected routes.
  - Product service uses a single `getProductsDb` method for paginated queries instead of duplicating logic.

If you want, I can add tests for the token flows or harden token storage to httpOnly cookies and implement refresh tokens next.

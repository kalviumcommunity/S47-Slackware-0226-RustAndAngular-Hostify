# Forms PR Documentation

This PR adds two form examples to the Angular scaffold:

- `TemplateFormComponent` — a template-driven form using `ngModel` and built-in validation attributes.
- `ReactiveFormComponent` — a reactive form using `FormGroup`, `FormControl`, and `Validators`.

Why both?

Template-driven forms are simple and declarative — they work well for straightforward forms and quick prototyping. Reactive forms provide explicit control over the form model, easier unit testing, and better scalability for complex validation logic.

Validation implemented

- Required fields: both approaches use `required`.
- Minimum length: the `name` field enforces `minlength=3` (template) and `Validators.minLength(3)` (reactive).
- Email format: template uses `type="email"` (Angular validates), reactive uses `Validators.email`.

Form state and submissions

- Template-driven: the component method receives an `NgForm` instance on submit. Access values with `form.value` and validity with `form.valid`.
- Reactive: the component uses `this.form.value` to access current values and `this.form.valid` to check validity; `valueChanges` and `statusChanges` are observed to react to updates.

Reusability and design

- Components are self-contained and declared in `AppModule`. They avoid hardcoded logic and expose clear interfaces (form values on submit).
- Validation rules are defined declaratively (template) or centrally in the `FormGroup` (reactive), making it easy to extract or reuse the control configuration.

How Angular tracks and updates form state

Angular's change detection system runs after DOM events; both template-driven and reactive forms update the underlying model on user input and mark controls as `dirty`, `touched`, and `pristine`. Reactive forms also expose `valueChanges` and `statusChanges` Observables for programmatic observation.

Files added

- `conceptKlarity/angular/template-form.component.*`
- `conceptKlarity/angular/reactive-form.component.*`
- `conceptKlarity/documentation.md` (this file)

Service & shared state

- **What I added:** a `StateService` located at `conceptKlarity/angular/services/state.service.ts` that acts as a single source of truth for a shared `Product[]` collection. It exposes a `BehaviorSubject` as `items$` and methods to `setItems`, `addItem`, `updateItem`, and `removeItem`.

- **Why services:** Services centralize shared data and logic so multiple components can access and update the same state without duplicating code or manually passing events/props. This follows Angular's dependency-injection pattern and keeps components focused on presentation.

- **Dependency injection:** components inject `StateService` via their constructor, e.g. `constructor(private state: StateService) {}`. Angular provides a single instance (service is `providedIn: 'root'`) so the state is shared application-wide.

- **How state is shared:** `ProductListComponent` loads items from the backend and calls `state.setItems(data)`. Other components (e.g., `DemoCliComponent`) subscribe to `state.items$` (the observable) and automatically receive updates. This demonstrates the publish/subscribe pattern using RxJS.

- **Edge cases handled:**
	- Invalid updates: `addItem` validates payloads (non-empty name, non-negative price) and returns `null` for invalid attempts — components should handle this return value.
	- Empty data state: the `BehaviorSubject` is initialized with an empty array so subscribers always receive a defined array (avoids `null` checks in templates).
	- API simulation: `simulateApiLoad(shouldFail)` demonstrates how the service can simulate an API error (returns a rejected Promise when `shouldFail` is true) and how callers can handle it.

Routing, Authentication & Guard

- **Routes (simple map):**
	- `/products` — public, `ProductListComponent` (default redirect)
	- `/login` — public, `LoginComponent` (used to sign in)
	- `/dashboard` — protected, `DashboardComponent` (requires authentication via `AuthGuard`)

- **How the guard works:**
	- `AuthGuard` implements `CanActivate`. Before navigation to a protected route the guard checks `AuthService.isLoggedIn()`.
	- If authenticated, navigation proceeds. If not, the guard returns a `UrlTree` redirecting to `/login` with a `returnUrl` query parameter so the app can navigate back after successful login.

- **How authentication state is checked:**
	- `AuthService` stores a token in `localStorage` and exposes a `BehaviorSubject` (`isLoggedIn$`) for reactive subscribers and `isLoggedIn()` for synchronous checks.
	- Components and the guard use `isLoggedIn()` or subscribe to `isLoggedIn$` to react to changes.



Run locally

```bash
cd conceptKlarity/angular
npm install
npm start    # or ng serve
```

Run tests:

```bash
ng test
```

Build:

```bash
ng build
```

If you want, I can commit these changes to a branch and open the PR, or add an Angular proxy and CORS configuration for backend integration.

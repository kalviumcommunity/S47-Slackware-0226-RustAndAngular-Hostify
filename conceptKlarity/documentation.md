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

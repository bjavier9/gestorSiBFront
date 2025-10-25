# SIP Frontend Blueprint

This blueprint documents how the brokerage management frontend is structured after the latest refactor. Follow it to keep the codebase simple, consistent, and easy to extend.

---

## 1. Product Snapshot

- **Goal**: Super administrators manage brokerage companies, their users, and offices from a focused admin area. Regular users access a lightweight dashboard.
- **Tech Stack**: Angular 17+ with standalone components, Tailwind CSS, strict TypeScript, RxJS signals and observables.
- **Entry Points**:
  - `/login` – authentication form with mock backend.
  - `/dashboard` – general user landing page.
  - `/admin/...` – super admin shell with company-centric navigation.

---

## 2. High-Level Architecture

```
src/
└── app/
    ├── app.component.{ts,html,css}  # root shell (routes only)
    ├── app.config.ts                # global providers, router, http interceptor
    ├── app.routes.ts                # route map
    ├── core/                        # cross-cutting elements
    │   ├── api/                     # endpoint builders
    │   ├── guards/                  # route guards
    │   ├── interceptors/            # http interceptors
    │   ├── models/                  # domain models
    │   └── services/                # application services
    └── features/                    # vertical slices
        ├── admin/                   # super admin area
        │   ├── layout/              # admin shell
        │   └── pages/               # company list/overview/edit/users/offices
        ├── auth/                    # login component
        ├── dashboard/               # user dashboard
        └── home/                    # redirect to appropriate area
```

- **No shared folder**: after simplification, only feature-specific components remain. Re-introduce shared modules only when multiple features require them.
- **Path aliases**: `@core/*` → `src/app/core`, `@features/*` → `src/app/features`.
- **Styling**: local component styles in CSS (no SCSS) to keep dependencies minimal.

---

## 3. Current Functional Baseline

| Area | Description |
| --- | --- |
| Authentication | `AuthService` stores session data in `localStorage`, exposes signals, and attaches bearer tokens via `authInterceptor`. |
| Navigation | Guards enforce login and super admin access. `HomeRedirectComponent` routes users to `/admin/companies` or `/dashboard`. |
| Admin Shell | `AdminShellComponent` uses a flex-based Tailwind layout (sidebar + header) with responsive typography, providing persistent navigation, primary actions, and logout controls. |
| Companies | List, overview, edit, user-create, and office-create pages rely on Tailwind utility classes and light custom CSS for skeletons, badges, and forms. Each route ships with skeleton placeholders that mirror final layouts while data loads. Forms still emit mock success messages until real APIs are wired. |
| Models | `Company` is the canonical shape. Mapping from API responses happens in `CompanyService`. |

---

## 4. Development Principles

1. **Plain English everywhere** – identifiers, comments, and UI strings use ASCII English.
2. **Single responsibility** – each file does one thing (component, service, guard, etc.).
3. **Immutable data** – treat models as readonly; avoid in-place mutation.
4. **OnPush + async pipe** – mandatory for all components.
5. **Signals where sensible** – prefer signals for local UI state, observables for async flows.
6. **No `any`** – strict typing, explicit interfaces, no implicit `any`.
7. **Tailwind-first UI** – prefer Tailwind utility classes and CSS variables; author small component styles only when utilities fall short.
8. **Skeleton-friendly loading** – long-running async views expose skeleton placeholders that match the final layout footprint while data resolves.
9. **Lightweight styling** – stick to small CSS files; avoid large global styles.
10. **Separation of concerns** – HTTP logic stays in services; components orchestrate UI only.
11. **Angular v17 control flow** – rely on `@if`, `@for`, `@switch`, `@let`, and `@defer` instead of the deprecated structural directives (`*ngIf`, `*ngFor`, etc.).
12. **Animations** � use the built-in `animate.enter` / `animate.leave` APIs; no global animation providers are required.

### 4.1 Clean Code Standards

- **File naming**: lower-kebab-case (e.g., `company-list-page.component.ts`, `auth.service.ts`).
- **Class/interface naming**: PascalCase (`CompanyService`, `LoginResult`, `Company`).
- **Functions, variables, signals**: camelCase (`loadCompanies`, `companyId`, `isSubmitting`); observables end with `$`.
- **Folder naming**: lower-kebab-case aligned with feature or concern (`company-overview`, `layout`).
- **Constants**: UPPER_SNAKE_CASE and co-locate near usage when possible.
- **Commit separation**: group meaningful changes per feature to keep history readable.
- **Comments**: add only when intent is not obvious from naming; avoid restating code.
- **Imports**: order as Angular, third-party, internal; remove unused imports during development.

---

## 5. Implementation Recipes

### 5.1 Component (page or sub-component)
1. Create `<name>.component.ts` with `standalone: true`, `changeDetection: OnPush`.
2. Compose layouts with Tailwind utility classes; keep component stylesheets for shared patterns (e.g., form-field wrappers, skeleton animations).
3. Keep templates in a separate `.html` file and styles in `.css`.
4. Use `inject(...)` instead of constructor injection.
5. Expose public readonly properties; never mutate inputs.
6. Use `trackBy` on `*ngFor` lists and `async` pipe for observables.
7. Provide skeleton loaders (`Array.from({ length: n })` helpers + shimmering CSS) for noticeable loading states; keep skeleton markup lightweight and colocated with the component.

### 5.2 Service
1. Place under `core/services`.
2. Decorate with `@Injectable({ providedIn: 'root' })`.
3. Inject dependencies using `inject()`.
4. Expose public methods returning observables or signals; no side effects in constructors.
5. When calling HTTP endpoints, centralise mapping logic (e.g., `mapCompanyFromApi`).

### 5.3 Guard
1. Create a function guard in `core/guards`.
2. Use `inject()` to access services.
3. Return boolean or `UrlTree`. Avoid side effects; rely on returning redirect trees.

### 5.4 HTTP Interceptor
1. Store under `core/interceptors`.
2. Use `HttpInterceptorFn`.
3. Keep logic minimal: guard conditions, clone requests, forward to `next()`.

### 5.5 API Endpoints
1. Export plain objects/functions from `core/api`.
2. Build URLs using `environment.apiHost`.
3. Avoid direct string concatenation inside services; call endpoint helpers instead.

### 5.6 Models
1. Define interfaces under `core/models`.
2. Use strict property names reflecting final domain shape (`Company`, `CompanyFromApi`).
3. Export DTO wrappers (`CompanyApiResponse`) when the API nests data.

### 5.7 Routes
1. Declare all routes in `app.routes.ts`.
2. Use `loadComponent` for lazily-loaded standalone components.
3. Nest admin routes under `'admin'` with `AdminShellComponent` as the host.

### 5.8 Adding a New Feature Slice
1. Create `src/app/features/<feature-name>/`.
2. Add a `pages/` folder for route-level components.
3. Bridge to `core` services or introduce new services when cross-feature reuse is needed.
4. Register routes under the appropriate parent path in `app.routes.ts`.

---

## 6. Workflow Guide

1. **Create/modify files** following the recipes above.
2. **Keep imports tidy**; rely on path aliases.
3. **Lint/build locally** with `npm run build`. Add tests when logic becomes non-trivial.
4. **Update this blueprint** whenever architectural decisions change.

---

## 7. Pending Enhancements

- Replace mock messages in admin forms with real API calls once backend contracts are defined.
- Introduce unit tests for `AuthService`, `CompanyService`, and critical admin pages.
- Add a responsive sidenav toggle in the admin shell for handset breakpoints.
- Evaluate reintroducing a shared UI/token module if multiple features demand it.

---

## 8. Quick Reference Commands

- `npm install` – install dependencies.
- `npm run start` – development server.
- `npm run build` – production build (strict type checking).
- `npm run test` – unit tests (once configured).

Stay disciplined with these guidelines to keep the SIP frontend lean, readable, and ready for production APIs.***


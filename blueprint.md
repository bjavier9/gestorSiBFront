# Blueprint SIB - Gestor Frontend

Este documento sirve como punto de referencia vivo para la estructura, alcance y plan de trabajo del proyecto SIB. El objetivo principal es ofrecer un front-end Angular facilmente mantenible que refleje la separacion de responsabilidades del dominio de negocio.

## 1. Objetivo del Sistema

- Facilitar la administracion de companias de corretaje mediante operaciones CRUD y cambio de estado.
- Ofrecer flujos diferenciados para usuarios administrativos y no administrativos a traves de rutas protegidas.
- Mantener una experiencia moderna usando Angular standalone, Signals y Angular Material con cambio de tema.

## 2. Arquitectura Actual

```
src/app/
├── core/
│   ├── api/                # Endpoints centralizados
│   ├── guards/             # authGuard, adminGuard
│   ├── interceptors/       # auth.interceptor
│   ├── models/             # Tipos compartidos (Compania, User)
│   └── services/           # AuthService, CompaniaService, ThemeService
├── features/
│   ├── admin/
│   │   ├── admin-layout/   # Shell del panel admin
│   │   ├── dashboard/      # Dashboard administrativo
│   │   └── companies/
│   │       ├── components/ # CompanyFormComponent
│   │       └── pages/      # CompaniesComponent
│   ├── auth/
│   │   └── login/          # LoginComponent
│   └── dashboard/          # DashboardComponent (usuarios generales)
└── shared/
    └── components/         # ThemeToggleComponent, ConfirmationDialogComponent
```

- Los alias `@core`, `@features` y `@shared` estan configurados en `tsconfig.json` y `tsconfig.app.json` para importar sin rutas relativas.
- `app.routes.ts` carga los features de manera lazy y aplica guards desde `@core`.
- `ThemeToggleComponent` y los dialogos viven en `shared` para promover la reutilizacion transversal.

## 3. Capas Funcionales

- **Autenticacion (`features/auth`)**: formulario reactivo, control de visibilidad de password, redireccion condicional segun rol.
- **Dashboard general (`features/dashboard`)**: bienvenida basica y accion de logout para usuarios autenticados no administradores.
- **Panel administrativo (`features/admin`)**:
  - Layout con toolbar y outlet secundario.
  - Dashboard administrativo con accesos rapidos.
  - Gestion de companias con filtrado, edicion inline via dialogo, snackbar y control de estado activo/inactivo.
- **Servicios de dominio (`core/services`)**: encapsulan llamadas HTTP y exponen observables usados por los features.

## 4. Estado de las Funcionalidades

- CRUD de companias: **implementado** (creacion, actualizacion y cambio de estado via CompaniaService).
- Seguridad: **implementada** (guards + interceptor para token).
- UI standalone y control de tema: **implementado**.
- Documentacion de la arquitectura: **actualizada** en este blueprint.

## 5. Roadmap Propuesto

1. **Dominios y contratos**
   - [ ] Extraer interfaces/ports en `core` para desacoplar `CompaniaService` de la implementacion HTTP.
2. **Documentacion tecnica**
   - [ ] Registrar flujos de autenticacion y companias (diagramas ligeros o markdown) dentro de `core`.
3. **Calidad y pruebas**
   - [ ] Agregar pruebas unitarias para `CompaniesComponent`, `CompanyFormComponent` y guards (`authGuard`, `adminGuard`).
4. **Experiencia de usuario**
   - [ ] Revisar copy y normalizar tildes (la base actual es ASCII) antes de pasar a ambientes productivos.

Este blueprint debe revisarse y actualizarse con cada iteracion relevante para mantener alineado al equipo sobre estado, alcance y proximo trabajo.

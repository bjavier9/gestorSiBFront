# Vision General del Proyecto: SIB - Sistema de Intermediacion de Seguros

Este documento resume la arquitectura, funcionalidades y el plan de desarrollo de SIB, una aplicacion web construida con Angular enfocada en la gestion de intermediarios de seguros.

## 1. Proposito y Capacidades

El sistema habilita a usuarios autenticados para administrar companias de corretaje de forma eficiente:

- **Gestion completa de companias (CRUD)**: creacion, edicion, activacion/inactivacion y consulta de registros.
- **Autenticacion diferenciada**: flujo de inicio de sesion con redireccion a dashboard publico o panel administrativo.
- **Interfaz moderna**: componentes standalone, Signals y Angular Material para mantener una UI consistente y reactiva.
- **Temas dinamicos**: interruptor de tema centralizado en ThemeService consumido por componentes compartidos.

## 2. Arquitectura Base

La aplicacion adopta una estructura por capas inspirada en DDD, organizada dentro de src/app:

- **core/**: servicios, modelos, interceptores, guards y definiciones de API reutilizables en todos los features.
- **features/**: casos de uso encapsulados por dominio funcional.
  - **admin/**: layout principal del panel, dashboard y submodulos de administracion.
    - admin-layout/: shell con toolbar y espacio para rutas hijas protegidas.
    - companies/: incluye paginas (pages/companies) y componentes especificos (components/company-form).
    - dashboard/: tarjetas de navegacion y accesos rapidos para tareas administrativas.
  - **auth/**: componentes de autenticacion como el formulario de login.
  - **dashboard/**: dashboard general para usuarios no administradores.
  - **home/**: contiene el `HomeRedirectComponent` para redirigir a los usuarios a su dashboard correspondiente.
- **shared/**: componentes reutilizables (por ejemplo, theme-toggle, confirmation-dialog) desacoplados de dominios especificos.
- **Alias de paths (@core, @shared, @features)** definidos en tsconfig.json y tsconfig.app.json para mantener imports legibles tras la reorganizacion.
- **Enrutamiento**: app.routes.ts carga lazy cada feature y aplica guards (authGuard, adminGuard) desde @core.

## 3. Funcionalidades Actuales

- **Login (/login)**: formulario reactivo con feedback de carga y manejo de errores.
- **Dashboard general (/dashboard)**: muestra saludo contextual y permite cerrar sesion.
- **Panel administrativo (/admin)**:
  - Layout persistente con toolbar, logo y salida de rutas.
  - Dashboard de administracion con accesos rapidos.
  - Gestion de companias con lista filtrable, creacion/edicion via MatDialog, y cambio de estado con dialogo de confirmacion y snackbar.
- **Redireccion Inteligente**: Un `HomeRedirectComponent` se encarga de redirigir a los usuarios a su dashboard correspondiente al recargar la pagina.
- **Servicios base**: AuthService, CompaniaService, ThemeService, HTTP interceptor para adjuntar credenciales y endpoints centralizados.

## 4. Plan de Desarrollo

### Fases anteriores (completadas)
1. **Fase 1: Estructura inicial y visualizacion**.
2. **Fase 2: Formulario de companias**.
3. **Fase 3: Cambio de estado (soft delete)**.
4. **Fase 4: Migracion a Angular Material**.
5. **Fase 5: Reorganizacion por features/core/shared y adopcion de alias de paths**.

### Fase actual: Consolidacion de dominio y pruebas (pendiente)
- [ ] Definir contratos de dominio (ports) para desacoplar CompaniaService de la infraestructura HTTP.
- [ ] Documentar casos de uso y flujos clave en core (auth y companias).
- [ ] Incorporar pruebas unitarias relevantes para componentes criticos (companies, company-form, guards).

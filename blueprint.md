# Blueprint: Gestor SIP

## Visión General

Gestor SIP es una aplicación web moderna construida con Angular que facilita la gestión de procesos y usuarios. La aplicación se integra con Firebase para la autenticación y utiliza una API propia para la lógica de negocio.

## Diseño y Estilo

*   **UI/UX:** Moderna, intuitiva y responsive.
*   **Paleta de Colores:** Por definir.
*   **Tipografía:** Por definir.
*   **Iconografía:** Por definir.

## Características Implementadas

*   **Autenticación:**
    *   Login de usuarios a través de Firebase Authentication.
    *   Verificación del token de Firebase en el backend.
    *   Manejo de sesión de usuario y roles (Super Admin).
*   **Arquitectura:**
    *   Componentes Standalone.
    *   `ChangeDetectionStrategy.OnPush` por defecto.
    *   Uso de `inject()` para la inyección de dependencias.
    *   Servicios centralizados en `src/app/core/services`.

## Plan de Desarrollo Actual

### Tarea: Centralizar la Configuración de Endpoints de la API

**Objetivo:** Eliminar las URLs hardcodeadas en los servicios y centralizarlas en un único lugar para facilitar su mantenimiento y evitar errores.

**Pasos:**

1.  **Actualizar Archivos de Entorno:**
    *   Añadir `apiHost` y `firebaseApiKey` a `src/environments/environment.ts`.
    *   Añadir `apiHost` y `firebaseApiKey` a `src/environments/environment.prod.ts`.

2.  **Crear Proveedor de Endpoints de Autenticación:**
    *   Crear la carpeta `src/app/core/api`.
    *   Crear el archivo `src/app/core/api/auth-endpoints.ts` para definir las URLs de autenticación.

3.  **Refactorizar `AuthService`:**
    *   Modificar `src/app/core/services/auth.service.ts` para que importe y utilice el nuevo proveedor de endpoints `authEndpoints`.

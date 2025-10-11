# Visión General del Proyecto: SIB - Sistema de Intermediación de Seguros

Este documento describe la arquitectura, características y plan de desarrollo para el SIB, una aplicación web moderna construida con Angular, diseñada para facilitar la gestión de intermediarios de seguros.

## 1. Propósito y Capacidades

El SIB es una plataforma intuitiva y eficiente que permite a los administradores gestionar la información crítica de las compañías de corretaje de seguros. Sus capacidades principales incluyen:

- **Gestión Completa de Compañías (CRUD):** Creación, lectura, actualización y cambio de estado (activación/desactivación) de las compañías.
- **Interfaz Reactiva y Moderna:** Construida con las últimas características de Angular (Signals, Componentes Standalone) para una experiencia de usuario fluida y un mantenimiento sencillo.
- **Diseño Profesional con Material Design:** Adopción de `@angular/material` para una interfaz de usuario consistente, accesible y estéticamente agradable.

## 2. Características Implementadas

### Módulo de Compañías (`/admin/companies`)

#### Estilo y Diseño:
- **Diseño con Angular Material:** La interfaz principal utiliza componentes como `MatToolbar`, `MatCard`, `MatButton`, `MatIcon` y `MatFabButton`.
- **Layout en Grid Responsivo:** Las compañías se muestran en un grid de tarjetas que se adapta a diferentes tamaños de pantalla.
- **Tarjetas de Compañía (`MatCard`):** Presentación semántica de la información (header, content, actions) y acciones contextuales.
- **Indicadores de Estado Visual:** Se usan `MatIcon` con colores (`primary` para activo, `warn` para inactivo) para una rápida identificación del estado.
- **Botón de Acción Flotante (`MatFabButton`):** Un FAB en la esquina inferior derecha para la acción principal de añadir una nueva compañía.

#### Funcionalidades:
1.  **Listado de Compañías (Read):** Se consume un servicio para obtener y mostrar la lista de compañías.
2.  **Creación de Compañía (Create):** Un formulario permite añadir nuevas compañías.
3.  **Edición de Compañía (Update):** El mismo formulario se reutiliza para editar datos existentes.
4.  **Cambio de Estado (Soft Delete):** Se puede activar o desactivar una compañía, en lugar de borrarla.

### Dashboard (`/admin/dashboard`)

- **Tarjeta de Navegación Personalizada:** La tarjeta para gestionar compañías muestra el logo de la empresa para una identidad de marca coherente.

## 3. Plan de Desarrollo

### Fases Anteriores (Completadas)
-   **Fase 1: Estructura y Visualización (Completada)** - Creación de la estructura base y visualización de datos.
-   **Fase 2: Creación y Edición (Completada)** - Implementación del formulario para crear y editar compañías.
-   **Fase 3: Cambio de Estado (Completada)** - Funcionalidad de borrado lógico (activar/desactivar).
-   **Fase 4: Migración a Angular Material (Completada)** - Se migró la vista principal de compañías a componentes de Material.

### Fase Actual

-   **Fase 5: Migración a `MatDialog` y Formulario Responsivo (En progreso)**
    -   [ ] **Paso 1: Refactorizar `CompaniesComponent` para usar `MatDialog`:** Se inyectará `MatDialog` y se modificará el método para abrir el formulario, eliminando la lógica del modal basado en `*ngIf`.
    -   [ ] **Paso 2: Transformar `CompanyFormComponent` para el Diálogo:** Se adaptará el componente del formulario para que funcione dentro de un diálogo de Material, utilizando `MatDialogRef` para cerrarlo y `MAT_DIALOG_DATA` para recibir datos.
    -   [ ] **Paso 3: Rediseñar Formulario con Componentes de Material:** Se reemplazarán los `<input>` y `<label>` por `<mat-form-field>`, `matInput`, `mat-slide-toggle` y `mat-dialog-actions` para un diseño totalmente responsivo y coherente.
    -   [ ] **Paso 4: Limpieza y Verificación:** Se eliminará el CSS obsoleto y se verificará que el diálogo funcione y se vea correctamente en todas las pantallas.

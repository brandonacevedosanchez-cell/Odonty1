# Navegación y módulos

## Arranque y composición

`src/main.jsx` monta `App` dentro de `React.StrictMode` y carga las hojas CSS. `src/App.jsx` envuelve la aplicación con `BrowserRouter`, `ToastProvider` y `AuthProvider`. `AppRoutes.jsx` declara las rutas; las páginas autenticadas se montan dentro de `AppLayout`.

El layout contiene:

- **Sidebar:** secciones Inicio, Administración, Módulos clínicos y Cuenta. Los enlaces se construyen desde `routes/navigation.js`; la ruta activa se marca con `NavLink`.
- **Topbar:** título según la ruta, perfil, rol y menú desplegable con configuración y cierre de sesión.
- **Contenido:** `Outlet` de React Router.
- La barra lateral se cierra al cambiar de ruta y soporta Escape/cierre por superposición.

## Rutas y guards

| Grupo | Rutas | Guard |
| --- | --- | --- |
| Pública | `/registro-clinica` | No usa guard de sesión. |
| Invitados | `/login`, `/verificar-mfa`, `/recuperar` | `GuestRoute`: si la sesión está autenticada, redirige hacia la ruta previa o inicio. |
| Autenticadas | `/cambiar-contrasena`, inicio, administración y módulos | `ProtectedRoute`: restaura sesión, envía a login si no está autenticado y fuerza el cambio de contraseña si aplica. |
| Autorizadas por permiso | `/usuarios`, `/roles`, `/usuarios/nuevo`, `/auditoria`, `/clinicas` y módulos clínicos | `RequirePermission`; `/clinicas` y todos los módulos clínicos están configurados con `strict`. |
| Ruta desconocida | `*` dentro de `AppLayout` | Muestra `NotFoundPage` dentro del área autenticada. |

`ProtectedRoute` distingue tres estados de la sesión:

- `loading`: muestra «Restaurando tu sesión…».
- `error` (red o 5xx): muestra un error con reintento y **no** cierra la sesión.
- Sin autenticación: navega a `/login` guardando la ruta solicitada en `location.state.from`.

Si `user.must_change_password` está activo, cualquier ruta distinta de `/cambiar-contrasena` redirige a esa pantalla; al completar el cambio se vuelve a `/`.

`RequirePermission` no redirige: **muestra `ForbiddenPage` en la misma URL**. La URL solo cambia cuando el usuario pulsa «Volver al inicio». Con `strict` comprueba `getPermissions(user).includes(permission)` (permisos explícitos del rol); sin `strict` usa `can(user, permission)`, que además respeta `VITE_PERMISSION_BYPASS=true` en desarrollo.

## Módulos

| Módulo | Interfaz presente | Servicios y endpoints reales |
| --- | --- | --- |
| Usuarios | Tabla, filtros, recarga, creación y diálogos de cambio de rol y estado | `GET /users`, `POST /users`, `PATCH /users/{id}`, `PATCH /users/{id}/role`, `PATCH /users/{id}/active`. En modo vista previa usa datos estáticos y bloquea escrituras. |
| Roles | Matriz de permisos, descripciones y reglas de asignación | **Sin endpoint.** Se calcula con `ROLE_PERMISSIONS`, `ROLE_DESCRIPTIONS`, `assignableRoles` y `roleChangeAccess` en `src/utils/permissions.js`. El cambio real de rol se hace desde Usuarios. |
| Auditoría | Tabla de registros y recarga | `GET /users/audit-log?limit=100`. En modo vista previa devuelve eventos de demostración. |
| Clínicas | Registro público y revisión de solicitudes con aprobación/rechazo | `POST /clinics/register` (público), `GET /clinics/pending`, `PATCH /clinics/{id}/review`. La revisión no se carga en modo vista previa. |
| Pacientes | Directorio con búsqueda y paginación, alta, ficha, alertas y edición | `GET /patients`, `GET /patients/check`, `GET /patients/{id}`, `GET /patients/{id}/alerts`, `POST /patients`, `PATCH /patients/{id}`. |
| Citas | Agenda con vistas mes/semana/día, creación, reprogramación, cancelación y cambio de estado | `GET /appointments` (filtros `scheduled_date`, `patient_id`, `dentist_id`), `POST /appointments`, `PATCH /appointments/{id}/reschedule`, `PATCH /appointments/{id}/cancel`, `PATCH /appointments/{id}/status`. Los selectores usan `GET /patients` y `GET /users`. |
| Historia clínica | Búsqueda de paciente, antecedentes, consultas y detalle paginado | `GET /patients`, `GET /appointments?patient_id=…`, `GET /clinical-history`, `GET /clinical-history/{id}`, `POST /clinical-history`. |
| Odontograma | Selección de paciente, pieza FDI, superficies, hallazgos e historial | `GET /patients`, `GET /appointments?patient_id=…`, `GET /odontogram/{patient_id}`, `GET /odontogram/{patient_id}/history`, `POST /odontogram`. Búsqueda CUPS: `GET /catalogs/cups?q=…&dental_only=false&limit=20` y detalle `GET /catalogs/cups/{code}`. |
| Facturación y pagos | Búsqueda, filtros y tabla vacía con aviso de integración | **Pendiente de integración.** No existe endpoint financiero ni llamada API; no calcula saldos y «Registrar pago» está deshabilitado. |
| Notificaciones | Filtro Todas/Sin leer, listado, detalle, marcar leída y creación | `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications`. El selector de destinatario usa `GET /users`. |

## Modo vista previa

`VITE_PREVIEW_MODE=true` solo afecta a Usuarios, Auditoría y al arranque de autenticación (`PREVIEW_USER`). Los módulos clínicos **sí** llaman a la API y requieren `VITE_API_URL` para funcionar con datos reales.

## Interacción local vs. persistencia

Algunos controles modifican estado React para la interfaz —búsqueda, pestañas, selección de diente, cambio de fecha o de periodo—. Ese estado no es persistencia por sí mismo; las operaciones que guardan datos se hacen a través de los servicios listados y solo se muestran si el rol tiene el permiso correspondiente (`patients.create`, `appointments.edit`, `clinical_history.create`, `odontogram.create`, `notifications.create`, etc.).

La única pantalla sin integración es Facturación; Roles es una matriz estática del frontend, no un módulo pendiente de API.

## Diagramas de navegación

Los diagramas se generan desde el código con Archify y se guardan en [`docs/diagramas/`](../docs/diagramas/):

- `navegacion-odonty.workflow.html`: mapa general (acceso público, sesión y secciones).
- `guards-y-excepciones.workflow.html`: sesión, permisos, cambio forzado, cierre de sesión, acceso denegado y 404.
- `navegacion-odonty-resumen.workflow.html`: versión corta para diapositivas (también en `docs/diagramas/export/` como PNG y PDF).
- `acceso-*.workflow.html`: login, recuperación, registro de clínica y cambio de contraseña.
- `administracion-*.workflow.html`: usuarios, roles, auditoría y clínicas.
- `pacientes`, `citas`, `historia-clinica`, `odontograma`, `facturacion` y `notificaciones`: flujo de cada módulo con sus endpoints.

Para regenerarlos consulta [`docs/diagramas/README.md`](../docs/diagramas/README.md).

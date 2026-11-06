# Navegación y módulos

## Arranque y composición

`src/main.jsx` monta `App` dentro de `React.StrictMode` y carga las seis hojas CSS. `src/App.jsx` envuelve la aplicación con `BrowserRouter`, `ToastProvider` y `AuthProvider`. `AppRoutes.jsx` declara las rutas; las páginas autenticadas se montan dentro de `AppLayout`.

El layout contiene:

- **Sidebar:** secciones Inicio, Administración, Módulos clínicos y Cuenta. Los enlaces se construyen desde `routes/navigation.js`; la ruta activa se marca con `NavLink`.
- **Topbar:** título según la ruta, perfil, rol y menú desplegable con configuración y cierre de sesión.
- **Contenido:** `Outlet` de React Router. En el modo actual se muestra un aviso de vista previa de solo lectura.
- La barra lateral se cierra al cambiar de ruta y soporta Escape/cierre por superposición.

## Rutas y guards

| Grupo | Rutas | Guard |
| --- | --- | --- |
| Pública | `/registro-clinica` | No usa guard de sesión. |
| Invitados | `/login`, `/verificar-mfa` | `GuestRoute`: si la sesión está autenticada, redirige hacia la ruta previa o inicio. |
| Autenticadas | `/cambiar-contrasena`, inicio, administración y módulos | `ProtectedRoute`: restaura sesión, envía a login si no está autenticado y fuerza el cambio de contraseña si aplica. |
| Autorizadas por permiso | `/usuarios`, `/roles`, `/usuarios/nuevo`, `/auditoria`, `/clinicas` y módulos clínicos | `RequirePermission`; algunas rutas están configuradas con `strict`. |
| Ruta desconocida | `*` dentro de `AppLayout` | Muestra `NotFoundPage` dentro del área autenticada. |

Si la restauración de la sesión no puede comunicarse con el backend, el guard muestra un error con opción de reintento, en vez de asumir automáticamente que la sesión expiró.

## Módulos

| Módulo | Interfaz presente | Datos y operaciones |
| --- | --- | --- |
| Usuarios | Tabla, filtro local, recarga, creación y diálogo de cambio de rol | Hay servicios HTTP; el modo previo muestra datos estáticos e impide escritura. |
| Roles | Matriz fija, descripciones y reglas de asignación | No consulta un endpoint de permisos. |
| Auditoría | Tabla de registros y recarga | Hay servicio HTTP; en modo previo devuelve eventos de demostración. |
| Clínicas | Registro público y vista de solicitudes pendientes con aprobación/rechazo | Hay servicios y validaciones; revisión no se carga en modo previo. |
| Pacientes | Directorio y formulario visual | Sin petición API ni escritura. |
| Citas | Calendario de fecha local, vistas mes/semana/día y formulario | Sin eventos ni API; los selectores de catálogos están deshabilitados. |
| Historia clínica | Búsqueda de paciente y pestañas de datos personales, antecedentes/alergias y consultas/evolución | No consulta ni presenta información médica real. |
| Odontograma | Alternancia entre dentición y arcadas, selección de pieza numerada FDI | Solo interacción visual; no hay diagnóstico ni almacenamiento. |
| Facturación y pagos | Búsqueda, filtros representativos, tabla y detalle vacíos | Sin cálculo financiero ni API; registrar pago está deshabilitado. |
| Notificaciones | Filtro Todas/Sin leer y panel de detalle | Sin datos ni API; el indicador de no leídas no está disponible. |

## Interacción local vs. persistencia

Algunos controles modifican estado React para mostrar una interfaz —por ejemplo, búsqueda de pacientes, selección de diente, cambio de fecha o pestaña clínica—. Eso no es persistencia y no realiza una consulta al servidor. En particular, los formularios clínicos no tienen `onSubmit` ni servicio; sus botones de guardado están deshabilitados.

## Observación sobre textos de estado

`HomePage` muestra una tarjeta con el texto «Conectado al backend de Odonty» para usuarios/roles. Sin embargo, el modo vista previa activo sustituye los usuarios/auditoría por muestras, autentica con el usuario fijo y desactiva solicitudes de algunas operaciones. El texto es por ello una etiqueta de interfaz, no evidencia de conexión en la ejecución actual.

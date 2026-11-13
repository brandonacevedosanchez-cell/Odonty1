# Páginas, vistas y componentes

## Páginas y vistas

| Vista | Ruta registrada | Descripción y estado |
| --- | --- | --- |
| Registro de clínica | `/registro-clinica` | Formulario público con tres PDF obligatorios, validación de tipo/tamaño y solicitud multipart. PARCIAL. |
| Inicio de sesión | `/login` | Correo y contraseña, errores y MFA opcional; usa la API cuando `VITE_PREVIEW_MODE` está desactivado. PARCIAL. |
| Verificación MFA | `/verificar-mfa` | Captura código de seis dígitos si existe un token MFA pendiente. PARCIAL. |
| Cambio obligatorio de contraseña | `/cambiar-contrasena` | Vista autenticada independiente, protegida por `must_change_password`. PARCIAL. |
| Inicio | `/` | Saludo, rol, accesos rápidos y módulos disponibles. En modo vista previa usa el usuario demo. PARCIAL. |
| Usuarios | `/usuarios` | Lista, búsqueda en cliente, recarga y cambio de rol. La vista previa muestra datos estáticos y desactiva cambios. PARCIAL. |
| Crear trabajador | `/usuarios/nuevo` | Formulario de alta si se desactiva la vista previa; esta ruta muestra solo una explicación en el modo actual. PARCIAL. |
| Roles y permisos | `/roles` | Matriz estática de los roles asignables; no carga matriz desde API. PARCIAL. |
| Auditoría | `/auditoria` | Tabla de eventos; en vista previa usa registros de ejemplo. PARCIAL. |
| Revisión de clínicas | `/clinicas` | Solicitudes pendientes con enlaces privados a cédula, RUT y Cámara de Comercio; aprobación/rechazo. PARCIAL. |
| Pacientes | `/pacientes` | Directorio, alta por documento, consulta y edición; muestra minoría de edad y alertas. PARCIAL. |
| Citas y agenda | `/citas` | Calendario conectado con servicios de citas, sujeto a permisos y disponibilidad del backend. PARCIAL. |
| Historia clínica | `/historia-clinica` | Consulta por paciente y registro de evolución; muestra alerta médica antes de atender. PARCIAL. |
| Odontograma | `/odontograma` | Piezas FDI, registro de hallazgos y buscador CUPS con descripción oficial; muestra alerta médica. PARCIAL. |
| Facturación y pagos | `/facturacion` | Tabla vacía, filtros deshabilitados y acción de registrar pago deshabilitada. PARCIAL. |
| Notificaciones | `/notificaciones` | Lista notificaciones paginadas y permite marcarlas como leídas. PARCIAL. |
| Configuración de cuenta | `/configuracion` | Muestra datos de la sesión; edición de perfil no existe y el cambio de contraseña está oculto por el modo previo. PARCIAL. |
| Acceso denegado | Vista de guard | Mensaje y regreso al inicio. IMPLEMENTADA. |
| No encontrado | `*` dentro del layout autenticado | Mensaje para rutas desconocidas del área autenticada. IMPLEMENTADA. |

## Componentes reutilizables

| Componente | Responsabilidad |
| --- | --- |
| `AuthShell` | Presentación común de pantallas de autenticación. |
| `FormField`, `TextField`, `SelectField`, `PasswordField` | Etiquetas, errores y entradas reutilizables; el campo de contraseña agrega control de mostrar/ocultar. |
| `ChangePasswordForm` | Formulario compartido entre cambio de contraseña forzado y configuración. |
| `ConfirmDialog` | Diálogo modal con foco, Escape, bloqueo de scroll y confirmación. |
| `Alert`, `Spinner`, `LoadingState`, `ErrorState`, `EmptyState` | Estados de interfaz y mensajes accesibles. |
| `RoleBadge`, `StatusBadge`, `PasswordBadge` | Indicadores visuales de rol, estado de cuenta y cambio de contraseña requerido. |
| `Icon`, `Logo`, `PageHeader` | Iconos SVG propios, marca y encabezado de página. |
| `ModuleApiNotice` | Aviso reutilizable de API pendiente en vistas clínicas. |
| `UsersTable`, `ChangeRoleDialog`, `ClinicStatusBadge` | Componentes específicos para tabla/cambio de roles y estado de clínicas. |
| `AppLayout`, `Sidebar`, `Topbar` | Marco autenticado, navegación lateral y perfil/barra superior. |

## Proveedores y hooks

- `AuthProvider` expone estado de sesión, inicio/cierre de sesión, MFA, actualización de contraseña y reintento de restauración.
- `ToastProvider` muestra mensajes temporales de éxito, error e información.
- `useAsync` gestiona carga, resultado, error y recargas, incluida recarga silenciosa.
- `usePermissions` expone helpers de roles/permisos del usuario.
- `useSlowLoading` presenta aviso cuando una operación excede el umbral implementado.

## Alcance comprobable

La integración de servicios no demuestra que el backend de producción sea alcanzable. La URL se configura con `VITE_API_URL`; `docs/openapi.json` es un catálogo histórico y no se consulta en tiempo de ejecución.

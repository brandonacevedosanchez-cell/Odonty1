# Roles y permisos en el frontend

## Roles representados

`src/utils/permissions.js` define cinco roles:

| Código | Etiqueta |
| --- | --- |
| `super_admin` | Superadministrador |
| `admin` | Administrador |
| `odontologo` | Odontólogo |
| `recepcionista` | Recepcionista |
| `usuario` | Usuario |

También declara permisos de usuarios (`users.view`, `users.create`, `users.manage_role`), auditoría (`audit.view`), revisión de clínicas (`clinics.review`) y módulos clínicos/administrativos (`patients.view`, `appointments.view`, `clinical_history.view`, `odontogram.view`, `billing.view`, `notifications.view`).

## Matriz codificada

Esta tabla resume los arreglos `ROLE_PERMISSIONS` que presenta la interfaz. Es una representación estática del frontend; no prueba que el backend aplique las mismas reglas.

| Rol | Permisos incluidos en `ROLE_PERMISSIONS` |
| --- | --- |
| Superadministrador | Usuarios: ver/crear/cambiar rol; auditoría; revisión de clínicas; los seis módulos clínicos. |
| Administrador | Usuarios: ver/crear/cambiar rol; los seis módulos clínicos. No incluye auditoría ni revisión de clínicas. |
| Odontólogo | Pacientes, citas, historia clínica y odontograma. |
| Recepcionista | Pacientes, citas y facturación. |
| Usuario | Notificaciones. |

Las restricciones adicionales de roles también están codificadas en el cliente: no cambiar el propio rol, no modificar al superadministrador, los administradores no modifican a otros administradores, y las opciones asignables varían según el actor. En el código, solo `super_admin` puede asignar `admin`; `admin` puede asignar odontólogo, recepcionista y usuario.

## Qué controles son efectivos en el cliente

- `ProtectedRoute` requiere sesión (salvo que la sesión de preview ya arranque autenticada) y fuerza la página de contraseña si el usuario lleva `must_change_password`.
- `RequirePermission` usa `getPermissions(user)` cuando recibe `strict`.
- Clínicas está declarada con `strict`; las seis rutas clínicas también usan `strict`.
- Usuarios, roles, creación de usuario y auditoría usan el permiso no estricto, comprobado por `can()`.
- La barra lateral y el inicio filtran algunos enlaces usando `can()` o la matriz estática.
- Los botones de cambio de rol consideran actor, usuario objetivo y roles asignables. El servidor sigue siendo quien puede aceptar/rechazar una solicitud.

## Bypass activo y efecto

`FRONTEND_PERMISSION_BYPASS` está fijado a `true` dentro de `permissions.js`. Para un usuario autenticado, `can()` concede los permisos conocidos. Por ello, las rutas no estrictas y elementos que se basan en `can()` no son una barrera efectiva por rol en esta configuración. Las rutas marcadas `strict` comparan directamente con la matriz estática, sin usar el bypass.

En la vista previa, además, el usuario está fijado como `super_admin`, por lo que la experiencia inicial no permite comprobar el comportamiento de otros roles.

## Interpretación de seguridad

Los guards y las reglas de `permissions.js` son controles de interfaz, no autorización confiable. No se debe inferir permiso real de acceso a datos a partir de que se oculte un enlace, aparezca una matriz o un usuario pueda abrir una pantalla. El backend debe validar cada operación y la correspondencia final de roles/permisos queda **PENDIENTE DE CONFIRMAR CON BACKEND**.

## Matriz informativa vs. autorización conectada

`RolesPage` renderiza la matriz estática y no solicita configuración de permisos al servidor. El código de autenticación/usuarios sí incluye servicios con permisos indicados en comentarios, pero no se halló un endpoint de lectura de la matriz. Los permisos clínicos son descritos por el código como propuesta del frontend, no como contrato confirmado.

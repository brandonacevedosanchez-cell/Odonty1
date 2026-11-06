# Integración con API

## Configuración y transporte

- `src/config/env.js` lee `VITE_API_URL`; si no se define, usa `https://odontyoriginal-1.onrender.com`. Se eliminan barras finales.
- `.env.example` contiene esa misma URL base. Para cambiarla localmente, usar un `.env` local con `VITE_API_URL=...`.
- `apiClient.js` usa `fetch`, agrega `Accept: application/json`, serializa objetos como JSON y usa `FormData` directamente para multipart.
- Para rutas autenticadas agrega un token Bearer desde `tokenStorage.js`.
- El timeout de solicitud está fijado en 90 segundos. Los errores se convierten en `ApiError`; la capa distingue red/timeout, errores HTTP y validaciones 422.
- Para HTTP 204 devuelve `null`. Los errores 422 se convierten en mensajes por campo a partir de `detail[].loc/msg/type`.
- Ante 401 intenta renovar la sesión y repetir una vez la llamada. Las renovaciones paralelas comparten la misma promesa para evitar reutilizar simultáneamente un refresh rotatorio.
- Las respuestas de red, CORS y timeout tienen estado interno 0 y no se tratan como rechazo definitivo de autenticación. Fallos definitivos al renovar limpian tokens y notifican expiración.

## Endpoints llamados por el código

Las rutas siguientes se encontraron en servicios. Los nombres de campos reflejan lo que el frontend envía o lee; las estructuras que no aparecen completamente definidas deben **PENDIENTE DE CONFIRMAR CON BACKEND**.

| Método y ruta | Autenticación en cliente | Propósito | Parámetros / cuerpo visible | Respuesta que usa el frontend |
| --- | --- | --- | --- | --- |
| `POST /auth/login` | Pública (`auth: false`) | Iniciar sesión. | JSON `{ email, password }`. | Si `mfa_required` y `mfa_token` están presentes, continúa a MFA; de lo contrario entrega tokens. Forma exacta: PENDIENTE DE CONFIRMAR CON BACKEND. |
| `POST /auth/mfa/verify` | Pública | Completar MFA. | JSON `{ mfa_token, code }`; el código ingresado debe tener seis dígitos. | Par de tokens (`access_token`, `refresh_token`) esperado por `tokenStorage`. Confirmar con backend. |
| `GET /auth/me` | Protegida | Obtener usuario actual/restaurar sesión. | Sin cuerpo. | El cliente lee `id`, `full_name`, `email`, `document_number`, `phone_number`, `role_name`, `is_active`, `must_change_password`; confirmar contrato exacto. |
| `POST /auth/refresh` | Llamada de transporte sin Bearer explícito | Renovar y rotar tokens. | JSON `{ refresh_token }`. | Lee `access_token`; guarda también `refresh_token` si se devuelve. Confirmar esquema. |
| `POST /auth/logout` | Pública; incluye token en cuerpo si existe | Solicitar cierre de sesión. | JSON `{ refresh_token }`. | El servicio documenta respuesta 204; limpia tokens locales aun si el servidor falla. |
| `POST /auth/change-password` | Protegida | Cambiar contraseña. | JSON `{ current_password, new_password }`. | El servicio documenta 204; limpia tokens y vuelve a login. |
| `GET /users` | Protegida | Listar usuarios. | Sin query visible. | Se espera un arreglo. El frontend usa `id`, `full_name`, `email`, `document_number`, `phone_number`, `role_name`, `is_active`, `must_change_password`; paginación: no se implementa en el cliente. |
| `POST /users` | Protegida | Crear trabajador. | JSON `{ email, document_number, full_name, phone_number, role }`. No envía contraseña. | El cliente muestra éxito y espera que se envíe contraseña temporal por correo; confirmar con backend. |
| `PATCH /users/{id}/role` | Protegida | Cambiar rol. | `id` se codifica como segmento de URL; JSON `{ role }`. | Si la respuesta es un objeto con mismo `id`, se usa para actualizar localmente; de otro modo se aplica el rol pedido y se recarga la lista. Esquema: PENDIENTE DE CONFIRMAR CON BACKEND. |
| `GET /users/audit-log?limit=100` | Protegida | Consultar auditoría, máximo solicitado 100. | Query `limit`, valor numérico; predeterminado 100. | Arreglo con campos leídos `id`, `user_id`, `action`, `detail`, `created_at`; confirmar contrato. |
| `POST /clinics/register` | Pública (`auth: false`) | Enviar una solicitud de registro de clínica. | `multipart/form-data`: `clinic_name`, `nit`, `nit_dv`, `email`, `document_number`, `full_name`, `phone_number`, `password`, `cedula_file`, `rut_file`. | Se lee `detail` en éxito; esquema completo: PENDIENTE DE CONFIRMAR CON BACKEND. |
| `GET /clinics/pending` | Protegida | Listar solicitudes pendientes de revisión. | Sin query visible. | El typedef frontend `ClinicOut` indica `{ id, name, nit, status, cedula_url, rut_url }`; confirmar tipos y respuesta. |
| `PATCH /clinics/{id}/review` | Protegida | Aprobar o rechazar clínica. | `id` codificado en URL; JSON `{ approve: boolean }`. | Se usa opcionalmente `name` del resultado; esquema completo: PENDIENTE DE CONFIRMAR CON BACKEND. |

## Datos de formulario multipart

Los archivos de cédula y RUT deben ser JPG/JPEG, PNG o WEBP, no vacíos y de hasta 5 MB cada uno según la validación del frontend. La rutina de cliente no fija manualmente `Content-Type` para que el navegador genere el boundary multipart.

## Modo de vista previa: importante

`PREVIEW_MODE` está en `true`:

- `AuthContext` inicia con un usuario demo y no invoca login, MFA, restauración de usuario, logout ni cambio de contraseña.
- `usersService` devuelve usuarios/eventos fijos para listados, y rechaza creación/cambio de rol.
- `ClinicsPage` omite su carga inicial. En cambio, `/registro-clinica` llama directamente a `registerClinic` y no consulta `PREVIEW_MODE`; visitar esa ruta sí puede enviar una solicitud al backend.
- Por esto, que exista una función `request(...)` no significa que se ejecute en la experiencia actual.

## Endpoints mencionados, pero no consumidos

El `README.md` del proyecto menciona recuperación de contraseña y configuración de MFA como pendientes, pero no se encontraron funciones frontend que llamen a esos endpoints. No se documentan aquí como integraciones implementadas. Contratos y disponibilidad: **PENDIENTE DE CONFIRMAR CON BACKEND**.

## CORS y despliegue

El frontend solo puede acceder al servidor si este permite su origen mediante CORS. La lista concreta de orígenes permitidos no está en este código. **PENDIENTE DE CONFIRMAR CON BACKEND**.

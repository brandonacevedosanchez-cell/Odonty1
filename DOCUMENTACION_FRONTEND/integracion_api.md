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

Las rutas siguientes se encontraron en servicios. Para pacientes, citas, historia clínica, odontograma, notificaciones y usuarios, los campos y restricciones se contrastaron con `docs/openapi.json`, que es la fuente de verdad del backend. Los pendientes indicados al final aplican solo a datos que el contrato realmente no define.

| Método y ruta | Autenticación en cliente | Propósito | Parámetros / cuerpo visible | Respuesta que usa el frontend |
| --- | --- | --- | --- | --- |
| `POST /auth/login` | Pública (`auth: false`) | Iniciar sesión. | JSON `{ email, password }`. | Si `mfa_required` y `mfa_token` están presentes, continúa a MFA; de lo contrario entrega tokens. Forma exacta: PENDIENTE DE CONFIRMAR CON BACKEND. |
| `POST /auth/mfa/verify` | Pública | Completar MFA. | JSON `{ mfa_token, code }`; el código ingresado debe tener seis dígitos. | Par de tokens (`access_token`, `refresh_token`) esperado por `tokenStorage`. Confirmar con backend. |
| `GET /auth/me` | Protegida | Obtener usuario actual/restaurar sesión. | Sin cuerpo. | El cliente lee `id`, `full_name`, `email`, `document_number`, `phone_number`, `role_name`, `is_active`, `must_change_password`; confirmar contrato exacto. |
| `POST /auth/refresh` | Llamada de transporte sin Bearer explícito | Renovar y rotar tokens. | JSON `{ refresh_token }`. | Lee `access_token`; guarda también `refresh_token` si se devuelve. Confirmar esquema. |
| `POST /auth/logout` | Pública; incluye token en cuerpo si existe | Solicitar cierre de sesión. | JSON `{ refresh_token }`. | El servicio documenta respuesta 204; limpia tokens locales aun si el servidor falla. |
| `POST /auth/change-password` | Protegida | Cambiar contraseña. | JSON `{ current_password, new_password }`. | El servicio documenta 204; limpia tokens y vuelve a login. |
| `GET /users` | Protegida | Listar usuarios. | Query `search`, `role`, `is_active`, `limit` (1–200), `offset` (≥0). | Respuesta de usuario con `id`, `full_name`, `email`, `document_number`, `phone_number`, `role_name`, `is_active`, `must_change_password`; el cliente lee el total de `X-Total-Count`. |
| `POST /users` | Protegida | Crear trabajador. | JSON `{ email, document_number, full_name, phone_number, role }`; `full_name` de 3–150 caracteres; rol `admin`, `odontologo`, `recepcionista` o `usuario`. No envía contraseña. | `UserOut`. |
| `PATCH /users/{id}` | Protegida | Actualizar datos de usuario. | Campos opcionales `email`, `phone_number`, `full_name`; el cliente envía solo estos campos y usa `null` para limpiar valores vacíos. | `UserOut`. |
| `PATCH /users/{id}/role` | Protegida | Cambiar rol. | `id` en URL; JSON `{ role }`; roles permitidos: `admin`, `odontologo`, `recepcionista`, `usuario` (nunca `super_admin`). | `UserOut`. |
| `PATCH /users/{id}/active` | Protegida | Activar o desactivar usuario. | `id` en URL; JSON `{ is_active }`. | `UserOut`. |
| `GET /users/audit-log?limit=100` | Protegida | Consultar auditoría, máximo solicitado 100. | Query `limit`, valor numérico; predeterminado 100. | Arreglo con campos leídos `id`, `user_id`, `action`, `detail`, `created_at`; confirmar contrato. |
| `POST /clinics/register` | Pública (`auth: false`) | Enviar una solicitud de registro de clínica. | `multipart/form-data`: `clinic_name`, `nit`, `nit_dv`, `email`, `document_number`, `full_name`, `phone_number`, `password`, `cedula_file`, `rut_file`. | Se lee `detail` en éxito; esquema completo: PENDIENTE DE CONFIRMAR CON BACKEND. |
| `GET /clinics/pending` | Protegida | Listar solicitudes pendientes de revisión. | Sin query visible. | El typedef frontend `ClinicOut` indica `{ id, name, nit, status, cedula_url, rut_url }`; confirmar tipos y respuesta. |
| `PATCH /clinics/{id}/review` | Protegida | Aprobar o rechazar clínica. | `id` codificado en URL; JSON `{ approve: boolean }`. | Se usa opcionalmente `name` del resultado; esquema completo: PENDIENTE DE CONFIRMAR CON BACKEND. |

## Módulos clínicos conectados según el catálogo

Las rutas de esta sección están documentadas en el catálogo y el frontend las llama desde las páginas correspondientes. Los request/response siguen los modelos de `docs/openapi.json`.

| Módulo | Método y ruta | Uso en el frontend | Query/body usado por el cliente | Contrato por confirmar |
| --- | --- | --- | --- | --- |
| Pacientes | `GET /patients` | Buscar y paginar pacientes; usa `X-Total-Count`. | Query `search`, `limit` (1–200), `offset` (≥0). | `PatientOut[]`. |
| Pacientes | `GET /patients/check` | Comprobar si existe el usuario antes de registrarlo. | Query `email`, `document_number`. | El catálogo confirma esos parámetros y describe `PatientCheckOut`. |
| Pacientes | `GET /patients/{patient_id}` | Cargar detalle para edición. | `patient_id` en la ruta. | El catálogo confirma la operación. |
| Pacientes | `POST /patients` | Registrar paciente desde el módulo. | `PatientRegisterIn`: requiere `email`, `document_number` (6–10 dígitos), `full_name` (3–150) y `phone_number`; `document_type` es `TI`, `CC`, `CE` o `PA`; `blood_type` cumple `^(O|A|B|AB)[+-]$`; incluye los campos clínicos opcionales del esquema. | `PatientOut`. |
| Pacientes | `PATCH /patients/{patient_id}` | Editar datos de paciente. | `PatientUpdateIn`: solo campos clínicos; no incluye email, nombre, documento ni teléfono. Los campos vacíos se envían como `null`. | `PatientOut`. |
| Pacientes | `POST/GET/PATCH /patients/me` | Crear, consultar y editar el perfil propio. | `PatientCreateIn`/`PatientUpdateIn` contienen campos clínicos únicamente; no enviar documento ni teléfono. | `PatientOut`. |
| Citas | `GET /appointments` | Cargar agenda y citas asociadas a un paciente. | Query opcional `scheduled_date`, `dentist_id`, `patient_id`. | El catálogo confirma filtros y respuesta `list[AppointmentOut]`; no anuncia `X-Total-Count`. |
| Citas | `POST /appointments` | Crear cita. | Requiere `patient_id`, `dentist_id`, `scheduled_date`, `start_time`, `end_time`, `reason` (mínimo 3); `origin` opcional: `presencial`, `llamada` o `whatsapp` (default `presencial`). | `AppointmentOut`. |
| Citas | `PATCH /appointments/{appointment_id}/reschedule` | Reprogramar una cita. | Requiere `scheduled_date`, `start_time`, `end_time`; no usa duración. | `AppointmentOut`. |
| Citas | `PATCH /appointments/{appointment_id}/cancel` | Cancelar una cita. | JSON `{ cancellation_reason }`; mínimo 3 caracteres. | `AppointmentOut`. |
| Citas | `PATCH /appointments/{appointment_id}/status` | Cambiar estado. | JSON `{ status }`; valores aceptados: `confirmada`, `atendida`, `no_asistio`. | `AppointmentOut`. El contrato no define el enum de `AppointmentOut.status`. |
| Historia clínica | `GET /clinical-history` | Consultar historia paginada por paciente; usa `X-Total-Count`. | Query obligatoria `patient_id`, `limit` (1–200), `offset` (≥0). | `ClinicalEntryOut[]`. |
| Historia clínica | `GET /clinical-history/{entry_id}` | Consultar el detalle de una entrada. | `entry_id` en la ruta. | El catálogo confirma la operación. |
| Historia clínica | `POST /clinical-history` | Registrar consulta asociada a una cita. | Requiere `appointment_id`, `motivo_consulta`, `examen`, `diagnostico`, `tratamiento`; cada texto obligatorio tiene mínimo 3 caracteres. `antecedentes` es opcional. No envía `patient_id`. | `ClinicalEntryOut`. |
| Historia clínica | `GET /clinical-history/me` | Consultar la historia del propio paciente. | Sin query ni body. | El catálogo confirma la operación. |
| Odontograma | `GET /odontogram/{patient_id}` | Cargar el estado actual. | `patient_id` en la ruta. | El catálogo confirma la operación. |
| Odontograma | `GET /odontogram/{patient_id}/history` | Consultar historial paginado; usa `X-Total-Count`. | Query opcional `tooth_fdi`, `limit` (1–200), `offset` (≥0). | `OdontogramEntryOut[]`. |
| Odontograma | `POST /odontogram` | Registrar un hallazgo por cita, diente y superficie. | Requiere `appointment_id`, `tooth_fdi`; `surface` nullable (`vestibular`, `lingual_palatino`, `mesial`, `distal`, `oclusal`), `null` representa el diente completo. `condition_code`, `procedure_code` y `notes` son opcionales. | `OdontogramEntryOut`. El contrato no publica catálogos para los códigos; el frontend los mantiene como texto libre (TODO). |
| Notificaciones | `GET /notifications` | Listar notificaciones; usa `X-Total-Count`. | Query `unread_only`, `limit` (1–200), `offset` (≥0). | `NotificationOut[]`. |
| Notificaciones | `PATCH /notifications/{notification_id}/read` | Marcar una notificación como leída. | `notification_id` en la ruta; sin body. | El catálogo confirma la operación. |
| Notificaciones | `POST /notifications` | Crear notificación. | Requiere `user_id`, `type` (texto libre, 2–40), `title` (3–150), `message` (mínimo 3); `appointment_id` y `patient_id` opcionales. | `NotificationOut`. |

### Errores de validación

Las respuestas FastAPI `422` con `detail: [{ loc, msg, type }]` se convierten en mensajes junto al campo identificado por `loc` en los formularios de estos módulos. Los campos obligatorios y límites del cliente se derivan de `docs/openapi.json`; la API sigue siendo la autoridad de validación.

### Pendientes confirmados en el contrato

- `AppointmentOut.status` no publica un enum de valores; la interfaz muestra valores desconocidos tal como los recibe.
- El contrato no define catálogos para `condition_code` ni `procedure_code`; se mantienen como texto libre hasta confirmación del backend.
- No existe ruta de facturación ni de pagos en `docs/openapi.json`; el aviso de ese módulo se conserva.

## Datos de formulario multipart

Los archivos de cédula y RUT deben ser JPG/JPEG, PNG o WEBP, no vacíos y de hasta 5 MB cada uno según la validación del frontend. La rutina de cliente no fija manualmente `Content-Type` para que el navegador genere el boundary multipart.

## Modo de vista previa: importante

`PREVIEW_MODE` se activa únicamente cuando `VITE_PREVIEW_MODE=true`; `.env.example` lo deja en `false`. En modo preview:

- `AuthContext` inicia con un usuario demo y no invoca login, MFA ni restauración de usuario.
- `usersService` devuelve usuarios/eventos fijos para listados, y rechaza creación/cambio de rol.
- `ClinicsPage` omite su carga inicial. En cambio, `/registro-clinica` llama directamente a `registerClinic` y no consulta `PREVIEW_MODE`; visitar esa ruta sí puede enviar una solicitud al backend.
- Las páginas clínicas siguen usando sus servicios reales, pero las rutas protegidas necesitan un token Bearer. El usuario demo no tiene sesión/token; para probar los endpoints hay que usar `VITE_PREVIEW_MODE=false`, iniciar sesión y tener los permisos correspondientes.

## Otros endpoints de autenticación

El cliente también incluye llamadas a `POST /auth/forgot-password`, `POST /auth/reset-password` y a `POST /auth/mfa/setup`, `/auth/mfa/enable` y `/auth/mfa/disable`. Los campos de request están definidos en `authService.js`; validar los esquemas y respuestas con el contrato/OpenAPI del backend.

## CORS y despliegue

El frontend solo puede acceder al servidor si este permite su origen mediante CORS. La lista concreta de orígenes permitidos no está en este código. **PENDIENTE DE CONFIRMAR CON BACKEND**.

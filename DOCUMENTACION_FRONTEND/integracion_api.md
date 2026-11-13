# Integración con la API

Este documento describe la integración del frontend con el contrato **Odonty API del 13 de noviembre de 2026**
(44 endpoints). El archivo `docs/openapi.json` se conserva únicamente como referencia histórica: no es la fuente
de verdad del contrato actual y la aplicación **no** consulta `/docs`, `/redoc` ni `/openapi.json` en ejecución.

## Configuración y transporte

- `src/config/env.js` lee `VITE_API_URL` y elimina las barras finales. Es obligatorio definirla: localmente se usa
  `http://localhost:8000` en `.env` y en producción `https://odontyoriginal-1.onrender.com` en el entorno de
  despliegue; ninguna URL base está embebida como fallback de la aplicación.
- `.env.example` ofrece la configuración local. La variable se incrusta en el bundle **al compilar**, no al ejecutar.
  Si falta, las solicitudes muestran un error explícito de configuración.
- `src/services/apiClient.js` usa `fetch`, envía `Accept: application/json` y serializa objetos como JSON.
  Para multipart usa `FormData` directamente, sin fijar `Content-Type`, para que el navegador genere el boundary.
- Las rutas protegidas agregan `Authorization: Bearer <access_token>` desde `tokenStorage.js`.
- El timeout de solicitud es de 90 segundos (el plan gratuito del backend puede tardar en despertar).
- HTTP 204 devuelve `null`. Los listados usan `requestPaginated`, que devuelve `{ data, total }` y lee
  `X-Total-Count`; si el encabezado no llega, `total` es `null`.
- Ante 401 se intenta `POST /auth/refresh` una sola vez y se reintenta la solicitud una sola vez. Las renovaciones
  simultáneas comparten la misma promesa porque el refresh token rota en cada uso.
- Un error de red, CORS o timeout se representa con estado interno `0` y **no** cierra la sesión. Solo un rechazo
  explícito del refresh (400, 401, 403 o 422) la cierra.
- Un `403` con `detail` objeto `{ code: "PASSWORD_CHANGE_REQUIRED" }` activa la pantalla de cambio obligatorio.
- Los errores `422` (`detail` como lista con `loc`, `msg`, `type`) se convierten en mensajes por campo. El resto
  de errores usa `detail` como texto.

## Roles y autorización

Roles del contrato: `super_admin` (plataforma, sin clínica), `admin`, `odontologo` y `recepcionista`.
Los pacientes **no son usuarios**: no tienen cuenta, contraseña ni login. El frontend ya no ofrece el rol
`usuario`, aunque el contrato todavía lo acepte en `UserCreateIn` por compatibilidad.

El aislamiento por clínica lo aplica el backend: un usuario que no es `super_admin` solo ve datos de su clínica y
un recurso de otra clínica responde 404. Ocultar rutas o botones en el frontend es solo ayuda visual.

## Endpoints usados por el frontend

### Autenticación (`/auth`)

| Método y ruta | Uso | Cuerpo / parámetros | Respuesta usada |
| --- | --- | --- | --- |
| `POST /auth/login` | Iniciar sesión. | `{ email, password }`. | `TokenOut` o `MFALoginRequiredOut`. |
| `POST /auth/mfa/verify` | Completar MFA. | `{ mfa_token, code }`; el código tiene 6 dígitos. | Par de tokens. |
| `POST /auth/refresh` | Renovar y rotar tokens. | `{ refresh_token }`. | `access_token` y `refresh_token`. |
| `POST /auth/logout` | Cerrar sesión. | `{ refresh_token }`. | 204; el cliente limpia tokens aunque falle. |
| `GET /auth/me` | Restaurar sesión. | — | `UserOut`. Funciona con `must_change_password=true`. |
| `POST /auth/change-password` | Cambiar contraseña. | `{ current_password, new_password }`. | 204; el backend revoca todas las sesiones. |
| `POST /auth/forgot-password` | Solicitar código OTP. | `{ email }`. | `{ detail }`. |
| `POST /auth/reset-password` | Restablecer con OTP. | `{ email, code, new_password }`. | `{ detail }`. |
| `POST /auth/mfa/setup`, `/auth/mfa/enable`, `/auth/mfa/disable` | Configurar MFA. | Según `authService.js`. | `MFASetupOut` / 204. |

Contraseña temporal: mientras `must_change_password` sea `true`, el usuario solo puede usar `/auth/me` y
`/auth/change-password`; cualquier otro endpoint protegido responde
`403 {"detail": {"code": "PASSWORD_CHANGE_REQUIRED", ...}}`. La aplicación redirige a `/cambiar-contrasena`.

### Usuarios y permisos (`/users`)

| Método y ruta | Permiso | Uso | Parámetros / cuerpo |
| --- | --- | --- | --- |
| `GET /users` | `users.view` | Listado paginado. | `search`, `role`, `is_active`, `limit`, `offset`. |
| `POST /users` | `users.create` | Crear trabajador. | `{ email, document_number, full_name, phone_number, role }`; sin contraseña. |
| `PATCH /users/{user_id}` | `users.edit` | Editar nombre, correo o teléfono. | Solo los campos enviados; `null` limpia. |
| `PATCH /users/{user_id}/role` | `users.manage_role` | Cambiar rol. | `{ role }`; nunca `super_admin`. |
| `PATCH /users/{user_id}/active` | `users.manage_active` | Activar o desactivar. | `{ is_active }`. |
| `GET /users/audit-log?limit=100` | `audit.view` | Auditoría. | `limit` (máximo solicitado 100). |

Roles asignables desde la interfaz: `admin` solo para `super_admin`; `admin` asigna `odontologo` y
`recepcionista`. Nunca se ofrece `usuario`.

### Clínicas (`/clinics`)

| Método y ruta | Autorización | Uso | Cuerpo / respuesta |
| --- | --- | --- | --- |
| `POST /clinics/register` | Pública | Registro de clínica y su admin. | `multipart/form-data` con los datos y **tres PDF**. |
| `GET /clinics/pending` | `clinics.review` | Solicitudes en `pending_review`. | `ClinicOut[]` con `cedula_url`, `rut_url` y `camara_comercio_url`. |
| `PATCH /clinics/{clinic_id}/review` | `clinics.review` | Aprobar o rechazar. | `{ approve: boolean }`; respuesta `ClinicOut`. |

`POST /clinics/register` exige `clinic_name`, `nit`, `nit_dv`, `email`, `document_number`, `full_name`,
`phone_number`, `password`, `cedula_file`, `rut_file` y `camara_comercio_file`. Los tres archivos deben ser
`application/pdf`, no vacíos y de máximo 5 MB; el backend además valida la firma real del PDF. La respuesta 201 es
`{ detail, clinic_id, clinic_status: "pending_review" }`.

Errores propios que la interfaz muestra tal como llegan:

- `400`: NIT no numérico, dígito de verificación incorrecto, nombre de clínica de menos de 3 caracteres, archivo
  que no es PDF, archivo vacío, PDF inválido o archivo de más de 5 MB.
- `409`: correo o documento ya existente, o NIT ya registrado.
- `500`: rol `admin` ausente en el seed o registro no completado.
- `502`: no se pudieron subir los documentos.

El administrador de una clínica en `pending_review` no puede iniciar sesión: el login responde 403 con
«Tu clinica aun no ha sido aprobada…». La revisión solo está disponible para `super_admin`.

### Pacientes (`/patients`)

| Método y ruta | Permiso | Uso | Parámetros / cuerpo |
| --- | --- | --- | --- |
| `POST /patients` | `patients.create` | Registrar paciente en la clínica del usuario. | `PatientCreateIn`. |
| `GET /patients` | `patients.view` | Listado y búsqueda paginada. | `search`, `limit`, `offset`; total en `X-Total-Count`. |
| `GET /patients/check` | `patients.create` | Verificar documento antes del alta. | `document_number` y `document_type` (`TI`, `CC`, `CE`, `PA`; por defecto `CC`). |
| `GET /patients/{patient_id}` | `patients.view` | Detalle con alertas médicas. | `patient_id` en la ruta. |
| `PATCH /patients/{patient_id}` | `patients.edit` | Edición parcial. | Solo los campos que cambian; `null` limpia opcionales. |
| `GET /patients/{patient_id}/alerts` | `patients.view` | Alertas para historia clínica y odontograma. | `patient_id` en la ruta. |

`PatientCreateIn` exige `full_name` (3–150), `document_number` (`^[0-9]{6,10}$`), `email` (máx. 255),
`phone_number`, `birth_date` y `gender` (`Masculino` o `Femenino`). `document_type` es opcional con default `CC`.
Los campos clínicos opcionales son `blood_type`, `address` (máx. 255), `eps` (máx. 100), los cuatro datos del
responsable, el contacto de emergencia, `allergies`, `current_medications`, `medical_conditions` (máx. 1000 cada
uno) y `notes`.

`PatientOut` incluye `clinic_id` (ya no `user_id`), `is_minor`, el teléfono y las tres alertas médicas.
`PatientCheckOut` es exactamente `{ exists, patient_id, full_name }`.

`PatientUpdateIn` permite editar también nombre, correo, documento y teléfono, además de los campos clínicos.
El frontend envía únicamente los campos modificados. El backend revalida duplicados y la regla del responsable
para menores; al limpiar un campo obligatorio responde 400 «El campo … no puede quedar vacio», que se muestra
junto al campo. El 409 por documento duplicado también se asocia a `document_number`.

Flujo de alta en `src/modules/pacientes/PatientsPage.jsx`:

1. El formulario rápido captura nombres y apellidos por separado y los une en `full_name`.
2. «Verificar paciente» llama a `GET /patients/check`. Si `exists=true` muestra
   «Este paciente ya está registrado en tu clínica» y un enlace a su ficha.
3. Si la verificación falla por red, no bloquea el alta: se intenta crear y se maneja el 409.
4. Un 409 con «Ya existe un paciente con ese documento en esta clinica (id=…)» muestra el mensaje y el enlace
   «Ir a su ficha» usando el id extraído.
5. Si `birth_date` corresponde a un menor de 18 años se exigen `guardian_full_name`,
   `guardian_document_number`, `guardian_phone` y `guardian_relationship` (máx. 50).
6. Las alertas médicas son opcionales y se agrupan en una sección colapsable.

Un mismo paciente puede existir en varias clínicas. El frontend no enlaza cuentas ni reutiliza registros de otra
clínica: cada clínica lo registra de nuevo y `check` nunca revela pacientes de otras clínicas.

### Citas (`/appointments`)

| Método y ruta | Permiso | Uso | Cuerpo |
| --- | --- | --- | --- |
| `POST /appointments` | `appointments.create` | Crear cita. | `patient_id`, `dentist_id`, `scheduled_date`, `start_time`, `end_time`, `reason`; `origin` opcional. |
| `GET /appointments` | `appointments.view` | Agenda y citas por paciente. | Query opcional `scheduled_date`, `dentist_id`, `patient_id`; devuelve un arreglo, sin `X-Total-Count`. |
| `PATCH /appointments/{id}/reschedule` | `appointments.edit` | Reprogramar. | `scheduled_date`, `start_time`, `end_time`. |
| `PATCH /appointments/{id}/cancel` | `appointments.edit` | Cancelar. | `{ cancellation_reason }` (mínimo 3). |
| `PATCH /appointments/{id}/status` | `appointments.edit` | Cambiar estado. | `{ status }`: `confirmada`, `atendida` o `no_asistio`. |

### Historia clínica (`/clinical-history`)

| Método y ruta | Permiso | Uso | Parámetros / cuerpo |
| --- | --- | --- | --- |
| `GET /clinical-history` | `clinical_history.view` | Historia paginada por paciente. | `patient_id` obligatorio, `limit`, `offset`. |
| `GET /clinical-history/{entry_id}` | `clinical_history.view` | Detalle de una entrada. | `entry_id` en la ruta. |
| `POST /clinical-history` | `clinical_history.create` | Registrar consulta asociada a una cita. | `appointment_id`, `motivo_consulta`, `examen`, `diagnostico`, `tratamiento`; `antecedentes` opcional. |

La historia clínica y el odontograma consultan `GET /patients/{id}/alerts` antes de atender. Si el servicio no
está disponible, la interfaz avisa y permite reintentar sin mostrar datos de otro paciente.

### Odontograma (`/odontogram`)

| Método y ruta | Permiso | Uso | Parámetros / cuerpo |
| --- | --- | --- | --- |
| `GET /odontogram/{patient_id}` | `odontogram.view` | Estado actual por diente y superficie. | `patient_id` en la ruta. |
| `GET /odontogram/{patient_id}/history` | `odontogram.view` | Historial paginado. | `tooth_fdi`, `limit`, `offset`. |
| `POST /odontogram` | `odontogram.create` | Registrar hallazgo y/o procedimiento. | `appointment_id`, `tooth_fdi`; `surface` nullable; `condition_code`, `procedure_code`, `notes`. |

Debe enviarse al menos `condition_code` o `procedure_code`. `surface` se envía como `null` para el diente
completo. El campo `procedure_code` usa el buscador CUPS descrito abajo.

### Notificaciones (`/notifications`)

| Método y ruta | Autorización | Uso | Parámetros / cuerpo |
| --- | --- | --- | --- |
| `GET /notifications` | Sesión activa | Notificaciones del usuario. | `unread_only`, `limit`, `offset`. |
| `POST /notifications` | `notifications.create` | Crear notificación. | `user_id`, `type` (2–40), `title` (3–150), `message`; `appointment_id`, `patient_id` opcionales. |
| `PATCH /notifications/{id}/read` | Sesión activa | Marcar como leída. | `id` en la ruta. |

### Catálogos CUPS (`/catalogs`)

| Método y ruta | Autorización | Uso | Parámetros |
| --- | --- | --- | --- |
| `GET /catalogs/cups` | Sesión activa | Buscar en el catálogo CUPS 2026. | `q` (2–100), `dental_only` (default `true`), `limit` (máx. 50, default 20). |
| `GET /catalogs/cups/{code}` | Sesión activa | Consultar un código exacto. | `code` en la ruta. |

`CupsOut` es `{ code, name, section, is_dental, is_active }`. Si `q` parece un código (mayúsculas o dígitos,
hasta 6, con al menos un dígito) se buscan códigos que empiezan por él; si son palabras se buscan procedimientos
cuyo nombre contiene todas las palabras. No distingue tildes ni mayúsculas.

`src/services/catalogsService.js` recorta `q` a 100 caracteres, no llama al backend con menos de 2 y limita
`limit` a 50. `src/modules/odontograma/CupsSearch.jsx` aplica debounce de 350 ms y `CupsCodeLabel` consulta el
nombre oficial de códigos ya guardados cuando la respuesta no lo trae.

## Endpoints retirados

Estas rutas ya no existen en el contrato y fueron eliminadas del frontend (servicios, pantallas, rutas y enlaces):

- `POST /auth/register`
- `GET /patients/me`, `POST /patients/me`, `PATCH /patients/me`
- `GET /clinical-history/me`
- Toda la lógica de vinculación de pacientes (`linkPatient`, `user_exists`, `has_patient_profile`, `same_clinic`)

## Paginación, fechas y errores

- Paginación general: `limit` entre 1 y 200 (default 50) y `offset` desde 0. El total viaja en `X-Total-Count`,
  expuesto por CORS. Excepción: `GET /appointments` devuelve un arreglo sin paginación declarada.
- Fechas `YYYY-MM-DD`, horas `HH:MM:SS` y fecha-hora ISO 8601 en hora de Colombia (`America/Bogota`) para la agenda.
- Formato de error general: `{"detail": "mensaje"}`. Códigos: 400 regla de negocio, 401 token inválido o vencido,
  403 sin permiso o clínica/cuenta no habilitada, 404 no existe o es de otra clínica, 409 duplicado o cruce,
  422 validación por campos, 423 cuenta bloqueada temporalmente, 500 error interno y 502 fallo de subida de
  documentos.
- El frontend muestra el mensaje del backend para 400, 403, 404, 409, 423 y 502; para 5xx genéricos usa un mensaje
  seguro. Los 422 se asocian al campo indicado por `loc`.

## Endpoints que el frontend no debe usar

- `POST /internal/run-reminders`: es exclusivo del cron del backend.
- `/docs`, `/redoc` y `/openapi.json`: solo están disponibles fuera de producción.
- No se usa `GET /` (estado del servicio) en la interfaz.

## Modo de vista previa

`PREVIEW_MODE` solo se activa con `VITE_PREVIEW_MODE=true`; `.env.example` lo deja en `false`. En ese modo
`AuthContext` arranca con un usuario de demostración y `usersService` devuelve datos fijos y rechaza escrituras.
Las páginas clínicas y el registro de clínicas siguen llamando a la API real: para probarlas se necesita
`VITE_PREVIEW_MODE=false`, iniciar sesión y tener los permisos correspondientes.

## CORS y despliegue

El backend debe permitir el origen exacto del frontend (con protocolo y sin barra final) y exponer
`X-Total-Count`. Para desarrollo local se usan `http://localhost:5173` y `http://localhost:8080`. La lista real de
orígenes la configura el backend y queda **pendiente de confirmar con el equipo de backend**.

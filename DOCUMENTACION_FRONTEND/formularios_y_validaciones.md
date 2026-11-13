# Formularios y validaciones

Las validaciones locales mejoran la interacción, pero no sustituyen las validaciones del backend. Los errores 422 y las reglas de negocio 400/409 conocidas se muestran junto al campo correspondiente.

## Formularios con intención de integración

### Inicio de sesión

Archivo: `src/pages/LoginPage.jsx`.

- Campos: correo electrónico y contraseña.
- Reglas: correo obligatorio y formato básico válido; contraseña obligatoria.
- Se llama al flujo de autenticación del contexto; el código dirige a MFA si el servidor devuelve un token MFA.
- En `VITE_PREVIEW_MODE=true` se inicia como usuario de demostración; el modo está desactivado por defecto.

### Verificación MFA

Archivo: `src/pages/MfaPage.jsx`.

- Campo: código de verificación.
- Regla: exactamente seis dígitos; la entrada filtra caracteres no numéricos y limita longitud a seis.
- Se requiere un `mfaToken` pendiente en memoria; si falta, redirige a `/login`.
- El mensaje de error del cliente indica que el intento puede vencer en cinco minutos; plazo real: PENDIENTE DE CONFIRMAR CON BACKEND.
- No se alcanza este flujo durante la vista previa activa.

### Cambio de contraseña

Archivo: `src/components/ChangePasswordForm.jsx`, usado en cambio forzado y configuración.

- Campos: contraseña actual, nueva contraseña y confirmación.
- Nueva contraseña: 8–128 caracteres, al menos una minúscula, una mayúscula, un dígito y un carácter que no sea letra ASCII ni dígito.
- Confirmación debe coincidir con la nueva contraseña.
- Contraseña actual obligatoria.
- La interfaz presupone respuesta 204 y posterior cierre de sesiones descrito en comentarios del servicio; confirmar con backend.
- En modo vista previa se sustituye por un aviso y no permite el cambio.

### Crear trabajador

Archivo: `src/modules/usuarios/CreateUserPage.jsx`.

- Campos: nombre completo, correo, documento, teléfono y rol.
- Nombre: obligatorio, 3–150 caracteres.
- Correo: obligatorio, formato básico válido.
- Documento: obligatorio, dígitos, 5–10 caracteres.
- Teléfono: obligatorio, exactamente 10 dígitos, admite espacios/guiones y prefijo `+57`; se normaliza al enviar.
- Rol: obligatorio y debe pertenecer a la lista asignable al usuario actual.
- Sin campo de contraseña; la interfaz comunica que el sistema genera una temporal y la envía por correo.
- Estado actual: en preview se reemplaza el formulario por una explicación de solo visualización.

### Registro público de clínica

Archivo: `src/modules/clinicas/RegisterClinicPage.jsx`.

- Datos de clínica: nombre, NIT y dígito de verificación.
- Datos del administrador: correo, nombre completo, documento, teléfono y contraseña.
- Archivos obligatorios: cédula del representante, RUT y certificado de Cámara de Comercio.
- Nombre de clínica: obligatorio, al menos 3 caracteres.
- NIT: obligatorio, dígitos. Se muestra una sugerencia de dígito verificador con cálculo módulo 11; el servidor debe validarlo.
- Dígito verificador: obligatorio, un solo dígito.
- Correo: usa validación básica de correo.
- Documento: obligatorio, 6–10 dígitos.
- Nombre de administrador: obligatorio (no se aplica límite de longitud visible en esta validación).
- Teléfono: obligatorio, 10 dígitos.
- Contraseña: reglas de 8–128 caracteres, minúscula, mayúscula, número y símbolo.
- Archivos: solo PDF, no vacíos y máximo 5 MB cada uno; el cliente valida MIME/tamaño y el backend verifica el contenido real.
- Todos los campos se envían en `FormData`; se muestra éxito o errores del servidor.
- La ruta es pública, pero el resultado real depende de API y validación backend.

## Módulos con formularios y servicios de API

| Vista | Campos/controles visuales | Estado |
| --- | --- | --- |
| Pacientes | Alta rápida por documento, verificación previa, responsable condicional para menores, alertas médicas y edición parcial. | Integrado con `/patients`; el duplicado 409 permite abrir la ficha existente. |
| Citas | Paciente, odontólogo, fecha, hora, duración, estado, motivo; filtros por odontólogo y estado. | Usa los servicios de `/appointments`; confirmar permisos y conectividad en el entorno backend. |
| Historia clínica | Búsqueda por paciente, registros y formulario asociado a cita. | Usa `/clinical-history` y muestra alertas médicas antes de atender. |
| Odontograma | Dentición, arcada, pieza, superficies, condición y procedimiento CUPS. | Usa `/odontogram` y el buscador oficial `/catalogs/cups`; muestra alertas médicas. |
| Facturación | Búsqueda, filtros de estado y período, botón de pago. | Filtros/acción deshabilitados; sin datos ni cálculo. |
| Notificaciones | Filtro Todas/Sin leer. | No lee, actualiza ni marca notificaciones; selección solo visual. |

## Elementos compartidos

`FormField`, `TextField`, `SelectField` y `PasswordField` asocian etiqueta visible, estado de error y ayuda; los formularios llaman validadores de `src/utils/validators.js` o `clinicValidation.js`. Las pantallas clínicas con inputs directos no usan este esquema de validación.

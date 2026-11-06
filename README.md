# Odonty — Frontend

Aplicación web (React + Vite) para administrar una clínica odontológica. Proyecto formativo SENA.
Se conecta al backend FastAPI de Odonty y respeta el contrato `Contrato_API_Odonty.docx`.

## Qué incluye

- Página principal con barra lateral, barra superior, accesos rápidos y estado de los módulos.
- **Usuarios, roles y permisos** (conectado al backend):
  - Listado (`GET /users`) con búsqueda, estados de carga/vacío/error y actualización.
  - Crear trabajador (`POST /users`), sin contraseña: el backend envía una temporal por correo.
  - Cambio de rol con confirmación (`PATCH /users/{id}/role`).
  - Historial de auditoría solo para `super_admin` (`GET /users/audit-log?limit=100`).
  - Matriz de roles y permisos (referencia tomada del contrato).
- **Clínicas**:
  - Registro público con documentos multipart, validaciones y sugerencia del dígito NIT (`POST /clinics/register`).
  - Revisión y aprobación/rechazo de solicitudes solo para `super_admin` (`GET /clinics/pending`, `PATCH /clinics/{id}/review`).
- Autenticación: login, MFA (`/auth/mfa/verify`), renovación de sesión con rotación del refresh token, logout y cambio obligatorio de contraseña.
- Módulos frontend preparados: pacientes, citas y agenda, historia clínica, odontograma, facturación y pagos, y notificaciones. Tienen página y navegación propias; no cargan datos ficticios ni simulan escrituras mientras no exista su API.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base del backend, sin barra final | `https://odontyoriginal-1.onrender.com` |

Copia `.env.example` a `.env` para cambiarla en desarrollo. `VITE_API_URL` se incrusta en el bundle **al compilar**, no al ejecutar.

## Vista previa local

La vista previa está activada temporalmente en `src/config/preview.js`. Al abrir la aplicación entra directamente al dashboard, sin login ni llamadas al backend, y usa datos de ejemplo para usuarios y auditoría. Las pantallas son de solo lectura. Para reactivar el flujo normal de autenticación y API, cambia `PREVIEW_MODE` a `false` y `FRONTEND_PERMISSION_BYPASS` a `false` en `src/utils/permissions.js`.

## Desarrollo local

Antes, copia `.env.example` a `.env` y configura `VITE_API_URL` según el entorno.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas de lógica (permisos, errores, validaciones, sesión)
npm run build      # genera dist/
```

Para probar con el backend local, crea `.env` con `VITE_API_URL=http://localhost:8000`, desactiva `PREVIEW_MODE` en
`src/config/preview.js` y ejecuta `npm run dev`. Abre `/registro-clinica` para enviar una solicitud con imágenes JPG,
PNG o WEBP (máximo 5 MB cada una). Para revisar clínicas, inicia sesión con una cuenta `super_admin` y visita
`/clinicas`; también aparece en Administración del sidebar.

## Docker

```bash
# Con docker compose (http://localhost:8080)
docker compose up --build

# Con otra URL de API
VITE_API_URL=https://mi-api.example.com docker compose up --build

# Solo Docker
docker build -t odonty-frontend --build-arg VITE_API_URL=https://odontyoriginal-1.onrender.com .
docker run --rm -p 8080:80 odonty-frontend
```

La imagen compila con Node 22 y sirve los archivos con Nginx (con *fallback* a `index.html` para React Router).
Nginx escucha en el puerto de la variable `PORT` (80 por defecto), por lo que también funciona en plataformas
como Render, que inyectan su propio `PORT`. Hay un endpoint de salud en `/healthz`.

## Despliegue y CORS

El backend solo acepta peticiones desde los orígenes configurados en el servidor. Cuando el frontend tenga su URL
pública, hay que pedirle a tu compañero que la agregue a la lista de orígenes permitidos (con protocolo y **sin barra final**,
por ejemplo `https://odonty-frontend.onrender.com`). Para desarrollo local, `http://localhost:5173` y `http://localhost:8080`.

## Estructura

```
src/
  components/   Componentes visuales reutilizables (formularios, badges, modal, estados)
  config/       Configuración (URL de la API)
  context/      AuthContext (sesión) y ToastContext (notificaciones)
  hooks/        usePermissions, useAsync, useSlowLoading
  layouts/      AppLayout, Sidebar, Topbar
  modules/
    clinicas/   Registro público y revisión de clínicas
    usuarios/   Listado, creación y cambio de rol
    roles/      Matriz de roles y permisos
    auditoria/  Historial de auditoría
  pages/        Login, MFA, cambio de contraseña, inicio, configuración, 403/404
  routes/       Rutas, guardas de acceso y navegación
  services/     apiClient (HTTP + renovación de sesión), authService, usersService, tokenStorage
  styles/       CSS (tokens, base, layout, componentes, páginas)
  utils/        permissions, validators, errors, format
tests/          Pruebas con node:test (sin dependencias extra)
```

## Decisiones de seguridad

- **Visualización temporal**: el frontend permite a cualquier usuario autenticado ver los módulos aunque su rol no tenga esos permisos. El backend sigue siendo la autoridad y puede rechazar las solicitudes; para restaurar el control visual por rol, cambia `FRONTEND_PERMISSION_BYPASS` a `false` en `src/utils/permissions.js`.
- **Tokens**: el *access token* vive solo en memoria; el *refresh token* se guarda en `sessionStorage` (por pestaña).
  Se eligió así porque el backend rota el refresh token: compartirlo entre pestañas con `localStorage` provocaría
  invalidaciones cruzadas. Contrapartida: al cerrar la pestaña hay que iniciar sesión de nuevo.
  La opción más segura frente a XSS sería una cookie `HttpOnly` emitida por el backend, pero requiere cambiar el backend y el contrato.
- La renovación de sesión es de una sola vez a la vez: las solicitudes simultáneas comparten el mismo `POST /auth/refresh`,
  y cada solicitud se reintenta como máximo una vez (sin bucles).
- Un fallo de red o un servidor dormido **no** cierra la sesión; solo un rechazo explícito del backend lo hace.
- Los tokens nunca se muestran ni se escriben en consola.
- Ocultar botones o rutas es solo ayuda visual: el backend es siempre la autoridad.

## Módulos clínicos y trabajo pendiente de backend

El contrato `Contrato_API_Odonty.docx` no documenta modelos, rutas ni permisos para estos módulos. Las interfaces actuales muestran estados vacíos y desactivan las acciones de guardado; no se envían solicitudes a endpoints supuestos.

| Módulo | Interfaz disponible | Requiere implementar/documentar en backend |
| --- | --- | --- |
| Pacientes | Directorio vacío, búsqueda y formulario visual | Modelo y campos validados; listado, perfil, creación y edición; estados si aplican |
| Citas y agenda | Calendario mensual, semanal y diario; formulario y filtros desactivados | Recursos de citas y catálogos de pacientes/odontólogos; lectura, creación y cambios; estados/duración admitidos |
| Historia clínica | Búsqueda y secciones de información personal, antecedentes y evolución | Lectura clínica por paciente, modelo y campos; controles de acceso a datos sensibles |
| Odontograma | Selección interactiva de piezas con dentición permanente/temporal y numeración FDI | Modelo y lectura/escritura de condiciones y procedimientos, catálogo de estados y trazabilidad |
| Facturación y pagos | Búsqueda, filtros y tabla vacía | Facturas, pagos, saldos y estados; permisos y reglas para registrar pagos |
| Notificaciones | Centro vacío con filtros y panel de detalle | Listado, detalle, fecha, tipos, lectura/no leídas y cualquier acción de actualización |

El frontend usa el siguiente **borrador de permisos aprobado para su navegación y guardas**: super_admin/admin acceden a todo; odontologo a pacientes, citas, historia clínica y odontograma; recepcionista a pacientes, citas y facturación; usuario a notificaciones. Estos permisos no están en el contrato ni sustituyen la autorización del servidor: backend debe acordar e implementar su validación antes de servir datos.

No se utiliza ningún endpoint nuevo para los seis módulos. Los endpoints ya documentados de autenticación, usuarios/auditoría y clínicas permanecen sin cambios.

## Pendiente

- Recuperación de contraseña (`/auth/forgot-password`, `/auth/reset-password`): existen en la API pero no tienen pantalla.
- Configuración de MFA (`/auth/mfa/setup|enable|disable`): la API existe; falta la pantalla (el flujo de login con MFA sí funciona).
- Activar/desactivar usuarios y reenviar contraseña temporal: aún no existen en el backend.
- Conectar los seis módulos clínicos cuando el backend publique sus contratos, modelos y permisos.

# Odonty — Frontend

Aplicación web (React + Vite) para administrar una clínica odontológica. Proyecto formativo SENA.
Se conecta al backend FastAPI de Odonty y sigue el contrato API del 13 de noviembre de 2026, documentado en
`DOCUMENTACION_FRONTEND/integracion_api.md`.

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
| `VITE_API_URL` | URL base del backend, sin barra final; requerida | Sin valor predeterminado |

Copia `.env.example` a `.env` para cambiarla en desarrollo. `VITE_API_URL` se incrusta en el bundle **al compilar**, no al ejecutar.

## Vista previa local

La vista previa se activa solo con `VITE_PREVIEW_MODE=true`. Para usar la API real, configura `VITE_API_URL`,
usa `VITE_PREVIEW_MODE=false` y `VITE_PERMISSION_BYPASS=false`.

## Desarrollo local

Antes, copia `.env.example` a `.env` y configura `VITE_API_URL` según el entorno.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas de lógica (permisos, errores, validaciones, sesión)
npm run build      # genera dist/
```

Para probar con el backend local, crea `.env` con `VITE_API_URL=http://localhost:8000` y
`VITE_PREVIEW_MODE=false`, y ejecuta `npm run dev`. Abre `/registro-clinica` para enviar una solicitud con tres
archivos PDF (cédula, RUT y certificado de Cámara de Comercio, máximo 5 MB cada uno). Para revisar clínicas,
inicia sesión con una cuenta `super_admin` y visita
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

- **Bypass de permisos opcional**: solo se activa con `VITE_PERMISSION_BYPASS=true`; por defecto está desactivado. El backend sigue siendo la autoridad en cualquier caso.
- **Tokens**: el *access token* vive solo en memoria; el *refresh token* se guarda en `sessionStorage` (por pestaña).
  Se eligió así porque el backend rota el refresh token: compartirlo entre pestañas con `localStorage` provocaría
  invalidaciones cruzadas. Contrapartida: al cerrar la pestaña hay que iniciar sesión de nuevo.
  La opción más segura frente a XSS sería una cookie `HttpOnly` emitida por el backend, pero requiere cambiar el backend y el contrato.
- La renovación de sesión es de una sola vez a la vez: las solicitudes simultáneas comparten el mismo `POST /auth/refresh`,
  y cada solicitud se reintenta como máximo una vez (sin bucles).
- Un fallo de red o un servidor dormido **no** cierra la sesión; solo un rechazo explícito del backend lo hace.
- Los tokens nunca se muestran ni se escriben en consola.
- Ocultar botones o rutas es solo ayuda visual: el backend es siempre la autoridad.

## Módulos clínicos

La integración sigue el contrato **Odonty API del 13 de noviembre de 2026**, detallado en
[DOCUMENTACION_FRONTEND/integracion_api.md](./DOCUMENTACION_FRONTEND/integracion_api.md). Pacientes, citas,
historia clínica, odontograma y notificaciones cuentan con servicios conectados a los endpoints documentados;
el odontograma usa el catálogo CUPS y las pantallas clínicas consultan alertas médicas. La compatibilidad con el
backend en ejecución depende de `VITE_API_URL`, CORS y permisos asignados a la cuenta.

Facturación y pagos siguen pendientes de endpoints documentados en el contrato actual. La matriz de permisos es
una ayuda visual y no sustituye la autorización del backend. El frontend asigna `admin`, `odontologo` y
`recepcionista`; no ofrece el rol legado `usuario`.

## Pendiente

- Recuperación de contraseña (`/auth/forgot-password`, `/auth/reset-password`): existen en la API pero no tienen pantalla.
- Configuración de MFA (`/auth/mfa/setup|enable|disable`): la API existe; falta la pantalla (el flujo de login con MFA sí funciona).
- Activar/desactivar usuarios y reenviar contraseña temporal: aún no existen en el backend.
- Conectar los seis módulos clínicos cuando el backend publique sus contratos, modelos y permisos.

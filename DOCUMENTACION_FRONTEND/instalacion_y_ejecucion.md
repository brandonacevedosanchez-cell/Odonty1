# Instalación y ejecución

## Requisitos

- Node.js y npm. El `Dockerfile` usa Node 22; esa versión es la referencia comprobable del proyecto.
- Acceso a los paquetes npm para instalar dependencias.
- Para integración real: una API accesible desde el navegador y configurada para permitir el origen frontend por CORS (**PENDIENTE DE CONFIRMAR CON BACKEND**).

## Ejecución local

Desde la carpeta raíz del proyecto:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Vite configura `host: true` y puerto `5173`; normalmente la aplicación queda disponible en `http://localhost:5173`.

El `.env.example` proporciona `VITE_API_URL=https://odontyoriginal-1.onrender.com`. Para otro servidor, editar el `.env` local con la URL base sin barra final, por ejemplo:

```env
VITE_API_URL=http://localhost:8000
```

Vite incorpora esa variable al compilar. Cambiarla requiere reiniciar el servidor de desarrollo o volver a compilar, según el modo de uso.

## Modo actual de la aplicación

La vista previa se activa con `PREVIEW_MODE = true` en `src/config/preview.js`. Por tanto, al abrir la aplicación se entra con un usuario de demostración; varias llamadas se suprimen y las escrituras no se guardan. La mera configuración de `VITE_API_URL` no desactiva ese modo. El cambio de modo está codificado en el archivo fuente; este documento no recomienda modificarlo para esta entrega.

## Pruebas y compilación

```powershell
npm test
npm run build
npm run preview
```

- `npm test` ejecuta las pruebas con Node (`node:test`).
- `npm run build` genera `dist/`.
- `npm run preview` sirve el build con Vite y `--host`.

En la revisión de documentación se ejecutaron `npm test` y `npm run build`: 35 de 35 pruebas aprobaron y Vite compiló correctamente.

## Docker

Con Docker y Compose instalados:

```powershell
docker compose up --build
```

El `docker-compose.yml` publica el servicio en el puerto local 8080. Para elegir API al compilar la imagen:

```powershell
$env:VITE_API_URL = "https://mi-api.example.com"
docker compose up --build
```

El `Dockerfile` usa Node 22 para compilar y Nginx para servir el resultado. La URL `VITE_API_URL` se incorpora en el build, no se consulta dinámicamente desde el navegador al iniciar Nginx. La configuración de Nginx usa un fallback SPA para rutas de cliente y ofrece `/healthz`, según los archivos de despliegue.

## Diagnóstico básico

- Si el navegador no puede llamar a la API, verificar URL, disponibilidad del servidor y CORS. CORS se configura en backend.
- Si las páginas muestran avisos de solo lectura o datos de demostración, corresponde al `PREVIEW_MODE` activo y no necesariamente a una falla de red.
- No se debe introducir credenciales reales en `.env`; el archivo de ejemplo solo incluye la URL.

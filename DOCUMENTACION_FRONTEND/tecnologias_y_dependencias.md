# Tecnologías y dependencias

## Tecnologías identificadas

| Tecnología | Evidencia | Uso |
| --- | --- | --- |
| JavaScript con módulos ES | `package.json` establece `"type": "module"`; los archivos de aplicación son `.js` y `.jsx`. | Lógica y componentes. No se encontró configuración de TypeScript. |
| React 18 | `react` y `react-dom` en `package.json`. | Renderizado por componentes y estado de interfaz. |
| JSX | Archivos `.jsx` dentro de `src/`. | Sintaxis de componentes React. |
| Vite 5 | Scripts npm, `vite.config.js` y dependencia `vite`. | Servidor de desarrollo y compilación. |
| React Router DOM 6 | Dependencia `react-router-dom`; `BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink` y `Outlet`. | Navegación del lado del cliente y guards. |
| CSS propio | Seis hojas CSS importadas en `src/main.jsx`. | Tokens, estilos base, layout, componentes, páginas y módulos clínicos. No se declara framework CSS. |
| Node.js y npm | `package.json`, `package-lock.json`; Docker usa Node 22. | Instalación, scripts y compilación. |
| Nginx en Docker | `Dockerfile` y `nginx.conf.template`. | Servicio de los archivos estáticos compilados. |
| Node test runner | Script `"test": "node --test \"tests/*.test.js\""` en `package.json`. | Pruebas sin dependencia de test externa declarada. |

## Dependencias de ejecución declaradas

| Paquete | Versión declarada | Uso observado |
| --- | --- | --- |
| `react` | `^18.3.1` | Componentes, contextos y hooks. |
| `react-dom` | `^18.3.1` | Montaje de la aplicación con `createRoot`. |
| `react-router-dom` | `^6.28.0` | Rutas y navegación. |

## Dependencias de desarrollo declaradas

| Paquete | Versión declarada | Uso observado |
| --- | --- | --- |
| `@vitejs/plugin-react` | `^4.3.4` | Plugin React configurado en `vite.config.js`. |
| `vite` | `^5.4.11` | Servidor de desarrollo y build. |

`package-lock.json` fija las versiones resueltas para instalaciones reproducibles con `npm ci`. No se declara una biblioteca de componentes, cliente HTTP externo, biblioteca de formularios, gestor global de estado ni biblioteca de fechas. Las llamadas HTTP usan `fetch`; los formularios y validadores son propios.

## Herramientas de calidad

- Pruebas en `tests/`: `apiClient.test.js`, `clinicValidation.test.js`, `errors.test.js`, `permissions.test.js` y `validators.test.js`.
- No se identificó un script de lint, formato o type-check en los scripts de `package.json`.
- No se declara una dependencia de pruebas externa; se usa `node:test`.
- En la revisión ejecutada: **63 pruebas aprobadas, 0 fallidas**; `npm run build` finalizó correctamente.

## Observaciones

- La ejecución normal requiere un navegador con soporte para APIs web usadas por el proyecto, como `fetch`, `AbortController`, `FormData` y `sessionStorage`.
- La URL del backend se configura con `VITE_API_URL`. Vite la integra durante la compilación.
- Dependencias instaladas en `node_modules/` y archivos generados en `dist/` no son dependencias declaradas ni código fuente.

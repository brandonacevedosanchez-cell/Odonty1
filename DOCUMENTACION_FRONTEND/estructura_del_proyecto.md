# Estructura del proyecto

El inventario siguiente se concentra en los archivos del proyecto, no en las miles de entradas de `node_modules/` ni en artefactos generados de `dist/`.

```text
.
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── AuthShell.jsx
│   │   ├── Badges.jsx
│   │   ├── ChangePasswordForm.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Feedback.jsx
│   │   ├── FormField.jsx
│   │   ├── Icon.jsx
│   │   ├── Logo.jsx
│   │   └── PageHeader.jsx
│   ├── config/
│   │   ├── env.js
│   │   └── preview.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   ├── useAsync.js
│   │   ├── usePermissions.js
│   │   └── useSlowLoading.js
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   ├── modules/
│   │   ├── auditoria/AuditPage.jsx
│   │   ├── citas/AppointmentsPage.jsx
│   │   ├── clinicas/
│   │   │   ├── ClinicStatusBadge.jsx
│   │   │   ├── ClinicsPage.jsx
│   │   │   ├── RegisterClinicPage.jsx
│   │   │   ├── clinicService.js
│   │   │   └── clinicValidation.js
│   │   ├── comun/ModuleApiNotice.jsx
│   │   ├── facturacion/BillingPage.jsx
│   │   ├── historia-clinica/ClinicalHistoryPage.jsx
│   │   ├── notificaciones/NotificationsPage.jsx
│   │   ├── odontograma/OdontogramPage.jsx
│   │   ├── pacientes/PatientsPage.jsx
│   │   ├── roles/RolesPage.jsx
│   │   └── usuarios/
│   │       ├── ChangeRoleDialog.jsx
│   │       ├── CreateUserPage.jsx
│   │       ├── UsersPage.jsx
│   │       └── UsersTable.jsx
│   ├── pages/
│   │   ├── ForbiddenPage.jsx
│   │   ├── ForcedPasswordChangePage.jsx
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MfaPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   └── SettingsPage.jsx
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── guards.jsx
│   │   └── navigation.js
│   ├── services/
│   │   ├── apiClient.js
│   │   ├── authService.js
│   │   ├── tokenStorage.js
│   │   └── usersService.js
│   ├── styles/
│   │   ├── base.css
│   │   ├── clinical-pages.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── pages.css
│   │   └── tokens.css
│   └── utils/
│       ├── errors.js
│       ├── format.js
│       ├── permissions.js
│       └── validators.js
├── tests/
│   ├── apiClient.test.js
│   ├── clinicValidation.test.js
│   ├── errors.test.js
│   ├── permissions.test.js
│   └── validators.test.js
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.html
├── nginx.conf.template
├── package-lock.json
├── package.json
├── README.md
└── vite.config.js
```

## Responsabilidad de cada área

- `src/main.jsx`: punto de entrada, montaje React e importación de CSS.
- `src/App.jsx`: `BrowserRouter`, proveedores de notificaciones y sesión, y rutas.
- `components/`: controles de interfaz compartidos, campos, estados, modales y cabecera.
- `config/`: dirección de API y modo de vista previa.
- `context/`: estado compartido de autenticación y notificaciones tipo toast.
- `hooks/`: carga asíncrona, permisos y aviso de operación lenta.
- `layouts/`: estructura autenticada, barra lateral y barra superior.
- `modules/`: pantallas agrupadas por área funcional.
- `pages/`: pantallas generales y de autenticación.
- `routes/`: mapa de rutas, navegación y guards de sesión/permisos.
- `services/`: cliente HTTP, autenticación, tokens, usuarios y clínicas.
- `styles/`: CSS del sistema visual.
- `utils/`: validaciones, permisos, formato y errores.
- `tests/`: pruebas unitarias de lógica y cliente HTTP.

## Archivos de ejecución y despliegue

- `package.json` y `package-lock.json`: dependencias y comandos npm.
- `.env.example`: ejemplo para `VITE_API_URL`.
- `vite.config.js`: plugin React y servidor accesible por host, puerto 5173.
- `Dockerfile`: build multi-etapa con Node y Nginx.
- `docker-compose.yml`: publicación local del contenedor en puerto 8080.
- `nginx.conf.template`: configuración de Nginx (incluye fallback SPA y health endpoint, según el Dockerfile/README).
- `README.md`: instrucciones y notas existentes del proyecto.

## Archivos fuera del código fuente

`node_modules/` contiene dependencias instaladas. `dist/` contiene el resultado compilado para servir; ambos pueden variar al instalar o compilar y no son el origen de las funcionalidades.

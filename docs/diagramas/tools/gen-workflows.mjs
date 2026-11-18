#!/usr/bin/env node
/**
 * Genera los diagramas de navegación de Odonty (Archify, workflow schema v2).
 *
 * Fuente de verdad: src/routes/AppRoutes.jsx, src/routes/guards.jsx,
 * src/routes/navigation.js, src/layouts/{Sidebar,Topbar}.jsx y las páginas y
 * servicios de src/modules y src/services. Si cambia el enrutado, actualiza
 * este archivo y vuelve a ejecutar `npm run diagrams`.
 *
 * Uso:
 *   node docs/diagramas/tools/gen-workflows.mjs
 *
 * Escribe los .workflow.json en docs/diagramas/. El render lo hace
 * docs/diagramas/tools/render-workflows.mjs.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..');

const SECURITY_CARD = {
  dot: 'rose',
  title: 'Regla de seguridad',
  items: [
    'Toda ruta protegida sin permiso muestra Acceso denegado (ForbiddenPage); la URL no cambia.',
    'Sin sesión válida se redirige a /login conservando la ruta solicitada.',
    'Una ruta desconocida dentro de AppLayout muestra 404 con volver al inicio.',
  ],
};

const STATE_CARD = {
  dot: 'amber',
  title: 'Estado real de la integración',
  items: [
    'Facturación es un marcador: no hay endpoint financiero ni llamada API.',
    'Roles y permisos es una matriz estática del frontend; no consulta endpoint.',
    'El odontograma busca CUPS en GET /catalogs/cups con dental_only=true.',
  ],
};

/** Crea un workflow vacío con la configuración compartida. */
function workflow(name, title, { preset = 'signal-flow' } = {}) {
  return {
    schema_version: 2,
    diagram_type: 'workflow',
    meta: {
      title,
      locale: 'es',
      animation: 'trace',
      visual_preset: preset,
      quality_profile: 'showcase',
      output: `docs/diagramas/${name}.workflow.html`,
    },
    lanes: [],
    phases: [],
    groups: [],
    nodes: [],
    edges: [],
    cards: [],
  };
}

const node = (id, lane, col, type, label, sublabel, extra = {}) => ({
  id,
  lane,
  col,
  type,
  label,
  ...(sublabel ? { sublabel } : {}),
  ...extra,
});

const edge = (from, to, { label, variant, role, fromSide, toSide, route, bias } = {}) => ({
  from,
  to,
  ...(label ? { label } : {}),
  ...(variant ? { variant } : {}),
  ...(role ? { role } : {}),
  ...(fromSide ? { fromSide } : {}),
  ...(toSide ? { toSide } : {}),
  ...(route ? { route } : {}),
  ...(bias !== undefined ? { bias } : {}),
});

const drop = (from, to, options = {}) => edge(from, to, { fromSide: 'bottom', toSide: 'top', ...options });

/* ------------------------------------------------------------------ */
/* 1. Navegación general                                               */
/* ------------------------------------------------------------------ */
function generalNavigation() {
  const w = workflow('navegacion-odonty', 'Navegación general de Odonty');
  w.lanes = [
    { id: 'publico', label: 'Acceso público' },
    { id: 'soporte', label: 'Soporte de acceso' },
    { id: 'sesion', label: 'Sesión autenticada' },
    { id: 'secciones', label: 'Secciones del área autenticada' },
  ];
  w.groups = [
    {
      id: 'hub',
      label: 'Se accede desde Inicio según permisos',
      lane: 'secciones',
      fromCol: 3,
      toCol: 5,
    },
  ];
  w.nodes = [
    node('registro', 'publico', 0, 'frontend', 'Registro de clínica', '/registro-clinica · sin guard'),
    node('login', 'publico', 1, 'frontend', 'Inicio de sesión', '/login · GuestRoute'),
    node('mfa', 'publico', 2, 'security', 'Verificación MFA', '/verificar-mfa'),
    node('recuperar', 'soporte', 1, 'frontend', 'Recuperación', '/recuperar'),
    node('inicio', 'sesion', 2, 'frontend', 'Inicio', '/ · AppLayout'),
    node('admin_n', 'secciones', 3, 'frontend', 'Administración', 'Usuarios · roles · auditoría'),
    node('clinicos_n', 'secciones', 4, 'frontend', 'Módulos clínicos', 'Seis módulos por permiso'),
    node('cuenta_n', 'secciones', 5, 'frontend', 'Mi cuenta', 'MFA y contraseña'),
  ];
  w.edges = [
    edge('registro', 'login', { label: 'solicitud enviada' }),
    edge('login', 'mfa', { label: 'MFA activo' }),
    drop('login', 'recuperar', { label: '¿olvidó?' }),
    edge('mfa', 'inicio', { label: 'sesión lista' }),
    edge('inicio', 'admin_n', { label: 'accesos rápidos' }),
  ];
  w.mainPath = ['registro', 'login', 'mfa', 'inicio'];
  w.cards = [SECURITY_CARD, STATE_CARD];
  return w;
}

/* ------------------------------------------------------------------ */
/* 2. Guards y excepciones                                             */
/* ------------------------------------------------------------------ */
function guardsAndExceptions() {
  const w = workflow('guards-y-excepciones', 'Guards y excepciones de navegación');
  w.lanes = [
    { id: 'guard', label: 'Guard de ruta' },
    { id: 'resultados', label: 'Resultados y excepciones', variant: 'exception' },
  ];
  w.nodes = [
    node('ruta', 'guard', 0, 'security', 'Ruta protegida', 'Cualquier ruta de AppLayout'),
    node('sesion', 'guard', 1, 'security', '¿Sesión válida?', 'ProtectedRoute · refresh token'),
    node('permiso', 'guard', 2, 'security', '¿Rol con permiso?', 'RequirePermission'),
    node('pantalla', 'guard', 3, 'frontend', 'Pantalla autorizada', 'Outlet de React Router'),
    node('logout', 'resultados', 0, 'frontend', 'Cierre de sesión', 'Topbar · POST /auth/logout'),
    node('login', 'resultados', 1, 'frontend', 'Inicio de sesión', '/login · vuelve a la ruta'),
    node('denegado', 'resultados', 2, 'security', 'Acceso denegado', 'ForbiddenPage · volver a inicio'),
    node('noexiste', 'resultados', 4, 'frontend', '404', 'NotFoundPage · volver a inicio'),
  ];
  w.edges = [
    edge('ruta', 'sesion'),
    edge('sesion', 'permiso', { label: 'token válido' }),
    drop('sesion', 'login', { label: 'sin sesión / expirada' }),
    edge('permiso', 'pantalla', { label: 'autorizado' }),
    drop('permiso', 'denegado', { label: 'sin permiso' }),
    edge('logout', 'login', { label: 'cierra sesión' }),
  ];
  w.mainPath = ['ruta', 'sesion', 'permiso', 'pantalla'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Invitados y cambio forzado',
      items: [
        'Si user.must_change_password, ProtectedRoute redirige a /cambiar-contrasena.',
        'Al completar el cambio, /cambiar-contrasena redirige a /.',
        'GuestRoute: con sesión activa, /login, /verificar-mfa y /recuperar van a la ruta previa o /.',
      ],
    },
    {
      dot: 'amber',
      title: 'Sesión y errores de red',
      items: [
        'status = loading: se muestra «Restaurando tu sesión…».',
        'status = error (red o 5xx): se muestra reintento y NO se cierra la sesión.',
        'Un 401 global limpia tokens y devuelve al login con aviso.',
        'En vista previa el cierre de sesión está desactivado.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 3. Acceso: login                                                    */
/* ------------------------------------------------------------------ */
function loginFlow() {
  const w = workflow('acceso-login', 'Acceso: inicio de sesión');
  w.lanes = [
    { id: 'publico', label: 'Pantalla pública' },
    { id: 'api', label: 'API de autenticación' },
  ];
  w.nodes = [
    node('form', 'publico', 0, 'frontend', 'Formulario de acceso', '/login · correo y contraseña'),
    node('enviar', 'publico', 1, 'frontend', 'Enviar credenciales', 'signIn'),
    node('mfa', 'publico', 2, 'security', 'Verificación MFA', '/verificar-mfa · 6 dígitos'),
    node('inicio', 'publico', 3, 'frontend', 'Inicio', 'GuestRoute → ruta previa o /'),
    node('api_login', 'api', 1, 'backend', 'POST /auth/login'),
    node('api_mfa', 'api', 2, 'backend', 'POST /auth/mfa/verify'),
    node('api_me', 'api', 3, 'backend', 'GET /auth/me'),
  ];
  w.edges = [
    edge('form', 'enviar'),
    drop('enviar', 'api_login'),
    edge('enviar', 'mfa', { label: 'MFA requerido' }),
    drop('mfa', 'api_mfa'),
    edge('mfa', 'inicio', { label: 'sesión iniciada' }),
    drop('inicio', 'api_me'),
  ];
  w.mainPath = ['form', 'enviar', 'mfa', 'inicio'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Sin MFA',
      items: [
        'Al autenticarse, GuestRoute redirige al inicio o a la ruta previa.',
        'Con MFA pendiente se navega a /verificar-mfa y luego a Inicio.',
      ],
    },
    {
      dot: 'rose',
      title: 'Errores',
      items: [
        '401: alerta en el formulario, sin navegación.',
        'Servidor lento: aviso informativo, la sesión no se altera.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 4. Acceso: recuperación                                             */
/* ------------------------------------------------------------------ */
function recoveryFlow() {
  const w = workflow('acceso-recuperacion', 'Acceso: recuperación de contraseña');
  w.lanes = [
    { id: 'publico', label: 'Pantalla pública' },
    { id: 'api', label: 'API de autenticación' },
  ];
  w.nodes = [
    node('pedir', 'publico', 0, 'frontend', 'Solicitar código', '/recuperar · correo'),
    node('codigo', 'publico', 1, 'frontend', 'Código y nueva contraseña', '6 dígitos · vence en 10 min'),
    node('exito', 'publico', 2, 'frontend', 'Contraseña actualizada', 'volver a iniciar sesión'),
    node('login', 'publico', 3, 'frontend', 'Inicio de sesión', '/login'),
    node('api_forgot', 'api', 0, 'backend', 'POST /auth/forgot-password'),
    node('api_reset', 'api', 1, 'backend', 'POST /auth/reset-password'),
  ];
  w.edges = [
    drop('pedir', 'api_forgot'),
    edge('pedir', 'codigo', { label: 'código enviado' }),
    drop('codigo', 'api_reset'),
    edge('codigo', 'exito', { label: 'código válido' }),
    edge('exito', 'login'),
  ];
  w.mainPath = ['pedir', 'codigo', 'exito', 'login'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Privacidad',
      items: [
        'Si el correo no está registrado, la respuesta es la misma: no revela cuentas.',
        'Los errores 422 se muestran por campo.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 5. Acceso: registro de clínica                                      */
/* ------------------------------------------------------------------ */
function clinicRegistrationFlow() {
  const w = workflow('acceso-registro', 'Acceso: registro de clínica');
  w.lanes = [
    { id: 'publico', label: 'Pantalla pública' },
    { id: 'api', label: 'API de clínicas' },
  ];
  w.nodes = [
    node('form', 'publico', 0, 'frontend', 'Registrar mi clínica', '/registro-clinica · sin guard'),
    node('datos', 'publico', 1, 'frontend', 'Datos y documentos', 'clínica · administrador · archivos'),
    node('enviar', 'publico', 2, 'frontend', 'Enviar solicitud', 'FormData multipart'),
    node('exito', 'publico', 3, 'frontend', 'Solicitud recibida', 'volver a /login'),
    node('api_post', 'api', 2, 'backend', 'POST /clinics/register'),
  ];
  w.edges = [
    edge('form', 'datos'),
    edge('datos', 'enviar'),
    drop('enviar', 'api_post'),
    edge('enviar', 'exito', { label: 'registro creado' }),
  ];
  w.mainPath = ['form', 'datos', 'enviar', 'exito'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Después del registro',
      items: [
        'La solicitud queda pendiente de revisión por un superadministrador.',
        'La revisión se hace en /clinicas (ver administracion-clinicas).',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 6. Cambio de contraseña                                             */
/* ------------------------------------------------------------------ */
function passwordChangeFlow() {
  const w = workflow('cambio-contrasena', 'Cambio de contraseña');
  w.lanes = [
    { id: 'sesion', label: 'Sesión autenticada' },
    { id: 'api', label: 'API de autenticación' },
  ];
  w.nodes = [
    node('forzado', 'sesion', 0, 'security', 'Cambio obligatorio', '/cambiar-contrasena · ProtectedRoute'),
    node('form', 'sesion', 1, 'frontend', 'Contraseña actual y nueva', 'ChangePasswordForm'),
    node('cierre', 'sesion', 2, 'security', 'Cierre de sesión global', '204 · tokens limpiados'),
    node('login', 'sesion', 3, 'frontend', 'Inicio de sesión', '/login'),
    node('api_post', 'api', 1, 'backend', 'POST /auth/change-password'),
  ];
  w.edges = [
    edge('forzado', 'form'),
    drop('form', 'api_post'),
    edge('form', 'cierre', { label: '204' }),
    edge('cierre', 'login', { label: 'volver a entrar' }),
  ];
  w.mainPath = ['forzado', 'form', 'cierre', 'login'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Dos entradas',
      items: [
        'Cambio forzado: ProtectedRoute bloquea el resto de rutas.',
        'Cambio voluntario desde /configuracion (Mi cuenta).',
      ],
    },
    {
      dot: 'rose',
      title: 'Efecto del backend',
      items: [
        'El cambio invalida todas las sesiones del usuario.',
        'El formulario vuelve a /login y exige autenticarse de nuevo.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 7. Administración: usuarios                                         */
/* ------------------------------------------------------------------ */
function usersFlow() {
  const w = workflow('administracion-usuarios', 'Administración: usuarios');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de usuarios' },
    { id: 'api', label: 'API de usuarios' },
  ];
  w.nodes = [
    node('lista', 'ui', 0, 'frontend', 'Listado de usuarios', '/usuarios · users.view'),
    node('filtros', 'ui', 1, 'frontend', 'Filtros y búsqueda', 'texto · rol · estado'),
    node('crear', 'ui', 2, 'frontend', 'Crear trabajador', '/usuarios/nuevo · users.create'),
    node('editar', 'ui', 3, 'frontend', 'Editar · rol · estado', 'diálogos de la tabla'),
    node('fin', 'ui', 4, 'frontend', 'Listado recargado', 'cambio aplicado'),
    node('api_get', 'api', 1, 'backend', 'GET /users'),
    node('api_post', 'api', 2, 'backend', 'POST /users'),
    node('api_patch', 'api', 3, 'backend', 'PATCH /users/{id}'),
  ];
  w.edges = [
    edge('lista', 'filtros'),
    drop('filtros', 'api_get'),
    edge('filtros', 'crear'),
    drop('crear', 'api_post'),
    edge('crear', 'editar'),
    drop('editar', 'api_patch'),
    edge('editar', 'fin'),
  ];
  w.mainPath = ['lista', 'filtros', 'crear', 'editar', 'fin'];
  w.cards = [
    {
      dot: 'rose',
      title: 'Reglas de rol',
      items: [
        'Nadie puede cambiar su propio rol.',
        'El rol super_admin no se asigna ni se modifica desde aquí.',
        'Un administrador no puede modificar a otro administrador.',
      ],
    },
    {
      dot: 'cyan',
      title: 'Rutas de escritura',
      items: [
        'Rol: PATCH /users/{id}/role. Estado: PATCH /users/{id}/active.',
        'Los cambios quedan registrados en /auditoria.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 8. Administración: roles y permisos                                 */
/* ------------------------------------------------------------------ */
function rolesFlow() {
  const w = workflow('administracion-roles', 'Administración: roles y permisos');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de roles' },
    { id: 'local', label: 'Datos locales', variant: 'exception' },
  ];
  w.nodes = [
    node('roles', 'ui', 0, 'frontend', 'Roles y permisos', '/roles · users.view'),
    node('matriz', 'ui', 1, 'security', 'Matriz de permisos', 'ROLE_PERMISSIONS'),
    node('desc', 'ui', 2, 'frontend', 'Descripción de roles', 'ROLE_DESCRIPTIONS'),
    node('reglas', 'ui', 3, 'security', 'Reglas de asignación', 'assignableRoles · roleChangeAccess'),
    node('estatica', 'local', 3, 'database', 'Sin endpoint', 'constantes del frontend'),
  ];
  w.edges = [
    edge('roles', 'matriz'),
    edge('matriz', 'desc'),
    edge('desc', 'reglas'),
    drop('reglas', 'estatica', { label: 'no consulta API' }),
  ];
  w.mainPath = ['roles', 'matriz', 'desc', 'reglas'];
  w.cards = [
    {
      dot: 'amber',
      title: 'Honestidad del estado',
      items: [
        'La matriz es estática: no existe GET /permissions en el contrato.',
        'El backend conserva la autorización final de cada petición.',
      ],
    },
    {
      dot: 'cyan',
      title: 'Dónde se cambia un rol',
      items: ['El cambio real de rol se hace desde /usuarios, no desde /roles.'],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 9. Administración: auditoría                                        */
/* ------------------------------------------------------------------ */
function auditFlow() {
  const w = workflow('administracion-auditoria', 'Administración: auditoría');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de auditoría' },
    { id: 'api', label: 'API de usuarios' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Auditoría', '/auditoria · audit.view'),
    node('cargar', 'ui', 1, 'frontend', 'Cargar eventos', 'últimos 100 registros'),
    node('tabla', 'ui', 2, 'frontend', 'Tabla de acciones', 'actor · acción · fecha'),
    node('vacio', 'ui', 3, 'frontend', 'Sin registros', 'EmptyState'),
    node('api_get', 'api', 1, 'backend', 'GET /users/audit-log?limit=100'),
  ];
  w.edges = [
    edge('entrada', 'cargar'),
    drop('cargar', 'api_get'),
    edge('cargar', 'tabla'),
    edge('tabla', 'vacio', { label: 'sin datos', variant: 'dashed' }),
  ];
  w.mainPath = ['entrada', 'cargar', 'tabla'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Modo vista previa',
      items: [
        'Con VITE_PREVIEW_MODE=true se muestran eventos de demostración.',
        'La pantalla es de solo lectura: no edita ni borra registros.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 10. Administración: clínicas                                        */
/* ------------------------------------------------------------------ */
function clinicsFlow() {
  const w = workflow('administracion-clinicas', 'Administración: revisión de clínicas');
  w.lanes = [
    { id: 'ui', label: 'Pantallas de clínicas' },
    { id: 'api', label: 'API de clínicas' },
  ];
  w.nodes = [
    node('registro', 'ui', 0, 'frontend', 'Registro público', '/registro-clinica'),
    node('pendientes', 'ui', 1, 'frontend', 'Solicitudes pendientes', '/clinicas · clinics.review strict'),
    node('revisar', 'ui', 2, 'frontend', 'Aprobar o rechazar', 'confirmación'),
    node('fin', 'ui', 3, 'frontend', 'Listado actualizado', 'recarga'),
    node('api_post', 'api', 0, 'backend', 'POST /clinics/register'),
    node('api_get', 'api', 1, 'backend', 'GET /clinics/pending'),
    node('api_patch', 'api', 2, 'backend', 'PATCH /clinics/{id}/review'),
  ];
  w.edges = [
    drop('registro', 'api_post'),
    edge('registro', 'pendientes', { label: 'solicitud creada' }),
    drop('pendientes', 'api_get'),
    edge('pendientes', 'revisar'),
    drop('revisar', 'api_patch'),
    edge('revisar', 'fin', { label: 'aprobada / rechazada' }),
  ];
  w.mainPath = ['registro', 'pendientes', 'revisar', 'fin'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Acceso',
      items: [
        'Solo el superadministrador ve /clinicas (rol + clinics.review).',
        'La revisión no se carga en modo vista previa.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 11. Módulo: pacientes                                               */
/* ------------------------------------------------------------------ */
function patientsFlow() {
  const w = workflow('pacientes', 'Módulo: pacientes');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de pacientes' },
    { id: 'api', label: 'API de pacientes' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Módulo Pacientes', '/pacientes · patients.view'),
    node('buscar', 'ui', 1, 'frontend', 'Búsqueda y paginación', 'texto libre'),
    node('alta', 'ui', 2, 'frontend', 'Registrar paciente', 'patients.create · documento único'),
    node('ficha', 'ui', 3, 'frontend', 'Ficha y alertas', 'patients.edit · alertas médicas'),
    node('guardar', 'ui', 4, 'frontend', 'Guardar cambios', 'solo campos modificados'),
    node('api_get', 'api', 1, 'backend', 'GET /patients'),
    node('api_post', 'api', 2, 'backend', 'POST /patients'),
    node('api_detail', 'api', 3, 'backend', 'GET /patients/{id}'),
    node('api_patch', 'api', 4, 'backend', 'PATCH /patients/{id}'),
  ];
  w.edges = [
    edge('entrada', 'buscar'),
    drop('buscar', 'api_get'),
    edge('buscar', 'alta'),
    drop('alta', 'api_post'),
    edge('alta', 'ficha'),
    drop('ficha', 'api_detail'),
    edge('ficha', 'guardar'),
    drop('guardar', 'api_patch'),
  ];
  w.mainPath = ['entrada', 'buscar', 'alta', 'ficha', 'guardar'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Datos que consume',
      items: [
        'Directorio: GET /patients?search=… con paginación.',
        'Duplicados: GET /patients/check y 409 con el id existente.',
        'Ficha: GET /patients/{id} y GET /patients/{id}/alerts.',
      ],
    },
    {
      dot: 'rose',
      title: 'Escritura',
      items: [
        'POST /patients para crear y PATCH /patients/{id} para actualizar.',
        'Los botones se ocultan sin patients.create o patients.edit.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 12. Módulo: citas                                                   */
/* ------------------------------------------------------------------ */
function appointmentsFlow() {
  const w = workflow('citas', 'Módulo: citas y agenda');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de agenda' },
    { id: 'api', label: 'API de citas' },
  ];
  w.nodes = [
    node('agenda', 'ui', 0, 'frontend', 'Agenda', '/citas · appointments.view'),
    node('vistas', 'ui', 1, 'frontend', 'Vistas mes · semana · día', 'navegación por periodo'),
    node('crear', 'ui', 2, 'frontend', 'Nueva cita', 'appointments.create'),
    node('acciones', 'ui', 3, 'frontend', 'Acciones de la cita', 'reprogramar · cancelar · estado'),
    node('fin', 'ui', 4, 'frontend', 'Agenda actualizada', 'recarga del periodo'),
    node('api_get', 'api', 1, 'backend', 'GET /appointments'),
    node('api_post', 'api', 2, 'backend', 'POST /appointments'),
    node('api_patch', 'api', 3, 'backend', 'PATCH /appointments/{id}/…'),
  ];
  w.edges = [
    edge('agenda', 'vistas'),
    drop('vistas', 'api_get'),
    edge('vistas', 'crear'),
    drop('crear', 'api_post'),
    edge('crear', 'acciones'),
    drop('acciones', 'api_patch'),
    edge('acciones', 'fin'),
  ];
  w.mainPath = ['agenda', 'vistas', 'crear', 'acciones', 'fin'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Catálogos y filtros',
      items: [
        'Paciente y odontólogo: GET /patients y GET /users.',
        'Filtros del contrato: scheduled_date, patient_id y dentist_id.',
      ],
    },
    {
      dot: 'amber',
      title: 'Tres escrituras distintas',
      items: [
        'Reprogramar: /reschedule. Cancelar: /cancel. Estado: /status.',
        'Los estados permitidos los define el backend.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 13. Módulo: historia clínica                                        */
/* ------------------------------------------------------------------ */
function clinicalHistoryFlow() {
  const w = workflow('historia-clinica', 'Módulo: historia clínica');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de historia clínica' },
    { id: 'api', label: 'API clínica' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Historia clínica', '/historia-clinica · view'),
    node('paciente', 'ui', 1, 'frontend', 'Selección de paciente', 'búsqueda de pacientes'),
    node('registrar', 'ui', 2, 'frontend', 'Nueva consulta', 'clinical_history.create'),
    node('detalle', 'ui', 3, 'frontend', 'Detalle de consulta', 'antecedentes y evolución'),
    node('paginar', 'ui', 4, 'frontend', 'Historial paginado', 'límite y desplazamiento'),
    node('api_get', 'api', 1, 'backend', 'GET /patients'),
    node('api_post', 'api', 2, 'backend', 'POST /clinical-history'),
    node('api_detail', 'api', 3, 'backend', 'GET /clinical-history/{id}'),
    node('api_list', 'api', 4, 'backend', 'GET /clinical-history'),
  ];
  w.edges = [
    edge('entrada', 'paciente'),
    drop('paciente', 'api_get'),
    edge('paciente', 'registrar'),
    drop('registrar', 'api_post'),
    edge('registrar', 'detalle'),
    drop('detalle', 'api_detail'),
    edge('detalle', 'paginar'),
    drop('paginar', 'api_list'),
  ];
  w.mainPath = ['entrada', 'paciente', 'registrar', 'detalle', 'paginar'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Datos que consume',
      items: [
        'Pacientes: GET /patients. Citas del paciente: GET /appointments?patient_id=…',
        'Registros: GET /clinical-history con paginación y GET /clinical-history/{id}.',
      ],
    },
    {
      dot: 'rose',
      title: 'Escritura',
      items: [
        'POST /clinical-history requiere clinical_history.create.',
        'Los errores 422 se muestran por campo.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 14. Módulo: odontograma                                             */
/* ------------------------------------------------------------------ */
function odontogramFlow() {
  const w = workflow('odontograma', 'Módulo: odontograma');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de odontograma' },
    { id: 'api', label: 'API clínica y catálogos' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Odontograma', '/odontograma · odontogram.view'),
    node('paciente', 'ui', 1, 'frontend', 'Selección de paciente', 'búsqueda y chips'),
    node('pieza', 'ui', 2, 'frontend', 'Selección de pieza FDI', 'superficies o diente completo'),
    node('cups', 'ui', 3, 'frontend', 'Búsqueda CUPS', 'código o palabras'),
    node('guardar', 'ui', 4, 'frontend', 'Registrar hallazgo', 'odontogram.create'),
    node('api_catalogos', 'api', 0, 'backend', 'GET /odontogram/catalogs', 'odontogram.view'),
    node('api_get', 'api', 1, 'backend', 'GET /patients'),
    node('api_actual', 'api', 2, 'backend', 'GET /odontogram/{patient_id}'),
    node('api_cups', 'api', 3, 'backend', 'GET /catalogs/cups'),
    node('api_post', 'api', 4, 'backend', 'POST /odontogram'),
  ];
  w.edges = [
    drop('entrada', 'api_catalogos', { label: 'carga del catálogo' }),
    edge('entrada', 'paciente'),
    drop('paciente', 'api_get'),
    edge('paciente', 'pieza'),
    drop('pieza', 'api_actual'),
    edge('pieza', 'cups'),
    drop('cups', 'api_cups', { label: 'dental_only=true' }),
    edge('cups', 'guardar'),
    drop('guardar', 'api_post'),
  ];
  w.mainPath = ['entrada', 'paciente', 'pieza', 'cups', 'guardar'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Catálogo odontológico',
      items: [
        'GET /odontogram/catalogs (odontogram.view) carga hallazgos y procedimientos al abrir el módulo.',
        'procedure_code usa el código interno; el CUPS seleccionado se envía aparte en cups_code.',
      ],
    },
    {
      dot: 'cyan',
      title: 'Búsqueda CUPS',
      items: [
        'GET /catalogs/cups?q=…&dental_only=true&limit=20; q exige 2–100 caracteres.',
        'El detalle del código usa GET /catalogs/cups/{code}.',
      ],
    },
    {
      dot: 'amber',
      title: 'Hallazgos e historial',
      items: [
        'Estado actual: GET /odontogram/{patient_id}.',
        'Historial: GET /odontogram/{patient_id}/history?tooth_fdi=…',
        'procedure_code y cups_code forman un par; cups_code solo se envía con procedimiento.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 15. Módulo: facturación (marcador)                                  */
/* ------------------------------------------------------------------ */
function billingFlow() {
  const w = workflow('facturacion', 'Módulo: facturación y pagos (pendiente)');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de facturación' },
    { id: 'integracion', label: 'Integración pendiente', variant: 'exception' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Facturación y pagos', '/facturacion · billing.view'),
    node('aviso', 'ui', 1, 'security', 'Aviso de integración', 'ModuleApiNotice'),
    node('filtros', 'ui', 2, 'frontend', 'Búsqueda y filtros', 'solo interfaz'),
    node('tabla', 'ui', 3, 'frontend', 'Tabla y detalle', 'vacíos'),
    node('pendiente', 'integracion', 3, 'external', 'Sin API financiera', 'pendiente de integración'),
  ];
  w.edges = [
    edge('entrada', 'aviso'),
    edge('aviso', 'filtros'),
    edge('filtros', 'tabla'),
    drop('tabla', 'pendiente', { label: 'no hay endpoint' }),
  ];
  w.mainPath = ['entrada', 'aviso', 'filtros', 'tabla'];
  w.cards = [
    {
      dot: 'rose',
      title: 'Pendiente de integración',
      items: [
        'No hay endpoints financieros en el contrato actual.',
        'No se calculan ingresos ni saldos y no se registran pagos.',
        'Registrar pago y los filtros de estado están deshabilitados.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 16. Módulo: notificaciones                                          */
/* ------------------------------------------------------------------ */
function notificationsFlow() {
  const w = workflow('notificaciones', 'Módulo: notificaciones');
  w.lanes = [
    { id: 'ui', label: 'Pantalla de notificaciones' },
    { id: 'api', label: 'API de notificaciones' },
  ];
  w.nodes = [
    node('entrada', 'ui', 0, 'frontend', 'Notificaciones', '/notificaciones · notifications.view'),
    node('filtro', 'ui', 1, 'frontend', 'Todas / sin leer', 'unread_only'),
    node('lista', 'ui', 2, 'frontend', 'Listado y detalle', 'panel lateral'),
    node('marcar', 'ui', 3, 'frontend', 'Marcar como leída', 'acción por notificación'),
    node('crear', 'ui', 4, 'frontend', 'Nueva notificación', 'notifications.create'),
    node('api_get', 'api', 2, 'backend', 'GET /notifications'),
    node('api_patch', 'api', 3, 'backend', 'PATCH /notifications/{id}/read'),
    node('api_post', 'api', 4, 'backend', 'POST /notifications'),
  ];
  w.edges = [
    edge('entrada', 'filtro'),
    edge('filtro', 'lista'),
    drop('lista', 'api_get'),
    edge('lista', 'marcar'),
    drop('marcar', 'api_patch'),
    edge('marcar', 'crear'),
    drop('crear', 'api_post'),
  ];
  w.mainPath = ['entrada', 'filtro', 'lista', 'marcar', 'crear'];
  w.cards = [
    {
      dot: 'cyan',
      title: 'Datos que consume',
      items: [
        'Listado: GET /notifications con unread_only, limit y offset.',
        'Destinatario: GET /users para elegir el usuario.',
      ],
    },
    {
      dot: 'amber',
      title: 'Lectura',
      items: [
        'Marcar leída: PATCH /notifications/{id}/read y actualiza el detalle.',
        'El indicador de no leídas se calcula con la página cargada.',
      ],
    },
  ];
  return w;
}

/* ------------------------------------------------------------------ */
/* 17. Resumen para diapositivas                                       */
/* ------------------------------------------------------------------ */
function slideSummary() {
  const w = workflow('navegacion-odonty-resumen', 'Odonty · navegación por grupos', { preset: 'blueprint' });
  w.lanes = [
    { id: 'publicas', label: 'Públicas' },
    { id: 'sesion', label: 'Sesión' },
    { id: 'admin', label: 'Administración' },
    { id: 'clinicos', label: 'Módulos clínicos' },
    { id: 'seguridad', label: 'Redirecciones de seguridad', variant: 'exception' },
  ];
  w.nodes = [
    node('publicas_n', 'publicas', 0, 'frontend', 'Públicas', 'Sin sesión · login y registro'),
    node('sesion_n', 'sesion', 1, 'frontend', 'Sesión', 'Todos los roles'),
    node('admin_n', 'admin', 2, 'frontend', 'Administración', 'Super admin · Admin'),
    node('clinicos_n', 'clinicos', 3, 'frontend', 'Módulos clínicos', 'Según permiso del rol'),
    node('login', 'seguridad', 1, 'security', 'Inicio de sesión', 'sin sesión'),
    node('denegado', 'seguridad', 2, 'security', 'Acceso denegado', 'sin permiso'),
    node('noexiste', 'seguridad', 3, 'security', '404', 'ruta desconocida'),
  ];
  w.edges = [
    edge('publicas_n', 'sesion_n', { label: 'credenciales válidas' }),
    edge('sesion_n', 'admin_n', { label: 'rol administrador' }),
    edge('sesion_n', 'clinicos_n', { label: 'permiso del módulo' }),
    edge('sesion_n', 'login', { label: 'sesión expirada' }),
    edge('admin_n', 'denegado', { label: 'sin permiso' }),
    edge('clinicos_n', 'noexiste', { label: 'ruta desconocida' }),
  ];
  w.mainPath = ['publicas_n', 'sesion_n', 'clinicos_n'];
  w.cards = [];
  return w;
}

/* ------------------------------------------------------------------ */

const FLOWS = [
  generalNavigation(),
  guardsAndExceptions(),
  slideSummary(),
  loginFlow(),
  recoveryFlow(),
  clinicRegistrationFlow(),
  passwordChangeFlow(),
  usersFlow(),
  rolesFlow(),
  auditFlow(),
  clinicsFlow(),
  patientsFlow(),
  appointmentsFlow(),
  clinicalHistoryFlow(),
  odontogramFlow(),
  billingFlow(),
  notificationsFlow(),
];

function assertUniqueIds(w) {
  const seen = new Set();
  for (const n of w.nodes) {
    if (seen.has(n.id)) throw new Error(`${w.meta.title}: id duplicado ${n.id}`);
    seen.add(n.id);
  }
  const laneIds = new Set(w.lanes.map((l) => l.id));
  for (const n of w.nodes) {
    if (!laneIds.has(n.lane)) throw new Error(`${w.meta.title}: lane desconocido ${n.lane}`);
    if (n.col < 0 || n.col > 5) throw new Error(`${w.meta.title}: col fuera de rango ${n.id}`);
  }
  for (const e of w.edges) {
    if (!seen.has(e.from) || !seen.has(e.to)) throw new Error(`${w.meta.title}: arista rota ${e.from}->${e.to}`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
for (const flow of FLOWS) {
  assertUniqueIds(flow);
  const name = flow.meta.output.split('/').pop().replace('.workflow.html', '');
  const file = join(OUT_DIR, `${name}.workflow.json`);
  writeFileSync(file, `${JSON.stringify(flow, null, 2)}\n`, 'utf8');
  console.log(`ok ${name}.workflow.json — ${flow.nodes.length} nodos, ${flow.edges.length} aristas`);
}
console.log(`\n${FLOWS.length} diagramas generados en docs/diagramas/`);

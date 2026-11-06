import { PERMISSIONS, ROLES } from '../utils/permissions.js';

// Accesos clínicos propuestos para el frontend; el contrato actual no define estos permisos.
export const CLINICAL_MODULES = [
  { id: 'pacientes', label: 'Pacientes', path: '/pacientes', icon: 'users', description: 'Consulta y administración de pacientes.', permission: PERMISSIONS.PATIENTS_VIEW },
  { id: 'citas', label: 'Citas y agenda', path: '/citas', icon: 'calendar', description: 'Agenda de citas de la clínica.', permission: PERMISSIONS.APPOINTMENTS_VIEW },
  { id: 'historia', label: 'Historia clínica', path: '/historia-clinica', icon: 'file-text', description: 'Consulta de antecedentes y evolución clínica.', permission: PERMISSIONS.CLINICAL_HISTORY_VIEW },
  { id: 'odontograma', label: 'Odontograma', path: '/odontograma', icon: 'tooth', description: 'Consulta visual de piezas dentales.', permission: PERMISSIONS.ODONTOGRAM_VIEW },
  { id: 'facturacion', label: 'Facturación y pagos', path: '/facturacion', icon: 'credit-card', description: 'Consulta de facturas y pagos.', permission: PERMISSIONS.BILLING_VIEW },
  { id: 'notificaciones', label: 'Notificaciones', path: '/notificaciones', icon: 'bell', description: 'Centro de notificaciones del sistema.', permission: PERMISSIONS.NOTIFICATIONS_VIEW },
];

// Secciones disponibles. `permission` decide la visibilidad (el backend sigue siendo la autoridad).
export const NAV_SECTIONS = [
  {
    id: 'main',
    title: null,
    items: [{ id: 'home', label: 'Inicio', path: '/', icon: 'home', end: true }],
  },
  {
    id: 'admin',
    title: 'Administración',
    items: [
      { id: 'users', label: 'Usuarios', path: '/usuarios', icon: 'users', permission: PERMISSIONS.USERS_VIEW },
      { id: 'roles', label: 'Roles y permisos', path: '/roles', icon: 'shield-check', permission: PERMISSIONS.USERS_VIEW },
      { id: 'audit', label: 'Auditoría', path: '/auditoria', icon: 'audit', permission: PERMISSIONS.AUDIT_VIEW },
      { id: 'clinics', label: 'Clínicas', path: '/clinicas', icon: 'home', permission: PERMISSIONS.CLINICS_REVIEW, role: ROLES.SUPER_ADMIN },
    ],
  },
];

const TITLES = [
  ['/usuarios/nuevo', 'Crear trabajador'],
  ['/usuarios', 'Usuarios'],
  ['/roles', 'Roles y permisos'],
  ['/auditoria', 'Auditoría'],
  ['/clinicas', 'Revisión de clínicas'],
  ['/configuracion', 'Configuración de la cuenta'],
  ...CLINICAL_MODULES.map((m) => [m.path, m.label]),
];

export function getSectionTitle(pathname) {
  if (pathname === '/') return 'Inicio';
  const match = TITLES.find(([path]) => pathname === path || pathname === `${path}/`);
  return match ? match[1] : 'Odonty';
}

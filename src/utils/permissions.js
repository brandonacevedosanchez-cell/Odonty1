// Autorización centralizada del frontend.
// IMPORTANTE: esto solo controla qué se muestra. El backend es siempre la autoridad.

import { ASSIGNABLE_USER_ROLES, ROLES } from '../constants/apiValues.js';

export { ROLES };

export const PERMISSIONS = Object.freeze({
  // Administración
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_MANAGE_ROLE: 'users.manage_role',
  USERS_MANAGE_ACTIVE: 'users.manage_active',
  AUDIT_VIEW: 'audit.view',
  CLINICS_REVIEW: 'clinics.review',
  // Pacientes
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_EDIT: 'patients.edit',
  // Citas
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  // Historia clínica
  CLINICAL_HISTORY_VIEW: 'clinical_history.view',
  CLINICAL_HISTORY_CREATE: 'clinical_history.create',
  // Odontograma
  ODONTOGRAM_VIEW: 'odontogram.view',
  ODONTOGRAM_CREATE: 'odontogram.create',
  // Facturación (sin endpoints en el catálogo actual)
  BILLING_VIEW: 'billing.view',
  // Notificaciones
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_CREATE: 'notifications.create',
  // Capacidades self-service del rol usuario (solo UI; el backend las expone con Bearer)
  PATIENTS_SELF: 'patients.self',
  CLINICAL_HISTORY_SELF: 'clinical_history.self',
});

// El bypass queda desactivado por defecto para respetar los roles. Solo se puede
// activar explícitamente con VITE_PERMISSION_BYPASS=true en desarrollo.
const FRONTEND_PERMISSION_BYPASS = import.meta.env?.VITE_PERMISSION_BYPASS === 'true';

export const PERMISSION_LABELS = {
  [PERMISSIONS.USERS_VIEW]: 'Ver usuarios',
  [PERMISSIONS.USERS_CREATE]: 'Crear usuarios',
  [PERMISSIONS.USERS_EDIT]: 'Editar usuarios',
  [PERMISSIONS.USERS_MANAGE_ROLE]: 'Cambiar roles',
  [PERMISSIONS.USERS_MANAGE_ACTIVE]: 'Activar/desactivar cuentas',
  [PERMISSIONS.AUDIT_VIEW]: 'Consultar auditoría',
  [PERMISSIONS.CLINICS_REVIEW]: 'Revisar clínicas',
  [PERMISSIONS.PATIENTS_VIEW]: 'Consultar pacientes',
  [PERMISSIONS.PATIENTS_CREATE]: 'Registrar pacientes',
  [PERMISSIONS.PATIENTS_EDIT]: 'Editar pacientes',
  [PERMISSIONS.APPOINTMENTS_VIEW]: 'Consultar citas y agenda',
  [PERMISSIONS.APPOINTMENTS_CREATE]: 'Crear citas',
  [PERMISSIONS.APPOINTMENTS_EDIT]: 'Reprogramar, cancelar y cambiar estado de citas',
  [PERMISSIONS.CLINICAL_HISTORY_VIEW]: 'Consultar historia clínica',
  [PERMISSIONS.CLINICAL_HISTORY_CREATE]: 'Registrar consultas clínicas',
  [PERMISSIONS.ODONTOGRAM_VIEW]: 'Consultar odontograma',
  [PERMISSIONS.ODONTOGRAM_CREATE]: 'Registrar hallazgos del odontograma',
  [PERMISSIONS.BILLING_VIEW]: 'Consultar facturación y pagos',
  [PERMISSIONS.NOTIFICATIONS_VIEW]: 'Consultar notificaciones',
  [PERMISSIONS.NOTIFICATIONS_CREATE]: 'Crear notificaciones',
  [PERMISSIONS.PATIENTS_SELF]: 'Mi perfil de paciente',
  [PERMISSIONS.CLINICAL_HISTORY_SELF]: 'Mi historia clínica',
};

// Matriz de referencia del frontend. El backend conserva la autorización final.
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_MANAGE_ROLE,
    PERMISSIONS.USERS_MANAGE_ACTIVE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.CLINICS_REVIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_CREATE,
    PERMISSIONS.ODONTOGRAM_VIEW,
    PERMISSIONS.ODONTOGRAM_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_CREATE,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_MANAGE_ROLE,
    PERMISSIONS.USERS_MANAGE_ACTIVE,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_CREATE,
    PERMISSIONS.ODONTOGRAM_VIEW,
    PERMISSIONS.ODONTOGRAM_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_CREATE,
  ],
  [ROLES.ODONTOLOGO]: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_CREATE,
    PERMISSIONS.ODONTOGRAM_VIEW,
    PERMISSIONS.ODONTOGRAM_CREATE,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
  [ROLES.RECEPCIONISTA]: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
  [ROLES.USUARIO]: [
    PERMISSIONS.PATIENTS_SELF,
    PERMISSIONS.CLINICAL_HISTORY_SELF,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Superadministrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.ODONTOLOGO]: 'Odontólogo',
  [ROLES.RECEPCIONISTA]: 'Recepcionista',
  [ROLES.USUARIO]: 'Usuario',
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]:
    'Todos los permisos: administra usuarios, revisa clínicas, consulta la auditoría y accede a los módulos clínicos de todas las clínicas.',
  [ROLES.ADMIN]:
    'Administra usuarios de su clínica y accede a pacientes, citas, historia clínica, odontograma, facturación y notificaciones.',
  [ROLES.ODONTOLOGO]:
    'Acceso a pacientes, agenda, historia clínica y odontograma. Puede registrar consultas y hallazgos clínicos.',
  [ROLES.RECEPCIONISTA]:
    'Acceso a pacientes, agenda, facturación y notificaciones. Puede registrar pacientes y gestionar citas.',
  [ROLES.USUARIO]:
    'Acceso a su perfil de paciente, su historia clínica y sus notificaciones.',
};

export const ALL_ROLES = Object.values(ROLES);

export const roleLabel = (role) => ROLE_LABELS[role] ?? role ?? '—';

export function getPermissions(user) {
  return ROLE_PERMISSIONS[user?.role_name] ?? [];
}

export function can(user, permission) {
  if (!user) return false;
  if (FRONTEND_PERMISSION_BYPASS) return Object.values(PERMISSIONS).includes(permission);
  return getPermissions(user).includes(permission);
}

export function canAny(user, permissions) {
  return permissions.some((permission) => can(user, permission));
}

/** Roles que el usuario puede asignar al crear o cambiar roles (el super_admin nunca se asigna). */
export function assignableRoles(user) {
  if (user?.role_name === ROLES.SUPER_ADMIN) {
    return [...ASSIGNABLE_USER_ROLES];
  }
  if (user?.role_name === ROLES.ADMIN) {
    return ASSIGNABLE_USER_ROLES.filter((role) => role !== ROLES.ADMIN);
  }
  return [];
}

/**
 * Indica si `actor` puede intentar cambiar el rol de `target`.
 * Devuelve { allowed, reason } para poder explicar por qué se bloquea la acción.
 */
export function roleChangeAccess(actor, target) {
  if (!can(actor, PERMISSIONS.USERS_MANAGE_ROLE)) {
    return { allowed: false, reason: 'No tienes permiso para cambiar roles.' };
  }
  if (!actor || !target) return { allowed: false, reason: 'Usuario no disponible.' };
  if (actor.id === target.id) {
    return { allowed: false, reason: 'No puedes cambiar tu propio rol.' };
  }
  if (target.role_name === ROLES.SUPER_ADMIN) {
    return { allowed: false, reason: 'No se puede modificar el rol del superadministrador.' };
  }
  if (actor.role_name === ROLES.ADMIN && target.role_name === ROLES.ADMIN) {
    return { allowed: false, reason: 'Un administrador no puede modificar a otro administrador.' };
  }
  return { allowed: true, reason: '' };
}

/** Roles disponibles para el cambio de rol de `target` (excluye su rol actual). */
export function roleOptionsFor(actor, target) {
  return assignableRoles(actor).filter((role) => role !== target?.role_name);
}

// Autorización centralizada del frontend.
// IMPORTANTE: esto solo controla qué se muestra. El backend es siempre la autoridad.

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ODONTOLOGO: 'odontologo',
  RECEPCIONISTA: 'recepcionista',
  USUARIO: 'usuario',
});

export const PERMISSIONS = Object.freeze({
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_MANAGE_ROLE: 'users.manage_role',
  AUDIT_VIEW: 'audit.view',
  CLINICS_REVIEW: 'clinics.review',
  PATIENTS_VIEW: 'patients.view',
  APPOINTMENTS_VIEW: 'appointments.view',
  CLINICAL_HISTORY_VIEW: 'clinical_history.view',
  ODONTOGRAM_VIEW: 'odontogram.view',
  BILLING_VIEW: 'billing.view',
  NOTIFICATIONS_VIEW: 'notifications.view',
});

// Bypass temporal de permisos del frontend para facilitar la visualización de los módulos.
// La autenticación sigue siendo obligatoria y el backend conserva la autorización final.
const FRONTEND_PERMISSION_BYPASS = true;

export const PERMISSION_LABELS = {
  [PERMISSIONS.USERS_VIEW]: 'Ver usuarios',
  [PERMISSIONS.USERS_CREATE]: 'Crear usuarios',
  [PERMISSIONS.USERS_MANAGE_ROLE]: 'Cambiar roles',
  [PERMISSIONS.AUDIT_VIEW]: 'Consultar auditoría',
  [PERMISSIONS.CLINICS_REVIEW]: 'Revisar clínicas',
  [PERMISSIONS.PATIENTS_VIEW]: 'Consultar pacientes',
  [PERMISSIONS.APPOINTMENTS_VIEW]: 'Consultar citas y agenda',
  [PERMISSIONS.CLINICAL_HISTORY_VIEW]: 'Consultar historia clínica',
  [PERMISSIONS.ODONTOGRAM_VIEW]: 'Consultar odontograma',
  [PERMISSIONS.BILLING_VIEW]: 'Consultar facturación y pagos',
  [PERMISSIONS.NOTIFICATIONS_VIEW]: 'Consultar notificaciones',
};

// Roles administrativos según el contrato y accesos clínicos aprobados para la interfaz.
// Los permisos clínicos aún requieren validación equivalente en el backend.
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_MANAGE_ROLE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.CLINICS_REVIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.ODONTOGRAM_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_MANAGE_ROLE,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.ODONTOGRAM_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
  [ROLES.ODONTOLOGO]: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.ODONTOGRAM_VIEW,
  ],
  [ROLES.RECEPCIONISTA]: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.BILLING_VIEW,
  ],
  [ROLES.USUARIO]: [PERMISSIONS.NOTIFICATIONS_VIEW],
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
    'Todos los permisos: ver y crear usuarios, cambiar roles y consultar la auditoría. Es el único que puede crear administradores. Tiene acceso a los seis módulos clínicos propuestos.',
  [ROLES.ADMIN]:
    'Ver usuarios, crear usuarios y cambiar roles. Solo puede crear o asignar odontólogo, recepcionista y usuario. Tiene acceso a los seis módulos clínicos propuestos.',
  [ROLES.ODONTOLOGO]: 'Acceso propuesto a pacientes, citas, historia clínica y odontograma.',
  [ROLES.RECEPCIONISTA]: 'Acceso propuesto a pacientes, citas y facturación.',
  [ROLES.USUARIO]: 'Acceso propuesto al centro de notificaciones.',
};

export const ALL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ODONTOLOGO, ROLES.RECEPCIONISTA, ROLES.USUARIO];

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
    return [ROLES.ADMIN, ROLES.ODONTOLOGO, ROLES.RECEPCIONISTA, ROLES.USUARIO];
  }
  if (user?.role_name === ROLES.ADMIN) {
    return [ROLES.ODONTOLOGO, ROLES.RECEPCIONISTA, ROLES.USUARIO];
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

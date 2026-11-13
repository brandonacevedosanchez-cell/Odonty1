export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ODONTOLOGO: 'odontologo',
  RECEPCIONISTA: 'recepcionista',
});

/**
 * Roles asignables desde la interfaz. El contrato del 13-nov-2026 todavía acepta
 * `usuario` en UserCreateIn/RoleChangeIn, pero recomienda no usarlo: los pacientes
 * ya no son usuarios del sistema.
 */
export const ASSIGNABLE_USER_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.ODONTOLOGO,
  ROLES.RECEPCIONISTA,
]);

export const PATIENT_DOCUMENT_TYPES = Object.freeze(['TI', 'CC', 'CE', 'PA']);
export const PATIENT_DOCUMENT_TYPE_DEFAULT = 'CC';
export const PATIENT_DOCUMENT_NUMBER_PATTERN = /^[0-9]{6,10}$/;

/** `gender` está validado por el backend con ^(Masculino|Femenino)$. */
export const PATIENT_GENDERS = Object.freeze(['Masculino', 'Femenino']);

export const PATIENT_BLOOD_TYPES = Object.freeze([
  'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
]);

export const PATIENT_ALERT_MAX_LENGTH = 1000;
export const PATIENT_ADDRESS_MAX_LENGTH = 255;
export const PATIENT_EPS_MAX_LENGTH = 100;
export const PATIENT_GUARDIAN_RELATIONSHIP_MAX_LENGTH = 50;
export const PATIENT_MINOR_AGE = 18;

/** Límites del buscador CUPS (GET /catalogs/cups). */
export const CUPS_QUERY_MIN_LENGTH = 2;
export const CUPS_QUERY_MAX_LENGTH = 100;
export const CUPS_LIMIT_MAX = 50;
export const CUPS_LIMIT_DEFAULT = 20;

export const APPOINTMENT_ORIGINS = Object.freeze(['presencial', 'llamada', 'whatsapp']);
export const APPOINTMENT_STATUS_ACTIONS = Object.freeze(['confirmada', 'atendida', 'no_asistio']);

export const APPOINTMENT_STATUS_LABELS = Object.freeze({
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
});

export const APPOINTMENT_REASON_MIN_LENGTH = 3;
export const CANCELLATION_REASON_MIN_LENGTH = 3;
export const CLINICAL_TEXT_MIN_LENGTH = 3;
export const NOTIFICATION_TYPE_MIN_LENGTH = 2;
export const NOTIFICATION_TYPE_MAX_LENGTH = 40;
export const NOTIFICATION_TITLE_MIN_LENGTH = 3;
export const NOTIFICATION_TITLE_MAX_LENGTH = 150;
export const NOTIFICATION_MESSAGE_MIN_LENGTH = 3;

export const TOOTH_SURFACES = Object.freeze([
  'vestibular',
  'lingual_palatino',
  'mesial',
  'distal',
  'oclusal',
]);

export const API_LIST_LIMIT_MAX = 200;

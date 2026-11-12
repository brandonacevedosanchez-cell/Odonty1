export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ODONTOLOGO: 'odontologo',
  RECEPCIONISTA: 'recepcionista',
  USUARIO: 'usuario',
});

export const ASSIGNABLE_USER_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.ODONTOLOGO,
  ROLES.RECEPCIONISTA,
  ROLES.USUARIO,
]);

export const PATIENT_DOCUMENT_TYPES = Object.freeze(['TI', 'CC', 'CE', 'PA']);
export const PATIENT_DOCUMENT_NUMBER_PATTERN = /^[0-9]{6,10}$/;

/**
 * El contrato no fija un enum para `gender` (solo máx. 20 caracteres).
 * La UI envía el texto completo para que el dato sea legible en el backend.
 */
export const PATIENT_GENDERS = Object.freeze(['Masculino', 'Femenino']);

export const PATIENT_BLOOD_TYPES = Object.freeze([
  'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
]);

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

import { buildQuery, request, requestPaginated } from './apiClient.js';
import { clampApiListLimit, clampApiListOffset } from '../utils/pagination.js';

/**
 * Capa de servicios de /patients según el contrato del 13-nov-2026.
 * Los pacientes no son usuarios: no tienen cuenta, contraseña ni login, y
 * pertenecen a una única clínica. El documento es único por clínica.
 *
 * @typedef {Object} PatientOut
 * @property {number} id
 * @property {number} clinic_id
 * @property {string} full_name
 * @property {string} document_type
 * @property {string} document_number
 * @property {string} email
 * @property {string} phone_number
 * @property {string|null} birth_date
 * @property {boolean} is_minor
 * @property {string|null} gender
 * @property {string|null} blood_type
 * @property {string|null} address
 * @property {string|null} eps
 * @property {string|null} guardian_full_name
 * @property {string|null} guardian_document_number
 * @property {string|null} guardian_phone
 * @property {string|null} guardian_relationship
 * @property {string|null} emergency_contact_name
 * @property {string|null} emergency_contact_phone
 * @property {string|null} allergies
 * @property {string|null} current_medications
 * @property {string|null} medical_conditions
 * @property {string|null} notes
 *
 * @typedef {Object} PatientCheckOut
 * @property {boolean} exists
 * @property {number|null} patient_id
 * @property {string|null} full_name
 *
 * @typedef {Object} PatientAlertsOut
 * @property {number} patient_id
 * @property {string} full_name
 * @property {string|null} allergies
 * @property {string|null} current_medications
 * @property {string|null} medical_conditions
 * @property {boolean} has_alerts
 */

/** Campos clínicos compartidos por PatientCreateIn y PatientUpdateIn. */
export const PATIENT_CLINICAL_FIELDS = Object.freeze([
  'document_type',
  'birth_date',
  'gender',
  'blood_type',
  'address',
  'eps',
  'guardian_full_name',
  'guardian_document_number',
  'guardian_phone',
  'guardian_relationship',
  'emergency_contact_name',
  'emergency_contact_phone',
  'allergies',
  'current_medications',
  'medical_conditions',
  'notes',
]);

/** PatientCreateIn: datos obligatorios + campos clínicos. */
export const PATIENT_CREATE_FIELDS = Object.freeze([
  'full_name',
  'email',
  'document_number',
  'phone_number',
  ...PATIENT_CLINICAL_FIELDS,
]);

/** PatientUpdateIn permite editar también los datos personales. */
export const PATIENT_UPDATE_FIELDS = Object.freeze([
  'full_name',
  'email',
  'document_number',
  'phone_number',
  ...PATIENT_CLINICAL_FIELDS,
]);

/** Omite undefined/null/vacíos (para crear). */
const clean = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

/** En PATCH los campos vacíos se envían como null para poder limpiarlos. */
const cleanNullable = (payload) =>
  Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value]),
  );

const pick = (payload, fields) =>
  Object.fromEntries(fields.filter((field) => field in payload).map((field) => [field, payload[field]]));

const normalize = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Construye el cuerpo de PATCH /patients/{id} con solo los campos que cambiaron.
 * Los campos opcionales vaciados se envían como null.
 */
export function buildPatientUpdate(original, values) {
  const body = {};
  for (const field of PATIENT_UPDATE_FIELDS) {
    if (!(field in values)) continue;
    const previous = normalize(original?.[field]) ?? '';
    const next = normalize(values[field]) ?? '';
    if (previous === next) continue;
    body[field] = next === '' ? null : next;
  }
  return body;
}

/** GET /patients/check (permiso patients.create). Devuelve PatientCheckOut. */
export const checkPatient = ({ documentNumber, documentType = 'CC' }) =>
  request(
    `/patients/check${buildQuery({
      document_type: documentType,
      document_number: documentNumber,
    })}`,
  );

/** GET /patients (permiso patients.view). Devuelve { data, total }. */
export const listPatients = ({ search = '', limit = 50, offset = 0 } = {}) =>
  requestPaginated(`/patients${buildQuery({
    search,
    limit: clampApiListLimit(limit),
    offset: clampApiListOffset(offset),
  })}`);

/** GET /patients/{id} (permiso patients.view). */
export const getPatient = (patientId) => request(`/patients/${encodeURIComponent(patientId)}`);

/** GET /patients/{patient_id}/alerts (permiso patients.view). */
export const getPatientAlerts = (patientId) =>
  request(`/patients/${encodeURIComponent(patientId)}/alerts`);

/** POST /patients (permiso patients.create). Body: PatientCreateIn. */
export const createPatient = (payload) =>
  request('/patients', {
    method: 'POST',
    body: clean(pick(payload, PATIENT_CREATE_FIELDS)),
  });

/** PATCH /patients/{id} (permiso patients.edit). Body: solo los campos que cambian. */
export const updatePatient = (patientId, payload) =>
  request(`/patients/${encodeURIComponent(patientId)}`, {
    method: 'PATCH',
    body: cleanNullable(pick(payload, PATIENT_UPDATE_FIELDS)),
  });

/** Extrae el id del 409 "Ya existe un paciente con ese documento en esta clinica (id=…)". */
export function extractPatientIdFromConflict(message) {
  const match = String(message ?? '').match(/\(id=(\d+)\)/i);
  return match ? Number(match[1]) : null;
}

/** Indica si PatientOut/PatientAlertsOut trae al menos una alerta médica. */
export function hasMedicalAlerts(patient) {
  return ['allergies', 'current_medications', 'medical_conditions'].some(
    (field) => String(patient?.[field] ?? '').trim() !== '',
  );
}

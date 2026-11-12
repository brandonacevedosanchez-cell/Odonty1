import { buildQuery, request, requestPaginated } from './apiClient.js';
import { clampApiListLimit } from '../utils/pagination.js';

/**
 * Capa de servicios de /patients. Contrato: docs/openapi.json
 * (PatientRegisterIn, PatientCreateIn, PatientUpdateIn, PatientOut, PatientCheckOut).
 *
 * @typedef {Object} PatientOut
 * @property {number} id
 * @property {number} user_id
 * @property {string} full_name
 * @property {string} email
 * @property {string} document_number
 * @property {string} document_type
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
 * @property {string|null} notes
 *
 * @typedef {Object} PatientCheckOut
 * @property {boolean} user_exists
 * @property {number|null} user_id
 * @property {string|null} full_name
 * @property {string|null} email
 * @property {string|null} document_number
 * @property {boolean} has_patient_profile
 * @property {boolean} same_clinic
 */

/** Campos clínicos compartidos por PatientCreateIn, PatientRegisterIn y PatientUpdateIn. */
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
  'notes',
]);

/** PatientRegisterIn = datos obligatorios del usuario + campos clínicos opcionales. */
export const PATIENT_REGISTER_FIELDS = Object.freeze([
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

/** GET /patients/check (permiso patients.create). Devuelve PatientCheckOut. */
export const checkPatient = ({ email, documentNumber }) =>
  request(`/patients/check${buildQuery({ email, document_number: documentNumber })}`);

/** GET /patients (permiso patients.view). Devuelve { data, total }. */
export const listPatients = ({ search = '', limit = 20, offset = 0 } = {}) =>
  requestPaginated(`/patients${buildQuery({ search, limit: clampApiListLimit(limit), offset })}`);

/** GET /patients/{id} (permiso patients.view). */
export const getPatient = (patientId) => request(`/patients/${encodeURIComponent(patientId)}`);

/** POST /patients (permiso patients.create). Body: PatientRegisterIn. */
export const createPatient = (payload) =>
  request('/patients', {
    method: 'POST',
    body: clean(pick(payload, PATIENT_REGISTER_FIELDS)),
  });

/**
 * Vincula un paciente que ya existe como usuario en otra clínica.
 *
 * El contrato actual (docs/openapi.json) no publica un endpoint dedicado para
 * vincular pacientes entre clínicas. La única vía disponible es POST /patients
 * con PatientRegisterIn, que crea el perfil del paciente en la clínica actual.
 * Si el backend agrega un endpoint específico, reemplazar esta función.
 */
export const linkPatient = (payload) => createPatient(payload);

/** PATCH /patients/{id} (permiso patients.edit). Body: PatientUpdateIn. */
export const updatePatient = (patientId, payload) =>
  request(`/patients/${encodeURIComponent(patientId)}`, {
    method: 'PATCH',
    body: cleanNullable(pick(payload, PATIENT_CLINICAL_FIELDS)),
  });

/** POST /patients/me (Bearer). Body: PatientCreateIn. */
export const createMyPatientProfile = (payload) =>
  request('/patients/me', {
    method: 'POST',
    body: clean(pick(payload, PATIENT_CLINICAL_FIELDS)),
  });

/** GET /patients/me (Bearer). */
export const getMyPatientProfile = () => request('/patients/me');

/** PATCH /patients/me (Bearer). Body: PatientUpdateIn. */
export const updateMyPatientProfile = (payload) =>
  request('/patients/me', {
    method: 'PATCH',
    body: cleanNullable(pick(payload, PATIENT_CLINICAL_FIELDS)),
  });

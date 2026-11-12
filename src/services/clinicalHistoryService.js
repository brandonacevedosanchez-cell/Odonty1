import { buildQuery, request, requestPaginated } from './apiClient.js';
import { clampApiListLimit } from '../utils/pagination.js';

/**
 * Capa de servicios de /clinical-history. Contrato: docs/openapi.json
 * (ClinicalEntryCreateIn, ClinicalEntryOut).
 *
 * @typedef {Object} ClinicalEntryOut
 * @property {number} id
 * @property {number} patient_id
 * @property {string} patient_name
 * @property {number} appointment_id
 * @property {number} dentist_id
 * @property {string} dentist_name
 * @property {string|null} antecedentes
 * @property {string} motivo_consulta
 * @property {string} examen
 * @property {string} diagnostico
 * @property {string} tratamiento
 * @property {string} created_at
 * @property {number|null} created_by
 * @property {string|null} created_by_name
 */

const clean = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

/** GET /clinical-history?patient_id=... (permiso clinical_history.view). Devuelve { data, total }. */
export const listClinicalHistory = ({ patientId, limit = 20, offset = 0 }) =>
  requestPaginated(`/clinical-history${buildQuery({ patient_id: patientId, limit: clampApiListLimit(limit), offset })}`);

/** GET /clinical-history/{entry_id} (permiso clinical_history.view). */
export const getClinicalEntry = (entryId) =>
  request(`/clinical-history/${encodeURIComponent(entryId)}`);

/**
 * POST /clinical-history (permiso clinical_history.create).
 * ClinicalEntryCreateIn: appointment_id obligatorio; antecedentes opcional;
 * motivo_consulta, examen, diagnostico y tratamiento obligatorios (mín. 3).
 * El paciente se deduce de la cita.
 */
export const createClinicalEntry = (payload) =>
  request('/clinical-history', {
    method: 'POST',
    body: clean({
      appointment_id: payload.appointment_id,
      antecedentes: payload.antecedentes,
      motivo_consulta: payload.motivo_consulta,
      examen: payload.examen,
      diagnostico: payload.diagnostico,
      tratamiento: payload.tratamiento,
    }),
  });

/** GET /clinical-history/me (Bearer). Historia del propio paciente, más reciente primero. */
export const getMyClinicalHistory = () => request('/clinical-history/me');

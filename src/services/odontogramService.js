import { buildQuery, request, requestPaginated } from './apiClient.js';
import { clampApiListLimit, clampApiListOffset } from '../utils/pagination.js';

/**
 * Capa de servicios de /odontogram. Contrato API: 13-nov-2026.
 * (OdontogramEntryCreateIn, OdontogramEntryOut, ToothSurface).
 *
 * `surface` es nullable: se envía como null para registrar el diente completo y,
 * cuando se informa, debe pertenecer a ToothSurface
 * (vestibular, lingual_palatino, mesial, distal, oclusal).
 *
 * @typedef {Object} OdontogramEntryOut
 * @property {number} id
 * @property {number} patient_id
 * @property {string} patient_name
 * @property {number} appointment_id
 * @property {number} dentist_id
 * @property {string} dentist_name
 * @property {number} tooth_fdi
 * @property {string|null} surface
 * @property {string|null} condition_code
 * @property {string|null} condition_name
 * @property {string|null} procedure_code
 * @property {string|null} procedure_name
 * @property {string|null} cups_code
 * @property {string|null} cups_name
 * @property {string|null} notes
 * @property {string} created_at
 * @property {number|null} created_by
 * @property {string|null} created_by_name
 */

const clean = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => (
      value !== undefined
      && value !== null
      && !(typeof value === 'string' && value.trim() === '')
    )),
  );

/** GET /odontogram/catalogs (permiso odontogram.view). Catálogos de hallazgos y procedimientos. */
export const getOdontogramCatalogs = () => request('/odontogram/catalogs');

/** GET /odontogram/{patient_id} (permiso odontogram.view). Estado actual por diente/superficie. */
export const getCurrentOdontogram = (patientId) =>
  request(`/odontogram/${encodeURIComponent(patientId)}`);

/** GET /odontogram/{patient_id}/history (permiso odontogram.view). Devuelve { data, total }. */
export const getOdontogramHistory = (patientId, { toothFdi, limit = 50, offset = 0 } = {}) =>
  requestPaginated(
    `/odontogram/${encodeURIComponent(patientId)}/history${buildQuery({
      tooth_fdi: toothFdi,
      limit: clampApiListLimit(limit),
      offset: clampApiListOffset(offset),
    })}`,
  );

/** POST /odontogram (permiso odontogram.create). Body: OdontogramEntryCreateIn. */
export const createOdontogramEntry = (payload) => {
  const procedureCode = String(payload.procedure_code ?? '').trim();
  const cupsCode = String(payload.cups_code ?? '').trim();
  const surface = String(payload.surface ?? '').trim();

  return request('/odontogram', {
    method: 'POST',
    body: {
      ...clean({
        appointment_id: payload.appointment_id,
        tooth_fdi: payload.tooth_fdi,
        condition_code: payload.condition_code,
        procedure_code: procedureCode || undefined,
        // El contrato solo admite cups_code cuando se registra un procedimiento.
        cups_code: procedureCode ? cupsCode || undefined : undefined,
        notes: payload.notes,
        surface: surface || undefined,
      }),
    },
  });
};

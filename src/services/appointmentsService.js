import {
  APPOINTMENT_ORIGINS as APPOINTMENT_ORIGIN_VALUES,
  APPOINTMENT_STATUS_LABELS,
} from '../constants/apiValues.js';
import { buildQuery, request } from './apiClient.js';

/**
 * Capa de servicios de /appointments. Contrato: docs/openapi.json
 * (AppointmentCreateIn, AppointmentRescheduleIn, AppointmentStatusIn, AppointmentOut).
 *
 * @typedef {Object} AppointmentOut
 * @property {number} id
 * @property {number} patient_id
 * @property {string} patient_name
 * @property {number} dentist_id
 * @property {string} dentist_name
 * @property {string} scheduled_date
 * @property {string} start_time
 * @property {string} end_time
 * @property {string} reason
 * @property {string} origin
 * @property {string} status
 * @property {string|null} cancellation_reason
 */

/** Estados permitidos por AppointmentStatusIn; cancelación usa /cancel. */
export { APPOINTMENT_STATUS_ACTIONS } from '../constants/apiValues.js';

/** Valores aceptados por AppointmentCreateIn.origin. */
export const APPOINTMENT_ORIGINS = Object.freeze(
  APPOINTMENT_ORIGIN_VALUES.map((value) => ({
    value,
    label: value === 'whatsapp' ? 'WhatsApp' : `${value[0].toUpperCase()}${value.slice(1)}`,
  })),
);

export const appointmentStatusLabel = (status) =>
  APPOINTMENT_STATUS_LABELS[status] ?? status ?? '—';

export const appointmentOriginLabel = (origin) =>
  APPOINTMENT_ORIGINS.find((item) => item.value === origin)?.label ?? origin ?? '—';

const clean = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

/**
 * GET /appointments (permiso appointments.view). Devuelve list[AppointmentOut].
 * Query opcional: scheduled_date, dentist_id, patient_id.
 */
export const listAppointments = ({ scheduledDate, dentistId, patientId } = {}) =>
  request(
    `/appointments${buildQuery({
      scheduled_date: scheduledDate,
      dentist_id: dentistId,
      patient_id: patientId,
    })}`,
  );

/**
 * POST /appointments (permiso appointments.create).
 * AppointmentCreateIn: patient_id, dentist_id, scheduled_date, start_time,
 * end_time y reason son obligatorios; origin es opcional.
 */
export const createAppointment = (payload) =>
  request('/appointments', {
    method: 'POST',
    body: clean({
      patient_id: payload.patient_id,
      dentist_id: payload.dentist_id,
      scheduled_date: payload.scheduled_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      reason: payload.reason,
      origin: payload.origin,
    }),
  });

/** PATCH /appointments/{id}/reschedule (permiso appointments.edit). */
export const rescheduleAppointment = (appointmentId, payload) =>
  request(`/appointments/${encodeURIComponent(appointmentId)}/reschedule`, {
    method: 'PATCH',
    body: clean({
      scheduled_date: payload.scheduled_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
    }),
  });

/** PATCH /appointments/{id}/cancel (permiso appointments.edit). */
export const cancelAppointment = (appointmentId, reason) =>
  request(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
    method: 'PATCH',
    body: { cancellation_reason: reason },
  });

/** PATCH /appointments/{id}/status (permiso appointments.edit). */
export const changeAppointmentStatus = (appointmentId, status) =>
  request(`/appointments/${encodeURIComponent(appointmentId)}/status`, {
    method: 'PATCH',
    body: { status },
  });

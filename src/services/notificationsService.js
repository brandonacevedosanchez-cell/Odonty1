import { buildQuery, request, requestPaginated } from './apiClient.js';
import { clampApiListLimit } from '../utils/pagination.js';

/**
 * Capa de servicios de /notifications. Contrato: docs/openapi.json
 * (NotificationCreateIn, NotificationOut).
 *
 * NotificationCreateIn: user_id obligatorio; type 2–40; title 3–150;
 * message mínimo 3; appointment_id y patient_id opcionales.
 *
 * @typedef {Object} NotificationOut
 * @property {number} id
 * @property {number} user_id
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {number|null} appointment_id
 * @property {number|null} patient_id
 * @property {boolean} is_read
 * @property {string|null} read_at
 * @property {string} created_at
 */

const clean = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

/** GET /notifications (Bearer). Devuelve { data, total }. */
export const listNotifications = ({ unreadOnly = false, limit = 20, offset = 0 } = {}) =>
  requestPaginated(
    `/notifications${buildQuery({ unread_only: unreadOnly ? true : '', limit: clampApiListLimit(limit), offset })}`,
  );

/** PATCH /notifications/{id}/read (Bearer). */
export const markNotificationRead = (notificationId) =>
  request(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH' });

/** POST /notifications (permiso notifications.create). */
export const createNotification = (payload) =>
  request('/notifications', {
    method: 'POST',
    body: clean({
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      appointment_id: payload.appointment_id,
      patient_id: payload.patient_id,
    }),
  });

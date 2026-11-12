import { buildQuery, request, requestPaginated } from './apiClient.js';
import { PREVIEW_AUDIT_LOG, PREVIEW_MODE, PREVIEW_USERS, previewWriteError } from '../config/preview.js';
import { normalizeText } from '../utils/format.js';
import { clampApiListLimit } from '../utils/pagination.js';

/**
 * GET /users (permiso users.view). Devuelve { data: UserOut[], total }.
 * Query: search, role, is_active, limit, offset. El total llega en X-Total-Count.
 *
 * @typedef {Object} UserOut
 * @property {number} id
 * @property {string} full_name
 * @property {string} email
 * @property {string} document_number
 * @property {string} phone_number
 * @property {'super_admin'|'admin'|'odontologo'|'recepcionista'|'usuario'} role_name
 * @property {boolean} is_active
 * @property {boolean} must_change_password
 */
export async function listUsers({ search = '', role = '', isActive = '', limit = 20, offset = 0 } = {}) {
  const safeLimit = clampApiListLimit(limit);
  if (PREVIEW_MODE) {
    const q = normalizeText(search.trim());
    const filtered = PREVIEW_USERS.filter((user) => {
      if (role && user.role_name !== role) return false;
      if (isActive !== '' && Boolean(user.is_active) !== (isActive === true || isActive === 'true')) return false;
      if (!q) return true;
      return [user.full_name, user.email, user.document_number].some((value) => normalizeText(value).includes(q));
    });
    return { data: filtered.slice(offset, offset + safeLimit).map((user) => ({ ...user })), total: filtered.length };
  }

  return requestPaginated(
    `/users${buildQuery({ search, role, is_active: isActive === '' ? '' : isActive, limit: safeLimit, offset })}`,
  );
}

/** POST /users (permiso users.create). El backend genera y envía por correo la contraseña temporal. */
export const createUser = ({ email, document_number, full_name, phone_number, role }) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request('/users', {
        method: 'POST',
        body: { email, document_number, full_name, phone_number, role },
      });

/** PATCH /users/{id} (permiso users.edit). Solo email, teléfono y nombre completo. */
export const updateUser = (userId, { email, phone_number, full_name }) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request(`/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: Object.fromEntries(
          Object.entries({ email, phone_number, full_name })
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, value === '' ? null : value]),
        ),
      });

/** PATCH /users/{id}/role (permiso users.manage_role). */
export const changeUserRole = (userId, role) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request(`/users/${encodeURIComponent(userId)}/role`, { method: 'PATCH', body: { role } });

/** PATCH /users/{id}/active (permiso users.manage_active). */
export const setUserActive = (userId, isActive) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request(`/users/${encodeURIComponent(userId)}/active`, {
        method: 'PATCH',
        body: { is_active: isActive },
      });

/** GET /users/audit-log?limit=100 (permiso audit.view, solo super_admin). */
export const getAuditLog = (limit = 100) =>
  PREVIEW_MODE ? Promise.resolve(PREVIEW_AUDIT_LOG.slice(0, Number(limit))) : request(`/users/audit-log?limit=${Number(limit)}`);

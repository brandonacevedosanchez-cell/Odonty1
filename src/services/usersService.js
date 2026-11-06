import { request } from './apiClient.js';
import { PREVIEW_AUDIT_LOG, PREVIEW_MODE, PREVIEW_USERS, previewWriteError } from '../config/preview.js';

/** GET /users (permiso users.view). Arreglo de usuarios ordenado por id, sin paginación. */
export const listUsers = () => (PREVIEW_MODE ? Promise.resolve(PREVIEW_USERS.map((user) => ({ ...user }))) : request('/users'));

/** POST /users (permiso users.create). El backend genera y envía por correo la contraseña temporal. */
export const createUser = ({ email, document_number, full_name, phone_number, role }) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request('/users', {
    method: 'POST',
    body: { email, document_number, full_name, phone_number, role },
  });

/** PATCH /users/{id}/role (permiso users.manage_role). */
export const changeUserRole = (userId, role) =>
  PREVIEW_MODE
    ? Promise.reject(previewWriteError())
    : request(`/users/${encodeURIComponent(userId)}/role`, { method: 'PATCH', body: { role } });

/** GET /users/audit-log?limit=100 (permiso audit.view, solo super_admin). */
export const getAuditLog = (limit = 100) =>
  PREVIEW_MODE ? Promise.resolve(PREVIEW_AUDIT_LOG.slice(0, Number(limit))) : request(`/users/audit-log?limit=${Number(limit)}`);

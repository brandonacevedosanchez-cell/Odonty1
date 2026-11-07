export const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true';

export const PREVIEW_USER = Object.freeze({
  id: 1,
  full_name: 'Usuario de demostración',
  email: 'demo@odonty.local',
  document_number: '12345678',
  phone_number: '3001234567',
  role_name: 'super_admin',
  is_active: true,
  must_change_password: false,
});

export const PREVIEW_USERS = Object.freeze([
  PREVIEW_USER,
  {
    id: 2,
    full_name: 'Laura Martínez',
    email: 'laura.martinez@odonty.local',
    document_number: '1023456789',
    phone_number: '3005551234',
    role_name: 'odontologo',
    is_active: true,
    must_change_password: false,
  },
  {
    id: 3,
    full_name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@odonty.local',
    document_number: '9876543210',
    phone_number: '3105559876',
    role_name: 'recepcionista',
    is_active: true,
    must_change_password: true,
  },
]);

export const PREVIEW_AUDIT_LOG = Object.freeze([
  {
    id: 1,
    user_id: 1,
    action: 'user.created',
    detail: 'Se registró un nuevo trabajador.',
    created_at: '2026-10-12T14:30:00Z',
  },
  {
    id: 2,
    user_id: 1,
    action: 'role.updated',
    detail: 'Se actualizó el rol de un usuario.',
    created_at: '2026-10-11T10:15:00Z',
  },
]);

export function previewWriteError() {
  return new Error('Esta acción está deshabilitada en la vista previa de solo lectura.');
}

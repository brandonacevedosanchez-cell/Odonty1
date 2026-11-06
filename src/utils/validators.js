// Validaciones del formulario según el contrato (sección 6). Las del backend son las que mandan.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFullName(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'El nombre completo es obligatorio.';
  if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (v.length > 150) return 'El nombre debe tener máximo 150 caracteres.';
  return '';
}

export function validateEmail(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'El correo electrónico es obligatorio.';
  if (!EMAIL_RE.test(v)) return 'Ingresa un correo electrónico válido.';
  return '';
}

export function validateDocument(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'El número de documento es obligatorio.';
  if (!/^\d+$/.test(v)) return 'El documento solo puede contener números.';
  if (v.length < 5 || v.length > 10) return 'El documento debe tener entre 5 y 10 dígitos.';
  return '';
}

/** Quita espacios, guiones y el prefijo +57 opcional. */
export function normalizePhone(value) {
  const compact = String(value ?? '').replace(/[\s-]/g, '');
  return compact.startsWith('+57') ? compact.slice(3) : compact;
}

export function validatePhone(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'El teléfono es obligatorio.';
  if (!/^\+?[\d\s-]+$/.test(v)) return 'El teléfono solo puede contener números.';
  if (v.startsWith('+') && !v.replace(/[\s-]/g, '').startsWith('+57')) {
    return 'Solo se acepta el prefijo +57.';
  }
  if (!/^\d{10}$/.test(normalizePhone(v))) return 'El teléfono debe tener 10 dígitos (con o sin +57).';
  return '';
}

export function validateRole(value, allowedRoles) {
  if (!value) return 'Selecciona un rol.';
  if (!allowedRoles.includes(value)) return 'No puedes asignar ese rol.';
  return '';
}

export function validatePassword(value) {
  const v = String(value ?? '');
  if (!v) return 'La contraseña es obligatoria.';
  if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (v.length > 128) return 'La contraseña debe tener máximo 128 caracteres.';
  if (!/[a-z]/.test(v)) return 'Debe incluir al menos una letra minúscula.';
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/\d/.test(v)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(v)) return 'Debe incluir al menos un símbolo.';
  return '';
}

/** Reglas de la contraseña para mostrarlas como lista de requisitos. */
export function passwordChecks(value) {
  const v = String(value ?? '');
  return [
    { id: 'len', label: 'Entre 8 y 128 caracteres', ok: v.length >= 8 && v.length <= 128 },
    { id: 'lower', label: 'Una letra minúscula', ok: /[a-z]/.test(v) },
    { id: 'upper', label: 'Una letra mayúscula', ok: /[A-Z]/.test(v) },
    { id: 'digit', label: 'Un número', ok: /\d/.test(v) },
    { id: 'symbol', label: 'Un símbolo', ok: /[^A-Za-z0-9]/.test(v) },
  ];
}

export function validateOtp(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'Ingresa el código de verificación.';
  if (!/^\d{6}$/.test(v)) return 'El código debe tener exactamente 6 dígitos.';
  return '';
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);

// Manejo centralizado de errores de la API de Odonty (ver Contrato_API_Odonty, sección 7).

export const DEFAULT_MESSAGES = {
  0: 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
  400: 'La solicitud no es válida.',
  401: 'Credenciales inválidas o sesión vencida.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'Ya existe un registro con esos datos o hay un conflicto con la operación. Revisa la información e inténtalo de nuevo.',
  422: 'Hay datos que no cumplen las reglas de validación.',
  423: 'La cuenta está bloqueada temporalmente por demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
  500: 'Ocurrió un error interno en el servidor. Inténtalo de nuevo más tarde.',
};

export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';

/** Quita el prefijo "Value error, " que agrega la validación del backend. */
export function stripValueError(message) {
  return String(message ?? '').replace(/^\s*value error,\s*/i, '').trim();
}

function translateValidationItem(item) {
  const raw = stripValueError(item?.msg);
  const type = item?.type ?? '';
  const ctx = item?.ctx ?? {};

  if (type === 'missing') return 'Este campo es obligatorio.';
  if (type === 'string_too_short') return `Debe tener al menos ${ctx.min_length ?? 'los'} caracteres.`;
  if (type === 'string_too_long') return `Debe tener máximo ${ctx.max_length ?? 'los permitidos'} caracteres.`;
  if (/email address/i.test(raw)) return 'Ingresa un correo electrónico válido.';
  if (/valid string|string_type/i.test(type + raw)) return 'Ingresa un texto válido.';
  return raw || DEFAULT_MESSAGES[422];
}

/**
 * Convierte el detalle de un 422 ({ detail: [{ loc, msg, type }] })
 * en { campo: mensaje } y una lista general de mensajes.
 */
export function parseValidationErrors(detail) {
  const fieldErrors = {};
  const messages = [];
  if (!Array.isArray(detail)) return { fieldErrors, messages };

  for (const item of detail) {
    const message = translateValidationItem(item);
    const loc = Array.isArray(item?.loc) ? item.loc : [];
    const field = [...loc].reverse().find((part) => typeof part === 'string' && part !== 'body');
    if (field && !fieldErrors[field]) fieldErrors[field] = message;
    messages.push(message);
  }
  return { fieldErrors, messages };
}

/**
 * Error normalizado de la API.
 *  - status 0: error de red o tiempo de espera agotado (no es un fallo de autenticación).
 *  - code: código de negocio cuando `detail` es un objeto (p. ej. PASSWORD_CHANGE_REQUIRED).
 *  - fieldErrors: errores por campo en respuestas 422.
 */
export class ApiError extends Error {
  constructor({ status = 0, detail = null, code = null } = {}) {
    super(buildMessage(status, detail));
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = code ?? (detail && typeof detail === 'object' && !Array.isArray(detail) ? detail.code ?? null : null);
    this.fieldErrors = status === 422 ? parseValidationErrors(detail).fieldErrors : {};
  }

  get isNetwork() {
    return this.status === 0;
  }
}

function buildMessage(status, detail) {
  if (status === 502 && typeof detail === 'string' && detail.trim()) return stripValueError(detail);
  if (status >= 500) return DEFAULT_MESSAGES[500];

  if (status === 422) {
    const { messages } = parseValidationErrors(detail);
    if (messages.length > 0) return [...new Set(messages)].join(' ');
    return typeof detail === 'string' && detail ? stripValueError(detail) : DEFAULT_MESSAGES[422];
  }

  // `detail` puede ser un objeto { code, message } (p. ej. PASSWORD_CHANGE_REQUIRED).
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    return typeof detail.message === 'string' && detail.message ? detail.message : DEFAULT_MESSAGES[status] ?? DEFAULT_MESSAGES[400];
  }

  if (status !== 0 && typeof detail === 'string' && detail.trim()) return stripValueError(detail);
  return DEFAULT_MESSAGES[status] ?? (status >= 400 ? DEFAULT_MESSAGES[400] : DEFAULT_MESSAGES[0]);
}

/** Mensaje seguro para mostrar al usuario final a partir de cualquier error. */
export function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

export function getFieldErrors(error) {
  return error instanceof ApiError && error.status === 422 ? error.fieldErrors : {};
}

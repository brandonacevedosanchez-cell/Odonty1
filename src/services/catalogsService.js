import { buildQuery, request } from './apiClient.js';
import {
  CUPS_LIMIT_DEFAULT,
  CUPS_LIMIT_MAX,
  CUPS_QUERY_MAX_LENGTH,
  CUPS_QUERY_MIN_LENGTH,
} from '../constants/apiValues.js';

/**
 * Catálogo CUPS 2026 (Resolución 2706 de 2025).
 * Contrato 13-nov-2026: GET /catalogs/cups y GET /catalogs/cups/{code}.
 *
 * @typedef {Object} CupsOut
 * @property {string} code
 * @property {string} name
 * @property {string} section
 * @property {boolean} is_dental
 * @property {boolean} is_active
 */

/** Recorta y limita la búsqueda a los topes del contrato. */
export function normalizeCupsQuery(value) {
  return String(value ?? '').trim().slice(0, CUPS_QUERY_MAX_LENGTH);
}

/**
 * GET /catalogs/cups?q=…&dental_only=true&limit=20
 * `q` debe tener entre 2 y 100 caracteres; limit máximo 50.
 * Devuelve list[CupsOut].
 */
export const searchCups = ({ q, dentalOnly = true, limit = CUPS_LIMIT_DEFAULT } = {}) => {
  const query = normalizeCupsQuery(q);
  if (query.length < CUPS_QUERY_MIN_LENGTH) return Promise.resolve([]);
  const safeLimit = Math.max(1, Math.min(CUPS_LIMIT_MAX, Number(limit) || CUPS_LIMIT_DEFAULT));
  return request(
    `/catalogs/cups${buildQuery({ q: query, dental_only: dentalOnly, limit: safeLimit })}`,
  );
};

/** GET /catalogs/cups/{code}. Devuelve CupsOut o 404 "Codigo CUPS no encontrado". */
export const getCups = (code) => request(`/catalogs/cups/${encodeURIComponent(String(code ?? '').trim())}`);

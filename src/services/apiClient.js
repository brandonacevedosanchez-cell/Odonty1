import { API_URL } from '../config/env.js';
import { ApiError, PASSWORD_CHANGE_REQUIRED } from '../utils/errors.js';
import * as tokens from './tokenStorage.js';

// El plan gratuito de Render duerme el servicio: la primera petición puede tardar ~1 minuto.
const REQUEST_TIMEOUT_MS = 90_000;
// Errores que indican que el refresh token ya no sirve (sesión realmente vencida).
const DEFINITIVE_REFRESH_FAILURES = new Set([400, 401, 403, 422]);

const handlers = {
  onSessionExpired: () => {},
  onPasswordChangeRequired: () => {},
};

/** La capa de sesión (AuthContext) registra aquí sus reacciones globales. */
export function setAuthHandlers(next) {
  Object.assign(handlers, next);
}

/** Petición de bajo nivel: sin lógica de sesión. Lanza ApiError ante cualquier fallo. */
async function send(path, { method = 'GET', body, token, withMeta = false } = {}) {
  if (!API_URL) {
    throw new ApiError({
      status: 0,
      detail: 'Configura VITE_API_URL con la URL base del backend antes de usar la API.',
      code: 'API_URL_NOT_CONFIGURED',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = { Accept: 'application/json' };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    // Red caída, CORS o tiempo agotado: NO es un fallo de autenticación.
    const aborted = error?.name === 'AbortError';
    throw new ApiError({ status: 0, code: aborted ? 'TIMEOUT' : 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }

  const rawTotal = response.headers?.get?.('X-Total-Count');
  const total = rawTotal !== null && rawTotal !== undefined && rawTotal !== '' ? Number(rawTotal) : null;
  const meta = { data: null, total: Number.isFinite(total) ? total : null };

  if (response.status === 204) return withMeta ? meta : null;

  let data = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail ?? null;
    const error = new ApiError({ status: response.status, detail });
    if (response.status === 403 && error.code === PASSWORD_CHANGE_REQUIRED) {
      handlers.onPasswordChangeRequired();
    }
    throw error;
  }

  return withMeta ? { ...meta, data } : data;
}

let refreshPromise = null;

/**
 * Renueva la sesión con POST /auth/refresh.
 * Una sola renovación a la vez: las solicitudes simultáneas comparten la misma promesa,
 * porque cada refresh token solo puede usarse una vez (rotación).
 */
export function refreshSession() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = tokens.getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new ApiError({ status: 401, detail: 'No hay una sesión activa.' }));
  }

  refreshPromise = (async () => {
    try {
      const data = await send('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } });
      tokens.setTokens(data); // guarda de inmediato el nuevo par y sustituye el refresh anterior
      return data.access_token;
    } catch (error) {
      if (error instanceof ApiError && DEFINITIVE_REFRESH_FAILURES.has(error.status)) {
        tokens.clearTokens();
        handlers.onSessionExpired();
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function expireSession() {
  tokens.clearTokens();
  handlers.onSessionExpired();
}

/**
 * Petición con la sesión gestionada.
 *  - auth: false  → rutas públicas (login, refresh, logout...).
 *  - auth: true   → agrega Bearer; ante un 401 renueva UNA vez y reintenta UNA vez (sin bucles).
 */
async function requestWithSession(path, options, withMeta) {
  const { auth = true, ...rest } = options;
  if (!auth) return send(path, { ...rest, withMeta });

  let token = tokens.getAccessToken();
  if (!token) token = await refreshSession();

  try {
    return await send(path, { ...rest, token, withMeta });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    // Si otra solicitud ya renovó el token mientras esta estaba en vuelo, solo se reintenta.
    const current = tokens.getAccessToken();
    const freshToken = current && current !== token ? current : await refreshSession();

    try {
      return await send(path, { ...rest, token: freshToken, withMeta });
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) expireSession();
      throw retryError;
    }
  }
}

/**
 * Petición normal: devuelve solo el cuerpo.
 */
export function request(path, options = {}) {
  return requestWithSession(path, options, false);
}

/**
 * Petición de listado: devuelve { data, total } donde `total` viene de
 * la cabecera X-Total-Count (null si el backend no la expone).
 */
export function requestPaginated(path, options = {}) {
  return requestWithSession(path, options, true);
}

/** Construye una query string omitiendo valores vacíos. */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

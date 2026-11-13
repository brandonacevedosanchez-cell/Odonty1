import { request } from './apiClient.js';
import * as tokens from './tokenStorage.js';

/**
 * POST /auth/login
 * Devuelve { mfaRequired: true, mfaToken } o guarda los tokens y devuelve { mfaRequired: false }.
 * El mfa_token NO es un access token: nunca se guarda como tal.
 */
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });

  if (data?.mfa_required && data?.mfa_token) {
    return { mfaRequired: true, mfaToken: data.mfa_token };
  }

  tokens.setTokens(data);
  return { mfaRequired: false };
}

/** POST /auth/mfa/verify → tokens, igual que el login. */
export async function verifyMfa(mfaToken, code) {
  const data = await request('/auth/mfa/verify', {
    method: 'POST',
    body: { mfa_token: mfaToken, code },
    auth: false,
  });
  tokens.setTokens(data);
}

/** GET /auth/me (funciona aunque must_change_password sea true). */
export const fetchMe = () => request('/auth/me');

/** POST /auth/logout (204). Siempre limpia la sesión local, aunque el servidor falle. */
export async function logout() {
  const refreshToken = tokens.getRefreshToken();
  try {
    if (refreshToken) {
      await request('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken }, auth: false });
    }
  } catch {
    /* la sesión local se cierra de todas formas */
  } finally {
    tokens.clearTokens();
  }
}

/** POST /auth/change-password (204). El backend cierra todas las sesiones: se borran los tokens. */
export async function changePassword(currentPassword, newPassword) {
  await request('/auth/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
  tokens.clearTokens();
}

/** POST /auth/forgot-password. Envía un código de 6 dígitos al correo (ruta pública). */
export const requestPasswordReset = (email) =>
  request('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });

/** POST /auth/reset-password. Código + contraseña nueva (ruta pública). */
export const resetPassword = ({ email, code, newPassword }) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: { email, code, new_password: newPassword },
    auth: false,
  });

/** POST /auth/mfa/setup (Bearer). Devuelve MFASetupOut { secret, otpauth_uri }. */
export const setupMfa = () => request('/auth/mfa/setup', { method: 'POST' });

/** POST /auth/mfa/enable (Bearer). Body MFACodeIn. */
export const enableMfa = (code) => request('/auth/mfa/enable', { method: 'POST', body: { code } });

/** POST /auth/mfa/disable (Bearer). Body MFACodeIn. */
export const disableMfa = (code) => request('/auth/mfa/disable', { method: 'POST', body: { code } });

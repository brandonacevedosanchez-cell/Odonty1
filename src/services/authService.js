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

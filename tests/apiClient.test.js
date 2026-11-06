import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { request, setAuthHandlers } from '../src/services/apiClient.js';
import * as tokens from '../src/services/tokenStorage.js';

let calls;
let expired;
let pwRequired;

const json = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status });

function mockFetch(handler) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    const entry = { path, method: init?.method ?? 'GET', auth: init?.headers?.Authorization, body: init?.body ? JSON.parse(init.body) : undefined };
    calls.push(entry);
    return handler(entry);
  };
}

beforeEach(() => {
  tokens.clearTokens();
  expired = 0;
  pwRequired = 0;
  setAuthHandlers({ onSessionExpired: () => { expired += 1; }, onPasswordChangeRequired: () => { pwRequired += 1; } });
});

test('401 → renueva una vez, guarda el par rotado y reintenta', async () => {
  tokens.setTokens({ access_token: 'old-access', refresh_token: 'rt-1' });
  mockFetch((c) => {
    if (c.path === '/auth/refresh') return json(200, { access_token: 'new-access', refresh_token: 'rt-2', token_type: 'bearer' });
    return c.auth === 'Bearer new-access' ? json(200, [{ id: 1 }]) : json(401, { detail: 'Token vencido' });
  });
  const data = await request('/users');
  assert.deepEqual(data, [{ id: 1 }]);
  assert.equal(tokens.getAccessToken(), 'new-access');
  assert.equal(tokens.getRefreshToken(), 'rt-2'); // el refresh anterior fue sustituido
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 1);
  assert.equal(calls.find((c) => c.path === '/auth/refresh').body.refresh_token, 'rt-1');
  assert.equal(expired, 0);
});

test('solicitudes simultáneas con token vencido comparten UNA sola renovación', async () => {
  tokens.setTokens({ access_token: 'old-access', refresh_token: 'rt-1' });
  mockFetch(async (c) => {
    if (c.path === '/auth/refresh') {
      await new Promise((r) => setTimeout(r, 30));
      return json(200, { access_token: 'new-access', refresh_token: 'rt-2' });
    }
    return c.auth === 'Bearer new-access' ? json(200, { ok: c.path }) : json(401, { detail: 'vencido' });
  });
  const results = await Promise.all([request('/users'), request('/users/audit-log?limit=100'), request('/auth/me')]);
  assert.equal(results.length, 3);
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 1);
  assert.equal(tokens.getRefreshToken(), 'rt-2');
});

test('si el refresh falla con 401 se limpia la sesión y no hay bucle', async () => {
  tokens.setTokens({ access_token: 'old', refresh_token: 'rt-1' });
  mockFetch((c) => (c.path === '/auth/refresh' ? json(401, { detail: 'Refresh invalido' }) : json(401, { detail: 'vencido' })));
  await assert.rejects(() => request('/users'), (e) => e.status === 401);
  assert.equal(tokens.getAccessToken(), null);
  assert.equal(tokens.getRefreshToken(), null);
  assert.equal(expired, 1);
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 1);
});

test('si el reintento vuelve a dar 401 se cierra la sesión (máximo un reintento)', async () => {
  tokens.setTokens({ access_token: 'old', refresh_token: 'rt-1' });
  mockFetch((c) => (c.path === '/auth/refresh' ? json(200, { access_token: 'n', refresh_token: 'rt-2' }) : json(401, { detail: 'no' })));
  await assert.rejects(() => request('/users'), (e) => e.status === 401);
  assert.equal(calls.filter((c) => c.path === '/users').length, 2);
  assert.equal(expired, 1);
});

test('error de red al renovar NO cierra la sesión', async () => {
  tokens.setTokens({ access_token: 'old', refresh_token: 'rt-1' });
  globalThis.fetch = async (url) => {
    if (new URL(url).pathname === '/auth/refresh') throw new TypeError('network down');
    return json(401, { detail: 'vencido' });
  };
  await assert.rejects(() => request('/users'), (e) => e.status === 0);
  assert.equal(tokens.getRefreshToken(), 'rt-1');
  assert.equal(expired, 0);
});

test('403 PASSWORD_CHANGE_REQUIRED avisa globalmente (detail es objeto)', async () => {
  tokens.setTokens({ access_token: 'a', refresh_token: 'r' });
  mockFetch(() => json(403, { detail: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Debes cambiar tu contraseña' } }));
  await assert.rejects(() => request('/users'), (e) => e.code === 'PASSWORD_CHANGE_REQUIRED');
  assert.equal(pwRequired, 1);
  assert.equal(tokens.getAccessToken(), 'a'); // la sesión se conserva
});

test('envía multipart/form-data sin fijar Content-Type manualmente', async () => {
  const formData = new FormData();
  formData.append('clinic_name', 'Clínica Odonty');
  tokens.clearTokens();
  let init;
  globalThis.fetch = async (_url, requestInit) => {
    init = requestInit;
    return json(201, { detail: 'Registro recibido.' });
  };

  const result = await request('/clinics/register', { method: 'POST', body: formData, auth: false });

  assert.equal(result.detail, 'Registro recibido.');
  assert.equal(init.body, formData);
  assert.equal(init.headers['Content-Type'], undefined);
});

test('204 devuelve null y las rutas públicas no llevan Bearer', async () => {
  tokens.setTokens({ access_token: 'a', refresh_token: 'r' });
  mockFetch(() => json(204));
  const out = await request('/auth/logout', { method: 'POST', body: { refresh_token: 'r' }, auth: false });
  assert.equal(out, null);
  assert.equal(calls[0].auth, undefined);
});

test('envía Authorization: Bearer en rutas protegidas', async () => {
  tokens.setTokens({ access_token: 'tok', refresh_token: 'r' });
  mockFetch(() => json(200, []));
  await request('/users');
  assert.equal(calls[0].auth, 'Bearer tok');
});

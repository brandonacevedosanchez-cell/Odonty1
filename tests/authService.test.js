import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPasswordReset, resetPassword } from '../src/services/authService.js';

const json = (status, body) => new Response(JSON.stringify(body), { status });

function captureFetch() {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = {
      path: new URL(url).pathname,
      method: init?.method,
      auth: init?.headers?.Authorization,
      body: init?.body ? JSON.parse(init.body) : undefined,
    };
    return json(200, { detail: 'ok' });
  };
  return () => captured;
}

test('POST /auth/forgot-password envía solo el correo como ruta pública', async () => {
  const getCall = captureFetch();
  const result = await requestPasswordReset('persona@ejemplo.com');

  const call = getCall();
  assert.equal(call.path, '/auth/forgot-password');
  assert.equal(call.method, 'POST');
  assert.deepEqual(call.body, { email: 'persona@ejemplo.com' });
  assert.equal(call.auth, undefined);
  assert.deepEqual(result, { detail: 'ok' });
});

test('POST /auth/reset-password usa email, code y new_password como ruta pública', async () => {
  const getCall = captureFetch();
  await resetPassword({ email: 'persona@ejemplo.com', code: '123456', newPassword: 'NuevaClave1!' });

  const call = getCall();
  assert.equal(call.path, '/auth/reset-password');
  assert.equal(call.method, 'POST');
  assert.deepEqual(call.body, {
    email: 'persona@ejemplo.com',
    code: '123456',
    new_password: 'NuevaClave1!',
  });
  assert.equal(call.auth, undefined);
});

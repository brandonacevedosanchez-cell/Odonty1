import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  changeUserRole,
  createUser,
  listUsers,
  setUserActive,
  updateUser,
} from '../src/services/usersService.js';
import * as tokens from '../src/services/tokenStorage.js';

let calls;

beforeEach(() => {
  calls = [];
  tokens.setTokens({ access_token: 'users-test-access', refresh_token: 'users-test-refresh' });
  globalThis.fetch = async (url, init) => {
    const parsedUrl = new URL(url);
    calls.push({
      method: init.method,
      path: parsedUrl.pathname,
      search: parsedUrl.searchParams,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    const headers = { 'Content-Type': 'application/json', 'X-Total-Count': '1' };
    return new Response(JSON.stringify(init.method === 'GET' ? [] : { id: 8 }), { status: 200, headers });
  };
});

test('usuarios usan el contrato real y limit no supera 200', async () => {
  const listed = await listUsers({ limit: 500, offset: 0 });
  await createUser({
    email: 'ana@example.com',
    document_number: '12345',
    full_name: 'Ana Prueba',
    phone_number: 'teléfono sin formato impuesto',
    role: 'usuario',
  });
  await updateUser(8, { email: '', phone_number: '', full_name: 'Ana Actualizada' });
  await changeUserRole(8, 'odontologo');
  await setUserActive(8, false);

  assert.equal(listed.total, 1);
  assert.equal(calls[0].search.get('limit'), '200');
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    'GET /users',
    'POST /users',
    'PATCH /users/8',
    'PATCH /users/8/role',
    'PATCH /users/8/active',
  ]);
  assert.deepEqual(calls[1].body, {
    email: 'ana@example.com',
    document_number: '12345',
    full_name: 'Ana Prueba',
    phone_number: 'teléfono sin formato impuesto',
    role: 'usuario',
  });
  assert.deepEqual(calls[2].body, { email: null, phone_number: null, full_name: 'Ana Actualizada' });
  assert.deepEqual(calls[3].body, { role: 'odontologo' });
  assert.deepEqual(calls[4].body, { is_active: false });
  assert.equal(calls.every((call) => Boolean(call.authorization)), true);
});

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getCups, normalizeCupsQuery, searchCups } from '../src/services/catalogsService.js';
import * as tokens from '../src/services/tokenStorage.js';

let calls;

beforeEach(() => {
  calls = [];
  tokens.setTokens({ access_token: 'cups-test-access', refresh_token: 'cups-test-refresh' });
  globalThis.fetch = async (url, init) => {
    const parsedUrl = new URL(url);
    calls.push({
      method: init.method,
      path: parsedUrl.pathname,
      search: parsedUrl.searchParams,
      authorization: init.headers.Authorization,
    });
    const body = parsedUrl.pathname.endsWith('/alerts') ? [] : [];
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

test('GET /catalogs/cups envía q, dental_only y limit', async () => {
  await searchCups({ q: '  obturación resina  ', limit: 20 });
  await searchCups({ q: '2321', dentalOnly: false, limit: 500 });

  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    'GET /catalogs/cups',
    'GET /catalogs/cups',
  ]);
  assert.equal(calls[0].search.get('q'), 'obturación resina');
  assert.equal(calls[0].search.get('dental_only'), 'true');
  assert.equal(calls[0].search.get('limit'), '20');
  assert.equal(calls[1].search.get('q'), '2321');
  assert.equal(calls[1].search.get('dental_only'), 'false');
  assert.equal(calls[1].search.get('limit'), '50');
  assert.equal(calls.every((call) => call.authorization === 'Bearer cups-test-access'), true);
});

test('q menor a 2 caracteres no llama al backend y se recorta a 100', async () => {
  assert.deepEqual(await searchCups({ q: 'a' }), []);
  assert.equal(calls.length, 0);
  assert.equal(normalizeCupsQuery('x'.repeat(150)).length, 100);
});

test('GET /catalogs/cups/{code} codifica el código', async () => {
  await getCups(' 2321 ');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].path, '/catalogs/cups/2321');
});

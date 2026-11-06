import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, parseValidationErrors, stripValueError } from '../src/utils/errors.js';

test('quita el prefijo "Value error,"', () => {
  assert.equal(stripValueError('Value error, El telefono debe tener 10 digitos numericos'), 'El telefono debe tener 10 digitos numericos');
});

test('422: errores por campo desde loc y sin prefijo', () => {
  const detail = [{ type: 'value_error', loc: ['body', 'phone_number'], msg: 'Value error, El telefono debe tener 10 digitos numericos' }];
  const { fieldErrors } = parseValidationErrors(detail);
  assert.deepEqual(fieldErrors, { phone_number: 'El telefono debe tener 10 digitos numericos' });
  const err = new ApiError({ status: 422, detail });
  assert.equal(err.fieldErrors.phone_number, 'El telefono debe tener 10 digitos numericos');
  assert.ok(!err.message.includes('Value error'));
});

test('403 con detail objeto: expone code y message', () => {
  const err = new ApiError({ status: 403, detail: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Debes cambiar tu contraseña' } });
  assert.equal(err.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal(err.message, 'Debes cambiar tu contraseña');
});

test('500 no muestra detalles internos', () => {
  const err = new ApiError({ status: 500, detail: 'Traceback: secreto interno' });
  assert.ok(!err.message.includes('Traceback'));
});

test('502 muestra el detail legible del servicio externo', () => {
  const err = new ApiError({ status: 502, detail: 'Falló la subida de documentos. Reintenta.' });
  assert.equal(err.message, 'Falló la subida de documentos. Reintenta.');
});

test('mensajes por defecto en español para 409, 423 y red', () => {
  assert.match(new ApiError({ status: 409 }).message, /registrados/);
  assert.match(new ApiError({ status: 423 }).message, /bloqueada/);
  assert.equal(new ApiError({ status: 0 }).isNetwork, true);
});

test('detail de texto se muestra tal cual en 401', () => {
  assert.equal(new ApiError({ status: 401, detail: 'Credenciales invalidas' }).message, 'Credenciales invalidas');
});

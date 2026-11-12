import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone, validateDocument, validateEmail, validateFullName, validatePassword, validatePatientDocument, validatePhone, validateOtp,
} from '../src/utils/validators.js';

test('nombre: 3 a 150 caracteres', () => {
  assert.ok(validateFullName('ab'));
  assert.equal(validateFullName('Ana'), '');
  assert.ok(validateFullName('x'.repeat(151)));
  assert.equal(validateFullName('x'.repeat(150)), '');
});

test('correo', () => {
  assert.ok(validateEmail('no-es-correo'));
  assert.equal(validateEmail('a@b.co'), '');
});

test('documento: solo dígitos, 5 a 10', () => {
  assert.ok(validateDocument('1234'));
  assert.ok(validateDocument('12345678901'));
  assert.ok(validateDocument('12a45'));
  assert.equal(validateDocument('12345'), '');
  assert.equal(validateDocument('1234567890'), '');
});

test('documento de paciente: PatientRegisterIn exige 6 a 10 dígitos', () => {
  assert.ok(validatePatientDocument('12345'));
  assert.ok(validatePatientDocument('12345678901'));
  assert.ok(validatePatientDocument('12a456'));
  assert.equal(validatePatientDocument('123456'), '');
  assert.equal(validatePatientDocument('1234567890'), '');
});

test('teléfono: 10 dígitos con o sin +57', () => {
  assert.equal(validatePhone('3001234567'), '');
  assert.equal(validatePhone('+573001234567'), '');
  assert.equal(validatePhone('+57 300 123 4567'), '');
  assert.ok(validatePhone('300123456'));
  assert.ok(validatePhone('+13001234567'));
  assert.equal(normalizePhone('+573001234567'), '3001234567');
});

test('contraseña: longitud, minúscula, mayúscula, número y símbolo', () => {
  assert.ok(validatePassword('Ab1!'));
  assert.ok(validatePassword('ABCDEFG1!'));
  assert.ok(validatePassword('abcdefg1!'));
  assert.ok(validatePassword('Abcdefgh!'));
  assert.ok(validatePassword('Abcdefg12'));
  assert.equal(validatePassword('NuevaClaveSegura1!'), '');
  assert.ok(validatePassword('Aa1!' + 'x'.repeat(130)));
});

test('código OTP: exactamente 6 dígitos', () => {
  assert.ok(validateOtp('12345'));
  assert.ok(validateOtp('12345a'));
  assert.equal(validateOtp('123456'), '');
});

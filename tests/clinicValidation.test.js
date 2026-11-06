import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNitCheckDigit,
  validateClinicFile,
  validateClinicRegistration,
} from '../src/modules/clinicas/clinicValidation.js';

test('calcula el dígito de verificación DIAN módulo 11', () => {
  assert.equal(calculateNitCheckDigit('900123456'), '8');
  assert.equal(calculateNitCheckDigit('123456789'), '6');
  assert.equal(calculateNitCheckDigit('12A'), '');
  assert.equal(calculateNitCheckDigit('1234567890123456'), '');
});

test('valida formato y tamaño de los documentos', () => {
  assert.equal(validateClinicFile({ name: 'cedula.jpg', type: 'image/jpeg', size: 1024 }, 'la cédula'), '');
  assert.match(validateClinicFile({ name: 'cedula.gif', type: 'image/gif', size: 1024 }, 'la cédula'), /JPG, PNG o WEBP/);
  assert.match(validateClinicFile({ name: 'rut.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 }, 'el RUT'), /5 MB/);
  assert.match(validateClinicFile(null, 'el RUT'), /Selecciona/);
});

test('valida los datos requeridos de registro de clínica', () => {
  const values = {
    clinic_name: 'Clínica Odonty',
    nit: '900123456',
    nit_dv: '8',
    email: 'admin@odonty.co',
    document_number: '123456',
    full_name: 'Ana Pérez',
    phone_number: '3001234567',
    password: 'ClaveSegura1!',
  };
  const files = {
    cedula_file: { name: 'cedula.jpg', type: 'image/jpeg', size: 1024 },
    rut_file: { name: 'rut.webp', type: 'image/webp', size: 2048 },
  };

  assert.deepEqual(validateClinicRegistration(values, files), {
    clinic_name: '',
    nit: '',
    nit_dv: '',
    email: '',
    document_number: '',
    full_name: '',
    phone_number: '',
    password: '',
    cedula_file: '',
    rut_file: '',
  });
  assert.match(validateClinicRegistration({ ...values, document_number: '12345' }, files).document_number, /6 y 10/);
});

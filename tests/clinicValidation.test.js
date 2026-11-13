import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNitCheckDigit,
  validateClinicFile,
  validateClinicRegistration,
} from '../src/modules/clinicas/clinicValidation.js';

const pdf = (name = 'documento.pdf', size = 1024, type = 'application/pdf') => ({ name, type, size });

test('calcula el dígito de verificación DIAN módulo 11', () => {
  assert.equal(calculateNitCheckDigit('900123456'), '8');
  assert.equal(calculateNitCheckDigit('123456789'), '6');
  assert.equal(calculateNitCheckDigit('12A'), '');
  assert.equal(calculateNitCheckDigit('1234567890123456'), '');
});

test('solo acepta PDF no vacíos de máximo 5 MB', () => {
  assert.equal(validateClinicFile(pdf(), 'la cédula'), '');
  assert.match(validateClinicFile({ name: 'cedula.jpg', type: 'image/jpeg', size: 1024 }, 'la cédula'), /PDF/);
  assert.match(validateClinicFile(pdf('rut.pdf', 1024, 'image/png'), 'el RUT'), /PDF/);
  assert.match(validateClinicFile(pdf('rut.pdf', 1024, ''), 'el RUT'), /PDF/);
  assert.match(validateClinicFile(pdf('rut.pdf', 5 * 1024 * 1024 + 1), 'el RUT'), /5 MB/);
  assert.match(validateClinicFile(pdf('vacio.pdf', 0), 'el RUT'), /vacío/);
  assert.match(validateClinicFile(null, 'el RUT'), /Selecciona/);
});

test('valida los datos y los tres PDF del registro de clínica', () => {
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
    cedula_file: pdf('cedula.pdf'),
    rut_file: pdf('rut.pdf'),
    camara_comercio_file: pdf('camara.pdf'),
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
    camara_comercio_file: '',
  });
  assert.match(validateClinicRegistration({ ...values, document_number: '12345' }, files).document_number, /6 y 10/);
  assert.match(
    validateClinicRegistration(values, { ...files, camara_comercio_file: null }).camara_comercio_file,
    /Cámara de Comercio/,
  );
});

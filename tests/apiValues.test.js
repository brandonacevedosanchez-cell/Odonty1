import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPOINTMENT_ORIGINS,
  APPOINTMENT_STATUS_ACTIONS,
  ASSIGNABLE_USER_ROLES,
  CUPS_LIMIT_DEFAULT,
  CUPS_LIMIT_MAX,
  CUPS_QUERY_MAX_LENGTH,
  CUPS_QUERY_MIN_LENGTH,
  PATIENT_ALERT_MAX_LENGTH,
  PATIENT_BLOOD_TYPES,
  PATIENT_DOCUMENT_NUMBER_PATTERN,
  PATIENT_DOCUMENT_TYPE_DEFAULT,
  PATIENT_DOCUMENT_TYPES,
  PATIENT_GENDERS,
  PATIENT_GUARDIAN_RELATIONSHIP_MAX_LENGTH,
  TOOTH_SURFACES,
} from '../src/constants/apiValues.js';
import { EPS_SELECT_OPTIONS, NO_EPS_OPTION } from '../src/constants/eps.js';

test('los valores centralizados coinciden con el contrato del 13-nov-2026', () => {
  assert.deepEqual(PATIENT_DOCUMENT_TYPES, ['TI', 'CC', 'CE', 'PA']);
  assert.equal(PATIENT_DOCUMENT_TYPE_DEFAULT, 'CC');
  assert.equal(PATIENT_DOCUMENT_NUMBER_PATTERN.source, '^[0-9]{6,10}$');
  assert.deepEqual(PATIENT_GENDERS, ['Masculino', 'Femenino']);

  const bloodTypePattern = /^(O|A|B|AB)[+-]$/;
  assert.equal(PATIENT_BLOOD_TYPES.length, 8);
  assert.ok(PATIENT_BLOOD_TYPES.every((bloodType) => bloodTypePattern.test(bloodType)));

  assert.deepEqual(APPOINTMENT_ORIGINS, ['presencial', 'llamada', 'whatsapp']);
  assert.deepEqual(APPOINTMENT_STATUS_ACTIONS, ['confirmada', 'atendida', 'no_asistio']);
  assert.deepEqual(ASSIGNABLE_USER_ROLES, ['admin', 'odontologo', 'recepcionista']);
  assert.ok(!ASSIGNABLE_USER_ROLES.includes('usuario'));
  assert.deepEqual(TOOTH_SURFACES, ['vestibular', 'lingual_palatino', 'mesial', 'distal', 'oclusal']);
});

test('sexo, alertas y EPS respetan los límites del contrato', () => {
  assert.ok(PATIENT_GENDERS.every((gender) => gender.length <= 20));
  assert.equal(PATIENT_ALERT_MAX_LENGTH, 1000);
  assert.equal(PATIENT_GUARDIAN_RELATIONSHIP_MAX_LENGTH, 50);

  assert.ok(EPS_SELECT_OPTIONS.includes(NO_EPS_OPTION));
  assert.ok(EPS_SELECT_OPTIONS.every((eps) => eps.length <= 100));
  assert.equal(new Set(EPS_SELECT_OPTIONS).size, EPS_SELECT_OPTIONS.length);
});

test('el buscador CUPS respeta los topes del contrato', () => {
  assert.equal(CUPS_QUERY_MIN_LENGTH, 2);
  assert.equal(CUPS_QUERY_MAX_LENGTH, 100);
  assert.equal(CUPS_LIMIT_MAX, 50);
  assert.equal(CUPS_LIMIT_DEFAULT, 20);
});

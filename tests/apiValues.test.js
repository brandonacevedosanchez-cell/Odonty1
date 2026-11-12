import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  APPOINTMENT_ORIGINS,
  APPOINTMENT_STATUS_ACTIONS,
  ASSIGNABLE_USER_ROLES,
  PATIENT_BLOOD_TYPES,
  PATIENT_DOCUMENT_NUMBER_PATTERN,
  PATIENT_DOCUMENT_TYPES,
  PATIENT_GENDERS,
  TOOTH_SURFACES,
} from '../src/constants/apiValues.js';
import { EPS_SELECT_OPTIONS, NO_EPS_OPTION } from '../src/constants/eps.js';

const openapi = JSON.parse(readFileSync(new URL('../docs/openapi.json', import.meta.url), 'utf8'));
const schemas = openapi.components.schemas;

function schemaPattern(schema, field) {
  const property = schema.properties[field];
  return property.pattern ?? property.anyOf?.find((option) => option.pattern)?.pattern;
}

function choices(pattern) {
  const match = pattern.match(/^\^\((.+)\)\$$/);
  assert.ok(match, `Expected a grouped enum pattern, received ${pattern}`);
  return match[1].split('|');
}

test('centralized API values match the OpenAPI schemas', () => {
  assert.deepEqual(PATIENT_DOCUMENT_TYPES, choices(schemaPattern(schemas.PatientRegisterIn, 'document_type')));
  assert.equal(PATIENT_DOCUMENT_NUMBER_PATTERN.source, schemaPattern(schemas.PatientRegisterIn, 'document_number'));
  const bloodTypePattern = schemaPattern(schemas.PatientRegisterIn, 'blood_type');
  assert.ok(PATIENT_BLOOD_TYPES.every((bloodType) => new RegExp(bloodTypePattern).test(bloodType)));
  assert.equal(PATIENT_BLOOD_TYPES.length, 8);
  assert.deepEqual(APPOINTMENT_ORIGINS, choices(schemaPattern(schemas.AppointmentCreateIn, 'origin')));
  assert.deepEqual(APPOINTMENT_STATUS_ACTIONS, choices(schemaPattern(schemas.AppointmentStatusIn, 'status')));
  assert.deepEqual(ASSIGNABLE_USER_ROLES, choices(schemaPattern(schemas.UserCreateIn, 'role')));
  assert.deepEqual(TOOTH_SURFACES, schemas.ToothSurface.enum);
});

test('sexo y EPS respetan los límites del contrato', () => {
  assert.deepEqual(PATIENT_GENDERS, ['Masculino', 'Femenino']);
  assert.ok(PATIENT_GENDERS.every((gender) => gender.length <= 20));

  assert.ok(EPS_SELECT_OPTIONS.includes(NO_EPS_OPTION));
  assert.ok(EPS_SELECT_OPTIONS.every((eps) => eps.length <= 100));
  assert.equal(new Set(EPS_SELECT_OPTIONS).size, EPS_SELECT_OPTIONS.length);
});

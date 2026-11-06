import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS, assignableRoles, can, getPermissions, roleChangeAccess, roleOptionsFor } from '../src/utils/permissions.js';

const superAdmin = { id: 1, role_name: 'super_admin' };
const admin = { id: 2, role_name: 'admin' };
const otherAdmin = { id: 3, role_name: 'admin' };
const dentist = { id: 4, role_name: 'odontologo' };

test('el bypass temporal permite visualizar todos los módulos a usuarios autenticados', () => {
  for (const p of Object.values(PERMISSIONS)) assert.equal(can(superAdmin, p), true);
  for (const p of Object.values(PERMISSIONS)) assert.equal(can(admin, p), true);
  for (const p of Object.values(PERMISSIONS)) assert.equal(can(dentist, p), true);
  assert.equal(can(admin, PERMISSIONS.USERS_CREATE), true);
  assert.equal(can(null, PERMISSIONS.USERS_VIEW), false);
  assert.equal(can(admin, 'unknown.permission'), false);
});

test('la matriz de referencia conserva los permisos definidos por rol', () => {
  assert.ok(!getPermissions(admin).includes(PERMISSIONS.AUDIT_VIEW));
  assert.ok(getPermissions(superAdmin).includes(PERMISSIONS.CLINICS_REVIEW));
  assert.ok(!getPermissions(admin).includes(PERMISSIONS.CLINICS_REVIEW));
  assert.ok(!getPermissions(dentist).includes(PERMISSIONS.USERS_VIEW));
});

test('la matriz clínica aprobada no concede permisos administrativos a odontólogos', () => {
  assert.deepEqual(getPermissions(dentist), [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.ODONTOGRAM_VIEW,
  ]);
  assert.ok(!getPermissions(dentist).includes(PERMISSIONS.USERS_VIEW));
  assert.deepEqual(assignableRoles(dentist), []);
});

test('la matriz propuesta de acceso clínico coincide con los roles acordados', () => {
  assert.ok(getPermissions(admin).includes(PERMISSIONS.BILLING_VIEW));
  assert.ok(!getPermissions(dentist).includes(PERMISSIONS.BILLING_VIEW));
  assert.ok(getPermissions({ role_name: 'recepcionista' }).includes(PERMISSIONS.PATIENTS_VIEW));
  assert.ok(!getPermissions({ role_name: 'recepcionista' }).includes(PERMISSIONS.CLINICAL_HISTORY_VIEW));
  assert.deepEqual(getPermissions({ role_name: 'usuario' }), [PERMISSIONS.NOTIFICATIONS_VIEW]);
});

test('admin solo asigna odontologo, recepcionista y usuario', () => {
  assert.deepEqual(assignableRoles(admin), ['odontologo', 'recepcionista', 'usuario']);
  assert.ok(assignableRoles(superAdmin).includes('admin'));
  assert.ok(!assignableRoles(superAdmin).includes('super_admin'));
});

test('nadie cambia su propio rol', () => {
  assert.equal(roleChangeAccess(admin, admin).allowed, false);
  assert.equal(roleChangeAccess(superAdmin, superAdmin).allowed, false);
});

test('nadie modifica al super_admin', () => {
  assert.equal(roleChangeAccess(admin, superAdmin).allowed, false);
});

test('admin no modifica a otro admin, pero super_admin sí', () => {
  assert.equal(roleChangeAccess(admin, otherAdmin).allowed, false);
  assert.equal(roleChangeAccess(superAdmin, otherAdmin).allowed, true);
});

test('admin puede cambiar el rol de un odontologo y no se le ofrece admin ni su rol actual', () => {
  assert.equal(roleChangeAccess(admin, dentist).allowed, true);
  const options = roleOptionsFor(admin, dentist);
  assert.deepEqual(options, ['recepcionista', 'usuario']);
  assert.ok(!options.includes('admin'));
});

test('el bypass abre la interfaz, pero los roles sin asignaciones permitidas no tienen opciones', () => {
  assert.equal(roleChangeAccess(dentist, admin).allowed, true);
  assert.deepEqual(roleOptionsFor(dentist, admin), []);
});

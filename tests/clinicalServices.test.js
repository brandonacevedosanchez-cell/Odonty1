import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { listAppointments } from '../src/services/appointmentsService.js';
import {
  buildPatientUpdate,
  checkPatient,
  createPatient,
  extractPatientIdFromConflict,
  getPatientAlerts,
  hasMedicalAlerts,
  listPatients,
  updatePatient,
} from '../src/services/patientsService.js';
import { createClinicalEntry, listClinicalHistory } from '../src/services/clinicalHistoryService.js';
import {
  createOdontogramEntry,
  getCurrentOdontogram,
  getOdontogramHistory,
} from '../src/services/odontogramService.js';
import {
  createNotification,
  listNotifications,
  markNotificationRead,
} from '../src/services/notificationsService.js';
import * as tokens from '../src/services/tokenStorage.js';

let calls;

beforeEach(() => {
  calls = [];
  tokens.setTokens({ access_token: 'clinical-test-access', refresh_token: 'clinical-test-refresh' });
  globalThis.fetch = async (url, init) => {
    const parsedUrl = new URL(url);
    calls.push({
      method: init.method,
      path: parsedUrl.pathname,
      search: parsedUrl.searchParams,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    const headers = { 'Content-Type': 'application/json' };
    if (parsedUrl.pathname !== '/appointments') headers['X-Total-Count'] = '7';
    return new Response(JSON.stringify([]), { status: 200, headers });
  };
});

test('los listados clínicos llaman sus GET y leen X-Total-Count', async () => {
  const patients = await listPatients({ search: 'Ana', limit: 10, offset: 0 });
  const history = await listClinicalHistory({ patientId: 21, limit: 10, offset: 0 });
  const currentOdontogram = await getCurrentOdontogram(21);
  const odontogramHistory = await getOdontogramHistory(21, { toothFdi: 11, limit: 10, offset: 0 });
  const notifications = await listNotifications({ unreadOnly: true, limit: 15, offset: 0 });
  const appointmentsResult = await listAppointments({ patientId: 21 });

  assert.equal(patients.total, 7);
  assert.equal(history.total, 7);
  assert.equal(odontogramHistory.total, 7);
  assert.equal(notifications.total, 7);
  assert.deepEqual(currentOdontogram, []);
  assert.deepEqual(appointmentsResult, []);
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    'GET /patients',
    'GET /clinical-history',
    'GET /odontogram/21',
    'GET /odontogram/21/history',
    'GET /notifications',
    'GET /appointments',
  ]);
  assert.equal(calls.every((call) => call.authorization === 'Bearer clinical-test-access'), true);
  assert.equal(calls[0].search.get('search'), 'Ana');
  assert.equal(calls[1].search.get('patient_id'), '21');
  assert.equal(calls[3].search.get('tooth_fdi'), '11');
  assert.equal(calls[4].search.get('unread_only'), 'true');
  assert.equal(calls[5].search.get('patient_id'), '21');
});

test('los servicios paginados usan limit 50 por defecto y offset no negativo', async () => {
  await listPatients({ offset: -3 });
  await listClinicalHistory({ patientId: 21, offset: -1 });
  await getOdontogramHistory(21, { offset: -2 });
  await listNotifications({ offset: -4 });

  assert.deepEqual(calls.map(({ search }) => [search.get('limit'), search.get('offset')]), [
    ['50', '0'],
    ['50', '0'],
    ['50', '0'],
    ['50', '0'],
  ]);
});

test('las acciones de pacientes, historia, odontograma y notificaciones usan sus endpoints', async () => {
  await checkPatient({ documentType: 'TI', documentNumber: '123456' });
  await createPatient({
    full_name: 'Ana Prueba',
    email: 'ana@example.com',
    document_number: '123456',
    phone_number: '3001234567',
    document_type: 'CC',
    birth_date: '2010-01-01',
    gender: 'Masculino',
    blood_type: 'O+',
    eps: 'SURA',
    allergies: 'Penicilina',
    current_medications: 'Ibuprofeno',
    medical_conditions: 'Asma',
    guardian_full_name: 'Luis Prueba',
    guardian_document_number: '987654',
    guardian_phone: '3009876543',
    guardian_relationship: 'Padre',
  });

  await updatePatient(21, { blood_type: 'A-', notes: '' });
  await getPatientAlerts(21);
  await createClinicalEntry({
    appointment_id: 31,
    patient_id: 21,
    motivo_consulta: 'Dolor',
    antecedentes: 'Ninguno',
    examen: 'Caries',
    diagnostico: 'Caries oclusal',
    tratamiento: 'Calza',
    notes: 'No aplica',
  });
  await createOdontogramEntry({ appointment_id: 31, tooth_fdi: 16, surface: 'oclusal', condition_code: 'C1' });
  await markNotificationRead(41);
  await createNotification({ user_id: 51, type: 'control', title: 'Control', message: 'Recordatorio' });

  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    'GET /patients/check',
    'POST /patients',
    'PATCH /patients/21',
    'GET /patients/21/alerts',
    'POST /clinical-history',
    'POST /odontogram',
    'PATCH /notifications/41/read',
    'POST /notifications',
  ]);
  assert.equal(calls.every((call) => call.authorization === 'Bearer clinical-test-access'), true);
  assert.equal(calls[0].search.get('document_type'), 'TI');
  assert.equal(calls[0].search.get('document_number'), '123456');
  assert.deepEqual(calls[1].body, {
    full_name: 'Ana Prueba',
    email: 'ana@example.com',
    document_number: '123456',
    phone_number: '3001234567',
    document_type: 'CC',
    birth_date: '2010-01-01',
    gender: 'Masculino',
    blood_type: 'O+',
    eps: 'SURA',
    guardian_full_name: 'Luis Prueba',
    guardian_document_number: '987654',
    guardian_phone: '3009876543',
    guardian_relationship: 'Padre',
    allergies: 'Penicilina',
    current_medications: 'Ibuprofeno',
    medical_conditions: 'Asma',
  });
  assert.deepEqual(calls[2].body, {
    blood_type: 'A-',
    notes: null,
  });
  assert.deepEqual(calls[4].body, {
    appointment_id: 31,
    antecedentes: 'Ninguno',
    motivo_consulta: 'Dolor',
    examen: 'Caries',
    diagnostico: 'Caries oclusal',
    tratamiento: 'Calza',
  });
  assert.deepEqual(calls[5].body, {
    appointment_id: 31,
    tooth_fdi: 16,
    surface: 'oclusal',
    condition_code: 'C1',
  });
  assert.deepEqual(calls[7].body, {
    user_id: 51,
    type: 'control',
    title: 'Control',
    message: 'Recordatorio',
  });
});

test('PATCH solo incluye campos que cambian y limpia opcionales con null', () => {
  const original = {
    full_name: 'Ana Prueba',
    birth_date: '2000-01-01',
    eps: 'SURA',
    blood_type: null,
    notes: 'Sin cambios',
  };
  const changes = buildPatientUpdate(original, {
    ...original,
    full_name: ' Ana Prueba ',
    eps: '',
    blood_type: 'O+',
  });

  assert.deepEqual(changes, { eps: null, blood_type: 'O+' });
  assert.deepEqual(buildPatientUpdate(original, original), {});
});

test('detecta el id del 409 y las alertas médicas', () => {
  assert.equal(
    extractPatientIdFromConflict('Ya existe un paciente con ese documento en esta clinica (id=42)'),
    42,
  );
  assert.equal(extractPatientIdFromConflict('Otro conflicto'), null);
  assert.equal(hasMedicalAlerts({ allergies: 'Penicilina' }), true);
  assert.equal(hasMedicalAlerts({ allergies: '  ', current_medications: '', medical_conditions: null }), false);
});

test('el odontograma envía surface null para un diente completo', async () => {
  await createOdontogramEntry({ appointment_id: 31, tooth_fdi: 16, surface: null });

  assert.deepEqual(calls[0].body, {
    appointment_id: 31,
    tooth_fdi: 16,
    surface: null,
  });
});

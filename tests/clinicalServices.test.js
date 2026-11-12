import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  listAppointments,
} from '../src/services/appointmentsService.js';
import {
  createPatient,
  listPatients,
  updatePatient,
} from '../src/services/patientsService.js';
import {
  createClinicalEntry,
  listClinicalHistory,
} from '../src/services/clinicalHistoryService.js';
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

test('las acciones de pacientes, historia, odontograma y notificaciones usan sus endpoints', async () => {
  await createPatient({
    full_name: 'Ana Prueba',
    email: 'ana@example.com',
    document_number: '123456',
    phone_number: '3001234567',
    document_type: 'CC',
    birth_date: '1990-01-01',
    gender: 'femenino',
    blood_type: 'O+',
    eps: 'Sura',
    allergies: 'Penicilina',
    guardian_full_name: 'Luis Prueba',
  });

  await updatePatient(21, {
    full_name: 'Ana Actualizada',
    birth_date: '1991-02-02',
    blood_type: 'A-',
    notes: '',
  });
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
    'POST /patients',
    'PATCH /patients/21',
    'POST /clinical-history',
    'POST /odontogram',
    'PATCH /notifications/41/read',
    'POST /notifications',
  ]);
  assert.equal(calls.every((call) => call.authorization === 'Bearer clinical-test-access'), true);
  assert.deepEqual(calls[0].body, {
    full_name: 'Ana Prueba',
    email: 'ana@example.com',
    document_number: '123456',
    phone_number: '3001234567',
    document_type: 'CC',
    birth_date: '1990-01-01',
    gender: 'femenino',
    blood_type: 'O+',
    eps: 'Sura',
    allergies: 'Penicilina',
    guardian_full_name: 'Luis Prueba',
  });
  assert.deepEqual(calls[1].body, {
    birth_date: '1991-02-02',
    blood_type: 'A-',
    notes: null,
  });
  assert.deepEqual(calls[2].body, {
    appointment_id: 31,
    antecedentes: 'Ninguno',
    motivo_consulta: 'Dolor',
    examen: 'Caries',
    diagnostico: 'Caries oclusal',
    tratamiento: 'Calza',
  });
  assert.deepEqual(calls[3].body, {
    appointment_id: 31,
    tooth_fdi: 16,
    surface: 'oclusal',
    condition_code: 'C1',
  });
  assert.deepEqual(calls[5].body, {
    user_id: 51,
    type: 'control',
    title: 'Control',
    message: 'Recordatorio',
  });
});

test('el odontograma envía surface null para un diente completo', async () => {
  await createOdontogramEntry({ appointment_id: 31, tooth_fdi: 16, surface: null });

  assert.deepEqual(calls[0].body, {
    appointment_id: 31,
    tooth_fdi: 16,
    surface: null,
  });
});

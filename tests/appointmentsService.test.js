import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
} from '../src/services/appointmentsService.js';
import * as tokens from '../src/services/tokenStorage.js';

test('citas usan sus endpoints y GET devuelve el array sin requerir X-Total-Count', async () => {
  tokens.setTokens({ access_token: 'appointment-access', refresh_token: 'appointment-refresh' });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    const body = init.method === 'GET' ? [{ id: 8 }] : { id: 8 };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const listed = await listAppointments({ scheduledDate: '2026-11-11', dentistId: 3, patientId: 5 });
  await createAppointment({
    patient_id: 5,
    dentist_id: 3,
    scheduled_date: '2026-11-11',
    start_time: '10:00',
    end_time: '10:30',
    reason: 'Control',
    origin: 'presencial',
  });
  await rescheduleAppointment(8, { scheduled_date: '2026-11-12', start_time: '11:00', end_time: '11:45' });
  await cancelAppointment(8, 'No puede asistir');
  await changeAppointmentStatus(8, 'confirmada');

  assert.deepEqual(listed, [{ id: 8 }]);
  assert.equal(calls[0].url.searchParams.get('scheduled_date'), '2026-11-11');
  assert.equal(calls[0].url.searchParams.get('dentist_id'), '3');
  assert.equal(calls[0].url.searchParams.get('patient_id'), '5');
  assert.equal(calls.every((call) => call.authorization === 'Bearer appointment-access'), true);
  assert.deepEqual(calls[1].body, {
    patient_id: 5,
    dentist_id: 3,
    scheduled_date: '2026-11-11',
    start_time: '10:00',
    end_time: '10:30',
    reason: 'Control',
    origin: 'presencial',
  });
  assert.deepEqual(calls[2].body, {
    scheduled_date: '2026-11-12',
    start_time: '11:00',
    end_time: '11:45',
  });
  assert.deepEqual(calls[3].body, { cancellation_reason: 'No puede asistir' });
  assert.deepEqual(calls[4].body, { status: 'confirmada' });
  assert.deepEqual(
    calls.map(({ url, method }) => `${method} ${url.pathname}`),
    [
      'GET /appointments',
      'POST /appointments',
      'PATCH /appointments/8/reschedule',
      'PATCH /appointments/8/cancel',
      'PATCH /appointments/8/status',
    ],
  );
});

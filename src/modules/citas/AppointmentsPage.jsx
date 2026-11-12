import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import { FieldError } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { APPOINTMENT_STATUS_ACTIONS } from '../../constants/apiValues.js';
import {
  APPOINTMENT_ORIGINS,
  appointmentStatusLabel,
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
} from '../../services/appointmentsService.js';
import { listPatients } from '../../services/patientsService.js';
import { listUsers } from '../../services/usersService.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { PERMISSIONS } from '../../utils/permissions.js';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const LONG_DATE = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const STATUS_TONE = {
  confirmada: 'badge--success',
  atendida: 'badge--role-odontologo',
  cancelada: 'badge--danger',
  no_asistio: 'badge--warning',
};

const EMPTY_FORM = {
  patient_id: '',
  dentist_id: '',
  scheduled_date: '',
  start_time: '',
  end_time: '',
  reason: '',
  origin: 'presencial',
};

function startOfWeek(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** El backend puede devolver `scheduled_date` como fecha ISO o como datetime. */
function appointmentDateKey(appointment) {
  return String(appointment?.scheduled_date ?? '').slice(0, 10);
}

function appointmentTime(appointment) {
  const value = appointment?.start_time ?? appointment?.scheduled_time ?? '';
  return String(value).slice(0, 5);
}

function appointmentEndTime(appointment) {
  return String(appointment?.end_time ?? '').slice(0, 5);
}

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_TONE[status] ?? 'badge--neutral'}`}>{appointmentStatusLabel(status)}</span>;
}

export default function AppointmentsPage() {
  const toast = useToast();
  const { can, user } = usePermissions();
  const canView = can(PERMISSIONS.APPOINTMENTS_VIEW);
  const canCreate = can(PERMISSIONS.APPOINTMENTS_CREATE);
  const canEdit = can(PERMISSIONS.APPOINTMENTS_EDIT);
  const canListUsers = can(PERMISSIONS.USERS_VIEW);

  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState(null);
  const [dialogValues, setDialogValues] = useState({ scheduled_date: '', start_time: '', end_time: '', reason: '', status: '' });
  const [dialogError, setDialogError] = useState('');
  const [dialogFieldErrors, setDialogFieldErrors] = useState({});
  const [dialogSaving, setDialogSaving] = useState(false);

  const appointmentsQuery = useAsync(() => listAppointments(), { enabled: canView });
  const patientsQuery = useAsync(() => listPatients({ limit: 100 }), { enabled: canView });
  // `users.view` no lo tienen todos los roles que agendan. Si no se puede listar,
  // se ofrecen los odontólogos ya presentes en la agenda y el usuario actual.
  const dentistsQuery = useAsync(() => listUsers({ role: 'odontologo', limit: 100 }), { enabled: canView && canListUsers });

  const appointments = Array.isArray(appointmentsQuery.data) ? appointmentsQuery.data : [];
  const patients = Array.isArray(patientsQuery.data?.data) ? patientsQuery.data.data : [];
  const dentists = useMemo(() => {
    const fromUsers = Array.isArray(dentistsQuery.data?.data) ? dentistsQuery.data.data : [];
    const found = new Map(fromUsers.map((dentist) => [String(dentist.id), dentist]));
    appointments.forEach((appointment) => {
      const id = appointment?.dentist_id;
      if (id === undefined || id === null || found.has(String(id))) return;
      found.set(String(id), { id, full_name: appointment.dentist_name || `Odontólogo #${id}` });
    });
    if (user?.role_name === 'odontologo' && user?.id !== undefined && !found.has(String(user.id))) {
      found.set(String(user.id), { id: user.id, full_name: user.full_name });
    }
    return [...found.values()];
  }, [dentistsQuery.data, appointments, user?.id, user?.role_name, user?.full_name]);

  const patientName = (id) => patients.find((patient) => String(patient.id) === String(id))?.full_name ?? `Paciente #${id ?? '—'}`;
  const dentistName = (id) => dentists.find((dentist) => String(dentist.id) === String(id))?.full_name ?? `Odontólogo #${id ?? '—'}`;

  const weekDates = useMemo(() => WEEKDAYS.map((_, index) => addDays(startOfWeek(date), index)), [date]);
  const monthCells = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = startOfWeek(first);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const count = Math.ceil((last.getDate() + ((first.getDay() + 6) % 7)) / 7) * 7;
    return Array.from({ length: count }, (_, index) => addDays(start, index));
  }, [date]);

  const byDate = useMemo(() => {
    const map = new Map();
    appointments.forEach((appointment) => {
      const key = appointmentDateKey(appointment);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(appointment);
    });
    map.forEach((list) => list.sort((a, b) => appointmentTime(a).localeCompare(appointmentTime(b))));
    return map;
  }, [appointments]);

  const agendaDay = selectedDay ?? date;
  const agendaAppointments = byDate.get(dateKey(agendaDay)) ?? [];

  useEffect(() => {
    if (!formOpen) return;
    setValues((current) => ({
      ...current,
      scheduled_date: current.scheduled_date || dateKey(selectedDay ?? date),
    }));
  }, [formOpen, selectedDay, date]);

  const navigate = (direction) => {
    if (view === 'month') setDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    else setDate((current) => addDays(current, direction * (view === 'week' ? 7 : 1)));
    setSelectedDay(null);
  };

  const goToday = () => {
    const today = new Date();
    setDate(today);
    setSelectedDay(today);
  };

  function openCreate(day = agendaDay) {
    setValues({ ...EMPTY_FORM, scheduled_date: dateKey(day ?? new Date()) });
    setFormError('');
    setFormFieldErrors({});
    setFormOpen(true);
  }

  const updateForm = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFormFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const updateDialog = (field) => (event) => {
    setDialogValues((current) => ({ ...current, [field]: event.target.value }));
    setDialogFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  async function handleCreate(event) {
    event.preventDefault();
    if (saving) return;
    setFormError('');
    setFormFieldErrors({});
    if (!values.patient_id || !values.dentist_id || !values.scheduled_date || !values.start_time || !values.end_time) {
      setFormError('Selecciona paciente, odontólogo, fecha, hora de inicio y hora de fin.');
      return;
    }
    if (values.reason.trim().length < 3) {
      setFormError('El motivo de consulta debe tener al menos 3 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await createAppointment({
        patient_id: Number(values.patient_id),
        dentist_id: Number(values.dentist_id),
        scheduled_date: values.scheduled_date,
        start_time: values.start_time,
        end_time: values.end_time,
        reason: values.reason.trim(),
        origin: values.origin,
      });
      toast.success('Cita creada correctamente.');
      setFormOpen(false);
      await appointmentsQuery.reload({ silent: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setFormFieldErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? '' : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function openDialog(type, appointment) {
    setDialog({ type, appointment });
    setDialogError('');
    setDialogFieldErrors({});
    setDialogValues({
      scheduled_date: appointmentDateKey(appointment),
      start_time: appointmentTime(appointment),
      end_time: appointmentEndTime(appointment),
      reason: '',
      status: APPOINTMENT_STATUS_ACTIONS.includes(appointment.status)
        ? appointment.status
        : APPOINTMENT_STATUS_ACTIONS[0],
    });
  }

  function closeDialog() {
    if (dialogSaving) return;
    setDialog(null);
    setDialogError('');
    setDialogFieldErrors({});
  }

  async function confirmDialog() {
    if (!dialog || dialogSaving) return;
    const { type, appointment } = dialog;
    setDialogSaving(true);
    setDialogError('');
    setDialogFieldErrors({});
    try {
      if (type === 'reschedule') {
        if (!dialogValues.scheduled_date || !dialogValues.start_time || !dialogValues.end_time) {
          setDialogError('Indica fecha, hora de inicio y hora de fin.');
          setDialogSaving(false);
          return;
        }
        await rescheduleAppointment(appointment.id, {
          scheduled_date: dialogValues.scheduled_date,
          start_time: dialogValues.start_time,
          end_time: dialogValues.end_time,
        });
        toast.success('Cita reprogramada.');
      } else if (type === 'cancel') {
        await cancelAppointment(appointment.id, dialogValues.reason);
        toast.success('Cita cancelada.');
      } else if (type === 'status') {
        await changeAppointmentStatus(appointment.id, dialogValues.status);
        toast.success('Estado de la cita actualizado.');
      }
      setDialog(null);
      await appointmentsQuery.reload({ silent: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setDialogFieldErrors(fieldErrors);
      setDialogError(Object.keys(fieldErrors).length ? '' : getErrorMessage(error));
    } finally {
      setDialogSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Citas y agenda"
        description="Organiza la agenda clínica, crea citas y actualiza su estado."
        actions={
          canCreate && (
            <button type="button" className="btn btn--primary" onClick={() => openCreate()}>
              <Icon name="plus" size={17} /> Crear cita
            </button>
          )
        }
      />

      {formOpen && (
        <section className="panel section" aria-labelledby="appointment-form-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="appointment-form-heading">Nueva cita</h2>
              <p className="module-muted">El backend valida el cruce de horarios y la jornada de la clínica.</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cerrar formulario
            </button>
          </div>

          <form onSubmit={handleCreate} className="form form--spaced">
            {formError && <Alert type="error">{formError}</Alert>}
            <div className="module-form-grid">
              <label className="field">
                <span className="field__label">Paciente</span>
                <select className="input" value={values.patient_id} onChange={updateForm('patient_id')} disabled={saving} required>
                  <option value="">Selecciona un paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                  ))}
                </select>
                <FieldError error={formFieldErrors.patient_id} />
                {patients.length === 0 && <span className="field__hint">No hay pacientes disponibles. Regístralos en el módulo de pacientes.</span>}
              </label>
              <label className="field">
                <span className="field__label">Odontólogo</span>
                <select className="input" value={values.dentist_id} onChange={updateForm('dentist_id')} disabled={saving} required>
                  <option value="">Selecciona un odontólogo</option>
                  {dentists.map((dentist) => (
                    <option key={dentist.id} value={dentist.id}>{dentist.full_name}</option>
                  ))}
                </select>
                <FieldError error={formFieldErrors.dentist_id} />
                {dentists.length === 0 && <span className="field__hint">No se encontraron usuarios con rol odontólogo.</span>}
              </label>
              <label className="field">
                <span className="field__label">Fecha</span>
                <input className="input" type="date" value={values.scheduled_date} onChange={updateForm('scheduled_date')} disabled={saving} required />
                <FieldError error={formFieldErrors.scheduled_date} />
              </label>
              <label className="field">
                <span className="field__label">Hora de inicio</span>
                <input className="input" type="time" value={values.start_time} onChange={updateForm('start_time')} disabled={saving} required />
                <FieldError error={formFieldErrors.start_time} />
              </label>
              <label className="field">
                <span className="field__label">Hora de fin</span>
                <input className="input" type="time" value={values.end_time} onChange={updateForm('end_time')} disabled={saving} required />
                <FieldError error={formFieldErrors.end_time} />
              </label>
              <label className="field">
                <span className="field__label">Origen</span>
                <select className="input" value={values.origin} onChange={updateForm('origin')} disabled={saving}>
                  {APPOINTMENT_ORIGINS.map((origin) => (
                    <option key={origin.value} value={origin.value}>{origin.label}</option>
                  ))}
                </select>
                <FieldError error={formFieldErrors.origin} />
              </label>
              <label className="field module-form-grid__wide">
                <span className="field__label">Motivo de consulta</span>
                <textarea className="input module-textarea" value={values.reason} onChange={updateForm('reason')} disabled={saving} minLength={3} required />
                <FieldError error={formFieldErrors.reason} />
              </label>
            </div>
            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? <Spinner size={16} /> : <Icon name="calendar" size={16} />}
                {saving ? 'Guardando…' : 'Guardar cita'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel section">
        <div className="calendar-toolbar">
          <div className="calendar-navigation">
            <button type="button" className="btn btn--secondary btn--sm" onClick={goToday}>Hoy</button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigate(-1)} aria-label="Periodo anterior">
              <Icon name="arrow-left" size={16} />
            </button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigate(1)} aria-label="Periodo siguiente">
              <Icon name="arrow-right" size={16} />
            </button>
            <h2 className="calendar-title">
              {view === 'month' ? MONTHS.format(date) : view === 'week' ? `Semana del ${weekDates[0].toLocaleDateString('es-CO')}` : LONG_DATE.format(date)}
            </h2>
          </div>
          <div className="module-segmented" role="group" aria-label="Vista de agenda">
            {['month', 'week', 'day'].map((option) => (
              <button
                type="button"
                key={option}
                className={view === option ? 'module-segmented__active' : ''}
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {option === 'month' ? 'Mes' : option === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
        </div>

        {appointmentsQuery.loading && <LoadingState message="Cargando agenda…" />}
        {!appointmentsQuery.loading && appointmentsQuery.error && (
          <ErrorState message={appointmentsQuery.error} onRetry={() => appointmentsQuery.reload()} title="No se pudo cargar la agenda" />
        )}

        {!appointmentsQuery.loading && !appointmentsQuery.error && view === 'month' && (
          <div className="calendar-month" aria-label="Calendario mensual">
            {WEEKDAYS.map((weekday) => <div className="calendar-month__weekday" key={weekday}>{weekday}</div>)}
            {monthCells.map((cell) => {
              const dayAppointments = byDate.get(dateKey(cell)) ?? [];
              const selected = selectedDay && dateKey(selectedDay) === dateKey(cell);
              return (
                <button
                  type="button"
                  key={dateKey(cell)}
                  className={`calendar-month__cell ${cell.getMonth() !== date.getMonth() ? 'calendar-month__cell--outside' : ''} ${selected ? 'calendar-month__cell--selected' : ''}`.trim()}
                  onClick={() => { setSelectedDay(cell); setDate(cell); }}
                  aria-label={`${LONG_DATE.format(cell)}. ${dayAppointments.length} ${dayAppointments.length === 1 ? 'cita' : 'citas'}.`}
                  aria-pressed={selected ? true : undefined}
                >
                  <span className="calendar-month__day">{cell.getDate()}</span>
                  {dayAppointments.length > 0 && (
                    <span className="calendar-month__count">{dayAppointments.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!appointmentsQuery.loading && !appointmentsQuery.error && view !== 'month' && (
          <div className={`calendar-week ${view === 'day' ? 'calendar-week--day' : ''}`}>
            {(view === 'week' ? weekDates : [date]).map((day) => {
              const dayAppointments = byDate.get(dateKey(day)) ?? [];
              return (
                <div className="calendar-week__column" key={dateKey(day)}>
                  <h3 className="calendar-week__title">{LONG_DATE.format(day)}</h3>
                  {dayAppointments.length === 0 ? (
                    <p className="module-muted">Sin citas.</p>
                  ) : (
                    <ul className="appointment-chips">
                      {dayAppointments.map((appointment) => (
                        <li key={appointment.id}>
                          <button type="button" className="appointment-chip" onClick={() => { setSelectedDay(day); setDate(day); }}>
                            <strong>{appointmentTime(appointment) || '—'}</strong>
                            <span>{patientName(appointment.patient_id)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="module-section-heading section">
          <div>
            <h3 className="panel__title">Citas del {LONG_DATE.format(agendaDay)}</h3>
            <p className="module-muted">{agendaAppointments.length} {agendaAppointments.length === 1 ? 'cita agendada' : 'citas agendadas'}</p>
          </div>
          {canCreate && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => openCreate(agendaDay)}>
              <Icon name="plus" size={16} /> Agendar este día
            </button>
          )}
        </div>

        {agendaAppointments.length === 0 ? (
          <EmptyState icon="calendar" title="Sin citas para este día" text="Crea una cita o selecciona otra fecha en el calendario." />
        ) : (
          <ul className="appointment-list">
            {agendaAppointments.map((appointment) => (
              <li className="appointment-card" key={appointment.id}>
                <div className="appointment-card__time">
                  <strong>{appointmentTime(appointment) || '—'}</strong>
                  <span>{appointmentEndTime(appointment) || '—'}</span>
                </div>
                <div className="appointment-card__body">
                  <div className="appointment-card__head">
                    <strong>{patientName(appointment.patient_id)}</strong>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="module-muted">
                    {dentistName(appointment.dentist_id)} · {appointment.reason || 'Sin motivo registrado'}
                  </p>
                  {appointment.cancellation_reason && (
                    <p className="module-muted">Motivo de cancelación: {appointment.cancellation_reason}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="appointment-card__actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => openDialog('reschedule', appointment)}>
                      <Icon name="clock" size={15} /> Reprogramar
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => openDialog('status', appointment)}>
                      <Icon name="refresh" size={15} /> Estado
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => openDialog('cancel', appointment)}>
                      <Icon name="x" size={15} /> Cancelar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={dialog?.type === 'reschedule'}
        title="Reprogramar cita"
        confirmLabel="Guardar nueva fecha"
        loading={dialogSaving}
        error={dialogError}
        confirmDisabled={!dialogValues.scheduled_date || !dialogValues.start_time || !dialogValues.end_time}
        onCancel={closeDialog}
        onConfirm={confirmDialog}
      >
        <p>Nueva fecha y hora para la cita de <strong>{dialog ? patientName(dialog.appointment.patient_id) : ''}</strong>.</p>
        <div className="module-form-grid">
          <label className="field">
            <span className="field__label">Fecha</span>
            <input className="input" type="date" value={dialogValues.scheduled_date} onChange={updateDialog('scheduled_date')} disabled={dialogSaving} />
            <FieldError error={dialogFieldErrors.scheduled_date} />
          </label>
          <label className="field">
            <span className="field__label">Hora</span>
            <input className="input" type="time" value={dialogValues.start_time} onChange={updateDialog('start_time')} disabled={dialogSaving} />
            <FieldError error={dialogFieldErrors.start_time} />
          </label>
          <label className="field">
            <span className="field__label">Hora de fin</span>
            <input className="input" type="time" value={dialogValues.end_time} onChange={updateDialog('end_time')} disabled={dialogSaving} />
            <FieldError error={dialogFieldErrors.end_time} />
          </label>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.type === 'cancel'}
        title="Cancelar cita"
        confirmLabel="Cancelar cita"
        loading={dialogSaving}
        error={dialogError}
        confirmDisabled={dialogValues.reason.trim().length < 3}
        onCancel={closeDialog}
        onConfirm={confirmDialog}
      >
        <p>Indica el motivo de cancelación de la cita de <strong>{dialog ? patientName(dialog.appointment.patient_id) : ''}</strong>.</p>
        <label className="field">
          <span className="field__label">Motivo</span>
          <textarea className="input module-textarea" value={dialogValues.reason} onChange={updateDialog('reason')} disabled={dialogSaving} minLength={3} />
          <span className="field__hint">Mínimo 3 caracteres.</span>
          <FieldError error={dialogFieldErrors.cancellation_reason} />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.type === 'status'}
        title="Cambiar estado de la cita"
        confirmLabel="Actualizar estado"
        loading={dialogSaving}
        error={dialogError}
        onCancel={closeDialog}
        onConfirm={confirmDialog}
      >
        <p>Cita de <strong>{dialog ? patientName(dialog.appointment.patient_id) : ''}</strong>.</p>
        <label className="field">
          <span className="field__label">Estado</span>
          <select className="input" value={dialogValues.status} onChange={updateDialog('status')} disabled={dialogSaving}>
            {APPOINTMENT_STATUS_ACTIONS.map((status) => (
              <option key={status} value={status}>{appointmentStatusLabel(status)}</option>
            ))}
          </select>
          <FieldError error={dialogFieldErrors.status} />
        </label>
        <p className="field__hint">El servidor valida los cambios de estado permitidos para cada cita.</p>
      </ConfirmDialog>
    </>
  );
}

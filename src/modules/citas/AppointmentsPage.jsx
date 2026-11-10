import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
const MONTHS = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const LONG_DATE = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// La agenda todavía no tiene endpoint de citas. La vista queda preparada para
// recibir los eventos cuando exista el contrato, sin inventar datos.
const APPOINTMENTS = [];

function useCompactCalendar() {
  const [compact, setCompact] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 479.98px)').matches
  ));

  useEffect(() => {
    const query = window.matchMedia('(max-width: 479.98px)');
    const onChange = (event) => setCompact(event.matches);
    setCompact(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return compact;
}

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

function appointmentsForDay(day) {
  return APPOINTMENTS.filter((appointment) => appointment.date === dateKey(day));
}

export default function AppointmentsPage() {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const compactCalendar = useCompactCalendar();
  const agendaRef = useRef(null);

  const selectedAppointments = selectedDay ? appointmentsForDay(selectedDay) : [];

  const weekDates = useMemo(() => WEEKDAYS.map((_, index) => addDays(startOfWeek(date), index)), [date]);
  const monthCells = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = startOfWeek(first);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const count = Math.ceil((last.getDate() + ((first.getDay() + 6) % 7)) / 7) * 7;
    return Array.from({ length: count }, (_, index) => addDays(start, index));
  }, [date]);

  useEffect(() => {
    if (!compactCalendar) setSelectedDay(null);
  }, [compactCalendar]);

  useEffect(() => {
    if (selectedDay && agendaRef.current && window.matchMedia('(max-width: 479.98px)').matches) {
      agendaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedDay]);

  const navigate = (direction) => {
    setSelectedDay(null);
    if (view === 'month') setDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    else setDate((current) => addDays(current, direction * (view === 'week' ? 7 : 1)));
  };

  const goToday = () => {
    setDate(new Date());
    setSelectedDay(null);
  };

  const changeView = (option) => {
    setView(option);
    if (option !== 'month') setSelectedDay(null);
  };

  const handleDayClick = (cell) => {
    const isCompact = window.matchMedia('(max-width: 479.98px)').matches;
    if (isCompact) {
      setSelectedDay((current) => (
        current && dateKey(current) === dateKey(cell) ? null : cell
      ));
      return;
    }
    setDate(cell);
    setView('day');
  };

  return (
    <>
      <PageHeader
        title="Citas y agenda"
        description="Organiza la agenda clínica y consulta las citas por fecha."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setFormOpen((open) => !open)}>
            <Icon name="plus" size={17} /> Crear cita
          </button>
        }
      />
      <ModuleApiNotice moduleName="Citas">
        El contrato confirma que no existe API de citas. No se muestran eventos ni se guardan cambios; estados y catálogos deben definirse con backend.
      </ModuleApiNotice>

      {formOpen && (
        <section className="panel section" aria-labelledby="appointment-form-heading">
          <div className="module-section-heading">
            <h2 className="panel__title" id="appointment-form-heading">Nueva cita</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)}>Cerrar formulario</button>
          </div>
          <div className="module-form-grid">
            <label className="field">
              <span className="field__label">Paciente</span>
              <select className="input" disabled><option>Disponible al conectar el API de pacientes</option></select>
            </label>
            <label className="field">
              <span className="field__label">Odontólogo</span>
              <select className="input" disabled><option>Disponible al conectar el API de usuarios</option></select>
            </label>
            <label className="field">
              <span className="field__label">Fecha</span>
              <input className="input" type="date" />
            </label>
            <label className="field">
              <span className="field__label">Hora</span>
              <input className="input" type="time" />
            </label>
            <label className="field">
              <span className="field__label">Duración (minutos)</span>
              <input className="input" type="number" min="1" />
            </label>
            <label className="field">
              <span className="field__label">Estado</span>
              <input className="input" value="Valores por definir en el contrato" disabled readOnly />
            </label>
            <label className="field module-form-grid__wide">
              <span className="field__label">Motivo de consulta</span>
              <textarea className="input module-textarea" />
            </label>
          </div>
          <div className="form__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn--primary" disabled title="Pendiente de endpoint de citas">Guardar cita</button>
          </div>
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
            <h2 className="calendar-title">{view === 'month' ? MONTHS.format(date) : view === 'week' ? `Semana del ${weekDates[0].toLocaleDateString('es-CO')}` : LONG_DATE.format(date)}</h2>
          </div>
          <div className="module-segmented" role="group" aria-label="Vista de agenda">
            {['month', 'week', 'day'].map((option) => (
              <button
                type="button"
                key={option}
                className={view === option ? 'module-segmented__active' : ''}
                aria-pressed={view === option}
                onClick={() => changeView(option)}
              >
                {option === 'month' ? 'Mes' : option === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-filters">
          <label className="field">
            <span className="field__label">Odontólogo</span>
            <select className="input" disabled><option>Filtro disponible con datos de agenda</option></select>
          </label>
          <label className="field">
            <span className="field__label">Estado</span>
            <select className="input" disabled><option>Estados por definir en el contrato</option></select>
          </label>
        </div>

        {view === 'month' ? (
          <>
            <div className="calendar-month" aria-label="Calendario mensual">
              {WEEKDAYS.map((weekday) => <div className="calendar-month__weekday" key={weekday}>{weekday}</div>)}
              {monthCells.map((cell) => {
                const dayAppointments = appointmentsForDay(cell);
                const selected = Boolean(selectedDay) && dateKey(selectedDay) === dateKey(cell);
                return (
                  <button
                    type="button"
                    key={dateKey(cell)}
                    className={`calendar-month__cell ${cell.getMonth() !== date.getMonth() ? 'calendar-month__cell--outside' : ''} ${selected ? 'calendar-month__cell--selected' : ''}`.trim()}
                    onClick={() => handleDayClick(cell)}
                    aria-label={`${LONG_DATE.format(cell)}. ${dayAppointments.length > 0 ? `${dayAppointments.length} ${dayAppointments.length === 1 ? 'cita cargada' : 'citas cargadas'}.` : 'Sin citas cargadas.'}`}
                    aria-pressed={selected ? true : undefined}
                  >
                    <span className="calendar-month__day">{cell.getDate()}</span>
                    {dayAppointments.length > 0 && <span className="calendar-month__dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {selectedDay && (
              <section
                ref={agendaRef}
                className="calendar-day-agenda"
                aria-live="polite"
                aria-label={`Citas del ${LONG_DATE.format(selectedDay)}`}
              >
                <div className="calendar-day-agenda__head">
                  <div>
                    <p className="calendar-day-agenda__eyebrow">Agenda del día</p>
                    <h3 className="calendar-day-agenda__title">{LONG_DATE.format(selectedDay)}</h3>
                  </div>
                  <span className="badge badge--info">
                    {selectedAppointments.length} {selectedAppointments.length === 1 ? 'cita' : 'citas'}
                  </span>
                </div>
                {selectedAppointments.length > 0 ? (
                  <ul className="calendar-day-agenda__list">
                    {selectedAppointments.map((appointment) => (
                      <li className="calendar-day-agenda__item" key={appointment.id}>
                        <span className="calendar-day-agenda__time">{appointment.time}</span>
                        <span className="calendar-day-agenda__text">{appointment.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="calendar-day-agenda__empty">Sin citas cargadas para este día.</p>
                )}
              </section>
            )}
          </>
        ) : (
          <div className={`calendar-time-grid ${view === 'day' ? 'calendar-time-grid--day' : ''}`} aria-label={`Agenda ${view === 'week' ? 'semanal' : 'diaria'} sin citas cargadas`}>
            <div className="calendar-time-grid__header">
              <span />
              {(view === 'week' ? weekDates : [date]).map((day) => (
                <div key={dateKey(day)}>{WEEKDAYS[(day.getDay() + 6) % 7]} <strong>{day.getDate()}</strong></div>
              ))}
            </div>
            {HOURS.map((hour) => (
              <div className="calendar-time-grid__row" key={hour}>
                <span>{hour}</span>
                {(view === 'week' ? weekDates : [date]).map((day) => <div key={dateKey(day)} aria-hidden="true" />)}
              </div>
            ))}
          </div>
        )}
        <p className="module-muted calendar-caption">Las franjas se muestran como referencia horaria; no se han definido jornadas ni citas en el backend.</p>
      </section>
    </>
  );
}

import { useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
const MONTHS = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const LONG_DATE = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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

export default function AppointmentsPage() {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);

  const weekDates = useMemo(() => WEEKDAYS.map((_, index) => addDays(startOfWeek(date), index)), [date]);
  const monthCells = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = startOfWeek(first);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const count = Math.ceil((last.getDate() + ((first.getDay() + 6) % 7)) / 7) * 7;
    return Array.from({ length: count }, (_, index) => addDays(start, index));
  }, [date]);

  const navigate = (direction) => {
    if (view === 'month') setDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    else setDate((current) => addDays(current, direction * (view === 'week' ? 7 : 1)));
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
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setDate(new Date())}>Hoy</button>
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
                onClick={() => setView(option)}
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
          <div className="calendar-month" aria-label="Calendario mensual sin citas cargadas">
            {WEEKDAYS.map((weekday) => <div className="calendar-month__weekday" key={weekday}>{weekday}</div>)}
            {monthCells.map((cell) => (
              <button
                type="button"
                key={dateKey(cell)}
                className={`calendar-month__cell ${cell.getMonth() !== date.getMonth() ? 'calendar-month__cell--outside' : ''}`}
                onClick={() => { setDate(cell); setView('day'); }}
                aria-label={`${LONG_DATE.format(cell)}. Sin citas cargadas.`}
              >
                <span>{cell.getDate()}</span>
              </button>
            ))}
          </div>
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

import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import { FieldError } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { listAppointments } from '../../services/appointmentsService.js';
import {
  createOdontogramEntry,
  getCurrentOdontogram,
  getOdontogramHistory,
} from '../../services/odontogramService.js';
import { listPatients } from '../../services/patientsService.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { formatDateTime } from '../../utils/format.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import PatientAlertsBanner from '../pacientes/PatientAlertsBanner.jsx';
import CupsSearch, { CupsCodeLabel } from './CupsSearch.jsx';
import ToothSurfaceSelector from './ToothSurfaceSelector.jsx';
import { DENTITION, getSurfaceLabels } from './toothData.js';
import useToothSelection from './useToothSelection.js';

const HISTORY_LIMIT = 10;
const EMPTY = { appointment_id: '', condition_code: '', procedure_code: '', notes: '' };

function ToothButton({ number, arch, dentition, selected, hasFinding, onSelect }) {
  return (
    <button
      type="button"
      className={`tooth-button ${selected ? 'tooth-button--selected' : ''} ${hasFinding ? 'tooth-button--has-finding' : ''}`.trim()}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Pieza ${number}, dentición ${DENTITION[dentition].label.toLowerCase()}, ${arch === 'upper' ? 'arcada superior' : 'arcada inferior'}${hasFinding ? ', con hallazgos registrados' : ''}`}
    >
      <svg viewBox="0 0 42 46" aria-hidden="true">
        <path d="M10 5C5 5 3 10 5 16l4 15c1 4 4 5 6 1l4-8 4 8c2 4 5 3 6-1l4-15c2-6 0-11-5-11-3 0-5 2-7 2s-4-2-7-2Z" />
        <path d="M14 13c2-2 4-2 7-1" />
      </svg>
      <span>{number}</span>
      {hasFinding && <span className="tooth-button__dot" aria-hidden="true" />}
    </button>
  );
}

export default function OdontogramPage() {
  const toast = useToast();
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.ODONTOGRAM_VIEW);
  const canCreate = can(PERMISSIONS.ODONTOGRAM_CREATE);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dentition, setDentition] = useState('permanent');
  const [arch, setArch] = useState('upper');
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toothSelection = useToothSelection();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const patientsQuery = useAsync(
    () => listPatients({ search: debouncedQuery, limit: 10, offset: 0 }),
    { enabled: canView, deps: [debouncedQuery] },
  );
  const patients = Array.isArray(patientsQuery.data?.data) ? patientsQuery.data.data : [];

  const currentQuery = useAsync(
    () => getCurrentOdontogram(selectedPatient.id),
    { enabled: canView && Boolean(selectedPatient?.id), deps: [selectedPatient?.id] },
  );
  const currentEntries = Array.isArray(currentQuery.data) ? currentQuery.data : [];

  const byTooth = useMemo(() => {
    const map = new Map();
    currentEntries.forEach((entry) => {
      const key = String(entry.tooth_fdi);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return map;
  }, [currentEntries]);

  const historyQuery = useAsync(
    () => getOdontogramHistory(selectedPatient.id, { toothFdi: selectedTooth, limit: HISTORY_LIMIT, offset: historyOffset }),
    { enabled: canView && Boolean(selectedPatient?.id), deps: [selectedPatient?.id, selectedTooth, historyOffset] },
  );
  const history = Array.isArray(historyQuery.data?.data) ? historyQuery.data.data : [];
  const historyTotal = Number.isFinite(historyQuery.data?.total) ? historyQuery.data.total : history.length;
  const historyPages = Math.max(1, Math.ceil(historyTotal / HISTORY_LIMIT));
  const historyPage = Math.floor(historyOffset / HISTORY_LIMIT) + 1;

  const appointmentsQuery = useAsync(
    () => listAppointments({ patientId: selectedPatient?.id }),
    { enabled: Boolean(selectedPatient?.id) && formOpen, deps: [selectedPatient?.id, formOpen] },
  );
  const appointments = useMemo(
    () => (Array.isArray(appointmentsQuery.data) ? appointmentsQuery.data : []),
    [appointmentsQuery.data],
  );

  const teeth = DENTITION[dentition][arch];
  const selectedToothSelection = selectedTooth
    ? toothSelection.selections[selectedTooth] ?? { wholeTooth: false, surfaces: [] }
    : null;
  const toothEntries = selectedTooth ? byTooth.get(String(selectedTooth)) ?? [] : [];
  const surfaceLabels = selectedTooth ? getSurfaceLabels(selectedTooth, arch) : {};

  function choosePatient(patient) {
    setSelectedPatient(patient);
    setSelectedTooth(null);
    setHistoryOffset(0);
    setFormOpen(false);
    setValues(EMPTY);
    setFormError('');
  }

  function selectTooth(number) {
    setSelectedTooth(number);
    setHistoryOffset(0);
    setFormError('');
    setFieldErrors({});
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!selectedPatient || !selectedTooth || saving) return;
    setFormError('');
    setFieldErrors({});
    const surfaces = toothSelection.selections[selectedTooth]?.surfaces ?? [];
    const wholeTooth = toothSelection.selections[selectedTooth]?.wholeTooth ?? false;
    if (!wholeTooth && surfaces.length === 0) {
      setFormError('Selecciona al menos una superficie (o el diente completo) para registrar el hallazgo.');
      return;
    }
    if (!values.appointment_id) {
      setFieldErrors({ appointment_id: 'Selecciona la cita asociada al hallazgo.' });
      return;
    }
    if (!values.condition_code.trim() && !values.procedure_code.trim()) {
      setFormError('Registra al menos un código de condición o un procedimiento CUPS.');
      return;
    }
    setSaving(true);
    try {
      // `surface` es nullable en el contrato: diente completo se envía sin superficie.
      const targets = wholeTooth ? [null] : surfaces;
      for (const surface of targets) {
        await createOdontogramEntry({
          appointment_id: Number(values.appointment_id),
          tooth_fdi: Number(selectedTooth),
          surface,
          condition_code: values.condition_code.trim() || undefined,
          procedure_code: values.procedure_code.trim() || undefined,
          notes: values.notes,
        });
      }
      toast.success(`Hallazgo registrado en la pieza ${selectedTooth}.`);
      setValues(EMPTY);
      setFormOpen(false);
      await Promise.all([currentQuery.reload({ silent: true }), historyQuery.reload({ silent: true })]);
    } catch (error) {
      const validationErrors = getFieldErrors(error);
      setFieldErrors(validationErrors);
      setFormError(Object.keys(validationErrors).length ? '' : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Odontograma"
        description="Consulta el estado dental por pieza y registra hallazgos clínicos."
      />

      <section className="panel section">
        <div className="module-toolbar">
          <div>
            <h2 className="panel__title">Paciente</h2>
            <p className="module-muted">El odontograma se consulta por paciente.</p>
          </div>
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, correo o documento"
              aria-label="Buscar paciente para el odontograma"
            />
          </label>
        </div>

        {patientsQuery.loading && <LoadingState message="Buscando pacientes…" showSlowNotice={false} />}
        {!patientsQuery.loading && patientsQuery.error && (
          <ErrorState message={patientsQuery.error} onRetry={() => patientsQuery.reload()} title="No se pudo buscar pacientes" />
        )}
        {!patientsQuery.loading && !patientsQuery.error && patients.length === 0 && (
          <EmptyState icon="users" title="Sin pacientes" text={query ? 'Ningún paciente coincide con tu búsqueda.' : 'Registra pacientes para consultar su odontograma.'} />
        )}
        {!patientsQuery.loading && !patientsQuery.error && patients.length > 0 && (
          <ul className="result-list">
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  className={`result-item ${selectedPatient?.id === patient.id ? 'result-item--active' : ''}`.trim()}
                  onClick={() => choosePatient(patient)}
                  aria-pressed={selectedPatient?.id === patient.id}
                >
                  <span className="result-item__main">
                    <strong>{patient.full_name}</strong>
                    <span className="module-muted">{patient.document_number || patient.email || 'Sin documento'}</span>
                  </span>
                  <Icon name="arrow-right" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedPatient && (
        <div className="odontogram-layout section">
          <section className="panel odontogram-panel">
            <div className="module-section-heading">
              <div>
                <h2 className="panel__title">{selectedPatient.full_name}</h2>
                <p className="module-muted">Estado actual: {byTooth.size} {byTooth.size === 1 ? 'pieza con hallazgos' : 'piezas con hallazgos'}</p>
              </div>
              {currentQuery.loading && <Spinner size={18} />}
            </div>

            <PatientAlertsBanner patientId={selectedPatient.id} />

            {currentQuery.error && (
              <ErrorState message={currentQuery.error} onRetry={() => currentQuery.reload()} title="No se pudo cargar el odontograma" />
            )}

            <div className="odontogram-controls section">
              <div className="module-segmented" role="group" aria-label="Tipo de dentición">
                {Object.entries(DENTITION).map(([key, value]) => (
                  <button
                    type="button"
                    key={key}
                    className={dentition === key ? 'module-segmented__active' : ''}
                    aria-pressed={dentition === key}
                    onClick={() => { setDentition(key); setSelectedTooth(null); }}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
              <div className="module-segmented" role="group" aria-label="Arcada dental">
                {[['upper', 'Superior'], ['lower', 'Inferior']].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={arch === key ? 'module-segmented__active' : ''}
                    aria-pressed={arch === key}
                    onClick={() => { setArch(key); setSelectedTooth(null); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="odontogram-arch">
              <div className="odontogram-arch__labels">
                <span>Derecha del paciente</span>
                <span>{arch === 'upper' ? 'Arcada superior' : 'Arcada inferior'}</span>
                <span>Izquierda del paciente</span>
              </div>
              <div className="tooth-row">
                {teeth.map((number) => (
                  <ToothButton
                    key={number}
                    number={number}
                    arch={arch}
                    dentition={dentition}
                    selected={selectedTooth === number}
                    hasFinding={byTooth.has(String(number))}
                    onSelect={() => selectTooth(number)}
                  />
                ))}
              </div>
            </div>
            <p className="odontogram-caption">Numeración FDI · Las piezas con punto tienen hallazgos registrados.</p>
          </section>

          <aside className="panel odontogram-details" aria-live="polite">
            <span className="odontogram-details__icon"><Icon name="tooth" size={23} /></span>
            <h2 className="panel__title">Detalle de pieza</h2>
            {!selectedTooth && (
              <p className="module-muted">Selecciona una pieza dental para consultar sus hallazgos y su historial.</p>
            )}
            {selectedTooth && (
              <>
                <dl className="details">
                  <div className="detail"><dt>Identificador FDI</dt><dd>{selectedTooth}</dd></div>
                  <div className="detail"><dt>Dentición</dt><dd>{DENTITION[dentition].label}</dd></div>
                  <div className="detail"><dt>Arcada</dt><dd>{arch === 'upper' ? 'Superior' : 'Inferior'}</dd></div>
                  {toothEntries.length === 0 ? (
                    <div className="detail"><dt>Estado actual</dt><dd>Sin hallazgos registrados</dd></div>
                  ) : (
                    toothEntries.map((entry) => (
                      <div className="detail" key={entry.id}>
                        <dt>{surfaceLabels[entry.surface] ?? entry.surface ?? 'Diente completo'}</dt>
                        <dd>
                          {entry.condition_name || entry.condition_code || '—'}
                          {(entry.procedure_code || entry.procedure_name) && (
                            <> · <CupsCodeLabel code={entry.procedure_code} name={entry.procedure_name} /></>
                          )}
                        </dd>
                      </div>
                    ))
                  )}
                </dl>

                {canCreate && (
                  <>
                    <ToothSurfaceSelector
                      toothNumber={selectedTooth}
                      arch={arch}
                      selection={selectedToothSelection}
                      onToggleSurface={(surface) => toothSelection.toggleSurface(selectedTooth, surface)}
                      onToggleWholeTooth={() => toothSelection.toggleWholeTooth(selectedTooth)}
                    />
                    <FieldError error={fieldErrors.tooth_fdi} />
                    <FieldError error={fieldErrors.surface} />
                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      onClick={() => { setFormOpen((open) => !open); setFormError(''); }}
                    >
                      <Icon name="plus" size={16} /> Registrar hallazgo
                    </button>
                  </>
                )}
              </>
            )}

            {formOpen && canCreate && selectedTooth && (
              <form onSubmit={handleCreate} className="form form--spaced">
                {formError && <Alert type="error">{formError}</Alert>}
                <label className="field">
                  <span className="field__label">Cita asociada</span>
                  <select className="input" value={values.appointment_id} onChange={(event) => { setValues((v) => ({ ...v, appointment_id: event.target.value })); setFieldErrors((current) => ({ ...current, appointment_id: '' })); }} disabled={saving} required>
                    <option value="">Selecciona una cita</option>
                    {appointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {String(appointment.scheduled_date ?? '').slice(0, 10)} {String(appointment.start_time ?? '').slice(0, 5)}
                      </option>
                    ))}
                  </select>
                  <FieldError error={fieldErrors.appointment_id} />
                  {!appointmentsQuery.loading && appointments.length === 0 && (
                    <span className="field__hint">El paciente no tiene citas activas.</span>
                  )}
                </label>
                <label className="field">
                  <span className="field__label">Código de condición</span>
                  <input className="input" value={values.condition_code} onChange={(event) => { setValues((v) => ({ ...v, condition_code: event.target.value })); setFieldErrors((current) => ({ ...current, condition_code: '' })); }} disabled={saving} placeholder="Ej. caries" />
                  <span className="field__hint">El backend valida el código contra los catálogos dentales.</span>
                  <FieldError error={fieldErrors.condition_code} />
                </label>
                <div className="field">
                  <span className="field__label">Procedimiento CUPS</span>
                  <CupsSearch
                    id="odontogram-procedure-code"
                    value={values.procedure_code}
                    onChange={(code) => {
                      setValues((v) => ({ ...v, procedure_code: code }));
                      setFieldErrors((current) => ({ ...current, procedure_code: '' }));
                    }}
                    disabled={saving}
                    error={fieldErrors.procedure_code}
                  />
                  <span className="field__hint">
                    Busca por código (ej. 2321) o palabras (ej. obturación resina). Debe existir al menos un código de condición o un procedimiento.
                  </span>
                </div>
                <label className="field">
                  <span className="field__label">Notas</span>
                  <textarea className="input module-textarea" value={values.notes} onChange={(event) => { setValues((v) => ({ ...v, notes: event.target.value })); setFieldErrors((current) => ({ ...current, notes: '' })); }} disabled={saving} maxLength={500} />
                  <FieldError error={fieldErrors.notes} />
                </label>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <Spinner size={16} /> : <Icon name="tooth" size={16} />}
                  {saving ? 'Guardando…' : 'Guardar hallazgo'}
                </button>
              </form>
            )}
          </aside>
        </div>
      )}

      {selectedPatient && (
        <section className="panel section" aria-labelledby="odontogram-history-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="odontogram-history-heading">
                Historial {selectedTooth ? `de la pieza ${selectedTooth}` : 'del paciente'}
              </h2>
              <p className="module-muted">{historyTotal} {historyTotal === 1 ? 'registro' : 'registros'}</p>
            </div>
            {selectedTooth && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setSelectedTooth(null); setHistoryOffset(0); }}>
                Ver todo el historial
              </button>
            )}
          </div>

          {historyQuery.loading && <LoadingState message="Cargando historial…" showSlowNotice={false} />}
          {!historyQuery.loading && historyQuery.error && (
            <ErrorState message={historyQuery.error} onRetry={() => historyQuery.reload()} title="No se pudo cargar el historial" />
          )}
          {!historyQuery.loading && !historyQuery.error && history.length === 0 && (
            <EmptyState icon="tooth" title="Sin historial" text="Aún no hay hallazgos registrados para esta selección." />
          )}
          {!historyQuery.loading && !historyQuery.error && history.length > 0 && (
            <>
              <ul className="record-list">
                {history.map((entry) => (
                  <li className="record-card" key={entry.id}>
                    <div className="record-card__head record-card__head--static">
                      <span>
                        <strong>Pieza {entry.tooth_fdi} · {surfaceLabels[entry.surface] ?? entry.surface ?? 'Diente completo'}</strong>
                        <span className="module-muted">
                          {' '}· {entry.condition_name || entry.condition_code || '—'}
                          {(entry.procedure_code || entry.procedure_name) && (
                            <> · <CupsCodeLabel code={entry.procedure_code} name={entry.procedure_name} /></>
                          )}
                        </span>
                      </span>
                      <span className="module-muted">{formatDateTime(entry.created_at)}</span>
                    </div>
                    {entry.notes && <p className="record-card__note">{entry.notes}</p>}
                  </li>
                ))}
              </ul>
              <div className="pagination" role="navigation" aria-label="Paginación del odontograma">
                <span className="pagination__info">{historyTotal > 0 ? `${historyOffset + 1}–${Math.min(historyOffset + HISTORY_LIMIT, historyTotal)} de ${historyTotal}` : '0 registros'}</span>
                <div className="pagination__actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setHistoryOffset((current) => Math.max(0, current - HISTORY_LIMIT))} disabled={historyOffset === 0 || historyQuery.loading}>Anterior</button>
                  <span className="pagination__page">Página {historyPage} de {historyPages}</span>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setHistoryOffset((current) => current + HISTORY_LIMIT)} disabled={historyOffset + HISTORY_LIMIT >= historyTotal || historyQuery.loading}>Siguiente</button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import { FieldError } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { CLINICAL_TEXT_MIN_LENGTH } from '../../constants/apiValues.js';
import { listAppointments } from '../../services/appointmentsService.js';
import { createClinicalEntry, getClinicalEntry, listClinicalHistory } from '../../services/clinicalHistoryService.js';
import { listPatients } from '../../services/patientsService.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { formatDateTime } from '../../utils/format.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import PatientAlertsBanner from '../pacientes/PatientAlertsBanner.jsx';

const LIMIT = 10;
const EMPTY = {
  appointment_id: '',
  motivo_consulta: '',
  antecedentes: '',
  examen: '',
  diagnostico: '',
  tratamiento: '',
};

const FIELDS = [
  ['motivo_consulta', 'Motivo de consulta'],
  ['antecedentes', 'Antecedentes'],
  ['examen', 'Examen clínico'],
  ['diagnostico', 'Diagnóstico'],
  ['tratamiento', 'Tratamiento'],
];

const REQUIRED_FIELDS = [
  ['motivo_consulta', 'El motivo de consulta'],
  ['examen', 'El examen clínico'],
  ['diagnostico', 'El diagnóstico'],
  ['tratamiento', 'El tratamiento'],
];

function patientLabel(patient) {
  return [patient?.full_name, patient?.document_number ? `· ${patient.document_number}` : ''].filter(Boolean).join(' ');
}

export default function ClinicalHistoryPage() {
  const toast = useToast();
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.CLINICAL_HISTORY_VIEW);
  const canCreate = can(PERMISSIONS.CLINICAL_HISTORY_CREATE);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const patientsQuery = useAsync(
    () => listPatients({ search: debouncedQuery, limit: 10, offset: 0 }),
    { enabled: canView, deps: [debouncedQuery] },
  );
  const patients = Array.isArray(patientsQuery.data?.data) ? patientsQuery.data.data : [];

  const historyQuery = useAsync(
    () => listClinicalHistory({ patientId: selected?.id, limit: LIMIT, offset }),
    { enabled: canView && Boolean(selected?.id), deps: [selected?.id, offset] },
  );
  const entries = Array.isArray(historyQuery.data?.data) ? historyQuery.data.data : [];
  const total = Number.isFinite(historyQuery.data?.total) ? historyQuery.data.total : entries.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const page = Math.floor(offset / LIMIT) + 1;

  const appointmentsQuery = useAsync(
    () => listAppointments({ patientId: selected?.id }),
    { enabled: Boolean(selected?.id) && formOpen, deps: [selected?.id, formOpen] },
  );
  const appointments = useMemo(
    () => (Array.isArray(appointmentsQuery.data) ? appointmentsQuery.data : []),
    [appointmentsQuery.data],
  );

  function choosePatient(patient) {
    setSelected(patient);
    setOffset(0);
    setExpanded(null);
    setDetail(null);
    setFormOpen(false);
    setValues(EMPTY);
  }

  async function toggleEntry(entry) {
    if (expanded === entry.id) {
      setExpanded(null);
      return;
    }
    setExpanded(entry.id);
    setDetail(null);
    try {
      const full = await getClinicalEntry(entry.id);
      setDetail(full);
    } catch {
      // El listado ya contiene la información; el detalle es un complemento.
      setDetail(entry);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!selected || saving) return;
    setFormError('');
    setFieldErrors({});
    if (!values.appointment_id) {
      setFormError('Selecciona la cita que se está atendiendo: solo se permite una entrada por cita.');
      return;
    }
    const missing = REQUIRED_FIELDS.find(([field]) => String(values[field] ?? '').trim().length < CLINICAL_TEXT_MIN_LENGTH);
    if (missing) {
      setFieldErrors({ [missing[0]]: `${missing[1]} debe tener al menos ${CLINICAL_TEXT_MIN_LENGTH} caracteres.` });
      return;
    }
    setSaving(true);
    try {
      // ClinicalEntryCreateIn no acepta patient_id: el backend lo deduce de la cita.
      await createClinicalEntry({
        appointment_id: Number(values.appointment_id),
        motivo_consulta: values.motivo_consulta.trim(),
        antecedentes: values.antecedentes.trim() || undefined,
        examen: values.examen.trim(),
        diagnostico: values.diagnostico.trim(),
        tratamiento: values.tratamiento.trim(),
      });
      toast.success('Consulta registrada correctamente.');
      setFormOpen(false);
      setValues(EMPTY);
      setOffset(0);
      await historyQuery.reload();
    } catch (error) {
      const validationErrors = getFieldErrors(error);
      setFieldErrors(validationErrors);
      setFormError(Object.keys(validationErrors).length ? '' : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const shown = expanded && detail && detail.id === expanded ? detail : entries.find((entry) => entry.id === expanded);

  return (
    <>
      <PageHeader
        title="Historia clínica"
        description="Consulta las consultas registradas y documenta la evolución del paciente."
      />

      <section className="panel section">
        <div className="module-toolbar">
          <div>
            <h2 className="panel__title">Buscar paciente</h2>
            <p className="module-muted">Selecciona un paciente para consultar su historia clínica.</p>
          </div>
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, correo o documento"
              aria-label="Buscar paciente para consultar la historia clínica"
            />
          </label>
        </div>

        {patientsQuery.loading && <LoadingState message="Buscando pacientes…" showSlowNotice={false} />}
        {!patientsQuery.loading && patientsQuery.error && (
          <ErrorState message={patientsQuery.error} onRetry={() => patientsQuery.reload()} title="No se pudo buscar pacientes" />
        )}
        {!patientsQuery.loading && !patientsQuery.error && patients.length === 0 && (
          <EmptyState icon="users" title="Sin pacientes" text={query ? 'Ningún paciente coincide con tu búsqueda.' : 'Registra pacientes para consultar su historia clínica.'} />
        )}
        {!patientsQuery.loading && !patientsQuery.error && patients.length > 0 && (
          <ul className="result-list">
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  className={`result-item ${selected?.id === patient.id ? 'result-item--active' : ''}`.trim()}
                  onClick={() => choosePatient(patient)}
                  aria-pressed={selected?.id === patient.id}
                >
                  <span className="result-item__main">
                    <strong>{patient.full_name}</strong>
                    <span className="module-muted">{patientLabel(patient)}</span>
                  </span>
                  <Icon name="arrow-right" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <section className="panel section" aria-labelledby="clinical-history-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="clinical-history-heading">{selected.full_name}</h2>
              <p className="module-muted">
                {selected.document_type ? `${selected.document_type} ` : ''}{selected.document_number || 'Sin documento'} · {total} {total === 1 ? 'registro' : 'registros'}
              </p>
            </div>
            {canCreate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => { setFormOpen((open) => !open); setFormError(''); }}
              >
                <Icon name="plus" size={16} /> Registrar consulta
              </button>
            )}
          </div>

          <PatientAlertsBanner patientId={selected.id} />

          {formOpen && canCreate && (
            <form onSubmit={handleCreate} className="form form--spaced">
              {formError && <Alert type="error">{formError}</Alert>}
              <label className="field">
                <span className="field__label">Cita atendida</span>
                <select
                  className="input"
                  value={values.appointment_id}
                  onChange={(event) => {
                    setValues((v) => ({ ...v, appointment_id: event.target.value }));
                    setFieldErrors((current) => ({ ...current, appointment_id: '' }));
                  }}
                  disabled={saving || appointmentsQuery.loading}
                  required
                >
                  <option value="">Selecciona una cita</option>
                  {appointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {String(appointment.scheduled_date ?? '').slice(0, 10)} {String(appointment.start_time ?? '').slice(0, 5)} · {appointment.reason || 'Sin motivo'}
                    </option>
                  ))}
                </select>
                <FieldError error={fieldErrors.appointment_id} />
                {appointmentsQuery.loading && <span className="field__hint">Cargando citas del paciente…</span>}
                {!appointmentsQuery.loading && appointments.length === 0 && (
                  <span className="field__hint">No hay citas disponibles. Crea una cita antes de registrar la consulta.</span>
                )}
              </label>
              <div className="module-form-grid">
                {FIELDS.map(([field, label]) => (
                  <label key={field} className={`field ${field === 'motivo_consulta' || field === 'antecedentes' ? 'module-form-grid__wide' : ''}`}>
                    <span className="field__label">{label}</span>
                    <textarea
                      className="input module-textarea"
                      value={values[field]}
                      onChange={(event) => {
                        setValues((v) => ({ ...v, [field]: event.target.value }));
                        setFieldErrors((current) => ({ ...current, [field]: '' }));
                      }}
                      disabled={saving}
                      required={REQUIRED_FIELDS.some(([requiredField]) => requiredField === field)}
                      minLength={REQUIRED_FIELDS.some(([requiredField]) => requiredField === field) ? CLINICAL_TEXT_MIN_LENGTH : undefined}
                    />
                    <FieldError error={fieldErrors[field]} />
                  </label>
                ))}
              </div>
              <div className="form__actions">
                <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <Spinner size={16} /> : <Icon name="file-text" size={16} />}
                  {saving ? 'Guardando…' : 'Guardar consulta'}
                </button>
              </div>
            </form>
          )}

          {historyQuery.loading && <LoadingState message="Cargando historia clínica…" />}
          {!historyQuery.loading && historyQuery.error && (
            <ErrorState message={historyQuery.error} onRetry={() => historyQuery.reload()} title="No se pudo cargar la historia clínica" />
          )}
          {!historyQuery.loading && !historyQuery.error && entries.length === 0 && (
            <EmptyState icon="file-text" title="Sin registros clínicos" text="Cuando se registre una consulta aparecerá aquí." />
          )}
          {!historyQuery.loading && !historyQuery.error && entries.length > 0 && (
            <>
              <ul className="record-list">
                {entries.map((entry) => (
                  <li key={entry.id} className="record-card">
                    <button type="button" className="record-card__head" onClick={() => toggleEntry(entry)} aria-expanded={expanded === entry.id}>
                      <span>
                        <strong>{entry.motivo_consulta || 'Consulta clínica'}</strong>
                        <span className="module-muted"> · {formatDateTime(entry.created_at)}</span>
                      </span>
                      <Icon name={expanded === entry.id ? 'chevron-down' : 'arrow-right'} size={16} />
                    </button>
                    {expanded === entry.id && shown && (
                      <dl className="details record-card__body">
                        {FIELDS.map(([field, label]) => (
                          <div className="detail" key={field}>
                            <dt>{label}</dt>
                            <dd>{shown[field] || '—'}</dd>
                          </div>
                        ))}
                        <div className="detail"><dt>Profesional</dt><dd>{shown.dentist_name || '—'}</dd></div>
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pagination" role="navigation" aria-label="Paginación de la historia clínica">
                <span className="pagination__info">{total > 0 ? `${offset + 1}–${Math.min(offset + LIMIT, total)} de ${total}` : '0 registros'}</span>
                <div className="pagination__actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => Math.max(0, current - LIMIT))} disabled={offset === 0 || historyQuery.loading}>Anterior</button>
                  <span className="pagination__page">Página {page} de {pages}</span>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => current + LIMIT)} disabled={offset + LIMIT >= total || historyQuery.loading}>Siguiente</button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}

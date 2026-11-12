import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import {
  checkPatient,
  createPatient,
  getPatient,
  linkPatient,
  listPatients,
  updatePatient,
} from '../../services/patientsService.js';
import { ApiError, getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import {
  validateEmail,
  validateFullName,
  validatePatientDocument,
  validatePhone,
  validateRequired,
} from '../../utils/validators.js';
import PatientClinicalFields, {
  DOCUMENT_TYPES,
  EpsField,
  GenderField,
} from './PatientClinicalFields.jsx';

const LIMIT = 10;

/** Datos mínimos para el registro rápido desde recepción. */
const EMPTY_CREATE = {
  first_name: '',
  last_name: '',
  document_type: 'CC',
  document_number: '',
  email: '',
  phone_number: '',
  gender: '',
  eps: '',
};

/** Campos clínicos opcionales que se completan después, en el detalle del paciente. */
const EMPTY_CLINICAL = {
  document_type: 'CC',
  birth_date: '',
  gender: '',
  blood_type: '',
  address: '',
  eps: '',
  allergies: '',
  notes: '',
  guardian_full_name: '',
  guardian_document_number: '',
  guardian_phone: '',
  guardian_relationship: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

function RequiredMark() {
  return <span className="field__required" aria-hidden="true">*</span>;
}

function patientName(patient) {
  return patient?.full_name ?? patient?.name ?? '—';
}

function patientDocument(patient) {
  return [patient?.document_type, patient?.document_number].filter(Boolean).join(' ') || '—';
}

export default function PatientsPage() {
  const toast = useToast();
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.PATIENTS_VIEW);
  const canCreate = can(PERMISSIONS.PATIENTS_CREATE);
  const canEdit = can(PERMISSIONS.PATIENTS_EDIT);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_CREATE);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editValues, setEditValues] = useState(EMPTY_CLINICAL);
  const [editError, setEditError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => listPatients({ search: debouncedQuery, limit: LIMIT, offset }),
    { enabled: canView, deps: [debouncedQuery, offset] },
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const patients = Array.isArray(data?.data) ? data.data : [];
  const total = Number.isFinite(data?.total) ? data.total : patients.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const page = Math.floor(offset / LIMIT) + 1;

  const fullName = [values.first_name, values.last_name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  const errors = useMemo(() => {
    const firstNameError = validateRequired(values.first_name, 'El nombre');
    const lastNameError = validateRequired(values.last_name, 'El apellido');
    const fullNameError = !firstNameError && !lastNameError ? validateFullName(fullName) : '';
    return {
      first_name: firstNameError || fullNameError,
      last_name: lastNameError,
      document_type: validateRequired(values.document_type, 'El tipo de documento'),
      document_number: validatePatientDocument(values.document_number),
      email: validateEmail(values.email),
      phone_number: validatePhone(values.phone_number),
      gender: validateRequired(values.gender, 'El sexo'),
    };
  }, [values, fullName]);

  const showError = (field) => serverErrors[field] || (touched[field] || touched.all ? errors[field] : '');
  const alreadyRegisteredHere = Boolean(
    check?.user_exists && check?.has_patient_profile && check?.same_clinic,
  );

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setCheck(null);
  };
  const update = (field) => (event) => updateField(field, event.target.value);
  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  function openCreate() {
    setValues(EMPTY_CREATE);
    setTouched({});
    setServerErrors({});
    setFormError('');
    setCheck(null);
    setFormOpen(true);
  }

  async function verifyExisting() {
    if (checking) return null;
    if (!values.email.trim() && !values.document_number.trim()) {
      setFormError('Ingresa el correo o el número de documento para verificar si el paciente ya existe.');
      return null;
    }
    setChecking(true);
    setFormError('');
    try {
      const result = await checkPatient({
        email: values.email.trim(),
        documentNumber: values.document_number.trim(),
      });
      setCheck(result ?? null);
      return result;
    } catch (checkError) {
      setFormError(getErrorMessage(checkError));
      return null;
    } finally {
      setChecking(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (saving) return;
    setTouched({ all: true });
    setFormError('');
    setServerErrors({});
    if (Object.values(errors).some(Boolean)) return;

    setSaving(true);
    try {
      // La verificación es informativa: si falla, se intenta crear de todos modos.
      let existing = check;
      if (!existing) {
        try {
          existing = await checkPatient({
            email: values.email.trim(),
            documentNumber: values.document_number.trim(),
          });
          setCheck(existing);
        } catch {
          existing = null;
        }
      }

      if (existing?.user_exists && existing?.has_patient_profile && existing?.same_clinic) {
        setFormError('Este paciente ya está registrado en tu clínica. Búscalo en el listado para consultar o editar sus datos.');
        return;
      }

      const payload = {
        full_name: fullName,
        email: values.email.trim(),
        document_number: values.document_number.trim(),
        phone_number: values.phone_number.trim(),
        document_type: values.document_type,
        gender: values.gender,
        eps: values.eps || undefined,
      };

      if (existing?.user_exists) {
        await linkPatient(payload);
      } else {
        await createPatient(payload);
      }

      toast.success(
        existing?.user_exists
          ? 'Paciente vinculado a la clínica correctamente.'
          : 'Paciente registrado correctamente.',
      );
      setFormOpen(false);
      setOffset(0);
      reload();
    } catch (createError) {
      if (createError instanceof ApiError && createError.status === 422) {
        const fieldErrors = getFieldErrors(createError);
        if (fieldErrors.full_name) {
          fieldErrors.first_name = fieldErrors.full_name;
          delete fieldErrors.full_name;
        }
        setServerErrors(fieldErrors);
        setFormError(Object.keys(fieldErrors).length ? '' : getErrorMessage(createError));
      } else if (createError instanceof ApiError && createError.status === 409) {
        setFormError('No fue posible vincular al paciente porque ya existe un registro con estos datos. Verifica el documento y el correo, o búscalo en el listado.');
      } else {
        setFormError(getErrorMessage(createError));
      }
    } finally {
      setSaving(false);
    }
  }

  async function openPatient(patient) {
    setSelected(patient);
    setEditValues({ ...EMPTY_CLINICAL, ...patient });
    setEditError('');
    setEditFieldErrors({});
    setDetailLoading(true);
    try {
      const detail = await getPatient(patient.id);
      if (detail) {
        setSelected(detail);
        setEditValues({ ...EMPTY_CLINICAL, ...detail });
      }
    } catch (detailError) {
      setEditError(getErrorMessage(detailError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!selected || editSaving) return;
    setEditSaving(true);
    setEditError('');
    setEditFieldErrors({});
    try {
      const updated = await updatePatient(selected.id, editValues);
      toast.success('Datos del paciente actualizados.');
      setSelected(updated && typeof updated === 'object' ? updated : { ...selected, ...editValues });
      setEditValues((current) => ({ ...current, ...(updated && typeof updated === 'object' ? updated : {}) }));
      reload({ silent: true });
    } catch (updateError) {
      const fieldErrors = getFieldErrors(updateError);
      setEditFieldErrors(fieldErrors);
      setEditError(Object.keys(fieldErrors).length ? '' : getErrorMessage(updateError));
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Consulta, registra y actualiza la información clínica de tus pacientes."
        actions={
          canCreate && (
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              <Icon name="plus" size={17} /> Registrar paciente
            </button>
          )
        }
      />

      {formOpen && (
        <section className="panel section" aria-labelledby="patient-form-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="patient-form-heading">Nuevo paciente</h2>
              <p className="module-muted">
                Registro rápido. Los datos clínicos opcionales se completan después desde el detalle del paciente.
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cerrar formulario
            </button>
          </div>

          <form onSubmit={handleCreate} noValidate className="form form--spaced">
            {formError && <Alert type="error">{formError}</Alert>}
            {!saving && !formError && check && (
              <Alert type="info">
                {alreadyRegisteredHere
                  ? `El paciente ${check.full_name ?? ''} ya está registrado en tu clínica. Búscalo en el listado para consultar o editar sus datos.`
                  : check.user_exists && check.same_clinic
                    ? `El usuario ${check.full_name ?? ''} ya existe en tu clínica y todavía no tiene perfil de paciente. Al guardar se creará el perfil.`
                    : check.user_exists
                      ? `Encontramos a ${check.full_name ?? 'este usuario'} registrado en otra clínica. Al guardar se vinculará como paciente de esta clínica.`
                      : 'No encontramos un usuario con estos datos. Al guardar se creará el paciente con una contraseña temporal.'}
              </Alert>
            )}

            <p className="form__note">
              Los campos marcados con <RequiredMark /> son obligatorios.
            </p>

            <div className="module-form-grid">
              <label className="field">
                <span className="field__label">Nombres <RequiredMark /></span>
                <input
                  className="input"
                  value={values.first_name}
                  onChange={update('first_name')}
                  onBlur={blur('first_name')}
                  disabled={saving}
                  autoComplete="off"
                  maxLength={75}
                  required
                />
                {showError('first_name') && <p className="field__error">{showError('first_name')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Apellidos <RequiredMark /></span>
                <input
                  className="input"
                  value={values.last_name}
                  onChange={update('last_name')}
                  onBlur={blur('last_name')}
                  disabled={saving}
                  autoComplete="off"
                  maxLength={75}
                  required
                />
                {showError('last_name') && <p className="field__error">{showError('last_name')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Tipo de documento <RequiredMark /></span>
                <select className="input" value={values.document_type} onChange={update('document_type')} disabled={saving} required>
                  {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {showError('document_type') && <p className="field__error">{showError('document_type')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Número de documento <RequiredMark /></span>
                <input
                  className="input"
                  value={values.document_number}
                  onChange={update('document_number')}
                  onBlur={blur('document_number')}
                  disabled={saving}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="off"
                  required
                />
                {showError('document_number') && <p className="field__error">{showError('document_number')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Correo electrónico <RequiredMark /></span>
                <input
                  className="input"
                  type="email"
                  value={values.email}
                  onChange={update('email')}
                  onBlur={blur('email')}
                  disabled={saving}
                  autoComplete="off"
                  required
                />
                {showError('email') && <p className="field__error">{showError('email')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Teléfono <RequiredMark /></span>
                <input
                  className="input"
                  type="tel"
                  value={values.phone_number}
                  onChange={update('phone_number')}
                  onBlur={blur('phone_number')}
                  disabled={saving}
                  autoComplete="off"
                  required
                />
                {showError('phone_number') && <p className="field__error">{showError('phone_number')}</p>}
              </label>
              <label className="field">
                <span className="field__label">Sexo <RequiredMark /></span>
                <GenderField
                  value={values.gender}
                  onChange={(value) => updateField('gender', value)}
                  disabled={saving}
                  error={showError('gender')}
                  required
                />
              </label>
              <div className="field">
                <span className="field__label">EPS</span>
                <EpsField
                  value={values.eps}
                  onChange={(value) => updateField('eps', value)}
                  disabled={saving}
                  error={showError('eps')}
                />
              </div>
            </div>

            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={verifyExisting} disabled={saving || checking}>
                {checking ? <Spinner size={16} /> : <Icon name="search" size={16} />} Verificar paciente
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? <Spinner size={16} /> : <Icon name="user-plus" size={17} />}
                {saving ? 'Guardando…' : 'Guardar paciente'}
              </button>
            </div>
          </form>
        </section>
      )}

      {selected && (
        <section className="panel section" aria-labelledby="patient-detail-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="patient-detail-heading">{patientName(selected)}</h2>
              <p className="module-muted">Documento {patientDocument(selected)} · {selected.email || 'Sin correo'}</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>Cerrar detalle</button>
          </div>
          {detailLoading && <LoadingState message="Cargando detalle del paciente…" showSlowNotice={false} />}
          {editError && <Alert type="error">{editError}</Alert>}
          {!detailLoading && (
            <form onSubmit={handleUpdate} noValidate className="form form--spaced">
              <p className="module-muted">
                Completa aquí los datos clínicos opcionales. El nombre, el documento y el correo pertenecen al usuario y no se editan desde este perfil.
              </p>
              <div className="module-form-grid">
                <PatientClinicalFields
                  values={editValues}
                  onChange={(field, value) => {
                    setEditValues((current) => ({ ...current, [field]: value }));
                    setEditFieldErrors((current) => ({ ...current, [field]: '' }));
                  }}
                  disabled={!canEdit || editSaving}
                  errors={editFieldErrors}
                />
              </div>
              {canEdit && (
                <div className="form__actions">
                  <button type="submit" className="btn btn--primary" disabled={editSaving}>
                    {editSaving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
                    {editSaving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </form>
          )}
        </section>
      )}

      <section className="panel section">
        <div className="module-toolbar">
          <h2 className="panel__title">Directorio de pacientes</h2>
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, correo o documento"
              aria-label="Buscar pacientes"
              disabled={loading}
            />
          </label>
        </div>

        {loading && <LoadingState message="Cargando pacientes…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudo cargar el listado" />}
        {!loading && !error && patients.length === 0 && (
          <EmptyState
            icon="users"
            title={query ? 'Sin resultados' : 'Aún no hay pacientes'}
            text={query ? 'Ningún paciente coincide con tu búsqueda.' : 'Cuando registres pacientes aparecerán aquí.'}
          />
        )}
        {!loading && !error && patients.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th scope="col">Paciente</th>
                    <th scope="col">Documento</th>
                    <th scope="col">Contacto</th>
                    <th scope="col">Nacimiento</th>
                    <th scope="col">EPS</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td data-label="Paciente"><span className="cell-strong">{patientName(patient)}</span></td>
                      <td data-label="Documento">{patientDocument(patient)}</td>
                      <td data-label="Contacto">
                        <span className="cell-wrap">{patient.email || '—'}</span>
                      </td>
                      <td data-label="Nacimiento">{patient.birth_date || '—'}</td>
                      <td data-label="EPS">{patient.eps || '—'}</td>
                      <td data-label="Acciones">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => openPatient(patient)}>
                          <Icon name="eye" size={15} /> {canEdit ? 'Ver / editar' : 'Ver detalle'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination" role="navigation" aria-label="Paginación de pacientes">
              <span className="pagination__info">
                {total > 0 ? `${offset + 1}–${Math.min(offset + LIMIT, total)} de ${total}` : '0 pacientes'}
              </span>
              <div className="pagination__actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => Math.max(0, current - LIMIT))} disabled={offset === 0 || loading}>
                  Anterior
                </button>
                <span className="pagination__page">Página {page} de {pages}</span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => current + LIMIT)} disabled={offset + LIMIT >= total || loading}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

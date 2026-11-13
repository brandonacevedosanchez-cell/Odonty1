import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import {
  buildPatientUpdate,
  checkPatient,
  createPatient,
  extractPatientIdFromConflict,
  getPatient,
  hasMedicalAlerts,
  listPatients,
  updatePatient,
} from '../../services/patientsService.js';
import { ApiError, getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import {
  isMinor,
  validateBirthDate,
  validateEmail,
  validateFullName,
  validateOptionalText,
  validatePatientDocument,
  validateRequired,
} from '../../utils/validators.js';
import PatientClinicalFields, {
  DOCUMENT_TYPES,
  EpsField,
  GenderField,
  RequiredMark,
} from './PatientClinicalFields.jsx';

const LIMIT = 10;
const OPTIONAL_TEXT_LIMITS = {
  eps: 100,
  address: 255,
  guardian_full_name: 150,
  guardian_relationship: 50,
  emergency_contact_name: 150,
  allergies: 1000,
  current_medications: 1000,
  medical_conditions: 1000,
};

const EMPTY_CREATE = {
  first_name: '',
  last_name: '',
  document_type: 'CC',
  document_number: '',
  email: '',
  phone_number: '',
  birth_date: '',
  gender: '',
  eps: '',
  guardian_full_name: '',
  guardian_document_number: '',
  guardian_phone: '',
  guardian_relationship: '',
  allergies: '',
  current_medications: '',
  medical_conditions: '',
};

const EMPTY_EDIT = {
  full_name: '',
  document_type: 'CC',
  document_number: '',
  email: '',
  phone_number: '',
  birth_date: '',
  gender: '',
  blood_type: '',
  address: '',
  eps: '',
  guardian_full_name: '',
  guardian_document_number: '',
  guardian_phone: '',
  guardian_relationship: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  allergies: '',
  current_medications: '',
  medical_conditions: '',
  notes: '',
};

function patientName(patient) {
  return patient?.full_name ?? patient?.name ?? '—';
}

function patientDocument(patient) {
  return [patient?.document_type, patient?.document_number].filter(Boolean).join(' ') || '—';
}

function toEditValues(patient) {
  return Object.fromEntries(
    Object.keys(EMPTY_EDIT).map((field) => [field, patient?.[field] ?? '']),
  );
}

function guardianErrors(values, minor) {
  if (!minor) return {};
  return {
    guardian_full_name:
      validateRequired(values.guardian_full_name, 'El nombre del responsable')
      || validateOptionalText(values.guardian_full_name, OPTIONAL_TEXT_LIMITS.guardian_full_name, 'El nombre del responsable'),
    guardian_document_number: validateRequired(values.guardian_document_number, 'El documento del responsable'),
    guardian_phone: validateRequired(values.guardian_phone, 'El teléfono del responsable'),
    guardian_relationship:
      validateRequired(values.guardian_relationship, 'El parentesco')
      || validateOptionalText(values.guardian_relationship, OPTIONAL_TEXT_LIMITS.guardian_relationship, 'El parentesco'),
  };
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
  const [checkMessage, setCheckMessage] = useState(null);
  const [conflictPatientId, setConflictPatientId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editValues, setEditValues] = useState(EMPTY_EDIT);
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
  const createIsMinor = isMinor(values.birth_date);
  const editIsMinor = isMinor(editValues.birth_date);

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
      phone_number: validateRequired(values.phone_number, 'El teléfono'),
      birth_date: validateBirthDate(values.birth_date),
      gender: validateRequired(values.gender, 'El sexo'),
      eps: validateOptionalText(values.eps, OPTIONAL_TEXT_LIMITS.eps, 'La EPS'),
      guardian_full_name: validateOptionalText(
        values.guardian_full_name,
        OPTIONAL_TEXT_LIMITS.guardian_full_name,
        'El nombre del responsable',
      ),
      guardian_relationship: validateOptionalText(
        values.guardian_relationship,
        OPTIONAL_TEXT_LIMITS.guardian_relationship,
        'El parentesco',
      ),
      allergies: validateOptionalText(values.allergies, OPTIONAL_TEXT_LIMITS.allergies, 'Las alergias'),
      current_medications: validateOptionalText(
        values.current_medications,
        OPTIONAL_TEXT_LIMITS.current_medications,
        'Los medicamentos actuales',
      ),
      medical_conditions: validateOptionalText(
        values.medical_conditions,
        OPTIONAL_TEXT_LIMITS.medical_conditions,
        'Las condiciones médicas',
      ),
      ...guardianErrors(values, createIsMinor),
    };
  }, [values, fullName, createIsMinor]);

  const editErrors = useMemo(() => ({
    full_name: validateFullName(editValues.full_name),
    document_type: validateRequired(editValues.document_type, 'El tipo de documento'),
    document_number: validatePatientDocument(editValues.document_number),
    email: validateEmail(editValues.email),
    phone_number: validateRequired(editValues.phone_number, 'El teléfono'),
    birth_date: validateBirthDate(editValues.birth_date),
    gender: validateRequired(editValues.gender, 'El sexo'),
    eps: validateOptionalText(editValues.eps, OPTIONAL_TEXT_LIMITS.eps, 'La EPS'),
    address: validateOptionalText(editValues.address, OPTIONAL_TEXT_LIMITS.address, 'La dirección'),
    guardian_full_name: validateOptionalText(
      editValues.guardian_full_name,
      OPTIONAL_TEXT_LIMITS.guardian_full_name,
      'El nombre del responsable',
    ),
    guardian_relationship: validateOptionalText(
      editValues.guardian_relationship,
      OPTIONAL_TEXT_LIMITS.guardian_relationship,
      'El parentesco',
    ),
    emergency_contact_name: validateOptionalText(
      editValues.emergency_contact_name,
      OPTIONAL_TEXT_LIMITS.emergency_contact_name,
      'El nombre del contacto de emergencia',
    ),
    allergies: validateOptionalText(editValues.allergies, OPTIONAL_TEXT_LIMITS.allergies, 'Las alergias'),
    current_medications: validateOptionalText(
      editValues.current_medications,
      OPTIONAL_TEXT_LIMITS.current_medications,
      'Los medicamentos actuales',
    ),
    medical_conditions: validateOptionalText(
      editValues.medical_conditions,
      OPTIONAL_TEXT_LIMITS.medical_conditions,
      'Las condiciones médicas',
    ),
    ...guardianErrors(editValues, editIsMinor),
  }), [editValues, editIsMinor]);

  const showError = (field) => serverErrors[field] || (touched[field] || touched.all ? errors[field] : '');
  const showEditError = (field) => editFieldErrors[field] || editErrors[field];

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setCheck(null);
    setCheckMessage(null);
    setConflictPatientId(null);
    setFormError('');
  };
  const update = (field) => (event) => {
    const value = field === 'document_number'
      ? event.target.value.replace(/\D/g, '').slice(0, 10)
      : event.target.value;
    updateField(field, value);
  };
  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  function openCreate() {
    setValues(EMPTY_CREATE);
    setTouched({});
    setServerErrors({});
    setFormError('');
    setCheck(null);
    setCheckMessage(null);
    setConflictPatientId(null);
    setFormOpen(true);
  }

  async function verifyExisting({ silent = false } = {}) {
    if (checking) return null;
    const documentError = validatePatientDocument(values.document_number);
    if (documentError) {
      if (!silent) setFormError('Ingresa un número de documento válido para verificar si el paciente ya existe.');
      return null;
    }
    setChecking(true);
    setFormError('');
    setCheckMessage(null);
    try {
      const result = await checkPatient({
        documentType: values.document_type || 'CC',
        documentNumber: values.document_number.trim(),
      });
      setCheck(result ?? null);
      if (result?.exists) {
        setCheckMessage({
          type: 'info',
          text: 'Este paciente ya está registrado en tu clínica.',
        });
      } else if (!silent) {
        setCheckMessage({
          type: 'info',
          text: 'No encontramos un paciente con ese documento en tu clínica. Puedes registrarlo.',
        });
      }
      return result;
    } catch (checkError) {
      setCheck(null);
      setCheckMessage({
        type: 'info',
        text: `No pudimos verificar el documento (${getErrorMessage(checkError)}). Puedes guardar: si ya existe, la API responderá con el conflicto.`,
      });
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
    setConflictPatientId(null);
    if (Object.values(errors).some(Boolean)) return;

    setSaving(true);
    try {
      // La verificación es informativa: un fallo de red no bloquea el alta.
      let existing = check;
      if (!existing) {
        try {
          existing = await checkPatient({
            documentType: values.document_type || 'CC',
            documentNumber: values.document_number.trim(),
          });
          setCheck(existing);
        } catch (checkError) {
          if (!(checkError instanceof ApiError) || checkError.status !== 0) throw checkError;
          existing = null;
        }
      }

      if (existing?.exists) {
        setCheckMessage({
          type: 'info',
          text: 'Este paciente ya está registrado en tu clínica.',
        });
        return;
      }

      await createPatient({
        full_name: fullName,
        email: values.email.trim(),
        document_number: values.document_number.trim(),
        phone_number: values.phone_number.trim(),
        document_type: values.document_type,
        birth_date: values.birth_date,
        gender: values.gender,
        eps: values.eps || undefined,
        allergies: values.allergies || undefined,
        current_medications: values.current_medications || undefined,
        medical_conditions: values.medical_conditions || undefined,
        ...(createIsMinor
          ? {
              guardian_full_name: values.guardian_full_name.trim(),
              guardian_document_number: values.guardian_document_number.trim(),
              guardian_phone: values.guardian_phone.trim(),
              guardian_relationship: values.guardian_relationship.trim(),
            }
          : {}),
      });

      toast.success('Paciente registrado correctamente.');
      setFormOpen(false);
      setOffset(0);
      reload();
    } catch (createError) {
      if (createError instanceof ApiError && (createError.status === 422 || createError.status === 400)) {
        const fieldErrors = getFieldErrors(createError);
        if (fieldErrors.full_name) {
          fieldErrors.first_name = fieldErrors.full_name;
          delete fieldErrors.full_name;
        }
        setServerErrors(fieldErrors);
        setFormError(Object.keys(fieldErrors).length ? '' : getErrorMessage(createError));
      } else if (createError instanceof ApiError && createError.status === 409) {
        const message = getErrorMessage(createError);
        setServerErrors({ document_number: message });
        setConflictPatientId(extractPatientIdFromConflict(message));
        setFormError(message);
      } else {
        setFormError(getErrorMessage(createError));
      }
    } finally {
      setSaving(false);
    }
  }

  async function openPatient(patient) {
    setSelected(patient);
    setEditValues(toEditValues(patient));
    setEditError('');
    setEditFieldErrors({});
    setDetailLoading(true);
    try {
      const detail = await getPatient(patient.id);
      if (detail) {
        setSelected(detail);
        setEditValues(toEditValues(detail));
      }
    } catch (detailError) {
      setEditError(getErrorMessage(detailError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function goToPatient(patientId) {
    if (!patientId) return;
    setFormOpen(false);
    setCheckMessage(null);
    setConflictPatientId(null);
    const found = patients.find((patient) => patient.id === patientId);
    await openPatient(found ?? { id: patientId });
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!selected || editSaving) return;
    setEditError('');
    setEditFieldErrors({});
    if (Object.values(editErrors).some(Boolean)) return;
    const changes = buildPatientUpdate(selected, editValues);
    if (Object.keys(changes).length === 0) {
      toast.info('No hay cambios por guardar.');
      return;
    }
    setEditSaving(true);
    try {
      const updated = await updatePatient(selected.id, changes);
      toast.success('Datos del paciente actualizados.');
      const next = updated && typeof updated === 'object' ? updated : { ...selected, ...editValues };
      setSelected(next);
      setEditValues(toEditValues(next));
      reload({ silent: true });
    } catch (updateError) {
      const fieldErrors = getFieldErrors(updateError);
      setEditFieldErrors(fieldErrors);
      setEditError(Object.keys(fieldErrors).length ? '' : getErrorMessage(updateError));
    } finally {
      setEditSaving(false);
    }
  }

  const updateEdit = (field, value) => {
    const nextValue = field === 'document_number'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;
    setEditValues((current) => ({ ...current, [field]: nextValue }));
    setEditFieldErrors((current) => ({ ...current, [field]: '' }));
  };
  const editInput = (field) => ({
    value: editValues[field] ?? '',
    onChange: (event) => updateEdit(field, event.target.value),
    disabled: !canEdit || editSaving,
  });

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Consulta, registra y actualiza la información clínica de los pacientes de tu clínica."
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
                Registro rápido. Los datos opcionales se completan después desde la ficha del paciente.
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cerrar formulario
            </button>
          </div>

          <form onSubmit={handleCreate} noValidate className="form form--spaced">
            {formError && (
              <Alert type="error">
                {formError}
                {conflictPatientId && (
                  <>
                    {' '}
                    <button type="button" className="link-button" onClick={() => goToPatient(conflictPatientId)}>
                      Ir a su ficha
                    </button>
                  </>
                )}
              </Alert>
            )}
            {!saving && !formError && checkMessage && (
              <Alert type={checkMessage.type}>
                {checkMessage.text}
                {check?.exists && check.patient_id && (
                  <>
                    {' '}
                    <button type="button" className="link-button" onClick={() => goToPatient(check.patient_id)}>
                      Ir a su ficha
                    </button>
                  </>
                )}
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
                  maxLength={255}
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
                <span className="field__label">Fecha de nacimiento <RequiredMark /></span>
                <input
                  className="input"
                  type="date"
                  value={values.birth_date}
                  onChange={update('birth_date')}
                  onBlur={blur('birth_date')}
                  disabled={saving}
                  required
                />
                {showError('birth_date') && <p className="field__error">{showError('birth_date')}</p>}
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

            {createIsMinor && (
              <>
                <div className="module-muted form-group-title">
                  <Icon name="users" size={15} /> Datos del responsable (obligatorios para menores de edad)
                </div>
                <div className="module-form-grid">
                  <label className="field">
                    <span className="field__label">Nombre del responsable <RequiredMark /></span>
                    <input className="input" maxLength={150} required {...{ value: values.guardian_full_name, onChange: update('guardian_full_name'), disabled: saving }} />
                    {showError('guardian_full_name') && <p className="field__error">{showError('guardian_full_name')}</p>}
                  </label>
                  <label className="field">
                    <span className="field__label">Documento del responsable <RequiredMark /></span>
                    <input className="input" required {...{ value: values.guardian_document_number, onChange: update('guardian_document_number'), disabled: saving }} />
                    {showError('guardian_document_number') && <p className="field__error">{showError('guardian_document_number')}</p>}
                  </label>
                  <label className="field">
                    <span className="field__label">Teléfono del responsable <RequiredMark /></span>
                    <input className="input" type="tel" required {...{ value: values.guardian_phone, onChange: update('guardian_phone'), disabled: saving }} />
                    {showError('guardian_phone') && <p className="field__error">{showError('guardian_phone')}</p>}
                  </label>
                  <label className="field">
                    <span className="field__label">Parentesco <RequiredMark /></span>
                    <input className="input" maxLength={50} required {...{ value: values.guardian_relationship, onChange: update('guardian_relationship'), disabled: saving }} />
                    {showError('guardian_relationship') && <p className="field__error">{showError('guardian_relationship')}</p>}
                  </label>
                </div>
              </>
            )}

            <details className="form-collapsible section">
              <summary>
                <Icon name="alert-circle" size={16} /> Alertas médicas (opcional)
              </summary>
              <div className="module-form-grid form-collapsible__body">
                {[
                  ['allergies', 'Alergias'],
                  ['current_medications', 'Medicamentos actuales'],
                  ['medical_conditions', 'Condiciones médicas'],
                ].map(([field, label]) => (
                  <label className="field module-form-grid__wide" key={field}>
                    <span className="field__label">{label}</span>
                    <textarea
                      className="input module-textarea"
                      value={values[field]}
                      onChange={update(field)}
                      disabled={saving}
                      maxLength={1000}
                      placeholder="Opcional"
                    />
                    <span className="field__hint">Máximo 1000 caracteres.</span>
                    {showError(field) && <p className="field__error">{showError(field)}</p>}
                  </label>
                ))}
              </div>
            </details>

            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={() => verifyExisting()} disabled={saving || checking}>
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
              <p className="module-muted">
                Documento {patientDocument(selected)} · {selected.email || 'Sin correo'} · {selected.phone_number || 'Sin teléfono'}
                {selected.is_minor && <span className="badge badge--warning patient-minor-badge">Menor de edad</span>}
                {hasMedicalAlerts(selected) && <span className="badge badge--warning patient-minor-badge">Con alertas médicas</span>}
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>Cerrar ficha</button>
          </div>
          {detailLoading && <LoadingState message="Cargando detalle del paciente…" showSlowNotice={false} />}
          {editError && <Alert type="error">{editError}</Alert>}
          {!detailLoading && (
            <form onSubmit={handleUpdate} noValidate className="form form--spaced">
              <p className="module-muted">
                La edición es parcial: solo se envían los campos que cambian. Los campos marcados con <RequiredMark /> son obligatorios.
              </p>

              <div className="module-form-grid">
                <label className="field module-form-grid__wide">
                  <span className="field__label">Nombre completo <RequiredMark /></span>
                  <input className="input" maxLength={150} required {...editInput('full_name')} />
                  {showEditError('full_name') && <p className="field__error">{showEditError('full_name')}</p>}
                </label>
                <label className="field">
                  <span className="field__label">Tipo de documento <RequiredMark /></span>
                  <select className="input" required {...editInput('document_type')}>
                    {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  {showEditError('document_type') && <p className="field__error">{showEditError('document_type')}</p>}
                </label>
                <label className="field">
                  <span className="field__label">Número de documento <RequiredMark /></span>
                  <input className="input" inputMode="numeric" maxLength={10} required {...editInput('document_number')} />
                  {showEditError('document_number') && <p className="field__error">{showEditError('document_number')}</p>}
                </label>
                <label className="field">
                  <span className="field__label">Correo electrónico <RequiredMark /></span>
                  <input className="input" type="email" maxLength={255} required {...editInput('email')} />
                  {showEditError('email') && <p className="field__error">{showEditError('email')}</p>}
                </label>
                <label className="field">
                  <span className="field__label">Teléfono <RequiredMark /></span>
                  <input className="input" type="tel" required {...editInput('phone_number')} />
                  {showEditError('phone_number') && <p className="field__error">{showEditError('phone_number')}</p>}
                </label>

                <PatientClinicalFields
                  values={editValues}
                  onChange={updateEdit}
                  disabled={!canEdit || editSaving}
                  errors={Object.fromEntries(
                    Object.entries(editErrors).filter(([, message]) => message),
                  )}
                  requireBirthDate
                  requireGender
                  isMinor={editIsMinor}
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
                    <th scope="col">Alertas</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td data-label="Paciente">
                        <span className="cell-strong">{patientName(patient)}</span>
                        {patient.is_minor && <span className="badge badge--warning patient-minor-badge">Menor</span>}
                      </td>
                      <td data-label="Documento">{patientDocument(patient)}</td>
                      <td data-label="Contacto">
                        <span className="cell-wrap">{patient.email || '—'}</span>
                        <span className="cell-wrap module-muted">{patient.phone_number || '—'}</span>
                      </td>
                      <td data-label="Nacimiento">{patient.birth_date || '—'}</td>
                      <td data-label="EPS">{patient.eps || '—'}</td>
                      <td data-label="Alertas">
                        {hasMedicalAlerts(patient)
                          ? <span className="badge badge--warning">Sí</span>
                          : <span className="module-muted">—</span>}
                      </td>
                      <td data-label="Acciones">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => openPatient(patient)}>
                          <Icon name="eye" size={15} /> {canEdit ? 'Ver / editar' : 'Ver ficha'}
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

import Icon from '../../components/Icon.jsx';
import { FieldError } from '../../components/FormField.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import {
  PATIENT_ALERT_MAX_LENGTH,
  PATIENT_BLOOD_TYPES,
  PATIENT_DOCUMENT_TYPES,
  PATIENT_GENDERS,
} from '../../constants/apiValues.js';
import { EPS_SELECT_OPTIONS } from '../../constants/eps.js';

export const DOCUMENT_TYPES = PATIENT_DOCUMENT_TYPES;
export const BLOOD_TYPES = PATIENT_BLOOD_TYPES;
export const GENDER_OPTIONS = PATIENT_GENDERS;

export function RequiredMark() {
  return <span className="field__required" aria-hidden="true">*</span>;
}

function requiredMark(required) {
  return required ? <RequiredMark /> : null;
}

/** Select obligatorio de sexo. Solo acepta Masculino o Femenino. */
export function GenderField({ value, onChange, disabled = false, error = '', required = false, id }) {
  return (
    <>
      <select
        id={id}
        className="input"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : undefined}
      >
        <option value="" disabled={required}>
          {required ? 'Selecciona una opción' : 'Sin dato'}
        </option>
        {value && !GENDER_OPTIONS.includes(value) && (
          <option value={value}>{value}</option>
        )}
        {GENDER_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <FieldError error={error} />
    </>
  );
}

/** Select con búsqueda para EPS. Incluye la opción Particular / Sin EPS. */
export function EpsField({ value, onChange, disabled = false, error = '', required = false, id }) {
  return (
    <>
      <SearchableSelect
        id={id}
        value={value ?? ''}
        onChange={onChange}
        options={EPS_SELECT_OPTIONS}
        placeholder="Selecciona una EPS"
        clearLabel="Sin especificar"
        allowEmpty
        disabled={disabled}
        required={required}
      />
      <FieldError error={error} />
    </>
  );
}

const ALERT_FIELDS = [
  ['allergies', 'Alergias'],
  ['current_medications', 'Medicamentos actuales'],
  ['medical_conditions', 'Condiciones médicas'],
];

/**
 * Campos clínicos de PatientCreateIn y PatientUpdateIn.
 * Los cuatro datos del responsable solo se muestran (y se exigen) cuando el
 * paciente es menor de edad según birth_date.
 */
export default function PatientClinicalFields({
  values,
  onChange,
  disabled = false,
  showDocumentType = false,
  showNotes = true,
  showAlerts = true,
  alertsCollapsible = false,
  requireBirthDate = false,
  requireGender = false,
  isMinor: isMinorPatient = false,
  errors = {},
}) {
  const fieldError = (name) => <FieldError error={errors[name]} />;
  const field = (name) => ({
    value: values[name] ?? '',
    onChange: (event) => onChange(name, event.target.value),
    disabled,
  });

  const alerts = (
    <>
      {ALERT_FIELDS.map(([name, label]) => (
        <label className="field module-form-grid__wide" key={name}>
          <span className="field__label">{label}</span>
          <textarea
            className="input module-textarea"
            placeholder="Opcional"
            maxLength={PATIENT_ALERT_MAX_LENGTH}
            {...field(name)}
          />
          <span className="field__hint">Máximo {PATIENT_ALERT_MAX_LENGTH} caracteres.</span>
          {fieldError(name)}
        </label>
      ))}
    </>
  );

  return (
    <>
      {showDocumentType && (
        <label className="field">
          <span className="field__label">Tipo de documento</span>
          <select className="input" {...field('document_type')}>
            {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {fieldError('document_type')}
        </label>
      )}
      <label className="field">
        <span className="field__label">Fecha de nacimiento {requiredMark(requireBirthDate)}</span>
        <input className="input" type="date" required={requireBirthDate} {...field('birth_date')} />
        {fieldError('birth_date')}
      </label>
      <label className="field">
        <span className="field__label">Sexo {requiredMark(requireGender)}</span>
        <GenderField
          value={values.gender}
          onChange={(value) => onChange('gender', value)}
          disabled={disabled}
          error={errors.gender}
          required={requireGender}
        />
      </label>
      <label className="field">
        <span className="field__label">Tipo de sangre</span>
        <select className="input" {...field('blood_type')}>
          <option value="">Sin dato</option>
          {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        {fieldError('blood_type')}
      </label>
      <div className="field">
        <span className="field__label">EPS</span>
        <EpsField
          value={values.eps}
          onChange={(value) => onChange('eps', value)}
          disabled={disabled}
          error={errors.eps}
        />
      </div>
      <label className="field module-form-grid__wide">
        <span className="field__label">Dirección</span>
        <input className="input" maxLength={255} placeholder="Opcional" {...field('address')} />
        {fieldError('address')}
      </label>

      {showAlerts && (
        alertsCollapsible ? (
          <details className="form-collapsible module-form-grid__wide">
            <summary>
              <Icon name="alert-circle" size={16} /> Alertas médicas (opcional)
            </summary>
            <div className="module-form-grid form-collapsible__body">{alerts}</div>
          </details>
        ) : (
          <>
            <div className="module-form-grid__wide module-muted form-group-title">
              <Icon name="alert-circle" size={15} /> Alertas médicas
            </div>
            {alerts}
          </>
        )
      )}

      {isMinorPatient && (
        <>
          <div className="module-form-grid__wide module-muted form-group-title">
            <Icon name="users" size={15} /> Datos del responsable (obligatorios para menores de edad)
          </div>
          <label className="field">
            <span className="field__label">Nombre del responsable <RequiredMark /></span>
            <input className="input" maxLength={150} required {...field('guardian_full_name')} />
            {fieldError('guardian_full_name')}
          </label>
          <label className="field">
            <span className="field__label">Documento del responsable <RequiredMark /></span>
            <input className="input" required {...field('guardian_document_number')} />
            {fieldError('guardian_document_number')}
          </label>
          <label className="field">
            <span className="field__label">Teléfono del responsable <RequiredMark /></span>
            <input className="input" type="tel" required {...field('guardian_phone')} />
            {fieldError('guardian_phone')}
          </label>
          <label className="field">
            <span className="field__label">Parentesco <RequiredMark /></span>
            <input className="input" maxLength={50} required {...field('guardian_relationship')} />
            {fieldError('guardian_relationship')}
          </label>
        </>
      )}

      <div className="module-form-grid__wide module-muted form-group-title">
        <Icon name="info" size={15} /> Contacto de emergencia
      </div>
      <label className="field">
        <span className="field__label">Nombre del contacto</span>
        <input className="input" maxLength={150} placeholder="Opcional" {...field('emergency_contact_name')} />
        {fieldError('emergency_contact_name')}
      </label>
      <label className="field">
        <span className="field__label">Teléfono del contacto</span>
        <input className="input" type="tel" placeholder="Opcional" {...field('emergency_contact_phone')} />
        {fieldError('emergency_contact_phone')}
      </label>

      {showNotes && (
        <label className="field module-form-grid__wide">
          <span className="field__label">Notas</span>
          <textarea className="input module-textarea" placeholder="Opcional" {...field('notes')} />
          {fieldError('notes')}
        </label>
      )}
    </>
  );
}

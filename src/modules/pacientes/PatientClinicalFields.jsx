import Icon from '../../components/Icon.jsx';
import { FieldError } from '../../components/FormField.jsx';
import { PATIENT_BLOOD_TYPES, PATIENT_DOCUMENT_TYPES } from '../../constants/apiValues.js';

export const DOCUMENT_TYPES = PATIENT_DOCUMENT_TYPES;
export const BLOOD_TYPES = PATIENT_BLOOD_TYPES;

/**
 * Campos clínicos de PatientRegisterIn, PatientCreateIn y PatientUpdateIn.
 * `patient` es el objeto de valores y `onChange(field, value)` actualiza el formulario.
 */
export default function PatientClinicalFields({
  values,
  onChange,
  disabled = false,
  showDocumentType = true,
  showNotes = true,
  errors = {},
}) {
  const fieldError = (name) => <FieldError error={errors[name]} />;
  const field = (name) => ({
    value: values[name] ?? '',
    onChange: (event) => onChange(name, event.target.value),
    disabled,
  });

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
        <span className="field__label">Fecha de nacimiento</span>
        <input className="input" type="date" {...field('birth_date')} />
        {fieldError('birth_date')}
      </label>
      <label className="field">
        <span className="field__label">Género</span>
        <input className="input" maxLength={20} placeholder="Opcional" {...field('gender')} />
        {fieldError('gender')}
      </label>
      <label className="field">
        <span className="field__label">Tipo de sangre</span>
        <select className="input" {...field('blood_type')}>
          <option value="">Sin dato</option>
          {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        {fieldError('blood_type')}
      </label>
      <label className="field">
        <span className="field__label">EPS</span>
        <input className="input" maxLength={100} placeholder="Opcional" {...field('eps')} />
        {fieldError('eps')}
      </label>
      <label className="field module-form-grid__wide">
        <span className="field__label">Dirección</span>
        <input className="input" maxLength={255} placeholder="Opcional" {...field('address')} />
        {fieldError('address')}
      </label>
      <label className="field module-form-grid__wide">
        <span className="field__label">Alergias</span>
        <textarea className="input module-textarea" placeholder="Opcional" {...field('allergies')} />
        {fieldError('allergies')}
      </label>

      <div className="module-form-grid__wide module-muted">
        <Icon name="users" size={15} /> Datos del acudiente (obligatorios si el paciente es menor de edad)
      </div>
      <label className="field">
        <span className="field__label">Nombre del acudiente</span>
        <input className="input" maxLength={150} placeholder="Opcional" {...field('guardian_full_name')} />
        {fieldError('guardian_full_name')}
      </label>
      <label className="field">
        <span className="field__label">Documento del acudiente</span>
        <input className="input" placeholder="Opcional" {...field('guardian_document_number')} />
        {fieldError('guardian_document_number')}
      </label>
      <label className="field">
        <span className="field__label">Teléfono del acudiente</span>
        <input className="input" type="tel" placeholder="Opcional" {...field('guardian_phone')} />
        {fieldError('guardian_phone')}
      </label>
      <label className="field">
        <span className="field__label">Parentesco</span>
        <input className="input" maxLength={50} placeholder="Opcional" {...field('guardian_relationship')} />
        {fieldError('guardian_relationship')}
      </label>

      <div className="module-form-grid__wide module-muted">
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

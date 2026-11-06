import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import { Alert, Spinner } from '../../components/Feedback.jsx';
import { PasswordField, TextField } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../../hooks/useSlowLoading.js';
import { ApiError, getErrorMessage } from '../../utils/errors.js';
import { calculateNitCheckDigit, hasClinicErrors, validateClinicRegistration } from './clinicValidation.js';
import { registerClinic } from './clinicService.js';

const EMPTY_VALUES = {
  clinic_name: '',
  nit: '',
  nit_dv: '',
  email: '',
  document_number: '',
  full_name: '',
  phone_number: '',
  password: '',
};
const EMPTY_FILES = { cedula_file: null, rut_file: null };
const FILE_FIELDS = [
  { name: 'cedula_file', label: 'Cédula del administrador' },
  { name: 'rut_file', label: 'RUT de la clínica' },
];

function FileField({ name, label, file, error, disabled, onChange }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`.trim()}>
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        className="input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(event) => onChange(name, event.target.files?.[0] ?? null)}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {file && !error && <p className="field__hint">Archivo seleccionado: {file.name}</p>}
      {error && <p id={`${name}-error`} className="field__error" role="alert">{error}</p>}
    </div>
  );
}

export default function RegisterClinicPage() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [files, setFiles] = useState(EMPTY_FILES);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const slow = useSlowLoading(submitting);

  const errors = useMemo(() => validateClinicRegistration(values, files), [values, files]);
  const suggestedDv = calculateNitCheckDigit(values.nit);

  const updateValue = (field) => (event) => {
    const value = ['nit', 'document_number', 'phone_number', 'nit_dv'].includes(field)
      ? event.target.value.replace(/\D/g, '')
      : event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  function updateFile(field, file) {
    setFiles((current) => ({ ...current, [field]: file }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  const showError = (field) => serverErrors[field] || ((touched[field] || touched.all) ? errors[field] : '');

  async function submit(event) {
    event?.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    setCanRetry(false);
    if (hasClinicErrors(errors)) return;

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, key === 'password' ? value : value.trim()));
    FILE_FIELDS.forEach(({ name }) => formData.append(name, files[name]));

    setSubmitting(true);
    try {
      const result = await registerClinic(formData);
      setSuccess(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(getErrorMessage(error));
        setCanRetry(error instanceof ApiError && error.status === 502);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Solicitud recibida" subtitle="El registro de tu clínica fue enviado correctamente.">
        <Alert type="success">{success.detail || 'Registro recibido.'}</Alert>
        <Alert type="info">El administrador no podrá iniciar sesión hasta que la clínica sea aprobada.</Alert>
        <Link to="/login" className="btn btn--primary btn--block">Volver al inicio de sesión</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Registrar mi clínica"
      subtitle="Completa los datos de la clínica y de su administrador."
      footer={<Link to="/login" className="link-button">Volver al inicio de sesión</Link>}
    >
      <Alert type="info">El administrador no podrá iniciar sesión hasta que la clínica sea aprobada.</Alert>
      <form onSubmit={submit} noValidate className="form form--spaced">
        {formError && (
          <Alert type="error">
            {formError}
            {canRetry && (
              <button type="button" className="link-button" onClick={() => submit()} disabled={submitting}>
                Reintentar el envío
              </button>
            )}
          </Alert>
        )}

        <h2 className="panel__title">Datos de la clínica</h2>
        <TextField
          label="Nombre de la clínica"
          value={values.clinic_name}
          onChange={updateValue('clinic_name')}
          onBlur={() => setTouched((current) => ({ ...current, clinic_name: true }))}
          error={showError('clinic_name')}
          disabled={submitting}
        />
        <div className="form__row">
          <TextField
            label="NIT"
            value={values.nit}
            onChange={updateValue('nit')}
            onBlur={() => setTouched((current) => ({ ...current, nit: true }))}
            error={showError('nit')}
            inputMode="numeric"
            disabled={submitting}
          />
          <TextField
            label="Dígito de verificación"
            value={values.nit_dv}
            onChange={updateValue('nit_dv')}
            onBlur={() => setTouched((current) => ({ ...current, nit_dv: true }))}
            error={showError('nit_dv')}
            inputMode="numeric"
            maxLength={1}
            hint={suggestedDv ? `Sugerencia según módulo 11: ${suggestedDv}. El servidor lo validará.` : 'Se calcula al ingresar un NIT numérico.'}
            disabled={submitting}
          />
        </div>
        {suggestedDv && (
          <button
            type="button"
            className="link-button clinic-dv-suggestion"
            onClick={() => {
              setValues((current) => ({ ...current, nit_dv: suggestedDv }));
              setServerErrors((current) => ({ ...current, nit_dv: '' }));
            }}
            disabled={submitting}
          >
            Usar dígito de verificación sugerido: {suggestedDv}
          </button>
        )}

        <h2 className="panel__title">Datos del administrador</h2>
        <TextField
          label="Correo electrónico"
          type="email"
          value={values.email}
          onChange={updateValue('email')}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={showError('email')}
          autoComplete="email"
          disabled={submitting}
        />
        <TextField
          label="Nombre completo"
          value={values.full_name}
          onChange={updateValue('full_name')}
          onBlur={() => setTouched((current) => ({ ...current, full_name: true }))}
          error={showError('full_name')}
          autoComplete="name"
          disabled={submitting}
        />
        <div className="form__row">
          <TextField
            label="Número de documento"
            value={values.document_number}
            onChange={updateValue('document_number')}
            onBlur={() => setTouched((current) => ({ ...current, document_number: true }))}
            error={showError('document_number')}
            inputMode="numeric"
            maxLength={10}
            disabled={submitting}
          />
          <TextField
            label="Teléfono"
            value={values.phone_number}
            onChange={updateValue('phone_number')}
            onBlur={() => setTouched((current) => ({ ...current, phone_number: true }))}
            error={showError('phone_number')}
            inputMode="numeric"
            maxLength={10}
            hint="10 dígitos, sin prefijo."
            disabled={submitting}
          />
        </div>
        <PasswordField
          label="Contraseña"
          value={values.password}
          onChange={updateValue('password')}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          error={showError('password')}
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo."
          disabled={submitting}
        />

        <h2 className="panel__title">Documentos requeridos</h2>
        {FILE_FIELDS.map(({ name, label }) => (
          <FileField
            key={name}
            name={name}
            label={label}
            file={files[name]}
            error={showError(name)}
            disabled={submitting}
            onChange={updateFile}
          />
        ))}
        <p className="field__hint">Archivos JPG, PNG o WEBP de máximo 5 MB cada uno.</p>

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : <Icon name="user-plus" size={17} />}
          {submitting ? 'Enviando solicitud…' : 'Registrar clínica'}
        </button>
        {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
      </form>
    </AuthShell>
  );
}

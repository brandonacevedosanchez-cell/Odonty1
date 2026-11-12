import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Spinner } from '../components/Feedback.jsx';
import { PasswordField, TextField } from '../components/FormField.jsx';
import Icon from '../components/Icon.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';
import { registerPatientAccount } from '../services/authService.js';
import { ApiError, getErrorMessage } from '../utils/errors.js';
import {
  hasErrors,
  normalizePhone,
  validateDocument,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../utils/validators.js';

const EMPTY = {
  full_name: '',
  email: '',
  document_number: '',
  phone_number: '',
  password: '',
  confirm: '',
};

export default function RegisterPatientPage() {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const slow = useSlowLoading(submitting);

  const errors = {
    full_name: validateFullName(values.full_name),
    email: validateEmail(values.email),
    document_number: validateDocument(values.document_number),
    phone_number: validatePhone(values.phone_number),
    password: validatePassword(values.password),
    confirm: values.confirm !== values.password ? 'Las contraseñas no coinciden.' : '',
  };
  const showError = (field) => serverErrors[field] || (touched[field] || touched.all ? errors[field] : '');

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };
  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ all: true });
    setFormError('');
    if (hasErrors(errors)) return;

    setSubmitting(true);
    try {
      await registerPatientAccount({
        fullName: values.full_name.trim(),
        email: values.email.trim(),
        documentNumber: values.document_number.trim(),
        phoneNumber: normalizePhone(values.phone_number),
        password: values.password,
      });
      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Cuenta creada" subtitle="Tu cuenta de paciente está lista.">
        <Alert type="success">
          Ya puedes iniciar sesión con tu correo y contraseña. Después podrás completar tu perfil de paciente.
        </Alert>
        <Link to="/login" className="btn btn--primary btn--block">
          Ir a iniciar sesión <Icon name="arrow-right" size={16} />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Regístrate como paciente para consultar tu información clínica.">
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <Alert type="error">{formError}</Alert>}
        <TextField
          label="Nombre completo"
          value={values.full_name}
          onChange={update('full_name')}
          onBlur={blur('full_name')}
          error={showError('full_name')}
          autoComplete="name"
          disabled={submitting}
          autoFocus
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={values.email}
          onChange={update('email')}
          onBlur={blur('email')}
          error={showError('email')}
          autoComplete="email"
          disabled={submitting}
        />
        <TextField
          label="Número de documento"
          value={values.document_number}
          onChange={update('document_number')}
          onBlur={blur('document_number')}
          error={showError('document_number')}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          disabled={submitting}
        />
        <TextField
          label="Teléfono"
          value={values.phone_number}
          onChange={update('phone_number')}
          onBlur={blur('phone_number')}
          error={showError('phone_number')}
          hint="10 dígitos, con o sin +57."
          inputMode="tel"
          autoComplete="tel"
          disabled={submitting}
        />
        <PasswordField
          label="Contraseña"
          value={values.password}
          onChange={update('password')}
          onBlur={blur('password')}
          error={showError('password')}
          hint="Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo."
          autoComplete="new-password"
          disabled={submitting}
        />
        <PasswordField
          label="Confirmar contraseña"
          value={values.confirm}
          onChange={update('confirm')}
          onBlur={blur('confirm')}
          error={showError('confirm')}
          autoComplete="new-password"
          disabled={submitting}
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting && <Spinner size={16} />}
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
        <p className="auth__register-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          <br />
          ¿Tienes una clínica? <Link to="/registro-clinica">Registrar mi clínica</Link>
        </p>
      </form>
    </AuthShell>
  );
}

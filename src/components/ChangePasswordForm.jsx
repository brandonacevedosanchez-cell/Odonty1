import { useEffect, useRef, useState } from 'react';
import { Alert, Spinner } from './Feedback.jsx';
import { PasswordField } from './FormField.jsx';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';
import { ApiError, getErrorMessage } from '../utils/errors.js';
import { hasErrors, passwordChecks, validatePassword } from '../utils/validators.js';

function validate(values) {
  return {
    current_password: values.current ? '' : 'Ingresa tu contraseña actual.',
    new_password: validatePassword(values.next),
    confirm: values.confirm !== values.next ? 'Las contraseñas no coinciden.' : values.confirm ? '' : 'Confirma la nueva contraseña.',
  };
}

/**
 * Formulario de cambio de contraseña (POST /auth/change-password).
 * Tras el 204 el backend cierra todas las sesiones: se limpia la sesión local y se llama a onSuccess.
 */
export default function ChangePasswordForm({ onSuccess, currentLabel = 'Contraseña actual' }) {
  const { updatePassword } = useAuth();
  const [values, setValues] = useState({ current: '', next: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowLoading(submitting);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const errors = validate(values);
  const showError = (field) => (touched[field] || touched.all ? serverErrors[field] || errors[field] : serverErrors[field] || '');
  const checks = passwordChecks(values.next);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setServerErrors((current) => ({ ...current, [field === 'current' ? 'current_password' : field === 'next' ? 'new_password' : field]: '' }));
  };
  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    if (hasErrors(errors)) return;

    setSubmitting(true);
    try {
      await updatePassword(values.current, values.next);
      onSuccess?.();
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        // 400: la actual es incorrecta o la nueva es igual a la actual.
        setFormError(getErrorMessage(error));
      }
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      {formError && <Alert type="error">{formError}</Alert>}

      <PasswordField
        label={currentLabel}
        value={values.current}
        onChange={update('current')}
        onBlur={blur('current')}
        error={showError('current_password')}
        autoComplete="current-password"
        disabled={submitting}
      />
      <PasswordField
        label="Nueva contraseña"
        value={values.next}
        onChange={update('next')}
        onBlur={blur('next')}
        error={showError('new_password')}
        autoComplete="new-password"
        disabled={submitting}
      />

      <ul className="checks" aria-label="Requisitos de la contraseña">
        {checks.map((check) => (
          <li key={check.id} className={check.ok ? 'checks__item checks__item--ok' : 'checks__item'}>
            <Icon name={check.ok ? 'check-circle' : 'clock'} size={15} />
            {check.label}
          </li>
        ))}
      </ul>

      <PasswordField
        label="Confirmar nueva contraseña"
        value={values.confirm}
        onChange={update('confirm')}
        onBlur={blur('confirm')}
        error={showError('confirm')}
        autoComplete="new-password"
        disabled={submitting}
      />

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting && <Spinner size={16} />}
        {submitting ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
      {slow && <p className="field__hint">{SLOW_SERVER_MESSAGE}</p>}
    </form>
  );
}

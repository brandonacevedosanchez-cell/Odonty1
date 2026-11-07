import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Spinner } from '../components/Feedback.jsx';
import { PasswordField, TextField } from '../components/FormField.jsx';
import Icon from '../components/Icon.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';
import { requestPasswordReset, resetPassword } from '../services/authService.js';
import { ApiError, getErrorMessage } from '../utils/errors.js';
import { passwordChecks, validateEmail, validateOtp, validatePassword } from '../utils/validators.js';

/**
 * Recuperación de contraseña en dos pasos:
 *  1. POST /auth/forgot-password → envía un código de 6 dígitos al correo.
 *  2. POST /auth/reset-password  → valida el código y guarda la contraseña nueva.
 * Usa el mismo cliente HTTP y los mismos validadores que el resto de la app.
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const slow = useSlowLoading(submitting);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const showError = (field, localError) => serverErrors[field] || ((touched[field] || touched.all) ? localError : '');
  const passwordServerError = serverErrors.new_password || serverErrors.password;

  async function handleRequestCode(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    setServerErrors({});
    if (validateEmail(email)) return;

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setTouched({});
      setStep(2);
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    setServerErrors({});
    if (validateOtp(code) || validatePassword(password) || confirm !== password) return;

    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword: password });
      if (mounted.current) setSuccess(true);
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  function backToRequest() {
    setStep(1);
    setCode('');
    setPassword('');
    setConfirm('');
    setTouched({});
    setServerErrors({});
    setFormError('');
  }

  if (success) {
    return (
      <AuthShell
        title="Contraseña actualizada"
        subtitle="Ya puedes iniciar sesión con tu nueva contraseña."
      >
        <Alert type="success">La contraseña se cambió correctamente. Por seguridad, inicia sesión de nuevo.</Alert>
        <Link to="/login" className="btn btn--primary btn--block">Volver al inicio de sesión</Link>
      </AuthShell>
    );
  }

  if (step === 2) {
    const checks = passwordChecks(password);
    return (
      <AuthShell
        title="Nueva contraseña"
        subtitle={`Ingresa el código enviado a ${email.trim()} y define la contraseña nueva.`}
        footer={
          <button type="button" className="link-button" onClick={backToRequest} disabled={submitting}>
            Volver a solicitar el código
          </button>
        }
      >
        <form onSubmit={handleResetPassword} noValidate className="form">
          <Alert type="info">
            Si el correo está registrado, recibirás un código de 6 dígitos. Vence en 10 minutos.
          </Alert>
          {formError && <Alert type="error">{formError}</Alert>}

          <TextField
            label="Código de verificación"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onBlur={() => setTouched((current) => ({ ...current, code: true }))}
            error={showError('code', validateOtp(code))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            disabled={submitting}
            autoFocus
          />

          <PasswordField
            label="Nueva contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordServerError || ((touched.password || touched.all) ? validatePassword(password) : '')}
            autoComplete="new-password"
            hint="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo."
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
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
            error={showError('confirm', !confirm ? 'Confirma la nueva contraseña.' : confirm !== password ? 'Las contraseñas no coinciden.' : '')}
            autoComplete="new-password"
            disabled={submitting}
          />

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting && <Spinner size={16} />}
            {submitting ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar acceso"
      subtitle="Te enviaremos un código de 6 dígitos al correo de tu cuenta."
      footer={<Link to="/login" className="link-button">Volver al inicio de sesión</Link>}
    >
      <form onSubmit={handleRequestCode} noValidate className="form">
        {formError && <Alert type="error">{formError}</Alert>}

        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={showError('email', validateEmail(email))}
          autoComplete="email"
          placeholder="nombre@correo.com"
          disabled={submitting}
          autoFocus
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting && <Spinner size={16} />}
          {submitting ? 'Enviando…' : 'Enviar código'}
        </button>
        {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
      </form>
    </AuthShell>
  );
}

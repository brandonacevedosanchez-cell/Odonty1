import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Spinner } from '../components/Feedback.jsx';
import { TextField } from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';
import { getErrorMessage } from '../utils/errors.js';
import { validateOtp } from '../utils/validators.js';

export default function MfaPage() {
  const { mfaToken, completeMfa, cancelMfa } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
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

  // Sin un mfa_token pendiente no tiene sentido esta pantalla.
  if (!mfaToken) return <Navigate to="/login" replace />;

  const codeError = touched ? validateOtp(code) : '';

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched(true);
    setFormError('');
    if (validateOtp(code)) return;

    setSubmitting(true);
    try {
      await completeMfa(code.trim());
    } catch (error) {
      if (!mounted.current) return;
      setFormError(
        error?.status === 401
          ? 'El código es inválido o la verificación venció (dura 5 minutos). Si venció, vuelve a iniciar sesión.'
          : getErrorMessage(error),
      );
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  function backToLogin() {
    cancelMfa();
    navigate('/login', { replace: true });
  }

  return (
    <AuthShell
      title="Verificación en dos pasos"
      subtitle="Ingresa el código de 6 dígitos de tu aplicación de autenticación."
      footer={
        <button type="button" className="link-button" onClick={backToLogin} disabled={submitting}>
          Volver al inicio de sesión
        </button>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <Alert type="error">{formError}</Alert>}
        <TextField
          label="Código de verificación"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onBlur={() => setTouched(true)}
          error={codeError}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          disabled={submitting}
          autoFocus
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting && <Spinner size={16} />}
          {submitting ? 'Verificando…' : 'Verificar'}
        </button>
        {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
      </form>
    </AuthShell>
  );
}

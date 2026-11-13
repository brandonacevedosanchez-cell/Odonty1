import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Spinner } from '../components/Feedback.jsx';
import { PasswordField, TextField } from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';
import { ApiError, getErrorMessage } from '../utils/errors.js';
import { validateEmail } from '../utils/validators.js';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});
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

  const emailError = touched.email || touched.all ? validateEmail(email) : '';
  const passwordError = (touched.password || touched.all) && !password ? 'Ingresa tu contraseña.' : '';

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    if (validateEmail(email) || !password) return;

    setSubmitting(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.mfaRequired) navigate('/verificar-mfa', { replace: true });
      // Sin MFA: GuestRoute redirige al interior al quedar autenticado.
    } catch (error) {
      if (!mounted.current) return;
      setFormError(error instanceof ApiError ? error.message : getErrorMessage(error));
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Inicia sesión" subtitle="Ingresa con tu correo y contraseña para acceder a Odonty.">
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <Alert type="error">{formError}</Alert>}

        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={emailError}
          autoComplete="username"
          placeholder="nombre@correo.com"
          disabled={submitting}
          autoFocus
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={passwordError}
          autoComplete="current-password"
          disabled={submitting}
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting && <Spinner size={16} />}
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
        <p className="auth__register-link">
          <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
          <br />
          ¿Tienes una clínica? <Link to="/registro-clinica">Registrar mi clínica</Link>
        </p>
      </form>
    </AuthShell>
  );
}

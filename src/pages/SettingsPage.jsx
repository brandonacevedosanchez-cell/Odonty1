import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import { Alert, Spinner } from '../components/Feedback.jsx';
import { RoleBadge, StatusBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PREVIEW_MODE } from '../config/preview.js';
import { disableMfa, enableMfa, setupMfa } from '../services/authService.js';
import { getErrorMessage } from '../utils/errors.js';
import { createQrMatrix } from '../utils/qr.js';

function Row({ label, children }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

function QrCode({ value }) {
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  if (!matrix) {
    return <Alert type="info">No se pudo generar el código QR. Usa la clave secreta para configurar la app manualmente.</Alert>;
  }
  const cells = [];
  matrix.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    });
  });
  const viewBox = `-4 -4 ${matrix.size + 8} ${matrix.size + 8}`;
  return (
    <svg className="mfa-qr" viewBox={viewBox} role="img" aria-label="Código QR para configurar la autenticación en dos pasos" shapeRendering="crispEdges">
      <rect x="-4" y="-4" width={matrix.size + 8} height={matrix.size + 8} fill="#fff" />
      <g fill="#0f172a">{cells}</g>
    </svg>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [setup, setSetup] = useState(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaAction, setMfaAction] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [copied, setCopied] = useState(false);

  const mfaEnabled = Boolean(user?.mfa_enabled ?? user?.mfa?.enabled);

  async function startSetup() {
    setMfaError('');
    setSetupLoading(true);
    try {
      const result = await setupMfa();
      const uri = result?.otpauth_uri ?? result?.otpauth_url ?? result?.uri;
      if (!result?.secret || !uri) {
        setMfaError('El servidor no devolvió el secreto ni la URI de configuración.');
        return;
      }
      setSetup({ secret: result.secret, uri });
    } catch (error) {
      setMfaError(getErrorMessage(error));
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleEnable(event) {
    event.preventDefault();
    if (mfaAction) return;
    setMfaError('');
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError('Ingresa el código de 6 dígitos que muestra tu aplicación autenticadora.');
      return;
    }
    setMfaAction('enable');
    try {
      await enableMfa(mfaCode.trim());
      toast.success('Autenticación en dos pasos activada.');
      setSetup(null);
      setMfaCode('');
      await refreshUser();
    } catch (error) {
      setMfaError(getErrorMessage(error));
    } finally {
      setMfaAction('');
    }
  }

  async function handleDisable(event) {
    event.preventDefault();
    if (mfaAction) return;
    setMfaError('');
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError('Ingresa el código de 6 dígitos que muestra tu aplicación autenticadora.');
      return;
    }
    setMfaAction('disable');
    try {
      await disableMfa(mfaCode.trim());
      toast.success('Autenticación en dos pasos desactivada.');
      setMfaCode('');
      await refreshUser();
    } catch (error) {
      setMfaError(getErrorMessage(error));
    } finally {
      setMfaAction('');
    }
  }

  async function copySecret() {
    if (!setup?.secret) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMfaError('No se pudo copiar la clave. Selecciónala manualmente.');
    }
  }

  return (
    <>
      <PageHeader title="Configuración de la cuenta" description="Consulta tus datos, actualiza tu contraseña y protege tu cuenta con MFA." />

      <div className="grid grid--two">
        <section className="panel">
          <h2 className="panel__title">Mis datos</h2>
          <dl className="details">
            <Row label="Nombre completo">{user?.full_name}</Row>
            <Row label="Correo electrónico">{user?.email}</Row>
            <Row label="Documento">{user?.document_number}</Row>
            <Row label="Teléfono">{user?.phone_number}</Row>
            <Row label="Rol">
              <RoleBadge role={user?.role_name} />
            </Row>
            <Row label="Estado de la cuenta">
              <StatusBadge active={user?.is_active} />
            </Row>
            <Row label="Autenticación en dos pasos">
              <span className={`badge ${mfaEnabled ? 'badge--success' : 'badge--neutral'}`}>
                {mfaEnabled ? 'Activa' : 'No configurada'}
              </span>
            </Row>
          </dl>
          <p className="field__hint">Si necesitas cambiar tus datos de contacto, solicítalo al administrador de tu clínica.</p>
        </section>

        <section className="panel">
          <h2 className="panel__title">Cambiar contraseña</h2>
          {PREVIEW_MODE ? (
            <Alert type="info">El cambio de contraseña no está disponible en la vista previa de solo lectura.</Alert>
          ) : (
            <>
              <Alert type="info">Al cambiar tu contraseña se cerrarán todas tus sesiones y deberás iniciar sesión de nuevo.</Alert>
              <ChangePasswordForm
                onSuccess={() => {
                  toast.success('Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.');
                  navigate('/login', { replace: true });
                }}
              />
            </>
          )}
        </section>
      </div>

      <section className="panel section" aria-labelledby="mfa-heading">
        <div className="module-section-heading">
          <div>
            <h2 className="panel__title" id="mfa-heading">Autenticación en dos pasos (MFA)</h2>
            <p className="module-muted">
              Usa una aplicación autenticadora (Google Authenticator, Authy, 1Password) para generar códigos de 6 dígitos.
            </p>
          </div>
          <span className={`badge ${mfaEnabled ? 'badge--success' : 'badge--warning'}`}>
            {mfaEnabled ? 'Activa' : 'Recomendada'}
          </span>
        </div>

        {PREVIEW_MODE ? (
          <Alert type="info">La configuración de MFA no está disponible en la vista previa de solo lectura.</Alert>
        ) : (
          <>
            {mfaError && <Alert type="error">{mfaError}</Alert>}

            {!mfaEnabled && !setup && (
              <div className="mfa-panel">
                <p className="module-muted">Aún no tienes un segundo factor. Actívalo para proteger el acceso a la información clínica.</p>
                <button type="button" className="btn btn--primary" onClick={startSetup} disabled={setupLoading}>
                  {setupLoading ? <Spinner size={16} /> : <IconShield />}
                  {setupLoading ? 'Generando secreto…' : 'Configurar MFA'}
                </button>
              </div>
            )}

            {setup && (
              <div className="mfa-setup">
                <QrCode value={setup.uri} />
                <div className="mfa-setup__info">
                  <h3>1. Escanea el código</h3>
                  <p className="module-muted">Abre tu app autenticadora y escanea el QR. Si no puedes escanearlo, usa esta clave:</p>
                  <div className="mfa-secret">
                    <code>{setup.secret}</code>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={copySecret}>
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="field__hint">El secreto es personal. No lo compartas con nadie. TODO: confirmar el nombre exacto de la URI en el contrato.</p>
                  <form onSubmit={handleEnable} className="form">
                    <label className="field">
                      <span className="field__label">2. Escribe el código de 6 dígitos</span>
                      <input
                        className="input mfa-code"
                        inputMode="numeric"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ''))}
                        disabled={mfaAction !== ''}
                        autoComplete="one-time-code"
                      />
                    </label>
                    <div className="form__actions">
                      <button type="button" className="btn btn--secondary" onClick={() => { setSetup(null); setMfaCode(''); }} disabled={mfaAction !== ''}>Cancelar</button>
                      <button type="submit" className="btn btn--primary" disabled={mfaAction !== ''}>
                        {mfaAction === 'enable' && <Spinner size={16} />}
                        {mfaAction === 'enable' ? 'Activando…' : 'Activar MFA'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {mfaEnabled && (
              <form onSubmit={handleDisable} className="form mfa-disable">
                <Alert type="info">
                  Desactivar MFA reduce la seguridad de tu cuenta. Confirma con un código válido de tu aplicación autenticadora.
                </Alert>
                <label className="field">
                  <span className="field__label">Código de 6 dígitos</span>
                  <input
                    className="input mfa-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ''))}
                    disabled={mfaAction !== ''}
                    autoComplete="one-time-code"
                  />
                </label>
                <button type="submit" className="btn btn--secondary" disabled={mfaAction !== ''}>
                  {mfaAction === 'disable' && <Spinner size={16} />}
                  {mfaAction === 'disable' ? 'Desactivando…' : 'Desactivar MFA'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </>
  );
}

function IconShield() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

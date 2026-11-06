import { useNavigate } from 'react-router-dom';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import { Alert } from '../components/Feedback.jsx';
import { RoleBadge, StatusBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PREVIEW_MODE } from '../config/preview.js';

function Row({ label, children }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Configuración de la cuenta" description="Consulta tus datos y actualiza tu contraseña." />

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
          </dl>
          <p className="field__hint">Estos datos son de solo lectura: el backend aún no permite editarlos.</p>
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
          <p className="field__hint">La configuración de la autenticación en dos pasos estará disponible próximamente.</p>
        </section>
      </div>
    </>
  );
}
